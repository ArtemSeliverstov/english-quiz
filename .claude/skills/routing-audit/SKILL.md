---
name: routing-audit
description: Audit learner-shell landing-page routing and batch sizes per player. Use when user says "audit landing", "check routing", "are X being routed to the right exercises", "is COUNT/N items justified", "review batch sizes", or any question about whether learner-shell CTAs surface the right content. Produces alignment table per player + cross-player findings + proposed `learning_path` patches and code edits. Does not auto-apply.
---

# Routing Audit

Verify the learner-shell landing routes Anna, Nicole, Ernest to content matching their weak patterns; verify batch sizes match each player's stamina. Output: per-player tables + proposed `learning_path` patches and `index.html` constant edits.

## Scope

- **In**: `ui_shell == 'learner'`. Smart Quiz (`homeStartQuiz`), Practice (`homeStartPractice` via `COACH_PRIORITY`), Coach drill pool sizes, FW turn cap, Spell-Help threshold, partial-resume.
- **Out**: builder shell (artem, egor); content quality (use `stats-review`); per-question edits (`quiz-development`); deploys (`deploy-build`).

## Reads

- `node tools/get_all_players.js -S` for learning_path, weak_patterns, catStats, exercises[] (planned_total, total, partial), coach_sessions[] (n_messages), recentSessions[].
- `node tools/get_library_meta.js --coverage` for per-player Coach drill pool sizes.
- `index.html` constants (re-read each audit; lines drift): `COUNT` in `homeStartQuiz`; `COACH_PRIORITY`, `SPELL_HELP_THRESHOLD`, `PARTIAL_RESUME_MAX_AGE_MS` in `homeStartPractice`; `applyLearnerWindowFilter`; `COACH_FW_SOFT_TURN_CAP`; `coachStartType` pool composition.
- `references/family-profiles.md` for declared level and Learning Goals.

## Workflow

**1. Pull data.** Both tools above. Snapshot the constants.

**2. Per learner-shell player** produce three tables:

**A. Quiz button**
- Categories with seen >=20 and acc <70%: tag in active or excluded. Flag any weak excluded.
- `level_cap` vs profile level. Flag mismatch.
- Effective pool after filter. Flag if less than COUNT (silent FW fallback).
- COUNT vs median completed quiz length. Flag if diverges over 50%.
- Flag dead surfaces: `stretch_allowance` 0, empty `mastered_categories`, undefined `coming_next`.

**B. Practice button** (walk COACH_PRIORITY against `coverage_by_player`)
- Routing trace: which type wins.
- Unreachable types: in library but NOT in COACH_PRIORITY. Cross-check vs `weak_patterns`; match is highest severity.
- Stale partial-resume: partial translations under 24h with completion under 50% will auto-trigger.
- FW soft cap (8) vs median `n_messages / 2`. Flag if under 50% or over 200%.

**C. Coach drill batch sizes**
- Pool = `coverage_by_player[player][type]` (no sub-sampling).
- Stamina = median `total` of fully-completed runs (`partial=false AND total >= planned_total`).
- Verdict: pool <= 1.5x stamina ok; over 1.5x warn; 0/N completions across 3+ attempts fail.

**D. Coverage drift inside active window** (only if flagged)
- Per-category attempts. Flag if one over 60% AND another under 5%.

**3. Cross-player checks**
- Library types absent from COACH_PRIORITY (e.g. `russian_trap` as of 2026-05).
- PARTIAL_RESUME_MAX_AGE_MS: count stale partials across players.
- Hint-copy drift: `lh-quiz-hint = '10 grammar questions'` hardcoded; per-player COUNT requires hint update.

**4. Propose adjustments** in a single table:
| Player / Surface | Current | Proposed | Rationale (data) |

**5. Apply (only on confirmation)**
- `learning_path`: `fsPatch` with explicit `updateMask.fieldPaths`. Never `fsSet` on player root.
- `index.html`: `Edit`, then hand off to `deploy-build`.

## Speculation marking

**[data]** stat or constant; **[inferred]** pattern visible; **[speculation]** beyond data. Untagged = [data]. Never recommend a config change without a [data] anchor.

## Output structure

```
# Routing Audit, {date}

## {Player}
### A. Quiz button         [table]
### B. Practice button     [trace, unreachable, stale, FW cap]
### C. Coach drill batches [table]
### D. Coverage drift      [if flagged]

## Cross-player checks
## Proposed adjustments    [table]
## Apply                   [awaiting confirmation]
```

## Sparse data

Under 5 quiz sessions: skip stamina, use profile level. Zero coach_sessions of a type: mark "no signal yet".

## Forbidden

- Auto-applying `learning_path` writes or `index.html` edits
- Auditing builder-shell players
- Confusing `EX_WEEKLY_TARGETS` (per-week) with per-session count
- Recommending a per-player cap without supporting completion data
