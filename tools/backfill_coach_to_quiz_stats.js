#!/usr/bin/env node
/**
 * backfill_coach_to_quiz_stats.js — fold Coach-tab and CC exercise items
 * (subcollection `players/{name}/exercises/{ts}`) into the same player root
 * doc buckets the Quiz play loop already writes: `qStats / catStats /
 * lvlStats / totalAnswered / totalCorrect`.
 *
 * Why: Coach surfaces share the streak with Quiz (Option D, 2026-05-05) but
 * proficiency metrics derived from `lvlStats` etc. are still quiz-only.
 * Anna's recent activity is 100% Coach-tab; her CEFR estimate from quiz
 * data alone is stale. This unifies the buckets across surfaces.
 *
 * Idempotent via two markers on each exercise doc (added by `aggregateExerciseDelta`):
 *   - `aggregated_through`: int — items[] index already folded (rich rows)
 *   - `aggregated_at`: ISO — set on every successful fold (both rich and sparse)
 *
 * Re-runs are safe: rows with markers up-to-date contribute zero delta.
 *
 * Usage:
 *   node tools/backfill_coach_to_quiz_stats.js                 # all players, dry run
 *   node tools/backfill_coach_to_quiz_stats.js --apply         # actually PATCH
 *   node tools/backfill_coach_to_quiz_stats.js anna --apply    # one player
 *   node tools/backfill_coach_to_quiz_stats.js --skip nicole   # exclude
 *   node tools/backfill_coach_to_quiz_stats.js --verbose       # per-row trace
 */

const {
  fsGet, fsPatch, fsList, docToPlain, PLAYERS,
  aggregateExerciseDelta, applyDeltaToStats,
} = require('./_firestore');

function parseArgs(argv) {
  const out = { apply: false, verbose: false, players: [], skip: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--apply') out.apply = true;
    else if (a === '--verbose' || a === '-v') out.verbose = true;
    else if (a === '--skip') out.skip.push(argv[++i]);
    else if (PLAYERS.includes(a)) out.players.push(a);
  }
  if (!out.players.length) out.players = PLAYERS.slice();
  out.players = out.players.filter(p => !out.skip.includes(p));
  return out;
}

async function processOne(player, apply, verbose) {
  const docRaw = await fsGet(`players/${player}`);
  const root = docRaw ? docToPlain(docRaw) : {};
  const before = {
    totalAnswered: root.totalAnswered || 0,
    totalCorrect: root.totalCorrect || 0,
    qStats_count: Object.keys(root.qStats || {}).length,
    catStats_count: Object.keys(root.catStats || {}).length,
    lvlStats_count: Object.keys(root.lvlStats || {}).length,
  };

  // Read full exercises subcollection (with raw fields, not the projection)
  const exDocs = await fsList(`players/${player}/exercises`, { pageSize: 300 }).catch(() => []);

  // Working snapshot of player aggregates — start from existing values.
  const snap = {
    qStats: JSON.parse(JSON.stringify(root.qStats || {})),
    catStats: JSON.parse(JSON.stringify(root.catStats || {})),
    lvlStats: JSON.parse(JSON.stringify(root.lvlStats || {})),
    totalAnswered: root.totalAnswered || 0,
    totalCorrect: root.totalCorrect || 0,
  };
  // Idempotency map (lives on player root, not exercise docs — exercises is
  // write-once per firestore.rules). Keys: exercise doc id; values: items
  // through-count, or -1 for sparse-legacy session-folded.
  const aggMap = { ...(root.aggregated_exercises || {}) };

  let totalApplied = 0;
  const trace = [];

  for (const ex of exDocs) {
    const already = aggMap[ex._id];
    // For sparse rows: -1 means folded; for rich: undefined means never seen.
    const startThrough = (typeof already === 'number') ? already : 0;
    const { delta, next_through, applied } = aggregateExerciseDelta(ex, startThrough);
    if (applied <= 0) continue;
    applyDeltaToStats(snap, delta);
    aggMap[ex._id] = next_through;
    totalApplied += applied;
    if (verbose) {
      trace.push({
        ex_id: ex._id, type: ex.exercise, level: ex.level, applied,
        delta_totals: { ans: delta.totalAnswered, cor: delta.totalCorrect },
        next_through,
      });
    }
  }

  const after = {
    totalAnswered: snap.totalAnswered,
    totalCorrect: snap.totalCorrect,
    qStats_count: Object.keys(snap.qStats).length,
    catStats_count: Object.keys(snap.catStats).length,
    lvlStats_count: Object.keys(snap.lvlStats).length,
  };

  const changed = totalApplied > 0;
  const result = {
    player,
    before,
    after,
    delta: {
      totalAnswered: after.totalAnswered - before.totalAnswered,
      totalCorrect: after.totalCorrect - before.totalCorrect,
      qStats_added: after.qStats_count - before.qStats_count,
      catStats_added: after.catStats_count - before.catStats_count,
      lvlStats_added: after.lvlStats_count - before.lvlStats_count,
    },
    items_folded: totalApplied,
    aggregated_exercises_count: Object.keys(aggMap).length,
    changed,
    applied: false,
  };
  if (verbose) result.trace = trace;

  if (changed && apply) {
    // Single PATCH on the player root doc — both aggregates and the dedup map.
    const fieldPaths = [
      'qStats', 'catStats', 'lvlStats',
      'totalAnswered', 'totalCorrect',
      'aggregated_exercises',
    ];
    await fsPatch(`players/${player}`, fieldPaths, {
      qStats: snap.qStats,
      catStats: snap.catStats,
      lvlStats: snap.lvlStats,
      totalAnswered: snap.totalAnswered,
      totalCorrect: snap.totalCorrect,
      aggregated_exercises: aggMap,
    });
    result.applied = true;
  }
  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.error('Usage: node tools/backfill_coach_to_quiz_stats.js [player ...] [--apply] [--skip name] [--verbose]');
    process.exit(0);
  }
  const results = [];
  for (const p of args.players) {
    try {
      results.push(await processOne(p, args.apply, args.verbose));
    } catch (e) {
      results.push({ player: p, error: e.message, stack: e.stack });
    }
  }
  console.log(JSON.stringify({ apply: args.apply, results }, null, 2));
  if (!args.apply) console.error('\n(dry run — re-run with --apply to PATCH)');
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
