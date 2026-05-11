---
name: stats-review
description: Analyze player stats from Firestore or uploaded JSON. Use when user uploads family_stats_ai JSON, says "review stats", "analyse Anna's progress", "what should we focus on next for Artem", or any data-driven analysis request. Produces coverage review and proposes coach_notes updates.
---

# Stats Review

Analyse player stats to identify patterns, weak spots, and adjustments. Output: structured review + ≤2 new `coach_notes` proposals per player (removals + deferrals don't count).

## Reads

- `node tools/get_all_players.js -S` — 5 player docs + subcollections (or uploaded JSON)
- `references/family-profiles.md` — profile + focus
- `references/coverage-matrix.md` — category targets
- `references/coach-notes-schema.md` — update protocol + promotion rule + phrase tracker lifecycle
- `references/stats-interpretation-guide.md` — what to act on / ignore, engagement signals, structurally-compromised categories
- `progress/phrasal-verbs-tracker.md` (Artem), `progress/phrasal-verbs-tracker-anna.md` (Anna) — refresh per-PV status; methodology in Artem's file
- `progress/natural-phrases-tracker-{name}.md` × 5 — **generated** views of `players/{name}.phrase_tracker`. Regenerate via `update_coach_notes.js --regen-tracker-md`. Never hand-edit.

## Workflow

**0. Integrity check.** Run `node tools/check_player_integrity.js`. Exit 0 = proceed; exit 1 = **stop and surface to user**. Three invariants probe for contamination (cross-player `qStats`, `createdAt` drift, `totalAnswered` jumps).

**1. Pull stats.** Run `get_all_players.js -S` (or `get_player.js {name}` for deep-dive). Filter `auto_suspected: true` sessions before aggregation.

**1a. Signal selection.** Streak fields = recency; subcollections = volume/accuracy. Filter `exercises[]` on `ex.ts`, `coach_sessions[]` on `cs.created`. Pre-Option-D: subcollection wins on disagreement.

**2. Coverage review per player.** For each: category breakdown, type distribution, trends vs prior session, persistent weak spots (<70% across 3+ sessions), stuck questions (100% error rate), quality flags (≥60% error across 3+ players).

**2.5. Per-question mistake audit** for any flagged item. Pull `qStats[qid].lastWrong` from every player who's seen it via `node tools/get_question_mistakes.js <qid>`. The actual mistake is the highest-value signal. MCQ index may resolve to `<no log>` — if unavailable, mark `[speculation]`.

**3. Synthesise patterns.** New weak patterns confirmed across 2+ sessions, resolved weaknesses, engagement shifts, L1 interference, recognition vs production gaps (high MCQ, low input).

**4. Propose coach_notes updates.** Per player, ≤2 new patterns/observations (removals + deferrals don't count). First scan prior `recent_observations` for unactioned recs → 'Pending from prior round' (don't re-emit). Single-point items → 'Watchlist' (not stored). Protocol in `coach-notes-schema.md`.

**5. Action recommendations.** Don't apply here — this skill produces, the user triggers `quiz-development` or `exercise-session` to act.

**6. Phrase tracker maintenance** (auto, after step-4). Per player: apply lifecycle transitions from `coach_sessions`, surface retest-due, then `update_coach_notes.js {name} <patch.json> --regen-tracker-md`.

## Speculation marking — mandatory

Every claim carries an evidence tag: **[data]**, **[inferred]**, **[speculation]**. Untagged defaults to [data]. `weak_patterns` accepts only [data]/[inferred]; [speculation] stays in `recent_observations` as `{"note": "[speculation] ..."}`. Profile edits require [data].

## Output structure

```
# Stats Review — {date}

## Pending from prior round    [unactioned recs]
## Watchlist                   [single-point items — not stored]

## {Player}
### Coverage    [table]
### Trends      [bullets]
### Persistent patterns
### Quality flags    [qid: issue]
### Proposed coach_notes updates    [table — wait for confirmation]
### Action recommendations    [what + which skill]
```

## Sparse data

<5 sessions: flag explicitly, recommendations cautious. Don't over-interpret 3 data points.

## Forbidden

- Bringing up sensitive observations (mental health, personal crises) unprompted
- Restating stats fields in notes — `lvlStats`/`catStats` are canonical
- Promoting single-qid or single-session evidence to `weak_patterns` — qid failures → `stuck_questions`; category needs ≥3 qids <60% or pattern across ≥2 sessions
- Re-emitting recs already in prior notes — list once under 'Pending'
- Cross-player findings on personal profiles — go to question-bank notes
- Generic recommendations — every recommendation cites specific data
