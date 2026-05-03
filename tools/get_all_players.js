#!/usr/bin/env node
/**
 * get_all_players.js — fetch all 5 player docs in parallel.
 *
 * Usage:
 *   node get_all_players.js                           # full data, all players
 *   node get_all_players.js --field coach_notes      # one field per player
 *   node get_all_players.js --summary                # top-level metrics only
 *   node get_all_players.js --include-subcollections # add exercises + coach_sessions
 *   node get_all_players.js -S --full-items          # include raw items[]/messages[]
 *
 * Used at the start of a stats review. Pass `--include-subcollections` (or `-S`)
 * to read Coach-tab and CC exercise activity — the player doc's `recentSessions`
 * only captures legacy quiz-tab activity.
 *
 * Per-player fetches are individual (NOT bulk /players.json which truncates
 * silently — see references/bug-log.md "Per-player Firestore reads").
 */

const { fsGet, fsList, docToPlain, PLAYERS } = require('./_firestore');

function parseArgs(argv) {
  const args = { field: null, summary: false, includeSubs: false, fullItems: false };
  let i = 0;
  while (i < argv.length) {
    const a = argv[i];
    if (a === '--field' || a === '-f') {
      args.field = argv[++i];
    } else if (a === '--summary' || a === '-s') {
      args.summary = true;
    } else if (a === '--include-subcollections' || a === '-S') {
      args.includeSubs = true;
    } else if (a === '--full-items') {
      args.fullItems = true;
    } else if (a === '--help' || a === '-h') {
      args.help = true;
    }
    i++;
  }
  return args;
}

function summarise(data) {
  return {
    name: data.name,
    streak: data.streak ?? 0,
    totalAnswered: data.totalAnswered ?? 0,
    lastActive: data.lastActive ?? null,
    lastExerciseDate: data.lastExerciseDate ?? null,
    coach_notes: data.coach_notes ? {
      weak_count: (data.coach_notes.weak_patterns || []).length,
      strong_count: (data.coach_notes.strong_patterns || []).length,
      recent_count: (data.coach_notes.recent_observations || []).length,
      last_updated: data.coach_notes.last_updated || null,
    } : null,
  };
}

function exerciseTs(ex) {
  const id = Number(ex._id);
  return Number.isFinite(id) ? new Date(id).toISOString() : null;
}

function summariseExercise(ex, full) {
  const out = {
    id: ex._id,
    ts: exerciseTs(ex),
    exercise: ex.exercise || null,
    source: ex.source || null,
    level: ex.level || null,
    correct: ex.correct ?? null,
    total: ex.total ?? null,
    planned_total: ex.planned_total ?? null,
    partial: !!ex.partial,
    topic: ex.topic || null,
    categories: ex.categories || null,
    error_types: ex.error_types || null,
    auto_suspected: ex.auto_suspected ?? null,
    tta_mean: ex.tta_stats?.mean ?? null,
  };
  if (full) {
    out.items = ex.items || null;
    out.errors = ex.errors || null;
    out.tta_stats = ex.tta_stats || null;
  }
  return out;
}

function summariseCoachSession(s, full) {
  const out = {
    id: s._id,
    mode: s.mode || null,
    created: s.created || null,
    ended: s.ended || null,
    n_messages: Array.isArray(s.messages) ? s.messages.length : 0,
    session_summary: s.session_summary || '',
    error_patterns_observed: s.error_patterns_observed || [],
    topics_covered: s.topics_covered || [],
    source: s.source || null,
  };
  if (full) out.messages = s.messages || [];
  return out;
}

async function fetchSubs(player, fullItems) {
  const [exDocs, csDocs] = await Promise.all([
    fsList(`players/${player}/exercises`, { pageSize: 300 }).catch(() => []),
    fsList(`players/${player}/coach_sessions`, { pageSize: 300 }).catch(() => []),
  ]);
  return {
    exercises: exDocs
      .map(e => summariseExercise(e, fullItems))
      .sort((a, b) => (b.ts || '').localeCompare(a.ts || '')),
    coach_sessions: csDocs
      .map(s => summariseCoachSession(s, fullItems))
      .sort((a, b) => (b.created || '').localeCompare(a.created || '')),
  };
}

async function fetchPlayer(player, args) {
  const doc = await fsGet(`players/${player}`);
  if (!doc) return null;
  let data = docToPlain(doc);

  if (args.field) {
    data = args.field in data ? { [args.field]: data[args.field] } : {};
  } else if (args.summary) {
    data = summarise(data);
  }

  if (args.includeSubs) {
    const subs = await fetchSubs(player, args.fullItems);
    if (args.summary) {
      data.exercises_count = subs.exercises.length;
      data.coach_sessions_count = subs.coach_sessions.length;
    } else {
      data.exercises = subs.exercises;
      data.coach_sessions = subs.coach_sessions;
    }
  }

  return data;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.error('Usage: node get_all_players.js [--field NAME] [--summary] [--include-subcollections] [--full-items]');
    process.exit(0);
  }

  const results = await Promise.all(
    PLAYERS.map(async (player) => {
      try {
        return [player, await fetchPlayer(player, args)];
      } catch (err) {
        return [player, { _error: err.message }];
      }
    })
  );

  console.log(JSON.stringify(Object.fromEntries(results), null, 2));
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
