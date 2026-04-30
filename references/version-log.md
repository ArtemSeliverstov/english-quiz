# Version Log

Session-by-session history. Newest first.

For full detail on any older session, see the archived HTML KB:
`archive/quiz_knowledge_base_v20260428-s87.html`.

This markdown summarises only — full bug logs, design rationales, and code
specifics live in their dedicated reference files.

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

## 2026-04-16 · Session 86
### v20260416-s86 — Emphasis category audit. 11 question fixes.

Triggered by 57% accuracy across ~30 attempts plus user screenshots showing
broken questions.

- tf_32 keyword-in-stem bug (critical): keyword "ONLY" was placed in stem before
  the blank — validator always rejected correct answers because typed answer never
  contained "ONLY". Rewrote with new source.
- Other Emphasis fixes: emph_i02, inv05, tf_42, tf_43

Q count: 1,872 (unchanged)

---

## 2026-04-13 · Session 85
### Exercises guide updated. Article Decision Drill + slot expansions.

- Slot plan adjustments for Artem
- Exercises guide v20260413-s85

---

## 2026-04-06 · Session 84
### Article diagnostic. Pattern-specific L1 notes. Discourse-stem rule for B2+.

- 5 pattern-specific L1 note templates for articles (replaces generic "Russian has no articles")
- Discourse stem rule: B2+ a→the questions MUST use two-sentence stems
- Backlog item D1: 152-question article exp rewrite to use new templates
- этот/тот Russian bridge added at B1 only with caveat

---

## 2026-04-04 · Session 82
### Firebase questions migration ROLLED BACK.

- s78 → s81 had migrated ALL_QUESTIONS to RTDB. Three failures: endless mobile spinner
  (~800KB fetch stalls), stats data loss (Nicole lost 34 sessions via SW cache bust + PUT),
  Claude couldn't read 1.1MB question uploader.
- s82 reverted: questions inline in index.html again
- Preserved improvements from s80–s81: PUT→PATCH, empty-data guard, lastWrong field, date normalisation
- Lesson logged: don't externalize data Claude needs to read/edit unless Claude has reliable remote access.

---

## 2026-03-29 · Sessions 77–78
### Firebase questions migration designed and executed (later rolled back).

- S77: investigation, plan, Claude Code roadmap identified
- S78: questions moved to RTDB; index.html reduced from 1,021 KB to 204 KB
- (Later: s82 rollback)

---

## Earlier sessions

For sessions 1–76, see the archived HTML KB. Highlights:

- **S76**: Spaced repetition with interval scaling (1d → 2d → 4d → 7d → 14d). 76 orphaned questions outside ALL_QUESTIONS recovered.
- **S72**: Exercises tab + deeplink save (S71). PUT → PATCH for exercise writes. Deeplink schema.
- **S70**: Transform type added (`tf_*` series), Wordform type added (`wf_*` series).
- **S63**: Per-question authoring checklist enforced. MCQ stem specificity rules.
- **S56**: Consolidation Mode added for Nicole (player-corrected questions only).
- **S34**: Session-end metacognitive reflection ("Weakest this session: ...").
- **S31**: Big B1 expansion + new categories (Used To, Indirect Questions). Nicole/Ernest blocker addressed.
- **S25**: Hint and exp standards formalised. Contrastive exp requirement.
- **S20–S21**: Emergency bugfixes (FAMILY_MEMBERS corruption, missing comma, document.write).

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
