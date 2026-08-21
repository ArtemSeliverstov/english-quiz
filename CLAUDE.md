# CLAUDE.md — english-quiz repo

---

## Project at a glance

Single-file PWA for 5 Russian-speaking family members in Almaty. Hosted at `artemseliverstov.github.io/english-quiz`.

- **Stack**: one-file HTML/CSS/JS (`index.html`, ~1.65 MB) + `sw.js`.
- **Sync**: Cloud Firestore. Players: artem, anna, nicole, ernest, egor.
- **Local**: IndexedDB primary, localStorage backup.
- **Surfaces**: Claude Code + PWA Coach tab.

---

## Reference docs

CLAUDE.md only routes.

| File | Use when |
|---|---|
| `README.md` | Folder contract + house rules. |
| `docs/learning-system-design.md` | **Before design-shaping work.** Doctrine: engagement-first, conversation keystone, don't-build rules. |
| `docs/audience-profiles.md` | Per-player design + case studies. |
| `docs/system-mechanisms.md` | Active window, surfaces, AI roles, stats stores. |
| `docs/data-flow.md` | Before changing write paths. Surface→Firestore flows. |
| `references/operational-rules.md` | Before any change. Do/don'ts + P1-P3 + read-philosophy triggers. |
| `references/doc-style.md` | Writing any doc. |
| `references/family-profiles.md` | Any player session. Stable level/focus. |
| `references/exercise-types.md` | Running exercises. Type definitions. |
| `references/weekly-slots.md` | Artem's weekly schedule. |
| `references/question-schema.md` | Authoring questions. |
| `references/question-authoring-standards.md` | q/exp/hint field standards. |
| `references/pre-deploy-checklist.md` | Before any push. |
| `references/firestore-schema.md` | Reading/writing player data. |
| `references/coach-notes-schema.md` | Updating `coach_notes`. |
| `references/coverage-matrix.md` | Coverage targets per category. |
| `references/stats-interpretation-guide.md` | Stats reviews. |
| `references/question-bank-taxonomy.md` | Auditing the bank. |
| `references/bug-log.md` | Before changing code. |
| `references/design-decisions.md` | Why-we-did-X notes. |
| `references/roadmap.md` | Next, deferred. |
| `references/version-log.md` | Session history. |
| `plans/README.md` | Build-plans index. |
| `diagnostics/` | Assessment instruments + scored results. |
| `library_drafts/` | Coach-library authoring source. |
| `tools/README.md` | Firestore CRUD; MCP preferred. |
| `worker/README.md` | Cloudflare worker. |

References win on conflict.

---

## Progress trackers

| File | Owner | Refreshed by |
|---|---|---|
| `progress/phrasal-verbs-tracker.md` | Artem | `stats-review` (status + Freq) |
| `progress/phrasal-verbs-tracker-anna.md` | Anna | `stats-review` (status + Freq) |
| `progress/natural-phrases-tracker-{name}.md` × 5 | per player | `stats-review` — **generated** view of `phrase_tracker`, never hand-edit |
| `progress/weak-spots-tracker-artem.md` | Artem | `stats-review` — two-tier; builder-only |
| `progress/exercise-domain-map-artem.md` | Artem | `stats-review`/on-demand — leverage-sorted program view; ▲ zone opens sessions. |

---

## Skills (auto-load by trigger)

| Skill | Triggers |
|---|---|
| `business-lesson` | "урок", "lesson", "business english" — Artem daily hour |
| `exercise-session` | "exercises", "упражнения" — 5 players |
| `free-write` | "free write", "поговорим", "пообщаемся" — CC-side |
| `interview-prep` | "interview prep", "mock interview" — Artem audio-first |
| `weak-spots-session` | "30 min on X", "weak spots", "deep dive" |
| `math-session` | "математика", "физика", "math session" — Nicole/Ernest, CC + доска |
| `quiz-development` | "add questions", "fix question", "audit" — authoring |
| `stats-review` | Stats JSON upload, "review stats" |
| `routing-audit` | "audit landing", "check routing" — learner-shell CTA alignment |
| `register-check` | "register check", "check my phrasing" — B2/C1 message pass |
| `morning-coach` | cloud 07:00 + "morning brief" |
| `mistakes-review` | "review mistakes" + cloud 07:00 — past-31h triage |
| `deploy-build` | "deploy", "ship it", "push the changes" — pre-deploy validation |
