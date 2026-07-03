# Retention lane — periodic testing of closed weak spots + adjacent areas

**Status**: shipped 2026-07-03 (R1–R5 encoded; first probe due immediately — 4 patterns overdue at ship time)
**Owner**: Artem · builder-shell only (learner-shell players get retention through the active-window mastered-review mechanic instead)
**Companions**: `references/weak-spots-rubric.md` (lifecycle + scoring), `progress/weak-spots-tracker-artem.md` (probe dates live in the CLOSED/maintenance table), `references/exercise-types.md` §12 (probe format), `references/coach-notes-schema.md` (phrase lifecycle)

## Why

The acquisition loop closes patterns and then never looks at them again: CLOSED was
terminal, owned phrases and 🏆 PVs were never re-sampled, and the system's own data
(double-genitive, 2026-07-01) showed passive re-tests overstating retention. For a
45-year-old aiming at multi-year retention, closure without scheduled retrieval is
where regression hides. Doctrine check: no new surface (`learning-system-design.md`
§6) — everything folds into existing sessions; probes are unlabeled and interleaved.

## R1 — lifecycle past CLOSED

CLOSED → **maintenance** with expanding production probes: **+2w → +6w → +4m** from
close date. Two clean *production* probes at distance → **retired** (enters the
lifetime sample pool, R4). Any probe miss → pattern returns to NEXT with a
`regressed` tag. Probe dates live in the tracker's CLOSED table as machine-readable
`probe due YYYY-MM-DD` cells; `stats-review` PROTOCOL step 8 computes them on regen;
`tools/loop_maintenance.js` counts overdue ones daily.

## R2 — monthly mixed retention probe (~15 items, first week of month)

Run as `exercise-session` type `retention_probe` (`exercise-types.md` §12). Composition:

| Items | Source |
|---|---|
| 5 | closed/maintenance patterns due per R1 — production format only, ≥2 formats across cycles |
| 4 | **near-transfer siblings** — same rule family, untrained frames (R3) |
| 3 | cold recall from owned phrases (`phrase_tracker` 🏆/owned) + 🏆 PVs, random sample |
| 3 | PARKED re-checks that happen to be due |

Interleaved order, **no skill labels** (cold-production validity), one score line to
`recent_observations` + normal `exercises/{ts}` log. Composition is mechanical from
tracker + phrase/PV pools — assembled by the skill at session start.

## R3 — sibling rule for retirement

A pattern retires only if ≥1 probe hit an *untrained sibling* (same rule, new lexical
frame — e.g. than/that closed → probe other чем-family traps). Pass-exemplar +
fail-sibling = "generalisation gap" → back to NEXT with that tag.

## R4 — lifetime sampling of owned material

The 2–3 owned-phrase/🏆-PV items in every monthly probe. A miss auto-demotes via the
existing failed-retest mechanic (`coach-notes-schema.md` phrase lifecycle; PV decay
rule in `progress/phrasal-verbs-tracker.md`).

## R5 — production-first evidence rule

Passive/recognition re-tests never count as retention evidence (encoded in
`weak-spots-rubric.md`). Probes are production format: translation, cold
error-correction, free construction.

## Deliberately deferred

- `retention_log` structured trend store — `exercises/{ts}` rows + tracker history
  suffice until trend lines are actually wanted.
- PWA slot tile for the probe (`EX_WEEKLY_TARGETS` #12) — CC-side only for now; add
  to the PWA at the next index.html deploy if the habit sticks.
- Learner-shell retention probes — their mastered-category ~30-day review covers the
  need at their volume; revisit if a learner reaches sustained high volume.
