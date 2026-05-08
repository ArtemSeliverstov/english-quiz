# Question Schema

The structure of every question in `ALL_QUESTIONS`. Strict schema per type.

For authoring rules (q/exp/hint format, anti-patterns, per-question checklist),
see `question-authoring-standards.md`.

---

## Common fields (all types)

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | always | Unique. Primary key. Changing an ID loses history in `qStats`. See ID conventions. |
| `lvl` | string | always | `B1` \| `B2` \| `C1` \| `C2`. Always set explicitly. |
| `biz` | boolean | always | `true` = professional/business context. Excluded by toggleable filter. |
| `cat` | string | always | Must exactly match one of the 28 defined category strings. Case-sensitive. |
| `type` | string | always | `gap` \| `mcq` \| `input` \| `multi` \| `transform` \| `wordform` \| `error_correction` |
| `q` | string | always | Question text. HTML rendered. Use `___` for blank tokens. **Never use `stem:` — `renderQ` reads `q:` only.** |
| `exp` | string | always | Explanation shown after answering. HTML rendered. |
| `themes` | string[] | always | Closed set of 8 theme tags (s89). At least one entry. See `question-bank-taxonomy.md` §5 for the vocabulary and tagging rule. |
| `hard` | boolean | optional | When `true`, selection logic reduces sampling weight in early category exposure ([index.html:5017](../index.html)) — protects learners from getting hard items before they've built familiarity with the category. ~90 items use it as of s89, mostly B2 phrasal verbs. |

---

## Type-specific fields

### `gap` — fill-in-the-blank with chips

```javascript
{
  id: 'tg01',
  lvl: 'B1',
  biz: false,
  cat: 'Tenses',
  type: 'gap',
  q: 'She ___ here since 2018.',
  opts: ['has worked', 'worked', 'is working'],
  ans: 0,                       // integer index into opts[]
  exp: 'Present perfect with since...'
}
```

**Multi-blank gap**: option uses `' / '` separator. Split at answer time.
Example: `opts: ['have been / were', 'has been / was']`.

### `mcq` — multiple choice (sentence-level)

```javascript
{
  id: 'mv01',
  lvl: 'B2',
  biz: false,
  cat: 'Modal Verbs',
  type: 'mcq',
  q: 'Which is correct?',
  opts: ['She must have left.', 'She must left.', 'She must have leave.'],
  ans: 0,
  exp: '...'
}
```

Used for concept discrimination only. Answer is integer index. Stem must NOT contain `___`
(if it has a blank → use `gap` or `input`).

### `input` — text field

```javascript
{
  id: 'irv01',
  lvl: 'B1',
  biz: false,
  cat: 'Tenses',
  type: 'input',
  q: 'He ___ the report yesterday. (write)',
  ans: 'wrote',
  hint: 'past simple irregular (1 word)',
  exp: '...'
}
```

Matching: case-insensitive, whitespace-normalised. Alternates: pipe-separated string
`'heard|had heard'`. **No fuzzy matching.**

### `transform` — Cambridge-style key-word transformation

```javascript
{
  id: 'tf_02',
  lvl: 'B2',
  biz: true,
  cat: 'Passive Voice',
  type: 'transform',
  source: 'People believe that the CEO will resign.',
  keyword: 'BELIEVED',
  q: 'The CEO ___ resign.',
  ans: 'is believed to',
  exp: '...'
}
```

`source` shows the original sentence, `keyword` shows the mandatory word
(uppercase by convention), `q` shows the target frame with the gap. `ans`
is a string with pipe-separated valid forms (same matching as `input`).
**The keyword stem must appear in the answer** (validated at runtime,
[index.html:5747](../index.html)) — `keyword: 'BELIEVED'` requires `believed`
in the answer string. 54 in bank as of s89, mostly Passive Voice,
Conditionals, Reported Speech, Phrasal Verbs.

### `wordform` — affixation drill (Word Formation only)

```javascript
{
  id: 'wf_01',
  lvl: 'B2',
  biz: true,
  cat: 'Word Formation',
  type: 'wordform',
  q: "The board's ___ surprised everyone.",
  base: 'DECIDE',
  ans: 'decision',
  hint: 'noun (1 word)',
  exp: '...'
}
```

`base` shows the prompt root in uppercase; learner produces the correct
derived form. `ans` is a string (or pipe-separated alternates) matched as
input. **Production type, not recognition** — counts toward the player's
production exposure even though the input-share metric is currently
input-only (see "production share" question in plans).
40 in bank as of s89. **Field name is `base`, not `root`** — the renderer
([index.html:5263](../index.html)) reads `q.base`. Items missing this field
render "Form a word from: undefined".

### `error_correction` — Russian L1 error-spotting (s89)

```javascript
{
  id: 'ec_b05',
  lvl: 'B1',
  biz: false,
  cat: 'Tenses',
  type: 'error_correction',
  error_type: 'tense_aspect',
  q: 'I am living in Bahrain since 2019.',
  ans: 'i have been living in bahrain since 2019|i have lived in bahrain since 2019',
  hint: 'duration starting in the past, continuing now',
  exp: '...'
}
```

Stem `q` contains exactly one L1-typical error embedded. Learner types the
corrected sentence; `ans` is pipe-separated (case/whitespace-tolerant).
**Scoring is tolerant**: case-insensitive, whitespace-normalised, trailing
punctuation dropped, unambiguous contractions expanded on both sides
(`I've` ↔ `I have`, `isn't` ↔ `is not`, etc.).

`error_type` is closed-set: `article` / `preposition` / `tense_aspect` /
`verb_form` / `word_order` / `quantifier` / `pronoun` / `other`.
Required — drives audit-time tracking of L1-pattern coverage.

`hint` is optional — narrows where to look without giving the fix.
`exp` must include a Russian L1 note (the rule plus why it's a typical L1
error, e.g., "Russian *прибыли в* doesn't map to *arrive to*").

12 in bank as of s89. Targets the documented L1-interference patterns from
`family-profiles.md` (article drops, preposition swaps, present-perfect
collapse, etc.).

### `multi` — multi-blank with independent options

```javascript
{
  id: 'mc01',
  lvl: 'B2',
  biz: false,
  cat: 'Articles',
  type: 'multi',
  intro: '<strong>Rule</strong>: Use the for...',
  q: '___ company signed ___ deal.',
  blanks: [
    { opts: ['The', 'A', '—'], ans: 0 },
    { opts: ['a', 'the', '—'], ans: 0 }
  ],
  exp: '...'
}
```

Each blank has its own `{opts, ans}`. User answers one blank at a time. Scored
whole — all blanks must be correct.

`intro` is HTML callout shown above the sentence before any attempt.

**UI label rules** (enforced):
- Type badge: always "FILL THE GAP" for multi (never "ARTICLE CHAINS")
- Chip label: always "Select answer for blank N:" (never "Select article")

---

## Field overview by type

| Field | gap | mcq | input | multi | transform | wordform | error_correction |
|---|---|---|---|---|---|---|---|
| `opts` | ✓ | ✓ | — | — (inside `blanks[]`) | — | — | — |
| `hint` | ✗ never | ✗ never | ✓ required* | ✗ never | optional | ✗ never | optional |
| `intro` | ✗ never | ✗ never | ✗ never | optional | ✗ never | ✗ never | ✗ never |
| `blanks` | — | — | — | ✓ required | — | — | — |
| `source` | — | — | — | — | ✓ required | — | — |
| `keyword` | — | — | — | — | ✓ required | — | — |
| `base` | — | — | — | — | — | ✓ required | — |
| `error_type` | — | — | — | — | — | — | ✓ required |
| `exp` | ✓ required | ✓ required | ✓ required | ✓ required | ✓ required | ✓ required | ✓ required |

*`hint` is required for `input` except G&I questions using the standard bracket format
(see `question-authoring-standards.md` § hint format).

Gap/mcq/multi never have hints. Hint is shown immediately before the first attempt.
The `exp` teaches the rule; the `hint` guides production. Never overlap.

---

## Critical schema rules

**Never use `stem:` as field name.** `renderQ` reads `q:` only — `stem:` is silently
ignored, producing a blank question card. Everyday English questions historically used
`stem:` (s66r4 bug); the runtime now normalises but new questions must use `q:`.

**`gap`/`mcq` `ans` must be an integer.** `ans: 0` not `ans: 'Sounds lovely'`. String
ans silently fails the answer comparison (s66r4 bug).

**`gap`/`mcq` `ans` index counts from 0**, matching `opts[]` array order.

**`input` `ans` is a string.** Pipe-separated for alternates: `'heard|had heard'`.
The split is done at answer time — see s66r7 bug fix.

**`multi.blanks` count must equal `___` token count in `q`.**

---

## ID Conventions

IDs follow prefix + sequential number. **IDs are permanent** — changing one loses
that question's history in `DB.qStats`. When adding questions, grep the source for
the prefix, find the highest existing number, continue sequentially. **Never reuse
a retired ID.**

**Permanently retired IDs (do not reuse)**: qt01, qt02, wt01.

For the full prefix → category mapping, see the version of the KB you're working
from. The mapping is stable but the active range increments per session.

Common active prefixes (selected examples):

| Prefix | Category | Meaning |
|---|---|---|
| `aph` | Articles | Generic article gap (main batch) |
| `art` | Articles | Article gap (topic series) |
| `tg` | Tenses | Tense gap (main batch) |
| `irv` | Tenses | Irregular verbs input |
| `pv_b` | Phrasal Verbs | B series (B1 core) |
| `pv` | Phrasal Verbs | General (B2) |
| `gi` | Gerunds & Infinitives | Gerund/infinitive |
| `voc` | Vocabulary | General |
| `wc` | Word Choice | Confusables |
| `prep` | Prepositions | General |
| `cond` | Conditionals | General |
| `mvc` | Modal Verbs | C1 |
| `rs` | Reported Speech | General |
| `rc` | Relative Clauses | General |
| `idom` | Idioms | General |
| `emph` | Emphasis | Inversion / emphatic |
| `tf_` | (various) | Transform — Key Word |
| `wf_` | Word Formation | Wordform |
| `qt_i` | Quantifiers | Input series (s89, B1) |
| `refl`, `reflop`, `reflby` | Pronouns | Reflexive series (migrated s89) |

Full prefix list with current ranges lives in the source KB. When adding to a prefix,
verify the highest existing number first.

---

## Categories (28 total, post Grammar migration s89)

Active categories (must match `cat` field exactly, case-sensitive):

Articles · Tenses · Gerunds & Infinitives · Vocabulary · Word Choice · Prepositions
· Phrasal Verbs · Passive Voice · Used To · Question Formation
· Indirect Questions · Modal Verbs · Linking Words · Conditionals · Collocations
· Reported Speech · Relative Clauses · Idioms · Emphasis · Adjectives · Word Order
· Comparisons · Quantifiers · Word Formation · Pronouns · Irregular Verbs
· Everyday English · Grammar (≈0 after migration; reserved as fallback only)

Authoritative count and per-category numbers live in the **Coverage Matrix** section
of the source KB and are dynamically generated.

---

## Schema migration history

- s66r4: `stem:` → `q:` migration. 20 EE questions corrected. `renderQ` normalises legacy.
- s66r7: pipe-separated `ans` split at answer time (was treating whole pipe string as one value)
- s78 → s82: `ALL_QUESTIONS` moved to Firebase RTDB → reverted; questions back inline
- s84: `consec` field added per-question stat for interval scaling
- s87: storage migrated RTDB → Firestore (questions remain inline, stats fields preserved)
- s89: `themes` field added (closed-set array, 8 tags) — see `question-bank-taxonomy.md`
- s89: schema review found `wordform` field is `base` (not `root`); 40 items back-filled with derived bases. Long-standing UI bug ("Form a word from: undefined") fixed.
- s89: `hard` field documented (was undocumented but used at runtime for selection weighting).
- s89: `linked_question_ids` field stripped from 18 items — populated but never read by runtime; dead data removed.
- s89: `error_correction` type added (Wave 0g) — Russian L1 pattern recognition. Tolerant matching (contractions + punctuation tolerance). 12 baseline items at B1+B2.
