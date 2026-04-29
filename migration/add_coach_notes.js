#!/usr/bin/env node
/**
 * add_coach_notes.js — add empty coach_notes field to all 5 player documents.
 *
 * Idempotent: safe to re-run. If coach_notes already exists, leaves it alone.
 *
 * Usage:
 *   node add_coach_notes.js
 *
 * Auth: open writes via firestore.rules. No service account required.
 */

const PROJECT_ID = 'artem-grammar-hub';
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const PLAYERS = ['artem', 'anna', 'nicole', 'ernest', 'egor'];

// Empty coach_notes scaffold. Filled in over time during sessions.
function emptyCoachNotes() {
  return {
    weak_patterns: [],
    strong_patterns: [],
    engagement_notes: '',
    recent_observations: [],
    stuck_questions: [],
    last_updated: new Date().toISOString(),
    last_updated_by: 'manual'
  };
}

function toFirestoreValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFirestoreValue) } };
  if (typeof v === 'object') {
    const fields = {};
    for (const [k, val] of Object.entries(v)) {
      if (val === undefined) continue;
      fields[k] = toFirestoreValue(val);
    }
    return { mapValue: { fields } };
  }
  throw new Error(`Cannot convert ${typeof v}`);
}

function fromFirestoreValue(v) {
  if (v == null || 'nullValue' in v) return null;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('stringValue' in v) return v.stringValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fromFirestoreValue);
  if ('mapValue' in v) {
    const out = {};
    for (const [k, val] of Object.entries(v.mapValue.fields || {})) out[k] = fromFirestoreValue(val);
    return out;
  }
  return null;
}

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  const body = await res.text();
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}: ${body.slice(0, 300)}`);
  return body === '' ? null : JSON.parse(body);
}

async function processPlayer(name) {
  process.stdout.write(`  ${name}: `);

  // Read current doc
  const doc = await fetchJson(`${FS_BASE}/players/${name}`);
  if (!doc) {
    console.log('(no document — skipping)');
    return { status: 'skipped' };
  }

  // Check if coach_notes already exists
  const existing = doc.fields && doc.fields.coach_notes;
  if (existing) {
    const parsed = fromFirestoreValue(existing);
    if (parsed && typeof parsed === 'object' && 'weak_patterns' in parsed) {
      console.log('✓ already has coach_notes (keys: ' + Object.keys(parsed).length + ')');
      return { status: 'unchanged' };
    }
  }

  // Add empty coach_notes via PATCH with updateMask
  const url = `${FS_BASE}/players/${name}?updateMask.fieldPaths=coach_notes`;
  const body = JSON.stringify({
    fields: {
      coach_notes: toFirestoreValue(emptyCoachNotes())
    }
  });

  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body
  });

  if (!res.ok) {
    throw new Error(`PATCH failed: HTTP ${res.status} ${await res.text()}`);
  }

  console.log('✓ added empty coach_notes');
  return { status: 'added' };
}

async function main() {
  console.log(`Adding coach_notes to all players in ${PROJECT_ID}\n`);

  let added = 0, unchanged = 0, skipped = 0, errors = 0;

  for (const name of PLAYERS) {
    try {
      const r = await processPlayer(name);
      if (r.status === 'added') added++;
      else if (r.status === 'unchanged') unchanged++;
      else if (r.status === 'skipped') skipped++;
    } catch (e) {
      console.log(`✗ ERROR: ${e.message}`);
      errors++;
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Added: ${added}`);
  console.log(`Unchanged (already had): ${unchanged}`);
  console.log(`Skipped (no doc): ${skipped}`);
  console.log(`Errors: ${errors}`);

  if (errors === 0) {
    console.log('\nDone. coach_notes field active for all eligible players.');
  } else {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('\nFatal error:', e.message);
  process.exit(1);
});
