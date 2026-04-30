# Family Profiles

All five family members are Russian L1 speakers based in Bahrain. Profiles inform
question targeting, exercise level selection, and stats interpretation.

This file holds **design intent**: level, prescriptive Learning Goals (what we want each
player working on long-term), communication style, exercise themes. Stable, opinionated, curated.

**Measured state** (current weak/strong patterns from stats, recent observations,
stuck-question IDs, engagement notes) lives in Firestore — `players/{name}.coach_notes`.
See `coach-notes-schema.md`, including the promotion rule for moving a measured pattern
into a Learning Goal here (4+ sessions persistence + survives a deliberate intervention).

---

## Artem 👨

**Player key**: `artem` · **Level**: B2 → C1 · **Defaults**: all levels, `biz: true`

Finance & strategy executive at Bapco Energies (Bahrain). Targeting VP/Director roles
in O&G / mining / consulting. Most active user. Reviews questions linguistically for
accuracy alongside being a player.

**Learning goals** (design intent — current measured state in `coach_notes.weak_patterns`):
- Articles (fossilised L1 interference)
- Phrasal Verbs (production gap — much stronger on MCQ than input)
- Emphasis / inversion
- Business English register

**Communication style for sessions**:
- Concise, direct. Push back if disagreeing.
- Tables of proposed changes before applying.
- Skip excessive caveats and apologies.
- Real-world context: business / O&G / cycling / sports / Bahrain settings.

**Exercise context themes**:
- Default: business meetings, O&G operations, finance, strategy, Bahrain settings
- Cycling and sports as recurring fallback
- If Artem mentions travel at session start ("we're in Turkey this week"), shift to location-appropriate scenarios for that session

**Weekly slot plan**: see `weekly-slots.md`.

---

## Anna 👩

**Player key**: `anna` · **Level**: B2 · **Defaults**: B1+B2, `biz: false`

Conversational English, daily interaction. Less need for formal register.
Engages in bursts then disappears for weeks. Currently re-engaging (Apr 2026).

**Learning goals** (design intent — current measured state in `coach_notes.weak_patterns`):
- Preposition errors (Russian L1 interference: arrive to → at, waiting us → for, at the next week → zero article)
- Collocations (a documented weak spot)
- Vocabulary
- Conditionals
- Input difficulty stratification — accuracy on input drops sharply vs MCQ

**Communication style for sessions**:
- Detailed rule explanations in concise, simple English
- Russian translation for difficult rules
- Claude communicates explanations to Anna in Russian when explaining grammar
- Encouraging tone — engagement matters more than maximum challenge

**Exercise context themes**:
- Home life, interior, padel, neighbours
- Daily-life situations she actually encounters
- If Artem mentions family travel at session start, shift to location-appropriate scenarios

**Adjustment rules**:
- Scores below 50% in a session → reduce complexity for next session
- Prioritize preposition-focused translation exercises

---

## Nicole 👧

**Player key**: `nicole` · **Level**: B1 (struggling — use B1 filter only until B1 accuracy ≥ 75%) · **Defaults**: B1 only

iPad. Currently engaged through Consolidation Mode (S56). B1 accuracy improving but
fragile.

**Learning goals** (design intent — current measured state in `coach_notes.weak_patterns`):
- Articles (recognition vs production gap)
- Word choice
- Relative clauses
- Conditionals
- Irregular verbs
- Question Formation B1 (auxiliary order, do-support)

**Communication style for sessions**:
- Brief, low-friction session closings
- Player-initiated only — don't auto-suggest sessions
- Up to 2 bonus exercises per week max
- Do not increase item count until irregular verb accuracy consistently > 70% across 2+ sessions

**Exercise context themes**:
- K-pop, school, friends
- Topics she actually cares about
- If Artem mentions family travel at session start, shift to location-appropriate scenarios

**Important note (durable observation)**:
Nicole has never logged a supplementary exercise session despite active quiz use.
The player-initiated model is not currently working for her. Approach: do NOT increase
pressure or auto-suggest. Wait for genuine player-initiated requests; lean on Coach tab
(Phase 2) for self-service initiation.

**Stuck questions**: tracked in `coach_notes.stuck_questions`. Restructure/remove candidates
flow from there to `quiz-development` sessions; this profile no longer enumerates qids
(they drift faster than commits).

---

## Ernest 👦

**Player key**: `ernest` · **Level**: B1/B2 · **Defaults**: B1+B2

Early stage. Inactive recently (3 sessions, last in mid-Mar 2026).

**Learning goals** (design intent — current measured state in `coach_notes.weak_patterns`):
- Articles (recognition vs production gap — historically 100% MCQ vs 50% error correction)
- Articles with uncountable nouns (Russian L1 pattern)
- Conditionals
- Input-type scaffolding — input accuracy lags gap-type by ~30 pts

**Communication style for sessions**:
- Brief, low-friction
- Prefer error-correction format over MCQ
- Easy on-ramp for input questions

**Exercise context themes**: school, friends, age-appropriate scenarios.

---

## Egor 🧒

**Player key**: `egor` · **Level**: B2 → C1 · **Defaults**: B2+C1, `biz: false`

Mathematician at KPMG, Almaty (different timezone — coordinate accordingly).
Applying to UK/Western master's. Quiz user only — does NOT do supplementary exercises.

**Learning goals** (design intent — current measured state in `coach_notes.weak_patterns`):
- Academic vocabulary (IELTS preparation)
- Articles (persistently weak)
- Multi-blank performance — investigate UI vs knowledge (cross-player anomaly, see Cross-cutting principles)

**Communication style for sessions**: N/A — no exercise sessions for Egor.

**For stats reviews**: focus on academic / IELTS-relevant patterns only.

---

## Cross-cutting principles

**Generic sentences are forbidden.** Every exercise stem must use the player's real-life
context themes. "The man went to the shop" is never acceptable.

**Travel context comes from the user, not stored memory.** Claude Code does not have
access to claude.ai user memory, so it cannot know if the family is travelling unless
told. Default to home/Bahrain themes. When Artem (or another user) mentions travel
at session start ("we're in Turkey this week", "we just got back from Istanbul"),
shift exercise themes to that location for the rest of the session.

**Russian L1 interference patterns** are well-documented and should inform exp fields:
- Articles: Ionin (2004) Fluctuation Hypothesis predicts errors by [±definite × ±specific]
- Prepositions: Anna's documented swaps (arrive to → at, etc.)
- Tense aspect: present perfect tends to collapse to past simple

**The "Current observations" column** that lived in the previous KB is now in Firestore
`coach_notes.recent_observations`. Read it before any session for that player.

**Multi-blank format anomaly**: All players who've attempted multi-blank questions
are <55% (Artem 53%/n=55, Anna 50%/n=4, Nicole 17%/n=6, Ernest 6%/n=4, Egor 20%/n=5).
Cross-player consistency suggests UI/cognitive-load issue rather than knowledge gap.
Investigate before authoring more multi-blank questions. Flagged 2026-04-30.

---

## Profile update protocol

This file holds **design intent**, not measured state. Updates (level changes,
new Learning Goals, persona shifts) require:

1. The promotion rule from `coach-notes-schema.md`: pattern persists 4+ sessions
   AND survives a deliberate intervention before becoming a Learning Goal here
2. Proposed edit shown for review
3. Commit only after explicit approval

Casual session-by-session observations and current measured weaknesses go to
`coach_notes` (recent_observations / weak_patterns / stuck_questions). This file stays stable.
