#!/usr/bin/env node
/**
 * push_library.js — push pre-generated exercises from a draft JSON file
 * into Firestore at exercises_library/{type}/items/{id}, and update
 * exercises_library/_meta totals.
 *
 * Usage:
 *   node tools/push_library.js library_drafts/anna_translation_001-015.json
 *   node tools/push_library.js library_drafts/foo.json --dry-run
 *
 * Draft JSON shape:
 *   {
 *     "exercises": [
 *       { "id": "tr_anna_001", "type": "translation",
 *         "target_player": "anna", ...common + type-specific fields }
 *     ]
 *   }
 *
 * See references/phase2-coach-tab.md §6.1 for the per-type schema.
 *
 * Storage layout:
 *   exercises_library/{type}/items/{id}   — one doc per exercise
 *   exercises_library/_meta               — totals + per-player coverage
 *
 * Why 4-segment paths: Firestore requires alternating collection/document
 * segments. The spec's `exercises_library/{type}/{exercise_id}` shorthand
 * resolves to `exercises_library/{type}/items/{exercise_id}` in practice
 * — `{type}` is a parent placeholder doc, `items` is its subcollection.
 *
 * Idempotency: re-running with the same draft overwrites the same docs
 * (fsSet uses PATCH which is upsert). Meta totals are RECOMPUTED from
 * the input draft length on each push, not incremented — re-pushing the
 * same draft does NOT double-count. Counts for OTHER types are read
 * from existing _meta and preserved.
 *
 * Requires Node 18+ (built-in fetch).
 */

const fs = require('fs');
const path = require('path');
const { fsGet, fsSet, fsList, docToPlain, PLAYERS } = require('./_firestore');

const VALID_TYPES = [
  'translation', 'spelling_drill', 'article_drill', 'particle_sort',
  'error_correction', 'russian_trap'
];

const VALID_PLAYERS = [...PLAYERS, 'all'];

const COMMON_REQUIRED = [
  'id', 'type', 'target_player', 'level',
  'focus_categories', 'expected_difficulty',
  'linked_question_ids', 'tags', 'created', 'version'
];

const TYPE_REQUIRED = {
  translation: ['prompt_ru', 'correct_answers', 'common_errors', 'fallback_feedback'],
  spelling_drill: ['prompt_definition_ru', 'prompt_definition_en', 'correct', 'common_misspellings', 'example_sentence', 'fallback_feedback', 'source'],
  article_drill: ['sentence_template', 'blanks'],
  particle_sort: ['sentence', 'base_verb', 'correct_particles', 'distractor_particles', 'meaning', 'reasoning'],
  error_correction: ['incorrect_sentence', 'error_span', 'correct_replacement', 'error_type', 'reasoning'],
  russian_trap: ['prompt_ru', 'correct_answers', 'common_errors', 'fallback_feedback', 'calque_trap']
};

function parseArgs(argv) {
  const out = { dryRun: false, jsonPath: null };
  for (const a of argv) {
    if (a === '--help' || a === '-h') { out.help = true; }
    else if (a === '--dry-run') { out.dryRun = true; }
    else if (!out.jsonPath) { out.jsonPath = a; }
  }
  return out;
}

function validateExercise(ex, idx) {
  const errs = [];
  for (const f of COMMON_REQUIRED) {
    if (!(f in ex)) errs.push(`[${idx}] missing common field: ${f}`);
  }
  if (ex.type && !VALID_TYPES.includes(ex.type)) {
    errs.push(`[${idx}] invalid type "${ex.type}" (must be one of ${VALID_TYPES.join(', ')})`);
  }
  if (ex.target_player && !VALID_PLAYERS.includes(ex.target_player)) {
    errs.push(`[${idx}] invalid target_player "${ex.target_player}"`);
  }
  if (ex.type && TYPE_REQUIRED[ex.type]) {
    for (const f of TYPE_REQUIRED[ex.type]) {
      if (!(f in ex)) errs.push(`[${idx}] type ${ex.type} missing field: ${f}`);
    }
  }
  // Per §10 quality bar for translation
  if (ex.type === 'translation') {
    if (!Array.isArray(ex.correct_answers) || ex.correct_answers.length < 3) {
      errs.push(`[${idx}] translation needs ≥3 correct_answers (got ${(ex.correct_answers || []).length})`);
    }
    if (!Array.isArray(ex.common_errors) || ex.common_errors.length < 2) {
      errs.push(`[${idx}] translation needs ≥2 common_errors (got ${(ex.common_errors || []).length})`);
    }
    // Compile each regex to catch bad patterns early
    for (const ce of ex.common_errors || []) {
      try { new RegExp(ce.regex, 'i'); }
      catch (e) { errs.push(`[${idx}] bad regex in common_errors[${ce.id || '?'}]: ${e.message}`); }
    }
  }
  return errs;
}

async function readMeta() {
  const doc = await fsGet('exercises_library/_meta');
  if (!doc) return null;
  return docToPlain(doc);
}

function buildMetaUpdate(prevMeta, perTypeCounts, perPlayerTypeCounts) {
  const meta = prevMeta && typeof prevMeta === 'object' ? { ...prevMeta } : {};
  meta.total_exercises_per_type = { ...(meta.total_exercises_per_type || {}) };
  for (const [t, n] of Object.entries(perTypeCounts)) {
    meta.total_exercises_per_type[t] = n;
  }
  meta.coverage_by_player = { ...(meta.coverage_by_player || {}) };
  for (const [player, byType] of Object.entries(perPlayerTypeCounts)) {
    meta.coverage_by_player[player] = { ...(meta.coverage_by_player[player] || {}), ...byType };
  }
  meta.last_authored = new Date().toISOString();
  meta.schema_version = meta.schema_version || 1;
  return meta;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.jsonPath) {
    console.error('Usage: node tools/push_library.js <draft.json> [--dry-run]');
    process.exit(args.help ? 0 : 1);
  }

  const absPath = path.resolve(args.jsonPath);
  if (!fs.existsSync(absPath)) {
    console.error(`Draft file not found: ${absPath}`);
    process.exit(1);
  }
  const draft = JSON.parse(fs.readFileSync(absPath, 'utf8'));
  const exercises = draft.exercises;
  if (!Array.isArray(exercises) || exercises.length === 0) {
    console.error('Draft has no .exercises array or it is empty');
    process.exit(1);
  }

  // Validate
  const allErrs = [];
  const seenIds = new Set();
  exercises.forEach((ex, i) => {
    allErrs.push(...validateExercise(ex, i));
    if (ex.id) {
      if (seenIds.has(ex.id)) allErrs.push(`[${i}] duplicate id within draft: ${ex.id}`);
      seenIds.add(ex.id);
    }
  });
  if (allErrs.length) {
    console.error('Validation errors:');
    allErrs.forEach(e => console.error('  ' + e));
    process.exit(1);
  }

  // Tally per-type and per-player counts FROM THIS DRAFT (idempotent)
  const perTypeCounts = {};
  const perPlayerTypeCounts = {};
  for (const ex of exercises) {
    perTypeCounts[ex.type] = (perTypeCounts[ex.type] || 0) + 1;
    if (!perPlayerTypeCounts[ex.target_player]) perPlayerTypeCounts[ex.target_player] = {};
    perPlayerTypeCounts[ex.target_player][ex.type] =
      (perPlayerTypeCounts[ex.target_player][ex.type] || 0) + 1;
  }

  // Read existing meta — only used to preserve schema_version + non-overwritten coverage entries.
  const prevMeta = await readMeta();

  console.log(`Draft: ${path.basename(absPath)}`);
  console.log(`  Exercises: ${exercises.length}`);
  console.log(`  Types in this draft: ${Object.keys(perTypeCounts).join(', ')}`);
  console.log(`  Players in this draft: ${Object.keys(perPlayerTypeCounts).join(', ')}`);
  if (prevMeta) {
    console.log(`  Existing _meta: total per type =`, prevMeta.total_exercises_per_type || {});
  } else {
    console.log(`  No existing _meta — will create.`);
  }

  if (args.dryRun) {
    console.log('\n--dry-run set, NOT writing.');
    console.log('Would write:');
    for (const ex of exercises) {
      console.log(`  exercises_library/${ex.type}/items/${ex.id}`);
    }
    console.log(`  exercises_library/_meta (with merged counts)`);
    return;
  }

  // Write each exercise
  let written = 0;
  for (const ex of exercises) {
    const fsPath = `exercises_library/${ex.type}/items/${ex.id}`;
    await fsSet(fsPath, ex);
    written++;
    process.stdout.write(`\r  Written: ${written}/${exercises.length}`);
  }
  process.stdout.write('\n');

  // Recompute meta from authoritative on-disk state across ALL types & players.
  // This avoids the "draft overwrites prior author's totals" bug — prev impl
  // did `{...prev, ...thisDraft}` which clobbered other-author counts.
  const trueTotalPerType = {};
  const trueCoverageByPlayer = {};
  for (const t of VALID_TYPES) {
    let items;
    try {
      items = await fsList(`exercises_library/${t}/items`, { pageSize: 300 });
    } catch (e) {
      // Subcollection may not exist yet — skip silently.
      items = [];
    }
    if (items.length) {
      trueTotalPerType[t] = items.length;
      for (const it of items) {
        const p = it.target_player;
        if (!p) continue;
        if (!trueCoverageByPlayer[p]) trueCoverageByPlayer[p] = {};
        trueCoverageByPlayer[p][t] = (trueCoverageByPlayer[p][t] || 0) + 1;
      }
    }
  }
  const newMeta = buildMetaUpdate(prevMeta, trueTotalPerType, trueCoverageByPlayer);
  // buildMetaUpdate spreads coverage_by_player onto prev — but prev may carry
  // stale entries for items deleted off-disk. Replace coverage map outright.
  newMeta.coverage_by_player = trueCoverageByPlayer;
  newMeta.total_exercises_per_type = trueTotalPerType;
  await fsSet('exercises_library/_meta', newMeta);

  console.log(JSON.stringify({
    written,
    paths_root: `exercises_library/{type}/items/{id}`,
    meta_updated: 'exercises_library/_meta',
    total_per_type: newMeta.total_exercises_per_type,
    coverage_by_player: newMeta.coverage_by_player,
    last_authored: newMeta.last_authored
  }, null, 2));
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
