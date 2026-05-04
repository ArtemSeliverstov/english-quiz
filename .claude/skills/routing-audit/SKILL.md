---
name: routing-audit
description: Audit learner-shell landing-page routing and batch sizes per player. Use when user says "audit landing", "check routing", "are X being routed to the right exercises", "is COUNT/N items justified", "review batch sizes", or any question about whether learner-shell CTAs surface the right content. Produces alignment table per player + cross-player findings + proposed `learning_path` patches and code edits. Does not auto-apply.
---

# Routing Audit

Verify the learner-shell landing page routes Anna / Nicole / Ernest to content matching their measured weak patterns, and that exercise / turn batch sizes match each player's demonstrated stamina. Output: per-player alignment tables + cross-player findings + proposed `learning_path` patches and `index.html` constant edits.

## Scope

- **In scope**: `ui_shell === 'learner'` (anna, nicole, ernest). Builder-shell (artem, egor) skipped — they navigate the full UI.
- **In scope**: Smart Quiz button (`homeStartQuiz`), Practice routing (`homeStartPractice` → `COACH_PRIORITY`), Coach pre-gen drill pool sizes, Free Write turn cap, Spell-Help threshold, partial-resume trap.
- **Out of scope**: Free Write content/feedback quality (use `stats-review`); per-question edits (use `quiz-development`); deploy mechanics (use `deploy-build`).

## Reads

- `node tools/get_all_players.js -S` — `learning_path`, `coach_notes.weak_patterns`, `catStats`, `exercises[]` (with `planned_total` / `total` / `partial`), `coach_sessions[]` (with `n_messages`), `recentSessions[]` (quiz length history).
- `node tools/get_library_meta.js` — `exercises_library._meta.coverage_by_player` per type per player.
- `index.html` constants — re-read every audit, they shift between sessions:
  - `homeStartQuiz()` → `COUNT` (currently line 4431)
  - `homeStartPractice()` → `COACH_PRIORITY` (currently line 4370), `SPELL_HELP_THRESHOLD` (4251), `PARTIAL_RESUME_MAX_AGE_MS` (4252)
  - `applyLearnerWindowFilter()` → level/category gate logic (4656)
  - `coachState` defaults → `COACH_FW_SOFT_TURN_CAP` (7458)
  - `coachStartType()` → pool composition (8412 — `pool = entire library`, no sub-sample)
- `references/family-profiles.md` — declared level + Learning Goals (design intent vs measured state).

## Workflow

### 1. Pull data

```
node tools/get_all_players.js -S > /tmp/all_stats.json
node tools/get_library_meta.js > /tmp/library_meta.json
```

Snapshot the constants from `index.html` — note the line numbers you read, since they drift.

### 2. Per learner-shell player

**A. Quiz-button alignment** (`homeStartQuiz` → `applyLearnerWindowFilter`)

| Check | How |
|---|---|
| Weak categories vs `active_categories` | List categories with seen ≥20 AND acc <70%. Tag each: ✅ in active / ❌ excluded. **Flag any weak category excluded from active.** [data] |
| `level_cap` vs declared profile level | If profile says B2 but `level_cap: B1`, flag mismatch. [data] |
| Effective pool size | Simulate `applyLearnerWindowFilter` over `ALL_QUESTIONS`: filter to active_categories ∩ level≤cap (∪ stretch), exclude qids already at consec≥3. Flag if effective pool <COUNT (silent FW fallback would fire). [inferred] |
| `COUNT` vs quiz stamina | From `recentSessions[]` (quiz history), median completed quiz length. Flag if COUNT diverges by >50% (under or over). [data] |
| `stretch_allowance` | Flag if unset / 0 — player never sees level-cap+1 items. [data] |
| `mastered_categories` | If empty, the 30-day spaced-review surface is a no-op. Note it. [data] |
| `coming_next` | If undefined, `renderLearnerStats` shows "—". Note as dead surface. [data] |

**B. Practice-button alignment** (`homeStartPractice` → `COACH_PRIORITY` iterate)

| Check | How |
|---|---|
| Routing trace | Walk `COACH_PRIORITY` against this player's `coverage_by_player[type]`. Identify which type wins (first non-empty). [data] |
| Unreachable types | List types with items in player's library but ABSENT from `COACH_PRIORITY` (e.g. `russian_trap`). Cross-check whether any unreachable type maps to a current `weak_patterns` entry — if yes, this is the highest-severity finding. [inferred] |
| Stale partial-resume trap | List partial translations <24h with completion ratio <50% (e.g. 1-item partials of 16-planned). These will auto-trigger via `homeFindPartialTranslation` and may strand the player. [data] |
| Spell-Help threshold | Current value (5). Note recent unique spelling-log captures vs threshold. [data] |
| FW soft cap vs typical | From `coach_sessions` filtered to `mode === 'free_write'`: median `n_messages ÷ 2` (= turn count). Flag if cap (8) is <50% or >200% of typical. [data] |

**C. Coach drill batch size per type**

For each library type with items targeted to this player:

| Field | How |
|---|---|
| Pool size | `coverage_by_player[player][type]` from `_meta`. Note: `coachStartType` runs the entire library — no sub-sampling. [data] |
| Stamina | Among that player's `exercises` of this type, median `total` of fully-completed runs (`partial=false AND total >= planned_total`). [data] |
| Verdict | ✅ pool ≤ 1.5× stamina; ⚠️ pool > 1.5× stamina; ❌ 0/N completions across ≥3 attempts. [inferred] |

**D. Coverage drift inside active window**

Within `active_categories`, compute per-category attempt count. Flag if any one category has >60% of attempts AND another active category has <5% — uneven coverage indicates the player is drilling one slot and starving others. [inferred]

### 3. Cross-player checks

- **COACH_PRIORITY completeness**: list any library types present in `_meta` but absent from `COACH_PRIORITY`. (As of 2026-05: `russian_trap` is unreachable from primary CTA.)
- **PARTIAL_RESUME_MAX_AGE_MS appropriateness**: tally how many ≥3 stale partials sit in the resume window across all players. If common, propose tightening (e.g. require `total >= 2 AND planned_total - total >= 2`).
- **Hint-copy drift**: if proposing per-player `quiz_length`, the `lh-quiz-hint` (currently hardcoded `'10 grammar questions'` at line 4066) must update too.

### 4. Propose adjustments — single table

| Player / Surface | Current | Proposed | Rationale (data) |
|---|---|---|---|
| {anna} learning_path.active_categories | […] | […+Vocabulary, +Grammar] | Vocabulary 37%/n=49, Grammar 50%/n=106 — top weak spots excluded [data] |
| {anna} learning_path.level_cap | B1 | B2 | Profile says B2; recent Coach-tab translations running B2 [data] |
| {anna} COACH_PRIORITY (index.html) | […translation, article_drill, particle_sort, error_correction, spelling_drill] | […translation, **russian_trap**, article_drill, …] | russian_trap addresses dominant L1 calque cluster; 12 items unreachable from primary CTA [inferred] |
| {anna} coach drill caps (index.html) | pool = library size | translation 12, spelling_drill 6 | translation 28 vs ~11 stamina; spelling 16 vs 1.3 actual / 0 completions [data] |
| {ernest} learning_path.quiz_length | (not yet a field) | 20 | 8/8 historical quizzes were 20–30 items, 30-item run completed at 80% [data] |
| {artem} learning_path.fw_turn_cap | (uses default 8) | 16 | Consistently runs 14–17 turns; soft cap fires too early [data] |

### 5. Apply (only on confirmation)

- `learning_path` patches: use `fsPatch` (per `_firestore.js`) with explicit `updateMask.fieldPaths=['learning_path.active_categories', ...]`. **Do not** use `fsSet` on the player root — it's blocked for cross-player contamination prevention.
- `index.html` constant changes: `Edit` tool. Bump version per `references/pre-deploy-checklist.md` (4 locations). Hand off to `deploy-build` for the deploy step.

## Speculation marking

Same evidence tags as `stats-review`:

| Tag | When |
|---|---|
| **[data]** | Direct from a stat field, library count, or constant |
| **[inferred]** | Pattern visible across data; causation unstated |
| **[speculation]** | Interpretation beyond what data shows |

Untagged claims default to [data]. **Never recommend a config change without a [data] anchor** — proposals must cite the specific stat or library count that motivates them.

## Output structure

```
# Routing Audit — {date}

## {Player} (learner-shell)
### A. Quiz button     [table]
### B. Practice button   [routing trace + unreachable types + stale partials + FW cap]
### C. Coach drill batch sizes   [table per type: pool / stamina / verdict]
### D. Coverage drift   [bullets, only if flagged]

## Cross-player checks   [bullets]

## Proposed adjustments   [single table, per surface]

## Apply   [list of patches awaiting confirmation]
```

## Sparse data

- Player with <5 quiz sessions: skip section A's stamina check; flag as sparse and use profile-declared level only.
- Player with 0 coach_sessions of a given type: skip that type's stamina row; recommend "no signal yet" rather than guess.

## Forbidden

- Auto-applying any `learning_path` write or `index.html` edit
- Auditing builder-shell players (artem, egor)
- Confusing weekly target (`EX_WEEKLY_TARGETS`, line 7279) with per-session count — different concepts
- Recommending a per-player cap without supporting completion data
- Touching question content or coach_notes (those are `quiz-development` / `stats-review`)
