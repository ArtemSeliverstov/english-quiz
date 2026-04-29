# Family Profiles

All five family members are Russian L1 speakers based in Bahrain. Profiles inform
question targeting, exercise level selection, and stats interpretation.

This file holds **stable** profile data: level, focus areas, communication preferences.
**Dynamic** observations (recent weak patterns, session preferences, engagement notes)
live in Firestore — `players/{name}.coach_notes`. See `coach-notes-schema.md`.

---

## Artem 👨

**Player key**: `artem` · **Level**: B2 → C1 · **Defaults**: all levels, `biz: true`

Finance & strategy executive at Bapco Energies (Bahrain). Targeting VP/Director roles
in O&G / mining / consulting. Most active user. Reviews questions linguistically for
accuracy alongside being a player.

**Focus**:
- Articles (fossilised L1 interference)
- Phrasal Verbs (production gap — much stronger on MCQ than input)
- Emphasis / inversion (recently identified as weak)
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

**Focus**:
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

**Focus**:
- Articles (recognition vs production gap)
- Word choice
- Relative clauses
- Conditionals
- Irregular verbs

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

**Stuck questions** (100% error rate — known): cv03, gi_b04, irvpp07. Consider
restructuring or removing.

---

## Ernest 👦

**Player key**: `ernest` · **Level**: B1/B2 · **Defaults**: B1+B2

Early stage. Inactive recently (3 sessions, last in mid-Mar 2026).

**Focus**:
- Articles (recognition vs production gap — 100% MCQ vs 50% error correction)
- Conditionals
- Input accuracy is very low (25% on 8 seen) — needs easy-input scaffolding

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

**Focus**:
- Academic vocabulary (IELTS preparation)
- Articles (persistently weak at 50%)
- Multi-blank performance is anomalously low (20%) — investigate UI vs knowledge

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

---

## Profile update protocol

Updates to this file (level changes, focus shifts, new persistent patterns) require:
1. Pattern confirmed across 2+ sessions
2. Proposed edit shown for review
3. Commit only after explicit approval

Casual session-by-session observations go to `coach_notes.recent_observations` instead —
that's the dynamic layer. This file stays stable.
