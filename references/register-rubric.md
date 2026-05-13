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

| Consumer | Purpose | Status |
|---|---|---|
| Free Write worker prompt | Emits the rubric per session | Live (v20260512-r3) |
| `coachWriteSessionLogStandalone` (PWA) | Persists to Firestore | Live (v20260512-r3) |
| `stats-review` skill | Aggregates per-player rolling means + trends; flags drift (rules below) | **Live** (2026-05-13) |
| `mistakes-review` (future) | Cross-checks high `calque_count` against the captured swaps in `phrase_tracker` | Future |

---

## Stats-review aggregation

Daily `stats-review` runs read this field per player. Procedure:

1. **Filter** `coach_sessions[]` to entries where `register_rubric.confidence == "high"`. Low-confidence rubrics are silently dropped (same convention as `assessment`).
2. **Aggregate per axis** (`chunk_density`, `register_match`, `calque_count`, `discourse_marker_variety`):
   - **Latest** value (most recent scored session).
   - **Last-5 rolling mean** (chronological, most recent 5 scored sessions).
   - **Trend Δ** vs the prior 5 sessions: `Δ ≥ 0.5` → up; `Δ ≤ -0.5` → down; else flat.
3. **Sparse-data caveat**: if fewer than 3 scored sessions, render the numbers but suffix `[sparse]` and skip the flags. Don't infer trend on 1–2 data points.

### Flag rules (per player, evaluated after the rolling mean computes)

| Condition | Reading | Suggested action |
|---|---|---|
| `chunk_density` mean <3 across 3+ scored sessions | Low chunk reach. Player paraphrases L1-style instead of reaching for native chunks. | Phrase recall focus (P1.2-shape exercise) or natural-phrases-tracker review. |
| `calque_count` mean ≥2/session AND `phrase_tracker.entries` has zero `fw`-sourced entries in the same period | Capture path may be silently failing for this player. | Investigate worker prompt or PWA passthrough; compare to Anna's working pipeline. |
| `discourse_marker_variety` mean = 0 across 3+ sessions | Chat-style conversational scaffolding absent. May be the prompt format (narrative vs chat) suppressing them rather than a real gap. | Watchlist initially; if persists after a chat-prompted session, recent_observation note. |
| `register_match` mean <3 across 2+ sessions | Context mismatch — over/under-formal for the stated theme. | `recent_observations` entry. Re-examine player's profile theme tags. |

Flags emit as `[inferred]` evidence-tagged items (not `[data]`) since rubric scores are model-judged, not directly observed counts. Promotion to `weak_patterns` follows the standard 2-session rule.

### Output shape in stats-review

Per player, under `### Register fluency`:

```
| Axis | Latest | Last-5 mean | Δ vs prior 5 |
|---|---|---|---|
| chunk_density | 2 | 2.4 | ↓ |
| register_match | 4 | 3.8 | flat |
| calque_count | 2 | 1.6 | flat |
| discourse_marker_variety | 0 | 0.2 | flat |

Flags: [inferred] chunk_density <3 sustained — phrase recall focus recommended.
```

Sparse-data shape (n<3):

```
| Axis | Latest | n |
|---|---|---|
| chunk_density | 2 | 1 [sparse] |
| ... |

Flags: none (sparse data — need 3+ scored sessions for trend reading).
```

---

## Versioning

If the rubric's dimensions or anchors change, bump the schema field — store as `register_rubric.rubric_version: 1` going forward. Today's first version is implicit `v1` (no version field on the doc); add an explicit field on the next revision so old and new sessions can be compared on the right axis.
