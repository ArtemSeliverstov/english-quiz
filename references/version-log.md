# Version Log

Session-by-session history. Newest first.

For full detail on any older session, see the archived HTML KB:
`archive/quiz_knowledge_base_v20260428-s87.html`.

This markdown summarises only — full bug logs, design rationales, and code
specifics live in their dedicated reference files.

---

## 2026-05-03 · Session t8
### v20260503-t8 — PV tracker + 🏆 graduation rule + Artem foundation drills

End-to-end PV mastery scaffold for Artem. New per-PV tracker, super-rank concept, drills based on a live cold-production test, and tooling to compute streaks.

- **`progress/` folder** added — separate from `references/` (Claude's KB). New canonical doc `progress/phrasal-verbs-tracker.md`: full A1–C1 PV inventory (148 PV-meanings) with Status, Freq (★★★★★ → ★ derived from CEFR + business-exec context), Quiz coverage, Notes. Single master table sorted Freq DESC then alphabetical so lagging high-priority items surface immediately.
- **🏆 super-rank** — new graduation rule on top of 🟢: ≥3 cold-production wins across ≥2 distinct formats, no failure during streak. Decay on failure only (no time-decay). Tier 1 evidence = unprompted PV use in free-write; tiers 2–3 = russian_trap and translation drills. Quiz `gap`/`mcq`/`particle_sort` excluded — recognition, not production.
- **A1–A2 production test** run live with Artem (10 prompts cold). Result: 7/10 PV-correct. Three A2 PVs flagged ⚠ A2 production-weak: *go on* (substituted with non-PV "happening"), *look for* (confused with *look after*), *go back/come back* (direction trap). All three got dedicated drill items.
- **Quiz amendments × 4** in `index.html`: `pv_a01_get_across_g` (gap-scaffold for chronic input), `pv_a02_turn_down_split` (split-form gap with turn off/away/over distractors), `pv_a03_turn_out_disambig` (turn out vs up/in/over), `pv_a04_follow_up_on` (preposition gap). Inserted right after `pv13` (the chronic get_across input). Targets the 5 chronic ★★★★★ PVs the existing Phase 1 plan didn't cover.
- **Exercise library × 5** authored and pushed to Firestore via `push_library.js`: `artem_translation_b01-b03.json` (3 items targeting the 3 weak A2 PVs from the test) + `artem_russian_trap_b01-b02.json` (2 items locking the look_for ↔ look_after pair from both directions). Live in `exercises_library/{translation,russian_trap}/items/`.
- **Worker prompt extended** (`worker/index.js`) — `sessionEndInstructions(mode, ctx)` now player-aware. Artem-only Free Write sessions get an extra `pvs_used_correctly: ["..."]` field in `<session_meta>` schema. **Not yet deployed** — needs `wrangler deploy` from `worker/` separately.
- **Coach tab write** (`index.html`) — `coachWriteSessionLogStandalone` now persists `pvs_used_correctly` to `players/{name}/coach_sessions/{id}`. One-line addition.
- **`tools/pv_cold_streak.js`** (new, 326 lines) — computes per-PV streak from `coach_sessions[].pvs_used_correctly` + `exercises[].items[]` (translation + russian_trap). Output: sorted table (graduated → building → regressing → unstable) or single-PV deep-dive with event timeline. Use during stats-review.
- **Free-write SKILL** updated: silently track PVs Artem produces unprompted; log in `pvs_used_correctly` at session end. Register-rewrite paragraph compressed by ~75 words to make budget. Reads `progress/phrasal-verbs-tracker.md`.
- **Stats-review SKILL** updated to read the tracker; refresh protocol step 2 now references the streak script.
- **Schema doc** (`references/firestore-schema.md`) — added `pvs_used_correctly` row to `coach_sessions` field table (writer: free-write skill + Coach tab Artem-only).
- **CLAUDE.md** — new "Progress trackers" section above Skills, points to `progress/phrasal-verbs-tracker.md` (refreshed at stats-review).

Q count: 1988 (+4) · Version: v20260503-t8

Worker change ships separately via `wrangler deploy` — until then, only CC-side free-write feeds the streak counter.

---

## 2026-05-03 · Library content — Anna russian_trap + spelling_drill expansion (no version bump)

Stats-review-driven content batch for Anna. No engine change, content-only.

- **russian_trap × 8** (`rt_anna_b01-b08`) — first items in this type for any player. Seeded by today's stats-review L1 calque cluster (4–5 sessions in last 7d): wait_for, listen_to, depend_on (preposition swaps), make_decision/do_homework (verb-noun collocations), on_last_week / on_next_week / in_a_week (time prepositions). Each item carries 2+ regex `common_errors`, explicit `calque_trap` field labelling the L1→L2 transfer mechanism, and short isolated prompts (3–6 words target) — different modality from translation drill which uses fuller sentences with context. Three of these surface forms (wait_for, listen_to, depend_on) already had translation items (tr_anna_b01-b03) and re-fired in stats anyway → russian_trap is the active-recall second exposure.
- **spelling_drill +6 items** (`sp_anna_b11-b16`) — necessary, different, interesting, restaurant, favourite, comfortable. Sources: predicted L1 traps (Anna's `players/anna/spelling_log` is empty — Spell Help has not been used yet; switch sourcing once captures land). Brings Anna's spelling_drill total from 10 → 16, into the §4.5 plan target band of 15–20.
- **Coverage now**: Anna translation 20, spelling_drill 16, article_drill 15, russian_trap 8. `_meta.last_authored: 2026-05-03T10:53:22Z`.
- Drafts kept at `library_drafts/anna_russian_trap_b01-b08.json` and `library_drafts/anna_spelling_drill_b11-b16.json` for re-push or audit.

Q count (quiz bank): 1,984 (unchanged) · No deploy.

---

## 2026-05-03 · Session t7
### v20260503-t7 — Hard-remove deeplinks + data-flow doc

Cleanup pass after the 2026-05-02 Nicole contamination postmortem.

- Hard-removed all four deeplink paths (`?exlog=`, `?exstart=`, `?exupd=`, `?exfin=`) from `index.html` — handlers, helpers, toast, and `_exlogMode` branch all gone (~187 lines). `exercise_active` collection now unused; Firestore rule for it removed.
- Deleted `references/deeplink-schema.md`. Routing entry removed from `CLAUDE.md`. Secondary mentions cleaned in `README_FIRST.md`, `references/exercise-types.md`, `tools/README.md`.
- `references/firestore-schema.md` reorganised: writer/reader columns added on every field group; `exercise_active` section removed; `coach_sessions` section added.
- New `docs/data-flow.md` — surface inventory + 5 Mermaid sequence diagrams (incl. the shared-device contamination flow) + pre-redesign checklist. Referenced from a new line in `references/operational-rules.md`.
- `plans/schema-alignment-plan.md` rewritten: 5 tracks → 3 (deeplink alignment dropped from scope).
- `plans/data-integrity-plan.md` moved out of `references/` (lifecycle: it's a plan, not operational KB).

Live PWA loaded clean post-deploy: version badge `v20260503-t7`, no console errors, `exStartActive` / `exFinalize` / `exDeeplinkToast` / `exCleanupStale` all `undefined`.

`firestore.rules` change is committed but not yet deployed — needs `firebase deploy --only firestore:rules` separately. **Update**: deployed by Artem later in the session.

Q count: 1,984 (unchanged) · Version: v20260503-t7

### Session t7 follow-ups (no version bump — tooling/docs only)

Nine commits after the deploy, all tooling and discipline:

- **Daily Firestore backup pipeline (data-integrity P0)**. New `tools/backup_players.js` snapshots each player's doc + `exercises` + `coach_sessions` subcollections to `backups/YYYY-MM-DD/{player}.json`. `.github/workflows/backup.yml` switched from weekly to daily, points at the new script. Snapshots commit to the orphan `backups` branch (separate from main, not Pages-served). First snapshot pushed via manual trigger; cron fires 03:00 UTC daily. RTDB sunset (~2026-05-28) was the deadline.
- **Schema-alignment Tracks 1+2+3.** `firestore-schema.md` now defines the canonical rich shape for `players/{name}/exercises/{ts}` (per-item `items[]`, `tta_stats`, `auto_suspected`, `matched_pattern_id`). `tools/log_exercise.js` accepts `items[]` with per-item validation, computes integrity flags at write time, defaults `source: cc_session`. `exercise-session/SKILL.md` directs CC to populate the same fields PWA Coach tab does (no asymmetry).
- **Write-path defense (P2).** `tools/_firestore.js` `fsSet` now refuses player-root replaces unless explicitly opted in (`opts.allowPlayerReplace` or `ALLOW_PLAYER_REPLACE=1`). The 2026-05-02 contamination was a full-document replace; this guard catches that vector for any future tools/ caller.
- **`get_all_players.js -S` flag** for stats review — fetches `exercises` and `coach_sessions` subcollections alongside player docs, surfaces `auto_suspected` and `tta_mean` in default summary so dubious sessions are visible at a glance. `stats-review` SKILL canonical command updated.
- **Profile rule cherry-picked from a remote CC exercise session** (`5b54803`): Artem stems use operational/hallway register, not pitch-deck.
- **`exercise-session` SKILL fetches `coach_notes` only**, not the full player doc (~150 KB qStats blew past the remote CC tool-output buffer). One-line fix.
- **`exercise-session/SKILL.md` slimmed back under 600w cap** after the Track-1 expansion pushed it to 629w (CI failed; rich-shape JSON example moved to firestore-schema.md, SKILL retains capture rules only).
- **Nicole's player doc restored** from the still-live RTDB (frozen since 2026-04-28 per s87). Contaminated Firestore values wiped, RTDB baseline (780 answered, 480 correct, 39 sessions, 481 qids) merged with the genuine 2026-05-02 session on top. `coach_notes` was preserved through contamination because it's only written by `update_coach_notes.js`, not the play loop.

---

## 2026-05-01 · Session 91
### v20260501-s91 — Phase 2C: Free Write + Escalate live AI

End of Phase 2C build. The Coach tab now has live-AI tutoring for the family path: Free Write conversation with Sonnet 4.6, and one-shot Escalate ("Hmm, explain more") with Opus 4.7 on top of any pre-generated wrong-answer feedback. Both modes proxy through the Cloudflare Worker shipped earlier today (`https://english-quiz-coach.artem2030.workers.dev`); the API key never enters the PWA bundle or Firestore.

**PWA additions (`index.html`):**

- Free Write button enabled in the picker (was greyed "soon"). Click → bundled starter prompt → multi-turn chat with the Worker → "✓ End session" finalises with `is_session_end:true`, parses `<session_meta>` JSON, writes `players/{name}/coach_sessions/{session_id}` per §6.4, and merges `error_patterns_observed` into `coach_notes.weak_patterns` with a `(coach_session)` tag and FIFO cap at 8.
- Escalate button on every wrong-answer translation feedback. One-shot: tap → typing indicator → Opus 4.7 deeper explanation as a follow-up assistant message → action row collapses to "Got it — next" only (no second escalate per §8.5). The current item's result gets `escalation_used: true` (already in the per-item upsert from s90r2). A separate `coach_sessions` doc is written with `mode: "escalate"`, the exercise reference, and the patterns observed.
- Worker call helper with §8.8 failure handling: API_402 disables Free Write/Escalate buttons globally for the rest of the tab session ("Live Coach unavailable — using offline mode"); 5xx gets one retry with backoff; offline disables live AI and shows "offline" on the button; missing Worker URL hides live AI entirely.
- Soft 20-turn cap on Free Write per §8.6 ("We've covered a lot — wrap up?" nudge after turn 20).
- Coach reply rendering: minimal Markdown→HTML (bold, italics, bullets, inline code, blockquotes) so Sonnet/Opus formatting reads cleanly in the chat shell.
- Coach tab now reads `coach_notes` from Firestore at open time and sends `weak_patterns` + `engagement_notes` in every Worker payload as the system-prompt's "About this learner" section. Network state changes (`online`/`offline` events) flip live-AI availability live.

**Smoke-tested in local browser preview** (mocked Worker because CORS blocks `localhost`): full Free Write cycle including `coach_sessions` write + `coach_notes` merge + token tally; Escalate cycle including `escalation_used` flag, separate session log, action-row collapse. Test artefacts cleaned up before deploy.

Worker itself was end-to-end smoke-tested via curl earlier today against the real Anthropic API: free_write returned coherent past-simple feedback (~$0.005), escalate returned 3-pattern Opus breakdown (~$0.022). Total Worker smoke-test spend: ~$0.027.

**Cache observation worth noting**: the current free_write system preamble is ~400 tokens, below Sonnet 4.6's 2048-token minimum cacheable prefix, so the `cache_control` marker is a silent no-op until `coach_notes` data grows. Documented in `worker/README.md`.

Q count: 1,882 (unchanged) · Version: v20260501-s91

---

## 2026-04-30 · Session 90r2
### v20260430-s90r2 — Coach tab: per-item save + article tolerance

Two engine fixes driven by Anna's first real Coach session
(`players/anna/exercises/1777566265897`, raw 1/15 with ~5–7 false negatives from typos and article drops):

- **Per-item Firestore upsert**: every `coachSubmitAnswer` now writes the running session to `players/{name}/exercises/{sessionTs}` with `partial: true`. `coachFinishSession` flips it to `partial: false` at the end. Same doc id reused throughout, so partials survive a closed tab / reload / kicked SW. New `planned_total` field captures the intended item count even on partial saves.
- **Article-tolerant normalize**: `coachNormalize` now strips `a/an/the` before equality comparison. Anna's L1 article-drop was producing false negatives on otherwise-correct answers ("We arrived at court" vs the canonical "We arrived at THE court"). Trade-off — losing definite/indefinite scoring — is intentional for MVP. Pattern-feedback regexes still see the original text so article-specific traps still fire.

Deferred to follow-up: Levenshtein typo tolerance, regex tightening on `jump_in_car_to`/`wait_no_for`, and the bigger ask — replacing the v1 B2 prompts with shorter B1 prompts. Anna's `coach_notes.recent_observations` updated with the session log.

Q count: 1,882 (unchanged) · Version: v20260430-s90r2

---

## 2026-04-30 · Session 90
### v20260430-s90 — Coach tab MVP + Phase 2 docs + Anna translation library

**Coach tab (Phase 2B MVP)** — new 5th tab "🎯 Coach" with stats card (last session, top weak spot, available count), exercise type picker (Translation enabled, others greyed for now, Free Write disabled until 2C), chat-style message renderer, scoring engine (`coachNormalize` + `coachIsMatch` + regex pattern matcher with fallback). Pre-generated translation drills run locally with rich per-pattern feedback — no API call. Reads exercises from `exercises_library/translation/items` filtered by player. Writes session summary to `players/{name}/exercises/{ts}` with `source: 'coach_tab'` and per-item `submitted_answer / matched_pattern_id / escalation_used / time_to_answer_ms`.

**Question bank** — `gi_b04` filled the missing slot in the G&I gerund series (practise + gerund, input type with bracketed complement). `wf_41`–`wf_49` added as `type: 'input'` Word Formation questions covering develop/educate/inform/produce/govern/tradition/expect/understand/convince — first input-type entries in this category, lifts share off literal 0%.

**Phase 2 doc** — new `references/phase2-coach-tab.md` consolidates the full Phase 2 design (Coach tab + Cloudflare Worker proxy schema + library schema + build sequence + parallel tiers + SKILL.md update spec). Locked decisions captured. Predecessor `PHASE2_PLAN.md` superseded.

**Infra** — Firestore security rules checked into the repo (`firestore.rules` + `firebase.json` + `.firebaserc`). Added permissive blocks for `exercises_library/{document=**}` and `players/{name}/coach_sessions/{sessionId}` (same open-write posture as existing `players/exercises`, mitigated by prepaid API ceiling + Anonymous Auth deferred to Phase 3D). New `tools/push_library.js` validates draft schema (common + per-type + ≥3 answers, ≥2 errors, regex compile) and uploads to `exercises_library/{type}/items/{id}` with idempotent meta updates.

**Library** — Anna's first 15 translation exercises drafted to `library_drafts/anna_translation_001-015.json` and pushed live to Firestore. Distribution targets her measured weak_patterns (Grammar mechanics, Vocabulary production, Collocations, Everyday English idioms) plus 4 prepositions per profile-design-intent.

**Skill update** — `skills/exercise-session/SKILL.md` realigned with Phase 2 design: path-specific behaviour (family vs Artem CC), Coach tab note added under "When not to run", logging strategy decision tree replaced.

Smoke-tested locally as Anna: full translation cycle (correct + regex-matched wrong + fallback) including Firestore write of summary; test record cleaned up after.

Q count: 1,882 (+10) · Version: v20260430-s90

---

## 2026-04-29 · Session 89r3
### v20260429-s89r3 — Transform keyword-mask fixes + new pre-deploy audit

- Fixed `emph_i02` (Emphasis): keyword `WHO` was not contained in any accepted `ans` variant → validator blocked every submission. Restructured stem (`It ___ most surprised.`) so the answer must produce `who`.
- Fixed `tf_16` (Comparisons): `cleverest student` variant was unreachable under keyword `MOST`. Source changed to use `intelligent` (multi-syllable, unambiguously requires analytical superlative).
- New `tools/check_transform_keywords.js` enforces two rules on all transforms: every accepted variant must contain the keyword (Rule 1), and the keyword must not appear in the stem (Rule 2 / s86 anti-pattern). ~50ms on full bank.
- Pre-deploy checklist gains Step 2c — runs the new audit unconditionally.

Q count: 1,872 (unchanged) · Version: v20260429-s89r3

---

## 2026-04-29 · Session 89r2
### v20260429-s89r2 — Multi-blank Next-button bug fix + skill improvements

- Fixed `answerMultiBlank` ReferenceError that broke every multi-blank submission since s80r2 (April 1) — bare `allCorrect` → `multiState.allCorrect`
- Symptom (Next button stuck disabled) was identical to s84r4's mobile double-tap bug; root cause was different. Both now documented in `bug-log.md`.
- `pre-deploy-checklist.md` § 9 now mandates a multi-blank end-to-end smoke test
- Skills updated post-session 89: `stats-review` mandates per-question mistake audit + speculation tagging; `quiz-development` requires evidence/confirmation columns; `question-authoring-standards.md` adds the "stem sufficiency test"; new helper `tools/get_question_mistakes.js`
- Confirmed in local preview before push: both all-correct and partial-wrong paths enable Next correctly; `lastWrong` persists as expected

Q count: 1,872 (unchanged) · Version: v20260429-s89r2

---

## 2026-04-29 · Session 89
### v20260429-s89 — Stuck-question fixes from stats review

- Stats review (5 players, all coach_notes empty) flagged 4 high-confidence question issues
- `pv_c03`: accept `pick up` variant — Artem's logged repeat error matched
- `pv_c07`: accept `bring in` variant — Artem typed it 4× ("introduce" reading is also valid for the policy stem)
- `emph_i01`: stem reframed with present-tense lead-in (`I'm genuinely shocked.`) to disambiguate `have I seen` vs `had I seen`
- `inv03`: exp strengthened with `no sooner…than` / `hardly…when` memorise-pair (Artem 0/3, picks "when" trap)
- Lower-evidence items (qf03/qf06/qf07, co_ti03, gr_b01, gr_b15, pv_ti71) deferred — MCQ option text not stored, need richer mistake logging first
- Audit method: cross-referenced `qStats[id].lastWrong` against authoring standards instead of speculating

Q count: 1,872 (unchanged) · Version: v20260429-s89

---

## 2026-04-29 · Session 88
### Phase 1 — Repo restructure for Claude Code

- New repo structure: skills + references markdown + short root CLAUDE.md
- HTML KB deprecated as source of truth; kept in `archive/` for human reading
- coach_notes Firestore field added (bootstrap script in `migration/`)
- Two-layer memory architecture: GitHub repo (stable) + Firestore (dynamic)
- Auto-memory disabled (incompatible with mobile-first workflow)
- Deploy.html flow removed; direct git push from Claude Code
- Phase 2 (Coach tab + Cloudflare Worker) deferred

Q count: 1,872 (unchanged) · Version: v20260429-s88

---

## 2026-04-28 · Session 87
### v20260428-s87 — RTDB → Firestore migration. Stage 1 live exercise log added.

- Database migrated RTDB → Firestore. RTDB frozen as 30-day rollback insurance
- Schema split: `players/{name}` + `players/{name}/exercises/{ts}` + `exercise_active/{session_id}`
- Security: open writes (same posture as RTDB). Anonymous Auth deferred.
- Stage 1 live log: per-item updates via `?exupd=` deeplinks, finalize via `?exfin=`
- PWA Firestore client: `_fsValue/_fsFromValue` typed-value converters and `fsGet/fsSet/fsMerge/fsDelete/fsList` helpers
- Bug found and fixed: migration_script.js had wrong PLAYER_TOP_FIELDS list — only migrated emoji/pin/name. Re-ran after fix.

Q count: 1,872 (unchanged) · Version: v20260428-s87

---

## Earlier sessions (pre-s87)

S86 and earlier are archived in `references/archive/version-log-pre-s87.md`. Cut at the RTDB → Firestore migration. Highlights:

- **S86**: Emphasis category audit, tf_32 keyword-in-stem bug
- **S85**: Article Decision Drill + slot expansions
- **S84**: Article pattern-specific L1 notes; discourse-stem rule for B2+
- **S82**: Firebase questions migration rolled back (s78 → s82)
- **S77–78**: ALL_QUESTIONS moved to RTDB, later rolled back
- **S76**: Spaced repetition with interval scaling
- **S70**: Transform + Wordform types added
- **S63**: Per-question authoring checklist enforced

For full detail see `references/archive/version-log-pre-s87.md` or the archived HTML KB at `archive/quiz_knowledge_base_v20260428-s87.html`.

---

## How to add an entry

After a session that ships:

1. Add new entry at the top with date, session number, version, headline
2. 3-5 bullets max. Major bugs found+fixed, design decisions, q count change
3. Update the "Current state" callout in source archive HTML if regenerating it
4. Move detailed bug content to `bug-log.md`
5. Move detailed design rationale to `design-decisions.md`

This file is the timeline. Bug log, design decisions, and roadmap are the topical
references.
