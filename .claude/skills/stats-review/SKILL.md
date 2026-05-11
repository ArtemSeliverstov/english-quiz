---
name: stats-review
description: Analyze player stats from Firestore or uploaded JSON. Use when user uploads family_stats_ai JSON, says "review stats", "analyse Anna's progress", "what should we focus on next for Artem", or any data-driven analysis request. Produces coverage review and proposes coach_notes updates.
---

# Stats Review

Analyse player stats to identify patterns, weak spots, and adjustments. Output: structured review + 0–4 proposed `coach_notes` updates per player.

## Reads

- `node tools/get_all_players.js -S` — 5 player docs + `exercises` and `coach_sessions` subcollections (or uploaded JSON)
- `references/family-profiles.md` — profile + focus
- `references/coverage-matrix.md` — category targets
- `references/coach-notes-schema.md` — update protocol + promotion rule + phrase tracker lifecycle
- `progress/phrasal-verbs-tracker.md` (Artem), `progress/phrasal-verbs-tracker-anna.md` (Anna) — refresh per-PV status; methodology in Artem's file
- `progress/natural-phrases-tracker-{name}.md` × 5 — **generated** views of `players/{name}.phrase_tracker`. Regenerate via `update_coach_notes.js --regen-tracker-md`. Never hand-edit.

## Workflow

**0. Integrity check.** Run `node tools/check_player_integrity.js`. Three invariants probe for cross-player contamination (the 2026-05-02 Nicole-overwritten-with-Artem incident pattern): cross-player qStats overlap with byte-identical `lastSeen`, `createdAt` drift vs baseline, and unexplained `totalAnswered` jumps. Exit code 0 = proceed; exit 1 = a flag fired — **stop and surface to user before continuing**. Don't try to "review around" a flagged contamination. Baseline lives at `tools/data-integrity-baseline.json` and auto-updates on a clean run.

**1. Pull stats.** Run `get_all_players.js -S` for all 5 docs + subcollections. For one player deep-dive: `get_player.js {name}`. Filter out `auto_suspected: true` sessions before pattern aggregation.

**1a. Signal selection.** Post-Option-D (2026-05-05) every surface bumps `lastPlayedDate / currentStreak / longestStreak` — use these for recency/streak, subcollections for volume/surface/type/accuracy. Filter `exercises[]` on `ex.ts`, `coach_sessions[]` on `cs.created`. Pre-Option-D rows: subcollection wins on disagreement.

**2. Coverage review per player** (mandatory). For each: category breakdown (count, level distribution, accuracy), type distribution, trends vs prior session if available, persistent weak spots (<70% across 3+ sessions), stuck questions (100% error rate), quality flags (≥60% error across 3+ players).

**2.5. Per-question mistake audit** for any flagged item. Pull `qStats[qid].lastWrong` from every player who's seen it via `node tools/get_question_mistakes.js <qid>`. The actual mistake is the highest-value signal — diagnosis without it is speculation. MCQ index sometimes resolves to `<no log>` — when unavailable, mark `[speculation]`.

**3. Synthesise patterns.** New weak patterns confirmed across 2+ sessions, resolved weaknesses, engagement shifts, L1 interference, recognition vs production gaps (high MCQ, low input).

**4. Propose coach_notes updates.** Per player, 0–4 updates as a table. Follow the protocol in `references/coach-notes-schema.md` (preview → approve per player → `update_coach_notes.js`).

**5. Action recommendations.** Don't apply here — this skill produces, the user triggers `quiz-development` or `exercise-session` to act.

**6. Phrase tracker maintenance** (auto, after step-4 confirmations). Per player: read `players/{name}.phrase_tracker`, apply lifecycle transitions from the period's `coach_sessions` (full state machine in `coach-notes-schema.md` "Phrase tracker lifecycle"), surface retest-due entries in the output, then `node tools/update_coach_notes.js {name} <patch.json> --regen-tracker-md` to refresh the markdown view.

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

- Bringing up sensitive observations (mental health, personal crises) unprompted
- Including stats numbers in proposed memory updates (those live in stats fields)
- Promoting a single-session observation to `weak_patterns` (need 2+ sessions, plus the 4-sessions+intervention rule for profile graduation)
- Generic recommendations — every recommendation cites specific data
