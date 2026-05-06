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

### `backup_players.js` — daily Firestore snapshot

```bash
node backup_players.js                       # write today's snapshot
node backup_players.js --date 2026-05-03
node backup_players.js --player anna         # single player
node backup_players.js --dry-run             # summary only, no write
```

Writes one self-contained JSON per player to `backups/YYYY-MM-DD/{player}.json`,
each containing the player doc + the full `exercises` and `coach_sessions`
subcollections. Recovery source after the RTDB sunset (~2026-05-28). See
`plans/data-integrity-plan.md` for the full rationale.

`backups/` is `.gitignore`d on `main` — production snapshots go to the
`backups` orphan branch via `.github/workflows/backup.yml`.

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

## Shared library

`_firestore.js` — typed-value JSON converters and HTTP wrappers. Imported by all
other scripts. Not a CLI itself.

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
