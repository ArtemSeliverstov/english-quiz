---
name: quiz-development
description: Add, fix, or audit questions in the english-quiz bank. Use when user says "add questions", "fix question X", "audit category Y", "improve question quality", or any question authoring/editing task. Includes batch additions, single fixes, and quality audits.
---

# Quiz Development

The bank lives inline in `index.html` as `const ALL_QUESTIONS = [...]`. Don't externalise.

## Reads

- `references/question-schema.md` — schema, ID conventions, retired IDs
- `references/question-authoring-standards.md` — type hierarchy, hint/exp format, anti-patterns, per-question checklist
- `references/coverage-matrix.md` — current priorities, per-category input share
- `references/family-profiles.md` — target players' theme tags. Every stem must use a tagged real-life context. → `operational-rules.md` "generic exercise sentences"
- `references/bug-log.md` — for the prefix or category being edited

## Adding new questions

1. **Identify priority** from `coverage-matrix.md` and `roadmap.md`. Pick highest-priority gap matching today's intent.
2. **Identify target player(s)** and pull their theme tags from `family-profiles.md`. Every stem must sit in one of those tags. Generic stems (unnamed pronouns, no real-life context, "the man went to the shop") are rejected pre-table.
3. **Find next IDs** by grepping the prefix. Continue from highest existing number. Never reuse retired IDs.
4. **Show proposed table** for review BEFORE any edit (Theme column shows the chosen tag):
   ```
   | New ID | Type | Theme | Q | A | Notes |
   |---|---|---|---|---|---|
   | pv_p2_01 | input | [biz_oil] | She had to ___ the board meeting after Q3 missed forecast. | call off | (2 words — past tense) postpone |
   ```
5. **Wait for approval.** Artem will say go, modify, or reject items.
6. **Apply edits** with `str_replace`. Per-batch: more careful patches.
7. **Per-question checklist** (`question-authoring-standards.md`) on each entry.
8. **Update LEVEL_TOTALS / CAT_TOTALS** in `renderCoverage()` and `playerCoverageHTML()`.
9. **Update per-category input share table** if input share shifted.

## Fixing single questions

1. **Pull mistake data first**: `node tools/get_question_mistakes.js <qid>`. Reports `qStats[qid].lastWrong` per player. MCQ/gap entries resolve to the chosen option text — treat as `[data]`. Only legacy `index=N` with no resolved text → `[speculation]`.
2. Read the question, surrounding context, bug-log entries.
3. Diagnose using the **stem sufficiency test** (`question-authoring-standards.md` § that section).
4. **Stem rewrites** must use a theme tag of at least one player who saw the question (per `family-profiles.md`). Generic rewrites rejected.
5. Show proposed fix as a table with **evidence** (direct quote or `[speculation]`) and **confirmation** (strong / weak / none) columns.
6. Apply only at confirmation = strong by default. Weak/none requires explicit opt-in or defer pending data.

## Category audit

1. Read `coverage-matrix.md` for category context
2. Pull all questions in the category from `index.html`
3. Per question: run authoring checklist, flag issues
4. Categorise (stem ambiguity, options plausibility, exp adequacy, level)
5. Show summary table BEFORE proposing fixes
6. Proceed to fixes only after Artem reviews the audit

## Special category checks

- **Articles** — `question-authoring-standards.md` § "Articles — additional checks (S84)"
- **Transform** — `tools/check_transform_keywords.js` enforces: keyword in every accepted ans, keyword not a whole word in stem
- **Multi-blank** — re-entry guard mandatory (see `bug-log.md`)
- **Everyday English** — MCQ default ~40%, register-inappropriate (not ungrammatical) wrong options

## Pre-deploy

Run `references/pre-deploy-checklist.md` before push. CI re-runs `tools/lint_questions.js` + `tools/check_transform_keywords.js` as a backstop.

## Forbidden

- Touching `ALL_QUESTIONS` without showing a proposed table first
- Pushing without running pre-deploy checks

## Output

After a successful authoring session:

1. New/changed questions in `index.html`
2. Updated `LEVEL_TOTALS` / `CAT_TOTALS`
3. Updated input share table (if applicable)
4. New entry in `version-log.md` (3–5 bullets)
5. `bug-log.md` entry if a new bug was found+fixed
6. `design-decisions.md` entry if a new standard was set
7. Git commit with version-stamped message
