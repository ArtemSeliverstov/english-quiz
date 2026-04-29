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
| `cat` | string | always | Must exactly match one of the 27 defined category strings. Case-sensitive. |
| `type` | string | always | `gap` \| `mcq` \| `input` \| `multi` |
| `q` | string | always | Question text. HTML rendered. Use `___` for blank tokens. **Never use `stem:` — `renderQ` reads `q:` only.** |
| `exp` | string | always | Explanation shown after answering. HTML rendered. |

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

| Field | gap | mcq | input | multi |
|---|---|---|---|---|
| `opts` | ✓ | ✓ | — | — (inside `blanks[]`) |
| `hint` | ✗ never | ✗ never | ✓ required* | ✗ never |
| `intro` | ✗ never | ✗ never | ✗ never | optional |
| `blanks` | — | — | — | ✓ required |
| `exp` | ✓ required | ✓ required | ✓ required | ✓ required |

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

Full prefix list with current ranges lives in the source KB. When adding to a prefix,
verify the highest existing number first.

---

## Categories (27 total)

Active categories (must match `cat` field exactly, case-sensitive):

Articles · Tenses · Gerunds & Infinitives · Vocabulary · Word Choice · Prepositions
· Phrasal Verbs · Passive Voice · Grammar · Used To · Question Formation
· Indirect Questions · Modal Verbs · Linking Words · Conditionals · Collocations
· Reported Speech · Relative Clauses · Idioms · Emphasis · Adjectives · Word Order
· Comparisons · Quantifiers · Word Formation · (+ 2 in expansion)

Authoritative count and per-category numbers live in the **Coverage Matrix** section
of the source KB and are dynamically generated.

---

## Schema migration history

- s66r4: `stem:` → `q:` migration. 20 EE questions corrected. `renderQ` normalises legacy.
- s66r7: pipe-separated `ans` split at answer time (was treating whole pipe string as one value)
- s78 → s82: `ALL_QUESTIONS` moved to Firebase RTDB → reverted; questions back inline
- s84: `consec` field added per-question stat for interval scaling
- s87: storage migrated RTDB → Firestore (questions remain inline, stats fields preserved)
