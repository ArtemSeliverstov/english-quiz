---
name: exercise-session
description: Run a supplementary exercise session for any family member (Anna, Nicole, Ernest, Artem, Egor). Use when user says "this is X, let's do exercises", "давай упражнения", or any request to start an exercise for a named player. As of 2026-05-06 Egor has parity with the rest of the family — he does exercises too.
---

# Exercise Session

Structured supplementary exercise session for one named player. Family path (Anna, Nicole, Ernest, Egor) uses pre-generated library content where available; Artem path defaults to live-authored — but opts into library when the request names a drill set (see §2a). Logging schema identical across players and surfaces.

## Reads

- `references/family-profiles.md` — player's level, focus, communication style, themes
- `node tools/get_player.js {name} --field coach_notes` — coach_notes only; raw qStats (~150 KB for Artem) is not needed — `weak_patterns` is already the distilled signal
- `references/exercise-types.md` — type definitions and selection criteria
- `references/weekly-slots.md` — Artem only

If Artem mentions travel at session start, adopt location-appropriate themes for this session only.

## 6-step protocol

**1. Retrieve context.** From the player doc: `stats`, `coach_notes.weak_patterns`, `coach_notes.recent_observations`, `coach_notes.engagement_notes`, `phrase_tracker` (active+retest entries). Combine with profile.

**2. Select exercise type.** Match profile + recent weak patterns + (Artem) slot plan. Use canonical type names — `article_drill` not `error_correction`, `particle_sort` not `transform`. Slot-matching depends on exact values (validator enforces). Propose options if ambiguous; don't auto-select.

**2a. Library opt-in (Artem only).** When request names a library set ("PV chronic drills", "translation drills", "the b04 batch") pull from `exercises_library/{type}/items/` filtered by `target_player='artem'` (fallback: local `library_drafts/*.json`). Run as authored — present `prompt_ru`, score against `correct_answers`, fire `common_errors[].regex` for targeted feedback, fall back to `fallback_feedback`. Do NOT live-author replacements. Default unscoped Artem requests still go live-authored. In library mode, set `exercise_id`+`exercise_version` on each `items[]` so `qStats[<exercise_id>]` accumulates like Coach-tab attempts.

**3. Run session.** One item at a time, score each, build error pattern map. Use the player's real-life themes from profile (tags from `family-profiles.md`).

**4. Post-session feedback.** Score trend within session, persistent error patterns, specific (not generic) recommendation for next time, score vs recent baseline.

**5. Persist (auto-write)** — `tools/log_exercise.js` (exercise log) + `tools/update_coach_notes.js` (rec_obs, weak_patterns adjustments, phrase_tracker transitions). No preview. Auto-write rationale + capture card + read-out template in `coach-notes-schema.md`. Rich shape per `firestore-schema.md`: `source: "cc_session"`, one `items[]` per scored item, snake_case `matched_pattern_id` aligned with `error_types[]`, `time_to_answer_ms` via Bash (rough OK), `exercise_id`/`exercise_version` null for CC-authored.

**5a. Capture card** — if any stiff/calqued lexical moment surfaced — or a **correct-but-formal** production where the item's context was casual (register-down, CR2) — pair with the natural/casual form + context tag, fold into the same patch (single-session captures land in `recent_observations` only).

**6. Render the player-facing table** using the `exercise-session` template in `coach-notes-schema.md`, then ask "How did it feel? — or skip." Non-blocking.

## Retention probe (Artem, monthly)

When Artem asks for "retention probe" / "monthly probe", or `loop_maintenance` reports probes due: assemble ~15 items per `plans/retention-lane.md` R2 — 5 `probe due` patterns from the weak-spots tracker CLOSED table + 4 untrained same-rule siblings + 3 owned-phrase/🏆-PV cold recalls + 3 due PARKED re-checks. Production formats only, interleaved, **no pattern names shown** (`exercise-types.md` §12). Log as `exercise: "retention_probe"`; at close, report per-pattern probe outcomes so stats-review can retire / regress rows.

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
