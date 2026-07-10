// _firestore.js — shared helpers for Firestore REST API access.
//
// All tools/*.js scripts use this library. Centralises:
//   - Project/endpoint config
//   - Typed-value JSON conversion (plain JS <-> Firestore wire format)
//   - HTTP fetch wrappers
//
// No external dependencies. Node 18+ for built-in fetch.

const PROJECT_ID = 'artem-grammar-hub';
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const PLAYERS = ['artem', 'anna', 'nicole', 'nicole_ru', 'ernest', 'ernest_ru', 'egor'];

// ---------- Typed-value conversion ----------

/**
 * Convert a plain JS value to Firestore typed-value JSON.
 * Integers get integerValue (as string), floats get doubleValue.
 * Date objects get timestampValue. Arrays and objects recurse.
 */
function toFirestoreValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') {
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  }
  if (typeof v === 'string') return { stringValue: v };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFirestoreValue) } };
  if (typeof v === 'object') {
    const fields = {};
    for (const [k, val] of Object.entries(v)) {
      if (val === undefined) continue;
      fields[k] = toFirestoreValue(val);
    }
    return { mapValue: { fields } };
  }
  throw new Error(`Cannot convert ${typeof v} to Firestore value`);
}

/** Convert Firestore typed-value JSON to plain JS. Inverse of toFirestoreValue. */
function fromFirestoreValue(v) {
  if (v == null || 'nullValue' in v) return null;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('stringValue' in v) return v.stringValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fromFirestoreValue);
  if ('mapValue' in v) {
    const out = {};
    for (const [k, val] of Object.entries(v.mapValue.fields || {})) {
      out[k] = fromFirestoreValue(val);
    }
    return out;
  }
  return null;
}

/** Convert a Firestore document (with .fields) to a plain JS object. */
function docToPlain(doc) {
  if (!doc || !doc.fields) return null;
  const out = {};
  for (const [k, v] of Object.entries(doc.fields)) {
    out[k] = fromFirestoreValue(v);
  }
  return out;
}

// ---------- HTTP wrappers ----------

async function fsGet(path) {
  const url = `${FS_BASE}/${path}`;
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET ${path}: HTTP ${res.status} ${await res.text()}`);
  return res.json();
}

/**
 * PATCH a document with field-level merge using updateMask.
 * fieldPaths: array of dotted paths to update (e.g. ['coach_notes.weak_patterns', 'streak'])
 * patch: plain JS object containing only the field values being set
 */
async function fsPatch(path, fieldPaths, patch) {
  const params = fieldPaths.map(p => `updateMask.fieldPaths=${encodeURIComponent(p)}`).join('&');
  const url = `${FS_BASE}/${path}?${params}`;
  const body = JSON.stringify({ fields: toFirestoreValue(patch).mapValue.fields });
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body
  });
  if (!res.ok) throw new Error(`PATCH ${path}: HTTP ${res.status} ${await res.text()}`);
  return res.json();
}

// Player-root path: `players/{name}`. Subcollections like
// `players/{name}/exercises/{ts}` are not blocked; only the root doc.
const PLAYER_ROOT_RE = /^players\/[^/]+$/;

/**
 * Create or replace a document at path. Used for new documents in subcollections.
 *
 * Defense against cross-player contamination: refuses to fsSet on a player root
 * doc unless explicitly opted in via opts.allowPlayerReplace or the
 * ALLOW_PLAYER_REPLACE environment variable. The 2026-05-02 Nicole incident
 * was a full-document replace; making that path opt-in catches it for any
 * future tools script.
 */
async function fsSet(path, data, opts = {}) {
  if (PLAYER_ROOT_RE.test(path) && !opts.allowPlayerReplace && !process.env.ALLOW_PLAYER_REPLACE) {
    throw new Error(
      `Refusing fsSet on '${path}' — full-document replace on a player root doc is the cross-player contamination vector.\n` +
      `Use fsPatch with specific updateMask field paths for incremental updates.\n` +
      `If this is an intentional restore (e.g. from a backup snapshot), pass\n` +
      `  fsSet(path, data, { allowPlayerReplace: true })\n` +
      `or run with ALLOW_PLAYER_REPLACE=1 in the environment.`
    );
  }
  const url = `${FS_BASE}/${path}`;
  const body = JSON.stringify({ fields: toFirestoreValue(data).mapValue.fields });
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body
  });
  if (!res.ok) throw new Error(`SET ${path}: HTTP ${res.status} ${await res.text()}`);
  return res.json();
}

/** List documents in a collection. Returns array of plain-JS docs with _id field. */
async function fsList(collectionPath, options = {}) {
  const { pageSize = 100, orderBy } = options;
  const params = new URLSearchParams();
  if (pageSize) params.set('pageSize', String(pageSize));
  if (orderBy) params.set('orderBy', orderBy);
  const url = `${FS_BASE}/${collectionPath}?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`LIST ${collectionPath}: HTTP ${res.status} ${await res.text()}`);
  const json = await res.json();
  return (json.documents || []).map(d => {
    const obj = docToPlain(d);
    obj._id = d.name.split('/').pop();
    return obj;
  });
}

/**
 * Idempotent first-of-day streak bump on a player root doc. Mirror of
 * `bumpDailyStreak(DB)` in index.html — any practice surface (Quiz, Coach,
 * CC log scripts) credits the same unified daily streak. See
 * `references/design-decisions.md` for the rationale (Option D).
 *
 * Reads the current `lastPlayedDate` / `currentStreak` / `longestStreak`,
 * applies the same yesterday-or-reset rule the PWA uses, and PATCHes only
 * those three fields. No-op when `lastPlayedDate` already matches today (UTC).
 *
 * Returns true if a write was performed, false if it was a no-op.
 */
async function bumpDailyStreakRemote(player) {
  const path = `players/${player}`;
  const doc = await fsGet(path);
  const cur = doc ? docToPlain(doc) : {};
  const today = new Date().toISOString().slice(0, 10);
  if (cur.lastPlayedDate === today) return false;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const nextStreak = (cur.lastPlayedDate === yesterday) ? ((cur.currentStreak || 0) + 1) : 1;
  const longest = Math.max(cur.longestStreak || 0, nextStreak);
  await fsPatch(path, ['lastPlayedDate', 'currentStreak', 'longestStreak'], {
    lastPlayedDate: today,
    currentStreak: nextStreak,
    longestStreak: longest,
  });
  return true;
}

/**
 * Pure aggregation helper. Given an exercise doc from `players/{name}/exercises/{ts}`,
 * returns the deltas to apply to the player root doc's `qStats / catStats / lvlStats /
 * totalAnswered / totalCorrect`, plus a `next_through` value the caller stores in the
 * player doc's `aggregated_exercises` map so re-runs don't double-count.
 *
 * Idempotency lives on the **player root doc**, not the exercise doc — Firestore rules
 * mark the `exercises` subcollection as write-once (`allow update: if false`), so we
 * can't stamp markers on individual exercise rows. The map shape:
 *
 *   players/{name}.aggregated_exercises = { "<exerciseId>": <items_through_count> }
 *
 * For rich rows (items[]): `<items_through_count>` = number of items folded so far.
 *   Re-runs fold items[through..end] and update the map to items.length.
 * For sparse rows (no items[]): we use the sentinel value `-1` to mean
 *   "session-level totals folded once, never again".
 *
 * Per-item rules:
 *   - lvlStats[level] += 1; totals += 1; if item.exercise_id → qStats[id] += 1.
 *   - catStats: only the *primary* category (`exercise.categories[0]`) gets the +1,
 *     so per-cat seen sums stay aligned with totals (matches the quiz invariant where
 *     each question has one cat).
 *   - Sparse rows with multiple categories: catStats skipped.
 *   - Items missing a boolean `correct` field: skipped silently.
 *
 * Returns: { delta, next_through, applied }
 *   delta:        { qStats, catStats, lvlStats, totalAnswered, totalCorrect }
 *   next_through: int — value to store in the aggregated_exercises map (or -1 sentinel)
 *   applied:      number of items (or session-total) folded this call. 0 = no change.
 */
function aggregateExerciseDelta(exercise, alreadyThrough = 0) {
  const delta = { qStats: {}, catStats: {}, lvlStats: {}, totalAnswered: 0, totalCorrect: 0 };
  if (!exercise || typeof exercise !== 'object') return { delta, next_through: alreadyThrough, applied: 0 };

  const lvl = exercise.level;
  const cats = Array.isArray(exercise.categories) ? exercise.categories.filter(Boolean) : [];
  const primaryCat = cats[0] || null;
  const items = Array.isArray(exercise.items) ? exercise.items : null;

  if (items) {
    const startIdx = Number(alreadyThrough) || 0;
    let applied = 0;
    for (let i = startIdx; i < items.length; i++) {
      const it = items[i];
      if (!it || typeof it.correct !== 'boolean') continue;
      const ok = it.correct;
      delta.totalAnswered += 1;
      if (ok) delta.totalCorrect += 1;
      if (lvl) {
        delta.lvlStats[lvl] = delta.lvlStats[lvl] || { seen: 0, correct: 0 };
        delta.lvlStats[lvl].seen += 1;
        if (ok) delta.lvlStats[lvl].correct += 1;
      }
      if (it.exercise_id) {
        const id = it.exercise_id;
        delta.qStats[id] = delta.qStats[id] || { seen: 0, correct: 0, wrong: 0 };
        delta.qStats[id].seen += 1;
        if (ok) delta.qStats[id].correct += 1; else delta.qStats[id].wrong += 1;
      }
      if (primaryCat) {
        delta.catStats[primaryCat] = delta.catStats[primaryCat] || { seen: 0, correct: 0 };
        delta.catStats[primaryCat].seen += 1;
        if (ok) delta.catStats[primaryCat].correct += 1;
      }
      applied += 1;
    }
    return { delta, next_through: items.length, applied };
  }

  // Sparse legacy: session-level fold, once. Sentinel -1 means "done".
  if (alreadyThrough === -1) return { delta, next_through: -1, applied: 0 };
  const total = Number(exercise.total) || 0;
  const correct = Number(exercise.correct) || 0;
  if (total > 0) {
    delta.totalAnswered = total;
    delta.totalCorrect = correct;
    if (lvl) delta.lvlStats[lvl] = { seen: total, correct };
    if (cats.length === 1) delta.catStats[cats[0]] = { seen: total, correct };
    return { delta, next_through: -1, applied: total };
  }
  return { delta, next_through: alreadyThrough, applied: 0 };
}

/**
 * Apply an aggregation delta to a stats snapshot in place. Mirrors the merge
 * semantics of the live quiz play loop's per-question writes: incremental,
 * additive, no overwrite.
 */
function applyDeltaToStats(snap, delta) {
  snap.totalAnswered = (snap.totalAnswered || 0) + (delta.totalAnswered || 0);
  snap.totalCorrect = (snap.totalCorrect || 0) + (delta.totalCorrect || 0);
  snap.qStats = snap.qStats || {};
  for (const [id, d] of Object.entries(delta.qStats || {})) {
    const cur = snap.qStats[id] || { seen: 0, correct: 0, wrong: 0 };
    cur.seen = (cur.seen || 0) + d.seen;
    cur.correct = (cur.correct || 0) + d.correct;
    cur.wrong = (cur.wrong || 0) + (d.wrong || 0);
    snap.qStats[id] = cur;
  }
  snap.catStats = snap.catStats || {};
  for (const [cat, d] of Object.entries(delta.catStats || {})) {
    const cur = snap.catStats[cat] || { seen: 0, correct: 0 };
    cur.seen = (cur.seen || 0) + d.seen;
    cur.correct = (cur.correct || 0) + d.correct;
    snap.catStats[cat] = cur;
  }
  snap.lvlStats = snap.lvlStats || {};
  for (const [lvl, d] of Object.entries(delta.lvlStats || {})) {
    const cur = snap.lvlStats[lvl] || { seen: 0, correct: 0 };
    cur.seen = (cur.seen || 0) + d.seen;
    cur.correct = (cur.correct || 0) + d.correct;
    snap.lvlStats[lvl] = cur;
  }
  return snap;
}

module.exports = {
  PROJECT_ID,
  FS_BASE,
  PLAYERS,
  toFirestoreValue,
  fromFirestoreValue,
  docToPlain,
  fsGet,
  fsPatch,
  fsSet,
  fsList,
  bumpDailyStreakRemote,
  aggregateExerciseDelta,
  applyDeltaToStats,
};
