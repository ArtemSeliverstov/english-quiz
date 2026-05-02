# Operational rules

Inviolable do/don'ts. One line each, with a pointer to the rationale. If you're tempted to break one, read the rationale first.

## Don'ts

- **Don't write to RTDB.** Frozen since v20260428-s87, sunset ~2026-05-28. → `design-decisions.md` (Firestore over RTDB)
- **Don't move questions to Firestore or any external store.** Tried in s78, rolled back s82. → `design-decisions.md` (Questions stay inline)
- **Don't bypass `tools/update_coach_notes.js`** for `coach_notes` writes. The script handles the FIFO cap and `last_updated` automatically. → `coach-notes-schema.md`
- **Don't generate generic exercise sentences** ("the man went to the shop"). Use real-life context for the named player. → `family-profiles.md`
- **Don't push without running the pre-deploy checklist.** → `pre-deploy-checklist.md`
- **Don't bump the version in only some of the four places.** It must be identical across HTML badge, `sw.js` cache key, version constant, git commit prefix. → `pre-deploy-checklist.md` §7
- **Don't write to Firestore via direct REST from session code.** Use `tools/log_exercise.js` / `tools/update_coach_notes.js`. → `firestore-schema.md`, `tools/README.md`
- **Don't attempt to delete Firestore documents** in `players/*` or its subcollections (except `exercise_active/*`). Rules forbid it; the request will fail. → `firestore.rules`
- **Don't generate `deploy.html`.** The flow is direct git push. → `design-decisions.md` (Direct git push)
- **Don't bring up sensitive memory items unless the user does first.**

## Invariants

- **Version string format `vYYYYMMDD-tN`.** s series ended at s100; new sessions use the `t` prefix. Same-session rebuilds append `r2`, `r3`. → `pre-deploy-checklist.md` §7
- **Question bank stays inline** in `index.html` as `const ALL_QUESTIONS = [...]`. → `design-decisions.md` (Questions stay inline)
- **Auto-memory disabled** — workflow is mobile-first; laptop auto-memory wouldn't sync. → `design-decisions.md` (Two-layer memory model)
- **Canonical exercise type names** are enforced by `tools/log_exercise.js`. → `exercise-types.md`
