# CLAUDE.md — english-quiz repo

Repo-level instructions for Claude Code working on this project.
Read this before starting any task.

---

## Project at a glance

Single-file PWA. Five Russian-speaking family members (Bahrain) practise English grammar.
Hosted at `artemseliverstov.github.io/english-quiz`. Deployed via GitHub Pages.

- **Stack**: HTML/CSS/JS in one file (`index.html`, ~1.3 MB). Service worker (`sw.js`).
- **Sync**: Cloud Firestore. Five players: artem, anna, nicole, ernest, egor. No auth — open writes via security rules.
- **Local storage**: IndexedDB primary, localStorage backup.
- **Surfaces using this repo**: Claude Code mobile/laptop (you), claude.ai chat (you, occasional). Future: Coach tab in PWA (family).

---

## Reference docs — read before any task

The KB is the authoritative source. CLAUDE.md is only a routing layer.

| File | Use when |
|---|---|
| `references/family-profiles.md` | Any session involving a player. Stable level/focus per person. |
| `references/exercise-types.md` | Running exercises. Defines the 8 exercise types. |
| `references/weekly-slots.md` | Artem's planned weekly schedule. |
| `references/deeplink-schema.md` | Generating `?exlog=` / `?exupd=` / `?exfin=` deeplinks. |
| `references/question-schema.md` | Authoring questions or editing existing ones. |
| `references/question-authoring-standards.md` | Writing q/exp/hint fields. |
| `references/pre-deploy-checklist.md` | Before any push to main. |
| `references/firestore-schema.md` | Reading/writing player or exercise data. |
| `references/coach-notes-schema.md` | Updating a player's `coach_notes` field. |
| `references/coverage-matrix.md` | Coverage targets per category. |
| `references/bug-log.md` | Before changing existing code, search this. |
| `references/design-decisions.md` | Why-we-did-X notes. |
| `references/roadmap.md` | What's next, what's deferred. |
| `references/version-log.md` | Session-by-session history. |

When standards in references conflict with this CLAUDE.md, **references win**.

---

## Skills (auto-load by trigger)

| Skill | Triggers |
|---|---|
| `exercise-session` | "this is X, let's do exercises", "давай упражнения", any exercise request for a named player |
| `free-write` | "let's free write", "поговорим", "пообщаемся" — CC-side Free Write for **Artem only** (other family members use the PWA) |
| `quiz-development` | "add questions", "fix question", "audit", question authoring |
| `stats-review` | Stats JSON upload, "review stats", "analyse Anna's progress" |
| `deploy-build` | "deploy", "ship it", "push the changes", any pre-deploy validation |

Each skill points to specific reference files. Skills don't repeat what's in references — they orchestrate.

---

## Database — Firestore

**Project**: `artem-grammar-hub` · **Database**: `(default)` · **Region**: `eur3 (europe-west)`
**Endpoint**: `https://firestore.googleapis.com/v1/projects/artem-grammar-hub/databases/(default)/documents`

```
players/{name}                          # stats, settings, coach_notes
players/{name}/exercises/{ts}           # supplementary exercise history
exercise_active/{session_id}            # in-progress sessions (Stage 1 live log)
```

Full schema in `references/firestore-schema.md`. `coach_notes` field detail in `references/coach-notes-schema.md`.

### Firestore access from Claude Code

Google's Firebase MCP server (`firebase mcp` configured in `.mcp.json`) provides
project/env/security-rules tools but does NOT expose Firestore document CRUD.
For Firestore data access, Claude Code uses bash scripts in `tools/`:

- **Read one player**: `node tools/get_player.js {name}` — returns plain JSON
- **Read all players**: `node tools/get_all_players.js [--summary]` — for stats reviews
- **Write exercise**: `node tools/log_exercise.js {name} /tmp/exercise.json`
- **Update coach_notes**: `node tools/update_coach_notes.js {name} /tmp/patch.json`

See `tools/README.md` for full schemas and examples. The scripts use REST API directly
with open-write Firestore rules — no auth, no service account.

If Google later adds Firestore document tools to the MCP server, the skills can switch
to MCP calls. Until then, the bash scripts are the canonical path.

---

## RTDB — frozen, do not write

The old Realtime Database at `artem-grammar-hub-default-rtdb.europe-west1.firebasedatabase.app`
is frozen as of v20260428-s87. Read-only via web_fetch if needed for historical comparison.
**Do not write to it.** Sunset planned ~2026-05-28.

---

## Question bank

1,872 questions inline in `index.html` as `const ALL_QUESTIONS = [...]`.

**Do not** move questions to Firestore or any other external storage. The S78 migration tried
this and was rolled back in S82. Questions stay inline.

Authoring rules: `references/question-authoring-standards.md`. Per-question checklist there too.

---

## Deploy workflow (post-s87)

**The deploy.html flow is gone.** Claude Code pushes `index.html` and `sw.js` directly via git.

Sequence:
1. Edit `index.html` and `sw.js` directly in repo
2. Bump version in three places (HTML badge, sw.js cache key, version constant in index.html)
3. Run pre-deploy checklist (`references/pre-deploy-checklist.md`)
4. `git add -A && git commit -m "vYYYYMMDD-tN: <summary>" && git push`
5. Wait ~60 seconds for GitHub Pages to publish
6. Verify at `artemseliverstov.github.io/english-quiz?reset=1` (busts SW cache)

The version string format is `vYYYYMMDD-tN` (e.g. `v20260502-t1`). Same-session rebuilds: append `r2`, `r3`.
The string must be **identical** across the four locations: HTML badge, `sw.js` cache key, version constant in index.html, and the git commit message prefix.

**Counter convention**: the `s` series ran s1–s100; from t1 onward use the `t` prefix. Past sessions remain at their original `sN` tags — don't retag them. New sessions increment the `t` counter.

---

## Memory model — two layers

Family-related learning lives in two places. The split is by **kind**, not just by cadence:

- **GitHub repo (this repo) — design intent**: what we *want* each player to be working on. Level, persona, communication style, exercise themes, **prescriptive learning goals**. Stable, opinionated, curated. Updated via git commit when intent shifts (rarely).
- **Firestore `players/{name}.coach_notes` — measured state**: what the data *currently shows*. Weak/strong patterns from stats, recent observations, stuck-question IDs, engagement notes. Rolling, mechanical. Updated every session/stats review.

A coach_notes `weak_pattern` only graduates to a profile Learning Goal when it persists across **4+ sessions AND survives a deliberate intervention**. Otherwise it stays in coach_notes. Stuck question IDs live **only** in `coach_notes.stuck_questions` — profiles reference the field but don't enumerate qids.

What does NOT live here:
- Personal/cross-project context (your role, location, communication preferences) → `claude.ai` user memory
- Auto-memory (`~/.claude/projects/.../memory/MEMORY.md`) → **disabled**, since workflow is mobile-first and laptop auto-memory wouldn't sync

See `references/coach-notes-schema.md` for the update protocol and promotion rule.

---

## Family — one-line context

Full profiles in `references/family-profiles.md`. Quick reference:

| Player | Level | Focus |
|---|---|---|
| Artem | B2→C1 | Articles, phrasal verbs, emphasis. Business/O&G context. Most active user. |
| Anna | B2 | Russian L1 preposition errors. Conversational. Burst-then-disappear pattern. |
| Egor | B2→C1 | IELTS/academic. Almaty (different timezone). Quiz only, no exercises. |
| Nicole | B1 | Recognition gap on articles. Brief sessions. Player-initiated. |
| Ernest | B1/B2 | Recognition vs production gap. Inactive recently. |

Generic exercise sentences ("the man went to the shop") are **forbidden**. Use real-life context.

---

## What NOT to do

- Don't write to RTDB. Frozen.
- Don't move questions to Firestore.
- Don't bypass `tools/update_coach_notes.js` for coach_notes writes (it handles FIFO cap and last_updated automatically).
- Don't generate generic exercise sentences. Use family context.
- Don't push without running pre-deploy checks.
- Don't bump version in only some of the four places.
- Don't bring up sensitive memory items unless the user does first.
- Don't generate deploy.html. The flow is direct git push now.
