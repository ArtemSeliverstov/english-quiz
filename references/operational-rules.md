# Operational rules

Inviolable do/don'ts. One line each, with a pointer to the rationale. If you're tempted to break one, read the rationale first.

## Read philosophy before design-shaping work

`docs/learning-system-design.md` is the doctrine. Read §1, §3 (conversation keystone), §4 (drill design rules), §6 (don't-build list) before any **design-shaping** proposal. If the proposal conflicts with a section, surface the conflict ("this conflicts with §X — does philosophy need revising, or should the proposal back off?"). Don't silently override.

**Design-shaping triggers** (read the doc):
- Proposing a new exercise type, picker button, surface, or tab
- Adding/removing a Firestore field or schema element
- Renaming a player-facing concept
- Changing how the AI behaves cross-cuttingly (prompt protocol, verbosity, scoring)
- Drafting a new skill or substantively reshaping an existing one
- Any chat-side proposal that introduces a new pattern (not just executing an old one)
- Architectural root-cause debugging (a missing rule usually wants to land in doctrine)

**Skip when** (operational, no read needed):
- Running an existing skill (free-write, exercise-session, weak-spots-session)
- `stats-review` / `mistakes-review` (analysis within the design, not changing the design)
- Question authoring in existing categories
- Bug fixes that preserve behaviour
- Doc edits without semantic change
- `deploy-build` (validate + push)

→ `docs/learning-system-design.md` §7 (Living evolution).

## Don'ts

- **Don't bypass `tools/update_coach_notes.js`** for `coach_notes` writes. The script handles the FIFO cap and `last_updated` automatically. → `coach-notes-schema.md`
- **Don't generate generic exercise sentences** ("the man went to the shop"). Use the named player's tagged themes from `family-profiles.md`. → `family-profiles.md`
- **Don't push without running the pre-deploy checklist.** → `pre-deploy-checklist.md`
- **Don't bump the version in only some of the four places.** It must be identical across HTML badge, `sw.js` cache key, version constant, git commit prefix. → `pre-deploy-checklist.md` §7
- **Don't write to Firestore via direct REST from session code.** Use `tools/log_exercise.js` / `tools/update_coach_notes.js`. → `firestore-schema.md`, `tools/README.md`
- **Don't change a write path or surface without updating `docs/data-flow.md`.** Inventory + diagrams + pre-redesign checklist live there. → `docs/data-flow.md`
- **After editing any capped doc, run `wc -w <file>` before committing.** Caps from `doc-style.md`; CI will fail otherwise. → `doc-style.md`

## Cross-cutting principles

- **P1 — Weakest quiz category is always a Weak Spots candidate.** The Weak Spots topic proposal must include the player's weakest catStats category (lowest accuracy, min sample size) mapped to its catalog topic — even if no `weak_patterns` entry mentions it by name. Implementation: `coachWeakSpotsTopicCandidates()` unions catalog-regex matches against `weak_patterns` with the `CAT_TO_TOPIC` mapping of bottom-N `catStats`. Worker context includes `weakest_categories` array; prompt instructed to surface them in topic proposals. → `worker/index.js` `weakSpotsDrillSystemPrompt`, `coachUpdateWeakSpotsAvailability`.

- **P2 — PWA and CC exercise paths mirror.** Any exercise type runnable on PWA (Coach tab) must be runnable in CC (via skill), and vice versa. Both surfaces write to the same `coach_sessions/{prefix}_*` schema; differences are surface-level (input UI, model used) not data-level. Adding a new mode requires both a worker mode and a CC skill before the type is considered shipped. → `references/exercise-types.md`, `.claude/skills/{exercise-session,free-write,weak-spots-session}/SKILL.md`.

- **P3 — Every response is captured for the feedback loop.** Every player-coach exchange persists to `players/{name}/coach_sessions/{id}.messages[]` (canonical) + mirrored summary to `players/{name}/exercises/{ts}` for the history view. `stats-review` skill reviews these in batch to update `weak_patterns` / `recent_session_signals` / `coach_drill_stats`. Sessions that bypass logging (e.g. errors that drop messages) are bugs, not allowed states. → `worker/index.js`, `coachWriteSessionLogStandalone`, `stats-review` SKILL §1.

## Invariants

- **Version string format: date-only `vYYYYMMDD`** (since 2026-05-07). Same-day rebuilds append `-r2`, `-r3`. Legacy `-sN`/`-tN` valid in history only. → `pre-deploy-checklist.md` §7
- **Question bank stays inline** in `index.html` as `const ALL_QUESTIONS = [...]`. → `design-decisions.md` (Questions stay inline)
- **Auto-memory is for CC-behavior facts only** (how Claude Code should work with the user). Player observations, profile updates, and session learning notes go to Firestore `coach_notes` via `tools/update_coach_notes.js` — never auto-memory (laptop-only, won't reach the PWA Coach tab or mobile sessions). → `design-decisions.md` (Two-layer memory model)
- **Canonical exercise type names** are enforced by `tools/log_exercise.js`. → `exercise-types.md`
