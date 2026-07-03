# tools/ — Firestore helper scripts

Small Node scripts that talk to Cloud Firestore via REST API. Used by Claude Code
sessions (laptop) when MCP-side Firestore tools aren't available.

These cover read/write operations needed by the `exercise-session` and `stats-review`
skills. Quiz development and deploy don't need them.

## Why these exist

Google's official Firebase MCP server (`firebase mcp`) is configured in `.mcp.json`
and provides project/env/security-rules/SDK tools — but **NOT** Firestore document
CRUD. To work with Firestore documents (read player data, write exercises, update
coach_notes), Claude Code calls these scripts via bash.

Auth: open writes via `firestore.rules`. No service account, no token, no setup.

## Scripts

### `lint_questions.js` — schema lint for ALL_QUESTIONS

```bash
node tools/lint_questions.js
```

Validates the question bank against `references/question-schema.md`. Catches duplicate IDs, missing required fields, wrong `ans` type for gap/mcq, multi blank count mismatches, hints on gap/mcq/multi, and missing hints on input. <500ms on the full bank. Run in CI on every push to main.

### `check_transform_keywords.js` — transform keyword/stem rules

```bash
node tools/check_transform_keywords.js
```

Validates the two transform rules: every accepted `ans` variant contains `keyword`, and `keyword` is not a whole word in the stem. Run in CI.

### `get_recent_mistakes.js` — pull past-N-hour quiz mistakes for all players

```bash
node tools/get_recent_mistakes.js                       # default 31h, JSON output
node tools/get_recent_mistakes.js --hours 48
node tools/get_recent_mistakes.js --player artem
node tools/get_recent_mistakes.js --pretty              # human-readable per-mistake blocks
```

A mistake = `qStats[qid].lastSeen >= now-window` AND `lastWrong` is set. The
live quiz play loop deletes `lastWrong` on a correct answer, so its presence
implies the most recent attempt was wrong. Coach/CC supplementary surfaces
fold into `qStats.{seen,correct,wrong}` but never set `lastWrong/lastSeen`,
so this tool reports quiz-tab activity only — exactly what `mistakes-review`
needs. Joins question metadata (q, opts, ans, exp, hint, keyword, raw object
source) from `index.html` for downstream classification.

### `get_player.js` — fetch one player's doc

```bash
node get_player.js anna                          # full doc
node get_player.js anna --field coach_notes      # just one field
node get_player.js anna --field stats --no-empty # prune empty values
```

Used at the start of an exercise session to load player context (stats + coach_notes).

### `get_all_players.js` — fetch all 5 players in parallel

```bash
node get_all_players.js                          # full data, all 5 players
node get_all_players.js --summary                # top-level metrics only
node get_all_players.js --field coach_notes
node get_all_players.js -S                       # add exercises + coach_sessions subcollections
node get_all_players.js -S --full-items          # include raw items[]/messages[]
```

Used at the start of a stats review. Pass `--include-subcollections` (`-S`)
to read Coach-tab and CC exercise activity — the player doc's
`recentSessions` only captures legacy quiz-tab activity. Per-exercise
summary surfaces `auto_suspected` and `tta_mean` so dubious sessions are
visible without `--full-items`.

Per-player parallel fetches — never `/players` bulk fetch (truncates silently;
see `references/bug-log.md`).

### `log_exercise.js` — write an exercise to history

```bash
node log_exercise.js anna ./exercise.json
cat exercise.json | node log_exercise.js anna -
```

Writes to `players/{name}/exercises/{Date.now()}`. Validates exercise type
(must use canonical names — `article_drill` not `error_correction`). JSON
shape per `references/firestore-schema.md` (exercises subcollection).

Also folds each **wrong** item's `matched_pattern_id` into
`coach_notes.recent_session_signals` (via `_signals.js`), plus the daily streak and
cross-surface stats aggregation. This closes the leak where CC sessions wrote the exercise row
but not the signals buffer, so a 2nd occurrence never reached the promotion gate — a CC
`exercise-session` no longer needs a manual `update_coach_notes.js` bump. Idempotent on re-run.

### `backup_players.js` — daily Firestore snapshot

```bash
node backup_players.js                       # write today's snapshot
node backup_players.js --date 2026-05-03
node backup_players.js --player anna         # single player
node backup_players.js --dry-run             # summary only, no write
```

Writes one self-contained JSON per player to `backups/YYYY-MM-DD/{player}.json`,
each containing the player doc + the full `exercises` and `coach_sessions`
subcollections. The only recovery source now that RTDB is frozen. See
`plans/archive/data-integrity-postmortem.md` for the full rationale. Proven in
anger: the 2026-05-20 Artem root-doc replace was recovered from
`backups/2026-05-20/artem.json` (see `references/bug-log.md`).

`backups/` is `.gitignore`d on `main` — production snapshots go to the
`backups` orphan branch via `.github/workflows/backup.yml`.

### `check_player_integrity.js` — contamination probe + baseline

```bash
node tools/check_player_integrity.js                   # check; auto-update baseline if clean and no shrink
node tools/check_player_integrity.js --dry-run         # check only, never write baseline
node tools/check_player_integrity.js --accept-shrink   # allow baseline update despite a count decrease
node tools/check_player_integrity.js --reset-baseline  # force-rewrite baseline (e.g. after a restore)
node tools/check_player_integrity.js --json
```

Five invariants against `tools/data-integrity-baseline.json`: cross-player
qStats overlap, createdAt drift, createdAt removal, unexplained totalAnswered
jump, totalAnswered decrease, qStats key-count collapse. Run as step 0 of
`stats-review`; exit 1 = stop and investigate against the `backups` branch.

The baseline file is auto-rewritten after every clean, non-shrinking run —
it showing as git-modified is **expected**; commit it opportunistically.
A count shrink blocks the rewrite (`--accept-shrink` to override) so a
degraded state can't ratchet itself in — the 2026-05-20 incident did exactly
that under the old always-ratchet behaviour.

### `check_doc_caps.js` — word-cap lint for CLAUDE.md / SKILL.md

```bash
node tools/check_doc_caps.js            # all capped files; exit 1 on any failure
node tools/check_doc_caps.js --quiet
node tools/check_doc_caps.js path/to/SKILL.md
```

Node-based Unicode-aware counter (matches CI; local `wc -w` undercounts
Cyrillic/em-dash content). Caps per `references/doc-style.md`. Run before
pushing any CLAUDE.md or SKILL.md edit.

### `get_question_mistakes.js` — per-qid mistake audit

```bash
node tools/get_question_mistakes.js <qid>
```

Pulls `qStats[qid]` (incl. `lastWrong`) across all players plus question
metadata. Used by `stats-review` step 2.5 and `quiz-development` fix passes.

### `capture_swaps.js` — capture awkward→natural swaps to phrase_tracker

```bash
node tools/capture_swaps.js artem ./swaps.json
cat swaps.json | node tools/capture_swaps.js artem -
node tools/capture_swaps.js artem ./swaps.json --dry-run
```

Thin wrapper over `update_coach_notes.js` that centralises the CC capture-source asymmetry rule (skip ⚪ first_pass, land at 🔵 active). Used by the `free-write` skill, the `exercise-session` skill, and the end-of-session prompt-coaching wrap.

Input shape:

```json
{
  "source": "fw",
  "session_id": "artem_fw_1778100000000_xy12",
  "swaps": [
    { "awkward": "sometime ago", "natural": "a while ago", "tag": "brit_expat" },
    { "awkward": "audit my mistake", "natural": "review my mistake" }
  ]
}
```

`source` is one of `fw` (free-write) / `ex` (exercise-session) / `psd` (phrase_swap_drill) / `wrap` (end-of-session). `tag` is optional — omit for register tendencies that apply across all contexts. The tool stamps `status: 'active'`, `first_seen: today`, `sources: [source]`, and appends a `recent_observations` summary entry referencing the session. Lifecycle thereafter follows `references/coach-notes-schema.md` "Phrase tracker lifecycle".

### `update_coach_notes.js` — apply a patch to coach_notes

```bash
node update_coach_notes.js anna ./patch.json
cat patch.json | node update_coach_notes.js anna -
node update_coach_notes.js anna ./patch.json --dry-run
```

Patch format supports add/remove for arrays:

```json
{
  "weak_patterns_add": ["preposition swap (RU L1)"],
  "recent_observations_add": [
    {
      "date": "2026-04-29",
      "session_id": "anna_1730_abc1",
      "note": "Slow on transformations.",
      "author": "claude_code"
    }
  ],
  "engagement_notes": "Optimal session length 8 items."
}
```

`recent_observations` is FIFO-capped at 10 (oldest dropped). `last_updated` and
`last_updated_by` set automatically. See `references/coach-notes-schema.md`.

### `pv_cold_streak.js` — per-PV cold-production streak tracker (Artem)

```bash
node tools/pv_cold_streak.js artem                  # full table, sorted by status
node tools/pv_cold_streak.js artem --pv "get across"  # event timeline + streak math
node tools/pv_cold_streak.js artem --graduated        # only 🏆 / near-🏆 PVs
node tools/pv_cold_streak.js artem --json             # machine-readable
```

Computes the streak rule from `progress/phrasal-verbs-tracker.md` (🏆 = ≥3 cold wins across ≥2 formats, no failures during streak). Reads `coach_sessions[].pvs_used_correctly` (tier 1) and `exercises[].items[]` of type translation/russian_trap (tiers 2–3). Recognition formats (gap/mcq/particle_sort) and quiz `input` qStats are excluded — see script header for v2 notes. Use during `stats-review` to refresh tracker Status column and bump qualifying PVs from 🟢 to 🏆.

### `get_library_meta.js` — exercises_library coverage per player

```bash
node tools/get_library_meta.js              # full _meta doc
node tools/get_library_meta.js --coverage   # coverage_by_player only
node tools/get_library_meta.js --totals     # total_exercises_per_type only
```

Reads `exercises_library/_meta` and decodes the Firestore wrapper. Used by
the `routing-audit` skill to enumerate per-player Coach drill pool sizes —
the value that determines coach session length, since `coachStartType`
runs the entire targeted library with no sub-sampling.

### `log_coach_session.js` — write a Coach chat session (Free Write style)

```bash
node log_coach_session.js artem ./session.json
cat session.json | node log_coach_session.js artem -
node log_coach_session.js artem ./session.json --dry-run
```

Writes to `players/{name}/coach_sessions/{session_id}` — the chat-archive
collection (separate from `exercises`). Used by the `free-write` CC skill.
Auto-generates `session_id` in the format `{player}_fw_{ts}_{rand}` matching
the PWA convention. Tags `source: 'cc_session'` so analytics can distinguish
CC-driven from PWA-driven Free Writes.

Schema mirrors the PWA's `coachWriteSessionLogStandalone` — see the script
header for the full session JSON shape.

### `promote_signals.js` — surface / apply recent_session_signals promotions

```bash
node tools/promote_signals.js artem --list          # count>=2 promotable (with likely_covered flag)
node tools/promote_signals.js all --list            # same, every player
node tools/promote_signals.js artem --apply patch.json   # {promotions:[{pattern_id,label}]}
```

Makes the promotion gate (`count >= 2` → `weak_patterns`) cheap to run daily. `--list`
(read-only) is wired into `mistakes-review` so ready signals can't rot between manual
`stats-review` runs. `--apply` appends each composed label to `weak_patterns` (deduped) **and**
drops the promoted `pattern_id` from the buffer in one write. Label composition stays with the
skill (Claude) — the tool never invents a machine-generated label. See `coach-notes-schema.md`.

## One-off / completed migration scripts

The directory also holds completed one-shot migration and batch-authoring
artifacts kept for auditability: `wave1_*`–`wave4_*` (question-bank waves +
input JSON + rubrics), `tag_*` (taxonomy tagging pipeline), `bizflag_*`,
`grammar_migration_*`, `wordform_base_*`, `quantifiers_append.js`,
`errcorr_recase.js`, `strip_linked_qids.js`, plus `batches/` and `uploads/`.
These are **not** part of any live skill workflow, are not individually
documented here, and should not be reused without reading their headers —
they encode point-in-time schema assumptions. New one-offs: name them after
their batch, leave them here when done, and add them to this list.

## Shared library

`_firestore.js` — typed-value JSON converters and HTTP wrappers. Imported by all
other scripts. Not a CLI itself.

`_signals.js` — `recent_session_signals` buffer + promotion lifecycle, shared by
`update_coach_notes.js`, `log_exercise.js` (auto-fold on CC exercise write), and
`promote_signals.js`. Exposes `applyRecentSessionSignalsPatch` (add/promote/remove, combinable
in one patch) and `deriveSignalsFromExercise`. Not a CLI itself.

## Patterns & conventions

- All scripts: `node script.js <args>`. Standard exit codes (0=ok, non-zero=error).
- All scripts accept `-` as filename to read from stdin
- Output is always JSON for machine consumption
- Errors go to stderr; success goes to stdout
- `--help` prints usage and exits 0

## How Claude Code uses them

Skills tell CC to call these via bash:

```
exercise-session SKILL.md says:
  → bash: node tools/get_player.js anna
  → use stdout as player context
  → at session end:
    → echo '{...exercise json...}' > /tmp/ex.json
    → bash: node tools/log_exercise.js anna /tmp/ex.json
    → bash: node tools/update_coach_notes.js anna /tmp/patch.json
```

The skills already reference these scripts in their workflow steps. No skill changes needed.

## Adding new tools

Each new tool should:
1. Use `_firestore.js` for HTTP and conversion
2. Output JSON to stdout
3. Provide `--help`
4. Document in this README
5. Pass `node --check` before commit
