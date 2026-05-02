# Version Log — pre-s87 (archive)

RTDB-era sessions, archived from `references/version-log.md` for context conservation. The s87 cutoff is the RTDB → Firestore migration; everything below predates that.

For full detail on any of these, see the archived HTML KB at `archive/quiz_knowledge_base_v20260428-s87.html`.

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

## Earlier sessions (1–76)

Highlights from the archived HTML KB:

- **S76**: Spaced repetition with interval scaling (1d → 2d → 4d → 7d → 14d). 76 orphaned questions outside ALL_QUESTIONS recovered.
- **S72**: Exercises tab + deeplink save (S71). PUT → PATCH for exercise writes. Deeplink schema.
- **S70**: Transform type added (`tf_*` series), Wordform type added (`wf_*` series).
- **S63**: Per-question authoring checklist enforced. MCQ stem specificity rules.
- **S56**: Consolidation Mode added for Nicole (player-corrected questions only).
- **S34**: Session-end metacognitive reflection ("Weakest this session: ...").
- **S31**: Big B1 expansion + new categories (Used To, Indirect Questions). Nicole/Ernest blocker addressed.
- **S25**: Hint and exp standards formalised. Contrastive exp requirement.
- **S20–S21**: Emergency bugfixes (FAMILY_MEMBERS corruption, missing comma, document.write).
