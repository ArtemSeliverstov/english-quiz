# Interview Rubric

Scoring guide for **spoken interview-prep** sessions. Applied silently by the `/interview-prep` CC skill at session end. Never shown to the learner.

**Purpose**: produce a longitudinal signal for Artem's CFO / GCC (KSA / Qatar / UAE) / O&G + construction interview preparation. The existing `register_rubric` measures conversational register at the *language* level — and applies unchanged to spoken transcripts. This rubric targets interview-specific *delivery* axes the register rubric doesn't capture: narrative structure, concrete specificity, confidence balance, and basic delivery metrics (WPM, fillers, pauses).

**Out of scope**: pronunciation phoneme accuracy, prosody scoring, listening comprehension. Whisper transcripts don't carry the signal for those. See `plans/audio-coach-pipeline.md` "What this plan deliberately does not include" for why phoneme-level scoring is parked.

---

## Field shape

Emitted in the `/interview-prep` session-end metadata. Persisted on `players/artem/coach_sessions/{ip_*}.interview_rubric`.

```jsonc
"interview_rubric": {
  "structure_score":           <1..5>,
  "specificity_score":         <1..5>,
  "confidence_balance":        <1..5>,
  "avg_wpm":                   <number, sessions-wide>,
  "avg_filler_density_per_min": <number, sessions-wide>,
  "avg_pause_ratio":           <number, 0..1, sessions-wide>,
  "per_turn_summaries": [
    { "turn": 1, "score": <1..5>, "note": "STAR clean, weak on numbers" }
  ],
  "confidence":                "high" | "low",
  "rubric_version":            1
}
```

The `register_rubric` (chunk_density, register_match, calque_count, discourse_marker_variety) lives alongside it on the same session doc, applied to the spoken transcript unchanged. **Register-fit anchor for interview context**: "interview-formal — confident but warm, no over-formality (no `furthermore`/`nevertheless`), no over-casual (no `like`/`you know` at high density). Hedges allowed when uncertainty is genuine; not allowed as a tic."

`confidence: "low"` when:
- fewer than 3 spoken turns, OR
- average turn length < 10 seconds, OR
- transcript quality looks degraded (multiple [unclear] markers from Whisper).

Low-confidence rubrics are silently dropped from any trend by downstream consumers (same convention as `register_rubric` and `assessment.confidence`).

---

## Dimensions

### 1. `structure_score` (1–5)

Narrative architecture across the session. **For behavioral questions**: STAR (Situation → Task → Action → Result) clarity. **For technical/financial questions**: argument structure (claim → reasoning → number → caveat). **For situational/case questions**: decision frame (constraint → option set → criterion → choice).

Grade across the **session**, not turn-by-turn — per-turn detail goes in `per_turn_summaries`.

| Score | Anchor |
|---|---|
| **1** | Free-form ramble. No discernible structure across the answer. Loops back to the same point, no resolution. |
| **2** | Structure attempted but breaks down — STAR sketches a situation then never lands a result, or a technical answer states a claim with no supporting reasoning. |
| **3** | Structure present but uneven. One answer is STAR-clean; the next is unstructured. Typical mid-prep baseline. |
| **4** | Consistent structure across answers. Occasional skipped step (e.g. action implied not stated) but the listener follows the arc. |
| **5** | Polished structure on every answer. Clear setup, action, result. For technical answers, explicit "I'd start with X because Y, then Z. The trade-off is W" framing. Interview-ready. |

### 2. `specificity_score` (1–5)

Concrete vs vague. Hard interview signal — interviewers consistently report that the difference between a strong and weak CFO answer is whether the candidate cites a **number**, a **timeframe**, or a **named-stakeholder consequence** vs talking in abstractions.

| Score | Anchor |
|---|---|
| **1** | All abstractions. "We improved efficiency." "The team performed well." No numbers, no names, no dates. |
| **2** | Mostly vague with one or two specifics dropped in — usually a project name without a number, or a timeframe without an outcome. |
| **3** | Roughly half-and-half. Some answers have concrete numbers; others stay abstract. |
| **4** | Most answers carry at least one concrete number or named consequence ("we cut DSO from 95 to 62 days over Q3 by..."). Occasional vague answer slips through. |
| **5** | Every answer grounded in specifics — numbers, percentages, durations, named projects, named stakeholders. Concrete throughout. |

### 3. `confidence_balance` (1–5)

Calibration between **hedging** (uncertainty markers like *I think*, *probably*, *maybe*, *sort of*, *I'd say*) and **assertion** (declarative statements without softeners). Both extremes hurt interview signal:

- **Over-hedged** reads as not confident in own work — and CFOs need to defend numbers under board pressure.
- **Over-asserted** reads as missing nuance — and a CFO who never says "the assumption here is..." or "if X holds..." sounds naïve.

Strong CFO speech balances: assert facts and accomplishments crisply; hedge assumptions, future projections, and where there's genuine uncertainty.

| Score | Anchor |
|---|---|
| **1** | Severe imbalance. Either every clause hedged (*I think*, *probably*, *maybe* on facts the speaker should own) OR every clause asserted with no acknowledgement of uncertainty. |
| **2** | Mostly imbalanced — the speaker defaults to one mode and only occasionally switches. |
| **3** | Roughly right but inconsistent. Asserts past actions correctly but also asserts future projections without caveats. |
| **4** | Generally well-calibrated. Hedges land on genuine uncertainty (assumptions, projections, third-party intent); assertions land on owned actions and verified numbers. One or two slips. |
| **5** | Sounds like a senior leader. Asserts when asserting is right, hedges precisely where the speaker actually doesn't know, names the assumption when there is one. |

### 4. Delivery metrics (numeric, not 1–5)

#### `avg_wpm` (words per minute, session-wide)

Target band for interview speech: **140–170 WPM**. Below 120 sounds halting; above 200 sounds rushed (and degrades Whisper accuracy too). Compute from `transcript word count / audio_duration_s × 60`, averaged across all turns in the session.

#### `avg_filler_density_per_min` (count per minute, session-wide)

Recognised English fillers: `um, uh, like, you know, sort of, kind of, basically, I mean, right` — when used non-functionally (i.e. not as a discourse marker carrying meaning). Russian-substrate fillers to flag too: `well` (Ru *ну*), `so` (Ru *вот / так*) when used as a verbal tic, not a connector.

Target: **< 3 per minute**. Above 5/min is distracting; above 8/min reads as nervous or unprepared.

Counting protocol: simple regex over the transcript, case-insensitive, word-boundary-bounded. Don't try to distinguish functional from filler use — the count is noisy by design; trend matters more than absolute number.

#### `avg_pause_ratio` (0.0–1.0, session-wide)

Fraction of audio time that was silence. Approximated as `1 - (transcript_word_count / (audio_duration_s × expected_wpm / 60))` where `expected_wpm = 150`. Above 0.4 indicates lots of dead air (thinking out loud, losing thread); below 0.1 indicates no thinking pauses (which is its own problem — sounds rehearsed/robotic).

Target band: **0.15–0.30**. Healthy thinking-pause ratio for spoken interview answers.

If Whisper returns explicit `duration` per turn, use it directly. If not, fall back to the proxy formula above. The number is approximate either way.

### 5. `per_turn_summaries`

One entry per turn. Compact — `score` (1–5 holistic for that turn) + `note` (≤8 words). Used by future analyses to spot which question types Artem nails vs struggles with.

```jsonc
"per_turn_summaries": [
  { "turn": 1, "score": 4, "note": "STAR clean, weak numbers" },
  { "turn": 2, "score": 3, "note": "technical OK, no caveat on assumption" }
]
```

---

## Scoring discipline

- **Grade against CFO-level expectations, not generic English.** Artem is C1. The bar is "would a CFO interviewer at a GCC-listed company find this credible?" — not "did this person speak intelligible English."
- **`structure_score` weights consistency.** One STAR-clean answer in an otherwise rambling session is a 3, not a 4.
- **`specificity_score` rewards numbers and named stakeholders most.** Verbal hand-waving with industry jargon but no numbers is still a 2.
- **`confidence_balance` is the trickiest** — easy to mistake natural hedging for under-confidence. The test: does the hedge land on something genuinely uncertain? If yes, that's good; if no, it's a tic.
- **Low confidence is fine and preferable to inflated grades.** Sessions <3 turns or <10s average turn length → `confidence: "low"`. Field must be present even when the fold skips.
- **Never mention the rubric to the learner.** Same rule as `register_rubric` and `assessment`. Player-facing read-out is qualitative (see the `interview_prep` template in `coach-notes-schema.md`).

---

## Relationship to other rubrics

| Rubric | Measures | Applies to |
|---|---|---|
| `register_rubric` | Conversational register quality (chunk reach, register-fit, calques, discourse markers) | Free Write transcripts AND spoken interview transcripts (unchanged) |
| `interview_rubric` (this) | Interview-specific delivery (structure, specificity, confidence balance, WPM, fillers, pauses) | Spoken interview-prep transcripts only |
| `assessment` (CEFR fold) | General CEFR grade — feeds `lvlStats` | Free Write AND spoken interview transcripts |

The three are complementary. A session can show high `register_rubric.chunk_density` (idiomatic English throughout) but low `interview_rubric.specificity_score` (no numbers, all vague). Both signals are real and shouldn't be collapsed.

---

## Consumers

| Consumer | Purpose |
|---|---|
| `/interview-prep` CC skill | Emits the rubric at session end |
| `tools/log_coach_session.js` | Persists `interview_rubric` to Firestore (passthrough) |
| `stats-review` (future) | Aggregates per-dimension rolling means; flags drift on `specificity_score` (the highest-leverage axis for real-world interview outcomes) |
| `mistakes-review` (future) | Pulls high-filler-density transcripts for inline review |

Until `stats-review` reads the field, the rubric is **dark instrumentation** — accumulating on every interview-prep session, available for inspection but not auto-actioned.

---

## Versioning

Today's first version is `rubric_version: 1` (explicit from day one, unlike `register_rubric` which started implicit). If dimensions or anchors change, bump the version so old and new sessions are compared on the right axis.
