---
name: stats-review
description: Analyze player stats from Firestore or uploaded JSON. Use when user uploads family_stats_ai JSON, says "review stats", "analyse Anna's progress", "what should we focus on next for Artem", or any data-driven analysis request. Produces coverage review and proposes coach_notes updates.
---

# Stats Review

Identify patterns, weak spots, adjustments. Output: structured review + ≤2 new `coach_notes` proposals/player (removals/deferrals don't count).

## Reads

- `node tools/get_all_players.js -S` — 5 player docs + subcollections
- `references/family-profiles.md`, `coverage-matrix.md`, `coach-notes-schema.md`, `stats-interpretation-guide.md`
- `progress/phrasal-verbs-tracker.md` (Artem), `phrasal-verbs-tracker-anna.md` (Anna)
- `progress/natural-phrases-tracker-{name}.md` × 5 — **generated** views of `phrase_tracker`. Regen via `update_coach_notes.js --regen-tracker-md`.

## Workflow

**0. Integrity.** `node tools/check_player_integrity.js`. Exit 1 → stop and surface.

**1. Pull stats.** `get_all_players.js -S`. Filter `auto_suspected: true`.

**1a. Signal selection.** Streak fields = recency; subcollections = volume/accuracy. Filter by `ex.ts` / `cs.created`. Subcollection wins on disagreement.

**1b. Profile context.** Load `learning_path` (`active_categories`, `level_cap`, `next_unlock_options`) before step 2. Drives partitioning + gating for learner-shell (Anna/Nicole/Ernest). Builder (Artem/Egor): full sensitivity, no gating.

**2. Coverage.** Category breakdown, types, trends; persistent weak spots <70%×3+ sessions; stuck qs 100% error; quality flags ≥60%×3+ players.

**2a. Window partition** (learner-shell). Two tables: in-window primary + out-of-window one-liner. `seen>30` + zero 31d hits = `[stale]`. Out-of-window = exposure noise unless in `next_unlock_options` → unlock candidate, not weak_pattern.

**2.5. Per-qid audit.** `get_question_mistakes.js <qid>`. MCQ index `<no log>` → `[speculation]`.

**2.6. Session-id reconciliation.** Verify cited session_ids vs stored `exercises[].id` / `coach_sessions[].id` (±5min); flag mismatches, use stored ID.

**3. Synthesise.** Patterns ≥2 sessions, resolutions, engagement, L1 interference, recog-vs-prod. Aggregate `coach_sessions[].register_rubric` (`references/register-rubric.md`).

**3a. Pattern-id reuse.** Fuzzy-match new `recent_session_signals[].pattern_id` against existing pattern_ids + `weak_patterns` text. Mechanism match → fold into existing ID.

**4. Propose updates.** ≤2 new patterns/player. Prior unactioned recs → 'Pending'. Single-point items → 'Watchlist' (not stored).

**4a. Window gating** (learner-shell). Out-of-window → `next_unlock_options`, not `weak_patterns`. Rationale: focused-CF + affective-filter (`docs/audience-profiles.md §3`).

**4b. Ridge transparency.** Characterise ridge: *independent N-day emergence* / *learner self-confirmed* (strong); *N sessions same day* / *single discovery instrument multi-item* (medium — 7d re-confirm); *targeted follow-up* (weak).

**5. Action recs.** User triggers `quiz-development` or `exercise-session`. **Single front** when concentration is working: one drill area, not parallel — focused-CF (Anna 5→3).

**6. Phrase tracker** (auto, after 4). Per player: apply lifecycle from `coach_sessions`, surface retest-due, regen md if tracker date > md `Last refresh`. `update_coach_notes.js {name} <patch.json> --regen-tracker-md`.

**7. Signals promotion + audit.** `promote_signals.js <player> --list` → for `count >= 2` not-covered: compose label, `--apply` (or `weak_patterns_add` + `_promote`). Audit `weak_patterns`: drop legacy `(coach_session DATE)` + lexical `X → Y [tag]` rows (migrate to `phrase_tracker_add`).

**8. Weak-spots tracker** (Artem builder-only). Regenerate `progress/weak-spots-tracker-artem.md` per `references/weak-spots-rubric.md` (domain rollup + ranked tiers).

## Speculation marking

Tag claims: **[data]** / **[inferred]** / **[speculation]**. Untagged → [data]. `weak_patterns` only [data]/[inferred]; [speculation] → `recent_observations`. Profile edits: [data].

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
- Single-qid/single-session → `weak_patterns` (qid → `stuck_questions`; cat needs ≥3 qids <60% or pattern ≥2 sessions; designed-discovery instruments are an exception per 4b)
- Out-of-window weakness → `weak_pattern` for learner-shell (route to `next_unlock_options` per 4a)
- Re-emitting prior recs — list under 'Pending'
- Cross-player findings on personal profiles — go to question-bank notes
- Generic recommendations — every rec cites specific data
