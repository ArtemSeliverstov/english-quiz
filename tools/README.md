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

### `get_player.js` — fetch one player's doc

```bash
node get_player.js anna                          # full doc
node get_player.js anna --field coach_notes      # just one field
node get_player.js anna --field stats --no-empty # prune empty values
```

Used at the start of an exercise session to load player context (stats + coach_notes).

### `get_all_players.js` — fetch all 5 players in parallel

```bash
node get_all_players.js                  # full data, all 5 players
node get_all_players.js --summary        # top-level metrics only
node get_all_players.js --field coach_notes
```

Used at the start of a stats review.

Per-player parallel fetches — never `/players` bulk fetch (truncates silently;
see `references/bug-log.md`).

### `log_exercise.js` — write an exercise to history

```bash
node log_exercise.js anna ./exercise.json
cat exercise.json | node log_exercise.js anna -
```

Writes to `players/{name}/exercises/{Date.now()}`. Validates exercise type
(must use canonical names — `article_drill` not `error_correction`). See
`references/deeplink-schema.md` for the JSON shape.

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
