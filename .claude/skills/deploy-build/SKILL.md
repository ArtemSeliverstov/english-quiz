---
name: deploy-build
description: Validate, version-stamp, and deploy changes to the english-quiz live site. Use when user says "deploy", "ship it", "push the changes", "release as sN", or asks for any pre-deploy validation. Replaces the deprecated deploy.html flow with direct git push.
---

# Deploy Build

You are validating changes and pushing to GitHub Pages. Live URL:
`artemseliverstov.github.io/english-quiz`. The `deploy.html` flow is gone — direct
git push from Claude Code is the canonical path.

## Reads required before starting

1. **`references/pre-deploy-checklist.md`** — the canonical validation steps. Source of truth for this skill.
2. **`references/version-log.md`** — to know the previous session number (for incrementing)
3. **`references/bug-log.md`** — only if pre-deploy checks fail and you need context

## Workflow

### Step 1 — Determine new version string

Format: `vYYYYMMDD-sN` where N increments from the last entry.

```bash
# Check the latest version in code and version-log
grep -nE "v202[0-9]{5}-s[0-9]+" index.html sw.js references/version-log.md | head -10
```

Same-session rebuild: append `r2`, `r3`, etc.

### Step 2 — Run pre-deploy checklist

Walk `references/pre-deploy-checklist.md` step by step. Every step. Don't skip.

Critical checks:
1. **`node --check`** on extracted JS — zero errors required
2. **Question count** — bracket-depth-bounded extraction, must match expected
3. **LEVEL_TOTALS / CAT_TOTALS** — derive from source, patch in `renderCoverage()` and `playerCoverageHTML()` if needed
4. **No duplicate const declarations** — `FS_BASE`, `DB_NAME`, `ALL_QUESTIONS` etc. each appear once
5. **Sparse-array scan** — `},\s*,` pattern in ALL_QUESTIONS = zero matches
6. **Duplicate stem check** — for any new questions
7. **Version string consistency** — 4 places: HTML badge, sw.js cache key, version constant, git commit message

### Step 3 — Bump version in 4 places

Use `str_replace` on:
1. HTML version badge in `index.html` (find old `vXXX-sN` string, replace with new)
2. SW cache key in `sw.js` (`CACHE = 'eq-vXXX-sN'`)
3. Version constant in `index.html` (if separate from badge)
4. Construct git commit message with new version prefix

After bumping, re-run version consistency check from pre-deploy checklist.

### Step 4 — Commit and push

```bash
git status   # final visual check
git add -A
git commit -m "vYYYYMMDD-sN: <one-line summary>

- bullet 1
- bullet 2
- bullet 3

🤖 Generated with Claude Code"
git push
```

GitHub Pages takes ~60 seconds to publish.

### Step 5 — Update version-log.md

Add new entry at the top of `references/version-log.md`:

```markdown
## YYYY-MM-DD · Session N
### vYYYYMMDD-sN — <one-line summary>

- bullet 1
- bullet 2
- ...

Q count: X (change) · Version: vYYYYMMDD-sN
```

Commit this as part of the same push, or a follow-up commit.

### Step 6 — Smoke test (live)

Tell Artem to verify on his phone:
1. Open `artemseliverstov.github.io/english-quiz?reset=1` (the `?reset=1` busts SW cache)
2. Confirm version badge shows new version
3. Log in as one player, answer one question — verify Firestore write
4. Refresh, verify stats reload from Firestore correctly
5. Tap any deeplinks generated this session (if applicable) — verify they work

If anything fails: **revert immediately**.

```bash
git revert HEAD
git push
```

Previous version live in ~60 seconds. Then investigate offline.

## Common failure modes

| Failure | Symptom | Fix |
|---|---|---|
| `node --check` fails | Syntax error in extracted JS | Find and fix before pushing |
| Question count differs from expected | Duplicate or accidentally deleted | git diff to find |
| LEVEL_TOTALS not updated | Coverage % wrong after question add | Recompute and patch |
| SW cache key not bumped | New JS doesn't load on devices | Bump and push again |
| Sparse array | Ghost "undefined" tile in UI | Find `},\s*,` and remove |
| 4 version places mismatched | Cache stale, badge wrong | Re-run consistency check |

## Forbidden

- Skipping the pre-deploy checklist
- Pushing without `node --check` passing
- Bumping version in only some places
- Deploying when not specifically asked (always wait for user signal)
- Generating a deploy.html (workflow is direct git push)
- Deploying changes you haven't reviewed with the user
- Deploying late at night when family might be using the app and a bad deploy can't be reverted quickly

## When the user says "deploy" but changes haven't been reviewed

If you're not sure all the changes about to be pushed have been reviewed by Artem:
1. Run `git status` and `git diff --stat`
2. Show what's about to be deployed
3. Ask explicit confirmation before pushing

Better to ask twice than push something Artem hasn't approved.

## After deploy succeeds

Move on or close the session as the user directs. No further action needed unless
they want a stats review or to start a new task.
