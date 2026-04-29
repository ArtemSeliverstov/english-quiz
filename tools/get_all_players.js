#!/usr/bin/env node
/**
 * get_all_players.js — fetch all 5 player docs in parallel.
 *
 * Usage:
 *   node get_all_players.js                            # full data, all players
 *   node get_all_players.js --field coach_notes         # one field per player
 *   node get_all_players.js --summary                   # top-level metrics only
 *
 * Used at the start of a stats review.
 *
 * Per-player fetches are individual (NOT bulk /players.json which truncates
 * silently — see references/bug-log.md "Per-player Firestore reads").
 */

const { fsGet, docToPlain, PLAYERS } = require('./_firestore');

function parseArgs(argv) {
  const args = { field: null, summary: false };
  let i = 0;
  while (i < argv.length) {
    const a = argv[i];
    if (a === '--field' || a === '-f') {
      args.field = argv[++i];
    } else if (a === '--summary' || a === '-s') {
      args.summary = true;
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

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.error('Usage: node get_all_players.js [--field <name>] [--summary]');
    process.exit(0);
  }

  // Fetch all 5 in parallel
  const results = await Promise.all(
    PLAYERS.map(async (player) => {
      try {
        const doc = await fsGet(`players/${player}`);
        if (!doc) return [player, null];
        let data = docToPlain(doc);
        if (args.field) {
          data = args.field in data ? { [args.field]: data[args.field] } : {};
        } else if (args.summary) {
          data = summarise(data);
        }
        return [player, data];
      } catch (err) {
        return [player, { _error: err.message }];
      }
    })
  );

  const out = Object.fromEntries(results);
  console.log(JSON.stringify(out, null, 2));
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
