# Russian L1 B2 Diagnostic — Source Pass

**Status**: input to authoring pass for `tests/russian_l1_b2_diagnostic_v1.json`
**Companion**: `russian-l1-b2-foundation-diagnostic.md` (spec)
**Purpose**: cite specific catalogue entries per cluster so item authoring is defensible against a known L1-ru contrastive inventory, not freelance intuition.

---

## Canonical sources

| Tag | Reference |
|---|---|
| **S&S** | Swan & Smith, *Learner English* (2nd ed., CUP 2001), ch. "The speakers of Russian" (Olga T. Yokoyama). Canonical L1-ru contrastive inventory. |
| **Ionin04** | Ionin, Ko & Wexler (2004) "Article semantics in L2 acquisition: The role of specificity", *Language Acquisition* 12(1):3-69. Fluctuation Hypothesis — article-less L1s oscillate between definiteness and specificity. |
| **Ionin10** | Ionin & Montrul (2010) "The role of L1 transfer in the interpretation of articles with definite plurals in L2 English", *Language Learning* 60(4). |
| **Slab08** | Slabakova (2008) *Meaning in the Second Language*, Mouton de Gruyter. Aspect ch. 4–5; Russian-L1 aspectual transfer to English perfect / progressive. |
| **Slab16** | Slabakova (2016) *Second Language Acquisition*, OUP. Articles, aspect, mood; consolidated L1-effects review. |
| **EFCAMDAT** | Geertzen, Alexopoulou & Korhonen (2013), EF-Cambridge Open Language Database. Public B2-tagged L2 production, filterable by L1. |
| **CLC tags** | Cambridge Learner Corpus error coding scheme — AGA/RGA (articles), MP/RP/UP (prepositions), TV/TF (tense), AGV (agreement), WO (word order), MD (modal), FV (verb form). |
| **Archive** | `archive/article_diagnostic_2026-04-05.html` — receptive article items already authored, reuse cadence + stem patterns. |

---

## Per-cluster source map

### 1. Articles

- **S&S**: "Articles" section in Russian chapter — Russian has no article system; definiteness expressed via word order + bare NPs. Specific traps catalogued:
  - omission of `the` with definite [+specific +unique] NPs ("Sun is hot")
  - omission of `the` with post-modified definite NPs ("Book I read was good") ← matches `definite_post_modifier_drop` already in `coach_notes.weak_patterns`
  - overuse of `the` with generic mass/abstract ("The life is hard") and bare-plural generics ("The dogs are loyal")
- **Ionin04**: Fluctuation Hypothesis — L1-ru learners cluster article choice around `[±specific]` rather than `[±definite]`. Predicts B2 weakness specifically in `[+definite −specific]` (correctly use `the`) and `[−definite +specific]` (correctly use `a`).
- **CLC tags**: AGA (article missing), RGA (article unnecessary), most frequent error class for L1-ru at B2 in EFCAMDAT samples.
- **Item surfaces**:
  - Recognition: gap-fill stems orthogonal in `[±def] × [±spec]` (4 cells) + post-modifier definite ("the book ___ I read")
  - Production: RU → EN translation of stimuli forcing each cell; constrained free-write prompts that license generic + specific within one paragraph
- **Reuse**: lift 6–8 cadenced receptive items from `archive/article_diagnostic_2026-04-05.html`.

### 2. Prepositions (verb + prep collocations)

- **S&S**: "Prepositions" — Russian governs case directly on the object for many verbs that English requires a preposition for; conversely Russian uses different prepositions for English-direct-object verbs.
- **Specific high-B2 collocations** (catalogued L1-ru traps):
  - `listen to` (Russian *слушать* + acc, no prep) → omission
  - `wait for` (Russian *ждать* + gen, no prep) → omission
  - `depend on` (Russian *зависеть от*, "from") → replacement *depend from*
  - `arrive at/in` (Russian *прибыть в/на*) → calque to *arrive to*
  - `succeed in` (Russian *преуспеть в*) → replacement *succeed at*
  - `focus on` (Russian *сосредоточиться на*) → omission or *focus to*
  - `consist of` (Russian *состоять из*, "from") → replacement *consist from*
  - `apologise for / to` (Russian *извиняться перед / за*) → preposition swap
  - `agree with / on / to` (Russian *соглашаться с*) → partial mapping
- **CLC tags**: MP (missing prep), RP (replacement prep) — both high for L1-ru B2.
- **Item surfaces**: 4 recognition (gap-fill verb + ___ + NP), 4 production (constrained completion: "I want to ___ on this project" with semantic prompt).

### 3. Tense / aspect

- **S&S**: "Tense, mood and aspect" — Russian aspectual binary (pf/ipf) does not map onto English tense system. Past tense in Russian is unmarked for current relevance, so present perfect is the canonical L1-ru gap.
- **Slab08 / Slab16**: documented L1-ru transfer patterns at B2:
  - perfective → English simple past (correct ~80% of the time)
  - imperfective → English progressive (overgeneralised; misses present perfect entirely)
  - state verbs + perfect ("I've known him for years") most resistant
- **Specific B2 traps**:
  - present perfect for ongoing-since: "I live here for 5 years" (PaSimp where PrPerf required)
  - present perfect for recent past: "I already ate" (PaSimp where PrPerf required, US-acceptable but B2 target is British)
  - sequence of tenses in reported speech: "He said he is tired" (no backshift — Russian doesn't backshift)
  - past perfect for earlier-of-two-past: "When I arrived, he left" (PaSimp where PaPerf required)
- **CLC tags**: TV (tense verb), TF (tense form).
- **Item surfaces**: 3 recognition (correction or MCQ), 4 production (RU → EN with explicit temporal anchor — "за пять лет", "уже", "когда я пришёл, он [уйти-pf]").

### 4. Conditionals

- **S&S**: "Conditional" — Russian has one conditional form (бы + past-tense verb), used for both hypothetical present and counterfactual past. English distinguishes 4+ patterns.
- **Specific B2 traps**:
  - Type 2 with *would* in both clauses: "*If I would have time, I would go*" — direct calque of single Russian form to both clauses
  - Type 3 collapsed to type 2: "*If I had known, I would go*"
  - Mixed conditionals (past condition → present result, present condition → past result) underused
  - Type 0 (zero conditional) confused with type 1
- **CLC tags**: TV, MD (modal).
- **Item surfaces**: 3 recognition (4-way MCQ across types 0/1/2/3 with single stem), 3 production (RU → EN with explicit time anchor distinguishing hypothetical from counterfactual).

### 5. Modals

- **S&S**: "Modal verbs" — Russian *должен* maps to must/have to/should without distinction; no past-tense modal + perfect construction.
- **Specific B2 traps**:
  - Past speculation: *must have left* → L1 calque *must left* / *must to have left*
  - Past obligation unfulfilled: *should have done* → omitted entirely
  - Permission past: *was allowed to* vs *could* (one-time vs general capability)
  - *must* vs *have to* — uniform *must* even for external obligation
  - *don't have to* vs *mustn't* — Russian negation of obligation defaults to *mustn't*
- **CLC tags**: MD.
- **Item surfaces**: 2 recognition (past speculation MCQ + permission MCQ), 3 production (constrained completion: "He's not at his desk — he ___ [leave] for the day", forcing modal + perfect).

### 6. Verb complementation (gerund vs infinitive)

- **S&S**: "Complement clauses" — Russian uses infinitive after most verbs that license complement clauses; English distinguishes gerund/infinitive after a closed set of verbs with no semantic predictor.
- **B2 closed-set target verbs**:
  - gerund-only: *suggest, avoid, finish, enjoy, mind, consider, deny, recommend, miss, keep, practice*
  - infinitive-only: *want, decide, hope, plan, expect, agree, refuse, manage, learn, offer*
  - both-with-meaning-change: *stop, remember, forget, try, regret, mean*
  - bare infinitive: *let, make, help (variable)*
- **L1-ru traps**: uniform *to* + infinitive after gerund-licensing verbs ("*suggest to do*", "*avoid to do*", "*recommend to do*"). The *focus to have* trap surfaced in 2026-05-17 session belongs here (preposition + gerund overlap with cluster 11).
- **CLC tags**: FV (verb form).
- **Item surfaces**: 4 recognition (gap-fill with both forms available), 4 production (RU → EN of stem with target verb in lemma form — forces choice).

### 7. Word order

- **S&S**: "Word order and intonation" — Russian is canonically SVO but freely scrambles for information structure; English word order is fixed and carries grammatical (not pragmatic) load.
- **Specific B2 traps**:
  - Indirect question word order: "*I don't know what is it*" / "*Can you tell me where does he live*" — calque retains inversion
  - *Do*-support omission in questions: "*Where you went?*" / "*What he said?*"
  - Adverb placement: pre-verbal adverbs of frequency placed sentence-initial/final ("*Always I drink coffee*")
  - Object placement with phrasal verbs: separable vs inseparable ("*turn it off*" vs "*turn off it*")
- **CLC tags**: WO (word order).
- **Item surfaces**: 3 recognition (error correction — reorder), 3 production (RU → EN of indirect-question stems and frequency-adverb stems).

### 8. Quantifiers

- **S&S**: "Quantifiers" — Russian *много / мало* are blind to count/mass distinction; *некоторый / любой* don't carve up the *some / any* affirmative-vs-question/negative space.
- **Specific B2 traps**:
  - *much* with count nouns: "*much books*" / "*much friends*"
  - *few / little* confusion: "*few water*"
  - *some* in questions/negatives where *any* required: "*Do you have some time?*" (acceptable in offers but B2 target distinguishes)
  - *a few* / *few* polarity distinction (positive vs negative implicature)
- **CLC tags**: ID (incorrect determiner), often subcategorised.
- **Item surfaces**: 3 recognition (correction + MCQ), 3 production (constrained completion forcing count/mass + polarity choice).

### 9. Subject–verb agreement

- **S&S**: "Concord" — Russian agrees verb-on-subject for number + person, plus past tense agrees for gender. English collective + mass + indefinite-pronoun rules don't transfer.
- **Specific B2 traps**:
  - Collective nouns: *the team is / are* (BrE allows both; B2 target is consistency)
  - Mass nouns plural: *informations / advices / equipments* — common L1-ru pluralisation
  - Indefinite pronouns: *everyone are / everybody have*
  - Existential *there* + plural: *there is many people*
- **CLC tags**: AGV (subject-verb agreement), AGN (noun agreement).
- **Item surfaces**: 3 recognition (correction), 2 production (RU → EN of stems with mass nouns and indefinite-pronoun subjects).

### 10. Pronouns / anaphora

- **S&S**: "Pronouns" — Russian is partially pro-drop in colloquial register, has no expletive *it / there*, uses topic-comment "это" structures that map awkwardly to English copula clauses.
- **Specific B2 traps**:
  - Expletive *it* omission: "*Is raining*", "*Is important to know*"
  - Expletive *there* calqued via locative inversion: "*In the room is a table*"
  - *It is a [NP] who/that* clefts: L1-ru calques topic-comment "*This my brother*" or "*This is interesting question*" (article + cleft fused trap)
  - Pronoun reference ambiguity: Russian gender-marked anaphora is unambiguous; English neuter creates resolution loads
- **CLC tags**: MP (missing pronoun where expletive needed), AGN.
- **Item surfaces**: 3 recognition (gap-fill expletive + correction), 2 production (RU → EN of weather, time, distance, existence stems).

### 11. Preposition + gerund

- **S&S**: "Verbal nouns / -ing forms" — Russian preposition + verbal-noun-in-oblique-case maps to English preposition + gerund; L1 trap substitutes infinitive marker *to*.
- **Specific high-frequency collocations**:
  - *focus on doing* → *focus to do* (surfaced 2026-05-17)
  - *succeed in doing* → *succeed to do*
  - *insist on doing* → *insist to do*
  - *look forward to doing* → *look forward to do* (the *to* trap — looks like infinitive marker)
  - *be interested in doing* → *interested to do*
  - *be good at doing* → *good to do*
  - *think of doing / about doing* → *think to do*
  - *instead of doing* → *instead to do*
- **CLC tags**: FV + UP (unnecessary prep) interaction.
- **Item surfaces**: 3 recognition (gap-fill), 3 production (constrained completion forcing the prep + gerund pattern).

### 12. Comparatives

- **S&S**: "Comparison" — Russian comparative is morphological (*больше, лучше*) + чем-clause; no homophone collision; double-comparative is ungrammatical in Russian too but L1-ru learners produce it in English at B2.
- **Specific B2 traps**:
  - *than / that* confusion (orthographic-fluency overlap)
  - Double comparative: *more better, more easier*
  - *as ... as* incomplete: "*She is as tall*" (missing second *as*)
  - *the more X, the more Y* construction unused
  - *much / far / a lot* intensifier with comparative ("*more better*" vs "*much better*")
- **CLC tags**: FC (form of comparison), MA (missing article in superlative).
- **Item surfaces**: 2 recognition (correction), 3 production (constrained completion forcing *as...as* + *the more...the more* + intensifier choice).

---

## Item count plan (rolls up to spec budget)

| Cluster | Recog | Prod | Total |
|---|---|---|---|
| 1. Articles | 4 | 4 | 8 |
| 2. Prepositions | 4 | 4 | 8 |
| 3. Tense / aspect | 3 | 4 | 7 |
| 4. Conditionals | 3 | 3 | 6 |
| 5. Modals | 2 | 3 | 5 |
| 6. Verb complementation | 4 | 4 | 8 |
| 7. Word order | 3 | 3 | 6 |
| 8. Quantifiers | 3 | 3 | 6 |
| 9. Agreement | 3 | 2 | 5 |
| 10. Pronouns | 3 | 2 | 5 |
| 11. Prep + gerund | 3 | 3 | 6 |
| 12. Comparatives | 2 | 3 | 5 |
| **Total** | **37** | **38** | **75** |

75 items, 49% / 51% recognition-vs-production split, sits inside the 60–80 spec band.

---

## Authoring guardrails

- **Theme tags per item**: rotate `[biz_oil] | [leisure_sport] | [brit_expat] | [claude_collab]` per Artem's profile; no abstract textbook sentences.
- **Distractor design (recognition)**: include the predicted L1-ru calque as one distractor for every MCQ — otherwise the item can be solved by elimination without triggering the trap.
- **Production stimuli**: Russian stimulus must force the target structure (e.g., explicit temporal anchor for tense items, gerund-licensing verb in lemma form for cluster 6). Free-write prompts must not be open enough to permit avoidance.
- **Mixing order**: cluster IDs are authoring-internal; final test order shuffles clusters so back-to-back items don't telegraph what's being tested (spec §Run protocol).
- **Cadence reuse**: cluster 1 lifts stem cadence from `archive/article_diagnostic_2026-04-05.html` — same length, same register, same theme tagging.

---

## Open authoring decisions

- **Test file location**: `tests/russian_l1_b2_diagnostic_v1.json` (new directory, one-shot instrument — confirmed in spec §Authoring workflow).
- **Question schema**: extend `references/question-schema.md` shape (id, type, q, answer, distractors, explain, l1_trap_id, cluster_id, theme). New required field `l1_trap_id` ties each item to a catalogue entry above for scoring traceability.
- **No `hint` field**: diagnostic, not drill — hints would contaminate the cold-production signal (spec §Run protocol).
