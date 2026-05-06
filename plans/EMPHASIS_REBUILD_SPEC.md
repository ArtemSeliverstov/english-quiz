# Emphasis Category — Rebuild Spec

**Target version:** TBD (next available `s{N}` — check KB Version Log before starting)
**Estimated size:** ~45–55 questions total (currently ~20)
**Estimated work:** 25–35 new questions + audit/fix of existing ~20

---

## 1. Strategic context

The Emphasis category currently scores 57% (Artem, ~30 attempts) — the family's
weakest C1 area. Audit S86 fixed 11 broken questions but did not address the
underlying issue: **the category is over-indexed on academic inversion** at the
expense of constructions that family members actually use.

Five family members, three needs:
- **Artem (C1, business)** — needs Cleft, Do-emphasis, So/Neither, business inversion (Had I known / Should you / Under no circumstances). No IELTS.
- **Anna (B1)** — needs Do-emphasis, So/Neither, intensifiers. No inversion.
- **Nicole (B1)** & **Ernest (B1/B2)** — current needs basic; future needs may include IELTS-style inversion.
- **Egor (C1, IELTS)** — needs full inversion coverage including academic types.

**Design strategy:** balanced coverage across CEFR levels (B1 → C1) with subtopic
priority weighted toward real-world utility, not test prep.

---

## 2. Subtopic targets — final composition

| # | Subtopic | Target count | Level mix | Priority | Rationale |
|---|---|---|---|---|---|
| 1 | **Cleft sentences** | 12–15 | B2: 6, C1: 8 | ⭐ HIGH | Universal utility — speech + writing. *It was X who...*, *What I need is...*, *The thing is...* |
| 2 | **Do-emphasis** | 8–10 | B1: 4, B2: 5 | ⭐ HIGH | Common in speech across all levels. *I do apologise / She did finish it.* |
| 3 | **So/Neither/Nor (agreement)** | 6–8 | B1: 4, B2: 3 | ⭐ HIGH | Most-used inversion in speech. NEW subtopic — currently absent. |
| 4 | **Intensifiers (lexical emphasis)** | 8–10 | B2: 8 | ⭐ HIGH | NEW subtopic. Closes a gap. *absolutely / utterly / completely / way + comparative.* Russian L1 over-uses *very*. |
| 5 | **Inversion — business/practical** | 6–8 | C1 | MED | *Under no circumstances / Had I known / Should you need / Were we to.* The 4 inversion patterns Artem actually uses. |
| 6 | **Inversion — academic/IELTS** | 6–8 | C1 | LOW | *Never have I / Rarely does / No sooner...than / Hardly...when / Only when...did / Not only...but also.* Recognition + Egor's IELTS. |
| 7 | **Fronting (without inversion)** | 3–5 | B2/C1 | LOW | *This book I would never recommend.* Stylistic. |

**Total target: 49–64. Plan for ~50.**

The split between subtopics 5 and 6 is the key structural change: business
inversion gets equal weight to academic, instead of being buried in it.

---

## 3. Level distribution target

After rebuild, Emphasis should have:
- **B1: ~10** (Do-emphasis basics, So/Neither basics)
- **B2: ~22** (Cleft B2, Do-emphasis, So/Neither advanced, Intensifiers, Fronting)
- **C1: ~18** (Cleft pseudo, Inversion both types, Fronting C1)

This gives Anna and Nicole real B1/B2 entry points (currently they get C1
inversion or nothing).

---

## 4. Question type distribution

Per KB type hierarchy (input > gap > multi > mcq), target for Emphasis:
- **input: ≥20%** (currently 7.7% per KB — must increase)
- **transform: ~15%** (rewrite "I called him." → "It was him I called.")
- **gap: ~30%**
- **multi: ~15%**
- **mcq: ~20%** (only for sentence-level grammaticality judgement)

Transform questions need `source` and `keyword` fields — see KB Question Schema.
Transforms are especially valuable for Emphasis because they force production of
the structure (e.g., "Rewrite emphasising X using *It was...*").

---

## 5. Audit — existing questions

Run audit on all Emphasis questions before adding new ones. Use this priority
matrix to decide keep/fix/retire:

### Audit dimensions

For each existing Emphasis question, score on:
1. **Subtopic** — which of the 7 subtopics above does it fit?
2. **Real-world utility** — does the structure get used in speech/business writing? (HIGH/MED/LOW)
3. **Quality** — passes the per-question authoring checklist? (PASS/FIX/RETIRE)
4. **Level appropriateness** — is the assigned `level` correct? (often academic inversion is mislabeled B2 when it should be C1)

### Decision rules

- **HIGH utility + PASS quality** → keep as is
- **HIGH utility + FIX quality** → fix in place (may need stem rewrite, exp rewrite, hint rewrite)
- **MED utility + PASS quality** → keep
- **MED utility + FIX quality** → fix only if cheap; otherwise retire
- **LOW utility + any** → retire unless it covers a gap in subtopic 6 (academic inversion for Egor)

Specifically expected outcomes for known-existing IDs:
- `inv01–inv10` (current 10 inversion questions) — most should be retained but
  re-classified into subtopic 5 (business) or 6 (academic). Check level — some
  may need B2→C1 promotion.
- `tf_32`, `emph_i02`, `emph_i03` (S86 fixes) — re-verify they hit the new standards
  including ✗ wrong form contrast in `exp`. S86 fixed mechanics but not
  necessarily the contrastive `exp` standard.
- Everything else in cat:'Emphasis' — categorise by subtopic 1–7.

### Audit deliverable

Before any code changes, produce an audit table for review:

| ID | Current cat | Current level | Subtopic # | Utility | Quality | Action | Notes |
|---|---|---|---|---|---|---|---|

Wait for Artem's confirmation before applying changes.

---

## 6. New question authoring — content guidelines

### Subtopic 1: Cleft sentences (12–15 new/kept)

**Patterns to cover:**
- It-cleft: *It was John who broke it. / It is on Mondays that I work from home.*
- What-cleft (pseudo-cleft): *What I need is a coffee. / What he said was wrong.*
- All-cleft: *All I want is some peace. / All she did was complain.*
- The thing/reason cleft: *The thing is, we missed the deadline. / The reason I'm late is the traffic.*

**Family contexts to use** (no generic "the man went to the shop"):
- Artem: O&G/finance — *It was the Q3 forecast that the board questioned.*
- Anna: home/padel/neighbours — *What I need is a quiet evening.*
- Nicole: K-pop/school — *It was Jin who wrote that song.*
- Ernest: school/sports/gaming — *What I really enjoyed was the away match.*

**Russian L1 traps to highlight in `exp`:**
- Russians often translate *«Это Джон сломал»* as *"This is John broke it"* — wrong. Need *"It was John who broke it"*.
- *«Что мне нужно, так это кофе»* → not *"That I need is coffee"* but *"What I need is coffee."*
- Russian "то, что" calques as "that" — but English requires "what" in pseudo-clefts.

### Subtopic 2: Do-emphasis (8–10)

**Patterns:**
- Present simple emphasis: *I **do** know him.*
- Past simple emphasis: *She **did** finish it.*
- Imperative emphasis: ***Do** come in! / **Do** be careful.*
- Contradiction context: *"You didn't call me." — "I **did** call — three times!"*

**Russian L1 trap:**
Russian uses intonation/particles (*ведь, же*) for this. Without `do`, English
sounds flat: *"I called you"* (neutral) vs *"I did call you"* (defensive/insistent).
Russians under-use this and sound less convincing in arguments.

**Family contexts:**
- B1 questions: simple contradictions in family/school contexts.
- B2 questions: business pushback ("We **do** appreciate the offer, but...").

### Subtopic 3: So/Neither/Nor (6–8) — NEW SUBTOPIC

**Patterns:**
- Positive agreement: *"I love coffee." — "**So do I.**"*
- Negative agreement: *"I haven't seen it." — "**Neither have I.** / **Nor have I.**"*
- Cross-tense matching: must match aux of original.
- *Nor + clause*: literary use, formal writing — *She didn't reply, **nor did he**.*

**Russian L1 trap (most important):**
Russians say *"So am I"* for *"I love coffee"* — wrong aux. Must match:
- *love* → *do* → "So **do** I."
- *am tired* → *am* → "So **am** I."
- *have been* → *have* → "So **have** I."
- *can swim* → *can* → "So **can** I."

This is **THE** characteristic Russian-speaker error in this construction.
Every question's `exp` should hammer the aux-matching rule with the wrong-aux
contrast (✗ "So am I" — wrong because the trigger sentence has *love*, not *am*).

**Question types favoured:**
- multi-blank: choose So/Neither + correct aux + I/he/she
- input: complete the response ("I haven't been to Japan." — Neither ___.)
- transform: rewrite with So/Neither

### Subtopic 4: Intensifiers (8–10) — NEW SUBTOPIC

**Patterns:**
- Gradable vs ungradable adjective + intensifier:
  - *very tired* ✓ / *absolutely tired* ✗ (gradable)
  - *absolutely exhausted* ✓ / *very exhausted* ✗ (ungradable)
- Common ungradable adjectives: *exhausted, freezing, boiling, terrified, starving, devastated, perfect, brilliant, awful, terrible, ridiculous, impossible*
- Common ungradable intensifiers: *absolutely, completely, totally, utterly*
- Comparatives: *way + comparative* — *He's **way smarter** than me.* (informal)
- *Far + comparative* — *This is **far better** than expected.* (formal)

**Russian L1 trap:**
Russian uses *очень* for everything. English distinguishes — *"I'm very exhausted"*
sounds wrong; native says *"absolutely exhausted"*. This is one of the most
audible Russian-accent grammar errors.

**Family contexts:**
- All levels can use these — *That's absolutely brilliant! / I'm completely fine.*

### Subtopic 5: Business/practical inversion (6–8)

**The four patterns Artem uses:**
- *Under no circumstances + aux + subject* — formal "no"
- *Had I/he known... I/he would have...* — counterfactual regret
- *Should you need..., please...* — formal email closer
- *Were we to..., what would...?* — hypothetical

**Family contexts:**
- All Artem-context (O&G, finance, board meetings, vendor letters).
- Optional: 1–2 Anna-context for *Should you need...* in service contexts (replying to estate agent, padel club, school).

### Subtopic 6: Academic inversion (6–8)

**The patterns for Egor's IELTS / Ernest's future:**
- *Never have I / Rarely does / Seldom do*
- *No sooner had X than Y*
- *Hardly had X when Y*
- *Only when X did Y / Only after X did Y / Only by Xing did Y*
- *Not only... but also...*

**Family contexts:**
- Ernest: school/study contexts — *Never have I seen such a difficult exam.*
- Egor: travel/Almaty life — *Not only did the flight delay, but the luggage was lost.*

**Important:** Mark these clearly C1. Do not bleed into B2.

### Subtopic 7: Fronting (3–5)

**Patterns:**
- Object fronting: *That book I'd never recommend.*
- Adverbial fronting (no inversion): *In the corner she found the keys.* (with pronoun = no inversion; with noun = optional inversion)
- Predicate fronting (formal): *Equally important is the budget question.*

⚠️ Distinguish from inversion. Object fronting does NOT use inversion:
- ✓ *That book I'd never recommend.*
- ✗ *That book would I never recommend.*

This contrast must be explicit in `exp` because learners mix up fronting with
negative inversion.

---

## 7. Per-question authoring checklist

Apply KB → Question Structure → "Per-question authoring checklist" to every
question. Specific Emphasis-relevant items:

- **`q` field** = sentence + optional stem word, no trailing parentheticals naming the structure.
- **`hint`** = grammar pattern + word count. Must NOT name the construction (*"inversion"*, *"cleft"*, *"do-emphasis"*) — that gives away the answer.
- **`exp`** = Rule → Why → ✗ wrong form contrast → L1 note (Russian-specific).
- **Answer not in stem.** Especially critical for inversion — never put *only*, *never*, *under no circumstances* in the stem if the answer must contain it.
- **Hint must not repeat category.** Player already sees "Emphasis" label.
- **Transform questions need `source` + `keyword` fields.**

Special Emphasis pitfalls:
- **Cleft validators**: *It was him* and *It was he* are both accepted by natives. Multi-answer with `|` separator.
- **Do-emphasis tricky**: don't set up stems where regular do/does/did is grammatically required (then it's not emphasis).
- **So/Neither aux matching**: validator must accept all reasonable aux forms; reject the common wrong ones in distractors.
- **Inversion stems**: never let the typed answer contain a fronted element that's printed before the blank (S86 tf_32 bug — `Only after` was in the stem and the answer had to repeat it; impossible to type correctly).

---

## 8. Phased delivery

Rather than one mega-session, propose three phases. CC produces deploy + KB
update at the end of each phase.

### Phase 1 — Audit + High-priority new content (~25 questions)
- Audit existing ~20 questions, produce table for review.
- Apply approved fixes (no new IDs yet).
- Add: Cleft (6 new), Do-emphasis (4 new), So/Neither (6 new), Intensifiers (8 new) = 24 new.
- Update KB: subtopic structure, Q count, input share table, version log.
- **Deploy version:** `v{date}-s{N}` (Phase 1 of 3 noted in changelog).

### Phase 2 — Inversion rebalance (~15 questions)
- Re-classify inv01–inv10 + S86 fixes into subtopic 5 vs 6.
- Add: Business inversion (4–6 new), Academic inversion (4–6 new), Fronting (3–5 new) = 11–17 new.
- Update KB: per-subtopic counts.

### Phase 3 — Polish (~5 questions + standards)
- Fill any remaining gaps after Phases 1–2.
- Verify per-category input share ≥20%.
- Verify CEFR distribution matches §3 target.
- Final sparse-array scan, duplicate stem check, all standard pre-deploy checks.

---

## 9. Inputs CC needs from Artem

Before starting Phase 1:
1. **Latest deploy file** uploaded to /mnt/user-data/uploads/ — extract index.html.
2. **Confirmation of subtopic targets** in §2 (or modifications).
3. **Confirmation of the audit decision rules** in §5.

CC should not author new questions until the audit table from §5 has been
reviewed and approved by Artem.

---

## 10. Memory & KB updates expected

After Phase 1 deploy, update KB:
- **Question Structure** → per-category input share table (Emphasis row).
- **Coverage Matrix** → updated counts.
- **Family observations** (if relevant) → e.g., "Artem's Emphasis weakness primarily inversion-driven; Cleft and Do-emphasis previously underweight."
- **Roadmap** → mark Emphasis rebuild Phase 1 done; Phase 2/3 pending.
- **Version Log** → standard changelog entry.

Memory updates after full Phase 3:
- "Emphasis category rebuilt (S{N}–S{N+2}): rebalanced from inversion-heavy to subtopic-balanced."
- Anything learned during the work about player patterns.

---

## 11. Out of scope for this rebuild

Don't do these as part of Emphasis work:
- Splitting Emphasis into separate "Inversion" category. Decision deferred —
  revisit only if subtopic 6 grows beyond ~12 questions.
- Changing the type hierarchy or input/gap definitions.
- Touching Word Order category (separate scope, also has inversion content but
  for adverb placement).

---

**End of spec.**
