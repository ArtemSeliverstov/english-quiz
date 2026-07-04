# System Mechanisms

**Status**: living reference
**Companions**: `docs/learning-system-design.md` (philosophy), `docs/audience-profiles.md` (per-player design), `references/firestore-schema.md` (field-level Firestore detail), `references/exercise-types.md` (per-type authoring + scoring)

Read this when proposing a new surface, a new schema field, or a stats-store change. The slim philosophy doc gives you the *why*; this gives you the *how* the existing system implements it.

---

## 1. The active window model

The quiz has ~2,246 questions across 27 categories. For the builder profile (Artem) this is an asset. For learner profiles (Anna, Nicole, Ernest, Egor — Egor migrated to learner shell 2026-05-12), it's a liability — too many fronts at once means no consolidation.

The active window model classifies each category per player as one of:

- **Active** — currently being practised. Surfaces in Smart mode and Coach picker. Failures count, accuracy tracked, exercises target.
- **Mastered** — accuracy ≥ threshold (default 80% across ≥20 attempts) sustained ≥2 weeks. Available for spaced review (~30-day interval); not actively pushed.
- **Locked** — not yet opened. Player never encounters these. From the player's perspective the category doesn't exist.

Live window sizes (Firestore `learning_path.active_window_size`, 2026-07-03): 3 for Anna (shrunk 5→3 at the 2026-05-17 review — focused-CF) and Nicole, 5 for Egor, 6 for Ernest, unbounded for Artem (empty `active_categories`; learner-shell behaviours gate on a *populated* window, so he gets builder rendering). Window size is a setting, not a hard constraint.

**Promotion** from locked to active is an *explicit unlock event* when an active category reaches mastered. The player chooses from a curated list prepared by stats-review — 1 deepen option + up to 3 broaden candidates (`stats-interpretation-guide.md` §3.5). No auto-promotion.

**Composition rule**: of categories in the window, ≥1 should be in the player's current strong area (~70%+), ≥2 in the productive struggle zone (40-65%), ≤1 new narrow focus. Composition is a CC responsibility, revisited during stats reviews.

**Effects:**

- *Removes failure surface.* A category genuinely above the player's scaffold (Phrasal Verbs for Anna right now, say) doesn't appear at all.
- *Produces visible progression.* Mastery is an event; the player completes something.
- *Allows intentional sequencing.* CC + Artem pick what unlocks come next based on pedagogical fit.
- *Interacts with the learner shell.* Because windows are small, the learner shell can simplify display dramatically.

For the builder profile, active windows are unused. The model is purely a learner-shell mechanism.

**Risk to manage**: a window of only difficult categories produces no quick wins and risks disengagement. The composition rule addresses this; stats-review enforces.

**Phase 2 extension (2026-05-12)**: cross-category drills (Translation, Error Correction) source their content from `active_categories` when populated — rotating items 1:1 across the window. Builder-shell players fall back to weak_patterns-broad rotation. See `docs/learning-system-design.md` §4 (Drill design rules) and `worker/index.js → activeContentBlock`.

---

## 2. Surfaces and their roles

### 2.1 Quiz
Receptive + constrained-production practice across the wide question pool. Smart mode picks intelligently. Categories visible to builder profile; hidden behind active window for learner profile. **Default warm-up surface** and default fallback when no other surface fits. Writes `qStats[qid]` + `catStats[cat]` + `lvlStats[lvl]` + per-session `recentSessions[]`.

### 2.2 Coach tab — Free Write
Open-ended conversation in English with the Worker (Sonnet for everyone). The **keystone engagement surface** for learner profile. Themed starter prompts per player. Writes `coach_sessions/{fw_*}` with `messages[]` + assessment block (silent CEFR fold into `lvlStats`).

### 2.3 Coach tab — five drill types (all live AI primary as of 2026-05-11)

| Type | Worker mode | What it tests |
|---|---|---|
| Translation | `translation_drill` | RU→EN production, structures rotated from active categories |
| Error Correction | `error_correction_drill` | Find + fix one error in a sentence |
| Article | `article_drill_live` | Single-blank a/an/the/zero |
| Particle | `particle_sort_live` | Phrasal verb particle from semantic understanding |
| Spelling | `spelling_drill_live` | Russian-gloss → English spelling (pool from `spelling_log`) |

Library content survives as offline-only fallback (the `exercises_library/*` Firestore collection). When `liveAvail === false`, picker buttons fall back to library mode via `coachStartType(..., { forceLibrary: true })`.

### 2.4 Coach tab — Natural English (formerly Phrase Swaps)
`phrase_swap_drill`. Lexical/register swap practice (stiff/calqued → natural). Gated on `Natural English` being in `active_categories` for learner shell. Pool sourced from `phrase_tracker.entries[status==='active']` + retest-due entries; canonical lifecycle ⚪→🔵→🟡→🟢→🏆. Writes `coach_sessions/{psd_*}` + applies tracker transitions.

### 2.5 Coach tab — Weak Spots
`weak_spots_drill`. ~30-minute tier-walked depth session on one topic. Inline 7-topic catalog (emphasis_clefts, article_system, present_perfect_vs_past_simple, preposition_clusters, phrasal_verb_production, hedge_variety, conversational_register). Tutorial vs. drill emerges from `recent_observations`. **P1 — weakest quiz category is always a proposal candidate** via `coachWeakestQuizCategoriesForTopics` → `weakest_categories` in context.

### 2.6 Stats tab
Detailed per-category and per-question performance. Primary surface for builder profile. Simplified or hidden behind "show details" for learner profile. The learner-shell home stats panel (`renderLearnerStats`) shows active-category cards with quiz + drill split (`getCategoryProgress`).

### 2.7 Exercises history (Coach tab footer)
Historical view of sessions. Reads `players/{name}/exercises/{ts}` — populated by both legacy library flows and the live-AI summary mirror written by `coachWriteExerciseSummary` since 2026-05-11.

### 2.8 Family tab
Cross-player visibility (streaks, recent activity). Light social context on learner shell landing; full detail for builder profile.

### 2.9 Grammar reference (`ref/`)
Static grammar-reference page linked from the app header (📖). Read-only companion surface — no stats, no writes; content ships with normal deploys.

---

## 3. AI surface roles

Three AI surfaces, distinct functions:

**Claude Code (CC)** — Artem's primary execution surface. Reads/writes Firestore via Firebase MCP (new code paths) or `tools/*.js` (legacy paths). Authors content. Executes builds. Generates exercises live in CC sessions for himself. Picks up doc-driven work autonomously.

**claude.ai chat** — strategic design conversations (this conversation, for example), one-shot grammar/pedagogy questions, document drafting that benefits from iteration. Not used for routine project state writes. Cross-project personal context lives here.

**Cloudflare Worker (live AI for family)** — 9 chat modes: `free_write`, `escalate`, `phrase_swap_drill`, `weak_spots_drill`, `translation_drill`, `error_correction_drill`, `article_drill_live`, `particle_sort_live`, `spelling_drill_live`; plus the `/v1/audio` pipeline (`interview_prep`, Artem-only — Whisper transcription for the interview-prep CC skill). Constrained, validated, cost-capped. Russian-explanation aware. Stateless across sessions — reads `coach_notes.weak_patterns` + `recent_observations` from context each call (PWA includes them in the request payload).

These are not interchangeable. Routine authoring → CC. Family-side live interactions → Worker. claude.ai chat handles conceptual work needing human-in-the-loop iteration.

Player-facing implication: the **family never sees CC**; Artem rarely sees the Worker (one path was added for mobile convenience but isn't the default). Mental model from each audience's perspective is clean.

---

## 4. Stats stores — inventory

Eleven Firestore stores on `players/{name}`. Each has a clear purpose post-2026-05-12 stats-sprawl cleanup.

| Store | Purpose | Writers | Readers |
|---|---|---|---|
| `qStats[qid]` | Per-question quiz seen/correct | quiz answer | `catStats` backfill, badges, stats display, `getCategoryProgress` |
| `catStats[cat]` | Per-category quiz aggregate (denormalised from qStats) | quiz answer + backfill | home page weakest cats, badges, stats display, P1 helper |
| `lvlStats[lvl]` | Per-CEFR-level quiz + Free Write assessment fold | quiz answer + `coachFoldFreeWriteAssessment` | stats display (proficiency phase) |
| `coach_drill_stats[structure]` | Per-target-structure drill seen/correct + category tag | `coachFoldDrillStats` (items_drilled fold) | `getCategoryProgress` (drill side of recognition-vs-production) |
| `coach_notes.weak_patterns` | Durable grammar signal (cross-session, prose with sample sizes) | stats-review (after promotion gate) | drill prompts, Free Write, Escalate, Weak Spots proposal |
| `coach_notes.recent_session_signals` | Single-session capture buffer | session end (auto-merge) | stats-review (promotion candidate) |
| `coach_notes.strong_patterns` | Confirmed strengths | stats-review | exercise selection (skip what's solid) |
| `coach_notes.recent_observations` | FIFO 10 free-text session notes | session end + stats-review | profile context, session intro |
| `coach_notes.stuck_questions` | 100% error rate qids | stats-review | quiz-development (audits) — no PWA consumer |
| `phrase_tracker.entries[]` | Lexical swap lifecycle (status: active / retest_due / mastered) | `tools/capture_swaps.js`, phrase_swap_drill end | `coachBuildPhrasePool`, stats-review |
| `aggregated_coach_sessions[sid]` | Idempotency for CEFR fold | `coachFoldFreeWriteAssessment` | same (dedup check) |

Plus `learning_path` (active_categories, level_cap, mastered_categories, next_unlock_options) as the active window state machine.

Cross-cutting principle: **every response is captured** — `coach_sessions/{id}.messages[]` is canonical for transcript; `exercises/{ts}` is the history-view mirror. Bypass-logging is a bug, not an allowed state (P3 in `references/operational-rules.md`).

---

## 5. Living evolution

Revise when:
- A new surface lands (would be a §6 in the philosophy doc first — this doc follows)
- A new stats store appears or an existing one retires (the inventory in §4 is the canonical list)
- The Worker mode list extends (§3 needs updating)
- The active window model gets tuned (composition rule changes, window size defaults change)

Like the other docs in `docs/`, revisions go to claude.ai chat first, land here after, then surface to operational-rules if doctrine is affected.
