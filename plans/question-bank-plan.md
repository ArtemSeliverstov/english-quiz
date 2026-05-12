# Question Bank Plan

**Status**: active
**Scope**: all content authoring + bank quality work for the english-quiz bank.

Consolidates the May 2026 wave plan with content workstreams (PV ladder, article intervention, quiz orthography, Coach library) and bank quality audits previously filed under the Phase 2D build plan.

This plan supersedes `references/coverage-matrix.md` Phase-1 priorities and `references/roadmap.md` Phase-1 Content priorities for the duration of these waves. The audits (`audits/audit-2026-05-08.md`, `audits/audit-topics-2026-05-08.md`) remain the authoritative coverage data.

---

## Contents

1. Foundations — two-track target system, relaxed relevance, player priority
2. Waves — per-player quiz authoring batches (0, 0f, 0g, 1, 2, 3, 4, 5)
3. Workstreams — focused multi-batch programs (PV ladder, article intervention, quiz orthography)
4. Coach library content — per-player Coach tab exercises
5. Bank quality audits — MCQ distractor audit, Everyday Idioms re-engineering
6. Tier priorities — cross-cutting ordering (Tier 2/3/4)
7. Schema/UI fixes, totals, open questions, status log

---

## 1. Foundations

### 1.1 End goal

Every player has at least adequate practice volume in every topic relevant to their level — measured by the two-track target system — so that the question bank serves the learning ladder without per-player blind spots.

### 1.2 Two-track target system (adopted 2026-05-08)

| Track | Categories | Threshold | Why |
|---|---|---|---|
| **A. Open-class** (each item = its own concept) | Vocabulary, Phrasal Verbs, Idioms, Collocations, Irregular Verbs, Word Formation, Natural English | Per-category variety floor: **≥40** for high-frequency (Vocabulary, PV); **≥15** for niche | Each item is one concept. Variety > depth. |
| **B. Structural** (closed sub-topic set) | All other categories | **≥8 unique items per major sub-topic** | Below 8, learners memorise the items rather than generalising the rule. With SR re-exposure (1d→2d→4d→7d→14d), 8 items × 4–5 cycles = 32–40 exposures per topic — clears the automaticity threshold (Walberg 2009). |

Plus the existing **≥20% input share per category per player** (production-vs-recognition target).

Major sub-topics for structural categories (the ones the per-topic floor applies to):

| Category | Major topics |
|---|---|
| Tenses | present simple, present continuous, present perfect, present perfect continuous, past simple, past continuous, past perfect, future forms (~8) |
| Articles | a/an first mention, the (shared knowledge), zero/uncountable, prep+art, fixed phrases (5) |
| Conditionals | zero, 1st, 2nd, 3rd, mixed (5) |
| Modal Verbs | can/could, must/have to, should/ought, may/might, would, past modals, needn't have (~7) |
| Reported Speech | statements, reported questions, reported commands, time/place shifts (4) |
| Used To | used to V, be used to Ving, get used to Ving (3) |
| Quantifiers | much/many, few/little, some/any, all/every, both/either/neither, plenty/lots (6) |
| Question Formation | yes/no, wh-, do-support, tag, subject vs object (5) |
| Indirect Questions | embedded statements, embedded yes/no, embedded wh- (3) |
| Relative Clauses | defining, non-defining, relative pronouns/preps, omission (4) |
| Passive Voice | basic be+pp, modal+passive, get-passive, causative have/get, by+agent (5) |
| Comparisons | comparative, superlative, as…as, double comparative (4) |
| Word Order | adverb position, basic SVO, inversion, fronting, cleft (5) |
| Adjectives | -ed/-ing pairs, position, order (3) |
| Emphasis | cleft, do-emphasis, fronting, inversion, intensifiers (5) |
| Linking Words | contrast, addition, cause/effect, condition, sequence, time (6) |
| Word Choice | each confusable pair (~10) |
| Prepositions | time, place, dependent, fixed phrases (4) |
| Gerunds & Infinitives | gerund-only, infinitive-only, both with meaning change, after preps, after adjectives (5) |

### 1.3 Relaxed relevance model (adopted 2026-05-08)

Themes were originally hard-filtering players from off-theme content. Per the 2026-05-08 review this was stricter than `family-profiles.md` actually required (which speaks to *authoring quality*, not *runtime routing*).

**New model**: themes are metadata for authoring targets, curated drills, and audit thematic-diversity reporting. Routing reduces to level + biz check:

| Player | Sees |
|---|---|
| Artem | All B1–C2 (biz allowed) |
| Anna | All B1+B2 where `biz: false` |
| Nicole | All B1 where `biz: false` |
| Ernest | All B1+B2 where `biz: false` |
| Egor | All B2+C1 (biz allowed) |

Effect on relevant-bank size: Anna/Ernest +34%, Nicole ~0, Egor +22%, Artem +15%. See `references/question-bank-taxonomy.md` §6.

### 1.4 Player priority order (per 2026-05-08 review)

1. **Nicole** — highest. Smallest relevant bank (584 strict / ~580 relaxed). B1 only. Multiple zero or near-zero categories at her level.
2. **Anna** — highest tied. Many input-share gaps in standard categories.
3. **Artem & Ernest** — middle. Coverage broadly adequate; refinement work.
4. **Egor** — lowest. Zero-cell gaps explicitly accepted (2026-05-08).

---

## 2. Waves — per-player quiz authoring

### 2.1 Wave 0 — Quick wins

| # | What | Status | Effort |
|---|---|---|---|
| 0a | Document `transform` and `wordform` types in `references/question-schema.md` | ✅ done 2026-05-08 | 15 min |
| 0b | Adopt relaxed relevance model — update taxonomy §6 + `tools/bank_audit.js` | ✅ done 2026-05-08 | 30 min |
| 0c | Grammar B1 migration — 125 items reclassified, Pronouns added as 28th category (40 items) | ✅ done 2026-05-08 | 1 session |
| 0d | biz-flag cleanup — 9 flips + 4 theme repairs | ✅ done 2026-05-08 | 1 session |
| 0e | Quantifiers input batch — 12 items, qt_i prefix | ✅ done 2026-05-08 | 1 session |
| **0f** | **Schema/data cleanup** — discovered during schema review post-0e (see below) | pending | ~1 session |
| **0g** | **Error-correction type addition** — new question type for Russian L1 patterns | pending | ~2 sessions |

### 2.2 Wave 0f — Schema/data cleanup

The schema review (visual verification of 18 sample questions across all 6 types in browser preview) found three real bugs and four documentation issues. Wave 0f closes them before Wave 1 authoring lands, so authors copy correct templates.

| # | What | Effort |
|---|---|---|
| 0f.1 | **Fix `wordform.base` for 40 items** — runtime reads `q.base` (line 5263) but no question has the field; all 40 render "Form a word from: undefined". Derive base from each (q, ans) pair (e.g., ans=decision → base=DECIDE). Sub-agent task. | 30 min |
| 0f.2 | **Document `hard` field** in `question-schema.md` common-fields table. 90 questions use it; runtime weights selection (line 5017). | 5 min |
| 0f.3 | **Strip `linked_question_ids` field** from 18 questions (`pv_l01_*` triplets). Field has zero runtime references — dead data. Decision: strip (2026-05-08). | 10 min |
| 0f.4 | **Fix schema doc nits** — change "27 categories" to "28" (Pronouns added), add `qt_i` prefix to ID conventions table, swap fabricated `transform` example for a real one (`tf_02` works), correct `wordform` example to use `base` not `root`. | 10 min |

### 2.3 Wave 0g — Error-correction type (Russian L1 focus)

Schema review identified the missing question type: **error correction**. Cambridge uses it across all CEFR levels; especially valuable for Russian L1 because it directly tests recognition of L1-interference errors (article drops, preposition swaps, tense aspect collapses) that `family-profiles.md` calls out as durable weak patterns.

**Lands before Wave 1** so Nicole/Anna/Ernest get error-correction items in their main batches, not as an afterthought.

#### Schema additions

New type `error_correction`. Type-specific fields:

| Field | Required | Meaning |
|---|---|---|
| `q` | yes | Stem with the L1-typical error embedded (e.g., "I am living here since 2018.") |
| `ans` | yes | Corrected sentence as string. Pipe-separated alternates allowed. |
| `error_type` | yes | Closed-set: `article` / `preposition` / `tense_aspect` / `verb_form` / `word_order` / `quantifier` / `pronoun` / `other` |
| `hint` | optional | One-line cue narrowing where to look |
| `exp` | yes | Standard exp + Russian L1 note required |

#### Renderer

New branch in `renderQ`. Type badge "FIND THE ERROR". Stem displayed prominently (no `___` blank — whole sentence is the prompt). Single text input for the corrected sentence. Answer matching: case-insensitive, whitespace-normalised, pipe-separated alternates supported (same as `input`).

#### Initial content batch — 12 items

Mapped 1:1 to L1-interference patterns from `family-profiles.md`:

| Pattern | error_type | Sample stem (with error) → corrected |
|---|---|---|
| Article drop (the for shared knowledge) | article | "Can you pass salt please?" → "Can you pass the salt please?" |
| Article drop (uncountable) | article | "She gave me an information yesterday." → "She gave me information yesterday." |
| Preposition swap (arrive to) | preposition | "We arrived to the airport at 6am." → "We arrived at the airport at 6am." |
| Preposition swap (waiting us) | preposition | "Mum was waiting us at the school gate." → "Mum was waiting for us at the school gate." |
| Present perfect → past simple collapse | tense_aspect | "I am living in Bahrain since 2019." → "I have been living in Bahrain since 2019." |
| since vs for | tense_aspect | "We've been here since five years." → "We've been here for five years." |
| Word order (adverb intensifier) | word_order | "I very much like padel." → "I like padel very much." |
| Word order (negative inversion) | word_order | "I never have seen such a film." → "I have never seen such a film." |
| Quantifier (much/many confusion) | quantifier | "There aren't much cars on the road today." → "There aren't many cars on the road today." |
| Pronoun (reflexive overuse) | pronoun | "She washed herself her hands." → "She washed her hands." |
| Verb form (make causative) | verb_form | "The teacher makes us to write essays." → "The teacher makes us write essays." |
| Conditional (mixed real/unreal) | tense_aspect | "If I would know, I would tell you." → "If I knew, I would tell you." |

All 12 at B1+B2, `biz: false`, themes per content (mostly home_daily / brit_expat).

#### Authoring rubric addition

Append to `question-authoring-standards.md`:
- Stem contains exactly one L1-typical error
- Error must be concrete, not stylistic
- `error_type` tag must match the actual error
- Pipe-separated `ans` alternates required when multiple corrections are valid
- L1 note in `exp` is required (Russian-specific)
- Don't introduce a SECOND error

### 2.4 Wave 1 — Nicole (B1, biz=false)

| Category | Topic / focus | Type mix | Count |
|---|---|---|---|
| Word Order | Adverb position + basic SVO + inversion intro | input + gap | 12 |
| Collocations B1 | Verb + noun pairs (make/do extended) | input + gap | 12 |
| Idioms B1 | Kid-appropriate set (idom_b series extension to B1) | input + gap | 12 |
| Used To B1 | All three forms × home_daily/brit_expat contexts | input | 8 |
| Indirect Questions B1 | Embedded statements + yes/no | input + gap | 8 |
| Quantifiers B1 | Sub-quantifier coverage (existing gap) | gap (variety) | 8 |

**Total: ~60 questions**. All B1, biz=false. Heavy on input.

Selection rationale: closes Nicole's zero cells (Collocations, Idioms) and the per-topic gaps the topic audit flagged at her level. Word Order is a high-priority structural fix that benefits everyone.

### 2.5 Wave 2 — Anna (B2, biz=false)

| Category | Topic / focus | Type mix | Count |
|---|---|---|---|
| Reported Speech | Reported questions + commands + time shifts | input | 10 |
| Linking Words | Contrast + cause/effect input | input | 8 |
| Idioms B2 | Existing roadmap Phase-1 #1 (was 15-q target; current 15) | input | 8 |
| Passive Voice B1+B2 | Get-passive + causative have/get | input + gap | 10 |
| Question Formation B2 | Wh- + tag question expansion | input | 8 |
| Adjectives | -ed/-ing pairs input + position B2 | input | 6 |

**Total: ~50 questions**. B1+B2, biz=false. Heavy on input.

### 2.6 Wave 3 — Ernest (B1+B2, biz=false)

Most of Wave 1 (Nicole's B1 batch) and Wave 2 (Anna's B2 batch) also serve Ernest. Specific Ernest additions:

- Easy-input scaffolding pass: review existing input questions and identify ~10 with simpler hints / clearer affordances. May be hint rewrites rather than new authoring.
- ~5 new B1 input items in Articles (his documented weak spot, recognition vs production gap).

**Total: ~10 new + scaffolding pass**

### 2.7 Wave 4 — Artem (refinement)

| Category | Topic / focus | Count |
|---|---|---|
| Used To | input items in Artem's biz_oil/leisure_sport contexts | 6 |
| Tenses | Past perfect continuous + present perfect continuous input (currently 11% input) | 10 |
| Vocabulary | Business register input (decisions, due diligence, escalations) | 8 |
| claude_collab | Mark territory: 8–10 items spanning the project register (drill caps, weak patterns, MCP, deploy, hooks). Tagged `claude_collab` plus appropriate level/cat. | 8 |

**Total: ~30 questions**. Heavy on input + first claude_collab content in the bank.

### 2.8 Wave 5 — Egor

**Skipped** per 2026-05-08 decision. Egor's zero cells (Natural English B2, Irregular Verbs B2/C1, Quantifiers B2/C1) accepted as gaps. Existing C1 vocab authoring continues per his profile — not a wave priority.

---

## 3. Workstreams — focused content programs

Multi-batch content programs that span waves. Authored alongside the waves; each has its own pedagogical structure (recognition → selection → production ladder) and per-player active-window gating.

### 3.1 PV ladder rebalance

Reshapes the planned Phrasal Verb authoring per the recognition-first analysis.

**Sourcing**: `phrasal_verbs_mastery_plan.html` in project knowledge stays as the canonical analytical reference (verb families, CEFR ladder, family diagnostic). This workstream reshapes the *authoring sequence and type mix*; the analytical content is unchanged.

**Revised Batch 1 + Batch 2 combined target** (~100 items total, replaces the original ~130 across the two batches):

| Rung | Format | Target count | Purpose |
|---|---|---|---|
| Receptive — meaning | MCQ "what does X mean here?" | ~25 | Anchor PV semantics in context |
| Receptive — particle | MCQ "which particle fits?" | ~20 | Build particle intuition |
| Selection | gap-fill | ~25 | Bridge to production |
| Production | input | ~15 | Test transfer, not foundation |
| Coach — particle_sort | library | ~15 | Receptive→productive bridge in chat form |

**Authoring sequence**:
1. First, the 6 stuck PVs from the Apr 30 transform session — for each, author 1 MCQ + 1 gap + 1 input with shared `linked_question_ids` so ladder-pair tracking works. ~18 items dedicated to ladder completion on the weakest cluster.
2. Then the remaining ~32 items skewed toward MCQ (~20 MCQ, ~8 gap, ~4 input) for the rest of the GET/BRING/TURN/SET/COME/TAKE family coverage.
3. Then Batch 2 verb families (give up, find out, sort out, work out, call off, figure out, point out, rule out, end up, take over) following the same ladder split.
4. Coach particle_sort items (~15) authored in parallel, targeting the same PV families.

**Active window implications**:
- Phrasal Verbs is **locked in Anna's active window** initially. Authored content sits in library; she does not encounter it. Eligible for unlock after prepositions consolidate (likely several months out).
- For Nicole, PV is not in initial active window. Authored content is similarly invisible to her until much later in her progression.
- For Ernest, PV may enter active window earlier depending on observed performance (his 6-category window has more room).
- For Artem and Egor, content surfaces as authored (open pool).

**Acceptance**:
- Total PV bank shape after rebalance: Recognition (MCQ) ~50, Selection (gap) ~120, Production (input) ~60. Approximate 5:12:6 ratio is the target; current 5:96:47 is the diagnosed problem.
- ~15 Coach particle_sort items authored and pushed to library.
- All new questions pass the standard build quality checklist.

### 3.2 Article intervention

The existing `article_diagnostic_2026-04-05.html` plan (~95 questions across three phases) folded into the active window model.

**Sourcing**: `article_diagnostic_2026-04-05.html` in project knowledge stays as the canonical analytical reference. This workstream adapts the *delivery cadence* and *active-window-awareness* of the original plan.

**Authoring sequence**:
- Verify the original plan's three phases map to receptive → selection → production. If they don't, CC restructures so they do. Same ladder principle as PV.
- Author in batches of ~25–30 questions, not all 95 at once. Matches Anna's consumption rate and prevents the everything-appears-at-once overload.
- First batch lands when active window plumbing is ready and Articles is in Anna's window.
- Subsequent batches land as Anna works through the prior batch.

**Coach article_drill content** (~15 items per family member):
- Schema in archived `references/archive/phase2-coach-tab.md` §6.1.2 (or current Coach exercise schemas in `learning-system-build.md` §6).
- For Anna: in her initial active window; ships with the first batch of quiz article additions.
- For Ernest: high priority because his profile flags articles as a recognition-vs-production gap.
- For Nicole: initial batch authored; surfaces only when articles enters her active window.

**Article Decision Drill in Artem's weekly slots**: unchanged. Artem's article work happens through CC live sessions and is distinct from the family-side library content. `references/stats-interpretation-guide.md` flags this separation explicitly so CC doesn't conflate the two when reviewing stats.

**Acceptance**:
- ~95 article quiz questions authored across 3 batches.
- ~15 article_drill items authored per family member.
- Article quiz content surfaces correctly in Anna's active window when Articles is active.
- Ernest's article_drill items surface when his window opens to articles.

### 3.3 Quiz orthography category additions

Three small additions to address orthographic gaps not covered by Spelling Drill (single-word focused) or existing quiz content.

**Sub-categories** (~60 items total):
1. **Tricky orthographic patterns** (~25 items): irregular plurals (knife/knives, child/children), -y → -ies, doubled consonants in -ing forms, common silent letters.
2. **Compound noun spelling** (~15 items): every day vs everyday, no one vs no-one, on to vs onto, all right vs alright.
3. **Homophone confusables** (~20 items): their/there/they're, your/you're, its/it's, then/than, lose/loose, advice/advise.

**Format**: input or MCQ as appropriate. These are quiz questions, not Coach exercises. They surface in Smart mode when the orthography category is in active window.

**Active window implications**: this category is in Anna's initial active window (under "Spelling" or a similar warm label). For Nicole, deferred until her foundation consolidates. For Artem, surfaces in open pool.

**Acceptance**:
- ~60 questions authored across the 3 sub-categories.
- New category visible in builder shell stats grid.
- Category appears as "Spelling" in learner shell active window for Anna.

---

## 4. Coach library content (per-player)

Per-player content thresholds for restart-readiness. Authored against these targets in parallel with engineering work in `learning-system-build.md`.

### 4.1 Anna

Active window: Prepositions, Articles, Spelling, plus one strong-area category TBD per §5 — see §5 Everyday Idioms caveat; **not** Everyday Idioms.

- Translation Drill: existing 10 items + ~10 more (~20 total).
- Spelling Drill: ~15-20 items (mix of captured + predicted L1 traps).
- Russian Trap: ~10 items (post-Spelling Drill; see §4.4 sequencing).
- Article Drill: ~15 items (overlaps with §3.2 article workstream).
- Free Write: 5 themed starter prompts (per D12 in `learning-system-build.md`).

### 4.2 Nicole

Active window: Irregular Verbs, Present Tense, themed Vocabulary; subject to CC composition review.

- Translation Drill: ~10 items, B1, themed K-pop/school/friends, Russian explanations.
- Spelling Drill: ~10 items, focused on common kid-relevant high-frequency words.
- Article Drill: deferred until articles enters her window.
- Free Write: 5 themed starter prompts, short and concrete.

### 4.3 Ernest

Active window: 6 categories; CC composes from his profile including articles, error correction priorities.

- Translation Drill: ~10 items, B1+.
- Article Drill: ~15 items (his documented gap).
- Error Correction: ~15 items focused on articles and prepositions.
- Free Write: 5 themed starter prompts.

### 4.4 Russian Trap sequencing note

The `russian_trap` exercise type (with the explicit `calque_trap` field) is authored *after* Spelling Drill ships and Anna has accumulated 2-3 sessions of Spell Help captures and Free Write turns. Rationale: real calque patterns from Anna's early sessions provide stronger authoring signal than predicted L1 traps. Authoring on predicted traps alone risks items that don't match her actual error profile.

Russian Trap is Anna-only at restart-readiness scope. Nicole and Ernest do not get Russian Trap content in initial active windows — the calque pattern is much milder for kids and the existing exercise types serve their needs better. Defer authoring for them indefinitely; revisit only if their session data shows a calque pattern emerging.

### 4.5 Authoring quality bar + acceptance

**Quality bar**: per `references/archive/phase2-coach-tab.md` §10 (or current Coach authoring standards).

**Acceptance**:
- All three learner-shell players have minimum library coverage to populate their active window for the restart push.
- Russian-language content (Translation Drill, Spelling Drill, Article Drill explanations) verified for Anna and Nicole.
- English-language content for Ernest verified.
- All Free Write themed prompts authored and bundled in PWA.

---

## 5. Bank quality audits

Bank-quality work that surfaces measurement artifacts vs genuine signal. Driven by `references/stats-interpretation-guide.md` §9 (structurally-compromised categories).

### 5.1 MCQ distractor audit Pass 1 (triage)

Single session, ~30 min. Sample 5-10 MCQ items per category across the bank's 27 categories. For each sample, apply the form-shortcut diagnostic from `references/stats-interpretation-guide.md` §9: can the correct answer be identified from option form alone (length asymmetry, register asymmetry, obvious grammar errors visible without semantic processing)? Output: per-category trust rating table (clean / needs-fuller-audit / structurally-compromised). Everyday Idioms is presumed structurally-compromised and provides the calibration anchor.

### 5.2 MCQ distractor audit Pass 2 (full audit of flagged categories)

Sizing TBD per Pass 1 output. Question-by-question audit of categories Pass 1 flags as compromised or needs-fuller-audit. For each flagged question, document whether form-shortcut is present and what the re-engineering scope would be (distractor rewrite vs full question rewrite). Defer this item until Pass 1 lands.

### 5.3 Everyday Idioms category re-engineering

Known structurally-compromised per stats-interpretation-guide §9. ~80 items requiring distractor rewrite (plausible options of similar length and register, no obvious-wrong distractor) or selective full rewrite where distractors can't be salvaged. Sizing depends on Pass 2 audit. Authored against Anna's productive vocabulary needs once she resumes the category at corrected calibration.

---

## 6. Tier priorities

Cross-cutting ordering. The build sequence in `learning-system-build.md` takes precedence for engineering work; this section orders the parallel content work.

### 6.1 Tier 1 — Restart-readiness content

These items are required for the learner-shell restart push to Nicole and Ernest. Anna is the testbed.

| Item | Where it lives |
|---|---|
| Anna's library content — translation, spelling, article drill, free write prompts | §4.1 above |
| Anna's Russian Trap content (~10 items) | Dependency-gated; §4.4 sequencing |
| Nicole's library content | §4.2 |
| Ernest's library content | §4.3 |
| Themed Free Write prompts (D12) | bundled in PWA, all 5 players |

### 6.2 Tier 2 — Builder-pool content (Artem and Egor benefit immediately; family benefit when active windows open)

| Item | Notes |
|---|---|
| PV ladder rebalance Batch 1 (§3.1 step 1-2, ~50 items) | Ships to library; surfaces for Artem/Egor in Smart mode immediately, gated for Anna/Nicole. |
| Article intervention first batch (§3.2, ~25-30 quiz items + ~15 article_drill per player) | Ships in batches; surfaces per active window. |
| Quiz orthography additions (§3.3, ~60 items) | Surfaces in Anna's window as "Spelling". |
| B2 Idioms (~15 items) | Fills genuine level hole; can later seed Russian Trap exercises. **Note**: new B2 category authored from scratch with proper distractors — distinct from the structurally-compromised B1 Everyday Idioms category (§5). Author with form-shortcut diagnostic in mind. |
| Used To input (~7 items) | 6.3% input share — highest priority among gap-fill. |
| Word Formation input cleanup | If applicable per CC's review of current state. |

### 6.3 Tier 3 — Data-driven (starts after restart push and observation period)

| Item | Notes |
|---|---|
| PV ladder rebalance Batch 2 (§3.1 step 3, remaining ~50 items including new verb families) | Inform with observed PV usage from Artem CC sessions and any family encounters. |
| C1 expansion (Reported Speech, Relative Clauses, G&I, Collocations) (~60 items) | Authored against observed weakness from CC + family Coach data. |
| Additional library content as active windows expand | Author against unlock events as they happen. |
| Coach particle_sort full coverage (~15 items per player) | Per family member as PV enters their active window. |
| MCQ distractor audit Pass 1 (§5.1) | Triage across all 27 categories. |
| MCQ distractor audit Pass 2 (§5.2) | Full audit of flagged categories. |
| Everyday Idioms category re-engineering (§5.3) | ~80 items. |

### 6.4 Tier 4 — Background fill-in (opt-in only)

CC does not pick Tier 4 work autonomously. Tier 4 runs only when Artem explicitly requests it ("do an audit session"), OR every item in Tiers 1–3 is genuinely complete.

| Item | Notes |
|---|---|
| s78 input hint/q redundancy audit (~406 items) | Polish, not correctness. |
| `exp` contrastive rewrite (~585 fields) | Polish. `exp_rewriter` tool already exists. |

### 6.5 Tier ordering rule

Within a tier, items can be done in any order. Tier 4 never picked autonomously.

---

## 7. Schema / UI fixes (parallel to authoring)

1. Document `transform` and `wordform` (Wave 0a — ✅ done).
2. Decide `wordform` treatment for the input-share metric — rename target to "production share" (counts wordform + input) so Word Formation isn't spuriously flagged.
3. Multi-blank UI/cognitive-load investigation (already on roadmap; not part of this plan but referenced).
4. biz-flag cleanup (Wave 0d — ✅ done).

---

## 8. Totals

| Wave | New questions | Cost | Status |
|---|---|---|---|
| 0a–0e | 12 Quantifiers + 125 migrated + 9 biz flips | ~5 sessions | ✅ done 2026-05-08 |
| 0f | (data fix only — populates `base` field on 40 wordform items) | ~1 session | pending |
| 0g | 12 error-correction items + new type infra | ~2 sessions | pending |
| 1 | ~60 (Nicole, includes some error-correction items in mix) | ~3 sessions | pending |
| 2 | ~50 (Anna, includes error-correction) | ~3 sessions | pending |
| 3 | ~10 + scaffolding pass (Ernest) | ~1 session | pending |
| 4 | ~30 (Artem refinement + claude_collab seed) | ~2 sessions | pending |
| **Total** | **~174 new + 125 migrated + 40 base-fixed** | **~12 sessions** | |

Workstreams add: PV ladder ~100 items, article intervention ~95 quiz + ~75 Coach article_drill (~15 × 5 players), quiz orthography ~60 items, Coach library ~80-100 items across 3 players. Bank quality audits + Idioms re-engineering ~80 items.

---

## 9. Open questions

- Whether to elevate per-major-topic floor from 8 to 10 once the bank is larger and SR data shows item retention.
- Whether to add an explicit `topic` field per question (currently using prefix-as-topic-proxy).
- C2 expansion (only 11 items, all in Conditionals) — long-term, low priority per `coverage-matrix.md`. Not in this plan.

---

## 10. How this plan supersedes prior plans

`references/coverage-matrix.md` § "Content backlog priorities (Phase 1 — post-s87)":

| Original item | Status |
|---|---|
| B2 Idioms | Folded into Wave 2 (Anna) + Tier 2 (§6.2) |
| C1 expansion (Reported Speech, Relative Clauses, G&I, Collocations C1) | Mostly folded into Wave 2 + Tier 3 (§6.3); G&I is over-target so dropped |
| C2 — initial batch | **Deferred** (out of scope per 2026-05-08) |
| Natural English | Done (already 30 in bank) |

`references/roadmap.md` § Phase-1 Content & Family/engagement: same items, same status.

Also absorbs from `plans/learning-system-build.md` (formerly phase2-build-plan.md): §4.2 PV ladder rebalance → §3.1 here, §4.3 article intervention → §3.2, §4.5 Coach library per player → §4, §4.6 Russian Trap sequencing note → §4.4, §4.7 quiz orthography → §3.3, §5.2-5.4 tier content tables → §6.

---

## 11. Status log

- 2026-05-08: plan written.
- 2026-05-08: Wave 0a–0e complete. Schema review found wordform `base` bug (40 items broken in production), undocumented `hard` field (90 items), dead `linked_question_ids` (18 items). Plan revised to add Wave 0f (cleanup) and Wave 0g (error-correction type, ahead of player waves).
- 2026-05-11: merged content-authoring sections from `plans/learning-system-build.md` (PV ladder rebalance, article intervention, Coach library per player, quiz orthography, bank-quality audits, tier ordering). Renamed file to standardized lowercase. Plan is now the single discovery path for content authoring; `learning-system-build.md` retained for engineering/system build.
