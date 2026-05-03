---
name: exercise-session
description: Run a supplementary exercise session for any family member (Anna, Nicole, Ernest, Artem). Use when user says "this is X, let's do exercises", "давай упражнения", or any request to start an exercise for a named player. Egor does NOT do exercise sessions.
---

# Exercise Session

Structured supplementary exercise session for one named player. Family path (Anna, Nicole, Ernest) uses pre-generated library content where available; Artem path is live-authored, conversational, no library reuse. Logging schema is identical for both.

## Reads

- `references/family-profiles.md` — player's level, focus, communication style, themes
- `node tools/get_player.js {name}` — stats + `coach_notes`
- `references/exercise-types.md` — type definitions and selection criteria
- `references/weekly-slots.md` — Artem only

If Artem mentions travel at session start, adopt location-appropriate themes for this session only.

## 6-step protocol

**1. Retrieve context.** From the player doc: `stats`, `coach_notes.weak_patterns`, `coach_notes.recent_observations`, `coach_notes.engagement_notes`. Combine with profile.

**2. Select exercise type.** Match profile + recent weak patterns + (Artem) slot plan. Use canonical type names — `article_drill` not `error_correction`, `particle_sort` not `transform`. Slot-matching depends on exact values (validator enforces). Propose options if ambiguous; don't auto-select.

**3. Run session.** One item at a time, score each, build error pattern map. Use the player's real-life themes from profile.

**4. Post-session feedback.** Score trend within session, persistent error patterns, specific (not generic) recommendation for next time, score vs recent baseline.

**5. Get player feedback.** One short sentence for `recent_observations`.

**6. Persist.** Preview the planned writes in human-readable form first — date, type, topic, score, errors as prose, observation as a quoted sentence. Never show raw JSON at preview.

Build the rich shape per `references/firestore-schema.md`: `source: "cc_session"` and one `items[]` entry per scored item. CC-specific capture:

- `time_to_answer_ms`: `Date.now()` via Bash at item start + after the reply; rough is fine (auto_suspected uses 500ms threshold).
- `matched_pattern_id` (wrong items): snake_case slug, same vocabulary as `error_types[]` (e.g. `a_the_swap`, `wait_no_for`).
- `exercise_id`, `exercise_version`: `null` — these point at library versions; CC items don't have them.

```bash
node tools/log_exercise.js {name} <exercise.json>     # exercises/{ts}
node tools/update_coach_notes.js {name} <patch.json>  # if patterns evolved
```

`log_exercise.js` validates the per-item shape, computes `tta_stats` and `auto_suspected` at write time. Sparse rows (no `items[]`) are accepted with a warning during transition. The notes script handles FIFO-cap on `recent_observations` automatically. See `tools/README.md` and `references/coach-notes-schema.md`.

## When not to run

- Player seems stressed or just finished a session (<24h)
- Player explicitly cancels — finalise what's done, persist, stop
- Egor (he's quiz-only)
- Nicole asking is fine; auto-suggesting for Nicole is not (player-initiated only)

## Forbidden

- Skipping step 4 (feedback) or step 6 (persist)
- For PV transform: showing verb+particle as keyword (`GET ACROSS`). Keyword is base verb only (`GET`); the particle is the production challenge — see `exercise-types.md` §4
- Naming the grammar rule in hints (gives away the answer)

(General prohibitions — generic stems, no auth-bypass, etc. — live in `references/operational-rules.md`.)

## After

If a durable observation emerged worth a profile edit, propose it and wait for approval before committing.
