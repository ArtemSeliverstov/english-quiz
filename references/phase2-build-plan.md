# Phase 2D Build Plan

**Status**: active execution document
**Owner**: Artem · primary execution surface: Claude Code (laptop)
**Predecessor**: `phase2-coach-tab.md` (Phase 2A–2C, now archived as
historical record). This document carries forward Phase 2D and beyond.
**Companion docs**: `learning-system-design.md` (philosophy),
`stats-interpretation-guide.md` (CC stats reference).

This is the active build document for Phase 2D. It contains the build
sequence, content authoring targets, schemas, decisions amended from the
predecessor doc, parallel work tiers, and an append-only status log. CC
executes against this document without coming back to claude.ai chat
between sessions.

If something is ambiguous when CC reads this, that's a doc bug — flag it
and patch the doc rather than guess. If a build decision conflicts with
the philosophy in `learning-system-design.md`, surface it to Artem rather
than silently override.

The document avoids calendar references. Work proceeds as fast as it
proceeds. Restart events are gated on readiness criteria, not dates.

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
- Coach library populated to minimum thresholds per player per type (§4.5)
- Spelling layer shipped (capture, drill type, typo tolerance, quiz
  orthography category)
- Medal display tweaked per the asymmetric rule (§4.6)
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
| **PV2** (CC picks gap/input/MCQ mix per PV based on existing per-category input share table and observed weakness) | CC picks the type mix per PV per the PV ladder rebalance specification (§4.2), weighted toward recognition rungs. The original lock pointed toward more input items where stuck patterns lived; the rebalance recognizes that those input failures are downstream of a missing recognition substrate, and the right intervention is more MCQ items, not more input items. | The 3.4% MCQ → 32% input inverted pyramid (Apr 30 status log) is a substrate problem, not a retrieval-practice problem. Adding more input drills on a thin recognition foundation perpetuates the production gap. |
| **A1** (Hybrid: pre-generated default for family + Free Write live AI + escalate-to-AI button. Artem can use either CC OR the Worker path. Library content remains family-only.) | Carries forward unchanged. Phase 2D adds player-specific scoping of *which* library content surfaces for which learner-shell player via the active window model (§4.1). Library content is still family-only in the sense that Artem doesn't read from it; the change is intra-family scoping. | Active windows are about player-side surfacing, not library construction. |

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
- Coach exercise picker (§4.4) reads from the same filter when surfacing
  exercise type availability per player. Coach exercises authored above
  the player's level_cap don't appear in the picker; stretch allowance
  applies for incrementally harder Coach items the same way.
- Stats display (§4.4) renders only active and mastered categories for
  learner shell; locked categories don't appear.

**Level cap rationale**: per `learning-system-design.md` §3 (orthographic-fluency
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

### 4.2 PV ladder rebalance

Content authoring work. Reshapes the planned PV Phase 2 batches per the
recognition-first analysis.

**Sourcing**: `phrasal_verbs_mastery_plan.html` in project knowledge stays
as the canonical analytical reference (verb families, CEFR ladder, family
diagnostic). Doc B reshapes the *authoring sequence and type mix*; the
analytical content is unchanged.

**Revised Batch 1 + Batch 2 combined target** (~100 items total, replaces
the original ~130 across the two batches):

| Rung | Format | Target count | Purpose |
|---|---|---|---|
| Receptive — meaning | MCQ "what does X mean here?" | ~25 | Anchor PV semantics in context |
| Receptive — particle | MCQ "which particle fits?" | ~20 | Build particle intuition |
| Selection | gap-fill | ~25 | Bridge to production |
| Production | input | ~15 | Test transfer, not foundation |
| Coach — particle_sort | library | ~15 | Receptive→productive bridge in chat form |

**Authoring sequence**:
1. First, the 6 stuck PVs from the Apr 30 transform session — for each,
   author 1 MCQ + 1 gap + 1 input with shared `linked_question_ids` so
   ladder-pair tracking works. ~18 items dedicated to ladder completion on
   the weakest cluster.
2. Then the remaining ~32 items skewed toward MCQ (~20 MCQ, ~8 gap, ~4
   input) for the rest of the GET/BRING/TURN/SET/COME/TAKE family coverage.
3. Then Batch 2 verb families (give up, find out, sort out, work out, call
   off, figure out, point out, rule out, end up, take over) following the
   same ladder split.
4. Coach particle_sort items (~15) authored in parallel, targeting the
   same PV families.

**Active window implications**:
- Phrasal Verbs is **locked in Anna's active window** initially. Authored
  content sits in library; she does not encounter it. Eligible for unlock
  after prepositions consolidate (likely several months out).
- For Nicole, PV is not in initial active window. Authored content is
  similarly invisible to her until much later in her progression.
- For Ernest, PV may enter active window earlier depending on observed
  performance (his 6-category window has more room).
- For Artem and Egor, content surfaces as authored (open pool).

**Acceptance for §4.2**:
- Total PV bank shape after rebalance: Recognition (MCQ) ~50, Selection
  (gap) ~120, Production (input) ~60. Approximate 5:12:6 ratio is the
  target; current 5:96:47 is the diagnosed problem.
- ~15 Coach particle_sort items authored and pushed to library
- All new questions pass the standard build quality checklist (per session
  prompt and KB)

### 4.3 Article intervention

Content authoring work. The existing `article_diagnostic_2026-04-05.html`
plan (~95 questions across three phases) gets folded into the active window
model.

**Sourcing**: `article_diagnostic_2026-04-05.html` in project knowledge
stays as the canonical analytical reference. Doc B adapts the *delivery
cadence* and *active-window-awareness* of the original plan.

**Authoring sequence**:
- Verify the original plan's three phases map to receptive → selection →
  production. If they don't, CC restructures so they do. This is the same
  ladder principle as PV.
- Author in batches of ~25–30 questions, not all 95 at once. This matches
  Anna's consumption rate and prevents the everything-appears-at-once
  overload.
- First batch lands when active window plumbing is ready and Articles is
  in Anna's window.
- Subsequent batches land as Anna works through the prior batch.

**Coach article_drill content** (~15 items per family member):
- Schema in current phase2-coach-tab.md §6.1.2.
- For Anna: in her initial active window; ships with the first batch of
  quiz article additions.
- For Ernest: high priority because his profile flags articles as a
  recognition-vs-production gap.
- For Nicole: initial batch authored; surfaces only when articles enters
  her active window.

**Article Decision Drill in Artem's weekly slots**: unchanged. Artem's
article work happens through CC live sessions and is distinct from the
family-side library content. Doc C (stats interpretation) flags this
separation explicitly so CC doesn't conflate the two when reviewing stats.

**Acceptance for §4.3**:
- ~95 article quiz questions authored across 3 batches
- ~15 article_drill items authored per family member
- Article quiz content surfaces correctly in Anna's active window when
  Articles is active
- Ernest's article_drill items surface when his window opens to articles

### 4.4 Learner shell

Engineering work. The simplified UI for Anna, Nicole, Ernest.

**Implementation principle**: single-file PWA preserved. Conditional
rendering at the top level of each major surface based on
`currentPlayer.ui_shell == "learner"`. Most builder-shell code paths are
preserved unchanged; learner shell is additive rendering branches.

**Landing page (learner shell)**:

Three vertical zones, top to bottom:

*Zone 1 — Greeting and primary action.*
- Top line: "Hi {name} 👋" (or themed greeting for Nicole, e.g., emoji-rich)
- Single large button: "Start practice"
- Tapping routes intelligently per the routing logic below

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

**Primary action routing logic**:

When the player taps "Start practice", the system picks the next exercise
in this priority order:

1. If there's an unfinished Translation Drill set (partial, not finished),
   resume it.
2. If Spell Help has captured ≥5 unique words since the last Spelling Drill
   session, offer Spelling Drill.
3. If the player hasn't done a translation set today AND active window
   contains categories with translation library content, start a
   Translation Drill set.
4. Otherwise, offer Free Write with a themed starter prompt.

The system does not ask the player to choose. It picks. The player can
override via a small "Practice something else" link below the primary
button, which reveals the Coach picker (filtered to active window
content only).

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

**Acceptance for §4.4**:
- Anna can navigate from app open to in-progress Free Write conversation
  in 2 taps
- Nicole can navigate from app open to in-progress translation in 2 taps
- Stats display shows only active + mastered for learner-shell players
- Builder-shell players see no change in any surface
- Family card surfaces today's active players correctly
- Medal display follows asymmetric rule (positive deltas only)

### 4.5 Coach library content authoring

Per-player content thresholds for restart-readiness. CC authors against
these targets in parallel with engineering work.

**Anna** (active window: Prepositions, Articles, Spelling, plus one
strong-area category TBD per §9 — see §9 Everyday Idioms caveat;
**not** Everyday Idioms):
- Translation Drill: existing 10 items + ~10 more (~20 total)
- Spelling Drill: ~15-20 items (mix of captured + predicted L1 traps)
- Russian Trap: ~10 items (post-Spelling Drill; see §4.6 sequencing)
- Article Drill: ~15 items (overlaps with §4.3 article work)
- Free Write: 5 themed starter prompts (D12)

**Nicole** (active window: Irregular Verbs, Present Tense, themed
Vocabulary; subject to CC composition review):
- Translation Drill: ~10 items, B1, themed K-pop/school/friends, Russian
  explanations
- Spelling Drill: ~10 items, focused on common kid-relevant
  high-frequency words
- Article Drill: deferred until articles enters her window
- Free Write: 5 themed starter prompts (D12), short and concrete

**Ernest** (active window: 6 categories; CC composes from his profile
including articles, error correction priorities):
- Translation Drill: ~10 items, B1+
- Article Drill: ~15 items (his documented gap)
- Error Correction: ~15 items focused on articles and prepositions
- Free Write: 5 themed starter prompts (D12)

**Authoring quality bar**: per current phase2-coach-tab.md §10.

**Acceptance for §4.5**:
- All three learner-shell players have minimum library coverage to
  populate their active window for the restart push
- Russian-language content (Translation Drill, Spelling Drill, Article
  Drill explanations) verified for Anna and Nicole
- English-language content for Ernest verified
- All Free Write themed prompts authored and bundled in PWA

### 4.6 Spelling layer + medals tweak

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
- See §4.4 learner shell stats display
- Schema addition: `players/{name}/medals_history` per §4.4
- Asymmetric display logic: compute delta = current_count - prior_snapshot
  count. If delta > 0, show "(+{delta} this week)". Else show count only.
- Session-end card: track which medals exist before session vs after; show
  only newly-earned medals; never show lost medals

**Acceptance for §4.6**:
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

**Russian Trap sequencing note** (per §4.5 Anna threshold):

The `russian_trap` exercise type (predecessor doc §6.1.5 schema, with the
explicit `calque_trap` field) is authored *after* Spelling Drill ships
and Anna has accumulated 2-3 sessions of Spell Help captures and Free
Write turns. Rationale: real calque patterns from Anna's early sessions
provide stronger authoring signal than predicted L1 traps. Authoring on
predicted traps alone risks items that don't match her actual error
profile.

Russian Trap is Anna-only at restart-readiness scope. Nicole and Ernest
do not get Russian Trap content in initial active windows — the calque
pattern is much milder for kids and the existing exercise types serve
their needs better. Defer authoring for them indefinitely; revisit only
if their session data shows a calque pattern emerging.

### 4.7 Quiz orthography category additions

Content work. Three small additions to address orthographic gaps not
covered by Spelling Drill (which is single-word focused) or existing
quiz content.

**Sub-categories** (~60 items total):
1. **Tricky orthographic patterns** (~25 items): irregular plurals
   (knife/knives, child/children), -y → -ies, doubled consonants in -ing
   forms, common silent letters
2. **Compound noun spelling** (~15 items): every day vs everyday, no one
   vs no-one, on to vs onto, all right vs alright
3. **Homophone confusables** (~20 items): their/there/they're, your/you're,
   its/it's, then/than, lose/loose, advice/advise

**Format**: input or MCQ as appropriate. These are quiz questions, not
Coach exercises. They surface in Smart mode when the orthography category
is in active window.

**Active window implications**: this category is in Anna's initial active
window (under "Spelling" or a similar warm label). For Nicole, deferred
until her foundation consolidates. For Artem, surfaces in open pool.

**Acceptance for §4.7**:
- ~60 questions authored across the 3 sub-categories
- New category visible in builder shell stats grid
- Category appears as "Spelling" in learner shell active window for Anna

---

## 5. Parallel work tiers

Content and audit work alongside the build sequence. CC follows §1
priority: build sequence first when unblocked, parallel work otherwise,
Tier 1 before Tier 2 etc.

### 5.1 Tier 1 — Required for restart-readiness

| Item | Notes |
|---|---|
| Active window plumbing (§4.1) | Engineering. Foundational. |
| Learner shell landing + routing (§4.4) | Engineering. Anna is testbed first. |
| Spell Help capture + Spelling Drill schema + typo tolerance (§4.6) | Small engineering + small content. |
| Anna's library content (§4.5 Anna line — translation, spelling, article drill, free write prompts) | Required for Anna learner-shell experience. |
| Anna's Russian Trap content (~10 items) | Tier 1 but **dependency-gated**: authored after Spelling Drill ships and Anna has 2-3 sessions of Spell Help / Free Write data per §4.6 sequencing note. |
| Nicole's library content (§4.5 Nicole line) | Required for Nicole restart. |
| Ernest's library content (§4.5 Ernest line) | Required for Ernest restart. |
| Themed Free Write prompts (D12) | Small content; bundled in PWA. |
| Medal display tweak (§4.6, D9) | Small engineering. |
| Family card on learner shell (D11) | Small engineering. |

### 5.2 Tier 2 — Builder-pool content (Artem and Egor benefit immediately; family benefit when active windows open)

| Item | Notes |
|---|---|
| PV ladder rebalance Batch 1 (§4.2 step 1-2, ~50 items) | Ships to library; surfaces for Artem/Egor in Smart mode immediately, gated for Anna/Nicole. |
| Article intervention first batch (§4.3, ~25-30 quiz items + ~15 article_drill per player) | Ships in batches; surfaces per active window. |
| Quiz orthography additions (§4.7, ~60 items) | Surfaces in Anna's window as "Spelling". |
| B2 Idioms (~15 items, from predecessor doc Tier 2) | Fills genuine level hole; can later seed Russian Trap exercises. **Note**: this is a new B2 category authored from scratch with proper distractors — distinct from the structurally-compromised B1 Everyday Idioms category (see `stats-interpretation-guide.md` §9). Author with form-shortcut diagnostic in mind. |
| Used To input (~7 items, from predecessor doc Tier 2) | 6.3% input share — highest priority among gap-fill. |
| Word Formation input cleanup (any remaining gaps from s87 work) | If applicable per CC's review of current state. |

### 5.3 Tier 3 — Data-driven; starts after restart push and observation period

| Item | Notes |
|---|---|
| PV ladder rebalance Batch 2 (§4.2 step 3, remaining ~50 items including new verb families) | Inform with observed PV usage from Artem CC sessions and any family encounters. |
| C1 expansion (Reported Speech, Relative Clauses, G&I, Collocations) (~60 items) | Authored against observed weakness from CC + family Coach data. |
| Additional library content as active windows expand for Anna/Nicole/Ernest | Author against unlock events as they happen. |
| Coach particle_sort full coverage (~15 items per player) | Per family member as PV enters their active window. |
| **MCQ distractor audit Pass 1 (triage)** — single session, ~30 min | Sample 5-10 MCQ items per category across the bank's 27 categories. For each sample, apply the form-shortcut diagnostic from `stats-interpretation-guide.md` §9: can the correct answer be identified from option form alone (length asymmetry, register asymmetry, obvious grammar errors visible without semantic processing)? Output: per-category trust rating table (clean / needs-fuller-audit / structurally-compromised). Everyday Idioms is presumed structurally-compromised and provides the calibration anchor. |
| **MCQ distractor audit Pass 2 (full audit of flagged categories)** | Sizing TBD per Pass 1 output. Question-by-question audit of categories Pass 1 flags as compromised or needs-fuller-audit. For each flagged question, document whether form-shortcut is present and what the re-engineering scope would be (distractor rewrite vs full question rewrite). Defer this item until Pass 1 lands. |
| **Everyday Idioms category re-engineering** | Known structurally-compromised per stats-interpretation-guide §9. ~80 items requiring distractor rewrite (plausible options of similar length and register, no obvious-wrong distractor) or selective full rewrite where distractors can't be salvaged. Sizing depends on Pass 2 audit. Authored against Anna's productive vocabulary needs once she resumes the category at corrected calibration. |

### 5.4 Tier 4 — Background fill-in (opt-in only)

CC does not pick Tier 4 work autonomously. Tier 4 runs only when:
- Artem explicitly requests it ("do an audit session"), OR
- Every item in Tiers 1–3 is genuinely complete

| Item | Notes |
|---|---|
| s78 input hint/q redundancy audit (~406 items) | Polish, not correctness. |
| `exp` contrastive rewrite (~585 fields) | Polish. `exp_rewriter` tool already exists. |

### 5.5 Tier ordering rule

Same as predecessor doc: build sequence > Tier 1 > Tier 2 > Tier 3.
Within a tier, items can be done in any order. Tier 4 never picked
autonomously.

---

## 6. Schemas summary

Consolidated for CC reference. Detail in the relevant sections above.

```
players/{name}.ui_shell                  // "builder" | "learner" — D1
players/{name}/learning_path             // active window data — §4.1
players/{name}/medals_history            // for delta computation — §4.4
players/{name}/spelling_log              // Spell Help captures — §4.6
players/{name}/qStats[id].locked_until   // question-level floor-bouncer — §4.1

exercises_library/spelling_drill/{id}    // Spelling Drill items — §4.6
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
      §4.5 thresholds
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
  **Important caveat**: Anna's high accuracy on Everyday English Idioms
  is a measurement artifact, not a competence signal — the category's
  MCQ structure permits identification of correct answers from option
  form alone (one short/natural, one over-formal, one obviously wrong),
  without parsing idiom meaning. Do NOT use Everyday Idioms as the
  strong-area anchor in Anna's window. See `stats-interpretation-guide.md`
  §9 (Categories with structural caveats) and §5.3 Tier 3 for the
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
| `phrasal_verbs_mastery_plan.html` | §4.2 (ladder rebalance), §4.5 Anna gating, §5.2/5.3 (tier sequencing) | Stays as analytical reference; not superseded |
| `article_diagnostic_2026-04-05.html` | §4.3 (intervention), §4.5 Coach article_drill, §5.2 (tier) | Stays as analytical reference; not superseded |
| `phase2-coach-tab.md` (current) | Largely absorbed; locks preserved with explicit amendments in §3.1; this document picks up at Phase 2D. Phase 3 housekeeping items from its §13.4 carry forward to §11 below. | Becomes archived historical record after this doc lands |
| `PHASE2_PLAN.md` predecessor | Phase 2A–2C items already shipped; Phase 3 housekeeping items carry forward to §11 below; content backlog absorbed into §5; Live Log Stage 1.5 superseded (see §11.5) | Deletion confirmed once §11 items are tracked here |

**Acceptance criterion supersession note**: Predecessor `phase2-coach-tab.md` §16
included a cross-the-board criterion "all 5 pre-generated exercise types
≥10 exercises per type for at least one family member." This criterion
is **explicitly superseded** by per-player active-window thresholds in
§4.5 and engagement-based acceptance in §8. Rationale: with per-player
active windows, a player only encounters their window's content, so
requiring uniform exercise-type coverage across players makes no sense.
The underlying intent (coverage breadth so each player has variety, not
just one drill type) survives in §4.5 per-player thresholds, which
specify ≥3 exercise types per player at restart-readiness. The
`russian_trap` exercise type, dropped from the cross-the-board count
during initial absorption, is restored to Anna's authoring threshold
(§4.5) with sequencing per §4.6.

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

Append-only. CC adds an entry at the end of every session that touches
Phase 2D work. Each entry: what was done, what was learned, what changed
in the doc.

---

### {date TBD by CC} — Doc created

- Doc consolidated from claude.ai chat session covering: PV ladder
  rebalance, article intervention folding, active window model, learner
  shell split, spelling layer, medal display tweak, restart-readiness
  framing
- Phase 2A–2C history archived in predecessor `phase2-coach-tab.md`
- Phase 3 housekeeping items from PHASE2_PLAN.md and predecessor doc
  carried forward to §11; Live Log Stage 1.5 marked superseded
- Three companion docs live: `learning-system-design.md` (philosophy),
  this document (build), `stats-interpretation-guide.md` (stats reference)
- All locked decisions in §3 captured; amendments to predecessor doc
  flagged in §3.1
- CC picks up next unstarted item per §1 autonomy mandate

### 2026-05-01 — Session intake: predecessor archived, amendments + active windows proposed

- Predecessor `phase2-coach-tab.md` moved to `references/archive/`
  (commit `c267806`). `PHASE2_PLAN.md` was already absent from repo
  root prior to this session — commit message records formal
  supersession.
- Amendments requiring Artem's explicit confirmation listed for review:
  A1 (§3.1 PV2 ladder rebalance), A2 (§10 acceptance criterion
  supersession of predecessor §16 cross-the-board exercise-type count),
  A3 (§11.5 Live Log Stage 1.5 superseded — closes backlog item),
  A4 (§3.2 D10 Spelling Drill ahead of particle_sort for learner
  shell), A5 (§3.2 D13 event-not-date restart framing).
- Initial `active_categories` and `next_unlock_options` proposed for
  Anna, Nicole, Ernest per §9 open items, drawing on live Firestore
  catStats. §9 caveat re Everyday Idioms applied — Anna's strong-area
  anchor proposed as Tenses (71%, n=59), not Everyday English.
  Nicole's proposal deviates from §9 default (Present Tense subset
  not a discrete catStats category) — proposed Prepositions (86%,
  strong) / Irregular Verbs (57%, struggle) / Vocabulary themed
  (57%, struggle). Ernest provisional given 4-week dormancy and
  n=8 sessions; Articles forced in window despite 37% n=19
  (below D4 struggle band but above D5 floor-bouncer threshold).
  No `learning_path` writes — pending Artem confirmation.
- Doc bugs flagged for patch (not yet patched): (i) §3.2 D2 vs §4.1
  Nicole window size mismatch (4 vs 3), (ii) §4.1 Nicole rationale
  "zero engagement history" inaccurate (39 sessions in Firestore),
  (iii) `next_unlock_options` schema in §4.1 (`[string, string, string]`)
  doesn't match §3.2 D3 + §9 (1 deepen + 3 broaden = 4 entries with
  `pathway` tagging).
- Stopping per session instructions. Implementation work resumes
  next session after Artem confirms amendments + active windows.

### 2026-05-01 — Artem confirmation: amendments + active windows + doc patches

- **Amendments A1–A5 confirmed.** CC may act on the §3.1 PV2 ladder
  rebalance, the §10 acceptance-criterion supersession, the §11.5
  Live Log Stage 1.5 retirement, the §3.2 D10 Spelling Drill priority
  for learner shell, and the §3.2 D13 event-not-date framing without
  re-confirmation.
- **Initial active window proposals confirmed** for Anna, Nicole,
  Ernest. CC writes `learning_path.active_categories`,
  `next_unlock_options`, `level_cap`, `stretch_allowance`, and
  `active_window_size` in the next session as part of §4.1 active
  window plumbing — not in this intake session.
- **Doc bugs patched in this commit**:
  - §3.2 D2 window size: "4 for Anna, 3 for Nicole, 6 for Ernest"
    (was "4 for Anna and Nicole")
  - §4.1 Nicole rationale: replaced "zero engagement history" with
    accurate cognitive-load + bursty-engagement framing
  - §4.1 `next_unlock_options` schema: now array of 4 objects with
    `category` / `pathway` / `rationale`, matching §3.2 D3 + §9

### v20260501-s93 — §4.1 active window plumbing

Build sequence item §4.1 substantially landed. Three slices:

1. **Firestore data layer.** All 5 players now have `ui_shell` (top-level)
   and `learning_path` (nested object) populated. Anna / Nicole / Ernest
   carry the confirmed initial windows from the §9 proposals; Artem /
   Egor carry empty defaults. All 5 still on `ui_shell: "builder"` —
   no behavior change for current users. Schema interpretation
   resolved: `ui_shell` lives at player-doc top-level (per §6 + D1
   wording); `learning_path` nests everything else (no `ui_shell`
   inside, despite the §4.1 schema diagram redundantly listing it).

2. **PWA logic — additive, behind `ui_shell === 'learner'` gate.**
   - `defaultData()` carries `ui_shell: 'builder'` and
     `learning_path: null`
   - `loadFromFirebase` round-trips both fields from Firestore
   - `selectQuestions` now applies an active-window filter
     (`applyLearnerWindowFilter`): when `ui_shell === 'learner'`
     and `learning_path.active_categories.length > 0`, restricts
     pool to active categories (or mastered-and-due-for-spaced-review
     >30d) AND level ≤ `level_cap` with probabilistic
     `stretch_allowance` sampling at cap+1. Builder shell pool is
     unchanged.
   - Mastered-spaced-review gate: 30 days per §4.1.

3. **Floor-bouncer auto-lock — universal, all shells.**
   - `maybeAutoLockFloorBouncer(id)` fires after every qStats update
     in `recordAnswer` and `recordMultiAnswer`. Locks the question
     for 6 weeks (`FLOOR_BOUNCER_LOCK_MS`) when `seen ≥ 3` and
     `correct === 0`. After the lock expires, if the user gets it
     wrong again on resurface, the lock re-extends.
   - `isQuestionLocked(id)` filters locked questions out of the
     selection pool universally — works on builder shell too.

**Verification (preview, builder DB):**
- selectQuestions in builder shell returns mixed-category pool
  (no behavior change)
- floor-bouncer probe: synthesise seen=3/correct=0 → lock horizon
  computes to 42 days; isQuestionLocked returns true; pool excludes
- learner-shell synthetic probe: with active=[Tenses, Articles],
  cap=B1, stretch=0.10 → returns only Tenses/Articles, mostly B1
  with ~10% B2 stretch as designed

**Acceptance state for §4.1:**
- ✅ All 5 players have `learning_path` populated correctly
- ✅ Floor-bouncer auto-lock works (verified via synthetic probe)
- ✅ Builder-shell players see no behavioral change (verified)
- ⏳ "Smart mode for Anna only surfaces questions in her active
  window" — gated end-to-end test deferred to §4.4 when the learner
  shell ships and Anna is flipped to `ui_shell: "learner"`. Logic
  is in place and exercises correctly under synthetic probe.
- ⏳ "Stats display for Anna only shows active + mastered categories"
  — defers to §4.4 (learner-shell stats display).

**Coach picker filter (§4.1 acceptance bullet):** not yet wired.
Coach-tab content surfacing currently has no learner-window gate.
Tracked as follow-up under §4.1; will land alongside §4.4 learner
shell since the picker UI itself is a §4.4 surface.

**Next session candidates** (per §1 priority):
- §4.6 spelling layer (Spell Help button, Spelling Drill schema,
  typo tolerance) — Tier 1, smaller engineering footprint than
  §4.4 learner shell
- §4.4 learner shell landing + routing — Tier 1, the gating
  surface for testing §4.1 end-to-end
- §4.5 Anna's library content authoring — Tier 1 content work
- Tier 2 PV ladder rebalance Batch 1 (Artem/Egor benefit
  immediately; family gated)

### v20260501-s94 — §4.6 spelling layer + Anna content (substantially complete)

**Scoping note**: Initial intent in prior status entry was to spread
across §4.4 learner shell, §4.5 content, §4.6 spelling, and Tier 2 PV
in one session. Negotiated down to a focused §4.6 + Anna content
slice for proper integration depth — §4.4 learner shell, §4.3 article
batches, and Tier 2 PV remain queued.

**Shipped**:

1. **Spelling Drill exercise type (D6)** — full implementation:
   - Schema authored at `exercises_library/spelling_drill/items/{id}`
     with `prompt_definition_ru`, `prompt_definition_en`, `correct`,
     `common_misspellings: [{pattern, feedback}]`, `example_sentence`,
     `source`, `fallback_feedback`
   - Picker button added to Coach tab; `coachStartType` extended via
     `COACH_TYPE_TO_LIBRARY` map
   - Prompt rendering with RU primary cue + EN secondary
   - Scoring: exact match required; up to 3 attempts per item with
     "Try again" between; on final attempt or known-misspelling match,
     correct spelling + example sentence shown; on attempts ≥ 3 with
     no pattern match, Levenshtein-distance nudge ("one letter off",
     "two letters off")
   - Sessions written to `players/{name}/exercises/{ts}` with
     existing `coachUpsertSession` flow

2. **Translation Drill typo tolerance (D8)** — Levenshtein ≤ 2 from
   any normalised correct form is accepted; when triggered, feedback
   shows "✓ Correct — grammar fine" + soft spelling note pointing at
   the closest correct form. Pattern feedback for known errors
   continues to fire when exact match fails. `sessionResults` carries
   `typo_surfaced: true` for downstream pattern analysis.

3. **Spell Help button (D7)** — persistent affordance below the Coach
   picker. Player types attempt + optional context; Worker called
   with `mode: 'free_write'` and a structured one-shot user message;
   reply parsed as line 1 = correct spelling, line 2 = example
   sentence; (attempted, correct, context, raw_reply) triple logged
   to `players/{name}/spelling_log/{ts}`. No worker code change
   needed — repurposes existing `free_write` mode.

4. **Anna content authored** (20 items total):
   - 10 Spelling Drill items (`sp_anna_b01`–`sp_anna_b10`) targeting
     her documented weak_patterns (typo cluster, plural-noun
     omission, article confusions) + predicted L1 traps (silent gh,
     i-before-e, doubled consonants, -fe → -ves plurals)
   - 10 Translation Drill items (`tr_anna_b11`–`tr_anna_b20`) at B1,
     themed per D12 (home, family, padel, neighbours, daily routine).
     Each carries 2 `common_errors` patterns covering the most
     likely RU calque traps (calque preposition swaps, missing
     articles, "play in" vs "play", "in seven" vs "at seven", etc.)

5. **Floor-bouncer auto-lock** (carried from s93) remains universal.

**Verified end-to-end via preview probe**:
- Spelling drill loads for Anna with 10 items, prompt rendering
  correct, RU/EN definition split renders as designed
- Known-misspelling pattern match: advances immediately, shows
  pattern feedback + correct spelling, no pointless retry
- Gibberish wrong: 3-attempt retry loop with action row reverting
  to "Try again" until attempt 3, then final advance
- Translation typo (1-char off): graded as correct, spelling note
  surfaces, sessionResult.typo_surfaced=true
- Spell Help inline form renders, Ask/Back buttons work

**Bug fix during session**: `tools/_firestore.js fsGet()` returns
raw Firestore wire-format docs (with `.fields`), not converted plain
JS — unlike the client-side `fsGet` in index.html which converts via
`_fsFromDoc`. The first `_meta` update in `author_anna_s94.js` read
nested fields as `undefined`, so the `existing + new` increment
collapsed to `0 + 10`, leaving `total_exercises_per_type.translation`
at 10 even though the actual `translation/items` count was now 20.
The 20 items themselves wrote correctly; only the meta totals were
stale. Corrected via direct `fsPatch` with `docToPlain`. Future
author scripts using tools/-pattern must wrap `fsGet` output in
`docToPlain()` before reading nested fields.

**Acceptance state for §4.6**:
- ✅ Spell Help button live in Coach tab — form opens, Ask/Back
  buttons wired, capture path writes to `players/{name}/spelling_log/{ts}`
  (worker call path verified at the request-construction level;
  end-to-end worker round-trip not exercised in-session because
  the worker is metered)
- ✅ Spelling Drill exercise type works end-to-end (preview probe:
  prompt rendering, retry loop, known-misspelling advance, final
  attempt advance)
- ✅ Typo tolerance grades 1-char-off as correct + soft spelling
  note (preview probe with synthetic 1-char typo on existing item)
- ⏳ "≥10 spell help captures land in spelling_log during Anna's
   first week of usage post-deploy" — measurable from real usage,
   not testable in this session
- ⏳ Russian Trap (defers per §4.6 sequencing — needs 2-3 sessions
   of Anna's Spell Help / Free Write data first)
- ⏳ Medal display tweak (D9) — unrelated to §4.6, separate slice

**Acceptance state for §4.5 Anna line**:
- ✅ Translation Drill: 20 items (was 10, added 10 themed)
- ✅ Spelling Drill: 10 items
- ⏳ Article Drill (~15 items): defers to §4.3 article intervention session
- ⏳ Russian Trap (~10 items): dependency-gated on Anna's first 2-3
  Spell Help / Free Write sessions per §4.6 sequencing note
- ⏳ Free Write themed prompts (D12) — current `COACH_FW_STARTERS`
  is a single generic list of 8 prompts shared across all players;
  D12 calls for 5 per-player themed prompts (Anna: home/family/padel/
  neighbours/routine). Per-player themed list not yet implemented.

**Next session candidates** (per §1 priority):
- §4.4 learner shell landing + routing — gating surface for testing
  §4.1/§4.6 end-to-end as a learner-shell experience
- §4.3 article intervention batch 1 (~25-30 quiz Qs + ~15 article_drill
  items per family member) — content work
- §4.6 medal display tweak (D9) — small engineering, completes §4.6
- §4.5 Nicole library content (translation, spelling, free write
  prompts) — content work
- §4.5 Ernest library content (translation, article_drill, error
  correction) — content work
- Tier 2 PV ladder rebalance Batch 1 (~50 items) — content work
  with active-window gating already in place

### v20260502-s95 — §4.4 learner shell landing + routing (MVP slice)

Anna is the first player on `ui_shell: "learner"`. App-open now lands her
on a single-button surface that picks the next exercise for her, instead
of the builder Setup screen with five mode toggles and category chips.

**Shipped**:

1. **`tab-home` markup** — five vertical zones per §4.4:
   - Greeting: "Hi Anna 👋" + sub-line ("Welcome back · 🔥 N-day streak")
   - Primary "Start practice" button + secondary hint ("we'll pick what
     to practise")
   - "Practising today" zone — pills for any family member whose
     `lastPlayedDate === today`; empty-state copy "Be the first one
     today — start a session"
   - "Last time" zone — narrative line built from the most recent
     `coach_sessions` doc (Free Write turn count) → fallback to most
     recent `players/{name}/exercises/{ts}` (set type + raw score) →
     fallback to most recent quiz session in local `DB.sessions`
   - "Medals" zone — gold/silver/bronze counts from existing
     `computeBadges(catStats)`; "View →" routes to stats tab
2. **Primary-action routing** (`homeStartPractice`) per §4.4 priority
   list — simplified for MVP: try Translation Drill if library has items
   for the player; fallback to Free Write. Steps 1 (resume partial set)
   and 2 (Spell Help threshold) are deferred — the data-layer plumbing
   for "captures since last spelling session" doesn't exist yet, and
   resume-partial needs a separate slice to design the resume UX.
3. **Shell switching plumbing** — `isLearnerShell()` gates `showLearnerHome()`
   in two places: (a) the early IIFE (uses cached IndexedDB `ui_shell` for
   hot-load no-flash) and (b) the post-`loadFromFirebase` block in
   `DOMContentLoaded` (canonical state once Firebase resolves). `showTab`
   now knows about `'home'` and is safe against missing tab elements.
4. **Tab-bar visibility** — `.tabs` is `display: none` while learner home
   is the active surface; restored when the player taps "Practice
   something else" (routes to Coach tab) or the medals "View →" link
   (routes to Stats).
5. **Anna flipped to `ui_shell: "learner"`** in Firestore via direct
   `fsPatch` against `players/anna`. Other family members remain on
   `'builder'` — Nicole and Ernest stay on builder until Anna's
   experience is validated in real usage.

**Verified end-to-end via preview probe**:

- Builder regression: Artem load → tab bar visible, setup tab visible,
  no console errors
- Anna fresh-load (cleared IndexedDB, localStorage `quizPlayerKey =
  "anna"`) → loadFromFirebase pulls `ui_shell: "learner"` → home tab
  visible, tabs hidden, all four zones populated correctly
- Family pull empty-state: with no one logged in today, shows "Be the
  first one today — start a session"
- Last-time narrative: pulled from Anna's most recent
  `players/anna/exercises/{ts}` and rendered as "Last set: translation
  — 4/5."
- Medal count: "1 🥉" matches Anna's actual `catStats` per `computeBadges`
- "Start practice" tap: hides home, hides tab bar, shows Coach surface,
  loads `coachStartType('translation')` with Anna's 20-item drill
  (matches §4.5 content shipped in s94)
- "Practice something else" tap: home hidden, tab bar restored, Coach
  picker visible
- "View →" on medals: tab bar restored, Stats tab visible

**Acceptance state for §4.4**:
- ✅ Anna can navigate from app open to in-progress Translation Drill
  (or Free Write fallback) in 2 taps. Auto-pick removes the picker step
  for the default path.
- ⏳ Nicole can navigate from app open to in-progress translation in 2
  taps — Nicole still on builder shell; ships when her library content
  lands (§4.5 Nicole line)
- ⏳ Stats display rework (active / mastered / coming-next sections,
  no locked) — not yet, learner shell still routes to the existing
  builder-shell stats tab via "View →"
- ⏳ Coach picker filtering by active window — picker still shows all
  authored types when player taps "Practice something else"
- ⏳ Builder-shell players see no change in any surface — verified
  for Artem; Egor untouched
- ⏳ D9 asymmetric medal display — count rendered, no positive-delta
  annotation yet
- ⏳ medals_history weekly snapshot — schema not yet created (no
  `players/{name}/medals_history` writes)
- ⏳ D11 family card with avatars/initials — current implementation
  uses emoji + first name pill, no per-player avatar colour ring
  (matches the family-tab pill style; refine when D9/D11 land)
- ⏳ D12 themed Free Write starter prompts — fallback Free Write still
  uses generic `COACH_FW_STARTERS` shared list

**Deferred from this slice** (carried to next §4.4 follow-up):

- Step 1 of primary-action routing (resume partial Translation set)
- Step 2 of primary-action routing (Spell Help threshold) — needs
  a counter for "unique words captured since last spelling drill
  session" before the priority can fire
- Stats display rework
- Coach picker active-window filter
- Medal display D9 asymmetry + medals_history snapshot
- Themed Free Write prompts (D12)
- Overflow menu in learner shell (history / achievements / settings /
  switch player) — currently the existing tabs bar reappears when the
  player taps "Practice something else" or "View →"; full overflow
  menu deferred until learner-shell stats / settings rework

**Bug surfaced during session**: none.

**Decision called inline** (not in §3 locks): family-pull pill style
matches existing family-tab pill (emoji + first name). The doc spec
calls for "small avatars/initials"; reused the existing convention to
ship faster. Refinable when D11 lands properly (probably alongside D9
medal asymmetry as a single visual pass).

**Next session candidates**:

- §4.4 follow-up: routing steps 1+2 (resume partial, Spell Help
  threshold), stats display rework, Coach picker active-window filter,
  D9 medal asymmetry + medals_history snapshot, D12 themed Free Write
  prompts. Bundle of small engineering items completes §4.4.
- §4.3 article intervention batch 1 (~25–30 quiz Qs + ~15 article_drill
  items per family member) — content work
- §4.5 Nicole library content (translation, spelling, free write
  prompts) — content work; gates Nicole's flip to learner shell
- §4.5 Ernest library content (translation, article_drill, error
  correction) — content work; gates Ernest's flip to learner shell
- Tier 2 PV ladder rebalance Batch 1 (~50 items)

### v20260502-s96 — §4.4 follow-up: Coach picker filter + post-session route

Two follow-on UX gaps from s95 closed: the picker showed four greyed-out
disabled buttons even though Anna can't use any of them yet, and the
post-session done card terminated in "← Pick another exercise" which
sends the player back into the same picker rather than the home she
came from.

**Shipped**:

1. **`coachApplyShellLayout()`** — runs after `coachLoadMeta()` finishes
   populating per-type counts. In learner shell, hides any picker
   button that is `disabled` or has a count of 0; builder shell is
   unchanged (still shows greyed-out coming-soon types so Artem can see
   what's queued). Free Write is exempt (its availability is governed
   by `coachUpdateLiveAIAvailability()` — network / API_402 / Worker
   URL gating). Anna's picker now shows three buttons: Translation
   Drill (20 avail), Spelling Drill (10 avail), Free Write (live AI).
2. **Post-session "🏠 Back home"** — `coachFinishSession` action row
   ends with "🏠 Back home" instead of "← Pick another exercise" when
   `isLearnerShell()` is true. Tapping routes through
   `homeReturnFromCoach()` which re-renders the learner-home zones (so
   "Last time" updates with the session that just finished) and hides
   the tab bar again. Builder-shell action row is unchanged.
3. **`homeReturnFromCoach()`** — small helper next to the other
   `home*` functions. Resets coach state via `coachShowPicker()`,
   hides `.tabs`, calls `showLearnerHome()`. Used by the back-home
   button and by `coachExitToPicker()` mid-session-exit path.
4. **`coachExitToPicker()` learner-shell branch** — when the player
   taps the "← Pick another exercise" exit row mid-session in learner
   shell, the partial session is finalised and the player is routed
   to home (not back to the picker). Same routing for the no-session
   case. Builder shell unchanged.

**Verified end-to-end via preview probe**:

- Learner shell picker (Anna): only Translation, Spelling, Free Write
  visible; Articles / Particles / Error Correction / Russian Trap
  hidden (zero counts) rather than disabled-but-shown
- Builder shell picker (Artem): all 7 types visible including the
  zero-count disabled ones — coming-soon visibility preserved
- Learner shell post-session done card: action row shows three
  buttons — "↻ Try this set again", "✍️ Free Write", "🏠 Back home"
- Tap "🏠 Back home" → home visible, coach hidden, tabs bar hidden,
  greeting still rendered
- Builder shell post-session done card: action row ends with
  "← Pick another exercise" (unchanged)
- No console errors

**Acceptance state for §4.4 (incremental update from s95)**:
- ✅ Coach picker filtering — visibility-only cut (hide disabled or
  zero-count types in learner shell). Does not yet read
  `learning_path.active_categories`; the proper active-window-aware
  filter is still deferred — currently the count-based filter is a
  good proxy because Anna's library content is the only thing in scope.
- ✅ Post-session routing back to learner home

**Deferred (still on the §4.4 follow-up bundle list)**:
- Routing steps 1+2 (resume partial Translation, Spell Help threshold)
- Stats display rework (active / mastered / coming-next sections)
- Coach picker active-window-aware filtering — current cut hides by
  count only, not by `active_categories` membership; once §4.5 fills
  Nicole/Ernest libraries, "active categories only" will start to
  matter
- D9 medal asymmetry + medals_history snapshot
- Themed Free Write prompts (D12)
- Overflow menu

**Next session candidates** (unchanged from s95):

- §4.4 follow-up bundle (remaining items above)
- §4.3 article intervention batch 1
- §4.5 Nicole / Ernest library content
- Tier 2 PV ladder rebalance Batch 1

### v20260502-s97 — §4.4 follow-up bundle: routing 1+2, D9, D12, stats rework

The remainder of the §4.4 bundle landed in one cohesive slice. Five
sub-features that each touched the learner shell, deployed together so
Anna's experience moves from "bare landing + auto-pick" to a fully
populated learner shell with smarter routing, themed live-AI prompts,
positive-only medal annotations, and a simplified stats surface.

**Shipped**:

1. **D12 — themed Free Write prompts**:
   `COACH_FW_STARTERS_BY_PLAYER` map, 5 per player. Anna gets
   home/family/padel/neighbours/morning routine; Nicole K-pop/school/
   friends/weekend/songs; Ernest school/sports/weekend/books/friends;
   Artem business/travel/cycling/current project/news take; Egor IELTS
   discussion-style. New `coachPickFreeWriteStarter()` helper called
   from `coachStartFreeWrite`. Falls back to the generic 8-prompt
   `COACH_FW_STARTERS` for unknown players.
2. **Routing step 2 — Spell Help threshold (`SPELL_HELP_THRESHOLD = 5`)**:
   `homeCountSpellHelpSinceLastDrill(player)` reads `players/{name}/
   exercises` for the most recent `spelling_drill` doc id, then counts
   unique `attempted` words in `players/{name}/spelling_log` with id >
   that timestamp. When ≥5, `homeStartPractice` routes to Spelling
   Drill before Translation. Resets to zero each time Anna completes a
   spelling drill (the "since last drill" window slides forward).
3. **Routing step 1 — resume partial Translation Drill**:
   `homeFindPartialTranslation(player)` scans `players/{name}/exercises`
   for the most recent `partial: true` translation session that is
   < 24h old and has `total < planned_total`. `coachStartType` now
   accepts `{ resumeSessionTs, completedIds, completedItems }` opts:
   reuses the original sessionTs (so the upsert overwrites the same
   doc), pre-fills `coachState.sessionResults` with the completed
   items, and filters new items to skip already-answered ones. Intro
   message reads "Picking up where you left off — N done, M to go."
   Returns `false` if the partial covered the whole library (caller
   falls through to fresh routing). 24h staleness threshold is
   `PARTIAL_RESUME_MAX_AGE_MS`.
4. **D9 medal display asymmetry + medals_history snapshot**:
   `renderLearnerMedals` is now async; it reads
   `players/{name}/medals_history`, finds the latest by
   `week_iso` (or doc id), and computes `current - latest` per medal
   tier. Only positive deltas annotate (e.g. "🌱 +1 🥉 this week");
   zero/negative renders empty. Lazy snapshot writes
   `players/{name}/medals_history/{week_iso}` (doc id is ISO week,
   computed via new `homeIsoWeekString` helper) once per ISO week —
   first home render of the week creates the snapshot. New CSS:
   `.lh-medals-delta` (green, hidden when empty).
5. **Stats display rework for learner shell (§4.4 spec)**:
   New `<div id="learner-stats-panel">` inside `#tab-stats` with three
   sections — Active categories, Mastered, Coming next. Existing
   builder content wrapped in `<div id="builder-stats-wrap">`.
   `renderStats()` branches on `isLearnerShell()`: shows the new panel
   and hides builder wrap, calls `renderLearnerStats()`. The new panel:
   - Active: card per `learning_path.active_categories` entry. Soft
     accuracy fill (gradient bar, no percentage by default), recent
     attempts count, tap-to-expand for raw numbers.
   - Mastered: card per `mastered_categories` entry with relative date
     ("3 days ago", "2 weeks ago"), green-tinted style. Empty state:
     "No mastered categories yet — keep going!".
   - Coming next: cards from `next_unlock_options`, sorted with
     `pathway: "deepen"` first; pathway pill (amber for deepen, purple
     for broaden) + tap-to-expand rationale. No locked section.
   - "← Back home" button at bottom routes via new
     `homeReturnFromStats()` helper. `homeOpenStats()` keeps tabs
     hidden in learner shell so the panel is the only surface.

**Schema additions deployed**:
- `firestore.rules` — added open read/write for
  `players/{name}/spelling_log/{ts}` (overdue from s94 — Anna's
  spelling_log writes were silently failing on HTTP 403 before this)
  and `players/{name}/medals_history/{week_iso}` (new in s97).
  Deployed via `firebase deploy --only firestore:rules`.

**Verified end-to-end via preview probe (Anna real Firestore data)**:

- Slice A: per-player starter map populated (5 each); `coachPickFreeWriteStarter('anna')` returned a padel-themed prompt; unknown player falls back to generic.
- Slice B: `homeCountSpellHelpSinceLastDrill('anna')` returned 0 (no captures yet — rules now permit writes for future captures).
- Slice C: `homeFindPartialTranslation('anna')` returned a 9h-old partial with 1/20 done; `homeStartPractice` resumed it cleanly — same `sessionTs` (1777665127229), `sessionResults.length === 1`, `plannedTotal === 20`, intro reads "Picking up where you left off — 1 done, 19 to go".
- Slice D: `medals_history` snapshot wrote `2026-W18 / bronze 1`; positive-delta annotation renders "🌱 +1 🥉 this week" when current > latest snapshot; renders empty when equal/negative.
- Slice E: learner stats panel populated 4 active categories (Tenses 59 attempts, Prepositions 20, Articles 47, Spelling 0), empty mastered state, 4 coming-next options sorted with deepen first; "← Back home" routes to learner home with tabs hidden.
- Builder regression (Artem): home hidden, setup visible, tabs bar visible; stats tab shows builder grid (learner panel hidden); no console errors.

**Acceptance state for §4.4**:
- ✅ Anna in-progress Translation Drill resume in 2 taps
- ✅ Coach picker filtering by available content (s96)
- ✅ Stats display shows only active + mastered for learner-shell
  players (locked categories never surface)
- ✅ D9 medal asymmetric display + medals_history weekly snapshot
- ✅ D12 themed Free Write per-player starters
- ⏳ Builder-shell players see no change in any surface — verified for
  Artem; Egor untouched
- ⏳ Stats display tap-to-reveal precise percentages — currently
  implemented as tap-to-expand on cards (shows raw counts in detail
  line); doc spec calls this out as an option, current cut matches
- ⏳ Coach picker active-window-aware filtering (filter by
  `learning_path.active_categories` membership, not just count) —
  still deferred; visibility-only filter from s96 is sufficient for
  Anna because all her library content is by definition in scope, but
  becomes meaningful when Nicole/Ernest content lands
- ⏳ Newly-earned medals call-out in session-end card (D9 spec
  mentions it; current cut only annotates the home count)
- ⏳ Overflow menu in learner shell (history / achievements /
  settings / switch player) — still deferred; current shell uses
  Stats panel + Practice something else as the two escape hatches

**Deferred (post-§4.4)**:

- Newly-earned-medal callout on done card
- Coach picker `active_categories`-aware filter
- Overflow menu (history / achievements / settings / switch player)
- Tap-on-mastered/active-card to drill into category — currently
  expands inline; deeper drill-in (full per-question breakdown,
  history) is the existing builder-shell view, not yet exposed in
  learner shell

**Bug surfaced during session**: Firestore rules were missing entries
for `spelling_log` (overdue from s94 — silent failure since deploy)
and `medals_history` (would have failed on first write). Added both,
deployed rules, verified writes/reads succeed for Anna.

**Decision called inline**: medals_history doc id format is the ISO
week string (e.g. "2026-W18"). Considered alternatives (ts-based id,
auto-id) but ISO week makes the deduplication-per-week logic trivial
(`haveThisWeek = history.some(h => h.id === currentWeek)`) without
needing to read `captured_at`.

**Next session candidates**:

- §4.3 article intervention batch 1 (~25–30 quiz Qs + ~15 article_drill
  items per family member) — content work
- §4.5 Nicole library content — gates Nicole's flip to learner shell
- §4.5 Ernest library content — gates Ernest's flip to learner shell
- Tier 2 PV ladder rebalance Batch 1
- §4.4 leftover polish: newly-earned-medal callout, overflow menu,
  active-window-aware Coach picker filter

### v20260502-s97r2 — three live-usage bug fixes

Anna found three real bugs once she was using the s97 build for actual
practice. All three fixed in one same-session rebuild.

**Bugs fixed**:

1. **"← Pick another exercise" routed home in learner shell**.
   The s96 change to `coachExitToPicker` made every learner-shell exit
   (mid-session AND post-session) route to home, but the button is
   labelled "Pick another exercise" — Anna correctly expected it to
   show the picker. Reverted the learner-shell branches in
   `coachExitToPicker`; it now shows the picker like builder, with
   tabs still hidden so the player stays inside the coach surface.
   Added a "← Back home" link inside the picker (visible in learner
   shell only, surfaced by `coachApplyShellLayout()`) so the player
   can escape without finishing a drill. `homePracticeOther` updated
   to keep tabs hidden in learner shell — the picker's own back-home
   link is the escape, not the global tab bar.

2. **Medal delta flickered between renders**. `renderLearnerMedals`
   read the most recent `medals_history` snapshot, computed
   `current - latest`, then lazily wrote a new snapshot for the
   current week. Subsequent renders read the just-written snapshot as
   "latest" → delta zero → annotation disappeared. Anna saw "+2
   medals this week" once, then it vanished after navigating back
   home. Fixed: filter `medals_history` to exclude the current ISO
   week before picking "latest" for delta computation. The annotation
   is now stable across renders within a week.

3. **`sp_anna_b09` EN hint contradicted the answer**. The Spelling
   Drill item had RU prompt "обычно" with EN definition
   "normally, in most cases" and answer "usually". Anna typed
   "normally" (literally suggested by the EN hint) and was marked
   wrong. The Russian word "обычно" is genuinely ambiguous between
   usually/normally/typically; the EN disambiguator must point at the
   target answer, not a synonym. Patched in Firestore via direct
   `fsPatch` to `prompt_definition_en: "usually, in most cases"`.

**Verified end-to-end via preview probe**:

- Mid-session exit row tap: lands on picker (3 visible types,
  back-home link surfaced), tabs stay hidden, home stays hidden.
- Picker back-home link tap: returns to learner home, tabs hidden.
- Medal delta with W17 (0 bronze) prior + W18 (1 bronze) current: two
  consecutive `renderLearnerMedals()` calls both render
  "🌱 +1 🥉 this week" — stable.
- Medal delta with only the current-week snapshot: empty (no
  comparison data). Correct.
- `sp_anna_b09` Firestore doc verified to read `correct: "usually"`,
  `prompt_definition_en: "usually, in most cases"`,
  `prompt_definition_ru: "обычно"` — RU + EN both point at the same
  English answer.

**Audit done inline**: scanned all 10 sp_anna_b items for similar EN
hint / answer mismatches. b09 was the only ambiguous case.

**Next session candidates** (unchanged from s97):

- §4.3 article intervention batch 1
- §4.5 Nicole / Ernest library content
- Tier 2 PV ladder rebalance Batch 1
- §4.4 polish: newly-earned-medal callout on done card, overflow
  menu, `active_categories`-aware Coach picker filter

---

*This file lives at `references/phase2-build-plan.md` in the repo. Updated
by CC as decisions land in flight. Should be archived once Phase 2D
acceptance (§8) is met, alongside the predecessor `phase2-coach-tab.md`.*
