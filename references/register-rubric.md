# Register Rubric

Scoring guide for conversational register fluency. Applied silently by the Free Write worker at session end. Never shown to the learner.

**Purpose**: produce a longitudinal signal for the project's stated mission — *"improving English, especially conversational register, for 5 Russian-speaking family members"*. The existing `assessment` block grades general CEFR proficiency. The rubric below targets register specifically: chunk reach, context fit, L1 interference, and conversational scaffolding.

**Out of scope**: pronunciation, intonation, listening, reading comprehension. This rubric measures only the **register quality of typed conversational production**.

---

## Field shape

Emitted in the Free Write `<session_meta>` block alongside `assessment`. Persisted on `players/{name}/coach_sessions/{fw_*}.register_rubric` (see `firestore-schema.md`).

```jsonc
"register_rubric": {
  "chunk_density":              <1..5>,
  "register_match":             <1..5>,
  "calque_count":               <integer >= 0>,
  "discourse_marker_variety":   <integer >= 0>,
  "confidence":                 "high" | "low"
}
```

`confidence: "low"` when the learner's sample is too small (<3 sentences), off-topic, or the worker is guessing. Low-confidence rubrics are silently dropped from any trend by downstream consumers (same convention as `assessment.confidence`).

---

## Dimensions

### 1. `chunk_density` (1–5)

How much of the learner's production reaches for **native-typical multi-word chunks** (collocations, fixed phrases, idiomatic phrasal verbs) vs **L1-paraphrase** (rebuilding meaning word-by-word from the learner's L1 schema).

Grade against the learner's CEFR level — a B1 producing one solid chunk per turn ranks the same as a C1 producing five.

| Score | Anchor |
|---|---|
| **1** | Almost everything paraphrased. Near-zero idiomatic chunks. Production reads as translated-from-Russian. |
| **2** | Occasional chunk. Most clauses built from scratch with L1 logic. |
| **3** | Mix: some chunks land, plenty of paraphrase. Typical mid-B1/B2 floor. |
| **4** | Chunks dominate; paraphrase appears only when no chunk available for the meaning. |
| **5** | Native-typical chunk reach for the level. Multiple chunks per minute, used flexibly (not just memorised). |

### 2. `register_match` (1–5)

How well the learner's register matched the **stated context** (the player's profile theme tags + any context cue from the conversation — e.g. `[biz_oil]` business chat vs `[brit_expat]` weekend banter vs `[home_daily]` family talk).

Both directions of mismatch count against the score (textbook-formal in casual chat *and* over-casual in business writing are both register-misses).

| Score | Anchor |
|---|---|
| **1** | Textbook-formal applied to casual chat, OR vice versa. Sustained mismatch. |
| **2** | Mostly off-register; one or two phrases land. |
| **3** | Register roughly right but uneven; switches mid-clause without intent. |
| **4** | Consistently in-register with one or two slips. |
| **5** | Register-fluent throughout, including hedges, softeners, and discourse-management moves appropriate to the context. |

### 3. `calque_count` (integer ≥ 0)

Count of **distinct** L1 Russian calques surfaced in the session. Surface-form repetitions don't double-count — `"on next week"` said three times = 1.

Examples:
- preposition: `depend from`, `wait me`, `on next week`, `listen for music`
- verb+noun: `make homework`, `take a decision`, `do a mistake`
- structural: `feel myself`, `most of students`, `despite of`
- intensifier+adj: `very enormous`, `really absolutely`

Don't count stylistic preferences or learner choices that are merely awkward but not L1-derived.

### 4. `discourse_marker_variety` (integer ≥ 0)

Count of **distinct** conversational discourse markers the learner used unprompted. Just the count of distinct markers, not the count of uses.

Recognised markers (non-exhaustive): `so | well | actually | I mean | the thing is | right | look | anyway | yeah | oh | hmm | you know | kind of | sort of | basically | honestly | I guess | I suppose | to be fair | mind you`

Excluded: sentence connectors that aren't conversational management (`however`, `furthermore`, `additionally`, `nevertheless`). Those are essay register, not conversational.

---

## Scoring discipline

- **Grade against the player's level**, not a universal C2 ceiling. A B1 producing 2 chunks reasonably well is a 3 on `chunk_density`, not a 1.
- **`register_match` weights consistency over peak performance**. One brilliant idiomatic line in an otherwise textbook session is still a 2–3.
- **Low confidence is fine and preferable to inflated grades**. Sessions <3 learner sentences, off-topic, or where the player only answered yes/no → `confidence: "low"`.
- **Never mention the rubric to the learner.** Same rule as the `assessment` block.

---

## Consumers

| Consumer | Purpose |
|---|---|
| Free Write worker prompt | Emits the rubric per session |
| `coachWriteSessionLogStandalone` (PWA) | Persists to Firestore |
| `stats-review` (future) | Aggregates per-player rolling means + trends; flags drift |
| `mistakes-review` (future) | Cross-checks high `calque_count` against the captured swaps in `phrase_tracker` |

Until `stats-review` reads the field, the rubric is **dark instrumentation** — accumulating on every Free Write session, available for inspection but not auto-actioned.

---

## Versioning

If the rubric's dimensions or anchors change, bump the schema field — store as `register_rubric.rubric_version: 1` going forward. Today's first version is implicit `v1` (no version field on the doc); add an explicit field on the next revision so old and new sessions can be compared on the right axis.
