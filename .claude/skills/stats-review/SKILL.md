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
- `references/coach-notes-schema.md` — update protocol, promotion rule, phrase tracker lifecycle
- `references/stats-interpretation-guide.md` — act-on/ignore, engagement, compromised categories
- `progress/phrasal-verbs-tracker.md` (Artem), `progress/phrasal-verbs-tracker-anna.md` (Anna) — per-PV status; methodology in Artem's file
- `progress/natural-phrases-tracker-{name}.md` × 5 — **generated** views of `phrase_tracker`. Regen via `update_coach_notes.js --regen-tracker-md`.

## Workflow

**0. Integrity check.** Run `node tools/check_player_integrity.js`. Exit 0 = proceed; exit 1 = **stop and surface to user**. Three invariants probe for contamination.

**1. Pull stats.** Run `get_all_players.js -S` (or `get_player.js {name}` for deep-dive). Filter `auto_suspected: true` sessions before aggregation.

**1a. Signal selection.** Streak fields = recency; subcollections = volume/accuracy. Filter `exercises[]` on `ex.ts`, `coach_sessions[]` on `cs.created`. Pre-Option-D: subcollection wins on disagreement.

**1b. Profile context (load before step 2).** Read `learning_path` for each player: `active_categories`, `level_cap`, `next_unlock_options`, `composition_last_checked`. For learner-shell profiles (Anna, Nicole, Ernest), this drives partitioning in step 2 and gating in step 3–4. For builder profiles (Artem, Egor), `learning_path` is absent/unused; full sensitivity applies.

**2. Coverage per player.** Category breakdown, type distribution, trends, persistent weak spots (<70% across 3+ sessions), stuck questions (100% error), quality flags (≥60% error across 3+ players).

**2a. Partition coverage by active window** (learner-shell only). Render two tables: (i) **in-window** categories — primary, drives recommendations; (ii) **out-of-window** — collapsed one-line summary ("N legacy categories with no exposure in last 31d — not flagged"). A category with `seen>30` but zero hits in the last 31d is *historical*; tag `[stale]` and de-prioritise. Out-of-window weakness is exposure noise, not a gap, *unless* the category appears in `next_unlock_options` — then surface as unlock candidate, not weak_pattern.

**2.5. Per-question audit** for flagged items. Pull `qStats[qid].lastWrong` per player via `node tools/get_question_mistakes.js <qid>`. The mistake is the highest-value signal. MCQ index may resolve to `<no log>` — mark `[speculation]`.

**2.6. Session-id reconciliation.** When a `recent_observations` note cites a session_id like `{player}_{mode}_{ts}_{slug}`, verify the ts matches an `exercises[].id` (within ±5min) or a `coach_sessions[].id`. Mismatches (CC-side synthesised IDs that don't match the stored record) → flag in the review output and use the actual stored ID in any new prose.

**3. Synthesise patterns.** New weak patterns across 2+ sessions, resolved weaknesses, engagement shifts, L1 interference, recognition-vs-production gaps. **Register rubric**: aggregate `coach_sessions[].register_rubric` per `references/register-rubric.md` § "Stats-review aggregation".

**3a. Pattern-id reuse.** Before treating a `recent_session_signals[].pattern_id` as new, fuzzy-match against existing `recent_session_signals[].pattern_id` and `weak_patterns` text. If mechanism matches (e.g. `definite_shared_referent_post_modifier_overuse_of_indefinite` ≈ existing `definite_post_modifier_drop`), fold into the existing ID rather than minting a fresh signal. Surface the merge in the proposal.

**4. Propose coach_notes updates.** ≤2 new patterns per player (removals + deferrals don't count). Scan prior `recent_observations` for unactioned recs → 'Pending'. Single-point items → 'Watchlist' (not stored). Protocol in `coach-notes-schema.md`.

**4a. Profile-aware weak-pattern gating.** For learner-shell profiles, a candidate pattern from an *out-of-window* category does **not** become a `weak_pattern`; route to `next_unlock_options` consideration instead. For builder profiles, no gate. Rationale: out-of-window correction at lower productive proficiency drives affective-filter load without learning gain (see `docs/audience-profiles.md §3`, focused-CF literature).

**4b. Ridge-rule transparency.** When proposing a promotion, explicitly characterise the ridge: *independent emergence across N days* (strong) vs *N sessions same day* vs *second session targeted at the first* (weaker). The human sees the caveat in the proposal, not just the count.

**5. Action recommendations.** Don't apply here — user triggers `quiz-development` or `exercise-session`.

**6. Phrase tracker maintenance** (auto, after step-4). **Every player**, even zero-session: apply lifecycle from `coach_sessions`, surface retest-due, regen md if `phrase_tracker.last_updated > md "Last refresh"`. Run `update_coach_notes.js {name} <patch.json> --regen-tracker-md` (empty patch if stale).

**7. recent_session_signals promotion + audit.** Per player:
- Each `recent_session_signals[]` entry with `count >= 2`: compose a durable prose label, patch `weak_patterns_add` + `recent_session_signals_promote: [pattern_id]`.
- Audit `weak_patterns`: remove legacy `(coach_session DATE)` entries and lexical `X → Y [tag]` rows (migrate lexicals to `phrase_tracker_add` if missing).

## Speculation marking — mandatory

Every claim carries an evidence tag: **[data]**, **[inferred]**, **[speculation]**. Untagged defaults to [data]. `weak_patterns` accepts only [data]/[inferred]; [speculation] stays in `recent_observations` as `{"note": "[speculation] ..."}`. Profile edits require [data].

## Output structure

```
# Stats Review — {date}

## Pending from prior round    [unactioned recs]
## Watchlist                   [single-point items — not stored]

## {Player}    [header: level_cap · active_window (N cats) · recent_volume (31d)]
### Coverage
  in-window table    [primary — drives recommendations]
  out-of-window line [collapsed; legacy/historical, not flagged unless in next_unlock_options]
### Trends      [bullets]
### Register fluency    [per rubric doc]
### Persistent patterns
### Quality flags    [qid: issue]
### Proposed coach_notes updates    [table — wait for confirmation; ridge characterisation per 4b]
### Action recommendations    [what + which skill]
```

## Sparse data

<5 sessions: flag explicitly, recommendations cautious. Don't over-interpret 3 data points.

## Forbidden

- Bringing up sensitive observations (mental health, personal crises) unprompted
- Restating stats fields in notes — `lvlStats`/`catStats` are canonical
- Promoting single-qid or single-session evidence to `weak_patterns` — qid failures → `stuck_questions`; category needs ≥3 qids <60% or pattern across ≥2 sessions
- Surfacing out-of-window cat weakness as a `weak_pattern` for learner-shell players — route to `next_unlock_options` instead (per 4a)
- Re-emitting recs already in prior notes — list once under 'Pending'
- Cross-player findings on personal profiles — go to question-bank notes
- Generic recommendations — every recommendation cites specific data
