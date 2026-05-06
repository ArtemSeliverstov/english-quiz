---
name: exercise-session
description: Run a supplementary exercise session for any family member (Anna, Nicole, Ernest, Artem, Egor). Use when user says "this is X, let's do exercises", "давай упражнения", or any request to start an exercise for a named player. As of 2026-05-06 Egor has parity with the rest of the family — he does exercises too.
---

# Exercise Session

Structured supplementary exercise session for one named player. Family path (Anna, Nicole, Ernest, Egor) uses pre-generated library content where available; Artem path is live-authored, conversational, no library reuse. Logging schema is identical across all players.

## Reads

- `references/family-profiles.md` — player's level, focus, communication style, themes
- `node tools/get_player.js {name} --field coach_notes` — coach_notes only; raw qStats (~150 KB for Artem) is not needed — `weak_patterns` is already the distilled signal
- `references/exercise-types.md` — type definitions and selection criteria
- `references/weekly-slots.md` — Artem only

If Artem mentions travel at session start, adopt location-appropriate themes for this session only.

## 6-step protocol

**1. Retrieve context.** From the player doc: `stats`, `coach_notes.weak_patterns`, `coach_notes.recent_observations`, `coach_notes.engagement_notes`, `phrase_tracker` (active+retest entries). Combine with profile.

**2. Select exercise type.** Match profile + recent weak patterns + (Artem) slot plan. Use canonical type names — `article_drill` not `error_correction`, `particle_sort` not `transform`. Slot-matching depends on exact values (validator enforces). Propose options if ambiguous; don't auto-select.

**3. Run session.** One item at a time, score each, build error pattern map. Use the player's real-life themes from profile (tags from `family-profiles.md`).

**4. Post-session feedback.** Score trend within session, persistent error patterns, specific (not generic) recommendation for next time, score vs recent baseline.

**5. Persist (auto-write).** No preview, no confirm. Write the exercise log + coach_notes patch in one go. The previous "preview → wait → persist" flow lost data when sessions were abandoned mid-feedback — see `coach-notes-schema.md` "Update protocol".

```bash
node tools/log_exercise.js {name} <exercise.json>     # exercises/{ts}
node tools/update_coach_notes.js {name} <patch.json>  # rec_obs append + weak_patterns adjustments + phrase_tracker transitions
```

Build the rich shape per `references/firestore-schema.md`: `source: "cc_session"` and one `items[]` entry per scored item. CC-specific capture:

- `time_to_answer_ms`: `Date.now()` via Bash at item start + after the reply; rough is fine (auto_suspected uses 500ms threshold).
- `matched_pattern_id` (wrong items): snake_case slug, same vocabulary as `error_types[]` (e.g. `a_the_swap`, `wait_no_for`).
- `exercise_id`, `exercise_version`: `null` — these point at library versions; CC items don't have them.

`log_exercise.js` validates the per-item shape, computes `tta_stats` and `auto_suspected` at write time. The notes script handles FIFO-cap on `recent_observations` automatically. See `tools/README.md` and `references/coach-notes-schema.md`.

**5a. Capture card** (always run if any stiff/calqued lexical moment surfaced). Pair each with a natural form, tag with player context. 2nd-occurrence rule mechanical — single-session captures land in `recent_observations` only. Fold into the same `update_coach_notes.js` patch.

**6. Render the player-facing table** (≤10 lines including the feedback ask). Use the `exercise-session` template from `coach-notes-schema.md`. Then ask "How did it feel? — or skip." Non-blocking — if the player answers, append the answer as a `recent_observations` entry (auto, no second confirm). If they don't, the session is already saved.

## When not to run

- Player seems stressed or just finished a session (<24h)
- Player explicitly cancels — finalise what's done, persist, stop
- Nicole asking is fine; auto-suggesting for Nicole is not (player-initiated only)
- Egor: time-zone aware (Almaty is UTC+5; Bahrain is UTC+3). Don't propose at hours that would land mid-workday for him.

## Forbidden

- Skipping step 4 (feedback) or step 6 (persist)
- For PV transform: showing verb+particle as keyword (`GET ACROSS`). Keyword is base verb only (`GET`); the particle is the production challenge — see `exercise-types.md` §4
- Naming the grammar rule in hints (gives away the answer)

(General prohibitions — generic stems, no auth-bypass, etc. — live in `references/operational-rules.md`.)

## After

If a durable observation emerged worth a profile edit, propose it and wait for approval before committing.
