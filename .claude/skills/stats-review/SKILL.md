---
name: stats-review
description: Analyze player stats from Firestore or uploaded JSON. Use when user uploads family_stats_ai JSON, says "review stats", "analyse Anna's progress", "what should we focus on next for Artem", or any data-driven analysis request. Produces coverage review and proposes coach_notes updates.
---

# Stats Review

Analyse player stats to identify patterns, weak spots, and adjustments. Output: structured review + ≤2 new `coach_notes` proposals per player (removals + deferrals don't count).

## Reads

- `node tools/get_all_players.js -S` — 5 player docs + subcollections
- `references/family-profiles.md`, `coverage-matrix.md`, `coach-notes-schema.md`, `stats-interpretation-guide.md`
- `progress/phrasal-verbs-tracker.md` (Artem), `phrasal-verbs-tracker-anna.md` (Anna)
- `progress/natural-phrases-tracker-{name}.md` × 5 — **generated** views of `phrase_tracker`. Regen via `update_coach_notes.js --regen-tracker-md`.

## Workflow

**0. Integrity.** `node tools/check_player_integrity.js`. Exit 1 → stop and surface.

**1. Pull stats.** `get_all_players.js -S`. Filter `auto_suspected: true`.

**1a. Signal selection.** Streak fields = recency; subcollections = volume/accuracy. Filter `exercises[]` on `ex.ts`, `coach_sessions[]` on `cs.created`. Subcollection wins on disagreement.

**1b. Profile context.** Load `learning_path` (`active_categories`, `level_cap`, `next_unlock_options`) before step 2. Drives partitioning + gating for learner-shell (Anna/Nicole/Ernest). Builder (Artem/Egor): full sensitivity, no gating.

**2. Coverage.** Category breakdown, types, trends, persistent weak spots (<70% across 3+ sessions), stuck questions (100% error), quality flags (≥60% across 3+ players).

**2a. Window partition** (learner-shell). Two tables: (i) in-window primary; (ii) out-of-window one-liner. `seen>30` + zero hits last 31d = `[stale]`. Out-of-window weakness is exposure noise *unless* in `next_unlock_options` → unlock candidate, not weak_pattern.

**2.5. Per-question audit.** `tools/get_question_mistakes.js <qid>`. MCQ index `<no log>` → `[speculation]`.

**2.6. Session-id reconciliation.** When a note cites a session_id, verify ts matches `exercises[].id` or `coach_sessions[].id` (±5min). Mismatches → flag and use actual stored ID.

**3. Synthesise.** New patterns across 2+ sessions, resolved weaknesses, engagement shifts, L1 interference, recognition-vs-production gaps. Aggregate `coach_sessions[].register_rubric` per `references/register-rubric.md`.

**3a. Pattern-id reuse.** Fuzzy-match new `recent_session_signals[].pattern_id` against existing pattern_ids + `weak_patterns` text. Mechanism match → fold into existing ID.

**4. Propose updates.** ≤2 new patterns/player. Prior unactioned recs → 'Pending'. Single-point items → 'Watchlist' (not stored).

**4a. Window gating** (learner-shell). Out-of-window candidates → `next_unlock_options`, not `weak_patterns`. Rationale: focused-CF + affective-filter (see `docs/audience-profiles.md §3`).

**4b. Ridge transparency.** Characterise promotion ridge: *independent emergence across N days* (strong) vs *N sessions same day* vs *second targeted at the first* (weaker).

**5. Action recs.** User triggers `quiz-development` or `exercise-session`.

**6. Phrase tracker** (auto, after 4). Every player: apply lifecycle from `coach_sessions`, surface retest-due, regen md if `phrase_tracker.last_updated > md "Last refresh"`. `update_coach_notes.js {name} <patch.json> --regen-tracker-md`.

**7. Signals promotion + audit.** Each `recent_session_signals[]` with `count >= 2`: compose prose label, patch `weak_patterns_add` + `recent_session_signals_promote`. Audit `weak_patterns`: remove legacy `(coach_session DATE)` entries and lexical `X → Y [tag]` rows (migrate lexicals to `phrase_tracker_add`).

## Speculation marking

Tag every claim: **[data]**, **[inferred]**, **[speculation]**. Untagged defaults [data]. `weak_patterns` accepts only [data]/[inferred]; [speculation] → `recent_observations`. Profile edits require [data].

## Output structure

```
# Stats Review — {date}
## Pending · Watchlist
## {Player}  [level_cap · window (N) · volume (31d)]
### Coverage   in-window primary; out-of-window one line
### Trends · Register · Persistent patterns · Quality flags
### Proposed coach_notes updates  [ridge per 4b — await confirmation]
### Action recommendations
```

## Sparse data

<5 sessions: flag explicitly, recs cautious. Don't over-interpret 3 data points.

## Forbidden

- Sensitive observations (mental health, crises) unprompted
- Restating canonical stats (`lvlStats`/`catStats`) in notes
- Single-qid/single-session → `weak_patterns` (qid → `stuck_questions`; cat needs ≥3 qids <60% or pattern ≥2 sessions)
- Out-of-window weakness → `weak_pattern` for learner-shell (route to `next_unlock_options` per 4a)
- Re-emitting prior recs — list under 'Pending'
- Cross-player findings on personal profiles — go to question-bank notes
- Generic recommendations — every rec cites specific data
