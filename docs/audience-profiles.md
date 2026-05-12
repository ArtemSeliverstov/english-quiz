# Audience Profiles — design implications

**Status**: living doctrine
**Companion**: `docs/learning-system-design.md` §2 (two-profile model), `references/family-profiles.md` (per-player stable facts: level, themes, coach language, weak patterns)

Read this when proposing per-player adjustments, profile-specific UI changes, or new content that needs profile fit. Surface conflicts with the slim philosophy doc and with this one — both bind.

The slim philosophy doc names two profiles (builder vs. learner). This doc captures the deeper *implications* — what works for whom, why, and what constraints that places on design.

---

## 1. Builder profile — Artem, Egor

Self-directed adults. The system is a tool, not a product.

**Defaults**:
- Full surface area: every tab, every mode, every drill type visible.
- `learning_path.active_categories` empty by default — they see the open category pool. Active-window filtering is a learner-shell mechanism.
- `avoidTypes: []` — no curation. They can drill anything.
- `feedbackDepth: light` (Artem C1) / `medium-light` (Egor B2). 1-2 sentences per turn; L1 contrast only for Egor.
- Stats tab is the primary daily surface.
- Builder-shell players write `coach_notes` via CC, not via the PWA.

**Recent observation pertinent to Artem specifically**: PV-adjacent substitution at C1-business register surfaced 5× in a single 2026-05-10 session — produces a real PV in the right semantic direction but loses the specific collocation force. Distinct from the older "PV cold-production gap" note. Implies a pre-submission self-check is the right scaffold, not more drilling.

**Egor migration (2026-05-12)**: moved into learner shell with populated `active_categories: [Articles, Conditionals, Tenses, Linking Words, Vocabulary]` for IELTS B2-prep focus. He's the edge case — the system treats him as learner for visibility but his cognitive profile is closer to builder. Revisit when his catStats stabilise.

---

## 2. Learner profile — Anna, Nicole, Ernest

Engagement is fragile. Each session has to earn the next one.

**Defaults**:
- Curated picker: active categories filter category-specific drills (article, particle, spelling). Cross-category drills (translation, error correction) rotate items across the active window.
- `avoidTypes`: per-player. All learner-shell players currently `[]` — Nicole and Ernest's `['free_write']` gate was dropped 2026-05-12 to test the §3 conversation hypothesis (see also `learning-system-design.md` §3). Anna's profile actually thrives in free_write per session data; Nicole and Ernest are the open experiment.
- `feedbackDepth`: detailed (Anna) / medium-kid (Nicole) / medium (Ernest).
- Stats display: simplified or hidden behind a "show details" toggle.
- Learner-shell players write `coach_notes` only via the PWA's auto-merge at session end.

---

## 3. The orthographic-fluency profile — Anna

Anna is a B2 by receptive measures and a B1 by productive measures. She understands complex grammar, parses nuanced explanations, engages with conversational English. She is also unable to reliably spell mid-frequency concrete nouns (keys, neighbour, early). This is not a contradiction — it is a documented profile in adult Russian L2 acquisition.

Russian orthography is largely phonetic. English is not. Russian L1 speakers who read English without writing it develop strong receptive vocabulary that outruns their orthographic memory by years. The result: grammar comprehension exceeds writing fluency, and writing fluency is bottlenecked by the orthographic-to-phonological mapping that hasn't been built through production volume.

This profile has architectural implications:

**Translation Drill is the right exercise for this profile.** A quiz input question with a stem and one blank lets the player type a single word without producing the full string around it. A Russian-to-English translation forces full-sentence production and surfaces orthographic failure that the quiz cannot surface. Translation Drill earns its place not because it's a different cognitive operation in general, but because it's the only operation that exposes orthographic fragility for this profile.

**Spelling work is a first-class layer.** Spelling Drill, Spell Help capture, and orthography-aware typo tolerance in scoring all exist because of this profile. Small, contained additions sitting on a real insight: production fluency for Anna requires building orthographic automaticity in parallel with grammatical accuracy. `spelling_drill_live` (2026-05-11) draws its pool from `players/anna.spelling_log` — words she's actively asked Spell Help about — so the drill targets self-flagged uncertainty.

**Volume must be controlled.** A learner with this profile pushed toward high writing volume too quickly burns out. Free Write felt "endless" to Anna after seven turns because every sentence required three simultaneous decisions (spelling + articles + word order) that she hadn't yet automated. The system must respect this ceiling and grow it deliberately across multiple weeks — on one axis at a time (length, lexical reach, or grammatical reach — never two at once). Soft wrap-up nudges after ~8 turns are not arbitrary; they're calibration to this ceiling.

**Receptive level overstates productive level.** Anna's nominal CEFR profile is B2 (receptive). Her productive level is currently B1. This divergence is the rule rather than the exception for the orthographic-fluency profile, and it matters architecturally: content the player is asked to *produce* must be calibrated to the productive level. The `level_cap` field on `learning_path` (currently `B1` for Anna) constrains the level of content that surfaces in Smart mode and Coach exercises, while permitting a small stretch allowance (~10%) at one level above for ceiling-testing per Krashen's i+1 framing. Raising the cap follows from observed productive consolidation, not from aspirational labelling.

Nicole likely has a related but milder version of this profile. She's a child with intermittent English exposure. The same principles apply, with adjustments for age (shorter sessions, themed content, less explicit framing of the orthographic work). Her `level_cap` is also `B1`.

This profile name is worth preserving in the design vocabulary because it justifies a cluster of decisions that would otherwise look unrelated (Translation Drill, Spelling Drill, typo tolerance, axis-of-growth pacing, volume ceilings, themed Free Write prompts).

---

## 4. Decision matrix — per-profile design checks

When proposing a feature, check it against both profiles:

| Concern | Builder check | Learner check |
|---|---|---|
| New tab / surface | Does it expose useful detail or configurability? | Does it add decision burden? Can it be hidden behind a "show details" toggle? |
| New drill type | Does it cover an unaddressed cognitive operation? | Does it require new vocabulary the player has to learn? Does it fit their `feedbackDepth` tier? |
| New stat / metric | Is it actionable for stats-tab use? | Should it be hidden from the learner shell entirely? |
| New AI prompt rule | Does it preserve the analytical edge Artem wants? | Does it preserve the warmth that keeps Anna in conversation? |
| New schema field | Does it support a CC workflow (stats-review, etc.)? | Does it affect what the learner sees? If yes, learner check overrides. |

Default decision when in tension: **learner check wins on UI exposure; builder check wins on data depth.** Hide the complexity, keep the data.

---

## 5. Children and conversation — open hypothesis (testing live since 2026-05-12)

Nicole has zero Free Write sessions to date. The engagement claim for conversation is unproven for her. The hypothesis is that conversation will work for her even better than for Anna — children typically engage with conversational AI naturally. K-pop-themed starter prompts and short turns are the right scaffolding.

**Gate dropped 2026-05-12.** The precautionary `avoidTypes: ['free_write']` for Nicole and Ernest was removed deliberately, overriding the original flip criteria (`level_cap` graduates to B1+ stable OR ≥5 Phrase Swaps + Weak Spots sessions ≥70%). Rationale: the criteria couldn't be met while the gate held back the very surface that drives engagement for the learner shell, and §3 doctrine says conversation is the keystone. Better to test the hypothesis than protect it.

**What to watch** (the override is reversible — stats-review owns the call):
- Soft wrap-up nudges trigger correctly for short-turn fatigue (~6-8 turns for Nicole).
- Russian-explanation calibration via `coachLanguage: 'ru'` produces age-appropriate output for Nicole.
- Ernest's free_write session quality is not noticeably worse than Anna's at the same level.
- If a Nicole or Ernest free_write session ends with high frustration signal (abandoned early, error volume swamps coach turns), reinstate the gate.

---

## 6. Living evolution

Revise this doc when:
- A new player profile emerges (Ernest's behaviour diverges enough from Anna/Nicole to warrant a third profile)
- The orthographic-fluency profile assumptions are challenged by data (Anna's spelling layer doesn't reduce her free-write burnout, or Nicole's pattern differs significantly)
- The Egor learner-shell experiment produces a clear signal (closer to builder or closer to learner)
- The Nicole/Ernest free_write override produces signal — either thriving (codify) or struggle (reinstate gate)

Revisions go to claude.ai chat first, then land here, then the slim philosophy doc reflects any changes at the doctrine level.
