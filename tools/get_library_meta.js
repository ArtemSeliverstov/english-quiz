#!/usr/bin/env node
/**
 * get_library_meta.js — print exercises_library/_meta as decoded JSON.
 *
 * Usage:
 *   node get_library_meta.js              # full _meta doc
 *   node get_library_meta.js --coverage   # coverage_by_player only
 *   node get_library_meta.js --totals     # total_exercises_per_type only
 *
 * Used by the routing-audit skill to enumerate per-player coach drill
 * pool sizes (the value that determines coach session length, since
 * coachStartType has no sub-sampling — pool = entire targeted library).
 */

const { fsGet, docToPlain } = require('./_firestore');

(async () => {
  const args = process.argv.slice(2);
  const coverageOnly = args.includes('--coverage');
  const totalsOnly = args.includes('--totals');

  const raw = await fsGet('exercises_library/_meta');
  if (!raw) {
    console.error('exercises_library/_meta not found');
    process.exit(1);
  }
  const meta = docToPlain(raw);
  if (!meta) {
    console.error('failed to decode _meta');
    process.exit(1);
  }

  if (coverageOnly) {
    console.log(JSON.stringify(meta.coverage_by_player || {}, null, 2));
  } else if (totalsOnly) {
    console.log(JSON.stringify(meta.total_exercises_per_type || {}, null, 2));
  } else {
    console.log(JSON.stringify(meta, null, 2));
  }
})().catch(e => {
  console.error(e.message || e);
  process.exit(1);
});
