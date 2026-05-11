# CLAUDE.md — english-quiz repo

Repo-level instructions for Claude Code. Read this before any task.

---

## Project at a glance

Single-file PWA for 5 Russian-speaking family members in Bahrain. Hosted at `artemseliverstov.github.io/english-quiz` via GitHub Pages.

- **Stack**: HTML/CSS/JS in one file (`index.html`, ~1.3 MB). Service worker (`sw.js`).
- **Sync**: Cloud Firestore. Players: artem, anna, nicole, ernest, egor.
- **Local**: IndexedDB primary, localStorage backup.
- **Surfaces**: Claude Code + PWA Coach tab.

---

## Reference docs — read before any task

The KB is the authoritative source. CLAUDE.md is only a routing layer.

| File | Use when |
|---|---|
| `references/operational-rules.md` | Before any change. Inviolable do/don'ts. |
| `references/doc-style.md` | Before writing or editing any doc. |
| `references/family-profiles.md` | Any session involving a player. Stable level/focus per person. |
| `references/exercise-types.md` | Running exercises. Type definitions. |
| `references/weekly-slots.md` | Artem's weekly schedule. |
| `references/question-schema.md` | Authoring or editing questions. |
| `references/question-authoring-standards.md` | Writing q/exp/hint fields. |
| `references/pre-deploy-checklist.md` | Before any push. |
| `references/firestore-schema.md` | Reading/writing player or exercise data. |
| `references/coach-notes-schema.md` | Updating `coach_notes`. Two-layer memory + promotion rule. |
| `references/coverage-matrix.md` | Coverage targets per category. |
| `references/stats-interpretation-guide.md` | Stats reviews. Act-on rules + compromised categories. |
| `references/question-bank-taxonomy.md` | Auditing the bank. |
| `references/bug-log.md` | Before changing code. |
| `references/design-decisions.md` | Why-we-did-X notes. |
| `references/roadmap.md` | Next, deferred. |
| `references/version-log.md` | Session history. |
| `tools/README.md` | Firestore CRUD scripts. Firebase MCP preferred for new paths. |
| `worker/README.md` | Cloudflare worker (AI proxy). |

When standards in references conflict with this CLAUDE.md, **references win**.

---

## Progress trackers — user-facing reports

Living documents the user reads. Refreshed by skills, not authoritative doctrine.

| File | Owner | Refreshed by |
|---|---|---|
| `progress/phrasal-verbs-tracker.md` | Artem (B1–C1, business + cycling) | `stats-review` (per-PV status + Freq) |
| `progress/phrasal-verbs-tracker-anna.md` | Anna (A1–B1, family + daily life) | `stats-review` (per-PV status + Freq) |
| `progress/natural-phrases-tracker-{name}.md` × 5 | one per player | `stats-review` — **generated** view of `players/{name}.phrase_tracker`, never hand-edit |

---

## Skills (auto-load by trigger)

| Skill | Triggers |
|---|---|
| `exercise-session` | "let's do exercises", "упражнения" — any of 5 players (Egor included) |
| `free-write` | "let's free write", "поговорим", "пообщаемся" — CC-side; others via PWA |
| `weak-spots-session` | "30 min on X", "weak spots session", "deep dive on Y" — tier-walked ~30-min depth on one topic |
| `quiz-development` | "add questions", "fix question", "audit", question authoring |
| `stats-review` | Stats JSON upload, "review stats", "analyse Anna's progress" |
| `routing-audit` | "audit landing", "check routing" — learner-shell CTA + batch alignment |
| `mistakes-review` | "review mistakes" + daily 07:30 — triage past-31h (genuine vs quality bug + sibling sweep) |
| `deploy-build` | "deploy", "ship it", "push the changes", any pre-deploy validation |

Skills orchestrate; they don't repeat reference content.
