# Operational rules

Inviolable do/don'ts. One line each, with a pointer to the rationale. If you're tempted to break one, read the rationale first.

## Don'ts

- **Don't bypass `tools/update_coach_notes.js`** for `coach_notes` writes. The script handles the FIFO cap and `last_updated` automatically. → `coach-notes-schema.md`
- **Don't generate generic exercise sentences** ("the man went to the shop"). Use the named player's tagged themes from `family-profiles.md`. → `family-profiles.md`
- **Don't push without running the pre-deploy checklist.** → `pre-deploy-checklist.md`
- **Don't bump the version in only some of the four places.** It must be identical across HTML badge, `sw.js` cache key, version constant, git commit prefix. → `pre-deploy-checklist.md` §7
- **Don't write to Firestore via direct REST from session code.** Use `tools/log_exercise.js` / `tools/update_coach_notes.js`. → `firestore-schema.md`, `tools/README.md`
- **Don't change a write path or surface without updating `docs/data-flow.md`.** Inventory + diagrams + pre-redesign checklist live there. → `docs/data-flow.md`
- **After editing any capped doc, run `wc -w <file>` before committing.** Caps from `doc-style.md`; CI will fail otherwise. → `doc-style.md`

## Invariants

- **Version string format `vYYYYMMDD-tN`.** s series ended at s100; new sessions use the `t` prefix. Same-session rebuilds append `r2`, `r3`. → `pre-deploy-checklist.md` §7
- **Question bank stays inline** in `index.html` as `const ALL_QUESTIONS = [...]`. → `design-decisions.md` (Questions stay inline)
- **Auto-memory is for CC-behavior facts only** (how Claude Code should work with the user). Player observations, profile updates, and session learning notes go to Firestore `coach_notes` via `tools/update_coach_notes.js` — never auto-memory (laptop-only, won't reach the PWA Coach tab or mobile sessions). → `design-decisions.md` (Two-layer memory model)
- **Canonical exercise type names** are enforced by `tools/log_exercise.js`. → `exercise-types.md`
