# Phase 2D status log — execution records 2026-05-01 through 2026-05-11

Archived 2026-05-11 from plans/phase2-build-plan.md §12 during plans/ restructure.
These are session-by-session execution records from sessions s93–t6.
Active plan is at plans/learning-system-build.md.

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
- Three companion docs live: `docs/learning-system-design.md` (philosophy),
  this document (build), `references/stats-interpretation-guide.md` (stats reference)
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

### v20260502-s98 — §4.4 medal callout + Tier 2 PV ladder rebalance Batch 1

Two threads bundled: §4.4 closeout (newly-earned-medal callout on the
session-end card with D9 asymmetry baked in) and §4.2 Batch 1 (50
new Phrasal Verbs items — 18 ladder completions for the 6 stuck PVs
+ 32 family coverage skewed to MCQ).

**Shipped — engineering**:

1. **`checkNewBadges` → asymmetric, returns positive transitions**.
   New `MEDAL_RANK` map ranks 🥉=1, 🥈=2, 🥇=3. Loop now compares
   `MEDAL_RANK[prev[cat]]` vs `MEDAL_RANK[current]` and only pushes
   to the surfaced list when `cur > prev`. Downgrades (🥇→🥈,
   silver-loss-to-bronze, badge-loss) stay silent in both shells.
   The toast continues to fire for the top positive transition.
   Function now returns the positive list so callers can render it.
2. **`finishSession` captures the list** and passes to `showResults`.
3. **`showResults(score, total, pct, newlyEarnedBadges)`** renders the
   list inside a new `#res-new-medal` zone on the session-end card —
   amber-tinted gradient block, headline ("🎉 New medal earned" /
   "New medals earned" plural-aware), and one pill per medal with
   tier label. Hidden when nothing was earned.
4. **CSS** for `.res-new-medal*` classes (gradient, pill style).

**Shipped — content (Phrasal Verbs Batch 1)**:

- **18 ladder completions** — 6 stuck PVs × 3 rungs (MCQ + gap +
  input) with `linked_question_ids` cross-references for future
  ladder-pair tracking. Targets the production gap diagnosed in
  Artem's Apr 30 transform session: get off (gt03), get through
  (gt10), read up on (pv_ti17), take up (pv_c03), bring about
  (pv_c07), turn out (pv_ti71). Each PV now has a recognition
  (MCQ "what does X mean here?"), selection (gap "which particle
  fits"), and production (input) item, all linked.
- **32 family coverage items** — 20 MCQ + 8 gap + 4 input across
  GET, BRING, TURN, SET, COME, TAKE families. MCQ-skewed because
  the diagnosis is recognition-substrate-thin under a thick
  selection layer. Real-life contexts (business decisions, Bahrain
  family life, project launches, news headlines) avoid the generic
  "the man went to the shop" anti-pattern. IDs `pv_f01`–`pv_f32`.

**Bank shape after Batch 1**:
- Total questions: 1,932 (+50)
- Phrasal Verbs total: 227 (+50)
- New PV type mix from these 50: 26 MCQ + 14 gap + 10 input (skewed
  toward recognition per §4.2 ratio target 5:12:6)
- New `linked_question_ids` field introduced (PWA does not yet read
  it; metadata for future ladder-pair tracking)

**Verified end-to-end via preview probe**:
- ALL_QUESTIONS count 1,932 (+50 from prior 1,882)
- 18 ladder items present (`pv_l0[1-6]_[mgi]`), 32 family items
  present (`pv_f0[1-9]|pv_f[12][0-9]|pv_f3[0-2]`)
- Sample MCQ `pv_l01_m` parses cleanly with all schema fields,
  including `linked_question_ids: ['pv_l01_g','pv_l01_i']`
- Synthetic medal callout: simulated bronze-then-silver Articles
  promotion + bronze Tenses promotion → callout renders "🎉 New
  medals earned" with two pills "🥈 Articles SILVER" + "🥉 Tenses
  BRONZE"
- Synthetic asymmetry: Articles 🥇→🥈 demotion → not surfaced;
  Tenses 0→🥉 promotion → surfaced. D9 rule honoured.
- Pre-deploy: syntax OK, version-string consistency OK, transform
  audit OK (46 transform Qs unchanged), no sparse arrays, level
  totals sum to 1,932 (B1=602, B2=988, C1=326, C2=16).
- No console errors.

**Active-window implications honoured**:
- Phrasal Verbs is not in Anna's `learning_path.active_categories`
  (active = Tenses/Prepositions/Articles/Spelling), so the new PV
  content is invisible to her in the learner-shell quiz filter.
  Authored content sits in the bank for Artem and Egor (open pool)
  and waits for Nicole/Ernest active-window unlocks.

**Acceptance state for §4.2**:
- ✅ Batch 1 shipped (50 items: 18 ladder + 32 family)
- ⏳ Batch 2 verb families (give up, find out, sort out, work out,
  call off, figure out, point out, rule out, end up, take over) —
  not yet
- ⏳ Coach particle_sort items (~15) — not yet (Coach exercise type
  not enabled in the picker yet)
- ⏳ Final ratio target Recognition 50 / Selection 120 / Production 60
  not reached: current after Batch 1 is approximately 46 / 103 /
  48 — Batch 2 closes the rest

**Decisions called inline**:
- ID prefix for ladder completions: `pv_l0[1-6]_[mgi]` (l=ladder,
  numbered 01-06 for the 6 PVs, suffix m/g/i for rung). Considered
  using PV-name in the id for readability (e.g. `pv_lad_getoff_m`)
  but went with shorter index-based scheme to keep the bank
  consistent with existing `gt##` / `br##` short forms.
- ID prefix for family coverage: `pv_f0[1-9]` / `pv_f[12][0-9]` /
  `pv_f3[0-2]` (f=family Batch 1, sequential). Future Batch 2 can
  reuse `pv_f` continuing from `pv_f33`.
- `linked_question_ids` field added but not yet wired into the
  PWA. Forward-looking metadata; the spec asked for it. PWA can
  start reading it in a follow-up slice (e.g. for ladder-pair stats
  reporting in stats reviews).

**Acceptance state for §4.4 (final closeout)**:
- ✅ D9 newly-earned-medal callout on session-end card (asymmetric)
- ⏳ Overflow menu (history / achievements / settings / switch
  player) — still deferred
- ⏳ `active_categories`-aware Coach picker filter (current cut is
  count-based) — still deferred; meaningful when Nicole/Ernest
  library content lands

**Next session candidates**:

- §4.3 article intervention batch 1 (~25–30 quiz Qs + ~15
  article_drill items per family member)
- §4.5 Nicole library content
- §4.5 Ernest library content
- Tier 2 PV Batch 2 (verb families above + ~15 Coach particle_sort)
- §4.4 polish: overflow menu, active-window-aware picker filter

### v20260502-s99 — A2-B1 PV gap-fill (45 items) + Anna PV unlock

User reversed the §4.2 lock that kept Phrasal Verbs out of Anna's
active window. The B1 PV bank had only 37 items (~25 distinct PVs)
and only ~8% input share — far below the ≥20% per-category target.
Surfacing PV in Anna's window without filling the gap would have
bombed her with a thin pool dominated by selection items and stuck
PVs from her ladder.

**Audit findings (pre-batch)**:
- B1 PV total: 37 (~25 distinct PVs covered: turn on/off, look
  after, give up, call off, get along, get on, get off, get over,
  take up, take off (clothes), take on, break down, carry on, pick
  up, fall out, show up, bring back, hold on, fill in, wake up,
  put off, get back to)
- B1 PV input items: 3 (~8% input share)
- ~30 essential A2-B1 PVs missing: get up, find out, look for,
  look up, look forward to, drop off, check in, write down, hang
  up, take care of, work out, sort out, run out of, cheer up,
  calm down, fill out, switch on, catch up, put on, break up,
  carry out, put up with, call back, come back/in, get on/in,
  set out, listen to, clean up, tidy up, stand up, sit down,
  wash up, move in, fall down, shut up, think about, log in,
  sign up, throw away, try on, dress up.

**Shipped — content**:

- **45 new PV items** (`pv_g01`–`pv_g45`) tagged `lvl: 'B1'`,
  covering both A2-tier core PVs (find out, look for, check in,
  write down, switch on, etc. — A2 in strict CEFR taxonomies but
  B1 in everyday teaching practice) and B1-tier PVs (look forward
  to, take care of, work out, sort out, run out of, put up with,
  carry out, etc.). All in Anna's themed contexts where applicable
  (padel, kids at school, neighbours, daily routine).
- **Type mix**: 18 input + 15 gap + 12 mcq. Input-heavy by design
  to lift the B1 PV input share from 8% → 24% (above ≥20% target
  per question-authoring-standards.md).
- **Schema decision (recorded inline)**: skipped adding `A2` as a
  separate `lvl:` enum value. For Anna with `level_cap: "B1"` the
  filter is `q.lvl <= "B1"`, so A2 vs B1 tagging makes zero
  functional difference. Schema migration cost (5–6 small touches
  across LEVEL_ORDER, level filter, setup UI, LEVEL_TOTALS,
  LEVEL_DESCS, computeCoverageConstants) outweighs immediate
  benefit. Re-evaluate if/when granular A2/B1 progression signal
  becomes load-bearing (months out).

**Shipped — Anna's learning_path update**:

- `active_categories`: `["Tenses","Prepositions","Articles","Spelling"]`
  → `["Tenses","Prepositions","Articles","Spelling","Phrasal Verbs"]`
- `active_window_size`: `4` → `5`
- `level_cap` unchanged (`"B1"`), `stretch_allowance` unchanged (`0.10`)
- All other fields unchanged (`mastered_categories`, `next_unlock_options`,
  `promotion_threshold`, `floor_bouncers`, `composition_last_checked`)
- Patched directly via `fsPatch('players/anna', ['learning_path'], ...)`.

**Composition rule check** (per §3.2 D4): Of the 5 active categories,
at least one in current strong area (≥70% accuracy at level_cap), at
least two in productive struggle zone (40–65%), at most one new
narrow focus.
- Strong: Tenses 71% (Anna's only B1 strong); marginally above
  threshold
- Productive struggle: Prepositions ~50%, Articles ~45%
- Narrow focus: Spelling (Anna's documented orthographic gap) +
  Phrasal Verbs (newly added)
- 5/4/1 of 5 active — slightly above the "at most one narrow
  focus" rule because both Spelling and Phrasal Verbs are narrow
  foci. Justified by user direction in this session: PV unlock is
  the explicit ask. CC flags for a future composition rebalance
  if Anna's accuracy on PV stays below 40% across 4+ sessions.

**Bank shape after Batch**:
- Total questions: 1,977 (+45)
- Phrasal Verbs total: 272 (+45)
- B1 PV total: 82 (was 37; +45)
- B1 PV input share: 24% (was ~8%)

**Verified end-to-end via preview probe**:
- ALL_QUESTIONS count 1,977 (+45 from prior 1,932)
- 45 pv_g items confirmed: 18 input + 15 gap + 12 mcq
- Sample item `pv_g04` (look forward to) parses with all schema
  fields, hint follows the no-answer-word rule
- `applyLearnerWindowFilter()` simulation against Anna's updated
  `learning_path`: 252 questions in her quiz pool (Tenses 69 +
  Prepositions 22 + Articles 58 + Phrasal Verbs 103) — Spelling
  has 0 quiz items because Spelling is a coach-only category
- All 45 pv_g items present in Anna's filtered pool
- PV pool of 103 = 82 B1 (full) + ~21 B2 stretch items (~10% of
  the 188 B2 PV items, per `stretch_allowance: 0.10`)
- Pre-deploy: syntax OK, transform audit OK (46 unchanged), no
  sparse arrays, version-string consistency OK

**Acceptance state for §4.2**:
- ✅ Batch 1 (s98): 50 items (18 ladder + 32 family)
- ✅ Batch 1 supplement (s99): 45 A2-B1 gap-fill
- ⏳ Batch 2 verb families (give up, find out, sort out, work
  out, call off, figure out, point out, rule out, end up, take
  over) — partially done by s99 (find out, sort out, work out are
  in the gap-fill); remainder still queued
- ⏳ Coach particle_sort items (~15) — not yet (Coach particle_sort
  exercise type still disabled in picker)
- Final ratio target Recognition 50 / Selection 120 / Production
  60: current after s99 ≈ 58 / 118 / 66 — close to spec ratio
  (5:12:6); B1 input share specifically lifted from 8% to 24%

**Decisions called inline**:
- Active window expansion 4→5 instead of replacing one of Anna's
  existing categories. Spelling stays in window because it covers
  orthographic-distractor MCQs in quiz mode (Coach Spelling Drill
  is supplementary, not a replacement). Articles, Tenses,
  Prepositions are all documented weak patterns and would be wrong
  to drop.
- A2 PVs covered at `lvl: 'B1'` rather than introducing A2 as a
  schema enum value (decision detailed above).

**Next session candidates**:

- §4.3 article intervention batch 1 (~25–30 quiz Qs + ~15
  article_drill items per family member)
- §4.5 Nicole / Ernest library content
- Tier 2 PV Batch 2 (remainder of verb families + Coach
  particle_sort)
- §4.4 polish: overflow menu, active-window-aware picker filter

### v20260502-t1 — Quiz inserted into learner-shell routing (A6)

Counter restart: the `t` series begins here. Prior session counter
(`sN`) ran s1–s100; new sessions are `t1`, `t2`, … with the same
`vYYYYMMDD-{counter}` format and the same identical-across-the-four-
locations rule. No technical reason — clean cut.

The big "Start practice" button in learner shell now routes to the
grammar Quiz as the daily default, not the Coach. Coach exercises
remain available via "Practice something else →" picker. See A6 in
§3.1 for the locked rationale.

**Shipped — engineering (`index.html` + `sw.js` only)**:

1. **`homeStartQuiz()`** — programmatic Smart-mode quiz launch for
   learner shell. Bypasses the Setup tab UI (which is hidden), seeds
   `mode='smart'`, `catFilter='All'`, `maxLevel='C2'`, `includeBiz=true`,
   count=10. `selectQuestions(10)` returns from the active-window-and-
   level-cap-filtered pool via the existing `applyLearnerWindowFilter`
   from s93. Returns `false` if the pool is empty (caller falls
   through to Free Write); returns `true` once the quiz is rendered.
   Sets `lastSessionSettings` so `quickReplay()` works correctly
   afterward — also pushes `count` into the (hidden) `q-count` slider
   so any builder-style state restore stays clean.

2. **`homeReturnFromQuiz()`** — small helper next to other `home*`
   functions. Hides `tab-quiz` / `tab-results` / `tab-setup`, keeps
   `.tabs` bar hidden, calls `showLearnerHome()` so the home zones
   re-render with the just-finished session reflected in "Last time".

3. **`homeStartPractice` restructured**. Routing order is now:
   1. Resume partial Translation Drill (<24h, in progress)
   2. Spelling Drill (Spell Help threshold ≥5 captures)
   3. **Quiz** (NEW — Smart mode + active window filter)
   4. Free Write (fallback when Quiz pool is empty)

   Fresh Translation Drill is no longer a primary route — it's a
   picker-only choice now. The reveal-coach-surface side effect was
   factored into a `revealCoach()` closure so each branch only fires
   it when needed (Quiz path skips it entirely; Free Write path uses
   it). Home + tabs hide once at the top of the function.

4. **`showResults` action-row override**. Builder shell still
   renders the static markup defaults ("↻ Same Again" / "New Session"
   / "View Stats"). Learner shell replaces the row at render time with
   home-aware actions: "🏠 Back home" (primary) → `homeReturnFromQuiz`,
   "↻ Same set again" → `quickReplay`, "📈 View stats" → `homeOpenStats`
   (which opens the §4.4 learner stats panel and keeps tabs hidden).
   Builder defaults restore explicitly in the `else` branch so a
   shell switch mid-session doesn't strand learner buttons in builder
   shell.

**Verified end-to-end via preview probe (Nicole real Firestore data)**:

- Fresh load: `quizPlayerKey="nicole"` + IndexedDB clear + localStorage
  backup wipe → loadFromFirebase pulls Nicole's `learning_path` cleanly
  (active_categories `[Prepositions, Irregular Verbs, Vocabulary]`,
  level_cap B1, totalAnswered 830 — matches Firestore).
- "Start practice" tap → no partial Translation, no Spell Help threshold
  → routes to Quiz. `sessionQs.length === 10`, mode `smart`, progress
  label "Question 1 of 10". Pool composition: Irregular Verbs ×6,
  Vocabulary ×3, Prepositions ×1 (all three categories from her active
  window); levels B1 ×9 + B2 ×1 (≈10% stretch allowance — exactly per
  spec).
- `tab-quiz` visible, `tab-home` hidden, `tab-coach` hidden, `.tabs`
  bar `display: none` — clean transition.
- Mocked sessionAnswered (alternating right/wrong) + finishSession →
  results screen renders with the learner action row: "🏠 Back home"
  (primary) + "↻ Same set again" + "📈 View stats". Score "5/10".
- `homeReturnFromQuiz()` tap → home visible, results hidden, tabs
  still hidden, greeting + zones intact.
- Builder regression (Artem): force-loaded Artem's player doc with
  `ui_shell: "builder"`, ran startQuiz + finishSession → results action
  row renders builder defaults ("↻ Same Again" / "New Session" / "View
  Stats"); tabs bar restored. No console errors.

**Pre-deploy**:
- syntax OK, transform audit clean (46 transforms unchanged), version-
  string consistency OK (v20260502-t1 in both `index.html` and
  `sw.js`; legacy reference to `v20260428-s87` retained as a comment
  marking the RTDB→Firestore migration cutover).

**Acceptance state for §4.4 (incremental update from s100)**:
- ✅ Big-button routing covers Quiz + Coach for learner shell
- ⏳ Newly-earned-medal callout on done card — already done (s98)
- ⏳ Active-window-aware Coach picker filter (filter by
  `active_categories` membership, not just count) — still deferred;
  meaningful when Nicole/Ernest accumulate more Coach content
- ⏳ Overflow menu (history / achievements / settings / switch player)
  — still deferred

**Decision called inline** (not in §3 locks): Quiz session length =
fixed 10 in learner shell. Builder shell continues to honour the
`q-count` slider (5–30). Hardcoded 10 because (a) it matches the
Translation Drill / Spelling Drill default, so all Coach + Quiz
sessions in learner shell have the same shape, and (b) the slider UI
isn't reachable from learner shell anyway. Re-evaluate if a player
asks for longer or shorter sessions.

**Mid-session quiz exit not added.** A learner-shell player who taps
"Start practice" but wants to bail mid-quiz has no escape hatch
short of refreshing the page — same as the builder shell, but
without the tab bar to navigate elsewhere. Quiz sessions are 10
questions / ~5 min so the friction is bounded; revisit if Anna /
Nicole / Ernest report it.

**Next session candidates**:

- §4.3 article intervention batch 1 (~25–30 quiz Qs + ~15 article_drill
  items per family member) — content + engine wiring (article_drill
  Coach type)
- §4.5 Ernest Error Correction (~15 items) — content + engine wiring
- Tier 2 PV Batch 2 (verb families + Coach particle_sort)
- §4.4 polish: overflow menu, active-window-aware Coach picker filter,
  mid-quiz exit affordance for learner shell

---

### s100 — §4.5 Nicole + Ernest library content + shell flips

Phase 2 restart-readiness moved to "all three family-shell players
live on learner shell". Nicole and Ernest joined Anna on `ui_shell:
"learner"` after their Coach libraries got their first content batches.

**Shipped — content (30 items via tools/push_library.js)**:

- **Nicole Translation Drill** (`tr_nicole_b01`–`b10`, 10 items, B1, RU
  coach lang): targets her `learning_path.active_categories`
  [Prepositions, Irregular Verbs, Vocabulary] with K-pop / school /
  friends / weekend / birthday themes per profile. Distribution: 4
  Prepositions (listen+to, on street, at school, on Friday), 6
  Irregular Verbs (bought, saw, went, wrote, told, gave) with kid
  vocabulary woven in. Russian feedback for grammar explanations.
- **Nicole Spelling Drill** (`sp_nicole_b01`–`b10`, 10 items, B1, RU):
  high-frequency teen words targeting Russian L1 spelling traps —
  friend (ie cluster), beautiful (eau / doubled), Wednesday (silent d),
  tomorrow (one m / two r), because (au not ou), believe (ie), school
  (sk- vs sch-), clothes (silent th vs close), happy (doubled p),
  surprise (silent first r). All `source: predicted_l1_trap`.
- **Ernest Translation Drill** (`tr_ernest_b01`–`b10`, 10 items, B1, EN
  coach lang): weighted toward his measured weak pattern Articles ×
  uncountable nouns (3 items: information / advice / progress — the
  exact 'a good progress' calque called out in his coach_notes).
  Other 7 items cover Tenses (present perfect life experience, present
  continuous), Conditionals (1st + 2nd, both 'will/would in if-clause'
  Russian-L1 traps), Phrasal Verbs (turn off + 'close the lights'
  calque), Vocabulary (won + sport theme), Relative Clauses (who vs
  which/what for people). Short prompts to stay gentle on his input-
  scaffolding gap.

Free Write themed prompts for both already shipped in s97 (D12
`COACH_FW_STARTERS_BY_PLAYER` map — Nicole K-pop/school/friends/weekend/
songs, Ernest school/sports/weekend/books/friends).

**Shipped — Firestore**:

- `players/nicole.ui_shell`: builder → learner
- `players/ernest.ui_shell`: builder → learner
- 10 docs at `exercises_library/translation/items/tr_nicole_b*`
- 10 docs at `exercises_library/spelling_drill/items/sp_nicole_b*`
- 10 docs at `exercises_library/translation/items/tr_ernest_b*`
- `exercises_library/_meta`: total_exercises_per_type now
  `{translation: 40, spelling_drill: 20}`; coverage_by_player covers
  anna / nicole / ernest

**Shipped — engineering (tools/push_library.js)**:

- `spelling_drill` added to `VALID_TYPES` + `TYPE_REQUIRED` so Anna's
  ad-hoc s94 `author_anna_s94.js` flow no longer needs to bypass the
  shared push tool.
- **Bug fix surfaced inline**: prior _meta logic computed
  `{...prev, ...thisDraft}` for `total_exercises_per_type` —
  multi-author drafts (e.g. Nicole's translation push after Anna's
  20 items existed) clobbered prior author counts. After Nicole's
  10-item push, totals would have read `{translation: 10}` instead
  of 30. Replaced with authoritative recomputation: after writing
  this draft's items, fsList every type's `items` subcollection and
  rebuild meta from on-disk state. Idempotent and self-healing
  against stale entries.

**Acceptance state for §4.5**:

- ✅ Anna line (s94 prior): Translation 20 + Spelling 10 + Free Write
  prompts; Article Drill + Russian Trap deferred per §4.6 sequencing
- ✅ Nicole line: Translation 10 + Spelling 10 + Free Write prompts;
  Article Drill remains deferred (Articles not in her active window)
- ✅ Ernest Translation 10 + Free Write prompts
- ⏳ Ernest Article Drill (~15 items): defers to §4.3 article
  intervention session — engine wiring also needed (`COACH_TYPE_TO_LIBRARY`
  currently only maps `translation` and `spelling_drill`; `article_drill`
  picker entry exists but disabled)
- ⏳ Ernest Error Correction (~15 items): same — engine support not
  in place for `error_correction` Coach type
- ⏳ Russian-language content verified for Nicole — items pushed; live
  acceptance ("verified" in spec sense) waits for Nicole's first real
  session against the new content

**Verified end-to-end via preview probe**:

- Nicole flow: localStorage `quizPlayerKey="nicole"` + IndexedDB clear
  → home renders "Hi Nicole 👋", active_categories
  [Prepositions, Irregular Verbs, Vocabulary], window_size 3, level_cap
  B1; "Practice something else" → picker shows 3 visible buttons
  (Translation 10 avail, Spelling 10 avail, Free Write live AI) with
  the other 4 types correctly hidden by `coachApplyShellLayout`;
  Translation Drill loaded with `plannedTotal: 10`, first item
  `tr_nicole_b01` ("Я слушаю мою любимую песню."), `target_player:
  "nicole"`.
- Ernest flow: localStorage `quizPlayerKey="ernest"` + force-load
  Ernest's Firestore doc → home renders "Hi Ernest 👋", active_categories
  [Tenses, Articles, Conditionals, Phrasal Verbs, Vocabulary, Relative
  Clauses], window_size 6, level_cap B1; "Practising today" pills show
  Artem + Nicole; "Last time: error correction — 3/6"; Medals 1 🥉.
  Picker shows 2 visible buttons (Translation 10 avail, Free Write —
  no Spelling button because Ernest has zero spelling content,
  matching the `coachApplyShellLayout` count-based filter); Translation
  Drill loaded with `plannedTotal: 10`, first item `tr_ernest_b08`
  ("Не забудь выключить свет."), `target_player: "ernest"`.
- `coachPickFreeWriteStarter('ernest')` returned the sports prompt
  ("Tell me about a sport you play or watch — why do you like it?"),
  confirming the s97 D12 themed-starter map still wires for Ernest.
- No console errors across either flow.

**Bug surfaced inline (preview-only, not user-facing)**: cross-player
verification was tricky because `loadFromFirebase`'s totalAnswered
guard (line 6561) blocks remote merge when `remote.totalAnswered <
local.totalAnswered`. With Nicole at 830 answers and Ernest at 241,
switching local IndexedDB from Nicole to Ernest leaves the in-memory
`DB` carrying Nicole's `learning_path` even after a player-key change,
unless the page does a full hard reload AND IndexedDB delete actually
completes. Worked around by calling `fsGet('players/ernest')` directly
and `Object.assign(DB, …)`. The guard is correct production behavior
(prevents stale local from clobbering newer remote) — flagged as a
"verification quirk" not a bug. If profile-switching ever becomes a
user-facing flow, the guard needs a "different player" override.

**No runtime code change in this session** — all work happens in
Firestore (library content + ui_shell flips) and tools/. `index.html`
and `sw.js` untouched. No version bump; commit goes in plain
(non-`v*-s*`) form.

**Next session candidates**:

- §4.3 article intervention batch 1 — both content (article_drill
  items for all three family-shell players, ~15 each) AND engine
  wiring (`COACH_TYPE_TO_LIBRARY` map + scoring + picker)
- §4.5 follow-up: Ernest Error Correction — content + engine wiring
- Tier 2 PV Batch 2 (remainder of verb families + ~15 Coach
  particle_sort)
- §4.4 polish: overflow menu, active-window-aware Coach picker filter
  (currently visibility-by-count only)

### v20260502-t2 — §4.3 article intervention Batch 1 vertical slice (engine + Anna content)

The `article_drill` Coach exercise type went live end-to-end. Anna is the
first player with article_drill content. Scope was negotiated down from the
full Batch 1 spec (~25–30 quiz Qs + ~45 article_drill items across 3 family
members) to a focused vertical slice: engine wiring + Anna's 15 items + 7
Phase 1 scaffold quiz Qs. Cross-player content (Nicole/Ernest article_drill,
quiz Q fixes for cross-player failures) becomes a Batch 1.5 follow-up.

**Shipped — engineering**:

1. **`article_drill` registered as a Coach type**:
   - Picker button enabled (was `disabled`); routes to
     `coachStartType('article_drill')`
   - `COACH_TYPE_TO_LIBRARY['article_drill'] = 'article_drill'`,
     `COACH_TYPE_LABEL['article_drill'] = 'article drill'`
   - Intro string explains chip UX: "tap *a* / *an* / *the* / *—* for each
     blank. The dash *—* means 'no article'."
2. **Chip-button input UX** (vs typed). Tap = instant submit; replaces the
   textarea/send. Single attempt per item — decision-drill, not motor skill.
   - `coachShowArticleChips()` injects 4 chip buttons into `coachActionRow`
     (a / an / the / —)
   - `.ad-chip` CSS: monospace, fixed-width chips, left-aligned via
     `flex:0 1 auto`
3. **Sentence rendering with styled blank**:
   - `sentence_template` uses `{1}` token; renderer replaces with
     `<span class="ad-blank">_____</span>`
   - `.ad-blank` CSS: dashed-underline accent, monospace, signals
     "fill this in"
4. **Scoring** (`coachSubmitArticleAnswer`):
   - Normalises both sides via `coachNormArticleChoice` so any of
     `'—' | '-' | '' | '0' | 'no' | 'none' | 'no article'` collapses
     to the canonical `'—'`
   - On correct: ✓ + reasoning (always shown — the teaching point IS the
     reasoning, not the answer)
   - On wrong: ✗ + correct answer + reasoning
   - `matched_pattern_id` records the diagnostic 5-pattern tag
     (`a_the_swap` / `phantom_article` / `prep_article` /
     `fixed_expression` / `dropped_article`) — flows into the existing
     "Patterns to review" zone on the done card
5. **No mid-attempt retry** — single attempt per item, then "Got it →
   next" / "finish session". The spelling-drill 3-attempt loop is
   deliberately not extended here.

**Shipped — content (Anna article_drill, 15 items)**:

- IDs `ad_anna_b01`–`ad_anna_b15`, level B1, target_player anna
- Distribution across the 5-pattern taxonomy from the diagnostic doc:
  - a_the_swap (Pattern 1, ~40% of errors): 5 items (b01, b02, b03, b04, b05)
  - phantom_article (Pattern 2, ~25%): 4 items (b06, b07, b08, b09)
  - prep_article (Pattern 3, ~15%): 2 items (b10, b11)
  - fixed_expression (Pattern 4, ~12%): 2 items (b12, b13)
  - dropped_article (Pattern 5, ~8%): 2 items (b14, b15)
- Anna's documented themes: home/sofa, padel club, kids dinner,
  neighbours noise, smoothie morning, advice cooking lamb, beach next
  Saturday, life in Bahrain, Friday barbecue, neighbours moved in March,
  smell of coffee, Sasha making progress, Sasha goes to school by bus,
  husband is engineer, new café on our street.
- Pattern-specific reasoning carries an L1 note where relevant
  (Russian *совет* countable, *диван* genderless, *Он инженер* article-
  less, etc.) — extension of D6 spelling-drill "predicted L1 trap"
  pattern but for article rules.
- Pushed via `tools/push_library.js`. `_meta` recomputed authoritatively
  to `{translation: 40, spelling_drill: 20, article_drill: 15}`.

**Shipped — content (7 art_s scaffold quiz Qs in ALL_QUESTIONS)**:

- Phase 1 scaffold series from the diagnostic. All B1, biz:false,
  cat:'Articles' — neutral context so they reach Anna (B1 cap), Ernest
  (B1 cap, when his Articles window opens), and the broader bank.
- Type mix: 5 gap, 1 input, 1 multi (`art_s06` — the a/the contrast pair
  is the canonical multi-blank exemplar of the Pattern 1 swap)
- Targets: second mention (s01, s05), situational unique (s02),
  inherited specificity (s03), shared knowledge (s04), first-mention
  reinforcement (s05), a→the contrast within sentences (s06), zero-
  article fixed phrase (s07).
- Each `exp` field embeds the "Do we both know which one?" heuristic
  per the diagnostic Phase 1 design rule, with Russian L1 bridge
  (*этот / тот* / explicit no-article L1 callouts) at this B1 level.

**Bank shape after t2**:
- Total questions: 1,984 (+7 from prior 1,977)
- Articles total: ~159 (152 baseline + 7 art_s)
- Levels: B1 +7 (all art_s items at B1)

**Verified end-to-end via preview probe (Anna real Firestore data)**:

- Picker (Anna learner shell): 4 visible buttons — Translation 20,
  Spelling 10, **Articles 15** (newly active), Free Write. Particles /
  Error Correction / Russian Trap correctly hidden by the s96 zero-count
  filter.
- Article drill start: `coachStartType('article_drill')` loaded 15 items,
  intro rendered, first item shows blank with chips below; textarea
  hidden.
- Correct submission (`a` for `ad_anna_b15` "There is ___ new café"):
  ✓ feedback + reasoning ("First mention of a singular countable
  noun…"), `matched_pattern_id: dropped_article`, "Got it → next"
  advances.
- Wrong submission (`a` for `ad_anna_b04` correct=`the`): ✗ feedback +
  "The answer is **the**" + shared-knowledge reasoning, `matched_
  pattern_id: a_the_swap` recorded.
- Zero-article chip: `—` for `ad_anna_b13` correct=`—` (Sasha goes to
  school) → graded correct, `matched_pattern_id: fixed_expression`.
- Full session: 14/15 correct in one minute; done card renders "Patterns
  to review: dropped_article, a_the_swap, fixed_expression, prep_article,
  phantom_article" — all 5 surfaced.
- art_s quiz Qs: all 7 present in `applyLearnerWindowFilter(ALL_QUESTIONS,
  Anna's DB)` output. Filtered pool size 244. art_s06 multi schema
  validated: 2 ___ tokens, 2 blanks entries, blank0 ans=0 (`a`), blank1
  ans=0 (`The`).
- Builder regression (Artem): tab bar visible, learner home hidden,
  picker still shows article_drill button (now 0 avail for Artem since
  Anna-only content). No console errors anywhere.

**Pre-deploy**:
- syntax OK, transform audit OK (46 transforms unchanged), no sparse
  arrays, single-declaration check OK, version-string consistency OK
  (v20260502-t2 in HTML badge × 2 + sw.js cache key).

**Acceptance state for §4.3**:
- ✅ article_drill engine wired end-to-end (Coach type, picker, scoring,
  pattern recording, done-card patterns flow)
- ✅ Anna's article_drill batch shipped (15 items, 5-pattern coverage)
- ✅ Phase 1 scaffold quiz Qs shipped (7 art_s items, Pattern 1 a→the swap
  scaffolds + zero-article anchor)
- ⏳ Ernest article_drill (~15 items) — defers to Batch 1.5 follow-up;
  engine ready to receive content as soon as items land
- ⏳ Nicole article_drill (~15 items) — Articles not in her current
  active window, so her items can be authored but won't surface until
  her window includes Articles
- ⏳ Phase 1 cross-player failure quiz fixes (~15 items: art14, art15,
  art11, art_b08, art_c03, mc12, mc14, etc.) — content review pass,
  separate slice
- ⏳ Phase 2 batches 2A–2F (~75 new questions) — multi-session content
  pipeline
- ⏳ Phase 3 advanced contexts + C1 precision (~20) — long-term

**Decisions called inline** (not in §3 locks):

- **Single-blank items with discourse context** rather than multi-blank
  scenes. The diagnostic Stage 3 spec ("4–6 blanks across sentences")
  is deferred. Single blank avoids new UI for blank-by-blank entry,
  keeps per-item feedback fast, and still supports two-sentence
  discourse stems (which is the highest-impact research finding from
  the diagnostic). Multi-blank can be added when Anna's accuracy on
  single-blank items plateaus.
- **Chip UX over typed input** for article_drill. Articles are a
  decision exercise — typing adds motor friction without pedagogical
  gain. Other types (translation, spelling) keep typed input where the
  motor act IS the practice.
- **Always show reasoning, even on correct answers.** The teaching
  point is the rule, not the right/wrong outcome. Russian speakers can
  guess "the" correctly without internalising why; surfacing the
  reasoning every time fixes that.
- **Zero-article canonical form is `'—'`** (em dash). Normalises any of
  `-`, ``, `0`, `no`, `none`, `no article` to `—` for both correct
  values and submissions. Matches the existing quiz article option
  convention (`opts: [..., '—']`).

**Next session candidates**:

- §4.3 Batch 1.5 — Ernest's 15 article_drill items + Phase 1 cross-
  player failure quiz fixes (art14, art15, art11, art_b08, art_c03,
  mc12, mc14, etc.). Engine is now ready, so Ernest can flip to
  learner-shell content the moment items land.
- §4.5 Ernest Error Correction (~15 items) — content + engine wiring
  (`COACH_TYPE_TO_LIBRARY` extension + scoring branch in
  `coachSubmitAnswer`)
- Tier 2 PV Batch 2 (verb families + Coach particle_sort)
- §4.4 polish: overflow menu, active-window-aware Coach picker filter,
  mid-quiz exit affordance for learner shell

### v20260502-t3 — §4.3 Batch 1.5 + §4.5 error_correction engine + Ernest content

Two threads bundled: §4.3 follow-up (Ernest's article_drill batch + 8 in-place
quiz Q fixes for cross-player failures) and §4.5 next slice (error_correction
Coach type wired up + Ernest's first error_correction batch). Net: Ernest
now has the same engine surface as Anna, with content targeted at his
documented weak patterns (articles × uncountable, conditionals will/would
calques, present perfect for life experience, `close the lights` calque).

**Shipped — engineering**:

1. **`error_correction` registered as a Coach type**:
   - Picker button enabled; routes to `coachStartType('error_correction')`
   - `COACH_TYPE_TO_LIBRARY['error_correction'] = 'error_correction'`,
     `COACH_TYPE_LABEL['error_correction'] = 'error correction'`
   - Intro: "I'll show you N sentences, each with one mistake. Type the
     corrected version — full sentence or just the fixed part."
2. **Typed input UX** (vs chip): error_correction reuses the existing
   textarea + send button (same as translation). The teaching value is
   spotting AND producing the fix; chip UX wouldn't fit.
3. **Word-boundary scoring** via new `coachECPhraseMatch(haystack, phrase)`:
   - Builds `\b{regex-escaped phrase}\b` and tests against haystack
   - Substring containment is unsafe — `error_span: "see"` would
     false-positive against `"have seen"` (caught during preview verify)
   - Both `containsFix` and `stillContainsError` now use word-boundary
     matching
4. **`coachECNormalize`** — same as `coachNormalize` but does NOT strip
   articles. Articles are frequently the error itself (e.g. `"a good progress"`
   → `"good progress"`), so the article-stripping in `coachNormalize` would
   collapse the wrong/right forms together. Trade-off: article variation
   in unrelated parts of the sentence becomes intolerant — acceptable
   since each item targets one specific error.
5. **Scoring rule**:
   - `containsFix` = phrase-match `correct_replacement` in submitted
   - `stillContainsError` = phrase-match `error_span` in submitted
   - `correct = containsFix && !stillContainsError`
   - On wrong + still-contains-error: feedback hints "The original error
     is still there. Look for: <em>{error_span}</em>."
   - Always shows full corrected sentence + reasoning, even on correct —
     same teaching philosophy as article_drill.
6. **`matched_pattern_id`** = `error_type` (e.g. `uncountable_phantom`,
   `will_in_if_clause`, `preposition_calque`) — flows into the existing
   "Patterns to review" zone on the done card.

**Shipped — content (Ernest article_drill, 15 items)**:

- IDs `ad_ernest_b01`–`ad_ernest_b15`, level B1, target_player ernest
- Distribution skewed toward Pattern 2 (phantom_article, 5 items) per
  Ernest's coach_notes weak pattern (`articles — uncountable nouns at 0%`):
  - a_the_swap (1): 4 items (b01–b04)
  - phantom_article (2): 5 items (b05–b09; includes the canonical
    `progress` / `information` / `homework` uncountable triad)
  - prep_article (3): 2 items (b10–b11)
  - fixed_expression (4): 2 items (b12–b13)
  - dropped_article (5): 2 items (b14–b15)
- Themes: school, basketball, friends, sports, gym, books — per
  family-profiles.md Ernest section
- EN-language reasoning (Ernest's coach language since 2026-05-01)

**Shipped — content (Ernest error_correction, 15 items)**:

- IDs `ec_ernest_b01`–`ec_ernest_b15`, level B1, target_player ernest
- Distribution by error_type aligned with his active window + measured
  weaknesses:
  - Articles × uncountable (5 items): b01 progress, b02 information,
    b03 phantom `the next Friday`, b04 dropped profession article,
    b05 fixed-phrase `take an action`
  - Conditionals (3 items): b06 + b08 1st-conditional `will` in if-clause,
    b07 2nd-conditional `would` in if-clause (Russian double-conditional
    calque)
  - Tenses (3 items): b09 `was to London` → `have been to`, b10 present
    simple → continuous, b11 repeated experience → present perfect
  - Phrasal verbs / calques (1): b12 `close the lights` → `turn off`
    (logged in Ernest's coach_notes from prior session)
  - Articles uncountable plural (1): b13 `homeworks` → `homework`
  - Prepositions (2): b14 `waiting my friend` → `waiting for`, b15
    `arrived to gym` → `arrived at`
- Each item carries `error_type` for stats aggregation.

**Shipped — content (8 in-place quiz Q fixes in ALL_QUESTIONS)**:

Per the diagnostic Phase 1B "fix 15 cross-player failure questions"
backlog item. 8 high-impact fixes shipped this session; the remaining
~7 (mc09, mc12, etc.) deferred to Batch 1.6.

| ID | Before | After |
|---|---|---|
| `art11` | MCQ `Which is correct?` (3 sentences with `progress`) | gap with explicit Russian L1 note about countable `прогресс` |
| `art14` | gap, exp lacked contrastive structure | gap, exp now contrasts `take ∅ action` (general) vs `take the action` (specific) + Russian `принять меры` calque note |
| `art15` | MCQ `Which is correct?` (3 sentences with `under review`) | gap, exp lists other zero-article phrases (`under construction`, `in progress`) + Russian `на рассмотрении` note |
| `art19` | MCQ `Which is correct?` (Director appointment) | gap with options `[a, the, an, —]`, exp emphasises first-mention rule + dropped-article L1 trap |
| `aph32` | MCQ `Which is correct?` (`at a stage`) | gap with options `[the, a, —]`, exp contrasts `at a stage` (indefinite) vs `at the planning stage` (definite + named) |
| `art_b08` | gap, exp ambiguous on lunch routine vs lunch event | gap, exp now distinguishes `have ∅ lunch` (routine) vs `have a quick lunch` (event) with Russian `обедать` calque trap |
| `art_c03` | gap, exp covered the salt shaker case | gap, exp tightens Russian L1 note about `соль` lacking article cue + the heuristic "Do we both know which one?" |
| `mc14` | multi 4-blank, intro listed rules but no Russian L1 callout | multi 4-blank, intro restructured as numbered rules + explicit Russian-L1 note about governing-body article-drop pattern |

All 8 are in-place edits — IDs preserved, `qStats` history intact.

Multi-blank format anomaly (cross-player <55%, family-profiles.md noted)
is NOT solved by content fixes alone — it's a UI/cognitive-load issue.
The mc14 fix adds scaffolding but the deeper investigation remains in
the §4.4 polish bucket. mc09 / mc12 deferred to Batch 1.6 since splitting
them into gap-pairs would orphan their qStats history (a bigger decision).

**Bank shape after t3**: 1,984 questions (unchanged from t2 — no new
items, only in-place edits to 8). Library: translation 40, spelling 20,
article_drill 30, error_correction 15.

**Verified end-to-end via preview probe (Ernest real Firestore data)**:

- Ernest learner-shell load: `learning_path.active_categories`
  `[Tenses, Articles, Conditionals, Phrasal Verbs, Vocabulary, Relative
  Clauses]`, level_cap B1, ui_shell `learner` ✓
- Picker (Ernest): 4 visible buttons — Translation 10, **Articles 15**
  (newly available), **Error Correction 15** (newly available), Free
  Write. Spelling / Particles / Russian Trap correctly hidden.
- Article drill on `ad_ernest_b05` (`I made ___ good progress in maths`,
  correct=`—`): submitted wrong `a` → ✗ + uncountable reasoning + Russian
  `прогресс` calque note, `matched_pattern_id: phantom_article`.
- Error correction `coachECPhraseMatch` unit cases (all pass):
  - `('have seen this film', 'see')` → false (no false-positive on
    substring of `"seen"`)
  - `('have seen this film', 'have seen')` → true
  - `('went into Paris', 'to')` → false (no false-positive inside
    `"into"`)
  - `('good progress', 'a good progress')` → false (full phrase needed)
  - `('have been to', 'have been to')` → true (just-the-fix submission)
- Error correction full session: tested 3 items end-to-end with full
  corrected sentence — `ec_ernest_b15` arrive-at, `ec_ernest_b01`
  progress, `ec_ernest_b11` present-perfect — all graded correct, full
  corrected sentence + reasoning shown, `matched_pattern_id` recorded
  per error_type. Done card surfaced 12 distinct patterns including
  `uncountable_phantom`, `will_in_if_clause`, `would_in_if_clause`,
  `preposition_calque`, `phrasal_verb_calque`,
  `present_simple_for_repeated_experience`,
  `past_simple_for_life_experience`.
- Quiz fixes verified: `art11` / `art14` / `art15` / `art19` / `aph32` /
  `art_b08` / `art_c03` all read as `type: 'gap'` with sane `opts` and
  `ans` (integer). `mc14` retains `type: 'multi'` with 4 blanks and the
  new intro renders.
- Builder regression (Artem): tab bar visible, learner home hidden,
  `ui_shell: builder`, no console errors.

**Pre-deploy**:
- syntax OK, transform audit OK (46 transforms unchanged), no sparse
  arrays, single-declaration check OK, version-string consistency OK
  (v20260502-t3 in HTML badge × 2 + sw.js cache key).

**Bug surfaced + fixed inline**: First implementation of error_correction
scoring used plain `.includes()` substring containment. Preview probe
caught the false-positive: `error_span: "see"` would match inside
`"have seen"`, marking the correct answer as wrong. Fixed via
`coachECPhraseMatch` with regex word boundaries. Six unit cases (covering
substring traps `see/seen` and `to/into`, partial-fix scenarios, just-
the-fix scenarios) all green after the fix. Lesson captured: any
error-correction-style scoring must use word-boundary matching, not
substring.

**Acceptance state for §4.3**:
- ✅ article_drill engine wired (s/t2)
- ✅ Anna article_drill batch (s/t2)
- ✅ Anna Phase 1 art_s scaffold quiz Qs (s/t2)
- ✅ Ernest article_drill batch (this session)
- ✅ 8 cross-player quiz Q fixes (this session)
- ⏳ Nicole article_drill (~15 items) — Articles not in her current
  active window; can be authored but won't surface until window opens
- ⏳ Remaining ~7 cross-player fixes (mc09, mc12, art_b08 has been done,
  others) — Batch 1.6
- ⏳ Phase 2A–2F new question batches (~75 items) — multi-session
  pipeline
- ⏳ Phase 3 advanced contexts + C1 precision — long-term

**Acceptance state for §4.5 (Ernest line)**:
- ✅ Ernest Translation Drill (10 items, s100)
- ✅ Ernest article_drill (15 items, this session)
- ✅ Ernest Error Correction (15 items, this session)
- ✅ Ernest Free Write themed prompts (s97 D12)
- ⏳ Russian Trap exercise type — Ernest profile doesn't flag this as
  a primary need; defers indefinitely

**Decisions called inline** (not in §3 locks):

- **Word-boundary regex over substring matching** for error_correction
  scoring. Substring is fast and simple but breaks on common cases (`see`
  inside `seen`, `to` inside `into`, `in` inside `into`). The
  regex-escape + `\b...\b` cost is negligible (<0.1ms per item).
- **Always show the full corrected sentence + reasoning**, even on
  correct answers. Same philosophy as article_drill — the teaching
  point is the *rule*, not the right/wrong outcome.
- **Reuse typed input UX** for error_correction (vs chip/button). Spotting
  AND producing the fix is the practice; chip UX would short-circuit the
  production half.
- **Skip mc09 / mc12 from cross-player fixes this session.** Splitting
  4-blank multi questions into 2-blank gap pairs would create new IDs
  and orphan stat history. The mc14 in-place intro+exp strengthening is
  the safe template. Note: the cognitive-load practice need that mc09/
  mc12/mc14 originally carried is now met by the **article_drill Coach
  type** (one article at a time, chip UX, reasoning per item) shipped
  in t2 — so these legacy multi items are stat carriers, not the primary
  practice path. No multi-blank UI investigation is needed for articles.

**Next session candidates**:

- §4.3 Batch 1.6 — Nicole article_drill (15 items, gated on window
  unlock) + remaining ~7 cross-player quiz Q fixes (excluding mc09/mc12
  — see decision above; their practice path is article_drill)
- Tier 2 PV Batch 2 (verb families remainder + ~15 Coach particle_sort
  items + particle_sort engine wiring — same shape as article_drill)
- §4.4 polish: overflow menu, active-window-aware Coach picker filter,
  mid-quiz exit affordance for learner shell

### v20260502-t4 — §4.2/§4.6 particle_sort engine + Artem's first 15 items

Vertical slice: Coach `particle_sort` exercise type wired end-to-end and
shipped with 15 Artem-targeted items covering the Batch 2 PV verb families
(figure/point/rule/work/call/end/take/find/sort/give × out/up/over/on/off)
plus 5 Batch 1 family extensions (set/bring/come/take/turn × up/with/on/down).
Artem now has the same `chip-UX exercise type` surface for phrasal verbs that
Anna has for articles.

**Shipped — engineering**:

1. **`particle_sort` registered as a Coach type**:
   - Picker button enabled (was `disabled`); routes to
     `coachStartType('particle_sort')`
   - `COACH_TYPE_TO_LIBRARY['particle_sort'] = 'particle_sort'`,
     `COACH_TYPE_LABEL['particle_sort'] = 'particle sort'`
   - Intro: "I'll show you N sentences with the verb stem in place — tap
     the particle that fits the meaning."
2. **Per-item chip UX** (vs fixed chip set used by article_drill):
   particle_sort chips are item-specific (1 correct + N distractors,
   shuffled via Fisher-Yates per item). Trade-off vs fixed-set article
   chips: per-item authoring overhead, but each item gets pedagogically-
   tuned distractors (e.g. for `figure out`: `up/in/off` rather than
   a one-size-fits-all set). For PVs, this matters — wrong-particle
   distractors carry the teaching point.
3. **`coachShowParticleChips()`** dedupes correct + distractor lists
   (case-insensitive), shuffles, renders chips. The first-correct chip
   stays as canonical even when `correct_particles` has multiple
   acceptable particles.
4. **`coachSubmitParticleAnswer(choice)`**:
   - Match against `correct_particles` (array — supports items where
     2+ particles are acceptable)
   - Show "✓ Correct. <em>{verb} {particle}</em>" or "✗ Not quite. The
     answer is <strong>{verb} {particle}</strong>." with full reasoning
     surfaced in both cases
   - `matched_pattern_id` = `base_verb + '_' + canonical_particle`,
     space-collapsed (so multi-word base verbs like `come up` + `with`
     yield `come_up_with`) — flows into Patterns-to-review
5. **`coachNormParticleChoice`** = lowercase + trim. No article-stripping
   needed (single-word particles).
6. **Sentence template uses `{1}` placeholder** (same convention as
   article_drill) — renders as `<span class="ad-blank">_____</span>`,
   reusing existing CSS for visual consistency.

**Shipped — content (Artem particle_sort, 15 items)**:

- IDs `ps_artem_b01`–`ps_artem_b15`, level B2, target_player artem
- Distribution by PV family:
  - **Batch 2 verbs (10)**: figure_out (b01), point_out (b02), rule_out
    (b03), work_out (b04), call_off (b05), end_up (b06), take_over (b07),
    find_out (b08), sort_out (b09), give_up (b10)
  - **Batch 1 family extensions (5)**: set_up (b11), bring_up (b12),
    come_up_with (b13), take_on (b14), turn_down (b15)
- Themes per Artem profile: business meetings, O&G operations, finance,
  cycling, Bahrain settings (sandstorm warning, JV partner, customs
  paperwork on rig moves, planning meetings, supplier disputes)
- 4 chips per item (1 correct + 3 distractors). Distractor strategy:
  particles that pair with the same `base_verb` under a different
  meaning (e.g. `take on` vs `take over` vs `take up`) — making the
  contrast itself the teaching point.

**Bank shape after t4**: 1,984 questions (unchanged — library-only
session). Library: translation 40, spelling 20, article_drill 30,
particle_sort 15, error_correction 15. Coverage by player picks up
`artem.particle_sort = 15` (artem's first targeted Coach content; he had
0 before, since prior batches were Anna/Nicole/Ernest-targeted).

**Verified end-to-end via preview probe (Artem real Firestore data)**:

- Coach picker (Artem builder shell): Particles button shows `15 avail`,
  enabled, visible. ✓
- `coachStartType('particle_sort')` → 15 items shuffled into pool,
  `coachState.plannedTotal = 15`, intro text rendered. ✓
- First item (`ps_artem_b01`): "We need to figure _____ the root cause
  before the next planning meeting." Chips: `[in, out, up, off]` (shuffled).
  Meaning shown below sentence. Input row hidden, chips visible. ✓
- Wrong submission ('in') → `feedback-wrong` class, "✗ Not quite. The
  answer is **figure out**." + reasoning. `matched_pattern_id: 'figure_out'`.
  ✓
- Correct submission ('on' for `ps_artem_b14` take_on) → `feedback-correct`
  class, "✓ Correct. *take on*" + reasoning. `matched_pattern_id: 'take_on'`.
  ✓
- Multi-word base_verb test (`ps_artem_b13` come_up + with) →
  `matched_pattern_id: 'come_up_with'` (space-collapse logic working). ✓
- Firestore session write: `players/artem/exercises/{ts}` populated
  after each item. After 3 items: `total: 3`, `correct: 2`,
  `exercise: 'particle_sort'`, `partial: true`, `planned_total: 15`,
  `error_types: ['figure_out', 'take_on', 'come_up_with']` (deduped).
  ✓
- Stats card on Coach tab post-session: "Last session: 2/3 · particle
  sort" — new exercise type rolls up correctly. ✓
- Learner-shell regression (simulated via `DB.ui_shell = 'learner'`):
  Anna (no particle_sort items targeted at her) sees Particles button
  hidden by `coachApplyShellLayout` (count=0 → hide). error_correction
  also hidden (Anna has 0). Her visible buttons: translation,
  spelling_drill, article_drill, free_write. ✓

**Pre-deploy**:
- syntax OK, ALL_QUESTIONS count 1,984 (unchanged), transform audit OK
  (46 transforms unchanged), no sparse arrays, single-declaration check
  OK, version-string consistency OK (v20260502-t4 in HTML meta + HTML
  badge + sw.js cache key).

**Decisions called inline** (not in §3 locks):

- **Per-item distractor sets** rather than a fixed chip set
  (a/an/the/— style). Articles are a closed set of 4; particles span
  20+ in active English. Item-specific distractors let each PV's chips
  reflect the *trap* (figure-out vs figure-in is the teaching point;
  showing irrelevant `over/across/down` chips would dilute it).
- **Reuse `.ad-blank` / `.ad-chip` / `.ad-sentence` CSS classes** for
  particle_sort. Same visual treatment is correct — both are single-
  blank decision drills. Adding `.ps-*` aliases would be premature.
- **Always show full reasoning** even on correct answers — same
  philosophy as article_drill / error_correction. The teaching value
  of particle_sort is the contrast (`take on` vs `take over` vs `take
  up`), not just the right/wrong outcome.
- **Target Artem first**, not Anna (despite Anna having PV in her active
  window since s99). Artem is at B2 with PV in active window AND uses
  builder shell (no count-based hiding). Anna's PV window is fresh —
  she'd benefit but her current focus is the gap-fill bridge, not the
  per-particle decision drill yet. Anna/Ernest particle_sort batches
  are Batch 2 follow-up, not gating.

**Acceptance state for §4.2**:
- ✅ Batch 1 (s98): 50 items
- ✅ Batch 1 supplement (s99): 45 A2-B1 gap-fill
- ⏳ Batch 2 verb families remainder — partially covered by quiz
  content already shipped, but explicit Batch 2 quiz batch (~30 items)
  still queued
- ✅ Coach particle_sort engine (this session)
- ✅ Coach particle_sort first 15 items (this session, Artem-targeted)
- ⏳ Coach particle_sort coverage for Anna (PV active), Ernest/Nicole
  (PV not yet active) — gated on per-player content authoring

**Next session candidates**:

- §4.2 Batch 2 quiz content (give up, call off, figure out, point out,
  rule out, end up, take over remainder — ~30 items in MCQ + gap + input
  mix to bring 5:12:6 ratio fully on target)
- particle_sort items for Anna (~15, B1, themed: home/padel/neighbours/
  daily routine; lower-difficulty PVs from her unlocked pool)
- §4.3 Batch 1.6 — Nicole article_drill (gated on window unlock) +
  remaining ~7 cross-player quiz Q fixes (excluding mc09/mc12)
- §4.4 polish: overflow menu, active-window-aware Coach picker filter,
  mid-quiz exit affordance for learner shell

### v20260502-t6 — §4.4 two-button landing (engagement-first; A7 amendment)

A6 (t1) put Quiz on the primary "Start practice" button as the daily default.
Real-life signal from the family: Quiz is the boring path; Free Write and the
chip-UX drills are what they actually want to open. **A7 (this session) splits
the landing into two buttons** — primary "Start practice" → Coach; secondary
"Start quiz" → Quiz. Quiz stays one tap away (so A6's supply concern is
mitigated), but it's no longer the silent default.

**Shipped — engineering (`index.html` + `sw.js` only)**:

1. **HTML**: added `#lh-quiz` button between `#lh-primary` and the
   `Practice something else →` text link. Wires to `homeStartQuizFromHome()`.
2. **CSS**: new `.lh-secondary` class — full-width button, surface background
   + 1px border, slightly muted vs primary (gold gradient). Same hover
   pattern (translate-up, accent border on hover). Plus `.lh-secondary-hint`
   for the small subtitle.
3. **`homeStartPractice` restructured**. Routing is now Coach-priority:
   1. Resume partial Translation Drill
   2. Spelling Drill (Spell Help threshold ≥5)
   3. **Iterate `[translation, article_drill, particle_sort, error_correction, spelling_drill]`** —
      probe `fsList(...)` to count items for `target_player == currentPlayer || 'all'`,
      start the first type with non-zero items
   4. Free Write fallback (always available)
   5. Last resort: Quiz (only if Free Write unavailable)
4. **`homeStartQuizFromHome()`** — new wrapper for the secondary button.
   Hides home + tabs, calls existing `homeStartQuiz()` from t1, falls back
   to Free Write if pool empty so the button never strands the player.
5. **Hint copy**: primary hint = "free write, drills — we'll pick"; quiz
   hint = "10 grammar questions". Sets the mental model on first sight.

**Routing-loop alert-suppression**:

The naïve "iterate types and call `coachStartType`" approach would stack
five `alert('Could not load exercises')` dialogs in sequence whenever
library reads fail (e.g. firestore.rules block — see Open items below).
Solution: **probe library counts directly via `fsList` with try/catch
before calling `coachStartType`**. Skip type silently when probe fails or
returns 0 items. Only call `coachStartType` once we know it has items —
and treat anything other than `=== true` as failure (`undefined` was
silently exiting the loop on the first 403 in the initial implementation,
caught during preview verify).

**Verified end-to-end via preview probe (Ernest)**:

- Home renders both buttons. Primary "Start practice" + hint, secondary
  "Start quiz" + hint, tertiary "Practice something else →" link. ✓
- "Start quiz" tap → quiz tab visible, home hidden, `sessionQs.length === 10`,
  `mode === 'smart'` (existing `homeStartQuiz` behaviour from t1, unchanged). ✓
- "Start practice" tap with healthy `fsList` (mocked to return 10 Ernest
  translation items) → Coach tab visible, `coachState.type === 'translation'`,
  `plannedTotal === 10`, `pool.length === 9` (popped first item). ✓
- "Start practice" tap with all `fsList(exercises_library/...)` returning
  HTTP 403 (the current live state — see Open items below) → loop probes
  all 5 types, all skip silently, falls through to Free Write fallback,
  `coachState.type === 'free_write'`, `fwSessionId` set. No alerts shown. ✓
- Empty-pool "Start quiz" path falls back to Free Write same way (so the
  secondary button never strands the player either). ✓

**Pre-deploy**:
- syntax OK, transform audit OK (46 transforms unchanged), lint_questions
  OK (1,984 questions clean), version-string consistency OK (v20260502-t6
  in HTML meta + HTML badge + sw.js cache key).

**Decisions called inline** (locked as A7 in §3.1):

- **Primary = Coach, secondary = Quiz** — engagement-first front door.
  A6's supply argument was content-economics; the real signal is that Quiz
  silently routing as the default suppresses engagement.
- **Probe before invoke** for the COACH_PRIORITY iteration — avoids alert
  cascade when library reads fail.
- **Both buttons fall back to Free Write when their primary path fails** —
  no dead-end taps. Free Write is the always-available floor.
- **Hint copy is action-led, not feature-led** ("we'll pick", "10 grammar
  questions"), matches the simple-card-language pattern from setup screens.

**Acceptance state for §4.4**:
- ✅ Two-button landing (this session)
- ✅ Active-window-aware Quiz (s95 + t1)
- ✅ Coach picker with type-aware routing (s95–s100)
- ⏳ Active-window-aware Coach picker filter (filter buttons by
  `active_categories` membership) — still queued
- ⏳ Overflow menu (history / achievements / settings / switch player)
  — still queued
- ⏳ Mid-quiz exit affordance (still no escape from a 10-question quiz
  short of refresh; bounded but worth revisiting)

**Open items surfaced (not introduced) by this session**:

- **`firestore.rules` 403 on `exercises_library/...`**. The t5 rules update
  added `match /exercises_library/{document=**} { allow read, write: if false; }`
  which blocks the PWA Coach tab from listing library content. Comment in
  `firestore.rules` says "writes happen via tools/push_library.js with a
  service account if needed" but `push_library.js` uses anonymous REST
  writes via `_firestore.js`, not a service account — so writes will also
  break once these rules are deployed. The `(deployed separately via
  firebase CLI)` note in the t5 commit message suggests the rules may not
  be live yet; need to confirm before next deploy. **Fix needed before
  shipping any Coach work**: change to `allow read: if true; allow write:
  if false;` so the PWA can list items and `tools/push_library.js` is
  the controlled-write path (rule trusts the open-write convention for
  authoring; reads were never the threat).

**Next session candidates**:

- **Fix `firestore.rules` `exercises_library` read access** — gating issue
  for any future Coach work. Open `read: true`, leave `write: false` (or
  open) per the threat model in the file header.
- §4.3 Batch 1.6 — Nicole article_drill + remaining cross-player quiz Q
  fixes
- particle_sort items for Anna (~15, B1, themed)
- §4.4 polish: overflow menu, active-window-aware Coach picker filter,
  mid-quiz exit

---

*This file lives at `plans/phase2-build-plan.md` in the repo. Updated
by CC as decisions land in flight. Should be archived once Phase 2D
acceptance (§8) is met, alongside the predecessor `phase2-coach-tab.md`.*
