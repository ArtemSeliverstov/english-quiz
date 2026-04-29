# Question Authoring Standards

The canonical reference for writing or editing questions. Run the per-question
checklist below before adding any new question to the bank.

For schema (field types, structure), see `question-schema.md`.

---

## Type hierarchy — pick the highest-value type the topic supports

| Rank | Type | Cognitive demand | Use when | Target share |
|---|---|---|---|---|
| 1 | input | Free production — retrieve from memory | Topic supports unambiguous typing. Irregular verbs, phrasal verbs, collocations, prepositions in fixed phrases. | ≥20% per category |
| 2 | gap | Constrained production — select from visible options | Topics with 2–4 plausible same-category options. Tenses, articles, conjunctions. Workhorse type. | ~55–60% |
| 3 | multi | Multiple constrained decisions — each blank independent | Transformational exercises. Reported speech backshift, conditional transformations. | ~5% (expand cautiously) |
| 4 | mcq | Recognition — select correct complete sentence | Sentence-level discrimination only — when contrast requires whole-sentence reading. | ~8% (reduce over time) |

**Never use MCQ when the stem has a `___`** — that's a `gap` or `input`.

---

## Per-category input target

≥20% input share applies **at category level**, not just overall. Categories with the
lowest input share are often the highest-value for Russian speakers (articles,
conditionals, tenses).

Audit per-category input share before any content sprint. The current per-category
table lives in the source KB → "Per-category input target" section. Update that table
whenever input questions are added.

---

## Hint format (input only)

Format: `"semantic description (N words)"` — description first, word count last.
Word count always included.

**Calibration rule**: hint must narrow the answer space without naming the target.
A learner who knows it should retrieve it; one who doesn't should not be able to
guess it from the hint alone.

### Sub-type templates

| Topic | Format | Example |
|---|---|---|
| Irregular verbs | `past simple/participle of VERB (N words)` | `past simple of THINK (1 word)` |
| Phrasal verbs | Meaning paraphrase + word count + tense qualifier. Don't name the PV. | `established or founded (2 words — past tense)` |
| Idioms | Meaning paraphrase. Word count alone never enough. | `exact literal wording of a rule (1 word)` |
| Vocabulary | Part of speech + meaning paraphrase. Don't name word. | `noun: a challenge that must be overcome (1 word)` |
| Prepositions | Name the relationship/collocation — not just "preposition". | `preposition: on/by/for your own — which? (1 word)` |
| Collocations | Verb meaning paraphrase + word count. Don't name verb. | `formally submit your resignation (2 words)` |
| Linking words | Logical relationship + word count + syntactic constraint. | `concession connector + noun phrase (1–3 words)` |
| Tense backshift | Show transformation arrow — never target form. | `(1 word — backshift) will → ___` |
| G&I patterns | Standard format: pattern verb in stem, complement verb in bracket. NO HINT NEEDED. | `She avoided ___ (MAKE) eye contact.` (no hint) |
| Articles | Name the rule. Zero-article: instruct to write `–`. | `article or no article? (write – if none)` |

**Hints must NOT**:
- Contain any word of the answer
- Offer either/or choice with the answer inside (`let or make? (1 word)` — wrong)
- Name the grammar rule, tense, voice, or construction (`present perfect (2 words)` — wrong)
- Repeat category information already shown to player

---

## Exp format (all types)

Required for every question. Three sentences max, ~250 plain-text chars max,
≤ 5 HTML tags.

**Required structure** (from S25 standard, S63 enforcement):

1. **Rule statement** — what the pattern is
2. **Why it works** — brief reasoning
3. **Contrast** — explicit comparison to most common wrong choice (`✗`, "not X", "unlike", "whereas", "but not", or naming a specific wrong option)
4. **L1 note** — for required categories: Articles, Tenses, Prepositions, Conditionals, Quantifiers, Word Order, G&I

### Anti-pattern → good pattern

```
✗ "Decide + infinitive. He decided to leave."
   (states fact only, no pattern, no contrast)

✓ "Decide takes to + infinitive — points forward to a planned action:
   decided to leave / to resign. Compare enjoy/avoid which take -ing
   (backward-looking)."
```

```
✗ "Agree is a stative verb — no progressive."
   (names rule, no contrast, no L1 note)

✓ "Agree is stative — no -ing form. Russian uses a present-tense equivalent
   where English would use a progressive, but stative verbs (agree, know, own)
   never take -ing in any tense."
```

### Articles — pattern-specific L1 notes (S84 standard)

Generic "Russian has no articles" is too vague. Use these patterns:

| Pattern | L1 note template |
|---|---|
| a→the (shared knowledge) | "Think: would you say этот/тот in Russian? If yes → 'the'." |
| zero (uncountable) | "'progress/information' = uncountable — no article, same as Russian." |
| prep+art | "'of' makes the noun specific → needs 'the'. Compare: 'in procurement' (no 'the')." |
| fixed (memorise) | "Fixed phrase — memorise as a chunk: 'take action', like Russian 'принять меры'." |
| dropped | "Russian uses word order for definiteness; English uses articles instead." |

**B1 only**: add этот/тот bridge with caveat — "Works for ~60% of 'the' contexts, not for play the piano, the UK, or 'the whale is endangered'."

### Multi exp: unified vs per-blank

If all blanks test the same rule, write one unified exp. If blanks test different
sub-rules, use per-blank bullets separated by `<br>`. Never write per-blank bullets
when the rule is the same.

---

## Multi-blank guard (canonical)

Mobile tap events are not reliably single-fire. The `answerMultiBlank` function MUST
have this guard as its first statement:

```javascript
if (!multiState || multiState.results.length !== blankIdx) return;
```

Any re-entry returns immediately. **Never remove this guard.** Without it, double-tap
on mobile pushes a duplicate into `multiState.results`, the next blank goes
out-of-bounds, the function crashes silently, and the Next button is permanently
disabled.

---

## Multi-blank limits

- 2–3 blanks max for new questions
- Existing `mc01–mc15` are grandfathered (predate the cap)
- If a transformational exercise has 4+ changes, split into two separate questions

---

## Per-question authoring checklist

Run on every new or edited question before adding to the batch.

### Schema completeness
- All required fields present (id, cat, lvl, biz, type, exp, q + type-specific)
- `q:` not `stem:` (renderQ reads only `q:`)
- gap/mcq `ans` is integer (0, 1, 2…) — never string value
- `biz:` field present
- `type:` field present and correct

### Type selection
- Could MCQ become gap or input? (single word/phrase choice → gap; unambiguous typing → input)
- input preferred over gap where topic supports
- mcq stem has no `___` (if it does → must be gap or input)
- multi has ≤ 3 blanks

### MCQ quality
- Stem specificity — does q name the topic/structure being tested? "Which is correct?" alone is too generic.
- Minimum 3 options (2-option MCQ = 50% guess rate; unacceptable)
- All wrong options grammatically well-formed (Grammar categories) OR register-inappropriate not ungrammatical (Everyday English)

### Answer / structure
- Answer NOT in stem (does stem already contain or imply the answer word? → rewrite)
- ans index correct (count from 0, verify against opts[])
- input: all valid surface forms pipe-separated in ans
- Answer scope test: blank tests grammar pattern, not vocabulary recall — move reproducible words into stem
- multi: blanks[] count matches `___` count in q
- AMBIGUOUS ANS: substitute each option into stem — could native speaker use more than one? → add all correct forms or rewrite distractor

### Gap option quality
- Min 3, max 4 options (binary-topic exceptions: -ed/-ing adjectives, which/that defining, who/whom, used to/would)
- All options same part of speech, all grammatically plausible in stem
- Shared-word duplication test: any content word appearing in stem AND options? → move to stem, strip from options
- "Missing competitor" test: any obvious valid answer NOT in opts? (e.g. used to/would both work for this stem → rewrite stem)
- ≥ 2 distractors genuinely plausible (not eliminable by any B1+ learner)
- Adverb-in-stem lock: if stem has often/always/every day after the blank, verify adverb doesn't make two options equally correct

### Hint (input only)
- gap/mcq/multi: NO hint field
- input: hint field present (Exception: G&I standard format → no hint)
- Giveaway test: read hint alone — does it name any answer word, offer either/or with answer, describe pattern using target form? → rewrite
- Rule-language test: hint names grammar rule/tense/voice/construction? ("present perfect", "passive", "modal verb") → remove
- G&I input format: pattern verb in stem, complement verb in bracket. No hint.
- Answer-in-stem check: no content word of answer appears verbatim in stem before/after blank
- Stem self-test: could learner fill blank correctly without seeing hint?
- Stem blank count: exactly one `___` (never `___ ___` — adjacent blanks render as two gaps)
- Stem cue check: `___ (VERB)` bracket gives COMPLEMENT verb only, never PATTERN verb

### Intro (multi only)
- Pre-attempt spoiler test: read what learner sees BEFORE attempting — is answer visible?
- Intro is generic category label only, doesn't name answer form

### Exp (all types)
- exp field present (zero tolerance)
- exp explains pattern, not just restates answer
- Contrast test: exp contains at least ONE explicit wrong-choice comparison (`✗`, "not X", "unlike", etc.)
- EXP CONTRADICTS ANS: does exp call any non-keyed option "also correct"? → update ans[] or rewrite exp
- L1 note for required categories: Articles, Tenses, Prepositions, Conditionals, Quantifiers, Word Order, G&I
- Articles: use pattern-specific L1 templates (S84 standard), not generic
- multi exp: unified if same rule, per-blank if different sub-rules
- exp ≤ 3 sentences, ≤ ~250 chars, ≤ 5 HTML tags

### Level appropriateness
- Would a learner at this CEFR level encounter this in a standard textbook?
  - B1: everyday grammar, common tenses, basic modals, simple conditionals (0/1/2)
  - B2: all tenses incl. perfect continuous, 3rd conditional, reported speech, phrasal verbs
  - C1: inversion, advanced modals (needn't have), mixed conditionals, nuanced connectors
  - C2: literary/archaic forms, subtle register distinctions, rare idioms
- Cross-player error flag: if ≥60% error rate across 3+ players, verify level before assuming topic is just hard

### Duplicate stem check
- Grep first 6+ unique words of new stem in ALL_QUESTIONS — confirm no existing ID has identical stem
- Gap/input pairs sharing stem are acceptable; identical type+stem are not

### New category check
- Any new question introducing a new `cat` value → add cat-btn chip to HTML cat-filter-wrap (alphabetically)
- Verify chip count == number of distinct cat values in ALL_QUESTIONS

### Post-stats review (after stats analysis, not per-question)
- Flag any question with ≥60% error rate across 3+ distinct players → quality review
- Review flagged: stem ambiguity? options plausible? exp adequate? Level correct?
- If question passes review, strengthen exp and/or add hint
- If genuinely ambiguous, fix or drop

### Articles — additional checks (S84)

- DISCOURSE STEM: B2+ a→the questions MUST use two-sentence stems (sentence 1 establishes referent, sentence 2 has blank). Single-sentence stems only for zero-article rules and fixed expressions.
- PATTERN TAG: exp ends with pattern label: a→the (shared knowledge), zero (phantom article), prep+art, fixed, dropped
- L1 NOTE SPECIFICITY: use pattern-specific templates (above)
- RUSSIAN BRIDGE (B1 only): exp includes этот/тот scaffold with breakdown caveat
- NP COMPLEXITY (B2+): ~30% of stems with pre-modified NPs (adj + noun); ~20% with heavily modified NPs (2+ modifiers)
- FLUCTUATION CELL: identify which cell of [±definite × ±specific] matrix the question targets

### Transform — additional checks

- Keyword does NOT appear in source/stem — must be producible only through answer
- Answer length minimised — restructure stem to push vocabulary out of answer
- `source` and `keyword` fields present (required for transform type)

---

## Questions are stored inline

`ALL_QUESTIONS` is inline in `index.html`. Do not migrate it to Firestore or any
external store — that experiment failed in s78–s82.

---

## When adding questions

1. Read `coverage-matrix.md` (or the source KB's coverage matrix section) — identify highest-priority gaps
2. Show proposed-changes table for review BEFORE applying edits
3. Check ID prefix → continue from highest existing number
4. Run per-question checklist on each new entry
5. Run pre-deploy checklist after batch insertion (`pre-deploy-checklist.md`)
6. Update `LEVEL_TOTALS` and `CAT_TOTALS` in `renderCoverage()` and `playerCoverageHTML()`
7. Update per-category input share table if input share changed
