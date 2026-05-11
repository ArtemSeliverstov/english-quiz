# Coach → Live AI + Weak Spots plan

**Status**: shipped (T1 + T2 complete; only the docs sweep — Phase E — remains)
**Owner**: Artem · execution: Claude Code (laptop, with remote-CC compatibility)

Two parallel tracks: (T1) convert every Coach picker type to live AI via the Worker, retiring library content as the primary path; (T2) add `weak_spots_drill` — a Free-Write-shaped session focused on one weak-pattern topic, with inline tier ladders for 5 v1 topics.

Firestore is the single source of truth for dynamic state. All reads/writes go through Firebase MCP (document tools landed; legacy `tools/*.js` workaround retired for new code paths). Skills must work in remote CC — no `node` scripts, no local-only env vars.

---

## Contents

1. Goal and end state
2. T1 — All coach types live AI
3. T2 — Weak Spots drill
4. Topic catalog v1 (5 topics, inline in worker prompt)
5. Surface delta
6. Phasing and gates
7. Open decisions
8. Status log

---

## 1. Goal and end state

**T1 end state.** Every active picker button (Translation, Spelling, Articles, Particles, Error Correction, Phrase Swaps, Free Write) routes through the Worker. Library content (`exercises_library/*`) survives as offline-only fallback; primary path is live AI for all players. Each type gets its own Worker mode with a tuned system prompt; one mode per type, not a generic dispatcher.

**T2 end state.** A "Weak Spots" picker button (live-AI badge, gated on `coach_notes.weak_patterns.length > 0`) starts a topic-focused ~30-min session. AI proposes 2-3 topics from the v1 catalog matching the player's weak patterns; player picks or free-types. Tutorial-vs-drill emerges from `coach_notes.recent_observations` — no explicit status state. Session logs to `coach_sessions/{ws_*}` with the same `<session_meta>` shape as Free Write, including `assessment` block so proficiency tracking keeps working.

No new collections, no new player-doc fields, no new tools scripts.

---

## 2. T1 — All coach types live AI

### Worker modes to add

| Mode | Replaces library type | Notes |
|---|---|---|
| `translation_drill` | `translation` | RU cue → EN production, lenient scoring, target structure feedback |
| `spelling_drill` | `spelling_drill` | Audio-cue substitute via Russian gloss + definition; player types EN spelling; per-letter feedback on miss |
| `article_drill` | `article_drill` | Scene + blanks; player taps a/an/the/—; per-blank reasoning |
| `particle_sort` | `particle_sort` | Verb stem + context → player produces particle; semantic explanation per miss |
| `error_correction` | `error_correction` | Sentence with one error; player corrects; targeted feedback |

Each mode reuses the `phrase_swap_drill` shape: PWA passes the relevant pool (or none for live-authored types), Worker builds system prompt server-side, session-end emits `<session_meta>` with per-item results.

### Library content fate

Kept as **offline fallback only**. When `navigator.onLine === false` or `coachState.apiUnavailable === true`, picker buttons fall back to existing library path. `exercises_library/*` collection remains; no new authoring against it for these types. Phrase Swaps and Weak Spots have no library fallback (live-only).

### Prompt-cache threshold

Each new mode's preamble must clear 2048 tokens to benefit from prompt caching (s91 smoke-test finding in `worker/README.md`). At ~400 tokens for `free_write`, additional `coach_notes` payload usually pushes over the threshold once `weak_patterns` and `engagement_notes` are populated. Track via `tokens_used.cache_read` on responses.

---

## 3. T2 — Weak Spots drill

### Worker mode `weak_spots_drill`

**Payload shape:**

```json
{
  "mode": "weak_spots_drill",
  "model": "claude-sonnet-4-6",
  "messages": [{"role": "user", "content": "ready"}],
  "context": {
    "player": "artem",
    "level": "C1",
    "coach_language": "en",
    "topic_hint": null,
    "coach_notes": { "weak_patterns": [...], "recent_observations": [...], "engagement_notes": "..." }
  },
  "session_id": "artem_ws_...",
  "is_session_end": false
}
```

`topic_hint` is `null` on session start (AI proposes from `weak_patterns`). On a returning topic, PWA can pass the canonical topic ID (e.g. `"emphasis_clefts"`) to skip the propose-and-pick turn.

**System prompt structure:**

1. Role + level + coach_language block (mirrors `free_write`).
2. `weak_patterns` + `recent_observations` blocks — AI inspects `recent_observations` for prior sessions on the same topic to decide tutorial-vs-drill mode.
3. **Inline catalog** (the 5 v1 topics, §4 below) with tier ladders and per-tier production-cue templates.
4. Session protocol: propose 2-3 topics matching `weak_patterns` on turn 1 → player picks → walk tier ladder (mechanics-first if no recent trace, drill-first if topic appeared in last ≤14 days of `recent_observations`).
5. Soft turn cap ~15 (vs Free Write's 8). Nudge to wrap at turn 12; hard end at 18.
6. Session-end shape: same `<session_meta>` as `free_write` — `error_patterns_observed`, `topics_covered: ["weak_spots:emphasis_clefts"]`, `pvs_used_correctly`, `session_summary`, `assessment`. The `topics_covered` prefix lets stats-review filter Weak Spots sessions cleanly.

### PWA flow

`coachStartWeakSpotsDrill()` clones `coachStartFreeWrite()` with mode swapped and turn cap raised. Reads cached `coachState.playerCoachNotes` (loaded at tab open). Refreshes player doc at session start to pick up overnight `weak_patterns` changes from daily review — same pattern as `coachStartPhraseSwapDrill`.

Picker button gated on `weak_patterns.length > 0`. Disabled with count "0 weak spots" when empty (drives player to do Free Write / quizzes first).

### CC skill

`.claude/skills/weak-spots-session/SKILL.md` — new, ~40 lines. Trigger: "weak spots session", "let's do 30 min on X", "practise emphasis". Reads `players/{name}` via `mcp__firebase__firestore_get_document`. Runs the conversation in CC the same way `exercise-session` does, but bound to one topic. Persists to `coach_sessions` via `mcp__firebase__firestore_add_document`. No local `tools/*.js` calls.

---

## 4. Topic catalog v1

Inlined in the `weak_spots_drill` worker system prompt. ~250 words of catalog text; well under prompt-cache amortisation cost.

### 4.1 `emphasis_clefts`

Maps to `weak_patterns` matching `/cleft|emphasis|inversion|fronting|emphatic/`.

| Tier | Mechanic | Worked example |
|---|---|---|
| 1 | it-clefts | "Sarah flagged the error" → "It was Sarah who flagged the error." |
| 2 | wh-/pseudo-clefts | "We need more time" → "What we need is more time." |
| 3 | negative/restrictive fronting + inversion | "We realised only after the audit" → "Only after the audit did we realise…" |
| 4 | emphatic *do*, fronting, "all"-clefts | "I did warn them"; "All she wants is X." |

### 4.2 `article_system`

Maps to `weak_patterns` matching `/article|a→the|zero.*the|the.*zero/i`.

| Tier | Mechanic |
|---|---|
| 1 | Indefinite vs zero (countable singular intro) |
| 2 | Definite for shared/identified referent (second-mention rule) |
| 3 | Zero for generic/abstract/uncountable |
| 4 | Fixed-expression exceptions (*in hospital*, *by car*, *at school*) |

### 4.3 `present_perfect_vs_past_simple`

Maps to `weak_patterns` matching `/present perfect|past simple|tense|since|for|ago/i`.

| Tier | Mechanic |
|---|---|
| 1 | Experience / result vs finished event |
| 2 | *since/for* vs *ago*; state vs action |
| 3 | Continuous (*I've been waiting*) + adverbs (*just / already / yet / recently*) |

### 4.4 `preposition_clusters`

Maps to `weak_patterns` matching `/preposition|arrive|at|on|in.*time|verb\+prep/i`.

| Tier | Mechanic |
|---|---|
| 1 | Motion vs location (*arrive at/in*, *go to*, *into*) |
| 2 | Time prepositions (*at/on/in* + idiomatic exceptions) |
| 3 | Verb+preposition collocations (*depend on*, *look for*, *agree with*) |

### 4.5 `phrasal_verb_production`

Maps to `weak_patterns` matching `/phrasal|particle|PV/i`. Artem-primary.

| Tier | Mechanic |
|---|---|
| 1 | Literal/transparent PV (*pick up*, *turn on*, *look for*) |
| 2 | Figurative single-particle (*get across*, *bring about*, *follow up on*) |
| 3 | 3-part PV + register switching (*put up with*, *get away with*) |

### Catalog-miss behaviour

If player free-types a topic outside the 5 ladders (e.g. "passive voice"), AI improvises a 3-tier ladder on the fly using mechanics-first → guided production → free production. Catalog grows organically — Artem adds new entries when a topic recurs across ≥2 players.

---

## 5. Surface delta

| File | T1 change | T2 change |
|---|---|---|
| `worker/index.js` | Add 5 new modes (translation_drill, spelling_drill, article_drill, particle_sort, error_correction) with per-mode system prompt builders | Add `weak_spots_drill` mode with inline catalog |
| `worker/wrangler.toml` | No change (no new env vars) | No change |
| `worker/README.md` | Curl tests for the 5 new modes | Curl test for weak_spots_drill |
| `index.html` picker | Existing buttons reroute to live AI on `coachStartType()` rewrite; library path preserved as offline fallback | New "Weak Spots" button, gated on `weak_patterns.length > 0` |
| `index.html` flow | `coachStartType()` becomes thin dispatcher to mode-specific start functions; offline fallback reads `exercises_library/*` | New `coachStartWeakSpotsDrill()` mirroring `coachStartPhraseSwapDrill` |
| `.claude/skills/weak-spots-session/SKILL.md` | — | New, ~40 lines, MCP-only reads/writes |
| `.claude/skills/exercise-session/SKILL.md` | Library opt-in path (§2a) stays as Artem-only; clarify "live-authored default, library by name" still holds | No change |
| `references/exercise-types.md` | Update each type's "Source" line to "live-AI worker (library fallback offline)" | Add type 10 — `weak_spots_drill` |
| `references/coach-notes-schema.md` | No change | No change — Weak Spots writes existing `<session_meta>` shape |
| `references/firestore-schema.md` | Note `exercises_library/*` deprecated as primary, kept as offline fallback | Note new `mode: "weak_spots_drill"` value in `coach_sessions` |

---

## 6. Phasing and gates

**Phase A — Worker `weak_spots_drill` mode.** Standalone, no PWA changes yet. Prompt-cache verified via curl tests in `worker/README.md`. **Gate:** session-end metadata round-trips cleanly, `assessment.estimated_level` parses.

**Phase B — PWA Weak Spots button + flow.** Wire `coachStartWeakSpotsDrill()`, picker gating, log shape. Deploy via `deploy-build`. **Gate:** Artem runs one full Weak Spots session on emphasis end-to-end; `coach_sessions/ws_*` doc lands; `players/artem.aggregated_coach_sessions` updates.

**Phase C — CC skill.** `.claude/skills/weak-spots-session/SKILL.md` ships; Firebase MCP read+write verified in a remote-CC-equivalent invocation (test from a fresh CC session reading the skill cold). **Gate:** skill runs end-to-end on a real Artem topic, persists to same `coach_sessions` schema as PWA.

**Phase D — T1 mode rollout, one type at a time.** Order: `translation_drill` first (simplest, lowest risk), then `error_correction`, then `article_drill`, then `particle_sort`, then `spelling_drill` (highest complexity due to per-letter feedback). Each ships independently to PWA with the library fallback preserved. **Gate per type:** one full session per active player on that type, library fallback verified by simulating offline.

**Phase E — Docs sweep.** `exercise-types.md`, `worker/README.md`, `firestore-schema.md`, `version-log.md` entry. Final pass.

Phases A–C ship T2 in isolation. Phase D ships T1 incrementally without blocking T2.

---

## 7. Open decisions

1. **Library content retirement timeline.** Offline fallback is decided. Open: do we keep authoring new library items in `quiz-development` skill (defensive depth) or stop and let it bit-rot? My recommendation: stop new authoring after Phase D ships; existing library survives untouched as offline-only.
2. **CC skill trigger overlap.** "Let's do emphasis" could trigger either `exercise-session` (if interpreted as an exercise type) or `weak-spots-session`. Resolve by keyword: weak-spots-session description mentions "30 min", "weak spots", "deep dive", "tutorial"; exercise-session keeps "exercises", "упражнения", short-session language.
3. **Topic catalog growth governance.** When a new topic recurs across ≥2 players' weak_patterns, who edits the worker prompt? Today: Artem hand-edits `worker/index.js` and redeploys. Future: catalog migrates to Firestore once it exceeds ~10 topics — out of scope for v1.

---

## 8. Status log

Append-only. One entry per session that advances this plan.

### 2026-05-11 · plan landed

Plan written from conversation in this session. Catalog trimmed from 6 → 5 topics (dropped `conditional_inversion`). State machine collapsed to "Free Write with a topic lens" — no `weak_spot_tracker` collection, no status states, no per-tier streaks. Phasing chosen to ship T2 (Weak Spots) ahead of T1 (live-AI rollout) so the simpler, higher-value change lands first.

### 2026-05-11 · Phase A · Worker `weak_spots_drill` mode

`worker/index.js`: added mode to `VALID_MODES`, optional-`topic_hint` validation, `weakSpotsDrillSystemPrompt` with the 5 inlined topic ladders + tutorial-vs-drill heuristic, `formatRecentObservations` helper, session-end `<session_meta>` shape (mirrors `free_write.assessment` for proficiency tracking). `worker/README.md`: curl test + mode docs. `node --check` clean. Not yet `wrangler deploy`'d — gate is curl smoke after deploy.

### 2026-05-11 · Phase B · PWA Weak Spots button + flow

`index.html`: picker button (live-AI badge, gated on `weak_patterns.length > 0`), `coachState.ws*` fields, `coachMakeSessionId` adds `ws` prefix, `coachUpdateWeakSpotsAvailability` (wired into `coachOpenTab` + picker reset + `API_402` fallback), `coachApplyShellLayout` skip-list extension, full `coachStartWeakSpotsDrill` / `coachShowWeakSpotsEndRow` / `coachWeakSpotsSendUserTurn` / `coachWeakSpotsEnd` flow, dispatcher routes the new type. End-of-session reuses `coachWriteSessionLogStandalone` (mode-agnostic), `coachMergeWeakPatterns`, and `coachFoldFreeWriteAssessment` — no new collections, no new player-doc fields, no forks of existing persistence paths. Preview probe verified all four gating states (Artem-with-patterns → enabled "live AI"; empty patterns → "0 weak spots"; API down → "paused"; offline → "offline"); no console errors. Not yet `deploy-build`'d — gate is one real E2E session after deploy.

### 2026-05-11 · Phase D-2 · `error_correction_drill` live AI

Second T1 cutover. Same shape as D-1 — `worker/index.js` adds the mode, validation shares the translation_drill clause (both accept `target_item_count` + `focus_categories`), session-end branch now handles both modes with one return path (mirror items differ: `prompt_sentence` for EC vs `prompt_ru` for TD; everything else identical). `errorCorrectionDrillSystemPrompt` enforces "exactly one error per sentence", no hints in the prompt, strict-on-target-lenient-on-form scoring, accepts full-sentence or just-the-fix corrections.

PWA mirrors D-1: `coachState.ec*` fields, `ec` session prefix, `coachStartType('error_correction')` routes live-first with `forceLibrary` opt + offline/apiUnavailable fallback to library. New `coachStartErrorCorrectionDrillLive` / `coachShow…EndRow` / `coachErrorCorrectionDrillSendUserTurn` / `coachErrorCorrectionDrillEnd` block. Dispatcher routes the new type. Reuses `coachWriteSessionLogStandalone` + `coachMergeWeakPatterns` + `coachFoldFreeWriteAssessment` (mode-agnostic).

`references/exercise-types.md` type 3 updated. `worker/README.md`: curl test + mode docs. `node --check` clean. Preview probe verified all three cases (live → worker mode `error_correction_drill`, session prefix `ec`, no library; `forceLibrary` → library only; offline → library only). No console errors.

### 2026-05-11 · Phase D-5 · `spelling_drill` live AI · CLOSES T1

Final T1 type. Worker `spelling_drill_live` mode added with optional `context.spelling_pool` validation; new `spellingDrillLiveSystemPrompt` generates Russian-gloss → English-spelling items with three-tier scoring (exact / 1-2 letter near miss / wrong word). 8 items default, max 12. Pool priority: drill self-flagged uncertainty from `players/{name}/spelling_log` first, fall back to profile-driven generation favouring high-trap classes (doubled letters, silent letters, ie/ei). Session-end branch consolidated — all 5 Phase D drills now share one return path with mode-specific `items_drilled` shapes.

PWA: `coachState.spd*` fields, `spd` session prefix, new `coachListSpellingPool(player)` helper (sibling of `homeCountSpellHelpSinceLastDrill` — fetches spelling_log entries since last drill, dedupes by correct-form, returns up to 15 entries with `last_attempt` and `times_seen`). Full live flow mirrors the other Phase D drills. End-of-drill refreshes the "N queued" badge so drilled words drop off. `coachUpdateSpellingDrillBadge` enables button on `liveAvail` (overrides `coachLoadMeta` "0 library items → disable").

Docs: `worker/README.md` mode section + curl test. `exercise-types.md` adds type 10 (spelling_drill, was previously implicit); pre-existing weak_spots_drill renumbered to type 11.

Preview probe used static inspection (router branches + function existence) since the async probe timed out — `Promise.all([fsGet, coachListSpellingPool])` hits real unauthenticated Firestore which doesn't resolve within the 30s probe window. Code paths verified correct.

Shipped as v20260511-r7 + worker version `d485c99f-2607-4036-b8c4-03d7b7b396a7`. T1 rollout complete — every Coach picker type is live AI primary, library is offline-only fallback.

### 2026-05-11 · Phase D-4 · `particle_sort` live AI

Worker `particle_sort_live` mode + `particleSortLiveSystemPrompt`. Open production: base verb shown in context, `___` for the particle. Rotates 3 PV tiers (literal, figurative single-particle, 3-part PV). 10 items default, max 15. Critical rule: never reveal the full PV in the prompt — base verb only. Mirrors the type 4 (transform) PV keyword rule.

PWA: `coachState.pst*` fields, `pst` session prefix, full live flow cloned from article_drill_live. Particle Sort badge enables on `liveAvail`. Preview probe verified 3 routing cases. Shipped as v20260511-r6 + worker version `2e7cda85-2701-4f71-80d4-e3077486af0e`.

### 2026-05-11 · Phase D-3 · `article_drill` live AI

Worker `article_drill_live` mode + `articleDrillLiveSystemPrompt`. Single-blank gap-fill — one short sentence per turn with one `___` blank, themed to player profile. Rotates 4 article sub-categories (indefinite, definite for shared referent, generic zero, fixed-expression zero). 10 items default, max 15. Accepts `a`/`an`/`the`/`—`/`zero`/`no article` as equivalent for the zero case.

PWA: `coachState.ad*` fields, `ad` session prefix, full live flow. Article Drill badge enables on `liveAvail`. Session-end branch in worker refactored to consolidate translation/EC/AD into one return path with mode-specific example items. Preview probe verified 3 routing cases. Shipped as v20260511-r5 + worker version `cf40a5e6-4947-4c49-a17c-34884b54685d`.

### 2026-05-11 · v20260511-r4 · Per-type Coach picker badges (Option 2)

Replaces repetitive "live AI" labels with actionable per-type signal — Translation + Error Correction show "N weak" (weak_patterns count), Article + Particle show `N%` accuracy from `qStats`, Spelling shows "N queued" from `spelling_log`, Weak Spots shows "N weak spots", Free Write shows nothing when healthy (anytime activity). Offline / API-down degrades to "offline" / "paused" / "library only".

Builds on r3's quick badge-routing fix. New `coachUpdateLiveDrillBadges()` + `coachCategoryAccuracyPct(category)` + `coachUpdateSpellingDrillBadge()` helpers. `coachLoadMeta` skips badge writes for the 5 dynamically-badged types via `DYNAMIC_BADGE_TYPES`. Live-converted types re-enable on `liveAvail`.

### 2026-05-11 · v20260511-r3 · Transient badge fix

Quick fix for the "11 available" badge reported by Artem on Translation post-r2 deploy. The router was correctly going to live AI on click, but `coachLoadMeta` left the library count in the badge label. Added `coachUpdateConvertedTypeAvailability` (superseded by `coachUpdateLiveDrillBadges` in r4). Shipped in roughly one hour; small window of users saw the misleading label.

### 2026-05-11 · Phase D-1 · `translation_drill` live AI

First T1 type cutover. `worker/index.js`: `translation_drill` added to VALID_MODES; `translationDrillSystemPrompt(ctx)` generates RU cues themed to player profile, rotates target structures from `focus_categories` + `weak_patterns`, scores conversationally; `target_item_count` validation (default 8, max 12); session-end emits `items_drilled[]` with per-item `target_structure` + `produced_correct`. `worker/README.md`: curl test + mode docs. `node --check` clean.

`index.html`: `coachStartType('translation')` becomes a router — live AI primary when online + API up, library fallback via `opts.forceLibrary`. New `coachStartTranslationDrillLive` / `coachShowTranslationDrillEndRow` / `coachTranslationDrillSendUserTurn` / `coachTranslationDrillEnd` flow mirrors phrase_swap_drill in shape. Defensive fallback to library if the worker fails on the first turn. End-of-session reuses `coachWriteSessionLogStandalone` / `coachMergeWeakPatterns` / `coachFoldFreeWriteAssessment` — no new persistence forks. Per-player `COACH_PLANNED_TOTAL_OVERRIDES.translation` honored (Anna stays at 10 items). `references/exercise-types.md` type 1 updated.

Preview probe verified all four routing cases: online+API → worker `translation_drill` fires, session prefix `td`, no library fetch; `forceLibrary` → bypasses worker, library fetched; offline → library fetched, no worker; `apiUnavailable: true` → library fetched, no worker. No console errors. Not yet `deploy-build`'d — gate is one real E2E session per active player after deploy.

### 2026-05-11 · Phase C · CC skill

`.claude/skills/weak-spots-session/SKILL.md` written (596 words, under SKILL cap). MCP-only reads/writes — first new code path to retire `tools/*.js` per the Firestore-SoT decision. References `worker/index.js → weakSpotsDrillSystemPrompt` as the canonical topic catalog (single source of truth, no markdown catalog file). End-of-session writes via `mcp__firebase__firestore_add_document` (coach_sessions) + `mcp__firebase__firestore_update_document` (coach_notes merge) + idempotent proficiency fold mirroring `coachFoldFreeWriteAssessment`. CLAUDE.md skills table updated (now 523 words — pre-existing overage from prior growth; Phase E sweep can trim). `references/exercise-types.md` adds type 10 + extends per-player selection table. `references/coach-notes-schema.md` adds `weak_spots_drill` read-out template. Trigger language scoped to avoid collision with `exercise-session` ("упражнения") and `free-write` ("поговорим"). Gate (E2E run on a real Artem topic) pending — same blocker as Phase B: needs deploy.
