# Question Bank Taxonomy

The reference rubric for auditing whether the question bank serves the family.
Defines the axes along which questions are classified, the closed sets each
axis uses, and the per-player relevance matrix that an audit checks coverage
against.

This is a **rubric**, not a runtime artefact. For field structure see
`question-schema.md`; for authoring rules see `question-authoring-standards.md`;
for level/type ratio targets see `coverage-matrix.md`. This file fills the gap
those three leave: what each category, type, and theme actually means, and
which combinations matter for which player.

Counts in this doc are snapshots from the s89 audit (bank size 2,022). The
numbers drift; the structure does not.

---

## 1. Five-axis classification

Adopted from CEFR item-bank practice (Cambridge ESOL, *Using the CEFR:
Principles of Good Practice*, 2011). Every question sits at a point in this
five-dimensional space:

| Axis | Field | Closed set | Captures |
|---|---|---|---|
| Level | `lvl` | B1, B2, C1, C2 | CEFR proficiency tier |
| Construct | `cat` | 27 categories (§3) | What grammar/lexical thing is tested |
| Cognitive demand | `type` | gap, mcq, input, multi (+ transform, wordform — see §4) | Recognition vs production load |
| Domain | `biz` | true, false | Occupational/professional vs general (collapses CEFR's 4 domains) |
| Theme | `themes` | closed set of 8 tags (§5) | Topical context — required for the "no generic stems" rule |

The first four were already in the schema; `themes` was added s89 to fill
the gap that `family-profiles.md` had created — it lists per-player tags
(`[biz_oil]`, `[home_daily]`, …) but until s89 they never lived on the
question itself, so the bank wasn't queryable along the axis the
family-profiles rule ("every stem must use the player's real-life context
themes") demands.

---

## 2. Bank inventory snapshot

Total: **2,025 questions** across 28 categories (Pronouns added 2026-05-08 via Grammar B1 migration).

| Level | Count | Share |
|---|---|---|
| B1 | 657 | 32.5% |
| B2 | 1,015 | 50.2% |
| C1 | 339 | 16.8% |
| C2 | 11 | 0.5% |

| Type | Count | Share | Notes |
|---|---|---|---|
| gap | 938 | 46.4% | Workhorse |
| mcq | 488 | 24.1% | Above ~8% target — reduce when adding |
| input | 446 | 22.1% | Below ≥20% per-category in 14 categories |
| multi | 44 | 2.2% | At target; **all-player <55% accuracy** (anomaly, 2026-04-30) |
| transform | 54 | 2.7% | **Not documented in `question-schema.md`** |
| wordform | 40 | 2.0% | **Not documented in `question-schema.md`** |

C2 cluster: **all 11 C2 questions are Conditionals**. No C2 content
elsewhere. Coverage-matrix labels C2 long-term low priority — flagged for
the audit, not a near-term gap.

---

## 3. Categories registry

The 27 active values for `cat`. Each row gives the scope (what this category
tests), the boundary against neighbours (so similar-looking topics route to
the right cat), and current bank counts.

For per-category type/level breakdowns see Appendix A. For ID prefix → category
mapping see §6.

| Category | Scope (what it tests) | Boundary against neighbours |
|---|---|---|
| **Phrasal Verbs** | Multi-word verbs (verb + particle): meaning, separability, register | vs Idioms (PV is a productive class with semantic patterns; idioms are frozen). vs Collocations (PV = verb+particle; coll = verb+noun). |
| **Vocabulary** | Single-word lexical choice: meaning, near-synonyms, register | vs Word Choice (this = pick the word; WC = disambiguate confusables). vs Collocations (this = single word; coll = which word goes with which). |
| **Gerunds & Infinitives** | Verb-pattern complements: `enjoy doing` / `decide to do` / `stop to do` vs `stop doing` | vs Tenses (this = non-finite form choice; tenses = finite form). |
| **Articles** | a / an / the / zero — including discourse-driven the, generic uses, fixed phrases | vs Quantifiers (this = definiteness; quant = quantity). vs Grammar (legacy article items live here). |
| **Tenses** | Finite verb form: tense, aspect, time references, sequence-of-tenses inside one clause | vs Reported Speech (RS = backshift across clauses). vs Conditionals (cond = if-clause type). vs G&I (G&I = non-finite). |
| **Grammar** | B1-only catch-all for foundational items not yet split into their own category | Migrating: items split off to Used To, Articles, Quantifiers when ≥30 accumulate. Almost all B1. |
| **Conditionals** | Zero / 1st / 2nd / 3rd / mixed — if-clause structure and consequence | vs Tenses (cond = the construction; tense rules apply within it). |
| **Linking Words** | Connectors / discourse markers: although, despite, in spite of, however, whereas, etc. | vs Word Order (LW = which connector; WO = where it goes). |
| **Prepositions** | Preposition choice in collocations and dependent prepositions | vs PV (prep alone vs verb+particle bound unit). vs Collocations (this = preposition slot; coll = lexical pairing). |
| **Modal Verbs** | can/could/may/might/must/should/ought to/needn't have/etc. — possibility, obligation, deduction | vs Conditionals (modals appear in cond clauses but the construct here is the modal itself). |
| **Irregular Verbs** | Past simple and past participle forms of irregular verbs | All B1, all input. Pure form-recall. Distinct from Tenses (which tests *when* to use a form). |
| **Emphasis** | Inversion, cleft sentences, fronting — `Never had I seen…`, `What I need is…` | C1-leaning. vs Word Order (emphasis = marked structures; WO = neutral order). |
| **Word Formation** | Affixation: noun → adjective, verb → noun (`apply → applicant`, `succeed → success`) | All productive morphology. **Type=`wordform`** (see §4). |
| **Used To** | `used to` / `would` for past habit; `be used to` / `get used to` for familiarity | Split from Grammar (S31). |
| **Word Choice** | Confusables: make/do, say/tell, lend/borrow, fewer/less, who/whom | vs Vocabulary (this = pair-disambiguation; voc = open lexical choice). |
| **Relative Clauses** | who/which/that/whose/whom + defining vs non-defining | |
| **Question Formation** | Word order in direct questions, do-support, auxiliaries, tag questions | vs Indirect Questions (this = direct; IQ = embedded). |
| **Indirect Questions** | Embedded questions: `Could you tell me where it is?`, `I wonder if…` | Split from Question Formation (S31). |
| **Idioms** | Frozen multi-word expressions with non-compositional meaning | vs PV (idioms are not productive). vs Collocations (idioms are non-compositional). |
| **Quantifiers** | much/many, few/little, some/any, all/every, both/either/neither | vs Articles (quant = quantity; art = definiteness). |
| **Reported Speech** | Backshift, time/place shifts, reporting-verb patterns | vs Tenses (RS = cross-clause transformation). |
| **Comparisons** | Comparative/superlative adjectives, `as…as`, `the more…the more` | vs Adjectives (this = degree forms; adj = position/order). |
| **Natural English** | Pragmatic functions and register: requests, complaints, small talk, register fit | All B1. Anna engagement driver per coverage-matrix Phase-1. |
| **Collocations** | Word pairings: `make a decision`, `heavy rain`, `commit a crime` | vs Vocabulary (coll = pairing; voc = single word). vs PV. |
| **Passive Voice** | Active ↔ passive transformation, agent omission, get-passive | Often appears as **type=`transform`** (see §4). |
| **Adjectives** | -ed / -ing pairs, adjective order, position, postposed | vs Comparisons (adj = base form usage; comp = degree). |
| **Word Order** | Adverb position, negative inversion, cleft fronting (non-emphatic) | vs Emphasis (WO = neutral order rules; emph = marked structures). |
| **Pronouns** | Reflexive pronouns (myself/himself/themselves), reflexive vs object choice (himself vs him), `by + reflexive` = alone, reciprocal each-other, singular-they / gender-neutral usage | Added 2026-05-08 from Grammar B1 migration (40 items). vs Word Choice (Pronouns = pronoun-form selection, not lexical confusable pairs). |

**Schema note**: the master `cat` validation list lives at `index.html`
in the cat-filter chip rendering. Adding/renaming a category requires updating
the chip wrap, `LEVEL_TOTALS`, `CAT_TOTALS`, and this doc — see
`coverage-matrix.md` § "When category structure changes".

---

## 4. Types — schema reconciliation

`question-schema.md` documents 4 types: `gap`, `mcq`, `input`, `multi`.
The bank holds **two more**: `transform` and `wordform`. They are valid in
the runtime but undocumented as schema. Reconcile in a follow-up before the
audit is published.

| Type | Documented? | Count | Cognitive demand | Use when |
|---|---|---|---|---|
| `input` | ✓ | 446 | Free production from memory | Unambiguous typing supported. Highest learning value. |
| `gap` | ✓ | 938 | Constrained production from visible options | 2–4 plausible same-category options. |
| `multi` | ✓ | 44 | Multiple constrained decisions, each blank independent | Transformational drills. **2–3 blanks max.** |
| `mcq` | ✓ | 488 | Recognition — pick the correct whole sentence | Sentence-level discrimination only. Reduce share over time. |
| `transform` | ✗ undocumented | 54 | Free production with `keyword` constraint | Cambridge-style key-word transformations. Mostly Passive Voice (`tf_` prefix). |
| `wordform` | ✗ undocumented | 40 | Free production from a prompt root | Affixation drills. `wf_` prefix, all in Word Formation. |

**Schema-gap tasks** (not in this doc's scope; flag in audit):
- Document `transform` and `wordform` field shapes in `question-schema.md`.
- Verify all 37 input-without-hint questions are the documented G&I
  bracket-format exemption, not authoring oversights.

---

## 5. Theme tag vocabulary

Closed set of 8 tags. Added to questions as a new array field
`themes: ['biz_oil', …]` — see `question-schema.md`.

The set splits into two groups: **routing tags** (1–6) place a question in a
real-world context that maps to one or more players; **non-routing tags**
(7–8) describe questions that have no real-world setting and are universally
applicable.

### Routing tags

| Tag | Definition | Register cues | Applicable players |
|---|---|---|---|
| `biz_oil` | Business meetings, O&G operations, finance, strategy, Bahrain professional settings. Operational/hallway register. | "never got around to it last quarter", "contractor's pushing back", "let's crack on". Avoid pitch-deck register. | Artem |
| `kpmg_consulting` | English-language consulting work at KPMG Almaty: client deliverables, internal English memos, audit/advisory scenarios with Russian-L1 colleagues. | Engagement, deliverable, scope, client ask, internal English memo register. | Egor |
| `home_daily` | Home life, interior, neighbours, daily-life situations encountered in Bahrain. | School-run, kitchen, weekend errands, family routines. | Anna, Nicole, Ernest |
| `leisure_sport` | Cycling, F1, gym, padel, sports talk, weekend activities. | Match results, training, gear, sports gossip. | Artem, Anna, Nicole, Ernest |
| `brit_expat` | British Club, padel, rugby/F1 banter, school-gate parents, expat dinner parties, weekend brunch. | "dropped by the club", "see you at pickup", British expat casual. | Artem, Anna, Nicole, Ernest |
| `claude_collab` | Prompts to Claude, project shared vocab ("learning ladder", "weak_patterns"), system-behaviour talk, git/CLI collab. | "the drill is capping at six items", "Claude flagged it", "let's land that PR". | Artem |

**`biz_oil` and `kpmg_consulting` overlap heavily by design.** Most generic
office stems (deadlines, reports, contracts, meetings) cue both contexts and
should carry both tags — that is how a single stem routes to both Artem and
Egor. Tag `biz_oil` alone only when the stem cues Bahrain / O&G / hallway
register specifically. Tag `kpmg_consulting` alone only when the stem cues
audit / advisory / consulting deliverable register specifically. When in
doubt, tag both.

**`claude_collab` is currently 0 in the bank** (validated in s89 sample tagging).
Listed as an authoring target rather than a description of existing content —
Artem spends hours/day in this register and the bank's silence is a real
coverage gap that the audit should surface.

### Non-routing tags

| Tag | Definition | Register cues |
|---|---|---|
| `meta` | Question is *about* the grammar itself — recognition or definition tasks where no real-world setting can attach. | "Which sentence uses inversion correctly?", "What does GO ON TO mean?", "Which is a correct indirect question?" |
| `theme_independent` | Question has a fillable stem but no setting cues — abstract example. | "It was not ___ intense as I expected", "She ___ here since 2018", bare adjective/preposition drills. |

**These two tags do not route to any player** in the relevance test
(see §6) — instead, a question whose `themes` array consists *entirely*
of non-routing tags is treated as universally applicable to every player
who clears the level/biz checks. Splitting `meta` from `theme_independent`
preserves the diagnostic distinction (recognition vs production-without-context)
that a single `neutral` bucket would lose.

### Out of scope

`academic_ielts` and `almaty_daily` exist in `family-profiles.md` for Egor
but are not part of the audit per the 2026-05-08 decision. They remain
valid runtime tags; this doc just doesn't track coverage for them.

### Tagging rule

Each question gets one or more applicable themes. Routing tags are
preferred where any context fits; non-routing tags only when no setting
cue is present. Most stems carry 2+ tags (validated: ~60% of the s89
sample sample).

---

## 6. Player relevance matrix

For an audit to answer "do we cover what each player needs," it needs to
know which (level × theme) cells matter per player. A category is relevant
to a player if the player can study it at their level AND at least one of
their themes has bank coverage.

| Player | Levels in scope | Themes in scope | `biz` | Notes |
|---|---|---|---|---|
| Artem | B2, C1 (B1 reinforce, C2 reach) | biz_oil, leisure_sport, brit_expat, claude_collab | true allowed | Most active. Reviews questions. |
| Anna | B1, B2 | home_daily, leisure_sport, brit_expat | false default | Re-engaging Apr 2026. |
| Nicole | B1 only | home_daily, leisure_sport, brit_expat | false | B1 filter only until accuracy ≥75%. |
| Ernest | B1, B2 | home_daily, leisure_sport, brit_expat | false default | Inactive recently. |
| Egor | B2, C1 | kpmg_consulting | false default | `academic_ielts` + `almaty_daily` out of audit scope. |

**Audit-relevance test** (relaxed model, adopted 2026-05-08) — a question
matters to a player when **both** of:

1. `question.lvl ∈ player.levels`
2. `!question.biz` OR `player allows biz`

That is: routing reduces to level + biz check. Themes are no longer a
hard filter.

### Why the model was relaxed

The earlier strict model required `themes ∩ player.themes ≠ ∅` (or a
universal non-routing tag). This was stricter than `family-profiles.md`
actually needed — that rule speaks to *authoring quality* ("every stem
must use the player's real-life context themes"), not *runtime routing*.
Hard-filtering by themes excluded Anna and the kids from any
biz_oil-tagged stem even when `biz: false`, which over-restricted their
relevant bank by 30%+.

Themes still do real work — see "What themes are still for" below — but
they no longer gate visibility.

### What themes are still for

- **Authoring targets**: when authoring for a player, use their themes
  (`family-profiles.md` rule preserved).
- **Curated drills**: a "Anna brit_expat session" can preferentially
  sample by theme.
- **Audit thematic-diversity reporting**: per-category-per-player theme
  reach is a quality metric, not a routing gate.
- **`biz` flag remains the hard filter** for kid/Anna content. Themes
  describe; `biz` decides.

---

## 7. ID prefix index (abbreviated)

Top prefixes by count. Full canonical map lives inline in `index.html`;
this is a navigation aid.

| Prefix | Count | Category | Notes |
|---|---|---|---|
| `pv_ti`, `pv_g`, `pv_f`, `pv_c`, `pv_l`, `pv_b`, `pv` | 214 | Phrasal Verbs | Sub-batched by topic/level |
| `voc`, `c` (12) | 87 | Vocabulary | |
| `tg`, `tns_i` | 68 | Tenses + G&I (split history) | `tg` prefix predates G&I split |
| `wf_` | 49 | Word Formation | All `type: wordform` |
| `tf_` | 45 | Passive Voice (mostly) | All `type: transform` |
| `irv`, `irvpp` | 63 | Irregular Verbs | All B1, all input |
| `aph`, `art`, `art_b`, `art_i` | 97 | Articles | Sub-batched by series |
| `lkc` | 39 | Linking Words | C-series |
| `qf` | 34 | Question Formation | |
| `pp_ap`, `ap` | 48 | Prepositions | |
| `mvc` | 33 | Modal Verbs | C1 |
| `iq_c` | 25 | Indirect Questions | C-series |
| `gi_c`, `gi_b` | ≥27 | Gerunds & Infinitives | |
| `ee` | 30 | Natural English | |
| `wt` | 19 | Relative Clauses | |
| `gr_b` | 18 | Grammar | B-series |
| `ut_b` | 16 | Used To | B-series |
| `wc` | 15 | Word Choice | |
| Retired (do not reuse) | — | — | `qt01`, `qt02`, `wt01` |

ID convention: prefix + sequential number, never reused, never renumbered
(losing `id` orphans the row in `qStats`).

---

## 8. Schema gaps to reconcile

Surface-only list. Each becomes a separate fix task; the audit references
this section rather than re-discovering each gap.

1. **Undocumented types**: `transform` (54) and `wordform` (40) are not in
   `question-schema.md`. Document field shapes (e.g. `transform` has
   `source` and `keyword`; `wordform` has a root prompt format) and add to
   the type table.
2. **Input without hint**: 37 input questions have no `hint` field. Verify
   each is the documented G&I bracket-format exemption.
3. **`biz` boolean vs CEFR domain**: `biz: true/false` collapses the CEFR
   four-domain model (personal / public / occupational / educational). Adequate
   for current scale; revisit if the bank acquires `educational` items
   (academic register beyond `kpmg_consulting`).
4. **Cat string drift**: 27 active `cat` strings; no central registry file
   asserts the closed set. The `cat-filter-wrap` chips in `index.html`
   serve as the de-facto registry. Consider a runtime assertion in a build
   step.
5. **Multi-blank cross-player anomaly** (2026-04-30): all five players
   <55% on `multi`. UI/cognitive-load issue, not knowledge gap. Audit
   should flag rather than treat as content fault.
6. **C2 cluster**: all 11 C2 questions are Conditionals. Coverage-matrix
   accepts C2 as low priority; audit notes coverage = "Conditionals only".

---

## 9. Audit rubric

How a coverage audit uses this doc:

1. **For each player**, compute relevant-bank size using the §6 test
   (level ∩ theme ∩ biz).
2. **For each player × category**, report:
   - Total relevant questions
   - Type distribution (input share vs ≥20% target)
   - Theme distribution within relevant tags
3. **Flag a category as under-covered for a player** when:
   - Relevant count < 15, OR
   - Input share < 20% within relevant set, OR
   - All relevant questions sit on one theme (lack of context variety)
4. **Cross-player flags** (independent of theme):
   - C2 confined to Conditionals (§8.6)
   - `multi` accuracy anomaly (§8.5)
   - Schema-gap items (§8.1, §8.2)
5. **Output**: one table per player + a cross-cutting flags section.
   Recommendations split into "author new items" vs "fix schema/UI".

The audit does **not** edit questions inline. It produces a fix backlog;
edits happen in a separate `quiz-development` session after review.

---

## Appendix A — Full categories registry with counts

s89 snapshot. Sort by Total descending.

| Category | Total | B1 | B2 | C1 | C2 | gap | mcq | input | multi | biz=true |
|---|---|---|---|---|---|---|---|---|---|---|
| Phrasal Verbs | 273 | 79 | 167 | 27 | 0 | 139 | 58 | 73 | 0 | 125 |
| Vocabulary | 185 | 27 | 85 | 73 | 0 | 69 | 80 | 36 | 0 | 64 |
| Gerunds & Infinitives | 164 | 20 | 120 | 24 | 0 | 81 | 38 | 40 | 0 | 29 |
| Articles | 157 | 55 | 98 | 4 | 0 | 75 | 30 | 30 | 22 | 65 |
| Tenses | 155 | 61 | 79 | 15 | 0 | 71 | 58 | 17 | 5 | 25 |
| Grammar | 125 | 122 | 3 | 0 | 0 | 74 | 38 | 11 | 0 | 8 |
| Conditionals | 92 | 22 | 40 | 19 | 11 | 25 | 36 | 21 | 5 | 25 |
| Linking Words | 80 | 13 | 47 | 20 | 0 | 52 | 10 | 15 | 0 | 21 |
| Prepositions | 78 | 12 | 66 | 0 | 0 | 36 | 12 | 30 | 0 | 18 |
| Modal Verbs | 74 | 12 | 36 | 26 | 0 | 50 | 5 | 14 | 0 | 10 |
| Irregular Verbs | 63 | 63 | 0 | 0 | 0 | 0 | 0 | 63 | 0 | 0 |
| Emphasis | 55 | 7 | 24 | 24 | 0 | 10 | 11 | 16 | 6 | 26 |
| Word Formation | 49 | 2 | 30 | 17 | 0 | 0 | 0 | 9 | 0 | 27 |
| Used To | 48 | 3 | 45 | 0 | 0 | 37 | 8 | 3 | 0 | 0 |
| Word Choice | 44 | 15 | 23 | 6 | 0 | 23 | 11 | 10 | 0 | 5 |
| Relative Clauses | 42 | 5 | 37 | 0 | 0 | 24 | 9 | 9 | 0 | 2 |
| Question Formation | 36 | 13 | 3 | 20 | 0 | 23 | 6 | 7 | 0 | 1 |
| Indirect Questions | 36 | 8 | 3 | 25 | 0 | 27 | 3 | 6 | 0 | 8 |
| Idioms | 35 | 0 | 15 | 20 | 0 | 19 | 10 | 6 | 0 | 14 |
| Quantifiers | 34 | 34 | 0 | 0 | 0 | 20 | 14 | 0 | 0 | 2 |
| Reported Speech | 32 | 10 | 20 | 2 | 0 | 11 | 3 | 6 | 6 | 9 |
| Comparisons | 30 | 18 | 11 | 1 | 0 | 13 | 8 | 6 | 0 | 5 |
| Natural English | 30 | 30 | 0 | 0 | 0 | 13 | 10 | 7 | 0 | 0 |
| Collocations | 29 | 0 | 29 | 0 | 0 | 12 | 9 | 8 | 0 | 11 |
| Passive Voice | 28 | 5 | 8 | 15 | 0 | 9 | 9 | 4 | 0 | 11 |
| Adjectives | 26 | 13 | 13 | 0 | 0 | 19 | 1 | 6 | 0 | 2 |
| Word Order | 22 | 9 | 13 | 0 | 0 | 7 | 11 | 4 | 0 | 1 |

Note: type columns sum to less than Total in some rows because `transform`
and `wordform` types are not shown — see §4.
