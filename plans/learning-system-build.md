# Learning System Build Plan

**Status**: active execution document
**Owner**: Artem · primary execution surface: Claude Code (laptop)
**Predecessor**: `phase2-coach-tab.md` (Phase 2A–2C, archived as historical record). Carries forward Phase 2D and beyond.
**Companion docs**: `docs/learning-system-design.md` (philosophy).
**Content authoring**: lives in `plans/question-bank-plan.md` — quiz waves, PV ladder, article intervention, Coach library per player, quiz orthography, bank quality audits, tier ordering for content.

This is the active **engineering** build document. It contains the build sequence for the learning system (active windows, learner shell, spelling layer, medal display), schemas, decisions amended from the predecessor doc, and an append-only status log. CC executes against this document without coming back to claude.ai chat between sessions.

If something is ambiguous when CC reads this, that's a doc bug — flag it and patch the doc rather than guess. If a build decision conflicts with the philosophy in `docs/learning-system-design.md`, surface it to Artem rather than silently override.

The document avoids calendar references. Work proceeds as fast as it proceeds. Restart events are gated on readiness criteria, not dates.

---

## Contents

1. How CC uses this document
2. Goal and end state
3. Locked decisions (D1–D14: shell split, active window model, mastery promotion, composition rule, floor-bouncing, spelling layer, level cap, etc.)
4. Build sequence — engineering workstreams
   - 4.1 Active window plumbing (Firestore schema + PWA filter logic)
   - 4.2 Learner shell (UI for Anna/Nicole/Ernest)
   - 4.3 Spelling layer + medals tweak
5. Parallel work — engineering Tier 1 (content tiers in `question-bank-plan.md` §6)
6. Schemas summary
7. Restart-readiness checklist
8. Acceptance: Phase 2D complete when
9. Open items (initial active-window composition per player, etc.)
10. Source plans absorbed
11. Phase 3 follow-on cleanup (userMemories, RTDB sunset, App Check)
12. Status log — archived

Content authoring is in `plans/question-bank-plan.md`. Operational backlog is in `plans/open-items.md`.

---

## 1. How CC uses this document

At the start of any CC session related to Phase 2D:

1. Read this document end to end (~10 minutes; one read per session).
2. Check the **Status log** (§ end) for current state.
3. Pick the next unstarted item using this priority:
   - Build sequence items (§4) take precedence when they are unblocked
   - Otherwise: pick from parallel work tiers (§5), Tier 1 first
   - Tier 4 (background fill-in) only on explicit request from Artem
4. Execute the work in the session.
5. Append a status log entry describing what was done, what was learned,
   and any patches needed to earlier sections.
6. If a locked decision (§3) needs reopening, surface to Artem; don't
   silently amend.

CC autonomy mandate continues from the predecessor doc: pick the next
unstarted item without asking unless a locked decision is at stake or the
work touches user-facing copy that needs Artem's voice review.

---

## 2. Goal and end state

Phase 2D ends when **Anna, Nicole, and Ernest can each open the app, see
a learner shell tailored to them, and engage with content scoped to their
active window without overwhelm or navigation friction**. This is the
precondition for the restart push to Nicole and Ernest, which sits
immediately after Phase 2D acceptance.

Concretely, the end state is:

- Learner shell live for Anna, Nicole, Ernest
- Builder shell unchanged for Artem and Egor
- Active window model implemented and populated for the three learner-shell
  players
- Coach library populated to minimum thresholds per player per type (see `plans/question-bank-plan.md` §4 Coach library)
- Spelling layer engine shipped (Spell Help capture, Spelling Drill exercise type, typo tolerance); spelling/orthography content in `plans/question-bank-plan.md` §3.3 + §4
- Medal display tweaked per the asymmetric rule (§4.3)
- Free Write themed prompts authored per player
- Restart-readiness checklist (§7) green

After this, the restart event happens (Artem hands devices to Nicole and
Ernest, walks them through the new landing, observes engagement). Phase 3
cleanup tasks follow.

---

## 3. Locked decisions

Carries forward locks from the predecessor doc with explicit amendments
where Phase 2D changes them. Reading order: predecessor doc § 4 first,
then this section's amendments and additions.

### 3.1 Decisions amended from predecessor doc

| Original lock | Amendment | Rationale |
|---|---|---|
| **PV2** (CC picks gap/input/MCQ mix per PV based on existing per-category input share table and observed weakness) | CC picks the type mix per PV per the PV ladder rebalance specification (`plans/question-bank-plan.md` §3.1), weighted toward recognition rungs. The original lock pointed toward more input items where stuck patterns lived; the rebalance recognizes that those input failures are downstream of a missing recognition substrate, and the right intervention is more MCQ items, not more input items. | The 3.4% MCQ → 32% input inverted pyramid (Apr 30 status log) is a substrate problem, not a retrieval-practice problem. Adding more input drills on a thin recognition foundation perpetuates the production gap. |
| **A1** (Hybrid: pre-generated default for family + Free Write live AI + escalate-to-AI button. Artem can use either CC OR the Worker path. Library content remains family-only.) | Carries forward unchanged. Phase 2D adds player-specific scoping of *which* library content surfaces for which learner-shell player via the active window model (§4.1). Library content is still family-only in the sense that Artem doesn't read from it; the change is intra-family scoping. | Active windows are about player-side surfacing, not library construction. |
| **A6** (§4.2 primary action routing was Coach-only — Translation Drill / Spelling Drill / Free Write fallback) | Quiz inserted as priority step 3 (between Spelling Drill and Free Write). Quiz uses Smart mode + `applyLearnerWindowFilter` so the pool respects `learning_path.active_categories` and `level_cap` automatically. Fresh Translation Drill removed from primary routing — still accessible via "Practice something else →" picker. Resume-partial-Translation stays at top priority (a commitment in flight is more urgent than a fresh default). | Coach has 10–30 items per family-shell player; Quiz has ~2,000 questions filtered to the active window. Treating Coach as the primary daily practice burns through library content in days, leaving Free Write as the default — a worse experience than mixed-format Quiz. Coach is correctly framed as targeted intervention (calque drills, orthographic fragility) layered on top of Quiz background practice. |
| **A7** (§4.2 single "Start practice" button — A6 had it routing primarily to Quiz) | Two buttons on the learner-shell landing instead of one. **Primary (gold) "Start practice"** routes to Coach exercises by priority order (translation → article_drill → particle_sort → error_correction → spelling_drill), with Free Write as the always-available fallback. **Secondary (subtle) "Start quiz"** routes directly to the Smart-mode quiz that A6 had wired into the primary path. **Tertiary text-link "Practice something else →"** stays as the fine-grained Coach picker escape hatch. | A6 was supply-side reasoning: rationing Coach use against Quiz capacity. Real-life signal from the family contradicts it — Quiz is the *boring* path; the engagement-positive surfaces are Free Write and the chip-UX drills. Engagement trumps supply, because if the player stops opening the app, supply doesn't matter. The two-button layout keeps Quiz one tap away (so A6's supply concern is mitigated, not ignored), and lets the player self-route to drill mode when they want it instead of being silently routed there as the default. The supply problem is the right thing to fix by authoring more Coach content faster (in `plans/question-bank-plan.md`), not by burying the engaging surface behind a click. |

### 3.2 New locks for Phase 2D

| # | Decision | Locked value | Rationale |
|---|---|---|---|
| **D1** | UI shell split | Two shells: `builder` (current UI, for Artem and Egor) and `learner` (simplified, for Anna, Nicole, Ernest). Implemented as conditional rendering on a `players/{name}.ui_shell` field. Single-file PWA architecture preserved. | Audience profiles diverge enough that a single UI cannot serve both well. Two shells is the minimum split that addresses the documented friction without architectural complexity. |
| **D2** | Active window model | Per-player category classification (active / mastered / locked) for learner-shell players. Builder-shell players see open pool unchanged. Default active window size: 4 for Anna, 3 for Nicole, 6 for Ernest. Promotion threshold: ≥80% accuracy across ≥20 attempts sustained ≥14 days. | Reduces overwhelm for B1 and child learners. Produces visible progression via mastery promotion events. Allows intentional sequencing of category exposure. |
| **D3** | Active window unlock mechanic | When a category reaches mastered status at the player's current `level_cap`, system surfaces a curated unlock list with **two pathway options**: (a) **deepen** — raise `level_cap` for that category by one CEFR level (B1 → B2 etc.) while keeping the category active, or (b) **broaden** — promote the category to mastered and add a new category at current `level_cap`. The deepen option presents 1 entry; the broaden option presents 3 curated category candidates. Player picks one of the four total options. CC pre-selects the broaden candidates based on pedagogical fit. Mastered categories continue to surface for spaced review at ~30-day intervals. | Player agency within structure. Depth-vs-breadth choice is meaningful — some players prefer to deepen one category before broadening, others prefer breadth-first. Adults respond well to this combination. |
| **D4** | Active window composition rule | Of the active categories, at least one in current strong area (≥70% accuracy), at least two in productive struggle zone (40–65%), at most one new narrow focus. CC verifies composition during stats reviews; rebalances when violated. Composition is evaluated **at the player's current level_cap** — a category in productive struggle at B1 is not the same signal as struggle at B2. | Prevents grind-without-wins, which is itself an engagement killer. Level-aware evaluation prevents misreading struggle that's actually above-scaffold content as productive struggle. |
| **D5** | Floor-bouncing categories | Categories where a player has <30% accuracy across 15+ attempts with no improvement curve are eligible for explicit lock by CC during stats review. Locked floor-bouncers can be revisited after prerequisite categories consolidate. Question-level analog: questions at 100% error rate across 3+ attempts auto-lock for 6 weeks before resurfacing. | Continued exposure to genuinely above-scaffold content builds learned helplessness. Locking is correct sequencing, not failure. |
| **D6** | Spelling Drill exercise type | New Coach tab exercise type. Single-word production from Russian or definitional prompt. Schema in §6.3. Targeted at orthographic-fluency profile (Anna primarily, Nicole likely). | Quiz cannot surface orthographic fragility because input questions accept word-level blanks rather than full strings. Spelling Drill closes this gap. |
| **D7** | Spell Help capture | Persistent button in learner shell Coach tab. Player types a word as best they can; system returns correct spelling + one-line example sentence; the (attempted, correct, context) triple logs to `players/{name}/spelling_log/{ts}` for future Spelling Drill authoring. | Captures real failure points from natural usage. Higher signal than predicted L1 traps alone. |
| **D8** | Typo tolerance with surfacing | Translation Drill scoring extended: accept submission if Levenshtein distance ≤ 2 from any `correct_answers` form, but show a soft "spelling note: 'keys' not 'kies'" line in feedback. Article-tolerance from s90r2 is the precedent pattern. | Anna gets credit for grammar (which she got right) while orthographic feedback still lands. Reduces false negatives that broke v1 engagement. |
| **D9** | Medal display in learner shell | Asymmetric: positive deltas annotated, neutral or negative deltas show count only. Newly-earned medals called out in session-end card; lost medals not surfaced. Builder shell display unchanged. | Downgrades are real signal for builder profile and unactionable bad news for learner profile. Asymmetric display matches coaching norms. |
| **D10** | Spelling Drill priority over particle_sort for learner shell | Spelling Drill is the second Coach exercise type to ship for Anna and Nicole, ahead of particle_sort. For Artem, particle_sort priority is unchanged (he benefits from the PV ladder bridge). Coach exercise type priority becomes player-specific. | Anna's orthographic gap is the immediate engagement bottleneck; particle_sort serves a deeper PV substrate problem that is correctly gated for her active window. |
| **D11** | Family card on learner shell landing | Light social context: "Practicing today: [names with avatars]." Not absolute streaks in descending order. Egor included (confirmed). | Streak-as-social-context lever observed working for Nicole; ranked leaderboard counter-lever (demotivation when behind) avoided by framing. |
| **D12** | Themed Free Write starter prompts | 5 prompts per player, themed to their interests/context. Bundled in PWA, not from Firestore. Anna: home, family, padel, neighbours, daily routine. Nicole: K-pop, school, friends, weekend plans, music. Ernest: school, sports, weekend, books, friends. Artem: business, travel, cycling, current project, opinion. Egor: IELTS-aligned topics. | Generic starters leak generic into the conversation. Themed starters anchor the player in personally-relevant vocabulary. |
| **D13** | Restart-readiness as event-not-date | The restart push to Nicole and Ernest happens after the §7 checklist is fully green. No calendar pressure. Items not done by any particular date are simply not done; no compromise on the checklist to hit a date. | Calendar pressure on family-tool work produces shoddy outcomes. Quality of first impression for Nicole and Ernest matters more than speed. |
| **D14** | Level cap defaults | Per-player content level ceiling within the active window. Defaults: Anna `level_cap: "B1"`, `stretch_allowance: 0.10`. Nicole `level_cap: "B1"`, `stretch_allowance: 0.10`. Ernest `level_cap: "B1"`, `stretch_allowance: 0.15` (slightly higher because his receptive ceiling is higher). Artem and Egor `level_cap: null` (no cap). Anna's cap is set at B1 despite a B2 nominal profile because her productive ceiling (orthographic + grammatical) is currently at B1; raising it depends on consolidation, not aspirational labeling. CC adjusts caps via the §3.2 D3 mastery promotion mechanic; manual override is possible during stats reviews when warranted. | Receptive measures and productive measures diverge in the orthographic-fluency profile. Level cap operates on productive content the player is asked to produce, calibrated to current productive ceiling, not aspirational receptive level. The 10–15% stretch allowance prevents the cap from becoming a floor that blocks ceiling growth. |

---

## 4. Build sequence

Five major workstreams. They interleave rather than phase strictly, because
the dependency structure permits parallelism. CC picks the next unblocked
item per the priority in §1.

### 4.1 Active window plumbing

The data layer that makes the learner shell possible. Engineering work in
the PWA + Firestore.

**Schema additions** (Firestore, additive, write-safe):

```
players/{name}/learning_path:
{
  ui_shell: "builder" | "learner",        // default "builder", set per player
  active_categories: ["prepositions", "articles", ...],
  mastered_categories: [
    {
      category: string,
      mastered_date: ISO timestamp,
      last_review: ISO timestamp,
      retention_score: number             // accuracy on most recent review
    }
  ],
  level_cap: "B1" | "B2" | "C1" | null,   // content level ceiling; null = no cap (builder)
  stretch_allowance: number,              // 0.0–0.20 fraction of selections allowed at level_cap+1
  next_unlock_options: [                  // CC-curated; 1 deepen + 3 broaden per D3
    {
      category: string,
      pathway: "deepen" | "broaden",
      rationale: string                   // short note for stats-review traceability
    }
    // exactly 4 entries: 1 with pathway "deepen", 3 with pathway "broaden"
  ],
  active_window_size: number,             // 4 default for Anna/Nicole, 6 Ernest
  promotion_threshold: {
    accuracy: number,                     // 0.80 default
    min_attempts: number,                 // 20 default
    window_days: number                   // 14 default
  },
  composition_last_checked: ISO timestamp
}
```

**PWA logic changes**:

- Smart mode question selection adds two filters: when `ui_shell == "learner"`,
  only consider questions where (a) `q.cat` is in `active_categories`, OR is
  in `mastered_categories` AND `last_review` was >30 days ago (spaced
  review); AND (b) `q.level <= level_cap`, with a `stretch_allowance`
  fraction of selections permitted at `level_cap + 1` (i.e., a B1-capped
  player gets ~10% B2 items mixed in for ceiling-testing per Krashen i+1
  framing).
- Coach exercise picker (§4.2) reads from the same filter when surfacing
  exercise type availability per player. Coach exercises authored above
  the player's level_cap don't appear in the picker; stretch allowance
  applies for incrementally harder Coach items the same way.
- Stats display (§4.2) renders only active and mastered categories for
  learner shell; locked categories don't appear.

**Level cap rationale**: per `docs/learning-system-design.md` §3 (orthographic-fluency
profile), category-level access without level constraint causes B1 players
to encounter B2 content within nominally-active categories — defeating
the active window's overwhelm-reduction purpose. Level cap operates within
the category filter, not above or below it.

**Migration approach for existing players**:

- Default all players to `ui_shell: "builder"` initially, preserving current
  behavior.
- CC explicitly flips Anna, Nicole, Ernest to `ui_shell: "learner"` after
  the learner shell ships and is verified working with Anna as testbed.
- For each learner-shell player, CC populates initial `active_categories`
  based on current `catStats`:
  - Anna: 4 categories per the composition rule (CC proposes; Artem
    confirms in stats review)
  - Nicole: 3 categories (tighter scope for child-learner cognitive
    load; her 39-session history is bursty/player-initiated, so
    initial window prioritises depth over breadth)
  - Ernest: 6 categories
- All other categories enter `next_unlock_options` candidate pool; CC
  picks the first 3 unlock options per player based on pedagogical fit.
- All remaining categories are implicitly locked (anything not in active,
  mastered, or next_unlock_options is treated as locked).

**Floor-bouncer locking (D5)**:

- During stats review, CC identifies categories meeting the floor-bouncing
  pattern (<30% accuracy, 15+ attempts, no improvement curve over 4 weeks).
- These are explicitly listed in a comment field on `learning_path` (e.g.,
  `floor_bouncers: ["phrasal_verbs"]`) for documentation.
- Question-level floor-bouncers (3+ attempts, 100% error rate) auto-lock
  per question via a new field on per-question stats:
  `qStats[questionId].locked_until: ISO timestamp` (6 weeks ahead).
  Smart mode skips locked questions until `locked_until` passes.

**Acceptance for §4.1**:
- All five players have `learning_path` populated correctly
- Smart mode for Anna only surfaces questions in her active window
- Stats display for Anna only shows active + mastered categories
- Builder-shell players (Artem, Egor) see no behavioral change
- Floor-bouncer auto-lock works for new failures (test with a synthetic
  case)

### 4.2 Learner shell

Engineering work. The simplified UI for Anna, Nicole, Ernest.

**Implementation principle**: single-file PWA preserved. Conditional
rendering at the top level of each major surface based on
`currentPlayer.ui_shell == "learner"`. Most builder-shell code paths are
preserved unchanged; learner shell is additive rendering branches.

**Landing page (learner shell)**:

Three vertical zones, top to bottom:

*Zone 1 — Greeting and primary actions.*
- Top line: "Hi {name} 👋" (or themed greeting for Nicole, e.g., emoji-rich)
- **Primary button (gold) "Start practice"** — routes to Coach exercises (engaging surface). Hint: "free write, drills — we'll pick"
- **Secondary button (subtle) "Start quiz"** — routes directly to Smart-mode quiz (10 grammar questions). Hint: "10 grammar questions"
- **Tertiary text link "Practice something else →"** — opens Coach picker for fine-grained type selection
- Two-button split locked in §3.1 A7. The default is the engaging surface; quiz is one tap away when the player wants drill.

*Zone 2 — Family pull (D11).*
- "Practicing today: [name1, name2, ...]" with small avatars/initials
- Names of all family members who have logged any session today
- If current player is the first today: "Be the first one today — start a
  session"
- Egor included (confirmed)

*Zone 3 — Last time.*
- Single sentence narrative line generated server-side
- Examples: "Last time, you wrote about your morning routine for 7 turns"
  or "Last time, you finished a translation set and got 9/10"
- Generated once per session start by reading the player's most recent
  `coach_sessions` and/or `exercises` entry

No tabs visible at top level. Overflow menu (three lines or "More" in a
corner) reveals: history, achievements, settings, switch player.

**Primary action routing logic** (revised per §3.1 A7, t6):

When the player taps **"Start practice"**, the system picks a Coach
exercise in this priority order:

1. Resume in-progress Translation Drill (commitment in flight).
2. Spelling Drill if Spell Help captured ≥5 words since last drill.
3. Iterate `[translation, article_drill, particle_sort, error_correction, spelling_drill]` —
   probe library count for `target_player == currentPlayer || 'all'`,
   start the first type with items available.
4. Free Write fallback (always available, live AI).
5. Last resort: Quiz (only if Free Write is unavailable).

When the player taps **"Start quiz"**, the system goes directly to a
Smart-mode quiz of 10 questions filtered by `learning_path.active_categories`
+ `level_cap`. Empty pool falls back to Free Write so the player isn't
stranded.

The "Practice something else →" link still opens the Coach picker for
explicit type selection.

**Coach picker (learner shell)**:

When revealed via "Practice something else" or after completing a session,
shows only exercise types with library content for the player's active
window. Disabled types are hidden, not greyed. Each type shows a count:
"Translation (10)", "Free Write (∞)". Maximum visible types: 4. Beyond
that, an "and more" affordance reveals the rest.

**Stats display (learner shell)**:

Replaces the current category grid for learner-shell players. Layout:

- **Active categories section**: card per active category, showing
  category name (warm label, not technical: "Articles" not "art"),
  current accuracy with a soft visual indicator (filled vs unfilled, no
  percentage number unless tapped), recent attempts count
- **Mastered section**: list of mastered categories with date achieved
  ("Prepositions — mastered last week")
- **Coming next section**: 3 cards showing the unlock options, with
  descriptions ("Past tenses", "Comparatives", "Modal verbs")
- **No locked section visible.** Locked categories don't appear.

Tap on a category reveals more detail (per-question breakdown, history,
the percentage numbers). Default view stays narrative.

**Medal display (learner shell, per D9)**:

On landing page: "🥇 4 medals" with positive-delta annotation when
applicable. On session-end card: callout for newly-earned medals only.
Tap on medal count reveals per-category medal grid (existing UI).

**Schema addition for medal display**:

```
players/{name}/medals_history:
[
  { week_iso: "2026-W18", bronze_count: N, silver_count: N, gold_count: N }
]
```

Captured lazily on landing page load: read current counts, compare to
most recent snapshot. If >7 days have passed, append new snapshot. CC
picks the simpler implementation (no scheduled writes).

**Settings access for learner shell**:

Behind overflow menu. Standard fields (PIN, name, emoji, plan). The
`ui_shell` field itself is not user-editable from the learner shell
(Artem manages this via builder shell or CC). The `active_window_size`
field is similarly admin-only.

**Acceptance for §4.2**:
- Anna can navigate from app open to in-progress Free Write conversation
  in 2 taps
- Nicole can navigate from app open to in-progress translation in 2 taps
- Stats display shows only active + mastered for learner-shell players
- Builder-shell players see no change in any surface
- Family card surfaces today's active players correctly
- Medal display follows asymmetric rule (positive deltas only)

### 4.3 Spelling layer + medals tweak

Engineering and small content work. Implements D6, D7, D8, D9.

**Spell Help button**:
- Persistent affordance in learner shell Coach tab
- Tap opens small input ("How do you spell ___?")
- Player types attempt; system returns correct spelling + one example
  sentence
- Logs to `players/{name}/spelling_log/{ts}` with `attempted`, `correct`,
  `context` (free-text from player or auto-captured surrounding turn if
  triggered from Free Write)

**Spelling Drill type (per D6)**:
- Schema below
- Picker entry in Coach tab when player has library content for it
- Scoring: exact match required (this is a spelling exercise, after all)
  with single-character typo tolerance only after 2+ failed attempts on
  the same item ("close — check the second letter")

**Spelling Drill schema** (`exercises_library/spelling_drill/{id}`):

```
{
  ...common_fields,                       // see phase2-coach-tab.md §6.1
  prompt_definition_ru: string,           // "ключи (от двери)"
  prompt_definition_en: string,           // "small metal objects to open doors"
  correct: string,                        // "keys"
  common_misspellings: [
    {
      pattern: string,                    // exact misspelling
      feedback: string                    // L1-aware correction
    }
  ],
  example_sentence: string,
  source: string                          // "anna_asked_2026-04-28" | "predicted_l1_trap"
}
```

**Typo tolerance with surfacing (per D8)**:
- Translation Drill scoring extended: Levenshtein distance ≤ 2 from any
  `correct_answers` form is accepted
- Soft "spelling note: 'keys' not 'kies'" line appended to feedback when
  this triggers
- Article-tolerance from s90r2 is the precedent pattern; extend the
  normalize→compare logic to include Levenshtein distance check after
  exact-match fails

**Medal display tweak (per D9)**:
- See §4.2 learner shell stats display
- Schema addition: `players/{name}/medals_history` per §4.2
- Asymmetric display logic: compute delta = current_count - prior_snapshot
  count. If delta > 0, show "(+{delta} this week)". Else show count only.
- Session-end card: track which medals exist before session vs after; show
  only newly-earned medals; never show lost medals

**Acceptance for §4.3**:
- Spell Help button live in learner shell Coach tab
- ≥10 spell help captures land in `spelling_log` during Anna's first
  week of usage post-deploy
- Spelling Drill exercise type works end-to-end with at least 5 items per
  family member
- Typo tolerance prevents false negatives in Translation Drill (test
  case: Anna submits "We are waitng for you tomorrow" → accepted with
  spelling note)
- Medal display follows asymmetric rule
- New medal callout fires when medal earned in session

---

## 5. Parallel work — engineering Tier 1

Engineering items required for restart-readiness. Content tiers (Tier 2 builder-pool content, Tier 3 data-driven, Tier 4 background fill-in) live in `plans/question-bank-plan.md` §6.

| Item | Where it lives | Notes |
|---|---|---|
| Active window plumbing | §4.1 | Foundational. |
| Learner shell landing + routing | §4.2 | Anna is testbed first. |
| Spell Help capture + Spelling Drill exercise type + typo tolerance | §4.3 | Engineering. |
| Medal display tweak (D9) | §4.3 | Small engineering. |
| Family card on learner shell (D11) | §4.2 | Small engineering. |

**Ordering rule**: build sequence (§4) > Tier 1 engineering above > content tiers in question-bank-plan.md §6. Within a tier, items can be done in any order.

---

## 6. Schemas summary

Consolidated for CC reference. Detail in the relevant sections above.

```
players/{name}.ui_shell                  // "builder" | "learner" — D1
players/{name}/learning_path             // active window data — §4.1
players/{name}/medals_history            // for delta computation — §4.2
players/{name}/spelling_log              // Spell Help captures — §4.3
players/{name}/qStats[id].locked_until   // question-level floor-bouncer — §4.1

exercises_library/spelling_drill/{id}    // Spelling Drill items — §4.3
```

All additions are write-safe and additive. Older clients absent these
fields handle missing fields gracefully. No migration of existing
collections required beyond CC explicitly populating `learning_path` for
the three learner-shell players.

---

## 7. Restart-readiness checklist

The restart push to Nicole and Ernest happens when this checklist is
fully green. Per D13: no calendar pressure, no compromise on items.

- [ ] Active window plumbing (§4.1) implemented and tested
- [ ] Learner shell live for Anna (testbed) with observed usage of ≥3
      sessions
- [ ] Anna's `learning_path.active_categories` populated and verified
      against composition rule (D4)
- [ ] Nicole's `learning_path.active_categories` populated
- [ ] Ernest's `learning_path.active_categories` populated
- [ ] Coach library coverage for all three learner-shell players meets
      `plans/question-bank-plan.md` §4 thresholds
- [ ] Spelling layer (Spell Help, Spelling Drill, typo tolerance) shipped
      and tested with Anna
- [ ] Medal display tweak shipped and verified (positive deltas only,
      session-end callouts)
- [ ] Family card surfaces today's active players correctly
- [ ] Themed Free Write prompts bundled in PWA per player
- [ ] End-to-end walkthrough completed by Artem as each persona (Anna,
      Nicole, Ernest)
- [ ] Builder shell verified unchanged for Artem and Egor
- [ ] First-session experience clean: Nicole/Ernest can earn their first
      medal in their first session (or have an equivalent affirming
      moment), and the landing page after their first session reflects it

When all green, restart event happens. Artem hands devices to Nicole
and Ernest, walks them briefly through landing (no formal training, just
"this is for you"), observes engagement over the following weeks via
telemetry.

---

## 8. Acceptance: Phase 2D complete when

- [ ] Restart-readiness checklist (§7) was green and restart event happened
- [ ] Nicole has logged ≥3 sessions in the learner shell across ≥2 weeks
      post-restart, without falling back to claude.ai chat or asking
      Artem for help to navigate
- [ ] Ernest has logged ≥3 sessions similarly
- [ ] Anna's engagement either sustained or grown vs pre-shell baseline
- [ ] No category in Anna's or Nicole's active window has been at <30%
      accuracy for 30+ days (composition rule working)
- [ ] At least 1 mastery promotion event has happened across the three
      learner-shell players (proves the unlock mechanic works
      end-to-end)
- [ ] API spend within $5–15/month band
- [ ] CC handles all stats reviews and content authoring without
      claude.ai chat involvement for routine work

When met, Phase 2D is complete. Phase 3 cleanup tasks (3A–3D from
predecessor doc) become the next focus.

---

## 9. Open items

Decided at build time with current information. CC decides during execution
without coming back to chat.

- **Composition of Anna's initial 4-category active window at level_cap B1**:
  CC pulls current `catStats` filtered to B1 items, proposes per the
  composition rule (D4) and the level cap (D14), Artem confirms.
  **Important caveat**: Anna's high accuracy on Natural English Idioms
  is a measurement artifact, not a competence signal — the category's
  MCQ structure permits identification of correct answers from option
  form alone (one short/natural, one over-formal, one obviously wrong),
  without parsing idiom meaning. Do NOT use Everyday Idioms as the
  strong-area anchor in Anna's window. See `references/stats-interpretation-guide.md`
  §9 (Categories with structural caveats) and `plans/question-bank-plan.md` §5 (Bank quality audits) for the
  category re-engineering work item. Default proposal (revised):
  Prepositions (B1, productive struggle), Articles (B1, productive
  struggle), Spelling (new narrow focus), and one strong-area category
  identified by CC from current `catStats` excluding Everyday Idioms
  (candidates to evaluate: Tenses, basic Vocabulary, simple Conditionals,
  or any other B1 category showing genuine ≥70% accuracy on items where
  the question structure isn't a giveaway). Stretch allowance 10% for
  ceiling-testing into B2. Note: Anna's nominal B2 profile reflects
  receptive measures; productive ceiling is currently B1, which is what
  the level_cap targets.
- **Composition of Nicole's initial 3-category active window at level_cap
  B1**: CC same. Default proposal: Irregular Verbs (B1), Present Tense
  (one variant, B1), themed Vocabulary (K-pop/school, B1). Stretch
  allowance 10%.
- **Composition of Ernest's initial 6-category active window at level_cap
  B1**: CC same. Includes Articles per documented gap. Stretch allowance
  15% (higher receptive ceiling supports more stretch).
- **Initial unlock options per player**: CC picks unlock options per the
  D3 mechanic — for each player, identify the next-eligible deepen target
  (typically the strongest active category at level_cap that's closest to
  mastery threshold) and 3 broaden candidates at current level_cap.
  Captured in `learning_path.next_unlock_options` with explicit
  `pathway: "deepen" | "broaden"` tagging.
- **Themed Free Write prompts wording**: CC drafts; Artem reviews if any
  prompt feels off-voice for the player.
- **Learner shell visual rhythm**: CC picks reasonable defaults for
  spacing, typography, color. Acknowledged as a non-designer pass; if
  Artem changes his mind on bringing in design help later, this is the
  surface that benefits most.
- **First-session affirming moment for Nicole/Ernest**: ensure they earn
  the "first session" medal or an equivalent visible accomplishment in
  their first session. Implementation detail; CC picks.

---

## 10. Source plans absorbed

This document folds in the following project plans. The originals stay in
project knowledge as analytical references; this document supersedes their
authoring sequences.

| Source plan | Where it lands here | Status of original |
|---|---|---|
| `phrasal_verbs_mastery_plan.html` | `plans/question-bank-plan.md` §3.1 (PV ladder rebalance), §4 (Coach library per-player), §6 (tier sequencing) | Stays as analytical reference; not superseded |
| `article_diagnostic_2026-04-05.html` | `plans/question-bank-plan.md` §3.2 (article intervention), §4 (Coach article_drill per player), §6 (tier) | Stays as analytical reference; not superseded |
| `phase2-coach-tab.md` (current) | Largely absorbed; locks preserved with explicit amendments in §3.1; this document picks up at Phase 2D. Phase 3 housekeeping items from its §13.4 carry forward to §11 below. | Becomes archived historical record after this doc lands |
| `PHASE2_PLAN.md` predecessor | Phase 2A–2C items already shipped; Phase 3 housekeeping items carry forward to §11 below; content backlog absorbed into §5; Live Log Stage 1.5 superseded (see §11.5) | Deletion confirmed once §11 items are tracked here |

**Acceptance criterion supersession note**: Predecessor `phase2-coach-tab.md` §16
included a cross-the-board criterion "all 5 pre-generated exercise types
≥10 exercises per type for at least one family member." This criterion
is **explicitly superseded** by per-player active-window thresholds in
per-player thresholds in `plans/question-bank-plan.md` §4 and engagement-based acceptance in §8. Rationale: with per-player
active windows, a player only encounters their window's content, so
requiring uniform exercise-type coverage across players makes no sense.
The underlying intent (coverage breadth so each player has variety, not
just one drill type) survives in question-bank-plan.md §4 per-player thresholds, which
specify ≥3 exercise types per player at restart-readiness. The
`russian_trap` exercise type, dropped from the cross-the-board count
during initial absorption, is restored to Anna's authoring threshold
(question-bank-plan.md §4.1) with sequencing per question-bank-plan.md §4.4.

---

## 11. Phase 3 follow-on cleanup

Carried forward from PHASE2_PLAN.md and `phase2-coach-tab.md` §13.4. These
items are housekeeping/security tasks gated on Phase 2D acceptance (§8).
They become the next CC focus after the restart event has happened and
Phase 2D acceptance is confirmed.

CC does not pick these up autonomously while Phase 2D work remains.
Once Phase 2D is acceptance-met, these become Tier 1 follow-on work in
the priority order listed below.

### 11.1 userMemories cleanup (3A in original numbering)

Discussed at length on 2026-04-30. Deliberately deferred until Phase 2 ships
because the cleanup needs an accurate read of chat's post-Phase-2 role —
and that role isn't fully settled until the family is using Coach tab and
Phase 2D is stable.

When triggered (in claude.ai chat, ~15 min):

- Add a directive sentence to userMemories about the project being managed
  in Claude Code, with explicit guidance on what to redirect to CC vs
  answer in chat
- Drop genuinely-stale operational details: deploy versions, KB version
  numbers, deploy.html workflow, recent travel state, time-bound roadmap
  items
- Keep contextual context useful for grammar Q&A in chat: family member
  profiles (level, L1, focus, themes), architecture summary, question
  authoring philosophy, personal context (role, Bahrain, communication
  preferences, hobbies, family relationships)

The earlier-proposed "delete all per-player observations because they're
owned elsewhere" was rejected — chat can't read the repo, so deleting that
context blinds chat for grammar Q&A. Keep it.

### 11.2 RTDB sunset (3B in original numbering)

After **2026-05-28** (the 30-day rollback window from the migration
expires):

- Verify nothing references the RTDB endpoint anywhere (grep repo, inspect
  PWA bundle)
- Delete RTDB instance via Firebase Console
- Remove `rtdb_backup_*.json` from `D:\Claude\backups\` if confident no
  rollback needed
- One-line entry in `references/version-log.md`

Estimated: 5 minutes.

### 11.3 Delete MIGRATION_HANDOFF.md (3C in original numbering)

Once §11.1 is done, the doc has served its purpose. `git rm`, commit, push.

Estimated: 1 minute.

### 11.4 D:\Claude\English\ cleanup (3D in original numbering, optional)

Old working folder with deploy.html-era Python tooling and `.env`. Once
Phase 2D is shipped:

- Rotate the GitHub PAT and recreate `.env` cleanly elsewhere if still
  needed
- Archive folder to `D:\Claude\backups\English-archive-2026-MM.zip`
- Delete original

Or leave it. Disk is cheap. Cost-of-keeping = 0.

Estimated: ~10 minutes if done; zero if skipped.

### 11.5 Live Log Stage 1.5 — superseded

PHASE2_PLAN.md identified an outstanding "active session UI" item under
the per-item logging path (`?exupd=` and `?exfin=` deeplinks). This is
treated as **superseded by Coach tab implementation**, not pending:

- Coach tab MVP (s90r2) ships per-item Firestore upserts via the
  `partial: true` mechanic on each answer, with `partial: false` on
  finish — functionally what active session UI was going to provide
- Per-item live logging via `?exupd=` deeplinks remains supported by the
  PWA but unused via CC, per the SKILL.md update in
  `phase2-coach-tab.md` §9.3
- No active session UI work is needed; the engagement-monitoring use case
  is served by Coach tab session data going to Firestore directly

If a future use case revives the need (e.g., real-time multi-device
visibility into another player's in-progress session), revisit. Until
then, no work item.

### 11.6 Deeplink layer status (documentation, no work)

The PWA supports several URL-parameter deeplinks. Their current usage
status, captured here so future CC sessions don't have to rediscover:

- **`?exlog=BASE64`** — single-shot exercise logging from claude.ai chat.
  Legacy; only fires if CC is unavailable and a session is run in chat
  with a deeplink generated. Not used in normal operation. PWA handler
  retained as fallback.
- **`?exupd=BASE64` and `?exfin=BASE64`** — per-item live exercise log
  writing to `exercise_active/{session_id}` collection (Stage 1
  infrastructure). Dormant; no current consumer. CC writes via Firebase
  MCP directly; Coach tab writes to `players/{name}/exercises/{ts}` with
  the partial: true mechanism. PWA handler retained.
- **`exercise_active` Firestore collection** — Stage 1 storage for the
  above; currently no writes happen to it in normal operation. Collection
  exists, contains historical entries from Stage 1 testing.
- **`?reset=1`** — service worker cache refresh. Actively used after
  every deploy. Not going anywhere.

No work item from this section. Documentation only. The dormant
mechanisms cost nothing in production and provide a fallback path if
either CC or Coach tab is unavailable. Active removal is not warranted.

### 11.7 Anonymous Auth on Firestore

After Phase 2D ships and Coach tab is writing real session data at scale,
tighten Firestore rules from open-write to `request.auth != null`. Each
device gets a UID via Anonymous Auth.

Originally deferred at Phase 1 because family scale + project-ID obscurity
made it lower priority; the calculus shifts as Coach tab data accumulates
(`coach_sessions` contains personal Free Write content, which is more
sensitive than aggregate quiz stats).

Implementation:
- Enable Anonymous Auth in Firebase console
- Update Firestore rules in `firestore.rules` to require `request.auth`
- Update PWA initialization to call `signInAnonymously()` before any
  Firestore reads/writes; cache the resulting UID in localStorage so the
  same device gets a stable identity across sessions
- Test: existing players continue working; new device gets new UID;
  unauthenticated requests rejected
- Deploy via `firebase deploy --only firestore:rules` (the workflow
  established in Phase 2B kickoff)

Estimated: 1 CC session.

This is the highest-priority Phase 3 follow-on item from a real-risk
standpoint. Ordering within Phase 3: §11.7 first (security tightening),
then §11.1 (userMemories), then §11.2 (RTDB sunset, gated on date), then
§11.3 (MIGRATION_HANDOFF deletion, gated on §11.1), then §11.4 (D:\Claude
cleanup, optional). §11.5 and §11.6 are documentation only, no work.

---
## 12. Status log

Archived to plans/archive/phase2-status-log-2026-05.md as of 2026-05-11.
Append new session entries there or open a fresh status-log file.
