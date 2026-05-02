# Repo improvement plan

Drafted on `claude/improve-exercise-clarity-BJYzK`. Three tracks: doc discipline, file reallocation, architecture hardening. Ordered by leverage.

---

## Track 1 — Doc discipline (highest leverage, lowest cost)

The active mechanism. Without this, every other doc edit re-bloats over time.

### 1.1 Add `references/doc-style.md` (~60 words)

```
# Doc style

Caps: CLAUDE.md 500, SKILL 600, schema 1200, design 2500.
Editing: net word count never increases unless adding new info.
No headers for <3 paragraphs. Bullets for ≥3 parallel items only.
Audience knows the project — skip preamble, restating, caveats.
History goes in design-decisions.md; never inline.
Banned: "note that", "Important:", "(legacy)", parenthetical dates.
```

### 1.2 Route to it from CLAUDE.md

Single line in the references table: `doc-style.md | Before writing or editing any doc.`

### 1.3 Optional CI guard

Pre-deploy script: assert `wc -w CLAUDE.md ≤ 500`, `wc -w .claude/skills/*/SKILL.md ≤ 600`. Flag references that grew >10% in the last commit.

---

## Track 2 — File reallocation

### 2.1 Slim CLAUDE.md to ≤500 words (down from 1,072)

Cut: family table (lines 149-156), deploy step-by-step (109-124), two-layer memory body (128-141), Firestore connection details body (58-86). Replace each with a one-line link to the canonical reference.

### 2.2 Slim each SKILL.md

| Skill | Now | Target | Cuts |
|---|---|---|---|
| exercise-session | 1,000 | 600 | Drop "Note on travel context" para, "Logging strategy" section, Windows /tmp note, claude.ai chat fallback (legacy), Post-Phase 2C para |
| stats-review | 990 | 600 | Same pattern |
| deploy-build | 752 | 500 | Body of deploy steps lives in pre-deploy-checklist |
| quiz-development | 675 | 500 | Drop forbidden items already enforced by validators |

Drop the "Reads required before starting" preamble in each — replace with a single line listing file paths.

### 2.3 Move long-form docs out of `references/`

- `phase2-build-plan.md` (19,903 words) → `plans/phase2d-build-plan.md`
- `learning-system-design.md` (3,565 words) → `docs/learning-system-design.md`

Rationale: references are operational KB Claude reads to do tasks. Build plans and design narratives have different audience and lifecycle.

### 2.4 Cap append-only logs

- `version-log.md`: keep last 10 sessions; older → `references/archive/version-log-pre-s90.md`
- `bug-log.md`: keep unresolved + last year; older → `references/archive/bug-log-pre-2026.md`

### 2.5 Fold redundancy

| Rule | Currently in | Keep only in |
|---|---|---|
| Don't externalize questions | CLAUDE.md, quiz-dev SKILL, design-decisions, bug-log | design-decisions.md |
| Generic stems forbidden | CLAUDE.md, exercise-session SKILL, family-profiles | family-profiles.md |
| Version-stamp invariant | CLAUDE.md, deploy-build SKILL, design-decisions | pre-deploy-checklist.md |
| Family one-line table | CLAUDE.md, family-profiles | family-profiles.md |
| Two-layer memory promotion rule | CLAUDE.md, design-decisions, coach-notes-schema, learning-system-design | coach-notes-schema.md |
| Canonical type names | exercise-session SKILL, quiz-dev SKILL, exercise-types, log_exercise.js | exercise-types.md (validator already enforces) |

### 2.6 Add routing for `tools/README.md` and `worker/README.md`

Currently discoverable only by listing dirs. Add to CLAUDE.md routing table.

### 2.7 Optional new file: `references/operational-rules.md` (~250 words)

Single tight "what NOT to do" + version-stamp invariant + Firestore write rules + RTDB frozen. Replaces scattered prohibitions across CLAUDE.md, design-decisions, and SKILLs.

End state: ~33k words across all docs (down from 47k). No information loss — relocation and dedup only.

---

## Track 3 — Architecture hardening

Ordered by risk-reduction-per-hour.

### 3.1 CI workflow (≈1h)

GitHub Actions: assert version string matches in 4 places, `node --check` on `tools/*.js` and `worker/index.js`, run question-bank linter (3.2). Prevents most deploy footguns.

### 3.2 Question-bank linter (≈2h)

`tools/lint_questions.js`: walks `ALL_QUESTIONS`, validates against `references/question-schema.md`. Checks: required fields per type, `ans` index in range, no duplicate ids, hint doesn't name the rule, PV transform keyword is base verb only. Run in CI.

### 3.3 Firestore Anonymous Auth + scoped rules (≈3h)

Replace `allow read, write: if true` with `allow write: if request.auth != null && request.auth.uid == resource.data.player_uid` (or equivalent claim). Closes the "anyone can wipe stats" hole. Already on roadmap as deferred — promote.

### 3.4 Worker rate limit (≈2h)

Cloudflare KV or Durable Object counter: N req/min/player, N/hour/IP. Closes the "anyone with the worker URL drains the prepaid balance" hole.

### 3.5 Firestore backup job (≈1h)

GitHub Action that runs `tools/get_all_players.js` weekly and commits JSON to a `backups/` branch. Free, fits existing tooling.

### 3.6 Service worker update toast (≈1h)

Add `controllerchange` listener in `index.html` — show "New version available — tap to reload". Stops iOS users running stale builds.

### 3.7 Smaller fixes

- `.mcp.json` hardcodes `D:/Claude/...` — make relative or env-driven
- `manifest.json` says "472 questions" — drift from 1,872; fix or remove count
- Worker `RUSSIAN_FALLBACK_PLAYERS` should log a warning when hit (signal old PWA bundles)
- `archive/` and `ref/index.html` deployed publicly via Pages — move out of scope or add to `.gitignore` for Pages

---

## Suggested order

1. Track 1 (doc-style.md + CLAUDE.md route) — 30 min, durable
2. Track 2.1 (slim CLAUDE.md) — 30 min, biggest signal-per-word win
3. Track 3.1 + 3.2 (CI + linter) — 3h, biggest defect prevention
4. Track 3.3 (Firestore auth) — 3h, biggest risk reduction
5. Track 2.2-2.5 (slim skills, move long-form, fold redundancy) — half-day session
6. Track 3.4-3.6 (rate limit, backups, SW toast) — half-day session
7. Track 2.6, 2.7, 3.7 — opportunistic

Tracks 1-2 are reversible markdown edits; Track 3 touches live infra and should be staged with explicit confirmation per item.
