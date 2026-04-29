#!/usr/bin/env node
/**
 * update_coach_notes.js — apply a patch to a player's coach_notes field.
 *
 * Usage:
 *   node update_coach_notes.js <player> <patch_json_path>
 *   cat patch.json | node update_coach_notes.js anna -
 *
 * Patch JSON shape (any subset of these keys):
 *   {
 *     "weak_patterns_add": ["preposition swap (RU L1)"],
 *     "weak_patterns_remove": ["resolved-pattern"],
 *     "strong_patterns_add": ["past simple"],
 *     "strong_patterns_remove": [],
 *     "engagement_notes": "Optimal session length 8 items.",
 *     "recent_observations_add": [
 *       {
 *         "date": "2026-04-29",
 *         "session_id": "anna_1730_abc1",
 *         "note": "Slow on transformations, fast on translations.",
 *         "author": "claude_code"
 *       }
 *     ],
 *     "stuck_questions_add": ["cv03"],
 *     "stuck_questions_remove": []
 *   }
 *
 * Behaviour:
 *   - *_add fields are appended (deduped against existing values for arrays of strings)
 *   - *_remove fields are filtered out
 *   - engagement_notes is replaced (single string)
 *   - recent_observations_add is FIFO-capped at 10 entries (oldest dropped)
 *   - last_updated and last_updated_by are auto-set
 *   - Read-modify-write: fetches current coach_notes, applies patch, writes back
 *
 * See references/coach-notes-schema.md for full schema and update protocol.
 */

const fs = require('fs');
const { fsGet, fsPatch, docToPlain, PLAYERS } = require('./_firestore');

const RECENT_OBS_CAP = 10;
const VALID_KEYS = new Set([
  'weak_patterns_add', 'weak_patterns_remove',
  'strong_patterns_add', 'strong_patterns_remove',
  'engagement_notes',
  'recent_observations_add',
  'stuck_questions_add', 'stuck_questions_remove',
]);

function parseArgs(argv) {
  if (argv[0] === '--help' || argv[0] === '-h') return { help: true };
  return { player: argv[0], jsonPath: argv[1], dryRun: argv.includes('--dry-run') };
}

async function readJsonInput(jsonPath) {
  if (jsonPath === '-') {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  }
  return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
}

function unique(arr) {
  return [...new Set(arr)];
}

function applyArrayPatch(current, addList, removeList) {
  const removeSet = new Set(removeList || []);
  const filtered = (current || []).filter(item => !removeSet.has(item));
  return unique([...filtered, ...(addList || [])]);
}

function applyObservationsPatch(current, addList) {
  const updated = [...(current || []), ...(addList || [])];
  // FIFO cap: keep most recent N
  return updated.length > RECENT_OBS_CAP
    ? updated.slice(updated.length - RECENT_OBS_CAP)
    : updated;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.player || !args.jsonPath) {
    console.error('Usage: node update_coach_notes.js <player> <patch.json | -> [--dry-run]');
    console.error(`  player: one of ${PLAYERS.join(', ')}`);
    process.exit(args.help ? 0 : 1);
  }

  if (!PLAYERS.includes(args.player)) {
    console.error(`Unknown player "${args.player}"`);
    process.exit(1);
  }

  const patch = await readJsonInput(args.jsonPath);

  // Validate patch keys
  const unknownKeys = Object.keys(patch).filter(k => !VALID_KEYS.has(k));
  if (unknownKeys.length) {
    console.error(`Unknown patch keys: ${unknownKeys.join(', ')}`);
    console.error(`Valid keys: ${[...VALID_KEYS].join(', ')}`);
    process.exit(1);
  }

  // Read current state
  const doc = await fsGet(`players/${args.player}`);
  if (!doc) {
    console.error(`Player document not found: players/${args.player}`);
    process.exit(2);
  }
  const current = docToPlain(doc).coach_notes || {
    weak_patterns: [],
    strong_patterns: [],
    engagement_notes: '',
    recent_observations: [],
    stuck_questions: [],
  };

  // Apply patch
  const updated = {
    weak_patterns: applyArrayPatch(
      current.weak_patterns,
      patch.weak_patterns_add,
      patch.weak_patterns_remove
    ),
    strong_patterns: applyArrayPatch(
      current.strong_patterns,
      patch.strong_patterns_add,
      patch.strong_patterns_remove
    ),
    engagement_notes: 'engagement_notes' in patch
      ? patch.engagement_notes
      : current.engagement_notes,
    recent_observations: applyObservationsPatch(
      current.recent_observations,
      patch.recent_observations_add
    ),
    stuck_questions: applyArrayPatch(
      current.stuck_questions,
      patch.stuck_questions_add,
      patch.stuck_questions_remove
    ),
    last_updated: new Date().toISOString(),
    last_updated_by: 'claude_code',
  };

  // Show diff
  const diff = {
    weak_patterns: { before: current.weak_patterns?.length || 0, after: updated.weak_patterns.length },
    strong_patterns: { before: current.strong_patterns?.length || 0, after: updated.strong_patterns.length },
    recent_observations: { before: current.recent_observations?.length || 0, after: updated.recent_observations.length },
    stuck_questions: { before: current.stuck_questions?.length || 0, after: updated.stuck_questions.length },
    engagement_notes_changed: 'engagement_notes' in patch &&
      patch.engagement_notes !== current.engagement_notes,
  };

  if (args.dryRun) {
    console.log(JSON.stringify({ dry_run: true, diff, would_write: updated }, null, 2));
    return;
  }

  await fsPatch(
    `players/${args.player}`,
    ['coach_notes'],
    { coach_notes: updated }
  );

  console.log(JSON.stringify({
    updated: `players/${args.player}.coach_notes`,
    diff,
  }, null, 2));
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
