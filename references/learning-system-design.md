# Learning System Design

**Status**: living document · drafted in claude.ai chat session
**Owner**: Artem · primary execution surface: Claude Code (laptop)
**Companion docs**: `phase2-build-plan.md` (operational sequence), `stats-interpretation-guide.md` (CC reference for stats reviews)

This document captures the *philosophy* behind the family English learning
system — why it looks the way it does, what audiences it serves, what we
build for, and what we deliberately do not build. It changes slowly. CC reads
it once at the start of substantial design conversations, not every session.
The build plan and the stats guide change more frequently and reference this
document for justification.

When something here conflicts with the build plan, this document wins on
*why* and the build plan wins on *what to do next*. If the conflict is
substantive (the build plan is doing something this philosophy says not to
do), surface it to Artem rather than silently override.

---

## 1. The system's purpose, plainly stated

A family of five Russian speakers practices English. Two adults at B2+ levels
(Artem, Egor) want self-directed practice and detailed instrumentation. Two
others (Anna at B1, Nicole at B1, child) need gentle, structured re-engagement
with English after periods of disuse. One child (Ernest, B1+) sits between
profiles. The system serves all five, but not in the same way.

The deliverable is sustained engagement that produces measurable learning
gains. Engagement is the upstream variable; learning gains follow when
engagement is regular and the practice is appropriately calibrated.
Disengagement is the failure mode that matters most — a system the family
doesn't open is worth nothing, regardless of how good the content is.

This means design decisions are evaluated against two questions, in order:

1. Does this serve the player's continued engagement?
2. Given (1), does this produce learning gains efficiently?

Question 1 sometimes overrides what would be pedagogically optimal in
isolation. A perfect drill that nobody completes is worse than a slightly
suboptimal drill that gets done weekly.

---

## 2. Audience profiles

The five players resolve to two distinct profiles for design purposes.

### 2.1 Builder profile — Artem, Egor

Self-directed adults. Comfortable with information density. Read stats
carefully and act on them. Tolerate (and prefer) configurability.
Self-regulate practice intensity without prompting. Engage with the system
as a tool they're shaping, not a product they're consuming.

For this profile, the system should expose its full surface area. More data
is better than less. Configurability is a feature. Tabs, modes, settings,
weekly slots, and detailed stats are the right primary affordances.

### 2.2 Learner profile — Anna, Nicole, Ernest

Needs gentle structure. Engagement is fragile. Decision burden is a tax.
Stats and percentages are demotivating. Responds to conversation, narrative
progress framing, social context, and rare meaningful achievements.

For this profile, the system should expose minimum surface area. Decisions
the system can make on the player's behalf should be made on their behalf.
Vocabulary should be warm and human. Visual density should be low. Each
screen should have one obvious primary action.

The split is not adult-vs-child. Nicole is a child and Ernest is younger,
but Anna's adult learner profile converges with theirs more than with
Artem's. The split is **self-directed builder versus socially-and-narratively
motivated learner**. Two profiles, two presentation shells, same engine
underneath.

### 2.3 Profile-specific implications

Profile is a per-player flag (`ui_shell: "builder" | "learner"`). It
determines which presentation layer renders, what level of detail the stats
display uses, what tabs appear, and how the system speaks to the player
in feedback moments. The underlying data model is shared.

Profile is not destiny. A learner-shell player can earn their way to richer
information access over time (e.g., expanded stats appear once a player has
sustained 30+ days of regular use). The default is the safer choice for the
profile; the system can reveal more when the player is ready.

---

## 3. The orthographic-fluency profile (Anna case study)

Anna is a B2-level adult by receptive measures. She understands complex
grammar, parses nuanced explanations, and engages with conversational
English. She is also unable to reliably spell mid-frequency concrete nouns
(keys, neighbour, early). This is not a contradiction — it is a specific and
documented profile in adult Russian L2 acquisition.

Russian orthography is largely phonetic. English is not. Russian L1 speakers
who read English without writing it develop strong receptive vocabulary that
outruns their orthographic memory by years. The result is a profile where
grammar comprehension exceeds writing fluency, and writing fluency is
bottlenecked by the orthographic-to-phonological mapping that has not been
built through production volume.

This profile has architectural implications:

**Translation Drill is the right exercise for this profile.** A quiz input
question with a stem and one blank lets the player type a single word
without producing the full string around it. A Russian-to-English translation
forces full-sentence production and surfaces orthographic failure that the
quiz cannot surface. Translation Drill earns its place not because it is a
different cognitive operation in general, but because it is the only
operation that exposes orthographic fragility for this profile.

**Spelling work is a first-class layer, not a side concern.** The Spelling
Drill exercise type, the Spell Help capture mechanism, and orthography-aware
typo tolerance in scoring all exist because of this profile. They are
small, contained additions, but they sit on a real architectural insight:
production fluency for Anna requires building orthographic automaticity in
parallel with grammatical accuracy.

**Volume must be controlled carefully.** A learner with this profile pushed
toward high writing volume too quickly burns out. Free Write felt
"endless" to Anna after seven turns because every sentence required three
simultaneous decisions (spelling + articles + word order) that she had not
yet automated. The system must respect this ceiling and grow it deliberately
across multiple weeks, on one axis at a time (length, lexical reach, or
grammatical reach — never two at once).

**Receptive level overstates productive level.** Anna's nominal CEFR
profile is B2, derived from receptive measures (comprehension, parsing,
vocabulary recognition). Her productive level — what she can spell,
construct, and produce without error — is currently B1. This divergence
is the rule rather than the exception for the orthographic-fluency
profile, and it matters architecturally: content the player is asked to
*produce* must be calibrated to the productive level (B1 in Anna's case),
not the receptive level. The build plan operationalizes this through the
`level_cap` field on the active window (build plan §4.1, D14), which
constrains the level of content that surfaces in Smart mode and Coach
exercises while permitting a small stretch allowance (~10%) at one level
above for ceiling-testing per Krashen's i+1 framing. Raising the cap
follows from observed productive consolidation, not from aspirational
labeling.

Nicole likely has a related but milder version of this profile. She is a
child whose English exposure has been intermittent. The same principles
apply, with adjustments for age (shorter sessions, themed content, less
explicit framing of the orthographic work).

This is a profile name worth preserving in the design vocabulary because
it justifies a cluster of decisions that would otherwise look unrelated
(Translation Drill, Spelling Drill, typo tolerance, axis-of-growth pacing,
volume ceilings, themed Free Write prompts).

---

## 4. The active window model

The quiz contains nearly 1,900 questions across 27 categories. The Coach
library is growing toward similar breadth. For Artem and Egor, this is an
asset — they want range. For Anna and Nicole, it is a liability — too many
fronts at once means no consolidation on any of them.

The active window model addresses this. Each player has a per-player
classification of every category as one of:

- **Active** — currently being practiced. Surfaces in Smart mode and Coach
  picker. Failures count, accuracy is tracked, exercises target this
  category.
- **Mastered** — accuracy ≥ threshold (default 80% across ≥20 attempts)
  sustained over ≥2 weeks. Stays available for spaced review at long
  intervals (~30 days), but is not actively pushed. Counts toward the
  player's accomplishment record.
- **Locked** — not yet opened. Player does not encounter these questions in
  any surface. Coach exercises do not target them. From the player's point
  of view, the category effectively does not exist.

A player's active window has a target size: 4 categories for Anna and
Nicole, 6 for Ernest, unbounded for Artem and Egor. Window size is a
setting, not a hard constraint.

Categories are promoted from locked to active by an explicit unlock event
when an active category reaches mastered status. The player chooses from a
short curated list (3 options) of what to unlock next; the system does not
auto-promote.

This model produces several effects worth naming:

**It removes failure surface.** A category that is genuinely above a
player's current scaffold (Phrasal Verbs for Anna right now) does not
appear at all, rather than appearing and producing repeated low-accuracy
attempts. The player does not feel the absence; they only feel the focus on
what is in front of them.

**It produces visible progression.** Mastery promotion is an event. The
player completes something. The current open-pool model has no completion
event — every category is permanently in scope, so nothing ever finishes.

**It allows intentional sequencing.** CC and Artem decide what unlocks come
next based on pedagogical fit, not just player preference. The player has
agency (they pick from the curated list) within structure (CC pre-selected
the list).

**It interacts with the learner shell UI.** Because active windows are
small and bounded, the learner shell can simplify the display dramatically
— showing only relevant categories, only relevant exercises, only relevant
stats. Without active windows, the learner shell still has to expose the
27-category surface; with them, it can hide categorization entirely from
the player and just present "what to practice now."

For builder-profile players, active windows are unused. Artem and Egor see
the open pool. The model is purely a learner-shell mechanism.

A risk to manage: a player whose active window contains only difficult
categories experiences no quick wins and may disengage. Active window
composition rule: of the categories in the window, at least one should be
in the player's current strong area (~70%+ accuracy), at least two in the
productive struggle zone (40–65%), and at most one new narrow focus.
Composition is a CC responsibility, revisited when stats are reviewed.

---

## 5. Conversation as the keystone

Anna's first real Free Write session — 12 minutes self-directed, 7 turns,
finished by choice — is the single most important data point the system has
produced. It is categorically different from the engagement profile of any
other surface. Quiz sessions are bursty and brief. Translation Drill is
structured and item-driven. Free Write is a conversation, and conversation,
for adult learners, is where intrinsic motivation lives.

The system's architecture should follow this insight: conversation is the
keystone, and everything else is a warm-up or scaffold for it. Pre-generated
exercises exist to surface error patterns that get worked in conversation.
Spelling drills exist to remove orthographic friction so conversation can
flow more naturally. Active windows exist so conversation has focused
material to work on rather than diffuse possibility space.

For the learner shell, this means:

**Free Write is the destination.** The landing page primary action might
present as "Start practice" but the system routes intelligently — if the
player has done a translation set today, the next thing offered is Free
Write. The flow is warm-up → conversation, not a parallel set of equal
options.

**Conversation quality matters more than item count.** Adding fifty more
translation items has less leverage than improving the Worker prompt's
warmth, response calibration, and Russian-explanation quality. The 12-minute
session was the result of the s91/s92 prompt work, not the 10 items in the
v2 translation set.

**Conversation must remain low-pressure.** The s92 Free Write tone fix
("don't always assign a follow-up rewrite") is canonical. Conversation that
feels like assigned homework breaks engagement faster than any other
single thing the system can do. The Worker system prompt should always
err toward affirming and curious rather than corrective and demanding.

**Children and conversation.** Nicole has zero Free Write sessions to date,
so the engagement claim is unproven for her. The hypothesis is that
conversation will work for her even better than for Anna, because children
typically engage with conversational AI naturally. K-pop-themed starter
prompts and short turns are the right scaffolding. Worth testing as one of
the first things the redesigned UI exposes her to.

Builder-profile players relate to conversation differently. Artem uses CC
live conversational sessions for himself and gets value from them
analytically, but Free Write is not the dominant engagement mode for him.
Egor doesn't use exercises at all. The keystone framing applies to the
learner shell specifically.

---

## 6. The motivational stack

For the learner shell, four motivational levers have been observed or
inferred to work:

**Streaks as social context, not ranking.** Nicole was motivated by seeing
her streak compared to other family members. The lever is not competitive
ranking ("I'm beating Anna") but social presence ("the family is doing
this, I'm part of it"). The Family card on the learner shell landing
surfaces who's practicing today — not absolute streak counts in
descending order, which produce demotivation when behind. The framing is
"Practicing today: Anna, Artem" rather than "Leaderboard: Artem 7d, Anna
3d, Nicole 0d."

**Medals as count, not portfolio.** The existing bronze/silver/gold per
category system works for Nicole — she enjoys watching her count grow over
time. She does not engage with which categories the medals belong to. The
display in the learner shell respects this by surfacing the count
prominently with a positive-delta annotation when applicable, and treating
the per-category breakdown as secondary detail behind a tap.

A nuance: medals can be downgraded in the current system (silver → bronze
when accuracy drops). For builder-profile players this is useful signal.
For learner-profile players it is unactionable bad news. The learner shell
displays positive deltas only — when the count went up, show it; when it
went down or stayed flat, show only the absolute count. Asymmetric display
is the right call here, matching how a coach would naturally surface
information rather than how a performance dashboard would.

No new medal types are needed. The existing system carries the motivational
function adequately; only the display in the learner shell is tweaked.

**Conversation, covered above (§5).** The relational quality of Free Write
is itself motivating. The system speaks warmly, responds curiously, and
treats the player as a person with thoughts worth engaging with. This is
not a "feature" to be added; it is the default tone of every Worker
response, configured through the system prompts.

**Gentle explanation.** Every UI moment for the learner shell is a teaching
moment. Feedback is never "✗ wrong" or "✓ correct" — it is always at least
one warm sentence: "Almost — Russian uses no preposition here, but English
needs 'for'." This applies to medal-earning moments, mastery promotions,
unlock events, and per-item feedback alike. The system should sound like
a coach, not like a graded assessment.

What we deliberately do not build:

- Per-session XP, gem economies, or currency systems
- Animated visual rewards on every correct answer
- Competitive leaderboards or rankings between family members
- Public visibility into another player's failures or low scores
- Push notifications designed to manufacture urgency
- Dark patterns of any kind, including streak-loss anxiety mechanics

These are well-evidenced as ineffective for adult learning and as
manipulative for children. The motivational stack we use is intentionally
narrow because the alternatives are worse than no motivation system at all.

---

## 7. What the system never builds

A list of decisions made once, here, so they don't get re-litigated in
build conversations:

**A third quiz-like surface.** The system has the quiz and the Coach. Both
serve specific roles. A new "test mode" or "assessment" surface would
duplicate function and confuse the mental model. New content goes into
existing surfaces.

**A comprehensive grammar checker.** The Worker corrects what it judges
most important per turn (capped at ~2 errors in Free Write). It does not
mark every error in submitted text. Comprehensive correction is
demotivating, ineffective, and not what coaching looks like.

**Competitive ranking between family members.** Streaks-as-social-context
is a soft lever; ranked leaderboards are a hard one. The hard lever
produces winners and losers in a context (family) where neither role is
desirable.

**Public stats visibility.** Family card shows light social context (who's
practicing today). It does not show another player's accuracy, error
patterns, or weak spots. Each player's data is private by default; only
the shared Stats tab summary is cross-visible, and that summary is being
deemphasized in the learner shell.

**Pure pre-generated content for Artem.** Artem's path is live
conversational via CC. The library exists for the family. Authoring shared
content for both audiences doubles the maintenance burden for marginal
gain.

**Live AI for every interaction.** Pre-generated exercises with regex
feedback are 95%+ as effective as live AI scoring at a fraction of the
cost. Live AI is reserved for Free Write (where it's necessary) and
Escalate (where the player explicitly asks for more depth). Defaulting to
live AI for everything is wasteful.

**A reading comprehension layer.** Curated reading content would be
genuinely valuable for Anna's profile, but it's a different kind of
product (content sourcing, copyright, presentation) and out of scope for
a family tool. Acknowledged as a real gap; explicitly not addressed.

**An audio layer for now.** Dictation and listening exercises would help
Artem's documented business-collocations gap and would be a genuine new
modality. Out of scope for current build sequence; revisit if Phase 2D
acceptance is met cleanly and there's appetite for new modalities.

---

## 8. The role of each surface

The system has multiple surfaces. Their roles relative to each other:

**Quiz** — receptive and constrained-production practice across a wide
question pool. Smart mode picks intelligently. Categories are visible to
builder profile, hidden behind active window for learner profile. Quiz is
the default warm-up surface and the default fallback when no other surface
fits.

**Coach tab — Translation Drill** — Russian-to-English production from
short prompts. Surfaces orthographic and grammatical fragility that the
quiz cannot surface. Pre-generated, regex-scored, escalable.

**Coach tab — Spelling Drill** — single-word production from Russian or
definitional prompts. Targets the orthographic layer specifically. Fed by
captured spelling asks (Spell Help) and predictable L1 traps.

**Coach tab — Free Write** — open-ended conversation in English with the
Worker (Sonnet for Anna/Nicole/Ernest, Opus on Escalate). The keystone
engagement surface for learner profile. Themed per player.

**Coach tab — particle_sort, article_drill, error_correction, russian_trap**
— additional pre-generated exercise types serving specific
high-value pedagogical functions. Authored against active window needs;
ungated for builder profile.

**Stats tab** — detailed per-category and per-question performance data.
Primary surface for builder profile. Heavily simplified or hidden behind
a "show details" toggle for learner profile.

**Exercises tab (current)** — historical view of supplementary exercise
sessions logged via CC or claude.ai chat deeplinks. Largely legacy as
Coach tab takes over family-side exercise delivery. Will eventually fold
into stats history; not in current scope.

**Family tab** — cross-player visibility (streaks, recent activity, basic
stats). Surfaces lightly on learner shell landing as social context. Full
detail behind the tab for builder profile.

**Settings** — per-player configuration (PIN, emoji, name, plan, ui_shell,
active window). Builder-shell players access via the existing settings UI.
Learner-shell players access via overflow menu or never (Artem manages
their settings on their behalf).

These surfaces share Firestore data and the same engine. The differences
are presentation, not substrate.

---

## 9. The role of CC, claude.ai chat, and the Worker

Three AI surfaces serve different functions:

**Claude Code (CC)** — Artem's primary execution surface. Reads and writes
Firestore directly via Firebase MCP. Authors content. Executes builds.
Generates exercises live for Artem's own practice. Picks up doc-driven
work autonomously per the Phase 2 build plan's autonomy mandate.

**claude.ai chat** — strategic design conversations (this conversation, for
example), one-shot grammar/pedagogy questions, document drafting that
benefits from interactive iteration. Not used for routine project state
writes. Cross-project personal context lives here.

**Cloudflare Worker (live AI for family)** — handles Free Write and
Escalate calls from the Coach tab. Constrained, validated, cost-capped.
Russian-explanation aware (per coach_language profile field). Stateless
across sessions; reads `coach_notes.weak_patterns` from Firestore on each
call to inject as system prompt context.

These are not interchangeable. Routine authoring belongs in CC. Family-side
live interactions go through the Worker. claude.ai chat handles the
conceptual work that benefits from human-in-the-loop iteration. The
boundaries are real and worth preserving.

A player-facing implication: **the family never sees CC**, and Artem
rarely sees the Worker (one Worker path was added in s91-worker-r2 for
mobile convenience but is not the default). The mental model from each
audience's perspective is clean — family has a Coach tab in their app,
Artem has a CLI tool plus the same Coach tab when he wants it.

---

## 10. Living evolution

This document is a snapshot of how the system is currently understood. It
should be revisited and revised when:

- A new player profile emerges (Ernest's behavior diverges enough from
  Anna's and Nicole's to warrant a third profile)
- The active window model produces unexpected outcomes (categories not
  promoting on schedule, players stuck in narrow windows)
- Conversation as keystone is challenged by data (Free Write fails to
  engage Nicole when she tries it; engagement curve flattens for Anna)
- The motivational stack needs additions or the asymmetric medal display
  produces problems
- A new surface is genuinely warranted and the §7 prohibition needs
  revisiting

Revisions should be discussed in claude.ai chat, captured in this document,
and the build plan and stats guide updated to match. The document is
authoritative on philosophy, not on operational detail.

---

*This file lives at `references/learning-system-design.md` in the repo.
Companion docs: `phase2-build-plan.md`, `stats-interpretation-guide.md`.*
