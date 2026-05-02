# Stats Interpretation Guide

**Status**: living reference document
**Owner**: Artem · primary user: Claude Code (CC) during stats reviews
**Companion docs**: `learning-system-design.md` (philosophy),
`phase2-build-plan.md` (operational sequence)

This document tells CC how to read player data — what each metric means in
the current model, what to act on, what to ignore, what to surface to
Artem and what to handle silently. It is referenced when CC does stats
reviews (uploaded family stats JSON, ad-hoc checks during content
authoring decisions, restart-readiness assessments).

It is not a substitute for the philosophy doc; it operationalizes the
philosophy. When this guide and the philosophy doc disagree, the
philosophy wins on intent and this guide gets patched.

---

## 1. The audiences for stats analysis

Stats reviews serve different people for different reasons. CC should be
clear which mode it's in.

**Reviews for Artem (builder mode)**: detailed, numerical, per-category,
per-question. Artem reads stats actively and makes content authoring and
window composition decisions from them. CC produces tables, percentages,
trend deltas, identifies anomalies, proposes specific actions. Output
format: dense, structured, scannable.

**Reviews of learner-shell players' stats** (Anna, Nicole, Ernest): CC
analyzes for patterns and proposes actions to Artem; the player themselves
never sees the analysis. The output is for Artem's decision-making about
their active windows, content authoring, and unlock options. The player
sees only the simplified narrative on their landing page.

**Reviews of Artem's and Egor's own stats** (builder profile): standard
detail. Artem reads his own. Egor's data is reviewed for IELTS prep
context if he asks; otherwise low-priority.

CC names which mode it's in at the start of any substantial stats
analysis, since the appropriate detail level differs.

---

## 2. The metrics that exist

Per-player data lives in Firestore at `players/{name}` and
`players/{name}/exercises/{ts}` and `players/{name}/coach_sessions/{id}`,
with the new additions from Phase 2D in `learning_path`,
`medals_history`, and `spelling_log`.

The metrics CC actually reads:

**Quiz performance**: `qStats[questionId]` (per-question seen/correct
counts, last seen date, locked_until if floor-bouncer), `catStats[category]`
(per-category totals), `totalAnswered`, `streak`.

**Exercise performance**: per-row `correct`, `submitted_answer`,
`matched_pattern_id`, `escalation_used`, `time_to_answer_ms`, plus the
s92 retry fields when escalation triggered.

**Coach session data**: `coach_sessions[id]` with messages, error patterns
observed, topics covered, session summary, tokens used, model used.

**Coach notes**: `coach_notes.weak_patterns`, `recent_observations`,
`engagement_notes`. Living model of the player's current learning state.

**Active window state**: `learning_path.active_categories`,
`mastered_categories`, `next_unlock_options`. Phase 2D additions.

**Spelling captures**: `spelling_log[ts]` with attempted/correct pairs.

**Medals history**: `medals_history` weekly snapshots.

**Engagement signals (derived)**: session count over time windows, average
session duration, voluntariness signal (did they end via natural completion
or via "End session" mid-flow), Free Write turn counts, time-of-day
patterns, gap-since-last-session.

---

## 3. What to act on

### 3.1 Persistent weak patterns confirmed across multiple sessions

If `coach_notes.weak_patterns` shows the same error tag (e.g.,
`preposition_omission`) appearing in `error_patterns_observed` across 3+
sessions, it's a real pattern. Actions:

- Propose targeted content authoring (Translation Drill items, quiz items)
  for Artem's confirmation
- Verify the relevant category is in the player's active window; if not,
  consider whether it should be (active window composition rule)
- Update `family-profiles.md` if not already captured

If a weak pattern in the notes contradicts what current sessions show
(e.g., notes say "preposition issues" but recent 5 sessions show 90%+
accuracy on preposition items), the notes are stale. Propose a memory
update.

### 3.2 Floor-bouncing categories or questions

Per D5 in the build plan: <30% accuracy across 15+ attempts with no
improvement curve over 4 weeks at the category level, or 3+ attempts at
100% error rate at the question level.

**Filter by level cap before diagnosing.** A learner-shell player's
accuracy on items above their `level_cap` is not productive-struggle
data — it's above-scaffold data. When evaluating floor-bouncing,
calculate accuracy from items at-or-below the player's level_cap only.
A player who is 25% on prepositions overall but 70% on B1 prepositions
and 5% on B2 prepositions is not floor-bouncing on prepositions — they
are correctly capped at B1 and the B2 items shouldn't have surfaced
(and won't post-Phase-2D given the level_cap filter).

Actions:
- Question-level: auto-lock per the `locked_until` mechanic (6 weeks
  forward). No Artem confirmation needed; this is mechanical.
- Category-level: propose locking to Artem with the diagnostic data,
  level-filtered. Locking a category is consequential; it removes content
  from the player's window. Artem confirms before CC executes.

### 3.3 Active window composition violations

Per D4: each window should have ≥1 strong area, ≥2 productive struggle,
≤1 new narrow focus. CC checks composition during stats reviews and
during any unlock event.

Violation cases:
- Window has 4 categories all in productive struggle zone (no easy wins
  for the player) → propose adding a strength category to the window via
  unlock, or moving a struggling category out
- Window has 3 strong-area categories and 1 new (no productive struggle)
  → propose unlocking a more challenging category
- Window has nothing in strong area and one floor-bouncer → escalate to
  Artem; this is the engagement-killer scenario

### 3.4 Engagement decline

If a learner-shell player's session count drops materially week-over-week
(e.g., 5 sessions/week → 0–1), it's a signal. Actions:

- Don't react to single-week noise; require 2 weeks of decline before
  treating as a pattern
- If pattern is real, surface to Artem with hypothesis (content too hard?
  active window stale? real-life disruption?)
- Don't propose content changes as the first response; the cause is often
  not content
- For Anna and Nicole specifically, check whether Free Write engagement
  also dropped — if Free Write is sustaining but quiz/Translation dropped,
  the issue is the structured surfaces, not engagement overall

### 3.5 Mastery promotion eligibility

When a player's `catStats[category]` filtered to at-or-below `level_cap`
shows ≥80% accuracy across ≥20 attempts sustained ≥14 days, the category
is eligible for promotion at the current level cap. Actions:

- Surface to Artem: "Anna is ready to promote Prepositions at B1.
  Proposed deepen option: raise level_cap to B2 within Prepositions.
  Proposed broaden options: X, Y, Z (each at B1 level)."
- Per D3 mechanic: present the player with the choice between deepen
  (one option) and broaden (three curated options).
- After player picks: update `learning_path` accordingly (either bump
  `level_cap` for the category and keep it active, or move category to
  mastered and add new category at current level_cap).
- Schedule mastered categories for spaced review (~30 days forward) at
  the level they were mastered at.

### 3.6 Spell Help capture patterns

When `spelling_log` accumulates ≥5 unique words for a player since the
last Spelling Drill batch was authored:

- Propose a Spelling Drill batch using the captured words plus 2–3
  predicted L1 traps from the same word families
- Author the batch during the stats review session if scope permits

### 3.7 New observations not yet in coach_notes or family-profiles

If the data shows a learning pattern not previously documented (e.g., Anna
consistently does better on Translation Drill in the morning vs evening,
or Nicole's accuracy spikes when prompts are K-pop themed), capture it.
Per memory policy from session prompts: propose 0–4 memory updates,
update `coach_notes.recent_observations`, wait for Artem's confirmation
before promoting to family-profiles or memory edits.

---

## 4. What to ignore

### 4.1 Single-session anomalies

One bad session is noise. One good session is noise. A pattern needs ≥3
sessions or a clear before/after intervention shape. Don't propose content
or window changes based on a single session unless something dramatic
(complete disengagement, error rate at 0% suggesting a UI bug) is present.

### 4.2 Builder-shell players' affective patterns

Artem and Egor are self-regulating. Their session length, time-of-day, and
engagement curves are not actionable signals — they make their own
decisions about practice. Don't analyze their engagement; analyze their
performance. The exception: if their performance shows a real pattern
(Artem's PV production weakness), surface that as a content/exercise
proposal.

### 4.3 Stats from locked categories

A learner-shell player's accuracy on a locked category is a baseline
marker (what they were at when it was locked), not a current signal. The
category isn't being practiced, so the accuracy isn't moving. Don't
propose actions based on locked-category numbers. The exception: if Artem
is considering unlocking a category, the baseline is relevant context.

### 4.4 Numeric-only signals for learner-shell players

Anna's accuracy went from 67% to 70% week-over-week. Don't surface this
as good news to Artem unless it's part of a larger pattern. Numeric
improvements in this range are noise at the timescales the system
operates on. Look at qualitative patterns (categories of errors, types of
sessions, engagement) instead.

### 4.5 Family ranking comparisons

Don't surface "Anna is doing better than Nicole" or similar comparative
framings, even to Artem. The system's design philosophy explicitly avoids
ranking between family members. Each player is analyzed against their own
trajectory.

### 4.6 Coach notes that contradict current behavior

If `coach_notes.weak_patterns` says one thing but the last 3 sessions
show the opposite, the notes are stale. Don't apply the stale notes as
current truth. Propose a notes update instead. This is also why the
coach_notes injection into Worker prompts is bounded (cap at 8 patterns)
— stale entries get displaced naturally.

---

## 5. Engagement signals worth surfacing

These are the qualitative engagement patterns CC pays attention to,
beyond raw session counts:

**Free Write voluntariness**: did the player end the session via natural
completion (✓ End session button after a wrap-up) or by closing the tab
mid-conversation? Natural completion is the strongest engagement signal
the system has. Tab closure is mild disengagement; abrupt mid-session
closure with no recent message is stronger disengagement.

**Free Write turn count distribution**: 1-3 turns suggests the starter
prompt didn't land; 4-7 is healthy productive engagement; 8+ is deep
engagement; 15+ is unusual and may indicate the player is using the
session as a chat companion rather than for practice (which is fine but
worth noting).

**Translation Drill completion rate**: how many sets does the player
start vs finish? Unfinished sets are mild disengagement signal; if
multiple sets in a row are abandoned at the same item, that item is
breaking flow.

**Escalation patterns**: if the player escalates frequently on similar
patterns, the pre-generated feedback isn't sufficient for that pattern
type — propose Worker prompt enhancement or richer common_errors
authoring.

**Spelling Help frequency**: Anna asking for spelling help frequently is
expected and positive (she's writing). Anna asking for help on the same
word repeatedly (same word in spelling_log multiple times) means
the Spelling Drill needs that word.

**Time-of-day patterns**: if a player consistently practices at the same
time, that's their habit — don't disrupt it. If their pattern shifts
suddenly, ask whether life context changed (travel, work, school
schedule).

**Session-to-session gap**: gaps of 1–2 days are healthy. 4+ days for a
learner-shell player is engagement risk; 10+ days is real disengagement.
Surface to Artem if gaps grow.

---

## 6. The CC stats review workflow

A standard stats review session has this shape:

1. **Read context**: load `learning_path`, `coach_notes`, recent sessions
   (last 2 weeks of `exercises` and `coach_sessions`), family-profiles
   relevant entries.

2. **Check active window composition** (D4): does each learner-shell
   player's window meet the rule? If not, list violations.

3. **Check mastery promotion eligibility**: any categories ready to
   promote? List with proposed unlock options.

4. **Check floor-bouncers**: any new floor-bouncing categories or
   questions? Propose locks for category-level; auto-lock for
   question-level.

5. **Check coach_notes freshness**: any patterns stale? Any new patterns
   not yet captured?

6. **Check Spell Help backlog**: any pending words for Spelling Drill
   authoring?

7. **Check engagement signals**: any decline or pattern shift?

8. **Compile review for Artem**: structured output with the items above,
   proposed actions, requests for confirmation where needed.

9. **Execute confirmed actions** during the same session if scope allows
   (small edits, content authoring batches, library pushes); larger
   changes (active window restructuring, unlock execution) await Artem's
   explicit go.

10. **Update doc B status log** with what was done.

The workflow scales down for ad-hoc checks (just steps 1, 7, 8) and
scales up for major reviews (all 10 steps with deeper data analysis).

---

## 7. Things that look like signal but aren't

**A streak ending**: not a signal worth acting on. Streaks end for many
reasons (travel, illness, busy week). Don't propose interventions when a
streak ends; just let it restart.

**A medal being downgraded**: not surfaced to player per D9. Surface to
Artem only if multiple downgrades happen in a short period for a single
player, suggesting genuine regression rather than statistical noise.

**A single Free Write session with low patterns observed**: the Worker
sometimes returns minimal `error_patterns_observed` when the player
wrote well or wrote about something the model didn't have much
correction to give. Not a quality signal.

**Identical accuracy week-over-week**: usually means the player practiced
on the same content at the same level. Not actionable unless persistent.

**Token usage spike**: usually means a long Free Write conversation,
which is engagement, which is good. Spend ceilings catch real runaways;
surface only if the trend over weeks is concerning.

**A player's score on a single category being lower than family
average**: family-comparative framing is excluded by design. Each player
is their own baseline.

---

## 8. Output format conventions

When CC produces stats reviews for Artem, follow these conventions:

**Tables for cross-player or cross-category data.** Easier to scan than
prose for parallel comparisons.

**Proposed actions clearly delineated.** Use a "Proposed actions" or
"Awaiting your confirmation" section so Artem can scan-and-decide
without re-reading the analysis.

**Quantify confidence where relevant.** "This pattern has appeared in 5
of last 6 sessions (high confidence)" is more useful than just "this
pattern appeared."

**Avoid technical metric names in prose.** `qStats[id].seen` is fine in
schema sections but in analysis prose say "Anna has attempted this
question 12 times."

**Distinguish observation from interpretation.** "Anna's accuracy on
Articles is 68%" is observation. "Anna is approaching mastery on
Articles" is interpretation. Keep them separated so Artem can disagree
with one without throwing out the other.

**Don't over-narrate.** Per the philosophy, narrative is for the player.
For Artem, structured information density is the right register.

---

## 9. Categories with structural caveats

Some categories' accuracy numbers are known to be measurement artifacts
rather than competence signals. CC should treat these as untrustworthy
when interpreting `catStats` for active window composition, mastery
promotion, or any other decision that depends on the accuracy reflecting
genuine competence.

The diagnostic principle: a question is **structurally compromised** if
the correct answer can be identified from option form alone, without
parsing meaning. Common form-shortcuts to detect:

- One option markedly shorter or longer than the others
- One option markedly more formal/archaic than the others (where the
  right answer is the only natural-register one)
- One option containing a flagrant grammar error visible without
  semantic processing
- Length asymmetry where the correct option is consistently the longest
  or shortest
- One distractor being a partial repeat of the stem
- Combinations of the above producing a cumulative form-shortcut

When a category's MCQ items consistently exhibit form-shortcuts, players
score well by elimination on form rather than by knowing the content.
The accuracy is a measurement artifact.

### 9.1 Currently flagged categories

**Everyday English Idioms** (structurally compromised):
- Pattern: 3 options where one is short-and-natural, one is markedly
  over-formal, and the third is wrong in some clearly identifiable way
- Effect: Anna scores ~70%+ here despite weak idiom knowledge — she's
  pattern-matching on option length and register, not parsing the idioms
- Action implications: do NOT treat as a strong-area anchor in active
  window composition; do NOT count toward mastery promotion until the
  category is re-engineered; the high `catStats` accuracy is not a
  signal of genuine idiom competence
- Re-engineering: Tier 3 work item (`phase2-build-plan.md` §5.3,
  "Everyday Idioms category re-engineering")
- Calibration anchor: this category provides the reference pattern for
  Pass 1 of the MCQ distractor audit

### 9.2 Audit status

A bank-wide MCQ distractor audit (`phase2-build-plan.md` §5.3, "MCQ
distractor audit Pass 1") is queued to identify additional categories
with the same artifact. Until that audit runs, CC should:

- Treat any MCQ-heavy category where Anna or Nicole scores
  unexpectedly well (≥75% accuracy on items the player would not
  reasonably know via comprehension) as a candidate for the same
  structural caveat
- Surface this suspicion to Artem during stats reviews rather than
  acting on the high accuracy as competence signal
- Note candidates in stats review output for inclusion in Pass 2 if a
  pattern emerges before the audit lands

This is precautionary — most MCQ categories likely don't have the
form-shortcut pattern — but the cost of a false positive (treating a
clean category with caution) is low, while the cost of a false negative
(treating a compromised category as competence-trustworthy) is
miscalibrated active windows and false mastery promotions.

### 9.3 Adding to this list

When a category is identified as structurally compromised (whether
through the audit, via Artem's recall, or through CC's own observation
during stats reviews), add it as a §9.1 sub-entry following the same
shape: pattern description, effect on accuracy, action implications,
re-engineering status, and any cross-references to relevant tier work
items in `phase2-build-plan.md` §5.

When a re-engineered category lands and the form-shortcut is removed,
move the entry to a new "§9.4 Resolved structural caveats" section
rather than deleting — historical record matters for understanding
past `catStats` interpretation.

---

## 10. Updating this guide

This document is updated when:

- A new metric category is added to the system (a new schema field that
  CC should be reading)
- A pattern of misinterpretation emerges (CC keeps acting on something
  that turns out to be noise; add it to §7)
- A category is identified as structurally compromised or resolved (add
  to or move within §9)
- The active window or motivational stack model changes (philosophy doc
  changes propagate to here)
- Artem identifies a stats review output convention that's not landing
  well

Updates happen in claude.ai chat conversations, not in CC sessions. CC
reads this guide as reference; CC doesn't edit it autonomously.

---

*This file lives at `references/stats-interpretation-guide.md` in the
repo. Updated as the system evolves.*
