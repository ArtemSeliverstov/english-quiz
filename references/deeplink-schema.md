# Deeplink Schema

Deeplinks let claude.ai chat sessions log exercise data to Firestore even though chat
itself can't write directly. Claude generates a URL with `?exlog=`, `?exupd=`, or
`?exfin=` parameters; the player taps the link; the PWA decodes and writes.

For Claude Code (mobile or laptop), deeplinks are a **fallback** — direct Firestore
writes via Firebase MCP are preferred. Use deeplinks only when:
1. Operating from claude.ai chat (no MCP write access)
2. The player isn't near you and you're handing off via shared device

---

## Four deeplink types

| Param | Purpose | When |
|---|---|---|
| `?exstart=BASE64` | Create a new active session | Once at session start (Stage 1 live log) |
| `?exupd=BASE64` | Append one item to active session | After each item (Stage 1) |
| `?exfin=BASE64` | Finalize → move to history, delete active | Once at session end (Stage 1) |
| `?exlog=BASE64` | Single-shot end-of-session log (legacy) | Backward-compat path; one-shot logging |

The `?exlog=` form is the original (s71). The `?exstart` / `?exupd` / `?exfin` triple
was added in s87 with the Stage 1 live log feature. Both are supported.

---

## URL format

```
https://artemseliverstov.github.io/english-quiz?{param}={base64_encoded_json}
```

The PWA decodes base64, parses JSON, validates, and writes to Firestore.

The `chat_url` field should be set by reading the current chat's URL via the
`recent_chats` tool (or `claude.ai/chat/{uri}` format if the chat URI is known).

---

## `?exlog=` payload (single-shot)

Used at end of session for backward-compatible single-write logging.

```json
{
  "_player": "anna",
  "exercise": "translation",
  "topic": "RU→EN prepositions",
  "level": "B2",
  "total": 8,
  "correct": 5,
  "date": "2026-04-29",
  "categories": ["Prepositions", "Tenses"],
  "error_types": ["preposition", "article"],
  "errors": [
    "арriving to → arriving at (item 2)",
    "since 5 minutes → for 5 minutes (item 5)"
  ],
  "chat_url": "https://claude.ai/chat/abc123",
  "meta": { "round_scores": [3, 2] }
}
```

The `_player` field is stripped before write. The remaining fields land at
`players/{name}/exercises/{ts}` where `{ts}` is `Date.now()`.

### Field requirements

| Field | Type | Required | Description |
|---|---|---|---|
| `_player` | string | yes | Player key (artem/anna/nicole/ernest/egor). Stripped before write. |
| `exercise` | string | yes | One of: translation, free_write, error_correction, transform, dictation, conversation, article_drill, particle_sort. **Important**: use canonical names — never use `error_correction` for an article drill (use `article_drill`); never use `transform` for a particle sort (use `particle_sort`). Slot-matching depends on the exact value. |
| `topic` | string | yes | Brief description of what was practised. |
| `level` | string | yes | B1 \| B2 \| C1 |
| `total` | number | yes | Total items |
| `correct` | number | yes | Correct items |
| `date` | string | auto | YYYY-MM-DD. Auto-filled if omitted. |
| `categories` | string[] | yes | Exact quiz category names. Must match `cat` values in ALL_QUESTIONS. |
| `error_types` | string[] | yes | Cross-session error pattern tags. |
| `errors` | string[] | yes | Per-item error descriptions. |
| `chat_url` | string | yes | Claude chat URL for traceability. |
| `meta` | object | no | Extras: per-round scores, key patterns. |

---

## `?exstart=` payload (Stage 1 — start)

Creates a new doc at `exercise_active/{session_id}` with `final: false` and empty `items[]`.

```json
{
  "_player": "anna",
  "exercise": "translation",
  "topic": "RU→EN prepositions",
  "level": "B2",
  "total_planned": 8,
  "chat_url": "https://claude.ai/chat/abc123",
  "session_id": "anna_1730000000000_abc1"
}
```

`session_id` is optional — if omitted, the PWA generates one of the form
`{player}_{ms}_{rand4chars}`. Capture the returned session_id from the toast for
subsequent `?exupd=` calls.

---

## `?exupd=` payload (Stage 1 — append item)

Appends a single item to the active session's `items[]` array.

```json
{
  "session_id": "anna_1730000000000_abc1",
  "stem": "Я жду вас в аэропорту с трёх часов.",
  "given": "I have been waiting for you at the airport since 3.",
  "correct": true,
  "expected": "I have been waiting for you at the airport since 3.",
  "note": "PPC + 'since' for time"
}
```

The PWA appends `{stem, given, correct, expected, note, ts}` to `items[]` (`ts` is
auto-set by the PWA).

### Batched item form

Multiple items can be sent in one `?exupd=` call:

```json
{
  "session_id": "anna_1730000000000_abc1",
  "items": [
    { "stem": "...", "given": "...", "correct": true, "note": "..." },
    { "stem": "...", "given": "...", "correct": false, "note": "..." }
  ]
}
```

---

## `?exfin=` payload (Stage 1 — finalize)

Moves the active session to history and deletes the active doc.

```json
{
  "session_id": "anna_1730000000000_abc1"
}
```

The PWA reads the active doc, computes `total` / `correct` from `items[]`, writes
to `players/{name}/exercises/{ts}`, then deletes `exercise_active/{session_id}`.

---

## Duplicate entry handling

Each tap creates a new entry with a unique `Date.now()` timestamp. If a player taps
the same `?exlog=` link twice, two identical entries appear.

**Stats analysis must deduplicate**: when processing `exerciseHistory`, group entries
by date + exercise + topic and keep only the first (earliest timestamp). The History
tab delete button (🗑) allows manual cleanup.

The PWA also runs a duplicate-check before writing (s73): if an entry with same
date + exercise + topic + score already exists for this player, the write is skipped
and a warning toast shown. Fallback: if the dupe-check fetch fails, the write proceeds.

---

## Generation pattern (Claude Code preferred)

When operating from Claude Code with Firebase MCP, prefer direct writes:

```
Stage 1 (live log) flow:
1. firestore_set("exercise_active/{sid}", { ...exstart payload, items: [], final: false })
2. (per item) firestore_update with merged items array
3. firestore_set("players/{name}/exercises/{ts}", { ...summary }) + firestore_delete("exercise_active/{sid}")

Single-shot flow:
firestore_set("players/{name}/exercises/{ts}", { ...exlog payload without _player })
```

Always update `players/{name}.coach_notes.recent_observations` if the session yielded
new insights.

---

## Generation pattern (claude.ai chat fallback)

Generate the JSON, base64-encode, append to URL, present to player as a tappable link.
Use `recent_chats` tool to find current chat URL for the `chat_url` field.

```
Encoded URL:
https://artemseliverstov.github.io/english-quiz?exlog={base64_of_json}
```

For Stage 1 in chat: generate three deeplinks per session (start, multiple updates, finalize).
This is a lot of taps for the player — consider single-shot `?exlog=` for short sessions
(< 5 items) and live-log only for longer sessions where mid-session checkpoints matter.
