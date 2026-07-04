# Weekly Slots — Artem

Artem's weekly supplementary exercise plan. 12 slots per week (slot #12 "Hallway talk —
casual register" added 2026-07-04, conversational-register lane CR4). The other players
have lighter `EX_WEEKLY_TARGETS` entries (Anna 4, Nicole 6, Ernest 4; Egor none) but work
player-initiated — only Artem's slots are actively scheduled and reviewed here.

Plus one **monthly** CC-side slot (first week of the month): `retention_probe` — the
~15-item mixed retention block per `plans/retention-lane.md`. Not in `EX_WEEKLY_TARGETS`
yet (CC-side only); `tools/loop_maintenance.js` reports when probes are due.

## Slots

The slot definitions live in `index.html` as `EX_WEEKLY_TARGETS` array. Each slot has:
- `type` — exercise type expected
- `topic` — what the slot is for
- `level` — B1/B2/C1

When an exercise session is logged via deeplink, the PWA's `slotMatches()` function
finds the first slot of the matching type and topic and marks it done for the week.

## Slot-matching subtlety

`article_drill` slots match `error_correction` exercises whose topic contains "article"
(historical fallback rule from s84). `particle_sort` slots match `transform` exercises
whose topic contains "particle".

**Going forward**: deeplinks for article drill sessions should use `exercise: "article_drill"`
explicitly (not `error_correction`); particle sort should use `exercise: "particle_sort"`.
The fallback rule remains for backward-compat with old logs.

## Adjustments after stats

Slot composition is reviewed after any major stats analysis. Recent additions:
- Article Decision Drill — added in 2026 after article weakness diagnostic
- PV Family Drill rotation (GET → TURN → BRING/COME → SET/TAKE) — for PV production gap

When proposing slot changes, work with `EX_WEEKLY_TARGETS` directly in `index.html`.
Update version number on commit.

## Why only Artem

Artem is the most active user and benefits from structured planning. Anna, Nicole,
Ernest, and Egor work better with player-initiated sessions (Egor has exercise parity
since 2026-05-06 but no weekly targets) — see `family-profiles.md`.
