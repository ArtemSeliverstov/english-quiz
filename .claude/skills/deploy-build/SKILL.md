---
name: deploy-build
description: Validate, version-stamp, and deploy changes to the english-quiz live site. Use when user says "deploy", "ship it", "push the changes", "release as sN", or asks for any pre-deploy validation. Direct git push to main; GitHub Pages publishes in ~60s.
---

# Deploy Build

Validates and pushes to GitHub Pages. Live URL: `artemseliverstov.github.io/english-quiz`.

## Reads

- `references/pre-deploy-checklist.md` — canonical validation steps. Source of truth.
- `references/version-log.md` — for the previous session number

## Workflow

**1. Determine version string.** Format `vYYYYMMDD-tN` (s series ended at s100; new sessions use `t`). Same-session rebuild: append `r2`, `r3`. Find last via `grep -nE "v202[0-9]{5}-[st][0-9]+" index.html sw.js | head`.

**2. Run pre-deploy checklist.** Walk every step in `pre-deploy-checklist.md`. Don't skip. The critical items: `node --check` on extracted JS, question count, LEVEL_TOTALS / CAT_TOTALS sync, no duplicate const, no sparse arrays, duplicate stem check, version string consistency in 4 places.

**3. Bump version in 4 places.** HTML `<meta name="app-version">`, `id="hdr-ver"` span, `sw.js` CACHE constant, git commit message prefix. After bumping, re-run version consistency check (CI also verifies, but local-first).

**4. Commit and push.**

```bash
git status                # final visual check
git add -A
git commit -m "vYYYYMMDD-tN: <summary>

- bullet 1
- bullet 2

🤖 Generated with Claude Code"
git push
```

GitHub Pages publishes in ~60s. CI runs the linters and version check on every push.

**5. Update version-log.md.** New entry at top:

```markdown
## YYYY-MM-DD · Session N
### vYYYYMMDD-tN — <summary>

- bullet 1
- bullet 2

Q count: X (Δ) · Version: vYYYYMMDD-tN
```

Same push or follow-up commit.

**6. Smoke test (live).** Tell Artem to open `artemseliverstov.github.io/english-quiz?reset=1` (busts SW cache), confirm version badge, log in as one player, answer one item, verify Firestore write, refresh, verify reload, tap any new deeplinks.

## Revert

If anything fails after push:

```bash
git revert HEAD
git push
```

Previous version live in ~60s. Investigate offline.

## Common failures

| Symptom | Cause | Fix |
|---|---|---|
| `node --check` fails | Syntax error in extracted JS | Find and fix |
| Question count differs | Duplicate or accidental delete | `git diff` |
| LEVEL_TOTALS off | Coverage % wrong | Recompute and patch |
| New JS doesn't load on devices | SW cache key not bumped | Bump and push again |
| Ghost "undefined" tile | Sparse array (`},\s*,`) | Find and remove |

## Forbidden

- Skipping the pre-deploy checklist
- Pushing without `node --check` passing
- Bumping version in only some of the 4 places
- Deploying when not specifically asked — wait for user signal
- Deploying changes you haven't reviewed with the user
- Late-night deploys when family is using the app and a bad deploy can't be quickly reverted

## When unsure changes are reviewed

Run `git status` and `git diff --stat`, show what's about to deploy, ask explicit confirmation. Better to ask twice.
