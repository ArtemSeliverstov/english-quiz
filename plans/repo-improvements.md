# Repo improvement plan

Drafted on `claude/improve-exercise-clarity-BJYzK`. Three tracks: doc discipline, file reallocation, architecture hardening. Ordered by leverage.

Revised after review on 2026-05-02. Key changes from the original draft:
- 2.5 and 2.7 are now complementary (rule text in `operational-rules.md`, rationale in topical homes), not alternatives.
- 2.1 and 2.5 collapse into a single editing pass on CLAUDE.md.
- 3.3 swapped from Firestore Anonymous Auth to App Check + append-only rules + backups. Anon auth has a migration/lockout problem that doesn't match the threat model.
- 1.3 dropped — CI word-count guard is overkill at this scale.
- `free-write/SKILL.md` (1,286w, biggest SKILL) added to the slim table.
- End-state metric reframed: what matters is words-loaded-per-conversation, not total repo word count.

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

The "net never increases" rule is load-bearing — it ratchets dedup. Word caps are heuristics.

### 1.2 Route to it from CLAUDE.md

Single line in the references table: `doc-style.md | Before writing or editing any doc.`

---

## Track 2 — File reallocation

### 2.1 Slim CLAUDE.md to ≤500 words AND fold redundancy in one pass (combined with 2.5)

CLAUDE.md is loaded into every conversation; signal density matters most here. Slimming and dedup are the same edit — do them together to avoid touching CLAUDE.md twice.

Cuts:
- Family table (lines 149-156) → one line linking to family-profiles.md
- Deploy step-by-step (109-124) → one line linking to pre-deploy-checklist.md
- Two-layer memory body (128-141) → one line linking to coach-notes-schema.md
- Firestore connection details body (58-86) → one line linking to firestore-schema.md
- "What NOT to do" section → one line linking to operational-rules.md (created in 2.7)

Each cut moves the rule to its canonical home (see 2.5 + 2.7 below).

### 2.2 Slim each SKILL.md

| Skill | Now | Target | Cuts |
|---|---|---|---|
| free-write | 1,286 | 600 | Biggest SKILL. Trim onboarding preamble, examples that duplicate logging schema |
| exercise-session | 1,000 | 600 | Drop "Note on travel context" para, "Logging strategy" section, Windows /tmp note, claude.ai chat fallback (legacy), Post-Phase 2C para |
| stats-review | 990 | 600 | Same pattern |
| deploy-build | 752 | 500 | Body of deploy steps lives in pre-deploy-checklist |
| quiz-development | 675 | 500 | Drop forbidden items already enforced by validators |

Drop the "Reads required before starting" preamble in each — replace with a single line listing file paths.

### 2.3 Move long-form docs out of `references/`

- `phase2-build-plan.md` (19,903 words) → `plans/phase2d-build-plan.md`
- `learning-system-design.md` (3,565 words) → `docs/learning-system-design.md`

Rationale: `references/` is operational KB Claude reads to do tasks. Build plans and design narratives have different audience and lifecycle and should not be loaded as KB.

### 2.4 Cap append-only logs

- `version-log.md`: keep last 10 sessions; older → `references/archive/version-log-pre-s90.md`
- `bug-log.md`: keep unresolved + last year; older → `references/archive/bug-log-pre-2026.md`

### 2.5 Fold redundancy — rule text vs. rationale split

Each rule has two homes: the **rule text** (one imperative line) consolidates in `operational-rules.md` (created in 2.7), and the **rationale** (the why, the incident, the trade-off) stays in its topical home. Cross-link between them.

| Rule | Rule text in | Rationale in |
|---|---|---|
| Don't externalize questions | operational-rules.md | design-decisions.md |
| Generic stems forbidden | operational-rules.md | family-profiles.md |
| Version-stamp invariant (4 places identical) | operational-rules.md | pre-deploy-checklist.md |
| Don't write to RTDB | operational-rules.md | design-decisions.md |
| Coach_notes writes via `update_coach_notes.js` only | operational-rules.md | coach-notes-schema.md |
| Canonical exercise type names | operational-rules.md | exercise-types.md (validator enforces) |
| Family one-line table lives only in family-profiles.md | — | family-profiles.md |
| Two-layer memory promotion rule | — | coach-notes-schema.md |

The last two rows are content, not prohibitions — single canonical home, no entry in operational-rules.md.

### 2.6 Add routing for `tools/README.md` and `worker/README.md`

Currently discoverable only by listing dirs. Add to CLAUDE.md routing table.

### 2.7 New file: `references/operational-rules.md` (~250 words)

Single tight list of inviolable do/don'ts. Each rule one imperative line + one-line link to rationale file. No discussion, no history.

Rough contents:
- Don't write to RTDB (frozen) → see design-decisions.md
- Don't externalize questions → see design-decisions.md
- Don't bypass `update_coach_notes.js` for coach_notes writes → see coach-notes-schema.md
- Don't generate generic exercise stems → see family-profiles.md
- Don't push without pre-deploy check → see pre-deploy-checklist.md
- Version string identical in 4 places → see pre-deploy-checklist.md
- Firestore writes go through `tools/*.js`, not direct REST → see firestore-schema.md
- Don't bring up sensitive memory items unless user does first → (no rationale needed)

CLAUDE.md routing: `operational-rules.md | Before any change. Inviolable do/don'ts.`

This is the complement to 2.5, not a duplicate of it. 2.5 distributes rationale; 2.7 consolidates the rules themselves.

---

End-state goal — reframed:

The win is not "47k → 33k total words." It's **what Claude reads to do work per conversation**:

- CLAUDE.md (loaded every session): 1,093 → ≤500w
- Triggered SKILL (loaded per task): 675–1,286 → ≤600w
- KB total in `references/` (potentially loaded by SKILLs): drops by ~23k once `phase2-build-plan.md` and `learning-system-design.md` move out

Total repo word count is incidental. Per-conversation loaded context is the metric.

---

## Track 3 — Architecture hardening

Ordered by risk-reduction-per-hour.

### 3.1 CI workflow (≈1h)

GitHub Actions: assert version string matches in 4 places, `node --check` on `tools/*.js` and `worker/index.js`, run question-bank linter (3.2). Prevents most deploy footguns.

### 3.2 Question-bank linter (≈2h)

`tools/lint_questions.js`: walks `ALL_QUESTIONS`, validates against `references/question-schema.md`. Checks: required fields per type, `ans` index in range, no duplicate ids, hint doesn't name the rule, PV transform keyword is base verb only. Run in CI.

### 3.3 Lock down Firestore (≈3h total) — App Check + append-only rules + backups

Replaces the original Anonymous Auth proposal. Anon auth scopes a UID to the browser — losing localStorage = losing access to your own stats — and requires a migration to attach UIDs to existing player docs. The threat model (5 family members, obscure URL, no public link) doesn't justify per-user auth. App Check matches the actual goal: "this app is legit, others aren't."

Three layers, low-effort each:

**a. Firebase App Check (~1.5h)** — verifies requests come from the deployed PWA via reCAPTCHA Enterprise (web). Rule becomes `allow read, write: if request.app != null`. Closes the "anyone with the endpoint URL can write" hole at the network layer. No migration of existing docs, no per-user UIDs.

**b. Append-only-ish rules (~1h)** — forbid `delete`, forbid shrinking arrays, cap document size. Bounds the damage if App Check is ever bypassed. Pairs naturally with the backup job below.

**c. Weekly backup job (~0.5h, see 3.5)** — already on this list. Becomes the recovery path.

Future option (not now): if the worker grows other write paths or a public surface ever appears, route all writes through the worker (Firestore rules `if false` for writes, worker holds service-account credential, applies rate limit + payload validation). Don't do this preemptively.

### 3.4 Worker rate limit (≈2h)

Cloudflare KV or Durable Object counter: N req/min/player, N/hour/IP. Closes the "anyone with the worker URL drains the prepaid balance" hole. Independent of 3.3 — worker fronts AI calls, not Firestore.

### 3.5 Firestore backup job (≈1h)

GitHub Action that runs `tools/get_all_players.js` weekly and commits JSON to a `backups/` branch. Free, fits existing tooling. Becomes the recovery path for 3.3.

### 3.6 Service worker update toast (≈1h)

Add `controllerchange` listener in `index.html` — show "New version available — tap to reload". Stops iOS users running stale builds.

### 3.7 Smaller fixes

- `.mcp.json` hardcodes `D:/Claude/...` — make relative or env-driven (confirm whether anyone other than Artem clones this repo before acting)
- `manifest.json` says "472 questions" — drift from 1,872; fix or remove count
- Worker `RUSSIAN_FALLBACK_PLAYERS` should log a warning when hit (signal old PWA bundles)
- `archive/` and `ref/index.html` deployed publicly via Pages — **verify nothing references them before** moving out of scope or adding to `.gitignore` for Pages

---

## Suggested order

1. **Track 1** (doc-style.md + CLAUDE.md route) — 30 min, durable
2. **Track 2.1 + 2.5 + 2.7 together** — single editing pass: create `operational-rules.md`, slim CLAUDE.md, fold rules into their two homes — 1.5h, biggest signal-per-word win
3. **Track 3.1 + 3.2** (CI + question linter) — 3h, biggest defect prevention
4. **Track 3.5 + 3.6** (backups + SW toast) — 2h, cheap UX/safety wins; backup is also prerequisite for 3.3
5. **Track 3.3** (App Check + append-only rules) — 3h, biggest risk reduction at the actual threat level
6. **Track 2.2 + 2.3 + 2.4** (slim SKILLs, move long-form, cap logs) — half-day session
7. **Track 3.4** (worker rate limit) — 2h, independent of Firestore work
8. **Track 2.6 + 3.7** — opportunistic

Tracks 1–2 are reversible markdown edits. Track 3 touches live infra and should be staged with explicit confirmation per item, especially 3.3a (App Check requires reCAPTCHA Enterprise setup in Google Cloud console).
