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

| Field | Type | Writer | Reader | Purpose |
|---|---|---|---|---|
| `name` | string | bootstrap | PWA, tools | Display name |
| `pin` | string | PWA (Change PIN) | PWA | 4-digit PIN |
| `emoji` | string | bootstrap | PWA | Avatar emoji |
| `qStats` | map | PWA play loop | PWA, stats-review, weak-mode selector | Per-question stats: `{qid: {seen, correct, lastSeen, lastWrong, consec, wrong}}` |
| `catStats` | map | PWA play loop | PWA, stats-review | Per-category rollup |
| `lvlStats` | map | PWA play loop | PWA, stats-review | Per-level rollup |
| `recentSessions` | array | PWA play loop | PWA, stats-review | Last 10 quiz sessions (FIFO) |
| `totalAnswered`, `totalCorrect`, `totalSessions`, `currentStreak`, `longestStreak` | number | PWA play loop | PWA stats card | Headline aggregates |
| `lastPlayedDate` | string | PWA play loop | PWA | YYYY-MM-DD of last session |
| `learning_path` | map | PWA promotion logic | PWA, learner shell | Active categories, mastery, level cap |
| `ui_shell` | string | PWA settings, bootstrap | PWA | `learner` \| `builder` |
| `coach_notes` | map | `tools/update_coach_notes.js` only | exercise-session, stats-review, free-write skills | Dynamic learner observations. See `coach-notes-schema.md`. |

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

| Field | Type | Writer | Reader | Purpose |
|---|---|---|---|---|
| `exercise` | string | Coach tab, `tools/log_exercise.js` | stats-review, history tab | Type: `translation` \| `free_write` \| `error_correction` \| `transform` \| `dictation` \| `conversation` \| `article_drill` \| `particle_sort` |
| `topic` | string | both writers | both readers | Brief description |
| `level` | string | both writers | both readers | `B1` \| `B2` \| `C1` |
| `total`, `correct` | number | both writers | both readers | Item counts |
| `date` | string | both writers | both readers | YYYY-MM-DD |
| `source` | string | both writers | stats-review | `coach_tab` \| `cc_session` |
| `partial`, `planned_total` | bool, number | Coach tab | stats-review | Set when session ended mid-pool |
| `items` | array of maps | Coach tab; `log_exercise.js` once schema-alignment Track 3 ships | stats-review, history tab | Per-item detail. Sparse pre-rich rows omit. |
| `categories`, `error_types`, `errors` | arrays | both writers | stats-review | Aggregated tags + per-item descriptions |
| `tta_stats`, `auto_suspected` | map, bool | Coach tab; CC after Track 3 | stats-review (integrity flag) | Time-to-answer aggregates and auto-play suspicion |
| `chat_url` | string | both writers (optional) | history tab | Claude chat URL for traceability |
| `meta` | map | both writers | — | Optional extras |

**Why subcollection (not nested map)**: nested maps in Firestore have a 1MB document size limit.

**Read pattern**:
```
firestore_query("players/{playerName}/exercises", orderBy: "date desc", limit: 20)
```

#### Canonical rich shape

```jsonc
{
  "exercise": "translation",
  "topic": "RU→EN prepositions",
  "level": "B2",
  "total": 8,
  "correct": 5,
  "date": "2026-04-29",
  "source": "coach_tab",          // or "cc_session"
  "partial": false,
  "planned_total": 8,

  "items": [
    {
      "exercise_id": "tr_anna_b04",   // library id, or null for CC-authored
      "submitted_answer": "I have been waiting for you...",
      "correct": true,
      "matched_pattern_id": "preposition_for_duration",
      "time_to_answer_ms": 4200,
      "exercise_version": 1,
      "escalation_used": false
    }
  ],

  "categories": ["Prepositions"],
  "error_types": ["preposition_calque"],
  "errors": ["arrived to → arrived at (item 2)"],

  "tta_stats": { "mean": 4100, "median": 3800, "min": 1200, "max": 9400, "n": 8 },
  "auto_suspected": false,

  "chat_url": "https://claude.ai/chat/abc123",
  "meta": {}
}
```

**Per-item fields** (inside `items[]`):

| Field | Required | Notes |
|---|---|---|
| `exercise_id` | yes | Library item id, or `null` for CC-authored |
| `submitted_answer` | yes | What the player typed/picked. Field name is canonical — old `?exfin=` deeplinks used `given`; not used anymore |
| `correct` | yes | Boolean |
| `matched_pattern_id` | no | When the marker fired a known pattern |
| `time_to_answer_ms` | no | Coach tab always sets it; CC may approximate from chat turn timestamps |
| `exercise_version` | no | For library items, the version of the prompt at answer time |
| `escalation_used` | no | True when the player used the "Hmm, explain more" path |

**Integrity flags**:
- `tta_stats` is computed at write time when `items[]` has timing on ≥5 items (ignored otherwise).
- `auto_suspected: true` when `tta_stats.mean < 500ms` over ≥5 items — flags suspected auto-play / answer-leak.

**Sparse legacy**: pre-Track-3 rows from `tools/log_exercise.js` may omit `items[]`, `tta_stats`, `auto_suspected`. Readers treat absence as legacy, not a violation.

---

### `players/{playerName}/coach_sessions/{sessionId}`

Subcollection. One document per Free Write / coach chat session (no per-item scores).

| Field | Type | Writer | Reader | Purpose |
|---|---|---|---|---|
| `mode` | string | Coach tab, `tools/log_coach_session.js` | stats-review, free-write skill | `free_write` \| `cc_session` \| `escalate` |
| `messages` | array | both writers | stats-review | Transcript |
| `error_patterns_observed`, `topics_covered` | arrays | both writers | stats-review | Pattern tags + topics |
| `session_summary` | string | both writers | stats-review | One-paragraph summary |
| `created`, `ended` | string | both writers | both readers | ISO timestamps |
| `source` | string | `log_coach_session.js` only | stats-review | `cc_session` distinguishes CC- from PWA-driven |

`sessionId` format: `{player}_{prefix}_{ts}_{rand}` where prefix is `fw` (free_write), `esc` (escalate), or `sess`.

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

Posture: append-only-leaning. Reads and create/update writes stay open (no auth — the PWA uses raw fetch and tools/*.js use the REST API directly), but `delete` is forbidden on player docs and all subcollections except `exercise_active`. The `exercises` subcollection is write-once.

Live rules in `firestore.rules`. Threat closed: wholesale "wipe player stats" via direct REST DELETE. Recovery path for any remaining drift: weekly Firestore backup committed by `.github/workflows/backup.yml` to the `backups` branch.

App Check is deferred — the PWA uses raw `fetch()` (no Firebase SDK), so token injection would require either bundling the SDK (chunky) or wrapping every Firestore call manually. The `tools/*.js` scripts and the GitHub Actions backup also can't produce App Check tokens. Reconsider once a worker-as-gatekeeper centralises writes.

Deploy: `cd D:/Claude/english-quiz-repo && firebase deploy --only firestore:rules`.

---

## What changed from RTDB → Firestore (s87)

| Concept | RTDB (pre-s87) | Firestore (s87+) |
|---|---|---|
| Player root | `/players/{name}` | `players/{name}` (collection/doc) |
| Exercise list | `/players/{name}/exercises/{ts}` (deep map) | `players/{name}/exercises/{ts}` (subcollection) |
| Atomic write | PATCH at root with nested key | PATCH with `updateMask` |
| Read all exercises | `GET /players/{name}/exercises.json` | `GET /players/{name}/exercises` (paginated) |
| Bulk read all players | `GET /players.json` (truncates silently — never use) | List collection: `GET /players` (proper pagination) |
| Field types | Native JSON | Typed-value JSON wrapping required |

RTDB endpoint `artem-grammar-hub-default-rtdb.europe-west1.firebasedatabase.app` is **frozen** post-s87. Read-only via web_fetch if needed for historical comparison. Sunset planned ~2026-05-28.

---

## Naming conventions

- Collection names: lowercase plural — `players`, `exercises`, `coach_sessions`
- Document IDs: lowercase snake_case for known IDs (`artem`); `Date.now()` ms as string for timestamps
- Field names: camelCase to match existing JS conventions
