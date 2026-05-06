# CLAUDE.md — english-quiz repo

Repo-level instructions for Claude Code. Read this before any task.

---

## Project at a glance

Single-file PWA. Five Russian-speaking family members (Bahrain) practise English grammar.
Hosted at `artemseliverstov.github.io/english-quiz`. Deployed via GitHub Pages.

- **Stack**: HTML/CSS/JS in one file (`index.html`, ~1.3 MB). Service worker (`sw.js`).
- **Sync**: Cloud Firestore. Five players: artem, anna, nicole, ernest, egor. Open writes via security rules.
- **Local storage**: IndexedDB primary, localStorage backup.
- **Surfaces**: Claude Code mobile/laptop (you), claude.ai chat (occasional). Future: Coach tab in PWA.

---

## Reference docs — read before any task

The KB is the authoritative source. CLAUDE.md is only a routing layer.

| File | Use when |
|---|---|
| `references/operational-rules.md` | Before any change. Inviolable do/don'ts. |
| `references/doc-style.md` | Before writing or editing any doc. |
| `references/family-profiles.md` | Any session involving a player. Stable level/focus per person. Includes the family one-line table. |
| `references/exercise-types.md` | Running exercises. Defines the 9 exercise types. |
| `references/weekly-slots.md` | Artem's planned weekly schedule. |
| `references/question-schema.md` | Authoring questions or editing existing ones. |
| `references/question-authoring-standards.md` | Writing q/exp/hint fields. |
| `references/pre-deploy-checklist.md` | Before any push to main. Includes the deploy workflow and version-stamp invariant. |
| `references/firestore-schema.md` | Reading/writing player or exercise data. Project ID, endpoint, write semantics. |
| `references/coach-notes-schema.md` | Updating `coach_notes`. Defines the two-layer memory model and promotion rule. |
| `references/coverage-matrix.md` | Coverage targets per category. |
| `references/bug-log.md` | Before changing existing code, search this. |
| `references/design-decisions.md` | Why-we-did-X notes. |
| `references/roadmap.md` | What's next, what's deferred. |
| `references/version-log.md` | Session-by-session history. |
| `tools/README.md` | Firestore CRUD scripts (`get_player.js`, `log_exercise.js`, `update_coach_notes.js`). The canonical write path while Firebase MCP lacks document tools. |
| `worker/README.md` | Cloudflare worker (AI proxy). |

When standards in references conflict with this CLAUDE.md, **references win**.

---

## Progress trackers — user-facing reports

Living documents the user reads. Refreshed by skills, not authoritative doctrine.

| File | Owner | Refreshed by |
|---|---|---|
| `progress/phrasal-verbs-tracker.md` | Artem (B1–C1, business + cycling) | `stats-review` (per-PV status + Freq) |
| `progress/phrasal-verbs-tracker-anna.md` | Anna (A1–B1, family + daily life) | `stats-review` (per-PV status + Freq) |
| `progress/natural-phrases-tracker-artem.md` | Artem | `stats-review` — **generated** view of `players/artem.phrase_tracker`, never hand-edit |
| `progress/natural-phrases-tracker-anna.md` | Anna | `stats-review` — **generated** view of `players/anna.phrase_tracker`, never hand-edit |
| `progress/natural-phrases-tracker-nicole.md` | Nicole | `stats-review` — **generated** view of `players/nicole.phrase_tracker`, never hand-edit |
| `progress/natural-phrases-tracker-ernest.md` | Ernest | `stats-review` — **generated** view of `players/ernest.phrase_tracker`, never hand-edit |
| `progress/natural-phrases-tracker-egor.md` | Egor | `stats-review` — **generated** view of `players/egor.phrase_tracker`, never hand-edit |

---

## Skills (auto-load by trigger)

| Skill | Triggers |
|---|---|
| `exercise-session` | "this is X, let's do exercises", "давай упражнения", any exercise request for any of the 5 family members (Egor included as of 2026-05-06) |
| `free-write` | "let's free write", "поговорим", "пообщаемся" — CC-side Free Write for Artem (other family members use the PWA Coach tab Free Write button) |
| `quiz-development` | "add questions", "fix question", "audit", question authoring |
| `stats-review` | Stats JSON upload, "review stats", "analyse Anna's progress" |
| `routing-audit` | "audit landing", "check routing", "are X being routed correctly", "is COUNT/N items justified", "review batch sizes" — learner-shell CTA + batch-size alignment |
| `deploy-build` | "deploy", "ship it", "push the changes", any pre-deploy validation |

Skills orchestrate; they don't repeat reference content.
