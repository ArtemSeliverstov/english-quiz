#!/usr/bin/env node
/**
 * log_exercise.js — write an exercise result to players/{name}/exercises/{ts}.
 *
 * Schema: see references/firestore-schema.md (canonical rich shape).
 *
 * Usage:
 *   node log_exercise.js <player> <exercise_json_path>
 *   cat exercise.json | node log_exercise.js anna -
 *
 * Rich shape (preferred): includes items[] with per-item detail. The script
 * computes tta_stats and auto_suspected at write time when items[] has
 * time_to_answer_ms on >= 5 items.
 *
 * Sparse legacy: items[] omitted. Accepted with a stderr warning during
 * the schema-alignment transition; readers treat absence as legacy.
 *
 * The _player field is stripped if present (legacy compat).
 */

const fs = require('fs');
const { fsSet, PLAYERS } = require('./_firestore');

const VALID_EXERCISES = [
  'translation', 'free_write', 'error_correction', 'transform',
  'dictation', 'conversation', 'article_drill', 'particle_sort'
];
const VALID_SOURCES = ['coach_tab', 'cc_session'];
const AUTO_SUSPECTED_MEAN_MS = 500;
const TTA_MIN_N = 5;

function parseArgs(argv) {
  if (argv[0] === '--help' || argv[0] === '-h') return { help: true };
  return { player: argv[0], jsonPath: argv[1] };
}

async function readJsonInput(jsonPath) {
  if (!jsonPath) throw new Error('No exercise JSON provided');
  if (jsonPath === '-') {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  }
  return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
}

function validateItem(item, idx) {
  if (typeof item !== 'object' || item === null) {
    throw new Error(`items[${idx}] must be an object`);
  }
  if (!('submitted_answer' in item)) {
    throw new Error(`items[${idx}] missing required field "submitted_answer"`);
  }
  if (typeof item.correct !== 'boolean') {
    throw new Error(`items[${idx}].correct must be boolean (got ${typeof item.correct})`);
  }
  if ('time_to_answer_ms' in item && item.time_to_answer_ms != null) {
    if (typeof item.time_to_answer_ms !== 'number' || item.time_to_answer_ms < 0) {
      throw new Error(`items[${idx}].time_to_answer_ms must be a non-negative number`);
    }
  }
  if ('exercise_id' in item && item.exercise_id != null && typeof item.exercise_id !== 'string') {
    throw new Error(`items[${idx}].exercise_id must be a string or null`);
  }
}

function computeTtaStats(items) {
  const ttas = items
    .map(it => (typeof it.time_to_answer_ms === 'number' ? it.time_to_answer_ms : null))
    .filter(v => v != null && v >= 0);
  if (ttas.length < TTA_MIN_N) return null;
  const sorted = [...ttas].sort((a, b) => a - b);
  const mean = ttas.reduce((s, v) => s + v, 0) / ttas.length;
  const median = sorted.length % 2
    ? sorted[(sorted.length - 1) / 2]
    : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
  return {
    mean: Math.round(mean),
    median: Math.round(median),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    n: ttas.length,
  };
}

function validate(exercise) {
  const required = ['exercise', 'topic', 'level', 'total', 'correct'];
  for (const field of required) {
    if (!(field in exercise)) throw new Error(`Missing required field: ${field}`);
  }
  if (!VALID_EXERCISES.includes(exercise.exercise)) {
    throw new Error(
      `Invalid exercise type "${exercise.exercise}". Must be one of: ${VALID_EXERCISES.join(', ')}\n` +
      `IMPORTANT: use canonical names — article_drill (NOT error_correction), particle_sort (NOT transform).`
    );
  }
  if (!['B1', 'B2', 'C1'].includes(exercise.level)) {
    throw new Error(`Invalid level "${exercise.level}". Must be B1, B2, or C1.`);
  }
  if (typeof exercise.total !== 'number' || typeof exercise.correct !== 'number') {
    throw new Error('total and correct must be numbers');
  }
  if (exercise.correct > exercise.total) {
    throw new Error(`correct (${exercise.correct}) cannot exceed total (${exercise.total})`);
  }
  if ('source' in exercise && !VALID_SOURCES.includes(exercise.source)) {
    throw new Error(`source must be one of ${VALID_SOURCES.join(', ')} (got "${exercise.source}")`);
  }
  if ('items' in exercise) {
    if (!Array.isArray(exercise.items)) throw new Error('items must be an array');
    exercise.items.forEach(validateItem);
    const itemCorrect = exercise.items.filter(i => i.correct === true).length;
    if (exercise.items.length !== exercise.total) {
      console.warn(
        `[log_exercise] WARNING: items.length (${exercise.items.length}) != total (${exercise.total}). ` +
        `total/correct fields are taken at face value.`
      );
    }
    if (itemCorrect !== exercise.correct) {
      console.warn(
        `[log_exercise] WARNING: items[*].correct count (${itemCorrect}) != correct (${exercise.correct}).`
      );
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.player || !args.jsonPath) {
    console.error('Usage: node log_exercise.js <player> <exercise.json | ->');
    console.error(`  player: one of ${PLAYERS.join(', ')}`);
    process.exit(args.help ? 0 : 1);
  }
  if (!PLAYERS.includes(args.player)) {
    console.error(`Unknown player "${args.player}"`);
    process.exit(1);
  }

  const exercise = await readJsonInput(args.jsonPath);
  delete exercise._player;

  if (!exercise.date) exercise.date = new Date().toISOString().slice(0, 10);
  if (!exercise.source) exercise.source = 'cc_session';
  exercise.categories = exercise.categories || [];
  exercise.error_types = exercise.error_types || [];
  exercise.errors = exercise.errors || [];

  validate(exercise);

  // Sparse-legacy warning + tta computation
  if (exercise.total > 0 && !Array.isArray(exercise.items)) {
    console.warn(
      `[log_exercise] WARNING: items[] missing on a session with total=${exercise.total}. ` +
      `Logging as sparse legacy row. Future writes should include per-item detail.`
    );
  } else if (Array.isArray(exercise.items) && exercise.items.length >= TTA_MIN_N) {
    const tta = computeTtaStats(exercise.items);
    if (tta) {
      exercise.tta_stats = tta;
      exercise.auto_suspected = tta.mean < AUTO_SUSPECTED_MEAN_MS;
    }
  }

  const ts = String(Date.now());
  const path = `players/${args.player}/exercises/${ts}`;
  await fsSet(path, exercise);

  console.log(JSON.stringify({
    written: path,
    timestamp: ts,
    summary: `${exercise.correct}/${exercise.total} on ${exercise.exercise} (${exercise.topic})`,
    rich: Array.isArray(exercise.items),
    tta_stats: exercise.tta_stats || null,
    auto_suspected: exercise.auto_suspected ?? null,
  }, null, 2));
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
