# Exercise Types

The supplementary exercise framework defines 8 canonical types. Each is a structured
practice format Claude runs in dialogue with the player.

When generating exercise content for any of these, use the player's real-life context
themes from `family-profiles.md`. Generic stems are forbidden.

---

## 1. `translation`

Russian → English translation, single sentence, focused on a target structure.

**Use for**: Anna (her primary mode), preposition focus, conditionals, articles.
**Item count**: 5-10
**Player input**: typed English translation
**Scoring**: tolerant of synonyms, strict on target structure

Example item:
- RU: «Я жду вас в аэропорту с трёх часов.»
- Target: present perfect continuous + correct preposition
- Expected EN: "I have been waiting for you at the airport since 3."

---

## 2. `free_write`

Player writes a short paragraph (3-6 sentences) on a situational prompt. Claude scores
it for grammatical accuracy on the target structure(s).

**Use for**: Artem (production practice), Egor (IELTS prep). NOT for Nicole/Ernest
(too unstructured).
**Item count**: 1-2 paragraphs
**Player input**: typed paragraph
**Scoring**: identify all errors, categorise by type, rate target-structure usage

**Crucial rule for Artem**: free_write prompts must be **situational** ("describe how
you'd handle a delayed shipment from the contractor"), NOT pattern-prompts ("write
something using present perfect"). Pattern-prompts produce stilted output.

---

## 3. `error_correction`

Claude presents a sentence with a deliberate error. Player identifies and corrects.

**Use for**: Ernest (his preferred format), recognition-vs-production work,
fossilised L1 errors (Anna's prepositions).
**Item count**: 6-10
**Player input**: typed corrected sentence (or just the corrected portion)
**Scoring**: exact match on the target word/phrase, tolerant of unrelated changes

Example:
- Sentence: "She arrived to Paris yesterday."
- Player corrects to: "arrived in Paris" or just "in"

---

## 4. `transform`

Sentence transformation with a keyword. Same meaning, different structure.

**Use for**: Artem (advanced grammar), Emphasis/inversion, passive voice, reported speech.
**Item count**: 5-8
**Player input**: typed transformed sentence
**Scoring**: must contain the keyword, must preserve meaning, must use target structure

**Critical authoring rule**: the keyword must NOT appear in the source sentence stem. It
must be producible only through the player's transformation. (See bug log for tf_32.)

Example:
- Source: "I realised the cost only after reviewing the invoice."
- Keyword: ONLY (must appear in transformed version)
- Target: cleft / inversion
- Expected: "Only after reviewing the invoice did I realise the cost."

---

## 5. `dictation`

Claude reads (presents text); player writes from memory. Tests collocations, fixed
expressions, and listening-to-writing pipeline.

**Use for**: Artem (business collocations), Anna (everyday phrases).
**Item count**: 4-6 short sentences or phrases
**Player input**: typed reproduction
**Scoring**: exact match, with whitespace and case normalised

**Format calibration is real**: Artem scored unusually low on a dictation session — root
cause was format mismatch, not vocabulary gap. Be explicit about what the player will
type.

---

## 6. `conversation`

Free-form dialogue with Claude on a topic. Claude tracks errors silently, surfaces
them at the end with corrections.

**Use for**: Anna (conversational practice), occasional Artem (business scenarios).
**Item count**: 8-12 turns
**Player input**: typed responses in flowing chat
**Scoring**: end-of-session feedback grouped by error type

---

## 7. `article_drill`

High-density article practice. Mixed gap-fill + error correction format. Specifically
designed for the article weakness all family members share.

**Use for**: Artem (articles are his fossilised pattern), Nicole, Ernest.
**Item count**: 10-15 (high density, fast pace)
**Player input**: a / an / the / — for each blank
**Scoring**: per-blank, with reasoning surfaced for each error

This is a canonical exercise type — `exercise: 'article_drill'` in Firestore. Do NOT
fall back to `error_correction` when running an article drill.

---

## 8. `particle_sort`

Phrasal verb particle drill. Player matches verb + particle pairs, or selects the
correct particle for a given verb in context.

**Use for**: Artem (PV production gap), occasional Anna.
**Item count**: 10-15
**Player input**: particle selection or pairing
**Scoring**: per-item with feedback on direction/meaning of each particle

This is a canonical exercise type — `exercise: 'particle_sort'` in Firestore. Do NOT
fall back to `error_correction`.

---

## Type selection by player

| Player | Primary types | Secondary | Avoid |
|---|---|---|---|
| Artem | free_write, transform, article_drill, particle_sort | error_correction, dictation | translation (too easy at C1) |
| Anna | translation, error_correction, conversation | dictation | free_write (too unstructured) |
| Nicole | translation, article_drill (light) | error_correction | free_write, transform (too hard) |
| Ernest | error_correction, translation | article_drill | free_write, transform |
| Egor | (no exercises) | — | — |

---

## The 6-step exercise session protocol

Every exercise session, regardless of type, follows this sequence. The
`exercise-session` skill orchestrates it.

1. **Retrieve context**: read `players/{name}` from Firestore (stats + coach_notes).
   Read `family-profiles.md` for stable profile. Default to home/Bahrain themes
   unless the user mentions travel at session start.
2. **Select exercise type**: based on player profile, recent weak patterns, slot plan
   for Artem. Confirm with player if multiple options apply.
3. **Run session**: present items one at a time. Score each. Build error pattern map.
4. **Post-session feedback**: score trend within session, persistent error patterns,
   what to adjust next time.
5. **Get player feedback**: ask the player how the session felt. Capture in
   `recent_observations`.
6. **Persist**: write to Firestore. For Claude Code: direct write to
   `players/{name}/exercises/{ts}`. For claude.ai chat: generate `?exfin=BASE64`
   deeplink. Update `coach_notes.recent_observations` if anything new emerged.

---

## When to skip exercises entirely

- Player asks for one but is in a fragile state (stress, very low recent scores).
  Suggest a quiz session in Smart mode instead — lower stakes.
- Player has Firestore data showing < 24h since last session. Risk of fatigue.
- Nicole asking for one — proceed gently, never push her into more.
