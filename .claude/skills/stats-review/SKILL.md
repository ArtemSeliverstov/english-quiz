---
name: stats-review
description: Analyze player stats from Firestore or uploaded JSON. Use when user uploads family_stats_ai JSON, says "review stats", "analyse Anna's progress", "what should we focus on next for Artem", or any data-driven analysis request. Produces coverage review and proposes coach_notes updates.
---

# Stats Review

Analyse player stats to identify patterns, weak spots, and adjustments. Output: structured review + 0–4 proposed `coach_notes` updates per player.

## Reads

- `node tools/get_all_players.js -S` — all 5 player docs + their `exercises` and `coach_sessions` subcollections (or use uploaded JSON if Artem pasted one)
- `references/family-profiles.md` — stable profile and focus areas
- `references/coverage-matrix.md` — category targets, input share priorities
- `references/coach-notes-schema.md` — update protocol and promotion rule
- `progress/phrasal-verbs-tracker.md` (Artem) and `progress/phrasal-verbs-tracker-anna.md` (Anna) — refresh per-PV status when that player's stats are reviewed; methodology in Artem's file (see refresh protocol at bottom)

## Workflow

**1. Pull stats.** Run `get_all_players.js -S` for all 5 docs + subcollections. For one player deep-dive: `get_player.js {name}`. Filter out `auto_suspected: true` sessions before pattern aggregation.

**2. Coverage review per player** (mandatory). For each: category breakdown (count, level distribution, accuracy), type distribution, trends vs prior session if available, persistent weak spots (<70% across 3+ sessions), stuck questions (100% error rate), quality flags (≥60% error across 3+ players).

**2.5. Per-question mistake audit** for any flagged item. Pull `qStats[qid].lastWrong` from every player who's seen it via `node tools/get_question_mistakes.js <qid>`. The actual mistake is the highest-value signal — diagnosis without it is speculation. MCQ index sometimes resolves to `<no log>` — when unavailable, mark `[speculation]`.

**3. Synthesise patterns.** New weak patterns confirmed across 2+ sessions, resolved weaknesses, engagement shifts, L1 interference, recognition vs production gaps (high MCQ, low input).

**4. Propose coach_notes updates.** Per player, 0–4 updates: new `weak_patterns`, new `strong_patterns`, `engagement_notes` revision, `recent_observations` entry, `stuck_questions` adjustment. Show as a table. Wait for confirmation per player.

**5. Action recommendations.** Don't apply here — this skill produces, the user triggers `quiz-development` or `exercise-session` to act.

**6. Persist confirmed updates** via `tools/update_coach_notes.js` with a patch JSON. The script handles dedup, FIFO cap, and `last_updated`. See `tools/README.md`.

## Speculation marking — mandatory

Every claim carries an evidence tag:

| Tag | When |
|---|---|
| **[data]** | Direct from a stat field or `lastWrong` |
| **[inferred]** | Pattern visible in stats, causation unstated |
| **[speculation]** | Interpretation beyond what data shows |

Untagged claims default to [data] — an unmarked claim that turns out to be a guess is a skill violation.

Never write `[speculation]` into `weak_patterns`. Only [data] or [inferred] qualify there. [speculation] stays in `recent_observations` and is marked: `{"note": "[speculation] ..."}`. Profile edits require [data] only.

## Output structure

```
# Stats Review — {date}

## {Player}
### Coverage    [table]
### Trends      [bullets]
### Persistent patterns
### Quality flags    [qid: issue]
### Proposed coach_notes updates    [table — wait for confirmation]
### Action recommendations    [what + which skill]
```

## Sparse data

<5 sessions: flag explicitly, recommendations correspondingly cautious. Don't over-interpret 3 data points.

## Forbidden

- Auto-applying coach_notes without confirmation
- Bringing up sensitive observations (mental health, personal crises) unprompted
- Including stats numbers in proposed memory updates (those live in stats fields)
- Promoting a single-session observation to `weak_patterns` (need 2+ sessions, plus the 4-sessions+intervention rule for profile graduation)
- Generic recommendations — every recommendation cites specific data
