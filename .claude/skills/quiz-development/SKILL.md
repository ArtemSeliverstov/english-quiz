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
- `references/bug-log.md` — for the prefix or category being edited

## Adding new questions

1. **Identify priority** from `coverage-matrix.md` and `roadmap.md`. Pick highest-priority gap matching today's intent.
2. **Find next IDs** by grepping the prefix. Continue from highest existing number. Never reuse retired IDs.
3. **Show proposed table** for review BEFORE any edit:
   ```
   | New ID | Type | Q | A | Notes |
   |---|---|---|---|---|
   | pv_p2_01 | input | She had to ___ the meeting. | call off | (2 words — past tense) postpone |
   ```
4. **Wait for approval.** Artem will say go, modify, or reject items.
5. **Apply edits** with `str_replace`. Per-batch: more careful patches.
6. **Per-question checklist** (`question-authoring-standards.md`) on each entry.
7. **Update LEVEL_TOTALS / CAT_TOTALS** in `renderCoverage()` and `playerCoverageHTML()`.
8. **Update per-category input share table** if input share shifted.

## Fixing single questions

1. **Pull mistake data first**: `node tools/get_question_mistakes.js <qid>`. Reports `qStats[qid].lastWrong` per player. If unavailable (MCQ index gap), mark the diagnosis `[speculation]`.
2. Read the question, surrounding context, bug-log entries.
3. Diagnose using the **stem sufficiency test** (`question-authoring-standards.md` § that section).
4. Show proposed fix as a table with **evidence** (direct quote or `[speculation]`) and **confirmation** (strong / weak / none) columns.
5. Apply only at confirmation = strong by default. Weak/none requires explicit opt-in or defer pending data.

Audit output template:

| qid | severity | evidence | confirmation | action |
|---|---|---|---|---|
| {id} | high/med/low | direct quote OR `[speculation]` | strong/weak/none | {fix or defer} |

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

Always run `references/pre-deploy-checklist.md` before push. The CI workflow runs the same linters (`tools/lint_questions.js` + `tools/check_transform_keywords.js`) on every push as a backstop.

## Forbidden

- Touching `ALL_QUESTIONS` without showing a proposed table first
- Pushing without running pre-deploy checks

(Schema-level prohibitions — `stem:` field, string ans for gap/mcq, non-canonical type names — are caught by `tools/lint_questions.js`. Don't need to repeat here.)

## Output

After a successful authoring session:

1. New/changed questions in `index.html`
2. Updated `LEVEL_TOTALS` / `CAT_TOTALS`
3. Updated input share table (if applicable)
4. New entry in `version-log.md` (3–5 bullets)
5. `bug-log.md` entry if a new bug was found+fixed
6. `design-decisions.md` entry if a new standard was set
7. Git commit with version-stamped message
