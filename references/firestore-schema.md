# Firestore Schema

The data model in Cloud Firestore. Active as of v20260428-s87.

## Project

- **Firebase project**: `artem-grammar-hub`
- **Database ID**: `(default)`
- **Region**: `eur3 (europe-west)`
- **Endpoint base**: `https://firestore.googleapis.com/v1/projects/artem-grammar-hub/databases/(default)/documents`

## Collections

### `players/{playerName}`

One document per family member. Player keys are lowercase: `artem`, `anna`, `nicole`, `ernest`, `egor`.

| Field | Type | Purpose |
|---|---|---|
| `name` | string | Display name |
| `pin` | string | 4-digit PIN |
| `emoji` | string | Avatar emoji |
| `stats` | map | Per-question stats: `{questionId: {seen, correct, lastSeen, lastWrong, consec}}` |
| `settings` | map | Per-player UI settings (level, mode, business flag) |
| `streak` | number | Current daily streak |
| `lastActive` | string | ISO date string |
| `lastExerciseDate` | string | ISO date of most recent supplementary exercise |
| `coach_notes` | map | **NEW (post-s87)** — dynamic learner observations. See `coach-notes-schema.md`. |

**Write semantics**: always use `firestore_update` (PATCH with `updateMask`), never `firestore_set` for partial updates. PUT-style replace wipes any field not in the request body — same family of bug as RTDB's PUT-vs-PATCH issue from s72.

REST URL pattern (when raw fetch is needed):
```
PATCH /v1/projects/artem-grammar-hub/databases/(default)/documents/players/{playerName}
  ?updateMask.fieldPaths=stats.{questionId}.seen
  &updateMask.fieldPaths=streak
```

---

### `players/{playerName}/exercises/{timestamp}`

Subcollection. One document per supplementary exercise session. `timestamp` is `Date.now()` as a string.

| Field | Type | Purpose |
|---|---|---|
| `exercise` | string | Type: `translation` \| `free_write` \| `error_correction` \| `transform` \| `dictation` \| `conversation` \| `article_drill` \| `particle_sort` |
| `topic` | string | Brief description |
| `level` | string | `B1` \| `B2` \| `C1` |
| `total` | number | Total items |
| `correct` | number | Correct items |
| `date` | string | YYYY-MM-DD |
| `categories` | array of strings | Exact quiz category names |
| `error_types` | array of strings | Cross-session error pattern tags |
| `errors` | array of strings | Per-item error descriptions |
| `chat_url` | string | Claude chat URL for traceability |
| `meta` | map | Optional extras |

**Why subcollection (not nested map)**: nested maps in Firestore have a 1MB document size limit. Subcollection has no such limit. Decided in s87.

**Read pattern**:
```
firestore_query("players/{playerName}/exercises", orderBy: "date desc", limit: 20)
```

---

### `exercise_active/{sessionId}`

Top-level collection. In-progress exercise sessions (Stage 1 live log).

`sessionId` format: `{playerName}_{Date.now()}_{rand4chars}` — e.g. `anna_1730000000000_abc1`.

| Field | Type | Purpose |
|---|---|---|
| `player` | string | Player key |
| `exercise` | string | Type (same enum as `exercises`) |
| `topic` | string | Brief description |
| `level` | string | B1 / B2 / C1 |
| `started_at` | string | ISO timestamp |
| `total_planned` | number | Expected item count |
| `items` | array of maps | Per-item: `{stem, given, correct, ts, note}` |
| `final` | boolean | False during session, true when complete |
| `chat_url` | string | Claude chat URL |

**Lifecycle**:
1. Create with `final: false`, empty `items` array
2. As items answered: read-modify-write to append (Firestore REST has limited array-element updateMask; full array replacement is the cleanest path)
3. On finalize: copy to `players/{name}/exercises/{ts}`, then delete the active doc

**Why top-level (not nested under players)**: simpler rule paths, easier to query "all active sessions" if a "Family is doing exercises right now" view is added later.

**Cleanup**: any active doc older than 24h is stale (session abandoned). The PWA's startup logic runs `exCleanupStale()` to delete them.

---

## Field type encoding (REST API)

Firestore REST uses typed-value JSON. Most error-prone part of REST integration.

```js
// Plain JSON
{ score: 5, name: "Artem", active: true, tags: ["a", "b"] }

// Firestore REST
{
  fields: {
    score:  { integerValue: "5" },        // ← integer as string!
    name:   { stringValue: "Artem" },
    active: { booleanValue: true },
    tags:   { arrayValue: { values: [
      { stringValue: "a" },
      { stringValue: "b" }
    ]}}
  }
}
```

| Plain | Firestore | Notes |
|---|---|---|
| `5` | `{integerValue: "5"}` | String! |
| `5.5` | `{doubleValue: 5.5}` | Number |
| `"hello"` | `{stringValue: "hello"}` | |
| `true` | `{booleanValue: true}` | |
| `null` | `{nullValue: null}` | |
| `[1, "a"]` | `{arrayValue: {values: [...]}}` | Each element typed individually |
| `{a: 1}` | `{mapValue: {fields: {a: {integerValue: "1"}}}}` | Recursive |
| Date | `{timestampValue: "2026-04-28T10:00:00Z"}` | ISO 8601 |

The PWA's `_fsValue` / `_fsFromValue` / `_fsToDoc` / `_fsFromDoc` helpers in `index.html` handle this automatically. The Firebase MCP plugin in Claude Code also handles it. Don't write Firestore REST JSON by hand.

---

## Security rules

Posture: open writes (`allow write: if true`). Same as previous RTDB. Project-ID
obscurity is the only protection.

```
service cloud.firestore {
  match /databases/{database}/documents {
    match /players/{playerName} {
      allow read, write: if true;
      match /exercises/{timestamp} {
        allow read, write: if true;
      }
    }
    match /exercise_active/{sessionId} {
      allow read, write: if true;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Roadmap item: tighten to `request.auth != null` with Anonymous Auth (Phase 2 hardening).

---

## What changed from RTDB → Firestore (s87)

| Concept | RTDB (pre-s87) | Firestore (s87+) |
|---|---|---|
| Player root | `/players/{name}` | `players/{name}` (collection/doc) |
| Exercise list | `/players/{name}/exercises/{ts}` (deep map) | `players/{name}/exercises/{ts}` (subcollection) |
| Active session | (didn't exist) | `exercise_active/{sessionId}` |
| Atomic write | PATCH at root with nested key | PATCH with `updateMask` |
| Read all exercises | `GET /players/{name}/exercises.json` | `GET /players/{name}/exercises` (paginated) |
| Bulk read all players | `GET /players.json` (truncates silently — never use) | List collection: `GET /players` (proper pagination) |
| Field types | Native JSON | Typed-value JSON wrapping required |

RTDB endpoint `artem-grammar-hub-default-rtdb.europe-west1.firebasedatabase.app` is **frozen** post-s87. Read-only via web_fetch if needed for historical comparison. Sunset planned ~2026-05-28.

---

## Naming conventions

- Collection names: lowercase plural — `players`, `exercises`, `exercise_active`
- Document IDs: lowercase snake_case for known IDs (`artem`); `Date.now()` ms as string for timestamps
- Field names: camelCase to match existing JS conventions
