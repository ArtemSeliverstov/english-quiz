# Version Log

Session-by-session history. Newest first.

For full detail on any older session, see the archived HTML KB:
`archive/quiz_knowledge_base_v20260428-s87.html`.

This markdown summarises only — full bug logs, design rationales, and code
specifics live in their dedicated reference files.

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
