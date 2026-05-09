# Version Log

Session-by-session history. Newest first.

For full detail on any older session, see the archived HTML KB:
`archive/quiz_knowledge_base_v20260428-s87.html`.

This markdown summarises only — full bug logs, design rationales, and code
specifics live in their dedicated reference files.

---

## 2026-05-09 · Session r2
### v20260509-r2 — Translation grader: iOS L-for-I autocorrect + curly-quote normalization

Anna reported "one answer is always incorrect, even if I repeat the suggestion" on `tr_anna_b16` ("After training I'm very tired"). Root cause: iOS autocorrect swaps capital `I` → lowercase `l` in contractions (visually identical, byte-different), and the smart-punctuation feature replaces straight `'` with curly `’`. The grader's contraction-expansion regex (`\bi'm\b`) matches neither, so a verbatim retype of the suggestion was scored at Levenshtein 4 against the expanded form and rejected.

- **`coachNormalize` ([index.html:10314](index.html:10314))** — added two pre-steps before the existing contraction expansion: (1) curly `’`/`‘` → straight `'`; (2) `l'm`/`l'll`/`l've`/`l'd` → `i'<same>`. The standalone tokens are not English words, so no risk of false-correct on unrelated input. Verified in preview: `"After a training l'm very tired"` (curly + lowercase L) and `"After training I'm very tired"` now normalize identically. Real errors (`at the kitchen`) correctly stay wrong.
- **`tr_anna_b04` (Firestore — live, no deploy needed)** — `correct_answers` widened from 5 → 8 forms to accept `"my keys"` variants. Russian *Я ищу ключи* almost always means *my keys* in real life; rejecting that form was a question-quality bug, not a learner gap.
- **`tr_anna_b11` (Firestore — live)** — added `at_the_kitchen` to `common_errors` between the two existing entries. Anna repeatedly typed `at the kitchen` (calque of *на кухне*) and only got the generic fallback feedback; she now gets a targeted *на → in* explanation.

Q count: 2196 → 2196 (no change) · Version: v20260509-r2

---

## 2026-05-09 · Session r1
### v20260509 — Mistakes/stats-review batch: 9 stem tightenings (single-correct-answer pass)
- **9 questions stem-tightened** to enforce one defensible correct answer (Artem's stated preference: tighten stems over widening alt-answers).
- `co_b06` (B1 Conditionals): tail rewritten "You burn yourself." — was "You will burn yourself" mixing first/zero conditional, licensed key `happens` and distractor `will happen` simultaneously.
- `pv_l02_i` (B2 PV input): rewritten to ongoing-now framing ("I'm in the middle of a really tough stretch — my family is helping me ___ it day by day") to block the "get over" reading enabled by past-period framing.
- `gt03/gt04/gt10` (PV B1/B2): GET-family alt-answer cluster — three siblings where decoy and key were both natural. Stems tightened with explicit vehicle (`gt03`: "the bus"), past-finished + "finally" (`gt04`: blocks endure-during), and "day by day — no shortcut" (`gt10`: blocks recover-after).
- `hw03` (B1 RC): meta-trap dropped — was "Which is most natural for habit?" with key=[3] "All three are correct" punishing correct intuition; rewritten to "Which is the most formal?" key=[0] with-whom.
- `aph35` (B2 Articles): removed anaphoric "we have been here before" licence for `the`; new stem "neither path is clearly better, steering committee is split" forces the indefinite idiom.
- `ga10` (B2 Adjectives): swapped extreme-adjective from `delicious` (register-debatable) to `enormous` (unambiguous size collocation); "very enormous" cleanly wrong.
- `ex05` (B1 Vocab): distractor pruned from `[wound, winded, ended, found]` to `[wound, winded, wind, wounded]` — eliminates "ended up" alt-answer; now isolates the wind-past distinction.
- **`zc08` removed from queue** after closer audit: ans is `'aren't'` (1-word zero conditional); Anna's "will not be" is a genuine Russian-L1 future-for-zero error, not a validation bug.
- `lint_questions.js` clean (2196 questions). `check_transform_keywords.js` clean (55 transforms).

Q count: 2196 → 2196 (no change) · Version: v20260509

---

## 2026-05-08 · Session r3
### v20260508-r3 — Wave 3: Ernest scaffolding (10 hint rewrites + 5 new B1 Articles)

Smaller follow-on to r2. Targets Ernest's documented recognition→production gap on Articles.

**Wave 3a — Hint scaffolding pass (10 existing items)**
Upgraded terse `(1 word)` hints to explicit semantic cues:
- Articles input (6 items: `art_d01`, `art_d03`, `art_d06`, `art_d07`, `art_d10`, `art_d11`) → `"article: a, an, the, or – (1 word)"` — matches the new `art_e*` pattern, gives Ernest the explicit four-token MCQ-equivalent he needs.
- Modal Verbs input (`mvc24` → "modal: weak guess / possibility"; `mvc25` → "modal: past ability").
- Adjectives -ed/-ing (`adj_i01` → "-ed adjective: how the person feels"; `adj_i02` → "-ing adjective: property of the thing").

**Wave 3b — 5 new B1 Articles input items (`art_e01`–`art_e05`)**
All target uncountable / zero-article patterns (canonical Russian L1 errors):
- `art_e01` "useful information" → zero
- `art_e02` "pass the salt" → the (shared knowledge)
- `art_e03` "made good progress at padel training" → zero
- `art_e04` "drink coffee every morning before school" → zero (generic)
- `art_e05` "bought a new fridge" → a (first mention)

All `biz: false`, themes from Ernest's set. Hint pattern uniform: `"article: a, an, the, or – (1 word; – means no article)"`. `ans` accepts case + glyph variants (`–`, `—`, `-`).

Pre-deploy: `tools/lint_questions.js` clean (2196); `tools/check_transform_keywords.js` clean (55 transforms).

Q count: 2191 → 2196 (+5) · Version: v20260508-r3

---

## 2026-05-08 · Session r2
### v20260508-r2 — Bank overhaul: themes + Pronouns category + error_correction type + Waves 1/2/4 (+166 questions) + UX

Major bank-architecture session. Schema overhaul, 1 new category, 1 new question type, 166 new questions targeting Nicole/Anna/Artem coverage gaps, plus UX polish.

**Schema (Wave 0a–0g)**
- Added `themes` field (closed-set 8-tag array) to all 2,025 existing questions. Tagging done via batched sub-agent passes; 162-question hand-tagged sample as gold standard. See `references/question-bank-taxonomy.md`.
- Adopted relaxed relevance model (themes as metadata, routing on lvl + biz only).
- Migrated 125 B1 Grammar items into specific categories. New 28th category **Pronouns** (40 items: reflexives + reciprocals + singular-they). Grammar now empty (held in reserve).
- Fixed long-standing `wordform.base` bug: 40 items had no base field, all rendered "Form a word from: undefined". Derived bases from `(q, ans)` pairs and back-filled.
- Documented `hard` field; stripped dead `linked_question_ids` (18 items).
- Added new question type `error_correction` (Russian L1 pattern recognition) with tolerant matching (case, whitespace, contractions, punctuation). 12 baseline items.
- 9 biz-flag corrections + 4 theme repairs.

**Wave 1 — Nicole** (+60 q): Word Order (12), Collocations B1 baseline (12), Idioms B1 baseline (12), Used To B1 (8), Indirect Questions B1 (8), Quantifiers gap (8). Closed Nicole's Collocations (0→15) and Idioms (0→12) zero cells.

**Wave 2 — Anna** (+50 q): Reported Speech input (10), Linking Words input (10), Idioms B2 (8), Passive Voice input (10), Question Formation B2 (8), Adjectives input (4). Reported Speech 0%→31% input share; Linking Words 11%→28%; Passive Voice 14%→52%.

**Wave 4 — Artem** (+32 q): Used To biz (6), Tenses input (10), Vocabulary biz register (8), claude_collab seed (8 across PV/Vocab/Modal/Tenses/QF). First substantive `claude_collab` content — went from 4 to 12 items.

**UX**: Categories alphabetical everywhere (`cov-cat-row` was unsorted — now `localeCompare`). Full Statistics list got column headers (`Category` / `Seen` / `Acc`). **Family heatmap is now drillable** — click any cell to see per-category breakdown for that player at that band, with totals + accuracy + alphabetised category list.

**Schema linter** (`tools/lint_questions.js`) updated to include `error_correction` type.

Q count: 2025 → 2191 (+166) · Version: v20260508-r2

---

## 2026-05-08 · Session r1
### v20260508-r1 — Mistakes-review fixes: 1 stem rewrite + 2 alt-answer widenings

Landed the 3 quality bugs surfaced by today's `mistakes-review` daily routine. All three user-approved before edit. Two of the three hit a second player as well as the player whose mistake surfaced them.

- **`mn03`** (Modal Verbs, B1, mcq): replaced ambiguous opt [2] *"People are usually unhappy hearing criticism, aren't they?"* (a valid tag question — the exp itself conceded it) with a negation-form distractor *"People are usually no happy to hear criticism."* (Russian L1 trap, parallel to mn01/mn02). Exp updated to drop the tag-question note and add the *no* (negates nouns) vs *not* (negates verbs/adjectives) contrast. Hit artem 2/4, nicole 1/2.
- **`ee25`** (Everyday English, B1, input): widened `ans` to accept *be going*. *"I'd better be going!"* is a textbook 2-word casual British leave-taking; matches the existing hint. Exp updated. Hit artem 0/2, anna 1/3.
- **`emph_fr05`** (Emphasis, C1, transform): widened `ans` from *'proposal I would never'* to also accept *'proposal I wouldn't ever'* and *'proposal I would not'*, mirroring sibling `emph_fr04`. "Under any circumstances" is a strong NPI that licenses plain *not*; sibling-pair consistency was the gap. Both schema invariants still hold (lint clean). Hit artem 0/1.

Pre-deploy validation: `tools/lint_questions.js` clean (2025 questions); `tools/check_transform_keywords.js` clean (54 transforms).

Q count: 2025 → 2025 (no count change) · Version: v20260508-r1

---

## 2026-05-08
### v20260508 — Phrase Swaps rotation + claude_collab tag

- **Phrase Swaps drill rotation**: kept the 6-cue session size, but the pool builder (`coachBuildPhrasePool`) now Fisher-Yates-shuffles `active` and `retest_due` before slicing, so items past index 6 finally get reached. Verified in preview: three back-to-back synthetic calls drew three different 6-item subsets covering all 10 mock entries. ([index.html:8500](index.html:8500))
- **New context tag `claude_collab`**: added to recognised-tags list in `references/coach-notes-schema.md`, to Artem's themes in `references/family-profiles.md`, and to `PLAYER_TAGS.artem` + `tagDescriptions` in `tools/update_coach_notes.js`. Anchors the real register Artem uses when prompting CC and talking about project state — was previously landing untagged or being mistaken for project-meta noise.
- **Artem's pool cleanup** (Firestore-only, no code changes): deduped the "my achievement of 4 years ago" twin (kept the entry with `psd` drill history); re-tagged 15 of 20 phrase_tracker entries to `claude_collab`; reworded 3 stiff naturals/awkwards (#5 "for me" → "to me"; #11 "wrote to" → "wrote in / added to"; #18 added missing "'re"). Pool size 21 → 20 distinct entries.

Q count: 2025 → 2025 (no count change) · Version: v20260508

---

## 2026-05-07 · Session t1
### v20260507-t1 — Family-tab redesign + lvlStats integrity fixes

UI: Quiz tab returned to ribbon (showTab('setup')). Family tab lower half rebuilt: dropped per-session sparkline + duplicate accuracy stat box, added 3-stat effort row (Sessions / Questions / Topics), added per-card cumulative C1 trend chart (3m/1m/1w/now points = lifetime accuracy as-of each timepoint, computed by subtracting future sessions from `lvlStats`). Auto-ranged Y-axis. Family levels strip rebuilt as a `players × {B1,B2,C1}` heatmap (cell hue = accuracy band, brightness = pool coverage). Fixed undefined `--blue` and `--yellow` CSS vars that were rendering progress bars transparent.

Data integrity:
- **Restored Artem's `lvlStats.C1`** from corrupted 3225/2337 → 333/240 via `tmp/restore_artem_lvlstats.js`. Reconstruction = clean 2026-05-06 backup + 3 newer-session deltas + Coach-Tab B2 residual; cross-validated against frozen RTDB snapshot (267/198 at 2026-04-28).
- **Root-cause fix in `backfillStats`** ([index.html:3635](index.html:3635)): added belt-and-braces guard — short-circuits when either `lvlStats` or `catStats` already holds non-zero seen counts, regardless of `_backfilled` flag. The flag was being lost through `loadFromFirebase`'s merged-object round-trip, allowing the loop to re-run and ADD qStats sums on top of populated lvlStats (the 05-06 inflation mechanism).
- **`canonicalBand()` defense**: new `/^[ABC][12]$/` guard wired into `recordAnswer`/`recordMultiAnswer`/`backfillStats` so non-canonical band labels (e.g. `B2-C1` range labels, missing values) coerce to `B2` instead of polluting lvlStats.
- **One-shot `?` and `B2-C1` cleanup** via `tmp/merge_noncanonical_bands.js`: Artem `?` 26/19 → B2, `B2-C1` 16/12 → C1; Nicole `?` 10/5 → B2. Sums preserved on both. Other 3 players were already clean.
- **Sync cap bumped 10 → 50** ([index.html:6938](index.html:6938)) so trend buckets fill in over time.
- CLAUDE.md trimmed under 500-word CI cap (the `mistakes-review` row added in 1947543 had pushed it to 509).

Q count: 2025 → 2025 (no count change) · Version: v20260507-t1

---

## 2026-05-06 · Session t2
### v20260506-t2r5 — Mistakes-review fixes: 3 alt-answer widenings + 1 stem rewrite

Landed the 4 quality bugs surfaced by today's `mistakes-review` daily routine. All four user-approved before edit.

- **`pv_a06` + `pv_a07`** (Passive Voice, B2): widened `ans:0` → `ans:[0,1]`. The exp on both already acknowledged that *get + something + done* is equally correct as the causative — the keyed answer was inconsistent with the explanation. Sibling `pv_a06` had the identical defect and was fixed in the same pass.
- **`mvc20`** (Modal Verbs, B2): widened `ans:[1,2]` → `ans:[0,1,2]` and rewrote exp. *Must submit the expense report within 30 days — it's a firm company requirement* is standard formal corporate register; the previous "must is slightly odd" exp was an over-fine prescriptive call that didn't match real business writing.
- **`gsp01`** (Grammar, B1): rewrote stem from the meta-language *"I try to avoid it so I will not get stuck with one preposition"* (no antecedent for "it", weird persona for Nicole) to `[home_daily]` *"I always get stuck with doing the dishes when my brothers aren't home"*. Same pedagogical target (need *get* + *with* collocation), unambiguous answer, age-appropriate context. Kept ans:2 (mcq engine doesn't support array ans — design decision deferred).

Pre-deploy validation: `tools/lint_questions.js` clean (2025 questions); ALL_QUESTIONS array parses cleanly (length 2025 unchanged).

Q count: 2025 → 2025 (no count change) · Version: v20260506-t2r5

---

## 2026-05-06 · Session t2
### v20260506-t2r4 — Emphasis rebuild Phase 2 (Business inversion + Fronting)

Second phase of the Emphasis rebuild per `plans/EMPHASIS_REBUILD_SPEC.md`. Adds the production-side ladder for business inversion (which previously had only 2 mcq recognition items) and introduces a new Fronting subtopic framed as a distinction skill (fronting vs negative inversion vs cleft). Phase 3 (academic inversion polish) remains deferred until Egor reactivates exercise sessions.

**New content (11 questions)**:
- **Business inversion** (6 new, `emph_bi01–06`): the four formal patterns Artem actually uses in business writing.
  - *Should you have / Should you wish* — formal email closers (`emph_bi01`, `emph_bi06`, both input).
  - *Had I/he known* — third-conditional inversion for counterfactual regret (`emph_bi02` transform, `emph_bi05` multi).
  - *Were we to* — formal hypothetical inversion for board/analyst questions (`emph_bi03` input).
  - *Under no circumstances + aux + S* — zero-tolerance prohibition (`emph_bi04` transform).
  - All `biz:true`, all real Bapco/board/vendor/audit contexts.
- **Fronting** (5 new, `emph_fr01–05`): framed as the distinction skill. The teaching value is recognising when to invert (negative adverbial fronts) vs when not (object/topic fronts).
  - `emph_fr01` gap — object fronting + anti-inversion contrast (coffee/pasta).
  - `emph_fr02` input — adverbial fronting with pronoun subject (no inversion).
  - `emph_fr03` gap — predicate fronting with be-inversion (formal register).
  - `emph_fr04` input — object fronting + negation in main clause; the trap question (do NOT invert).
  - `emph_fr05` transform — object fronting transformation; explicit contrast with cleft and inversion alternatives.

**Coverage shift**:
- Total Emphasis 44 → 55.
- Input share 25.0% → 29.1%.
- Business inversion subtopic 2 → 8 (now has full ladder: 2 mcq recognition + 3 input + 1 multi + 2 transform).
- Fronting subtopic 0 → 5.
- Type mix unchanged structurally; multi count grew 5→6, transform 9→12.

**Subtopic distribution (all 55 questions, post-Phase-2)**:
| # | Subtopic | Count |
|---|---|---|
| 1 | Cleft | 7 |
| 2 | Do-emphasis | 6 |
| 3 | So/Neither/Nor | 7 |
| 4 | Intensifiers | 9 |
| 5 | Business inversion | 8 |
| 6 | Academic inversion | 12 (Phase 3, deferred) |
| 7 | Fronting | 5 |

Pre-deploy validation: lint clean (2025 questions); transform-keyword audit clean (54 transforms, including the 3 new); JS syntax OK; sparse-array clean; preview eval confirms all 11 new IDs load, multi-blank schema validates, transform keyword rules satisfied; no console errors.

Q count: 2014 → 2025 (+11) · Version: v20260506-t2r4

---

## 2026-05-06 · Session t2
### v20260506-t2r3 — Emphasis rebuild Phase 1 (Cleft, Do-emph, So/Neither, Intensifiers)

Emphasis category rebuilt per `plans/EMPHASIS_REBUILD_SPEC.md`. The category was over-indexed on academic inversion (12 of 18 questions) at the expense of constructions the family actually uses. Phase 1 closes three subtopic gaps (Do-emphasis, So/Neither/Nor, and substantial Cleft expansion) and adds an Intensifiers ladder.

**Audit fixes (existing 18 questions)**:
- Level demotions: `inv06–10` C2→C1 (5 mcqs); `se02` C1→B2.
- Reclassify `inv05` + `inv10` to subtopic 5 (business inversion). `inv10` flipped `biz:false → true`.
- Family-context rewrites: `se01` (cycling/Jebel Hafeet "literally heart-stopping"), `se02` (CFO board context), `emph_i02` (Bapco it-cleft, predicate-cleft anti-pattern removed).
- `exp` ✗-contrast adds: `tf_31` (Never I had seen), `tf_32` (Only after had I reviewed — addresses the misplaced-inversion error pattern).

**New content (26 questions)**:
- Cleft (6 new, ids `emph_cl01–06`): all-cleft B1, it-cleft object focus B2, what/pseudo-cleft B2/C1, transforms. Family + biz contexts. Heavy emphasis on RU L1 *«то, что»* → *what* (not *that*) trap.
- Do-emphasis (6 new, `emph_do01–06`): present/past/imperative/concession patterns. RU L1 *«ведь, же, действительно, всё-таки»* → *do/does/did + bare verb*.
- So/Neither/Nor (7 new, `emph_sn01–07`): B1 + B2. Aux-matching is the central rule — every `exp` hammers RU L1 default-to-*am* error.
- Intensifiers (7 new, `emph_in01–07`): gradable vs ungradable adjective rule. RU L1 *очень* over-extension trap. *way/far + comparative*.

**Coach_notes cleanup (Artem)**: removed `weak_patterns` entry "emphasis/inversion: two-layout matrix not consolidated…". The 0/3 drill 2026-05-06 surfaced a real production gap on academic-inversion patterns (no sooner…than / not until X did Y / only after X did Y) — but those are formal-writing patterns Artem doesn't need to produce in business communication. Recognition mcqs (inv01–10) remain in the bank; new authoring of academic inversion is deferred to Phase 3 (Egor-triggered). The `recent_observations` entry stays as historical record.

**Coverage shift**:
- Total Emphasis 18 → 44.
- Input share 16.7% → 25.0% (now above 20% target).
- Level mix B1 0→7, B2 1→20, C1 17→17, C2 5→0.
- `biz:true` 4 → 17.

**Subtopic distribution (all 44 questions, post-Phase-1)**:
| # | Subtopic | Count |
|---|---|---|
| 1 | Cleft | 7 |
| 2 | Do-emphasis | 6 |
| 3 | So/Neither/Nor | 7 |
| 4 | Intensifiers | 9 |
| 5 | Business inversion | 2 (Phase 2 will add 4–6) |
| 6 | Academic inversion | 12 (Phase 3, deferred) |
| 7 | Fronting | 0 (Phase 2 will add 5) |

Pre-deploy validation: lint clean (2014 questions); transform-keyword audit clean (51 transforms); JS syntax OK; sparse-array scan clean; preview eval confirms all 26 new IDs load and `emph_i02` audit-fix structure intact.

Q count: 1988 → 2014 (+26) · Version: v20260506-t2r3

---

## 2026-05-06 · Session t2
### v20260506-t2r2 — Family levels: "Building" tier below 60% gate

`dominantBandPhase` now falls through to a **Building** tier when no band passes the 60% accuracy gate but at least one band has ≥30 seen. Surfaces the lowest such band (the player's natural "current band"). Eliminates a threshold-cliff bug where a single wrong answer could flip the family-tab levels strip from "Settling B1" to "No data yet" — surfaced today when Anna's B1 dipped from 60.something% to 59.94%.

Behaviour:
- Anna (B1 352/211 = 59.94%): was `null` → "No data yet". Now `Building B1 · 60% · 459 Qs · Grammar`.
- Players actually passing the 60% gate at any band: unchanged (still Solid/Comfortable/Settling).
- Players with no band ≥30 seen: still `null` → "No data yet" (genuinely no data).

Sort order in family-levels-strip + levels table preserved: `bandRank` desc → `phaseRank` desc → accuracy desc. `phaseRank` lookup uses `|| 0`, so the new `Building` phase sorts below `Settling` within band — correct (Settling is further along).

Pre-deploy validation: JS syntax OK; question count 1988 unchanged; schema lint clean; transform keyword audit clean; doc word caps OK across all 7 files (CI's C.UTF-8 locale verified locally).

Q count: 1988 (unchanged) · Version: v20260506-t2r2

---

## 2026-05-06 · Session t2
### v20260506-t2 — Phase 3: Phrase Swaps button on PWA Coach tab

User-visible deploy of the natural-phrases initiative. Builds on Phase 1 (KB scaffolding) and Phase 2 (worker mode + tools, worker deployed to Cloudflare separately).

**index.html — Coach tab additions**:
- New "Phrase Swaps" button in the picker grid, alongside Free Write. Visible to all 5 players (Egor included). Per-player count populated from lexical entries in `coach_notes.weak_patterns` + retest-due entries in `phrase_tracker`. Disabled with "no phrases yet" until first capture lands.
- Same liveAI gating as Free Write (hidden if Worker URL absent, offline, or API exhausted).
- New `coachStartPhraseSwapDrill()` flow: pulls fresh player doc on start, builds 6-cue pool (4 active + 2 retest-due, mixed), opens chat with synthetic "ready" first turn.
- New `coachPhraseSwapSendUserTurn()` and `coachPhraseSwapEnd()` mirror the Free Write loop. End-of-session: log to `coach_sessions/{psd_*}`, parse `session_metadata.phrase_swaps_drilled[]`, run `coachApplyPhraseSwapTransitions` (lifecycle: 3 clean → demote → 21d retest → 42d mastered → owned).
- New `coachParseLexicalWeakPattern()` — strict regex requiring whitespace around the arrow so legacy grammar shorthand (`a→the for shared knowledge`) does not match. Filters single-word natural forms unless they carry an explicit `[tag]`.
- `coachState` extended with `psd*` fields and `playerPhraseTracker` cache.
- `coachMakeSessionId` emits `psd_` prefix for phrase_swap_drill mode (mirrors the prefix added to `tools/log_coach_session.js` in Phase 2).
- `coachShowPicker` resets the new state on exit.

**Smoke-tested in Claude Preview (artem signed in)**: button renders correctly, parser rejects all known false positives (grammar shorthand, single-word natural forms without tag), pool builder mixes active + retest with proper de-dupe and date filtering. Console clean, no JS errors.

**Pre-deploy validation**: JS syntax OK; question count 1988 unchanged; schema lint clean (1988 questions); transform keyword audit clean (46 transforms); no duplicate consts; no sparse arrays; version string consistent across 3 canonical locations.

**Worker dependency**: this PWA build calls `mode: "phrase_swap_drill"` which was added in Phase 2 and deployed to Cloudflare (worker version `2aaf2c3f-7c52-4958-830f-2115179a1ea5`). Worker is live; the button just had no UI to call it until now.

**What's next (Phase 4)**: seed 2-3 swaps per player into `weak_patterns` so the button enables on real player accounts; run an end-to-end drill per player; verify `phrase_tracker` transitions land correctly; regenerate the 5 markdown trackers.

Q count: 1988 (unchanged) · Version: v20260506-t2

---

## 2026-05-06 · Session t2
### Phase 2 — Natural-phrases worker mode + tools (worker deploy required, no PWA deploy)

Builds on Phase 1's KB scaffolding. Adds the `phrase_swap_drill` worker mode and extends the two CLI tools that touch coach data so the lifecycle loop is now exercisable end-to-end (capture → store → drill → log → transition → markdown regen).

**Worker (`worker/index.js`)**:
- New mode `phrase_swap_drill` added to `VALID_MODES`. Validation requires `context.phrase_pool` (non-empty array of `{awkward, natural, tag?, status?, also_accept?}`).
- New `phraseSwapDrillSystemPrompt(ctx)`: themed RU cue → EN production drill, lenient scoring (multiple natural forms accepted via `also_accept`), 1–2 sentence register explanation on stiff production. Honors `coach_language` (RU for Anna/Nicole; EN for others). Default 6 cues per session, capped at 10.
- `sessionEndInstructions('phrase_swap_drill', ctx)`: generates a two-part response — player-facing markdown table (≤10 lines, hides field names) + `<session_meta>` with `phrase_swaps_drilled[]` (per-pool-entry `produced_natural` boolean → drives lifecycle transitions in stats-review).
- `egor` added to `ALLOWED_PLAYERS` (was anna/nicole/ernest/artem only).

**Tools**:
- `tools/log_coach_session.js`: accepts `mode: "phrase_swap_drill"`, generates `psd_` session-id prefix, persists optional `phrase_swaps_captured[]` (from free_write) and `phrase_swaps_drilled[]` (from psd) on the session doc.
- `tools/update_coach_notes.js`: extended with three new patch keys (`phrase_tracker_add`, `phrase_tracker_transition`, `phrase_tracker_remove`) and a `--regen-tracker-md` flag (standalone or post-patch). Auto-computes `next_retest` from cadence (21d demote → 42d mastered → owned). Markdown regen reads `players/{name}.phrase_tracker` and overwrites `progress/natural-phrases-tracker-{name}.md` with a templated view (status legend, per-tag coverage table, inventory). `main()` now guarded with `require.main === module` so the module is importable for testing.
- Smoke test passed: empty Anna tracker matches Phase 1 template structure; capture → transition → re-render correctly rolls counts, computes 21-day next_retest, and concatenates source labels.

**Worker docs**: `worker/README.md` updated — validation rules, new mode payload shape, curl example, session-end response shape.

**What's NOT in Phase 2**:
- PWA Coach tab "Phrase swaps" button (Phase 3, requires deploy-build)
- First-cycle seed data + end-to-end smoke (Phase 4)
- Egor-specific pre-gen content audit (Phase 5)

**Deploy required**: `cd worker && wrangler deploy` (does not affect PWA — Phase 3 is the next user-visible deploy). Tools are CLI-only, no deploy.

Q count: 1988 (unchanged) · No PWA version stamp (Phase 3 carries that)

---

## 2026-05-06 · Session t2
### Phase 1 — Natural-phrases initiative foundation (KB only, no deploy)

KB-only changes laying groundwork for `phrase_swap_drill` (Phase 2 worker, Phase 3 PWA). Goal: capture, retest, and master lexical/register swaps (e.g. "sometime ago" → "a while ago [brit_expat]") alongside grammar weaknesses.

**`weak_patterns` notation extended** to accept `"<awkward> → <natural> [<context_tag>]"` for lexical/register swaps, alongside existing grammar entries. Tags: `[biz_oil] | [brit_expat] | [leisure_sport] | [home_daily] | [academic_ielts] | [kpmg_consulting] | [almaty_daily]`. Convention only — no Firestore schema change. Worker `freeWriteSystemPrompt` (line 248) updated so the model treats lexical entries as recast targets, not error categories.

**Brit-expat as 3rd context theme** added for Artem (pubs/padel/rugby/F1), Anna (British Club, school gate), Nicole (expat-school friends), Ernest (expat-school playground). Egor stays without it (Almaty, no Bahrain expat exposure).

**Egor policy reversal — full family parity**. Previously quiz-only with no Coach tab use. Now has access to PWA Free Write, PWA `phrase_swap_drill`, and `exercise-session`. Profile gains communication style (English, IELTS-rubric framing, metalinguistic-vocabulary engagement) and exercise themes `[academic_ielts] | [kpmg_consulting] | [almaty_daily]`. KPMG context clarified as English-speaking consulting work (Russian-L1 colleagues, English-language deliverables). Coach language stays `en`.

**Auto-write coach_notes** for session skills (`free-write`, `exercise-session`, PWA worker). Replaces "preview → wait → confirm" with "auto-write → table read-out → non-blocking feedback ask" — protects against players abandoning sessions mid-feedback. `stats-review` and `family-profiles.md` edits remain confirm-first. Player-facing read-out is a small markdown table (≤10 lines) with internal field names hidden; templates in `coach-notes-schema.md`.

**Phrase tracker introduced**. Per-player Firestore field `players/{name}.phrase_tracker` is canonical store for the lexical-swap inventory + spaced retest queue (21d after demote → 🟢 mastered → 42d → 🏆 owned). Markdown view at `progress/natural-phrases-tracker-{name}.md` × 5 is **generated** by `stats-review` (never hand-edited). Worker reads `phrase_tracker` directly when assembling drill items.

**`phrase_swap_drill` added as canonical exercise type 9**. Lenient scoring (multiple natural forms accepted), register explanation on stiff production (no grammar lecture). 6 items per session (4 active + 2 retest-due, mixed by worker). PWA Coach tab button visible to all 5 players. `coach_sessions` mode enum extended; new `psd` session-id prefix.

**Files touched**:
- `references/family-profiles.md` (4 players gain brit_expat, Egor reworked)
- `references/coach-notes-schema.md` (notation, update protocol rewrite, lifecycle section)
- `references/exercise-types.md` (type 9, Egor row in selection table)
- `references/firestore-schema.md` (`phrase_tracker` field, mode enum, psd prefix)
- `.claude/skills/free-write/SKILL.md` (auto-write, capture card, drop "Artem only" framing)
- `.claude/skills/exercise-session/SKILL.md` (remove Egor exclusion, swap step 5↔6, capture card)
- `.claude/skills/stats-review/SKILL.md` (phrase tracker maintenance step 6)
- `worker/index.js:248` (one-line prompt edit for lexical entries)
- `CLAUDE.md` (5 generated tracker files, 9 exercise types, skill triggers updated)
- `progress/natural-phrases-tracker-{artem,anna,nicole,ernest,egor}.md` (5 new empty trackers)

**Phase 2 (worker mode) and Phase 3 (PWA button) not yet started** — those land in subsequent sessions.

Q count: 1988 (unchanged) · No version stamp (no deploy)

---

## 2026-05-05 · Session t1
### v20260505-t1r4 — Navigation tabs back + Family levels restored + medal system fix

Two threads in one push: navigation polish on top of t1r3's learner-everywhere flip, and a research-backed overhaul of the medal system.

**Navigation (per t1r3 follow-up):**
- Tab bar visibility centralised in `showTab()`: hidden on home (calm landing), shown on every non-home screen so Coach/Family/Stats are reachable from each other. Removed the per-function `learner ? 'none' : ''` toggling.
- Tab buttons reordered to `🏠 Home / 📊 Statistics / 👨‍👩‍👧 Family / 🎯 Coach`. The 🎯 Practice (builder Setup) button removed — builder shell isn't reachable through normal flow anyway after the t1r3 ui_shell flip.
- `lh-levels-zone` restored on home (after Family streaks) — user kept the zone valuable for at-a-glance phase tracking.
- Family tab gains a richer `family-levels-strip` block (CEFR phase + accuracy + lifetime Qs + most-played category, sorted by band → phase → accuracy) — duplicates the home table with more depth, the user's preferred place for the data.
- `renderLearnerFamilyBoards()` already tolerated the missing levels table from r3; restoration is purely additive.

**Medal system overhaul:**
- **Persistence bug (the "shaky" complaint):** `DB.badges` was set in memory by `checkNewBadges()` but never persisted — every page reload announced all existing badges as "new" on the next quiz. Fix: added `badges: {}` to `createPlayerData()` and the remote-doc merge in `syncFromFirebase()`; `checkNewBadges()` now calls `saveData(DB)`.
- **Highest-watermark rule:** Once a category earns a tier, it can't be downgraded by accuracy dips. Stops threshold-flicker as `seen` and accuracy bob across boundaries.
- **Hybrid threshold (absolute OR coverage):** Audit revealed that 6 of 28 categories were locked out of any medal (bank size <30) and 17 of 28 were locked out of gold (bank <50). New `computeBadges(catStats, qStats)` qualifies a player when EITHER `seen >= absoluteThreshold` OR `unique_seen_in_cat >= ceil(catSize * coverageRatio)`. Coverage uses *unique* questions seen (intersection of `qStats` IDs with `ALL_QUESTIONS` filtered by cat) so it can't be gamed by re-answering the same easy question. Ratios: bronze/silver 80%, gold 90%. Result: every category becomes medal-reachable for at least gold; existing absolute thresholds keep their meaning for big categories.
- **🌟 Gold-Master tier added:** ≥85% accuracy AND ≥150 attempts AND catSize ≥150. Absolute-only path (coverage path disabled) — point of master is "you put in the volume", which a 22-question category can't legitimately demonstrate. Only Tenses, Articles, Gerunds & Infinitives, Vocabulary, and Phrasal Verbs are eligible. `MEDAL_RANK` extended; results-screen and home/family rendering updated to surface the tier.
- **Toast-fatigue cap:** Results-screen `res-new-medal` panel now shows only the highest-tier upgrade (one pill), even when a single quiz triggers multiple boundary crossings. Toast was already capped at one. Research backing: notification fatigue + Duolingo's tiered progression pattern (Yu-kai Chou, Smashing Mag 2025).
- All `computeBadges(catStats)` callers updated to pass `qStats` so the coverage path activates: `renderLearnerMedals`, `renderCatGrid`, `renderBadgeShelf`, per-player Family card.

For Artem specifically, the audit produced 1 new gold (Comparisons — 100% on a 30-question cat now passes via 100% coverage) and 1 new silver (Passive Voice — 28-question cat, full coverage). 24 existing badges silently roll over to persisted state on first run; subsequent quizzes only celebrate genuine upgrades.

Verified end-to-end in Claude Preview: `node --check` passes, schema lint + transform-keyword lint clean, no console errors. Tab bar hidden on home, visible on Stats/Family/Coach (5 player rows in family-levels-strip, e.g. *"Comfortable C1 · 73% · 1827 Qs · Phrasal Verbs"*). Medal panel shows exactly 1 pill when 3 are passed in. Second `checkNewBadges()` call returns 0 announcements (persistence working).

Q count: 1988 (unchanged) · Version: v20260505-t1r4

---

## 2026-05-05 · Session t1
### v20260505-t1r3 — One UI: learner shell for all + Coach merge + Family redesign

Big consolidation pass — collapses two redundant UI shells into one and rebuilds the social/motivation surface around it.

- **Quiz fixes from today's mistake review** (`index.html`, `ALL_QUESTIONS`):
  - `tf_27` (transform, B2): exp now names *was three months ago* as the simple-past anchor and calls out the RU calque *last time I have seen*.
  - `tm01` (multi, B2): added *Since this morning,* lead-in to force present perfect via since+duration; exp unified for blanks 1–2.
  - `mc07` (multi, B2): dropped ambiguous blank 4 (3 blanks now); *investors* embedded in stem since the company-specific framing made "the investors" equally valid.
- **Single UI shell — `learner` for everyone.** `createPlayerData()` and the remote-doc merge default flipped from `'builder'` to `'learner'`; `players/artem.ui_shell` and `players/egor.ui_shell` patched in Firestore so all 5 players land on the same home. Builder code paths still alive but no longer reachable through normal navigation. Deletion of the builder shell deferred.
- **Exercises tab merged into Coach.** The 📝 Exercises tab is gone — its weekly-plan strip, history list, and stats grid now sit inside Coach below the picker. Both Coach picker and history hide together when a drill chat is active. The data layer was already unified (all reads from `players/{name}/exercises`); this collapses the UI to match. `tab-exercises` markup deleted, `showTab()` updated, `coachOpenTab()` calls `exLoadHistory()`.
- **Quiz batch for Artem 10 → 20.** `QUIZ_COUNT_BY_PLAYER.artem = 20` so the Quiz button on the landing page surfaces a 20-Q session, matching what he had in builder.
- **Family-tab redesign — co-op zone + rotating medal axis.** Web research (Yu-kai Chou on relative leaderboards, Duolingo Friends Quests, JMIR on rank-comparison anxiety) drove the rebuild:
  - Top: `family-coop` zone — collective weekly sessions, lifetime questions, longest active streak, and a 25-session weekly target bar.
  - Middle: rotating weekly medal axis (`getISOWeek(now) % 4`) — sessions / weekly accuracy / questions / categories. Banner names the metric; per-card third stat box flips to it; medals only awarded to players with a non-zero axis value. Stops the structural lock-in where Artem always won composite-score.
  - Cards: sparkline promoted out of "Details ▾" to default-visible; new personal-best pills (longest streak ever, best-session %, this-week %).
  - Sync/Export tucked behind a ⚙️ `toggleFamilyAdmin()` toggle — admin tools off the main view.
  - Removed: `family-activity` strip and `fb-status-bar` (status bar hidden by default; setFbStatus still works, just unobtrusive).
- **Learner-home cleanup.** Dropped Practising-today, Last-time, and Family-levels zones. Medals zone moved above Family-streaks zone so the call-to-action is visible without scrolling. `renderLearnerFamilyBoards()` now tolerates a missing levels-table.
- **Stats fall-through for empty learning_path.** `renderStats()` checks whether learning_path has any active/mastered/coming entries — if all empty, falls through to the full builder stats view (hero + grid + coverage). Fixes the "View →" medals link landing on an empty active-window placeholder for Artem and Egor.

Verified end-to-end in Claude Preview: 1988 questions intact, `node --check` passes, schema lint + transform-keyword lint clean, no console errors. Coach tab renders picker + history together; Family tab renders co-op headline, medal axis banner, 5 axis-ranked cards with sparklines and personal-best pills; home zones show Medals → Family streaks; Medals "View →" lands on the full builder stats.

Q count: 1988 (unchanged) · Version: v20260505-t1r3

---

## 2026-05-05 · Session t1
### v20260505-t1r2 — Silent CEFR grading for Free Write

Same-session rebuild on top of t1. Closes the assessment-blind gap for Free Write — the largest unscored surface — by extending the existing wrap pass to also emit an IELTS/CEFR-rubric assessment, then folding it into the player's `lvlStats` so it contributes to their proficiency phase. Player never sees a score; the signal is silent and statistical.

- **Worker** (`worker/index.js`): `sessionEndInstructions` for `free_write` extended to include `assessment: { estimated_level, sentence_count, error_count, confidence }` in the `<session_meta>` JSON block. Grading prompt anchored on IELTS/CEFR criteria with grammar gating the level. **Requires `wrangler deploy` of the worker for PWA Free Writes to emit the new field.**
- **PWA** (`index.html`): new `coachFoldFreeWriteAssessment(a, sessionId)` helper called from the Free Write finalize path. Confidence gate (skip `'low'`), sentence floor (skip `<3`), per-session cap (`min(sentence_count, 20)`), idempotent via `aggregated_coach_sessions` map on the player root. `saveData` triggers debounced sync.
- **CC parity** (`tools/log_coach_session.js`): validates the new field, applies the same fold via `applyAssessmentFold(player, sessionId, assessment)` after writing the session log.
- **`free-write` SKILL.md**: schema block extended with the `assessment` object + 1-line rule that grading is silent and folded server-side. Word count 685→747.
- **References**: `firestore-schema.md` documents `aggregated_coach_sessions` (idempotency map) and the `assessment` field on `coach_sessions` docs.

No profile cap (per Artem's call) — recognition/production gap argues for honest grading; AI variance smooths via per-session cap and confidence gate. No user-visible score. Forward-only; existing transcripts can be regraded later via a backfill if needed.

Verified in preview against 5 cases (high/n=14, low conf, n=2 floor, n=50 cap, duplicate id idempotency) — all behave correctly. Test pollution cleaned up before debounced sync fired.

Q count: 1988 (unchanged) · Version: v20260505-t1r2

---

## 2026-05-05 · Session t1
### v20260505-t1 — Unified streak + Coach stats fold + mastery phases on landing

Big plumbing session. Several long-standing structural mismatches fixed in one go.

- **Option D — unified daily streak across surfaces.** Pre-fix only the Quiz play loop bumped `lastPlayedDate` / `currentStreak` / `longestStreak`; Coach drills and Free Write writes left the parent-doc streak fields stale. Anna's 5-day Coach burst showed her as "Dormant 14 days" on the Family tab. New `bumpDailyStreak(d)` (idempotent first-of-day) shared by Quiz, Coach upsert, Free Write log, `tools/log_exercise.js`, `tools/log_coach_session.js`. Web-research-backed (Krashen/Swain pedagogy + gamification literature on multi-streak burnout) — separate exercise types, single habit signal. `effectiveStreak(lp, cs)` projects the stored value to 0 once last play falls out of today/yesterday window.
- **Coach + CC stats unification.** Pure helpers `aggregateExerciseDelta` + `applyDeltaToStats` in `tools/_firestore.js`. `log_exercise.js` and Coach Tab `coachUpsertSession` now fold per-item activity into `qStats / catStats / lvlStats / totalAnswered / totalCorrect`. Idempotency tracked via `aggregated_exercises: { ts: items_through }` map on the player root (exercises subcoll is write-once per `firestore.rules`). `tools/backfill_coach_to_quiz_stats.js` handles historical rows with the same dedup map. Backfill folded 248 items for Artem, 107 for Anna, 7 for Ernest; revealed Anna's true B2 accuracy at 45% (was 51% on quiz-only data).
- **Mastery phases on learner home.** `dominantBandPhase(lvlStats)`: cascade ceiling (highest level with seen ≥ 30 + accuracy ≥ 60%) gives the band; phase from accuracy (Settling 60–69 / Comfortable 70–79 / Solid 80+). Three monotonically positive phases. The earlier "Reaching" name (test variant) was abandoned for sounding worse than "Comfortable".
- **Family streaks + Family levels boards** on `tab-home`. Streaks: all 5, sorted streak DESC + recency tie-break, "Yesterday" / "Nd ago" within 7 days only (older = "—"). Levels: all 5, sorted CEFR DESC then phase DESC then accuracy DESC. Subtitle compressed to one line: `Comfortable C1 · 74% · 🔥 8`.
- **Backfill streak history.** `tools/backfill_streaks.js` with incremental and `--full` modes. The `--full` pass replays `bumpDailyStreak` rule across qStats lastSeen + recentSessions + exercises + coach_sessions; restored Artem's true 8-day streak (was 2 because pre-Option-D Coach Sunday broke the chain).
- **particle_sort answer-leak fix.** `coachCleanParticleMeaning` strips the `^{base_verb} {correct_particle} —` prefix from the authored `meaning` field — currently leaking the answer to every player. Render-side fix for live data; source files in `library_drafts/` cleaned for next push.
- **PV trackers.** 15 London-Brit-Bahrain expat-speech PVs added to Artem (catch up, crack on, head off/out/back, top up, knock off, wrap up, pop in/out/round/over, chill out, drop off, get on with, kick off, pack in/up, push back, run by, wind up). 8 of the 15 (A1–B1 in scope) added to Anna's tracker.
- **Audit**: confirmed no other Coach exercise type leaks the answer pre-submit (translation/spelling_drill/article_drill/error_correction all clean; russian_trap UI is disabled).
- **References updated**: `firestore-schema.md` (writer columns, `aggregated_exercises`), `design-decisions.md` (Option D entry with rationale), `stats-review` SKILL (post-Option-D filtering cheat-sheet).

Validated via Claude Preview: all helpers resolve, family boards render correctly, version badge reads `v20260505-t1`, zero console errors.

Q count: 1988 (unchanged) · Version: v20260505-t1

---

## 2026-05-04 · Session t1
### v20260504-t1 — Routing-audit fixes: recency rotation + cooldown + per-player COUNT

First run of the new `routing-audit` skill (cherry-picked from a remote branch earlier today). Targets Anna's "same exercises again and again" complaint at both layers — which Coach type gets surfaced on Practice press, and which items show up inside a type — plus per-player Quiz size mismatches found in the audit.

- **Recency-rotated Practice picker** (`homeStartPractice` Step 5): replaces the first-with-content `COACH_PRIORITY` walk that pinned Anna to Translation forever. Now pulls every type the player has content for, sorts by oldest last-completion ts (never-done first), starts the least-recently-done one. Tie-break = original COACH_PRIORITY order. Two new helpers: `coachListLastCompletionTs`, `coachListRecentCorrectIds`.
- **7-day item cooldown** inside `coachStartType`: hides items the player solved correctly in the last week, falls back to the full pool if filtering would leave fewer than 3 items. Cycles items back after a week — fresh material first, no items dropped permanently.
- **Per-player Quiz COUNT** (`QUIZ_COUNT_BY_PLAYER`): anna 10 / nicole 20 / ernest 20 / default 10. Their median completed quiz total is 20 (n=10 / n=8); the hardcoded 10 was ending their sessions early. `lh-quiz-hint` copy now reads from `quizCountFor(currentPlayer)`.
- **Partial-resume floor** (`PARTIAL_RESUME_MIN_TOTAL = 3`): `homeFindPartialTranslation` no longer auto-resumes 1/15 stubs from abandoned sessions.
- **Per-player Free Write soft-turn cap** (`COACH_FW_SOFT_TURN_CAP_BY_PLAYER`): ernest=12 (his FW turn distribution [2,4,8,12] hit the default 8 right at his typical session length).
- **Anna spelling_drill cap 16→10** via `COACH_PLANNED_TOTAL_OVERRIDES`: 3 of 4 runs partial — planned_total was over her stamina.
- **Firestore — Anna `learning_path`**: dropped Articles (62%, flagged for deprioritisation in the 2026-04-30 observation); now 4 cats / window 4, matching the design-doc target. An earlier audit proposal had broadened her window; rolled back after Artem flagged it conflicted with the active-window-narrowing model.

Russian-trap engine + picker enable deferred — 14 items exist but no Coach engine wired; tracked as a follow-up task.

Validated via Claude Preview (preview_eval): all new constants/helpers loaded, no console errors, version badge reads `v20260504-t1`.

Q count: 1988 (unchanged) · Version: v20260504-t1

---

## 2026-05-03 · Session t8
### v20260503-t8 — PV tracker + 🏆 graduation rule + Artem foundation drills

End-to-end PV mastery scaffold for Artem. New per-PV tracker, super-rank concept, drills based on a live cold-production test, and tooling to compute streaks.

- **`progress/` folder** added — separate from `references/` (Claude's KB). New canonical doc `progress/phrasal-verbs-tracker.md`: full A1–C1 PV inventory (148 PV-meanings) with Status, Freq (★★★★★ → ★ derived from CEFR + business-exec context), Quiz coverage, Notes. Single master table sorted Freq DESC then alphabetical so lagging high-priority items surface immediately.
- **🏆 super-rank** — new graduation rule on top of 🟢: ≥3 cold-production wins across ≥2 distinct formats, no failure during streak. Decay on failure only (no time-decay). Tier 1 evidence = unprompted PV use in free-write; tiers 2–3 = russian_trap and translation drills. Quiz `gap`/`mcq`/`particle_sort` excluded — recognition, not production.
- **A1–A2 production test** run live with Artem (10 prompts cold). Result: 7/10 PV-correct. Three A2 PVs flagged ⚠ A2 production-weak: *go on* (substituted with non-PV "happening"), *look for* (confused with *look after*), *go back/come back* (direction trap). All three got dedicated drill items.
- **Quiz amendments × 4** in `index.html`: `pv_a01_get_across_g` (gap-scaffold for chronic input), `pv_a02_turn_down_split` (split-form gap with turn off/away/over distractors), `pv_a03_turn_out_disambig` (turn out vs up/in/over), `pv_a04_follow_up_on` (preposition gap). Inserted right after `pv13` (the chronic get_across input). Targets the 5 chronic ★★★★★ PVs the existing Phase 1 plan didn't cover.
- **Exercise library × 5** authored and pushed to Firestore via `push_library.js`: `artem_translation_b01-b03.json` (3 items targeting the 3 weak A2 PVs from the test) + `artem_russian_trap_b01-b02.json` (2 items locking the look_for ↔ look_after pair from both directions). Live in `exercises_library/{translation,russian_trap}/items/`.
- **Worker prompt extended** (`worker/index.js`) — `sessionEndInstructions(mode, ctx)` now player-aware. Artem-only Free Write sessions get an extra `pvs_used_correctly: ["..."]` field in `<session_meta>` schema. **Not yet deployed** — needs `wrangler deploy` from `worker/` separately.
- **Coach tab write** (`index.html`) — `coachWriteSessionLogStandalone` now persists `pvs_used_correctly` to `players/{name}/coach_sessions/{id}`. One-line addition.
- **`tools/pv_cold_streak.js`** (new, 326 lines) — computes per-PV streak from `coach_sessions[].pvs_used_correctly` + `exercises[].items[]` (translation + russian_trap). Output: sorted table (graduated → building → regressing → unstable) or single-PV deep-dive with event timeline. Use during stats-review.
- **Free-write SKILL** updated: silently track PVs Artem produces unprompted; log in `pvs_used_correctly` at session end. Register-rewrite paragraph compressed by ~75 words to make budget. Reads `progress/phrasal-verbs-tracker.md`.
- **Stats-review SKILL** updated to read the tracker; refresh protocol step 2 now references the streak script.
- **Schema doc** (`references/firestore-schema.md`) — added `pvs_used_correctly` row to `coach_sessions` field table (writer: free-write skill + Coach tab Artem-only).
- **CLAUDE.md** — new "Progress trackers" section above Skills, points to `progress/phrasal-verbs-tracker.md` (refreshed at stats-review).

Q count: 1988 (+4) · Version: v20260503-t8

Worker change ships separately via `wrangler deploy` — until then, only CC-side free-write feeds the streak counter.

---

## 2026-05-03 · Anna PV scaffold (no version bump)

Doc + library + worker source changes following the stats-review for Anna's PV tracker. Sister piece to today's t8 deploy (which built the Artem PV tracker + 🏆 graduation rule).

- New `progress/phrasal-verbs-tracker-anna.md` — A1–B1 inventory (69 PVs), sorted by Freq DESC for Anna's family/Bahrain context. 5 rows populated from her current quiz qStats (turn on, get up, get over, break down all ⚪ at n=1; look up 🟠 at n=2). *come across* (B2, 0/3) flagged as out-of-scope chronic. Stats observations capture her 4% PV-bank engagement and 4 deferred candidate adds.
- `get into` (★★★, n=2 baseline) and `put off` (★★★★, n=1 baseline) added to the Anna tracker based on touched-but-not-listed observation.
- 8 translation drills (`anna_translation_pv_b01-b08`) + 4 russian_trap drills (`anna_russian_trap_pv_b01-b04`) authored, targeting her ★★★★★ tier (find out, pick up, take out, turn off, put on, get up, hurry up, look for) and the look_for/look_after pair confusion. Pushed to `exercises_library/`.
- Worker `sessionEndInstructions` no longer Artem-gated — `pvs_used_correctly` emitted for all 4 players. Anna/Nicole/Ernest PWA Free Write sessions now feed the streak counter. Worker version `85bab1dd` live on Cloudflare. Smoke-tested with Anna context (6 PVs picked up correctly, response in Russian per her `coach_language`).
- `tools/log_coach_session.js` passes through `pvs_used_correctly` for CC-side parity.
- `CLAUDE.md` + stats-review SKILL reference both trackers.

Q count: 1988 (unchanged) · No deploy of `index.html` / `sw.js`. Worker shipped via `wrangler deploy`.

---

## 2026-05-03 · Library content — Anna russian_trap + spelling_drill expansion (no version bump)

Stats-review-driven content batch for Anna. No engine change, content-only.

- **russian_trap × 8** (`rt_anna_b01-b08`) — first items in this type for any player. Seeded by today's stats-review L1 calque cluster (4–5 sessions in last 7d): wait_for, listen_to, depend_on (preposition swaps), make_decision/do_homework (verb-noun collocations), on_last_week / on_next_week / in_a_week (time prepositions). Each item carries 2+ regex `common_errors`, explicit `calque_trap` field labelling the L1→L2 transfer mechanism, and short isolated prompts (3–6 words target) — different modality from translation drill which uses fuller sentences with context. Three of these surface forms (wait_for, listen_to, depend_on) already had translation items (tr_anna_b01-b03) and re-fired in stats anyway → russian_trap is the active-recall second exposure.
- **spelling_drill +6 items** (`sp_anna_b11-b16`) — necessary, different, interesting, restaurant, favourite, comfortable. Sources: predicted L1 traps (Anna's `players/anna/spelling_log` is empty — Spell Help has not been used yet; switch sourcing once captures land). Brings Anna's spelling_drill total from 10 → 16, into the §4.5 plan target band of 15–20.
- **Coverage now**: Anna translation 20, spelling_drill 16, article_drill 15, russian_trap 8. `_meta.last_authored: 2026-05-03T10:53:22Z`.
- Drafts kept at `library_drafts/anna_russian_trap_b01-b08.json` and `library_drafts/anna_spelling_drill_b11-b16.json` for re-push or audit.

Q count (quiz bank): 1,984 (unchanged) · No deploy.

---

## 2026-05-03 · Session t7
### v20260503-t7 — Hard-remove deeplinks + data-flow doc

Cleanup pass after the 2026-05-02 Nicole contamination postmortem.

- Hard-removed all four deeplink paths (`?exlog=`, `?exstart=`, `?exupd=`, `?exfin=`) from `index.html` — handlers, helpers, toast, and `_exlogMode` branch all gone (~187 lines). `exercise_active` collection now unused; Firestore rule for it removed.
- Deleted `references/deeplink-schema.md`. Routing entry removed from `CLAUDE.md`. Secondary mentions cleaned in `README_FIRST.md`, `references/exercise-types.md`, `tools/README.md`.
- `references/firestore-schema.md` reorganised: writer/reader columns added on every field group; `exercise_active` section removed; `coach_sessions` section added.
- New `docs/data-flow.md` — surface inventory + 5 Mermaid sequence diagrams (incl. the shared-device contamination flow) + pre-redesign checklist. Referenced from a new line in `references/operational-rules.md`.
- `plans/schema-alignment-plan.md` rewritten: 5 tracks → 3 (deeplink alignment dropped from scope).
- `plans/data-integrity-plan.md` moved out of `references/` (lifecycle: it's a plan, not operational KB).

Live PWA loaded clean post-deploy: version badge `v20260503-t7`, no console errors, `exStartActive` / `exFinalize` / `exDeeplinkToast` / `exCleanupStale` all `undefined`.

`firestore.rules` change is committed but not yet deployed — needs `firebase deploy --only firestore:rules` separately. **Update**: deployed by Artem later in the session.

Q count: 1,984 (unchanged) · Version: v20260503-t7

### Session t7 follow-ups (no version bump — tooling/docs only)

Nine commits after the deploy, all tooling and discipline:

- **Daily Firestore backup pipeline (data-integrity P0)**. New `tools/backup_players.js` snapshots each player's doc + `exercises` + `coach_sessions` subcollections to `backups/YYYY-MM-DD/{player}.json`. `.github/workflows/backup.yml` switched from weekly to daily, points at the new script. Snapshots commit to the orphan `backups` branch (separate from main, not Pages-served). First snapshot pushed via manual trigger; cron fires 03:00 UTC daily. RTDB sunset (~2026-05-28) was the deadline.
- **Schema-alignment Tracks 1+2+3.** `firestore-schema.md` now defines the canonical rich shape for `players/{name}/exercises/{ts}` (per-item `items[]`, `tta_stats`, `auto_suspected`, `matched_pattern_id`). `tools/log_exercise.js` accepts `items[]` with per-item validation, computes integrity flags at write time, defaults `source: cc_session`. `exercise-session/SKILL.md` directs CC to populate the same fields PWA Coach tab does (no asymmetry).
- **Write-path defense (P2).** `tools/_firestore.js` `fsSet` now refuses player-root replaces unless explicitly opted in (`opts.allowPlayerReplace` or `ALLOW_PLAYER_REPLACE=1`). The 2026-05-02 contamination was a full-document replace; this guard catches that vector for any future tools/ caller.
- **`get_all_players.js -S` flag** for stats review — fetches `exercises` and `coach_sessions` subcollections alongside player docs, surfaces `auto_suspected` and `tta_mean` in default summary so dubious sessions are visible at a glance. `stats-review` SKILL canonical command updated.
- **Profile rule cherry-picked from a remote CC exercise session** (`5b54803`): Artem stems use operational/hallway register, not pitch-deck.
- **`exercise-session` SKILL fetches `coach_notes` only**, not the full player doc (~150 KB qStats blew past the remote CC tool-output buffer). One-line fix.
- **`exercise-session/SKILL.md` slimmed back under 600w cap** after the Track-1 expansion pushed it to 629w (CI failed; rich-shape JSON example moved to firestore-schema.md, SKILL retains capture rules only).
- **Nicole's player doc restored** from the still-live RTDB (frozen since 2026-04-28 per s87). Contaminated Firestore values wiped, RTDB baseline (780 answered, 480 correct, 39 sessions, 481 qids) merged with the genuine 2026-05-02 session on top. `coach_notes` was preserved through contamination because it's only written by `update_coach_notes.js`, not the play loop.

---

## 2026-05-01 · Session 91
### v20260501-s91 — Phase 2C: Free Write + Escalate live AI

End of Phase 2C build. The Coach tab now has live-AI tutoring for the family path: Free Write conversation with Sonnet 4.6, and one-shot Escalate ("Hmm, explain more") with Opus 4.7 on top of any pre-generated wrong-answer feedback. Both modes proxy through the Cloudflare Worker shipped earlier today (`https://english-quiz-coach.artem2030.workers.dev`); the API key never enters the PWA bundle or Firestore.

**PWA additions (`index.html`):**

- Free Write button enabled in the picker (was greyed "soon"). Click → bundled starter prompt → multi-turn chat with the Worker → "✓ End session" finalises with `is_session_end:true`, parses `<session_meta>` JSON, writes `players/{name}/coach_sessions/{session_id}` per §6.4, and merges `error_patterns_observed` into `coach_notes.weak_patterns` with a `(coach_session)` tag and FIFO cap at 8.
- Escalate button on every wrong-answer translation feedback. One-shot: tap → typing indicator → Opus 4.7 deeper explanation as a follow-up assistant message → action row collapses to "Got it — next" only (no second escalate per §8.5). The current item's result gets `escalation_used: true` (already in the per-item upsert from s90r2). A separate `coach_sessions` doc is written with `mode: "escalate"`, the exercise reference, and the patterns observed.
- Worker call helper with §8.8 failure handling: API_402 disables Free Write/Escalate buttons globally for the rest of the tab session ("Live Coach unavailable — using offline mode"); 5xx gets one retry with backoff; offline disables live AI and shows "offline" on the button; missing Worker URL hides live AI entirely.
- Soft 20-turn cap on Free Write per §8.6 ("We've covered a lot — wrap up?" nudge after turn 20).
- Coach reply rendering: minimal Markdown→HTML (bold, italics, bullets, inline code, blockquotes) so Sonnet/Opus formatting reads cleanly in the chat shell.
- Coach tab now reads `coach_notes` from Firestore at open time and sends `weak_patterns` + `engagement_notes` in every Worker payload as the system-prompt's "About this learner" section. Network state changes (`online`/`offline` events) flip live-AI availability live.

**Smoke-tested in local browser preview** (mocked Worker because CORS blocks `localhost`): full Free Write cycle including `coach_sessions` write + `coach_notes` merge + token tally; Escalate cycle including `escalation_used` flag, separate session log, action-row collapse. Test artefacts cleaned up before deploy.

Worker itself was end-to-end smoke-tested via curl earlier today against the real Anthropic API: free_write returned coherent past-simple feedback (~$0.005), escalate returned 3-pattern Opus breakdown (~$0.022). Total Worker smoke-test spend: ~$0.027.

**Cache observation worth noting**: the current free_write system preamble is ~400 tokens, below Sonnet 4.6's 2048-token minimum cacheable prefix, so the `cache_control` marker is a silent no-op until `coach_notes` data grows. Documented in `worker/README.md`.

Q count: 1,882 (unchanged) · Version: v20260501-s91

---

## 2026-04-30 · Session 90r2
### v20260430-s90r2 — Coach tab: per-item save + article tolerance

Two engine fixes driven by Anna's first real Coach session
(`players/anna/exercises/1777566265897`, raw 1/15 with ~5–7 false negatives from typos and article drops):

- **Per-item Firestore upsert**: every `coachSubmitAnswer` now writes the running session to `players/{name}/exercises/{sessionTs}` with `partial: true`. `coachFinishSession` flips it to `partial: false` at the end. Same doc id reused throughout, so partials survive a closed tab / reload / kicked SW. New `planned_total` field captures the intended item count even on partial saves.
- **Article-tolerant normalize**: `coachNormalize` now strips `a/an/the` before equality comparison. Anna's L1 article-drop was producing false negatives on otherwise-correct answers ("We arrived at court" vs the canonical "We arrived at THE court"). Trade-off — losing definite/indefinite scoring — is intentional for MVP. Pattern-feedback regexes still see the original text so article-specific traps still fire.

Deferred to follow-up: Levenshtein typo tolerance, regex tightening on `jump_in_car_to`/`wait_no_for`, and the bigger ask — replacing the v1 B2 prompts with shorter B1 prompts. Anna's `coach_notes.recent_observations` updated with the session log.

Q count: 1,882 (unchanged) · Version: v20260430-s90r2

---

## 2026-04-30 · Session 90
### v20260430-s90 — Coach tab MVP + Phase 2 docs + Anna translation library

**Coach tab (Phase 2B MVP)** — new 5th tab "🎯 Coach" with stats card (last session, top weak spot, available count), exercise type picker (Translation enabled, others greyed for now, Free Write disabled until 2C), chat-style message renderer, scoring engine (`coachNormalize` + `coachIsMatch` + regex pattern matcher with fallback). Pre-generated translation drills run locally with rich per-pattern feedback — no API call. Reads exercises from `exercises_library/translation/items` filtered by player. Writes session summary to `players/{name}/exercises/{ts}` with `source: 'coach_tab'` and per-item `submitted_answer / matched_pattern_id / escalation_used / time_to_answer_ms`.

**Question bank** — `gi_b04` filled the missing slot in the G&I gerund series (practise + gerund, input type with bracketed complement). `wf_41`–`wf_49` added as `type: 'input'` Word Formation questions covering develop/educate/inform/produce/govern/tradition/expect/understand/convince — first input-type entries in this category, lifts share off literal 0%.

**Phase 2 doc** — new `references/phase2-coach-tab.md` consolidates the full Phase 2 design (Coach tab + Cloudflare Worker proxy schema + library schema + build sequence + parallel tiers + SKILL.md update spec). Locked decisions captured. Predecessor `PHASE2_PLAN.md` superseded.

**Infra** — Firestore security rules checked into the repo (`firestore.rules` + `firebase.json` + `.firebaserc`). Added permissive blocks for `exercises_library/{document=**}` and `players/{name}/coach_sessions/{sessionId}` (same open-write posture as existing `players/exercises`, mitigated by prepaid API ceiling + Anonymous Auth deferred to Phase 3D). New `tools/push_library.js` validates draft schema (common + per-type + ≥3 answers, ≥2 errors, regex compile) and uploads to `exercises_library/{type}/items/{id}` with idempotent meta updates.

**Library** — Anna's first 15 translation exercises drafted to `library_drafts/anna_translation_001-015.json` and pushed live to Firestore. Distribution targets her measured weak_patterns (Grammar mechanics, Vocabulary production, Collocations, Everyday English idioms) plus 4 prepositions per profile-design-intent.

**Skill update** — `skills/exercise-session/SKILL.md` realigned with Phase 2 design: path-specific behaviour (family vs Artem CC), Coach tab note added under "When not to run", logging strategy decision tree replaced.

Smoke-tested locally as Anna: full translation cycle (correct + regex-matched wrong + fallback) including Firestore write of summary; test record cleaned up after.

Q count: 1,882 (+10) · Version: v20260430-s90

---

## 2026-04-29 · Session 89r3
### v20260429-s89r3 — Transform keyword-mask fixes + new pre-deploy audit

- Fixed `emph_i02` (Emphasis): keyword `WHO` was not contained in any accepted `ans` variant → validator blocked every submission. Restructured stem (`It ___ most surprised.`) so the answer must produce `who`.
- Fixed `tf_16` (Comparisons): `cleverest student` variant was unreachable under keyword `MOST`. Source changed to use `intelligent` (multi-syllable, unambiguously requires analytical superlative).
- New `tools/check_transform_keywords.js` enforces two rules on all transforms: every accepted variant must contain the keyword (Rule 1), and the keyword must not appear in the stem (Rule 2 / s86 anti-pattern). ~50ms on full bank.
- Pre-deploy checklist gains Step 2c — runs the new audit unconditionally.

Q count: 1,872 (unchanged) · Version: v20260429-s89r3

---

## 2026-04-29 · Session 89r2
### v20260429-s89r2 — Multi-blank Next-button bug fix + skill improvements

- Fixed `answerMultiBlank` ReferenceError that broke every multi-blank submission since s80r2 (April 1) — bare `allCorrect` → `multiState.allCorrect`
- Symptom (Next button stuck disabled) was identical to s84r4's mobile double-tap bug; root cause was different. Both now documented in `bug-log.md`.
- `pre-deploy-checklist.md` § 9 now mandates a multi-blank end-to-end smoke test
- Skills updated post-session 89: `stats-review` mandates per-question mistake audit + speculation tagging; `quiz-development` requires evidence/confirmation columns; `question-authoring-standards.md` adds the "stem sufficiency test"; new helper `tools/get_question_mistakes.js`
- Confirmed in local preview before push: both all-correct and partial-wrong paths enable Next correctly; `lastWrong` persists as expected

Q count: 1,872 (unchanged) · Version: v20260429-s89r2

---

## 2026-04-29 · Session 89
### v20260429-s89 — Stuck-question fixes from stats review

- Stats review (5 players, all coach_notes empty) flagged 4 high-confidence question issues
- `pv_c03`: accept `pick up` variant — Artem's logged repeat error matched
- `pv_c07`: accept `bring in` variant — Artem typed it 4× ("introduce" reading is also valid for the policy stem)
- `emph_i01`: stem reframed with present-tense lead-in (`I'm genuinely shocked.`) to disambiguate `have I seen` vs `had I seen`
- `inv03`: exp strengthened with `no sooner…than` / `hardly…when` memorise-pair (Artem 0/3, picks "when" trap)
- Lower-evidence items (qf03/qf06/qf07, co_ti03, gr_b01, gr_b15, pv_ti71) deferred — MCQ option text not stored, need richer mistake logging first
- Audit method: cross-referenced `qStats[id].lastWrong` against authoring standards instead of speculating

Q count: 1,872 (unchanged) · Version: v20260429-s89

---

## 2026-04-29 · Session 88
### Phase 1 — Repo restructure for Claude Code

- New repo structure: skills + references markdown + short root CLAUDE.md
- HTML KB deprecated as source of truth; kept in `archive/` for human reading
- coach_notes Firestore field added (bootstrap script in `migration/`)
- Two-layer memory architecture: GitHub repo (stable) + Firestore (dynamic)
- Auto-memory disabled (incompatible with mobile-first workflow)
- Deploy.html flow removed; direct git push from Claude Code
- Phase 2 (Coach tab + Cloudflare Worker) deferred

Q count: 1,872 (unchanged) · Version: v20260429-s88

---

## 2026-04-28 · Session 87
### v20260428-s87 — RTDB → Firestore migration. Stage 1 live exercise log added.

- Database migrated RTDB → Firestore. RTDB frozen as 30-day rollback insurance
- Schema split: `players/{name}` + `players/{name}/exercises/{ts}` + `exercise_active/{session_id}`
- Security: open writes (same posture as RTDB). Anonymous Auth deferred.
- Stage 1 live log: per-item updates via `?exupd=` deeplinks, finalize via `?exfin=`
- PWA Firestore client: `_fsValue/_fsFromValue` typed-value converters and `fsGet/fsSet/fsMerge/fsDelete/fsList` helpers
- Bug found and fixed: migration_script.js had wrong PLAYER_TOP_FIELDS list — only migrated emoji/pin/name. Re-ran after fix.

Q count: 1,872 (unchanged) · Version: v20260428-s87

---

## Earlier sessions (pre-s87)

S86 and earlier are archived in `references/archive/version-log-pre-s87.md`. Cut at the RTDB → Firestore migration. Highlights:

- **S86**: Emphasis category audit, tf_32 keyword-in-stem bug
- **S85**: Article Decision Drill + slot expansions
- **S84**: Article pattern-specific L1 notes; discourse-stem rule for B2+
- **S82**: Firebase questions migration rolled back (s78 → s82)
- **S77–78**: ALL_QUESTIONS moved to RTDB, later rolled back
- **S76**: Spaced repetition with interval scaling
- **S70**: Transform + Wordform types added
- **S63**: Per-question authoring checklist enforced

For full detail see `references/archive/version-log-pre-s87.md` or the archived HTML KB at `archive/quiz_knowledge_base_v20260428-s87.html`.

---

## How to add an entry

After a session that ships:

1. Add new entry at the top with date, session number, version, headline
2. 3-5 bullets max. Major bugs found+fixed, design decisions, q count change
3. Update the "Current state" callout in source archive HTML if regenerating it
4. Move detailed bug content to `bug-log.md`
5. Move detailed design rationale to `design-decisions.md`

This file is the timeline. Bug log, design decisions, and roadmap are the topical
references.
