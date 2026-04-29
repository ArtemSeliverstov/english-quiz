# Phase 1 — Claude Code Skills Bundle

Generated 2026-04-29 (session 88).

This bundle restructures the english-quiz repo so Claude Code (mobile + laptop)
becomes the primary maintenance tool. It replaces the claude.ai-chat-and-deploy.html
workflow.

---

## What this bundle contains

```
phase1_skills_bundle/
├── README_FIRST.md                        ← you are here
├── CLAUDE.md                              ← always-loaded short routing layer
├── .claude/
│   ├── settings.json                      ← auto-memory off, Firebase MCP enabled
│   └── skills/
│       ├── exercise-session/SKILL.md      ← run an exercise for a player
│       ├── quiz-development/SKILL.md      ← add/fix/audit questions
│       ├── stats-review/SKILL.md          ← analyse player stats
│       └── deploy-build/SKILL.md          ← validate and ship
├── references/                            ← canonical knowledge (markdown)
│   ├── family-profiles.md                 ← stable per-player profiles
│   ├── coach-notes-schema.md              ← Firestore dynamic memory layer
│   ├── exercise-types.md                  ← 8 canonical exercise types + protocol
│   ├── deeplink-schema.md                 ← exlog/exupd/exfin payloads
│   ├── pre-deploy-checklist.md            ← canonical pre-push validation
│   ├── question-schema.md                 ← schema per type, ID conventions
│   ├── question-authoring-standards.md    ← type hierarchy + per-question checklist
│   ├── firestore-schema.md                ← collections, typed-value cheat sheet
│   ├── weekly-slots.md                    ← Artem's slot plan notes
│   ├── bug-log.md                         ← past gotchas + preventive rules
│   ├── coverage-matrix.md                 ← per-category targets
│   ├── design-decisions.md                ← why-we-did-X
│   ├── roadmap.md                         ← what's next, what's deferred
│   └── version-log.md                     ← session-by-session timeline
├── migration/
│   ├── add_coach_notes.js                 ← idempotent script: add field to all 5 players
│   └── CLAUDE_CODE_MOBILE_SETUP.md        ← step-by-step setup runbook
└── archive/                               ← deprecated as authoritative; kept readable
    ├── quiz_knowledge_base_v20260428-s87.html
    ├── supplementary_exercises_guide_v20260413-s85.html
    ├── phrasal_verbs_mastery_plan.html
    └── article_diagnostic_2026-04-05.html
```

---

## Where to start

**→ `migration/CLAUDE_CODE_MOBILE_SETUP.md`** is the runbook. Follow it top to bottom.

It covers:
1. Apply this bundle to the repo (laptop or mobile)
2. Run the coach_notes migration
3. Install Firebase MCP plugin in Claude mobile
4. Verify
5. Test each skill
6. Slim claude.ai userMemories

Estimated time: 30-45 minutes for first-time setup.

---

## Architectural decisions captured here

These are the load-bearing decisions from the s87 → s88 transition. If anything
later seems strange, the rationale is in `references/design-decisions.md`.

| Decision | Why |
|---|---|
| Two-layer memory (GitHub + Firestore `coach_notes`) | Mobile-first workflow; auto-memory is laptop-only and won't sync |
| HTML KB deprecated as source of truth | Markdown is editable from Claude Code; HTML wasn't |
| `deploy.html` flow gone | Direct git push from Claude Code is faster (~60s vs ~5min) |
| Questions stay inline in `index.html` | s78 attempt to externalize was rolled back s82 |
| Open Firestore writes (no auth yet) | Family-scale obscurity; Anonymous Auth deferred |
| One short root CLAUDE.md + many references | Skills load context on demand; prevents context bloat |

---

## What's deferred (not in this bundle)

- **Coach tab in PWA** — family-facing exercise UI in the app itself
- **Cloudflare Worker** — API key proxy for the Coach tab
- **Anonymous Auth on Firestore** — security hardening
- **Live log UI** — "Active session" card on Exercises tab
- **30-day RTDB sunset** — delete after 2026-05-28

These are Phase 2 and later. Track in `references/roadmap.md`.

---

## What this bundle does NOT do automatically

The bundle is **artefacts only**. Applying it to the repo is your action:

- Bundle does not push itself to GitHub — you `git commit && git push`
- Bundle does not run `add_coach_notes.js` — you run it
- Bundle does not install the Firebase MCP plugin — you install it in the mobile app
- Bundle does not edit your claude.ai userMemories — that's a separate manual step

The runbook walks each step.

---

## Versioning this bundle

The repo will commit this bundle as `v20260429-s88`. After it's pushed, this
top-level README and the bundle directory itself can be deleted from the repo —
the contents (`CLAUDE.md`, `.claude/`, `references/`, `migration/`, `archive/`) are
the durable artefacts. The bundle wrapper is just a delivery vehicle.

---

## Conflicts with existing files

Before applying:

```bash
ls -la CLAUDE.md .claude references migration archive 2>/dev/null
```

If any of these already exist in your repo, decide how to merge before copying.
The most likely conflicts:
- `CLAUDE.md` — replace (this bundle's version is authoritative for s88+)
- `migration/` — additive (existing migration scripts stay)
- `archive/` — additive

---

## Questions, edits, regen

If you spot something wrong in any file, or want a different style:

- Make small edits in place after applying
- For larger restructuring, tell Claude in the next session — it can read the references and propose edits

The references are markdown precisely so you can grep/edit them by hand or via Claude
Code without ceremony. Don't be precious about them.
