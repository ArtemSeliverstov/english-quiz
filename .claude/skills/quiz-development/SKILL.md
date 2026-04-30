---
name: quiz-development
description: Add, fix, or audit questions in the english-quiz bank. Use when user says "add questions", "fix question X", "audit category Y", "improve question quality", or any question authoring/editing task. Includes batch additions, single fixes, and quality audits.
---

# Quiz Development

You are working on the question bank. The bank lives inline in `index.html` as
`const ALL_QUESTIONS = [...]`. **Do not externalize.** (See `references/design-decisions.md` —
s78 attempt rolled back.)

## Reads required before starting

1. **`references/question-schema.md`** — schema, ID conventions
2. **`references/question-authoring-standards.md`** — type hierarchy, hint/exp format, anti-patterns, per-question checklist
3. **`references/coverage-matrix.md`** — current priorities, per-category input share
4. **`references/bug-log.md`** — for the type of question being edited (search for prefix or category)

## Workflow

### Adding new questions

1. **Identify priority** — read `references/coverage-matrix.md` and `references/roadmap.md`.
   Pick highest-priority gap that matches today's session intent.
2. **Find next IDs** — grep `index.html` for the prefix. Continue from highest existing
   number. Never reuse retired IDs (see `question-schema.md` § ID Conventions).
3. **Show proposed table** — for review BEFORE applying any edit. Format:
   ```
   | New ID | Type | Q | A | Notes |
   |---|---|---|---|---|
   | pv_p2_01 | input | She had to ___ the meeting. | call off | (2 words — past tense) postpone |
   | ... | ... | ... | ... | ... |
   ```
4. **Wait for approval** — Artem will say go, modify, or reject items
5. **Apply edits** — use `str_replace` for single inserts, more careful patches for batch
6. **Run per-question checklist** on each new entry (see `question-authoring-standards.md`)
7. **Update LEVEL_TOTALS / CAT_TOTALS** in `renderCoverage()` and `playerCoverageHTML()`
8. **Update per-category input share table** in source if input share shifted

### Fixing single questions

1. **Pull mistake data first**: `node tools/get_question_mistakes.js <qid> [<qid>...]`.
   Reports `qStats[qid].lastWrong` from every player who's seen it. If unavailable
   (MCQ index logging gap), note this — diagnoses without the actual error are
   flagged as `[speculation]` in the audit (see `stats-review` skill for the tag
   semantics).
2. Read the question, surrounding context, and bug log.
3. Diagnose using the **stem sufficiency test** (see
   `references/question-authoring-standards.md` § "Stem sufficiency test")
   and the authoring-standards checklist.
4. Show proposed fix as a table with required columns: **evidence** (direct
   mistake quote, or `[speculation]` if no log) and **confirmation** (strong /
   weak / none).
5. Apply only items at confirmation = strong by default. Items at weak/none
   require explicit user opt-in or deferral pending better data.

#### Audit output template (required)

| qid | severity | evidence | confirmation | action |
|---|---|---|---|---|
| {id} | high/med/low | direct quote OR `[speculation]` | strong / weak / none | {fix or defer} |

### Category audit

Triggered by stats showing low accuracy in a category, or by Artem explicitly requesting.

1. Read `references/coverage-matrix.md` for category context
2. Pull all questions in the category from `index.html`
3. For each: run authoring checklist, flag issues
4. Categorize issues by type (stem ambiguity, options plausibility, exp adequacy, level)
5. Show summary table BEFORE proposing any fixes
6. Proceed to fixes only after Artem reviews the audit

### Special category checks

- **Articles** — `references/question-authoring-standards.md` § "Articles — additional checks (S84)"
- **Transform** — keyword must NOT appear in source/stem; source + keyword fields required
- **Multi-blank** — re-entry guard mandatory (see `references/bug-log.md`)
- **Everyday English** — MCQ default ~40%, register-inappropriate (not ungrammatical) wrong options

## Pre-deploy

After any question changes, **always** run `references/pre-deploy-checklist.md` before
git push. The checklist is canonical — don't skip steps.

## Forbidden

- Touching `ALL_QUESTIONS` without showing a proposed table first
- Externalizing questions to Firestore (s78 lesson)
- Using `stem:` field name (use `q:`)
- Using string `ans` for gap/mcq (must be integer index)
- Using non-canonical exercise names in deeplinks
- Pushing without running pre-deploy checks
- Bumping version inconsistently across the four locations

## Output

After a successful session that adds/changes questions:
1. The new/changed questions in `index.html`
2. Updated coverage constants
3. Updated input share table (if applicable)
4. New entry in `references/version-log.md` (one section, 3-5 bullets)
5. Updates to `references/bug-log.md` if a new bug was found+fixed
6. Updates to `references/design-decisions.md` if a new standard was set
7. Git commit with version-stamped message
