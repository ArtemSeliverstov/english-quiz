# Conversational-register lane (CR1–CR4)

**Status**: shipped 2026-07-04 (decision 2026-07-03; CR1–CR4; PWA deploy v20260704 + worker redeploy)
**Owner**: Artem (builder-shell; learner-shell players already live in conversational
register via Free Write — this lane exists for the one player whose English was
acquired through text)
**Companions**: `docs/audience-profiles.md` §1 (register acquisition profile),
`references/design-decisions.md` (why this displaced `collocation_precision`),
`references/register-rubric.md` (measurement), `plans/open-items.md` T2 (build record)

## Why

Artem's English was acquired almost entirely through written business/non-fiction.
Spoken-casual register is an **absent variety, not an error class** — the correction
machinery (register_mismatch, register-check, execution-slips) can only fix misuse of
registers he possesses. An absent variety needs **input** (someone modeling it) and
**low-stakes production** in it. Evidence at ship time: Register = worst quiz category
(40%, n=15); zero Artem `register_rubric` data; capture channels polarity-blind to
correct-but-formal output; the PV production gap partly the same phenomenon.

## Shipped components

- **CR1 · Casual-mode Free Write** — `free-write` skill: "hallway/pub mode"
  (triggers: "casual free write", "pub mode", "hallway talk"). Coach models informal
  register (contractions, PVs over Latinate, discourse markers, response tokens, vague
  language); correction polarity flips — *correct-but-formal* is the primary catch.
  `register_rubric` now REQUIRED on every CC free-write log (both modes) — ends the
  rubric data drought; `register_match` graded against the session's context.
- **CR2 · Register-down capture polarity** — free-write, exercise-session (capture
  card), and register-check now capture grammatically-correct-but-over-formal
  productions as swaps (`formal → casual [brit_expat]`). Sequenced after T1 pool
  hygiene (priority + aging + 💤 dormant) so the widened intake stays bounded.
- **CR3 · `conversational_register` catalog topic #7** — worker ladder (T1 recognize
  register triples → T2 re-register down → T3 sustain casual in scenario; "correct
  grammar in the wrong register does not pass the tier") + PWA
  `COACH_WEAK_SPOTS_CATALOG` row mapping `cat: Register` — **P1 routing now works for
  the worst quiz category**. CC parity automatic (weak-spots-session reads the worker
  catalog).
- **CR4 · Weekly slot #12** — "Hallway talk — casual register" (`free_write`, med
  priority) in `EX_WEEKLY_TARGETS.artem`; `weekly-slots.md` updated.

## Measurement

`register_rubric` (chunk_density, register_match, calque_count,
discourse_marker_variety) aggregated in stats-review. CR1 establishes the baseline
*before* CR3 sessions accumulate — trend claims about the lane wait for ≥3 rubric'd
sessions. Register quiz category (n=15) grows via the roadmap authoring backlog.

## Deferred

- PWA-side casual FW mode (worker prompt variant) — Artem's FW is CC-side; build for
  the family only if a learner shows the same literate-bias profile.
- `shadow_feedback` clips in casual register — the listening half; rides the
  shadow_feedback build (`plans/audio-coach-pipeline.md`), after T5 rubric aggregation.
- `collocation_precision` topic (business half) — deferred with trigger in
  `plans/open-items.md`.
