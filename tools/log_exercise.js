#!/usr/bin/env node
/**
 * log_exercise.js — write an exercise result to players/{name}/exercises/{ts}.
 *
 * Usage:
 *   node log_exercise.js <player> <exercise_json_path>
 *   node log_exercise.js anna ./exercise.json
 *
 *   # Or via stdin
 *   cat exercise.json | node log_exercise.js anna -
 *
 * Exercise JSON shape (matches references/deeplink-schema.md):
 *   {
 *     "exercise": "translation",
 *     "topic": "RU→EN prepositions",
 *     "level": "B2",
 *     "total": 8,
 *     "correct": 5,
 *     "date": "2026-04-29",
 *     "categories": ["Prepositions"],
 *     "error_types": ["preposition", "article"],
 *     "errors": ["arriving to → arriving at"],
 *     "chat_url": "https://claude.ai/chat/abc123",
 *     "meta": {}
 *   }
 *
 * The _player field is stripped if present (legacy compat with deeplink schema).
 *
 * Returns the document name and timestamp on success.
 */

const fs = require('fs');
const { fsSet, PLAYERS } = require('./_firestore');

const VALID_EXERCISES = [
  'translation', 'free_write', 'error_correction', 'transform',
  'dictation', 'conversation', 'article_drill', 'particle_sort'
];

function parseArgs(argv) {
  if (argv[0] === '--help' || argv[0] === '-h') return { help: true };
  return { player: argv[0], jsonPath: argv[1] };
}

async function readJsonInput(jsonPath) {
  if (!jsonPath) throw new Error('No exercise JSON provided');
  if (jsonPath === '-') {
    // Read from stdin
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  }
  return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
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

  // Strip legacy _player field
  delete exercise._player;

  // Auto-fill date if missing
  if (!exercise.date) {
    exercise.date = new Date().toISOString().slice(0, 10);
  }

  // Default empty arrays for optional list fields
  exercise.categories = exercise.categories || [];
  exercise.error_types = exercise.error_types || [];
  exercise.errors = exercise.errors || [];

  validate(exercise);

  const ts = String(Date.now());
  const path = `players/${args.player}/exercises/${ts}`;
  await fsSet(path, exercise);

  console.log(JSON.stringify({
    written: path,
    timestamp: ts,
    summary: `${exercise.correct}/${exercise.total} on ${exercise.exercise} (${exercise.topic})`
  }, null, 2));
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
