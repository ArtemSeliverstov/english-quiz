# Exercise Types

The supplementary exercise framework defines 8 canonical types. Each is a structured
practice format Claude runs in dialogue with the player.

When generating exercise content for any of these, use the player's real-life context
themes from `family-profiles.md`. Generic stems are forbidden.

---

## 1. `translation` (alias: `translation_drill`)

Russian → English translation, single sentence, focused on a target structure.

**Use for**: Anna (her primary mode), preposition focus, conditionals, articles.
**Item count**: 5-10 (live AI default 8, capped 12; library per-player overrides preserved e.g. Anna=10)
**Player input**: typed English translation
**Scoring**: tolerant of synonyms, strict on target structure
**Source**: live-AI worker (`mode: 'translation_drill'`) when online + API available; `exercises_library/translation/items` as offline fallback (router in `coachStartType` picks at click-time). CC counterpart authored via `exercise-session` skill — same logging shape regardless of source.
**Logging**: `coach_sessions/{td_*}` for live AI (mode `translation_drill`); legacy `players/{name}/exercises/{ts}` for library fallback. Session metadata feeds `error_patterns_observed` into `coach_notes.weak_patterns` and the `assessment` block into the silent CEFR fold.

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

## 3. `error_correction` (alias: `error_correction_drill`)

Claude presents a sentence with a deliberate error. Player identifies and corrects.

**Use for**: Ernest (his preferred format), recognition-vs-production work,
fossilised L1 errors (Anna's prepositions).
**Item count**: 6-10 (live AI default 8, capped 12)
**Player input**: typed corrected sentence (or just the corrected portion)
**Scoring**: exact match on the target word/phrase, tolerant of unrelated changes
**Source**: live-AI worker (`mode: 'error_correction_drill'`) when online + API available; `exercises_library/error_correction/items` as offline fallback (router in `coachStartType` picks at click-time).
**Logging**: `coach_sessions/{ec_*}` for live AI (mode `error_correction_drill`); legacy `players/{name}/exercises/{ts}` for library fallback. Same metadata merge + proficiency fold as `translation_drill`.

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

**Phrasal verb keyword rule**: when the target structure is a phrasal verb, the keyword
is the **base verb only** (e.g. `GET`, `BRING`, `TAKE`) — never the verb+particle pair
(`GET ACROSS`, `BRING ABOUT`). Showing the particle gives away the production challenge,
which is exactly the rung being practised. Player must produce the particle from semantic
understanding. (Set 2026-04-30 after a PV Family Drill leaked `GET ACROSS` as the keyword.)

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

## 7. `article_drill` (alias: `article_drill_live`)

High-density article practice. Single-blank gap-fill in live AI; mixed gap-fill + error correction format in legacy library. Specifically designed for the article weakness all family members share (Russian L1 doesn't mark articles).

**Use for**: Artem (articles are his fossilised pattern), Nicole, Ernest, all family.
**Item count**: 10-15 (live AI default 10, capped 15; library per-player overrides preserved)
**Player input**: types one article per turn — `a` / `an` / `the` / `—` / `zero` / `no article` (all accepted)
**Scoring**: per-item against the rule-required article; conversational explanation on miss
**Source**: live-AI worker (`mode: 'article_drill_live'`) when online + API available; `exercises_library/article_drill/items` as offline fallback (router in `coachStartType` picks at click-time).
**Logging**: `coach_sessions/{ad_*}` for live AI; legacy `players/{name}/exercises/{ts}` for library fallback. Same metadata merge + proficiency fold as `translation_drill`.

This is a canonical exercise type — `exercise: 'article_drill'` in Firestore. Do NOT fall back to `error_correction` when running an article drill.

---

## 8. `particle_sort` (alias: `particle_sort_live`)

Phrasal verb particle production drill. In live AI: base verb shown in context, player produces the particle from semantic understanding (no menu). In legacy library: player matches verb + particle pairs or selects from distractors.

**Use for**: Artem (PV production gap), occasional Anna, all family for PV exposure.
**Item count**: 10-15 (live AI default 10, capped 15)
**Player input**: typed particle ("out", "across") or verb+particle pair ("figured out"). For 3-part PVs, the whole particle group ("forward to" for "look forward to").
**Scoring**: per-item against the rule-correct PV given the sentence's intended meaning; conversational semantic explanation on miss.
**Source**: live-AI worker (`mode: 'particle_sort_live'`) when online + API available; `exercises_library/particle_sort/items` as offline fallback (router in `coachStartType` picks at click-time).
**Logging**: `coach_sessions/{pst_*}` for live AI; legacy `players/{name}/exercises/{ts}` for library fallback. Same metadata merge + proficiency fold as other Phase D drills.

**Critical authoring rule** (live + library both): the prompt never reveals the full PV. Base verb only — the particle is the production challenge. Mirrors the PV keyword rule in type 4 (transform).

This is a canonical exercise type — `exercise: 'particle_sort'` in Firestore. Do NOT fall back to `error_correction`.

---

## 9. `phrase_swap_drill`

Lexical / register swap practice. Player produces the natural form for a stiff
or calqued original, themed to a context tag. Driven by `weak_patterns` lexical
entries (`awkward → natural [tag]` notation) and `phrase_tracker` retest-due
entries.

**Use for**: Anna, Nicole, Ernest, Egor (PWA Coach tab), Artem (PWA + organic CC
mirror-recast). Source: live-AI worker, no library content.
**Item count**: 6 per session (4 active + 2 retest-due, mixed by worker)
**Player input**: typed English production
**Scoring**: lenient — multiple natural forms accepted ("a while ago" / "a few
weeks back" / "some time back" all pass for `[brit_expat]`); on stiff production,
1–2 sentence register explanation, no grammar lecture
**Logging**: `coach_sessions/{psd_*}` with `mode: "phrase_swap_drill"`. Mastery
transitions land in `phrase_tracker` (see `coach-notes-schema.md`).

**Critical authoring rule**: do NOT show the natural form in the prompt. The
production challenge is recalling it from semantic understanding of the context.
The Russian cue + `[tag]` is enough.

**Critical scoring rule**: register explanation, not grammar correction.
"Sometime ago" is grammatically fine — it's just lower-frequency in spoken
Brit-expat banter. The drill teaches register, not rules.

Example item:
- Tag: `[brit_expat]`
- RU cue: «Я бросил курить пару недель назад.»
- Stiff target: "I quit smoking sometime ago."
- Natural target: "I quit smoking a while ago." / "...a couple of weeks back."
- Feedback if stiff produced: "Both are grammatical, but in pub/club register
  'a while ago' or 'a couple of weeks back' lands more naturally — 'sometime
  ago' reads slightly formal/written."

---

## 10. `spelling_drill` (alias: `spelling_drill_live`)

Russian-gloss → English-spelling drill. Audio-cue substitute via Russian gloss + short English disambiguation hint. Player types the English word.

**Use for**: Anna primary (her spelling needs the most work), Nicole + Ernest secondary, all family when `spelling_log` has captured uncertain words.
**Item count**: 6-10 (live AI default 8, capped 12)
**Player input**: typed English spelling
**Scoring**: three tiers — exact match → pass; 1-2 letter near miss → pass with trap note; wrong word → fail with disambiguation
**Source**: live-AI worker (`mode: 'spelling_drill_live'`) when online + API available; `exercises_library/spelling_drill/items` as offline fallback.
**Logging**: `coach_sessions/{spd_*}` for live AI; legacy `players/{name}/exercises/{ts}` for library fallback.

**Live AI pool sourcing**: PWA fetches the player's `spelling_log` entries since the last drill, dedupes by correct-form, and passes them as `context.spelling_pool: [{word, last_attempt?, times_seen?}]`. Worker drills pool words first (self-flagged uncertainty from Spell Help), falls back to profile-driven generation when the pool is exhausted. The badge "N queued" reflects this pool size.

---

## 11. `weak_spots_drill`

Depth-focused live AI session on one topic, ladder-walked simple → hard. ~30 min, 15-20 items. Tutorial-vs-drill emerges from `coach_notes.recent_observations` — prior trace in last ~14 days → drill-first; no trace → mechanics-first per tier.

**Use for**: all 5 players, when the player has ≥1 `coach_notes.weak_patterns` entry. Anna/Nicole explanations in Russian (`coachLanguage: 'ru'`); Artem/Ernest/Egor in English.
**Item count**: 15-20 production items across 3-4 tiers
**Player input**: typed English production per tier-appropriate cue (translation, transformation, free-form depending on tier)
**Scoring**: per-item structural pass/fail; tier escalation gated on ≥1 clean production
**Source**: live-AI worker (`mode: 'weak_spots_drill'`); CC counterpart via `weak-spots-session` skill — both read the canonical 5-topic catalog from `worker/index.js → weakSpotsDrillSystemPrompt`.
**Logging**: `coach_sessions/{ws_*}` with `mode: 'weak_spots_drill'`. Session metadata feeds `error_patterns_observed` into `coach_notes.weak_patterns` and the `assessment` block into the silent CEFR fold (`aggregated_coach_sessions.estimated_level`).

Canonical catalog IDs: `emphasis_clefts | article_system | present_perfect_vs_past_simple | preposition_clusters | phrasal_verb_production`. Off-catalog free-typed topics improvise a 3-tier ladder under a snake_case slug.

**Critical authoring rule**: do not re-derive tier ladders. The catalog in `worker/index.js` is the single source of truth — both the worker preamble and the `weak-spots-session` skill reference it. Changes to a ladder happen there.

**Critical scoring rule**: tier escalation requires structural success on the target mechanic. Stylistic preferences (word choice, register variation) do not gate tier moves.

---

## Type selection by player

| Player | Primary types | Secondary | Avoid |
|---|---|---|---|
| Artem | free_write, transform, article_drill, particle_sort, weak_spots_drill | error_correction, dictation, phrase_swap_drill | translation (too easy at C1) |
| Anna | translation, error_correction, conversation, phrase_swap_drill, weak_spots_drill | dictation | free_write (too unstructured) |
| Nicole | translation, article_drill (light), weak_spots_drill (light) | error_correction, phrase_swap_drill (light) | free_write, transform (too hard) |
| Ernest | error_correction, translation, phrase_swap_drill | article_drill, weak_spots_drill | free_write, transform |
| Egor | translation, free_write, phrase_swap_drill, weak_spots_drill | article_drill | transform (later, after B2 article gap closes) |

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
6. **Persist**: write to Firestore via `tools/log_exercise.js` →
   `players/{name}/exercises/{ts}`. Update `coach_notes.recent_observations`
   if anything new emerged.

---

## When to skip exercises entirely

- Player asks for one but is in a fragile state (stress, very low recent scores).
  Suggest a quiz session in Smart mode instead — lower stakes.
- Player has Firestore data showing < 24h since last session. Risk of fatigue.
- Nicole asking for one — proceed gently, never push her into more.
