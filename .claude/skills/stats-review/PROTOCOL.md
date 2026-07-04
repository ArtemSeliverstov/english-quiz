# Stats Review — step protocol

Execution detail for `stats-review/SKILL.md`. Follow in order; numbering is referenced
from other docs (tools/README, register-rubric) — don't renumber casually.

**0. Integrity.** `node tools/check_player_integrity.js`. Exit 1 → **stop and surface to
user**. Five invariants probe for contamination; a count shrink blocks the baseline
ratchet — verify against the `backups` branch before `--accept-shrink`.

**1. Pull stats.** `get_all_players.js -S` (or `get_player.js {name}` for a deep-dive).
Filter `auto_suspected: true` sessions before aggregating.

**1a. Signal selection.** Streak fields = recency only; subcollections = volume +
accuracy. Filter `exercises[]` on `ex.ts`, `coach_sessions[]` on `cs.created`.
Subcollection wins on disagreement.

**1b. Profile context (before step 2).** Load `learning_path` per player:
`active_categories`, `level_cap`, `next_unlock_options`, `composition_last_checked`.
Learner-shell (Anna, Nicole, Ernest, Egor) → drives partitioning (2a) and gating (4a).
Builder (Artem): full sensitivity, no gating.

**2. Coverage per player.** Category breakdown, type distribution, trends; persistent
weak spots (<70% across 3+ sessions); stuck questions (100% error); quality flags
(≥60% error across 3+ players). Exclude qids with an open `bug:*` verdict in
`tools/mistake_verdicts.json` — a miskeyed question is not learner signal.

**2a. Window partition** (learner-shell). Two tables: in-window (primary — drives
recommendations); out-of-window (one collapsed line). `seen>30` with zero 31-day hits =
historical, tag `[stale]`. Out-of-window weakness is exposure noise, not a gap — unless
the category is in `next_unlock_options`, then surface as unlock candidate, not
weak_pattern.

**2b. Per-qid audit** for flagged items: `node tools/get_question_mistakes.js <qid>`.
The mistake text is the highest-value signal. MCQ index resolving to `<no log>` →
mark `[speculation]`.

**2c. Session-id reconciliation.** Verify cited session_ids against stored
`exercises[].id` / `coach_sessions[].id` (±5 min). Mismatch → flag in the review and
use the stored ID in any new prose.

**3. Synthesise.** New patterns across ≥2 sessions, resolutions, engagement shifts,
L1 interference, recognition-vs-production gaps. Aggregate
`coach_sessions[].register_rubric` per `references/register-rubric.md`
§ Stats-review aggregation.

**3a. Pattern-id reuse.** Before minting a new `recent_session_signals[].pattern_id`,
fuzzy-match existing pattern_ids + `weak_patterns` prose. Mechanism match (e.g.
`definite_shared_referent_post_modifier_overuse` ≈ existing
`definite_post_modifier_drop`) → fold into the existing ID; surface the merge in the
proposal.

**4. Propose coach_notes updates.** ≤2 new patterns per player (removals/deferrals
don't count). Prior unactioned recs → 'Pending'. Single-point items → 'Watchlist'
(not stored). Protocol in `coach-notes-schema.md`; confirm-first.

**4a. Window gating** (learner-shell). An out-of-window candidate never becomes a
`weak_pattern` — route to `next_unlock_options` consideration. Rationale:
out-of-window correction at lower productive proficiency drives affective-filter load
without learning gain (focused-CF; `docs/audience-profiles.md` §3).

**4b. Ridge transparency.** Characterise each promotion's evidence: *independent N-day
emergence* / *learner self-confirmed* (strong); *N sessions same day* / *single
discovery instrument, multi-item* (medium — re-confirm in 7d); *targeted follow-up of
the first hit* (weak). The human sees the caveat, not just the count.

**5. Action recommendations.** Don't apply here — user triggers `quiz-development` or
`exercise-session`. **Single front** while concentration works: one drill area at a
time, not parallel (focused-CF; Anna 5→3).

**6. Phrase tracker maintenance** (auto, after 4). Every player, even zero-session:
apply lifecycle transitions from `coach_sessions`, surface retest-due entries, run the
aging sweep (`--apply-aging`: stale singles → 💤 dormant; weight-4 tags exempt — see
`coach-notes-schema.md` § Pool hygiene), regen the md when
`phrase_tracker.last_updated` > md "Last refresh".
`update_coach_notes.js {name} <patch.json> --apply-aging --regen-tracker-md`
(empty patch if only stale).

**7. Signals promotion + audit.** Per player: `node tools/promote_signals.js
{player} --list` → for each `count >= 2` entry not already covered: compose a durable
prose label, then `--apply` (or patch `weak_patterns_add` +
`recent_session_signals_promote`). Audit `weak_patterns`: enforce cap 8
(priority-aware — durable + intervention-resistant kept); remove legacy
`(coach_session DATE)` entries; migrate lexical `X → Y [tag]` rows to
`phrase_tracker_add`.

**8. Weak-spots tracker (Artem, auto — after 7 so fresh promotions are ranked).**
Regenerate `progress/weak-spots-tracker-artem.md` from `weak_patterns` +
`recent_session_signals` + `exercises` per `references/weak-spots-rubric.md`.
Two tiers: domains (budget) / patterns (action: NOW · NEXT · AMBIENT · PARKED ·
CLOSED). Respect lanes — lexical-inventory and production/fluency patterns route to
their lanes, never the drill queue. Compute/refresh `probe due YYYY-MM-DD` dates on
CLOSED/maintenance rows (+2w → +6w → +4m from close; retire after two clean
production probes incl. one untrained sibling; probe miss → NEXT tagged `regressed`
— `plans/retention-lane.md`). This file is the status table `weak-spots-session`
consumes.
