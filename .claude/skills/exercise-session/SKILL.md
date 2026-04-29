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

Live-log decision:
- For now, write a single end-of-session log via `node tools/log_exercise.js` (Step 6 below)
- Stage 1 live-log (`exercise_active/{session_id}` collection with per-item `?exupd=` updates) is supported by the PWA but not yet wired into `tools/`. Use single-shot logging until the per-item tool is added.
- If using claude.ai chat (no Claude Code) → fall back to `?exlog=BASE64` deeplink generation per `references/deeplink-schema.md`

### Step 4 — Post-session feedback

Provide:
- Score trend within session (e.g., "improved from 50% in first half to 80% in second")
- Persistent error patterns (categorised by type)
- What to adjust next time (specific recommendation, not generic)
- Score against player's recent baseline

### Step 5 — Get player feedback

Ask the player how the session felt. Capture in a single short note for `recent_observations`.

### Step 6 — Persist

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
- Letting Egor's name appear in a session (no exercises for Egor)

## When not to run

- Player asks but seems stressed or has just done a session
- Stats show <24h since last session — risk of fatigue
- Player explicitly cancels mid-session — finalize what's done, persist, stop

## After the session

If the session yielded a durable observation worth persisting in profile (not just
recent), propose a `family-profiles.md` edit to Artem. Wait for approval before
committing.
