---
name: mistakes-review
description: Daily review of every quiz mistake from the past 31h. Classify each as a genuine learner gap or a question-quality bug, confirm the question is profile-relevant for at least one player, propose fixes for any quality bugs, and sweep sibling questions for the same defect. Use when user says "review mistakes", "check yesterday's mistakes", "mistakes review", or when the daily scheduled task fires.
---

# Mistakes Review

Triage every quiz mistake logged in the past 31h. Output: per-mistake verdict + a fix-proposal table. No auto-apply — user runs `quiz-development` to land any fixes.

## Reads

- `node tools/get_recent_mistakes.js --pretty` — primary input. One block per (player, qid) mistake with question metadata + `lastWrong` text.
- `index.html` — for sibling questions and category context.
- `references/family-profiles.md` — level + per-player theme tags for the relevance check.
- `references/question-authoring-standards.md` — stem-sufficiency test, anti-patterns.
- `references/bug-log.md` — grep the prefix or category before proposing a fix.

## Workflow

**1. Pull data.** `node tools/get_recent_mistakes.js --pretty`. Empty → one-liner "No mistakes in past 31h" and stop.

**2. Classify each mistake.** First match wins:

| Verdict | Trigger |
|---|---|
| `genuine` | `lastWrong` shows a real L1-interference or knowledge error matching the question's target pattern. Most land here. |
| `bug:alt-answer` | `lastWrong` is grammatically correct and pragmatically equivalent to the keyed answer — `ans` should be widened. |
| `bug:stem` | Stem permits more than one reading; `lastWrong` matches a non-target reading. Stem-sufficiency test fails. |
| `bug:keyword` | Transform with `keyword` not enforced or missing from stem context. Confirm with `node tools/check_transform_keywords.js`. |

MCQ/gap `lastWrong` resolves to the chosen option text (`q._lastPlayerAnswer = q.opts[i]` in the play loop) — treat as `[data]`. Only legacy `index=N` with no resolved text → `[speculation]`.

**3. Profile-relevance check** (every mistake):

- Question lvl > player's profile defaults → `routing` (surface, but `routing-audit` territory — no fix here).
- Generic stem or wrong register for the served player → `bug:theme`.
- No served player matches the question's profile → `bug:orphan` (retire or rewrite).

**4. Fix-proposal table** (one row per bug verdict; skip empty groups):

| qid | player(s) | verdict | evidence | proposed change |
|---|---|---|---|---|
| {qid} | {p,…} | {verdict} | direct quote of `lastWrong` OR `[speculation]` | concrete edit |

Evidence quotes `lastWrong` verbatim. No verbatim → row is informational, no fix.

**5. Sibling sweep** (only when ≥1 fix proposed). Per fixed qid: grep prefix and `cat`, read 5–10 siblings, list any with the same defect under `## Sibling sweep — prefix {prefix}` using verdict `bug:sibling`.

**6. Output the report.** Markdown only — no file writes, no Firestore writes.

## Output structure

```
# Mistakes Review — {YYYY-MM-DD}

Pulled {N} mistakes across {players} for the past 31h.

## Genuine gaps        [N]
- `qid (player) — one-line note`

## Quality bugs        [N]
[fix table from step 4]

## Routing flags       [N — if any]

## Sibling sweep       [if any fix proposed]

## Summary
- Genuine: N · Bugs: N (alt-answer M / stem K / keyword L / theme P / orphan Q) · Routing: N · Siblings: N
- Next action: {`quiz-development` to land K fixes | none}
```

## Speculation marking

Same tags as `stats-review`: **[data]** = direct from `lastWrong` (incl. resolved MCQ text); **[inferred]** = pattern across mistakes; **[speculation]** = beyond data. Untagged = [data].

## Sparse data

Zero mistakes: one-liner, stop. Under 3: skip the sibling sweep.

## Forbidden

- Auto-applying any `index.html` edit.
- Promoting `[speculation]` to a proposed fix.
- Reviewing supplementary `exercises[]` items here — that's `stats-review`. The tool already filters them out.
