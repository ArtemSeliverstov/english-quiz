# Learning System Design

**Status**: living doctrine
**Owner**: Artem · primary execution surface: Claude Code
**Companion docs**: `docs/audience-profiles.md` (per-player implications), `docs/system-mechanisms.md` (active window, surfaces, stats stores), `plans/learning-system-build.md` (engineering execution), `references/stats-interpretation-guide.md` (stats analysis)

This document is the *philosophy* behind the family English learning system. It changes slowly. Read it before any **design-shaping** work (new exercise type, schema change, surface change, cross-cutting protocol, new skill, or any chat-side proposal that introduces a new pattern). Skip when running an existing skill, doing stats review, authoring questions within current categories, or deploying.

When something here conflicts with a proposal, **surface the conflict** — name the section, ask whether philosophy should be revised or the proposal should back off. Don't silently override.

---

## 1. Purpose

A family of five Russian speakers in Bahrain practises English. Profiles vary: builder-mode adults (Artem C1, Egor B2) want self-directed practice and dense instrumentation; learner-mode players (Anna B1, Nicole B1, Ernest B2) need gentle structure and re-engagement after gaps.

**The deliverable is sustained engagement that produces measurable learning gains.** Engagement is the upstream variable; gains follow when engagement is regular and the practice is calibrated. A system the family doesn't open is worth nothing.

Design decisions evaluate against two questions, **in order**:

1. Does this serve the player's continued engagement?
2. Given (1), does this produce learning gains efficiently?

Question 1 sometimes overrides what would be pedagogically optimal in isolation. A perfect drill nobody completes is worse than a slightly suboptimal drill done weekly.

---

## 2. Two audience profiles

The five players resolve to **two design profiles**, not five.

**Builder profile** — Artem, Egor. Self-directed. Tolerate (and prefer) configurability. Read stats and act on them. Self-regulate. Engage as tool-shapers, not product-consumers. → Expose full surface area. Configurability is a feature.

**Learner profile** — Anna, Nicole, Ernest. Engagement is fragile. Decision burden is a tax. Stats and percentages can demotivate. Respond to conversation, narrative progress framing, social context, rare meaningful achievements. → Expose minimum surface area. Decisions the system can make on the player's behalf should be. Each screen has one obvious primary action.

The split is **self-directed builder vs. socially-and-narratively motivated learner** — not adult-vs-child. Anna's adult learner profile converges with Nicole's more than with Artem's. Two profiles, two presentation shells, same engine.

Profile is a per-player flag (`ui_shell: "builder" | "learner"`) determining which presentation layer renders. The underlying data model is shared. Profile is not destiny — a learner-shell player can earn richer information access through sustained engagement.

See `docs/audience-profiles.md` for the orthographic-fluency case study (Anna) and per-profile implications.

---

## 3. Conversation as the keystone

Anna's first real Free Write session — 12 minutes self-directed, 7 turns, finished by choice — is the single most important data point the system has produced. Categorically different from quiz bursts or library-driven drills. Conversation, for adult learners, is where intrinsic motivation lives.

**Architecture follows from this:** every drill is conversational. The Phase D rollout (2026-05-11) converted all five legacy library Coach types (translation, error_correction, article_drill, particle_sort, spelling_drill) to live AI. Library content survives as offline-only fallback. Live AI is the default path for every Coach interaction.

For the learner shell:

**Free Write is the destination.** The landing page's "Start practice" routes intelligently. If the player has done a translation set today, the next thing offered is Free Write. Warm-up → conversation flow, not parallel equal options.

**Conversation quality > item count.** Adding fifty more translation items has less leverage than improving the Worker prompt's warmth, response calibration, and Russian-explanation quality.

**Conversation stays low-pressure.** Don't always assign a follow-up rewrite. Don't keep assigning tasks indefinitely. Soft wrap-up nudges after ~8 turns. Affirming and curious beats corrective and demanding.

**Children and conversation.** Hypothesis: conversation works for Nicole even better than for Anna — children typically engage with conversational AI naturally. K-pop-themed starter prompts and short turns are the right scaffolding.

Builder-profile players relate to conversation differently. Artem uses CC for live conversational sessions analytically; Free Write is not his dominant mode. The keystone framing applies to the learner shell specifically.

---

## 4. Drill design rules

The conversational shift required cross-cutting rules across all live drill modes. These constraints shape every prompt:

**Feedback verbosity per player level.** `feedbackDepth` on `FAMILY_MEMBERS` drives a 5-tier scale: `light` (Artem C1, 1-2 sentences), `medium-light` (Egor B2, 1-2 sentences + L1 contrast), `medium` (Ernest B2, 2-3 sentences + L1 contrast), `medium-kid` (Nicole B1, 2-3 short sentences + simpler vocab + emoji + L1 contrast), `detailed` (Anna B1, 3-5 sentences + L1 contrast + extra example). The worker reads `context.feedback_depth` and branches.

**Adaptive sibling-drill protocol.** On a miss, the AI does NOT move on. Three-strike rule: explain → sibling item same `target_structure` → if clean, move on; if miss again, deeper explanation + one more sibling → if still miss, log as gap, suggest Weak Spots in chat, move to a different structure. **Education before measurement.**

**Educate-first naming.** Every turn (clean or miss) names the rule that applied. The drill isn't testing whether the player fails — it's confirming they understand. Acknowledgments without rule-naming are noise.

**Active categories as content source.** Cross-category drills (Translation, Error Correction) rotate items 1:1 across the player's `learning_path.active_categories`. Each item targets one category; `weak_patterns` refines the structure within. Builder-shell players (empty active window) fall back to weak_patterns-broad rotation.

**P1 — Weakest quiz category is always a Weak Spots candidate.** Bottom-N `catStats` (<70%, n≥5) maps to catalog topics via `CAT_TO_TOPIC`. Those topics MUST appear in topic proposals regardless of whether `weak_patterns` prose mentions them.

---

## 5. The motivational stack

For the learner shell, four levers work:

**Streaks as social context, not ranking.** "Practicing today: Anna, Artem" — not "Leaderboard: Artem 7d, Anna 3d, Nicole 0d." The lever is social presence, not competition.

**Medals as count, not portfolio.** Existing bronze/silver/gold system works. Display the count prominently with positive deltas. Medals can be downgraded internally, but the learner shell shows only positive deltas — when count went up, show it; when flat or down, show only the absolute. Coach-style framing, not performance dashboard.

**Conversation (§3).** The relational quality of Free Write is itself motivating.

**Gentle explanation.** Every UI moment is a teaching moment. Feedback is never "✗ wrong" or "✓ correct" — always at least one warm sentence: "Almost — Russian uses no preposition here, but English needs 'for'." The system sounds like a coach, not a graded assessment.

---

## 6. What we never build

Made once, here, so they don't get re-litigated.

- **A third quiz-like surface.** Quiz and Coach serve specific roles. A new "test mode" duplicates function. New content goes into existing surfaces.
- **A comprehensive grammar checker.** The Worker corrects what it judges most important per turn. Comprehensive correction is demotivating, not coaching.
- **Competitive ranking between family members.** Streaks-as-social-context is a soft lever; ranked leaderboards are a hard one. Hard levers produce winners and losers in a context (family) where neither role is desirable.
- **Public stats visibility.** Each player's data is private. The Family card shows light social context only.
- **Per-session XP, gem economies, currency systems.** Not for adults, not for children.
- **Animated visual rewards on every correct answer.** Manipulative.
- **Push notifications designed to manufacture urgency.** Dark pattern.
- **Streak-loss anxiety mechanics.** Dark pattern.
- **A reading comprehension layer.** Genuinely valuable for Anna's profile but different product (content sourcing, copyright). Out of scope.
- **An audio layer (dictation, listening exercises).** Genuine new modality; out of scope for current build sequence.

---

## 7. Living evolution

This document is a snapshot. Revise when:

- A new player profile emerges (Ernest diverges enough from Anna/Nicole)
- The active window model produces unexpected outcomes
- Conversation-as-keystone is challenged by data (Free Write fails to engage Nicole; Anna's curve flattens)
- A new surface is genuinely warranted and §6 needs revisiting

Revisions happen in claude.ai chat, land here first, then the build plan and stats guide update to match. **The doc is authoritative on philosophy, not operational detail.**

History: §6 originally included "Live AI for every interaction" as a don't-build (cost-conservation rule). Reversed 2026-05-11 when Phase D shipped all Coach drills as live-AI primary. The cost ceiling is now a workspace spend cap on the Anthropic console, not a presence prohibition on live AI.

---

*Cross-cutting principles (P1 weakest-cat-always-candidate, P2 PWA/CC mirror, P3 single feedback DB) live in `references/operational-rules.md`. Per-player implementation details live in `docs/audience-profiles.md`. Surface inventory + mechanism details live in `docs/system-mechanisms.md`.*
