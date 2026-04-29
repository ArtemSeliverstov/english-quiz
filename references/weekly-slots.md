# Weekly Slots — Artem

Artem's weekly supplementary exercise plan. 11 slots per week. Other family members
do not have a structured slot plan — they work player-initiated.

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
Ernest, and Egor work better with player-initiated sessions or no exercise sessions
at all (Egor) — see `family-profiles.md`.
