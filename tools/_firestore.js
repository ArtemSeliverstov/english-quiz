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
const PLAYERS = ['artem', 'anna', 'nicole', 'ernest', 'egor'];

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
  fsList
};
