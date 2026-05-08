# Question Bank Plan — May 2026

Consolidates the Phase-1 backlog from `references/coverage-matrix.md` and
`references/roadmap.md` with the findings from the s89 audits
([category-level](../audits/audit-2026-05-08.md) and
[topic-level](../audits/audit-topics-2026-05-08.md)) and re-prioritises by
player (Nicole/Anna highest, Egor lowest).

This plan supersedes `coverage-matrix.md` Phase-1 priorities and
`roadmap.md` Phase-1 Content priorities for the duration of these waves.
The audits remain the authoritative coverage data.

---

## End goal

Every player has at least adequate practice volume in every topic relevant to
their level — measured by the two-track target system below — so that the
question bank serves the learning ladder without per-player blind spots.

---

## Two-track target system (adopted 2026-05-08)

| Track | Categories | Threshold | Why |
|---|---|---|---|
| **A. Open-class** (each item = its own concept) | Vocabulary, Phrasal Verbs, Idioms, Collocations, Irregular Verbs, Word Formation, Everyday English | Per-category variety floor: **≥40** for high-frequency (Vocabulary, PV); **≥15** for niche | Each item is one concept. Variety > depth. |
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

---

## Relaxed relevance model (adopted 2026-05-08)

Themes were originally hard-filtering players from off-theme content. Per the
2026-05-08 review this was stricter than `family-profiles.md` actually
required (which speaks to *authoring quality*, not *runtime routing*).

**New model**: themes are metadata for authoring targets, curated drills, and
audit thematic-diversity reporting. Routing reduces to level + biz check:

| Player | Sees |
|---|---|
| Artem | All B1–C2 (biz allowed) |
| Anna | All B1+B2 where `biz: false` |
| Nicole | All B1 where `biz: false` |
| Ernest | All B1+B2 where `biz: false` |
| Egor | All B2+C1 (biz allowed) |

Effect on relevant-bank size: Anna/Ernest +34%, Nicole ~0, Egor +22%, Artem +15%.
See `references/question-bank-taxonomy.md` §6 (to be updated in Wave 0b).

---

## Player priority order

Per 2026-05-08 review:

1. **Nicole** — highest. Smallest relevant bank (584 strict / ~580 relaxed).
   B1 only. Multiple zero or near-zero categories at her level.
2. **Anna** — highest tied. Many input-share gaps in standard categories.
3. **Artem & Ernest** — middle. Coverage broadly adequate; refinement work.
4. **Egor** — lowest. Zero-cell gaps explicitly accepted (2026-05-08).

---

## Wave 0 — Quick wins (no prerequisites, do first)

| # | What | Status | Effort |
|---|---|---|---|
| 0a | Document `transform` and `wordform` types in `references/question-schema.md` | ✅ done 2026-05-08 | 15 min |
| 0b | Adopt relaxed relevance model — update taxonomy §6 + `tools/bank_audit.js` | ✅ done 2026-05-08 | 30 min |
| 0c | Grammar B1 migration — 125 items reclassified, Pronouns added as 28th category (40 items) | ✅ done 2026-05-08 | 1 session |
| 0d | biz-flag cleanup — 9 flips + 4 theme repairs | ✅ done 2026-05-08 | 1 session |
| 0e | Quantifiers input batch — 12 items, qt_i prefix | ✅ done 2026-05-08 | 1 session |
| **0f** | **Schema/data cleanup** — discovered during schema review post-0e (see below) | pending | ~1 session |
| **0g** | **Error-correction type addition** — new question type for Russian L1 patterns | pending | ~2 sessions |

## Wave 0f — Schema/data cleanup (discovered during schema review)

The schema review (visual verification of 18 sample questions across all 6 types
in browser preview) found three real bugs and four documentation issues. Wave 0f
closes them before Wave 1 authoring lands, so authors copy correct templates.

| # | What | Effort |
|---|---|---|
| 0f.1 | **Fix `wordform.base` for 40 items** — runtime reads `q.base` (line 5263) but no question has the field; all 40 render "Form a word from: undefined". Derive base from each (q, ans) pair (e.g., ans=decision → base=DECIDE). Sub-agent task. | 30 min |
| 0f.2 | **Document `hard` field** in `question-schema.md` common-fields table. 90 questions use it; runtime weights selection (line 5017). | 5 min |
| 0f.3 | **Strip `linked_question_ids` field** from 18 questions (`pv_l01_*` triplets). Field has zero runtime references — dead data. Decision: strip (2026-05-08). | 10 min |
| 0f.4 | **Fix schema doc nits** — change "27 categories" to "28" (Pronouns added), add `qt_i` prefix to ID conventions table, swap fabricated `transform` example for a real one (`tf_02` works), correct `wordform` example to use `base` not `root`. | 10 min |

## Wave 0g — Error-correction type (Russian L1 focus)

Schema review identified the missing question type: **error correction**. Cambridge
uses it across all CEFR levels; especially valuable for Russian L1 because it
directly tests recognition of L1-interference errors (article drops, preposition
swaps, tense aspect collapses) that `family-profiles.md` calls out as durable
weak patterns.

**Lands before Wave 1** so Nicole/Anna/Ernest get error-correction items in
their main batches, not as an afterthought.

### Schema additions

New type `error_correction`. Type-specific fields:

| Field | Required | Meaning |
|---|---|---|
| `q` | yes | Stem with the L1-typical error embedded (e.g., "I am living here since 2018.") |
| `ans` | yes | Corrected sentence as string. Pipe-separated alternates allowed. |
| `error_type` | yes | Closed-set: `article` / `preposition` / `tense_aspect` / `verb_form` / `word_order` / `quantifier` / `pronoun` / `other` |
| `hint` | optional | One-line cue narrowing where to look |
| `exp` | yes | Standard exp + Russian L1 note required |

### Renderer

New branch in `renderQ`. Type badge "FIND THE ERROR". Stem displayed
prominently (no `___` blank — whole sentence is the prompt). Single text
input for the corrected sentence. Answer matching: case-insensitive,
whitespace-normalised, pipe-separated alternates supported (same as `input`).

### Initial content batch — 12 items

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

### Authoring rubric addition

Append to `question-authoring-standards.md`:
- Stem contains exactly one L1-typical error
- Error must be concrete, not stylistic
- `error_type` tag must match the actual error
- Pipe-separated `ans` alternates required when multiple corrections are valid
- L1 note in `exp` is required (Russian-specific)
- Don't introduce a SECOND error

---

## Wave 1 — Nicole (B1, biz=false)

| Category | Topic / focus | Type mix | Count |
|---|---|---|---|
| Word Order | Adverb position + basic SVO + inversion intro | input + gap | 12 |
| Collocations B1 | Verb + noun pairs (make/do extended) | input + gap | 12 |
| Idioms B1 | Kid-appropriate set (idom_b series extension to B1) | input + gap | 12 |
| Used To B1 | All three forms × home_daily/brit_expat contexts | input | 8 |
| Indirect Questions B1 | Embedded statements + yes/no | input + gap | 8 |
| Quantifiers B1 | Sub-quantifier coverage (existing gap) | gap (variety) | 8 |

**Total: ~60 questions**. All B1, biz=false. Heavy on input.

Selection rationale: closes Nicole's zero cells (Collocations, Idioms) and
the per-topic gaps the topic audit flagged at her level. Word Order is a
high-priority structural fix that benefits everyone.

---

## Wave 2 — Anna (B2, biz=false)

| Category | Topic / focus | Type mix | Count |
|---|---|---|---|
| Reported Speech | Reported questions + commands + time shifts | input | 10 |
| Linking Words | Contrast + cause/effect input | input | 8 |
| Idioms B2 | Existing roadmap Phase-1 #1 (was 15-q target; current 15) | input | 8 |
| Passive Voice B1+B2 | Get-passive + causative have/get | input + gap | 10 |
| Question Formation B2 | Wh- + tag question expansion | input | 8 |
| Adjectives | -ed/-ing pairs input + position B2 | input | 6 |

**Total: ~50 questions**. B1+B2, biz=false. Heavy on input.

---

## Wave 3 — Ernest (B1+B2, biz=false)

Most of Wave 1 (Nicole's B1 batch) and Wave 2 (Anna's B2 batch) also serve
Ernest. Specific Ernest additions:

- Easy-input scaffolding pass: review existing input questions and identify
  ~10 with simpler hints / clearer affordances. May be hint rewrites rather
  than new authoring.
- ~5 new B1 input items in Articles (his documented weak spot, recognition
  vs production gap).

**Total: ~10 new + scaffolding pass**

---

## Wave 4 — Artem (refinement)

| Category | Topic / focus | Count |
|---|---|---|
| Used To | input items in Artem's biz_oil/leisure_sport contexts | 6 |
| Tenses | Past perfect continuous + present perfect continuous input (currently 11% input) | 10 |
| Vocabulary | Business register input (decisions, due diligence, escalations) | 8 |
| claude_collab | Mark territory: 8–10 items spanning the project register (drill caps, weak patterns, MCP, deploy, hooks). Tagged `claude_collab` plus appropriate level/cat. | 8 |

**Total: ~30 questions**. Heavy on input + first claude_collab content in the bank.

---

## Wave 5 — Egor

**Skipped** per 2026-05-08 decision. Egor's zero cells (Everyday English B2,
Irregular Verbs B2/C1, Quantifiers B2/C1) accepted as gaps. Existing C1 vocab
authoring continues per his profile — not a wave priority.

---

## Schema / UI fixes (parallel to authoring)

1. Document `transform` and `wordform` (Wave 0a).
2. Decide `wordform` treatment for the input-share metric — rename target to
   "production share" (counts wordform + input) so Word Formation isn't
   spuriously flagged.
3. Multi-blank UI/cognitive-load investigation (already on roadmap; not part
   of this plan but referenced).
4. biz-flag cleanup (Wave 0d).

---

## Totals

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

Versus the original Phase-1 backlog (~145 questions for B2 Idioms + C1
expansion + C2 + Everyday English): comparable scope, very different
player distribution.

---

## Open questions / future iterations

- Whether to elevate per-major-topic floor from 8 to 10 once the bank is
  larger and SR data shows item retention.
- Whether to add an explicit `topic` field per question (currently using
  prefix-as-topic-proxy).
- C2 expansion (only 11 items, all in Conditionals) — long-term, low
  priority per `coverage-matrix.md`. Not in this plan.

---

## How this plan supersedes prior plans

`references/coverage-matrix.md` § "Content backlog priorities (Phase 1 — post-s87)":

| Original item | Status |
|---|---|
| B2 Idioms | Folded into Wave 2 (Anna) |
| C1 expansion (Reported Speech, Relative Clauses, G&I, Collocations C1) | Mostly folded into Wave 2; G&I is over-target so dropped |
| C2 — initial batch | **Deferred** (out of scope per 2026-05-08) |
| Everyday English | Done (already 30 in bank) |

`references/roadmap.md` § Phase-1 Content & Family/engagement: same items, same status.

---

## Status log

- 2026-05-08: plan written.
- 2026-05-08: Wave 0a–0e complete. Schema review found wordform `base` bug (40 items broken in production), undocumented `hard` field (90 items), dead `linked_question_ids` (18 items). Plan revised to add Wave 0f (cleanup) and Wave 0g (error-correction type, ahead of player waves).
