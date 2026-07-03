---
name: mistakes-review
description: Daily review of every quiz mistake from the past 31h. Classify each as a genuine learner gap or a question-quality bug, confirm the question is profile-relevant for at least one player, propose fixes for any quality bugs, and sweep sibling questions for the same defect. Use when user says "review mistakes", "check yesterday's mistakes", "mistakes review", or when the daily scheduled task fires.
---

# Mistakes Review

Triage every quiz mistake from the past 31h. Output: per-mistake verdict + fix-proposal table. No auto-apply — run `quiz-development` to land fixes.

## Reads

- `node tools/get_recent_mistakes.js --pretty` — primary input. One block per (player, qid) mistake with question metadata + `lastWrong` text.
- `tools/mistake_verdicts.json` — verdict ledger; open entries are already triaged.
- `index.html` — siblings + category context.
- `references/family-profiles.md` — level + per-player theme tags for the relevance check.
- `references/question-authoring-standards.md` — stem-sufficiency test, anti-patterns.
- `references/bug-log.md` — grep prefix/category before proposing a fix.

## Workflow

**0. Loop tripwire.** `node tools/loop_maintenance.js`. Quote its summary line at the top of the report; when it says "run stats-review", surface that explicitly — a stalled consolidation loop is a finding, not noise.

**1. Pull data.** `node tools/get_recent_mistakes.js --pretty`. Empty → one-liner "No mistakes in past 31h" and stop. Drop qids with an **open** ledger entry — list them in one line ("previously triaged: qid × verdict") instead of re-classifying.

**2. Classify each mistake.** First match wins:

| Verdict | Trigger |
|---|---|
| `genuine` | `lastWrong` shows a real L1-interference or knowledge error matching the question's target pattern. Most land here. |
| `bug:alt-answer` | `lastWrong` is correct and equivalent to the keyed answer — widen `ans`. |
| `bug:stem` | Stem permits >1 reading; `lastWrong` matches a non-target one. Stem-sufficiency fails. |
| `bug:keyword` | Transform with `keyword` not enforced or missing from stem context. Confirm with `node tools/check_transform_keywords.js`. |

MCQ/gap `lastWrong` = chosen option text (`q.opts[i]`) → `[data]`. Legacy `index=N` with no resolved text → `[speculation]`.

**3. Profile-relevance check** (every mistake):

- Question lvl > player's profile defaults → `routing` (`routing-audit` territory — no fix here).
- Generic stem or wrong register for the served player → `bug:theme`.
- No served player matches the question's profile → `bug:orphan`.

**4. Fix-proposal table** (one row per bug verdict; skip empty groups):

| qid | player(s) | verdict | evidence | proposed change |
|---|---|---|---|---|
| {qid} | {p,…} | {verdict} | direct quote of `lastWrong` OR `[speculation]` | concrete edit |

Evidence quotes `lastWrong` verbatim. No verbatim → row is informational, no fix.

**5. Sibling sweep** (only when ≥1 fix proposed). Per fixed qid: grep prefix, read 5–10 siblings, list same-defect ones under `## Sibling sweep — {prefix}` as `bug:sibling`.

**6. Signals promotion check** (read-only). `promote_signals.js all --list` → surface not-covered `count≥2` as `## Signals ready to promote`; recommend promotion (`--apply` with a composed label, or `stats-review`). Details in `coach-notes-schema.md`.

**7. Persist verdicts.** Append every NEW classification to `tools/mistake_verdicts.json` (`{qid, verdict, players, evidence, date, fixed: false}`; `genuine` rows too — they stop tomorrow's re-triage). Mechanical ledger append is the only allowed write.

**8. Output the report.** Markdown otherwise — no other file writes, no Firestore writes.

## Output structure

```
# Mistakes Review — {YYYY-MM-DD}

{loop_maintenance summary line}
Pulled {N} mistakes across {players} for the past 31h. Previously triaged (open): {M}.

## Genuine gaps        [N]
- `qid (player) — one-line note`

## Quality bugs        [N]
[fix table from step 4]

## Routing flags       [N — if any]

## Signals ready to promote  [if any]

## Sibling sweep       [if any fix proposed]

## Summary
- Genuine: N · Bugs: N (alt M / stem K / keyword L / theme P / orphan Q) · Routing: N · Siblings: N
- Next: {`quiz-development` to land K fixes | none}
```

## Speculation marking

Tags as `stats-review`: **[data]** = from `lastWrong` (incl. resolved MCQ text); **[inferred]** = cross-mistake pattern; **[speculation]** = beyond data. Untagged = [data].

## Sparse data

Zero mistakes: one-liner, stop. Under 3: skip the sibling sweep.

## Forbidden

- Auto-applying any `index.html` edit.
- Writing anything beyond the `tools/mistake_verdicts.json` append.
- Promoting `[speculation]` to a proposed fix.
- Reviewing supplementary `exercises[]` items here — that's `stats-review`. The tool already filters them out.
