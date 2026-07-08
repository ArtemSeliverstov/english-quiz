---
name: stats-review
description: Analyze player stats from Firestore or uploaded JSON. Use when user uploads family_stats_ai JSON, says "review stats", "analyse Anna's progress", "what should we focus on next for Artem", or any data-driven analysis request. Produces coverage review and proposes coach_notes updates.
---

# Stats Review

Identify patterns, weak spots, adjustments. Output: structured review + ≤2 new `coach_notes` proposals per player (removals/deferrals don't count).

## Reads

- `.claude/skills/stats-review/PROTOCOL.md` — **the step protocol. Read it NOW, before anything else.**
- `node tools/get_all_players.js -S` — 5 player docs + subcollections (or uploaded JSON)
- `references/family-profiles.md` — stable profile + focus
- `references/coverage-matrix.md` — category targets
- `references/coach-notes-schema.md` — update protocol, promotion rule, phrase-tracker lifecycle
- `references/stats-interpretation-guide.md` — act-on/ignore rules, engagement, compromised categories
- `progress/phrasal-verbs-tracker.md` (Artem), `progress/phrasal-verbs-tracker-anna.md` (Anna) — per-PV status; methodology in Artem's file
- `progress/natural-phrases-tracker-{name}.md` × 5 — **generated** views of `phrase_tracker`; regen via `update_coach_notes.js --regen-tracker-md`
- `progress/exercise-domain-map-artem.md` (Artem) — **generated** program view; regen per its self-contained recipe (PROTOCOL step 8a)
- `tools/mistake_verdicts.json` — open `bug:*` qids to exclude from gap evidence

## Workflow (mandatory)

Execute PROTOCOL.md steps **0–8a in order** — integrity gate → pull → signal selection →
profile context → coverage (window-partitioned, bug-qids excluded) → per-qid audit →
session-id reconciliation → synthesis → pattern-id reuse → proposals (≤2/player,
ridge-characterised, confirm-first) → action recs → phrase-tracker maintenance (auto) →
signals promotion via `promote_signals.js` + weak_patterns audit (cap 8) → weak-spots
tracker regen for Artem (auto, per `weak-spots-rubric.md`) → exercise domain-map regen
for Artem (auto, 8a). Do not run from memory; do not skip 0, 6, 7, 8, or 8a.

## Speculation marking

Every claim tagged **[data]** / **[inferred]** / **[speculation]**; untagged = [data].
`weak_patterns` accepts only [data]/[inferred]; [speculation] stays in
`recent_observations`. Profile edits require [data].

## Output structure

```
# Stats Review — {date}
## Pending · Watchlist
## {Player}  [level_cap · window (N) · volume (31d)]
### Coverage        in-window primary; out-of-window one line
### Trends · Register · Persistent patterns · Quality flags
### Proposed coach_notes updates   [ridge per 4b — await confirmation]
### Action recommendations
```

## Sparse data

<5 sessions: flag explicitly, keep recommendations cautious. Don't over-interpret 3 data points.

## Forbidden

- Sensitive observations (mental health, crises) unprompted
- Restating canonical stats (`lvlStats`/`catStats`) in notes
- Single-qid or single-session evidence → `weak_patterns` (qid → `stuck_questions`; category needs ≥3 qids <60% or a pattern across ≥2 sessions; designed-discovery instruments excepted per PROTOCOL 4b)
- Out-of-window weakness → `weak_pattern` for learner-shell (route per PROTOCOL 4a)
- Re-emitting prior recs — list under 'Pending'
- Cross-player findings on personal profiles — question-bank notes instead
- Generic recommendations — every rec cites specific data
