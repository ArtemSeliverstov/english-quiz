# Family Profiles

All five family members are Russian L1 speakers based in Bahrain. Profiles inform
question targeting, exercise level selection, and stats interpretation.

This file holds **design intent**: level, prescriptive Learning Goals (what we want each
player working on long-term), communication style, exercise themes. Stable, opinionated, curated.

**Measured state** (current weak/strong patterns from stats, recent observations,
stuck-question IDs, engagement notes) lives in Firestore — `players/{name}.coach_notes`.
See `coach-notes-schema.md`, including the promotion rule for moving a measured pattern
into a Learning Goal here (4+ sessions persistence + survives a deliberate intervention).

## Coach drill feedback tiers

Each player's verbosity in live AI drills is set via `FAMILY_MEMBERS.feedbackDepth`
in `index.html` (5-tier scale, surfaces to worker as `context.feedback_depth`):

| Player | Tier | Style |
|---|---|---|
| Artem | `light` (C1) | 1-2 sentences, name the rule + fix, no L1 contrast |
| Egor | `medium-light` (B2) | 1-2 sentences + brief L1 contrast |
| Anna | `detailed` (B1) | 3-5 sentences + L1 contrast + additional example |
| Ernest | `medium` (B2) | 2-3 sentences + L1 contrast |
| Nicole | `medium-kid` (B1) | 2-3 short sentences + simpler vocab + occasional emoji + L1 contrast |

Source of truth: `FAMILY_MEMBERS` in `index.html`. Worker prompts branch on the
field via `feedbackDepthInstructions(depth, ru)` in `worker/index.js`.

---

## Artem 👨

**Player key**: `artem` · **Level**: B2 → C1 · **Coach language**: `en` · **Defaults**: all levels, `biz: true`

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

**Exercise context themes** (tags: `[biz_oil] | [leisure_sport] | [brit_expat] | [claude_collab]`):
- `[biz_oil]` — business meetings, O&G operations, finance, strategy, Bahrain settings. Operational/hallway register — "never got around to it last quarter," "contractor's pushing back," "let's crack on." Avoid pitch-deck register.
- `[leisure_sport]` — cycling, F1, gym, sports talk
- `[brit_expat]` — pubs, padel club, rugby/F1 banter, dinner parties, dropped-by-the-club casual register
- `[claude_collab]` — prompts to Claude Code / claude.ai, project shared vocab ("learning ladder", "weak_patterns", "phrase_swap_drill"), system-behaviour talk (UI counters, drill caps, tracker entries), git/CLI collab. Real daily register — Artem spends hours/day in this context driving the project.
- If Artem mentions travel at session start ("we're in Turkey this week"), shift to location-appropriate scenarios for that session

**Weekly slot plan**: see `weekly-slots.md`.

---

## Anna 👩

**Player key**: `anna` · **Level**: B2 · **Coach language**: `ru` · **Defaults**: B1+B2, `biz: false`

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

**Exercise context themes** (tags: `[home_daily] | [leisure_sport] | [brit_expat]`):
- `[home_daily]` — home life, interior, neighbours, daily-life situations she actually encounters
- `[leisure_sport]` — padel, gym, weekend plans
- `[brit_expat]` — British Club padel, school-gate parents, expat dinner parties, weekend brunch chat
- If Artem mentions family travel at session start, shift to location-appropriate scenarios

**Adjustment rules**:
- Scores below 50% in a session → reduce complexity for next session
- Prioritize preposition-focused translation exercises

---

## Nicole 👧

**Player key**: `nicole` · **Level**: B1 (struggling — use B1 filter only until B1 accuracy ≥ 75%) · **Coach language**: `ru` · **Defaults**: B1 only

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

**Exercise context themes** (tags: `[home_daily] | [leisure_sport] | [brit_expat]`):
- `[home_daily]` — K-pop, school, friends, topics she actually cares about
- `[leisure_sport]` — sports she does or watches
- `[brit_expat]` — expat-school friends, weekend hangouts, things her classmates would say
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

**Player key**: `ernest` · **Level**: B1/B2 · **Coach language**: `en` · **Defaults**: B1+B2

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
- Coach explanations in English (per Artem's call 2026-05-01) — different from Anna/Nicole who get Russian

**Exercise context themes** (tags: `[home_daily] | [leisure_sport] | [brit_expat]`):
- `[home_daily]` — school, friends, age-appropriate scenarios
- `[leisure_sport]` — sports, gaming, weekend plans
- `[brit_expat]` — expat-school playground, weekend hangouts with friends, casual peer banter

---

## Egor 🧒

**Player key**: `egor` · **Level**: B2 → C1 · **Coach language**: `en` · **Defaults**: B2+C1, `biz: false`

Mathematician at KPMG, Almaty (different timezone — coordinate accordingly).
English-speaking consulting work (Russian-speaking colleagues, English-language deliverables and clients). Applying to UK/Western master's.

As of 2026-05-06 has full parity with the family on supplementary surfaces: PWA Free Write, PWA Phrase Swaps drill, exercise sessions. Quiz remains primary. Coach tab access via the family PWA login — no CC channel.

**Learning goals** (design intent — current measured state in `coach_notes.weak_patterns`):
- Academic vocabulary (IELTS preparation)
- Articles (persistently weak)
- Multi-blank performance — investigate UI vs knowledge (cross-player anomaly, see Cross-cutting principles)

**Communication style for sessions**:
- Concise, direct. Coach explanations in English (per Artem's call 2026-05-01, same as Ernest)
- IELTS-rubric framing where relevant (academic register, hedging, formal cohesion)
- Engage on grammar questions; he has the metalinguistic vocabulary

**Exercise context themes** (tags: `[academic_ielts] | [kpmg_consulting] | [almaty_daily]`):
- `[academic_ielts]` — IELTS Writing/Speaking topics, academic register, master's-application scenarios (research aims, methodology, motivation letters)
- `[kpmg_consulting]` — English-speaking consulting work at KPMG Almaty (client deliverables, internal English memos, audit/advisory scenarios with Russian-L1 colleagues)
- `[almaty_daily]` — Almaty city life, weekend, family — ordinary daily-life context for non-academic items

No `[brit_expat]` — different geography, no Bahrain expat exposure.

**For stats reviews**: focus on academic / IELTS-relevant patterns; include Coach-tab activity now that he has access.

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

**Natural-phrase swaps** (added 2026-05-06): captured `awkward → natural [tag]` entries
land in `coach_notes.weak_patterns` (lexical/idiom register swaps) and accumulate per
player in `players/{name}.phrase_tracker` (Firestore canonical, markdown view at
`progress/natural-phrases-tracker-{name}.md` regenerated by stats-review). Tags above
identify which context each swap applies to. See `coach-notes-schema.md` for the
notation, lifecycle, and retest cadence.

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
