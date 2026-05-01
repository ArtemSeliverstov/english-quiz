---
name: exercise-session
description: Run a supplementary exercise session for any family member (Anna, Nicole, Ernest, Artem). Use when user says "this is X, let's do exercises", "давай упражнения", or any request to start an exercise for a named player. Egor does NOT do exercise sessions.
---

# Exercise Session

You are running a structured supplementary exercise session for one of Artem's family
members. The 6-step protocol below is mandatory. Each step has specific reads and writes.

## Reads required before starting

1. **`references/family-profiles.md`** — for the player's stable profile (level, focus, communication style, themes)
2. **Firestore `players/{name}`** — for stats and dynamic `coach_notes`
3. **`references/exercise-types.md`** — for the type definitions and selection criteria
4. **`references/weekly-slots.md`** — only if the player is Artem (only player with slot plan)

**Note on travel context**: Claude Code does not have access to claude.ai user memory,
so it cannot know if the family is travelling. Default to home/Bahrain themes per the
profile. If Artem mentions travel at session start ("we're in Turkey this week"),
adopt location-appropriate themes for that session only.

## Path-specific behaviour

**Family path (Anna, Nicole, Ernest)** — the existing 6-step protocol below applies.
Pre-generated content via library (post-Phase 2C); live AI escalation available;
bounded scoring per item. Logging is single end-of-session via `tools/log_exercise.js`.

**Artem path** — live and conversational only. No library reuse. CC generates
exercises on the fly using the authoring quality bar in
`references/phase2-coach-tab.md` §10 inverted (CC authors during the session, not in
advance). Logging schema is identical (writes to `players/artem/exercises/{ts}` and
`players/artem/coach_sessions/`) but the `mode` field on `coach_sessions` is
`"cc_session"`. No `tokens_used` field (Max-backed, not metered).

## The 6-step protocol

### Step 1 — Retrieve context

Run `node tools/get_player.js {name}` via bash to read the player doc. The script
returns plain JSON with stats and coach_notes pre-converted from Firestore typed-value
format. Extract:
- `stats` — per-question history
- `coach_notes.weak_patterns` — what they're working on
- `coach_notes.recent_observations` — last few session notes
- `coach_notes.engagement_notes` — preferences (length, format)

Combine with stable profile from `family-profiles.md`.

### Step 2 — Select exercise type

Match player's profile + recent weak patterns + (for Artem) slot plan.
Reference `references/exercise-types.md` for the type-by-player matrix.

If multiple types apply, propose options and let player pick. Don't auto-select on
ambiguity.

**Critical**: Use canonical exercise names. `article_drill` for article drills (NOT
`error_correction`). `particle_sort` for particle sorts (NOT `transform`). Slot-matching
depends on exact values.

### Step 3 — Run session

Present items one at a time. Score each. Build error pattern map.

For each item, use the player's real-life context themes from `family-profiles.md`.
Default to home/Bahrain context unless Artem mentioned travel at session start.
**Generic stems are forbidden** ("the man went to the shop" — never).

### Logging strategy

Use single end-of-session logging via `tools/log_exercise.js` (Step 6).

Per-item live logging (`?exupd=` deeplinks → `exercise_active` collection) is
supported by the PWA but currently unused via CC. Reserve for future Phase 2C
work if an Artem-path live-log proves useful.

claude.ai chat fallback (`?exlog=` deeplink) is now legacy — only relevant if CC
is unavailable. Phase 2C provides a Coach tab that handles family logging
natively.

### Step 4 — Post-session feedback

Provide:
- Score trend within session (e.g., "improved from 50% in first half to 80% in second")
- Persistent error patterns (categorised by type)
- What to adjust next time (specific recommendation, not generic)
- Score against player's recent baseline

### Step 5 — Get player feedback

Ask the player how the session felt. Capture in a single short note for `recent_observations`.

### Step 6 — Persist

**Always preview in human-readable form before writing.** Show the planned exercise log
and coach_notes patch as plain bullets — date, type, topic, score, vs baseline, errors
as prose, observation as a quoted sentence, engagement notes as a quoted sentence. Never
show raw JSON to the player at the preview stage. Build the JSON files internally only
after the player approves the human-readable preview. (Preference set by Artem 2026-04-30.)

**Claude Code path** (preferred):
1. Write the exercise summary JSON to a temp file, then run
   `node tools/log_exercise.js {name} /tmp/exercise.json` — this writes to
   `players/{name}/exercises/{ts}` and validates the exercise type is canonical
   (`article_drill` not `error_correction`, etc.)
2. (Stage 1 live log not yet wired in tools/ — defer; use single end-of-session log for now)
3. Update `coach_notes` if anything new emerged — propose to user, wait for confirmation,
   then build a patch JSON and run `node tools/update_coach_notes.js {name} /tmp/patch.json`.
   The patch supports `weak_patterns_add`, `recent_observations_add`, `engagement_notes`,
   etc. — see `tools/README.md` for the schema.

   **Note**: on Windows, `/tmp/` is not a valid path. Use `D:/tmp/` or repo-relative
   `./.tmp/` (gitignored). Create the directory first if it doesn't exist.

**claude.ai chat path** (fallback):
1. Generate `?exlog=BASE64` deeplink for player to tap
2. Mention coach_notes update intent — Artem will write later

See `references/deeplink-schema.md` for exact payload format.

## Forbidden behaviours

- Generic exercise sentences ("the woman bought a book")
- Skipping Step 4 (feedback)
- Skipping Step 6 (persistence)
- Auto-suggesting sessions for Nicole (player-initiated only)
- Pushing through more items when player shows fatigue
- Naming the grammar rule in hints (gives away the answer)
- For PV transform items: showing the verb+particle as the keyword (e.g. `GET ACROSS`).
  Keyword is base verb only (`GET`); the particle is the production challenge. See
  `references/exercise-types.md` §4 for the rule.
- Letting Egor's name appear in a session (no exercises for Egor)

## When not to run

- Player asks but seems stressed or has just done a session
- Stats show <24h since last session — risk of fatigue
- Player explicitly cancels mid-session — finalize what's done, persist, stop

Post-Phase 2C: family members (Anna, Nicole, Ernest) typically use the Coach tab
in the PWA directly, which handles sessions natively. This skill remains as a
fallback for cases when (a) Coach tab is broken, (b) Artem wants to run a session
for a family member via CC, or (c) Artem runs his own session. In normal operation
post-2C, the family path of this skill is rarely invoked.

## After the session

If the session yielded a durable observation worth persisting in profile (not just
recent), propose a `family-profiles.md` edit to Artem. Wait for approval before
committing.
