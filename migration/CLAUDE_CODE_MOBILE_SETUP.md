# Claude Code Mobile Setup Runbook

How to get the english-quiz repo working with Claude Code mobile (iOS/Android app
with Code mode enabled).

This is the first time you're switching from claude.ai chat as primary tool to
Claude Code mobile as primary tool. After this setup, most quiz maintenance happens
on your phone.

## Prerequisites

- Anthropic account active on phone (you already have this)
- Claude mobile app installed (iOS or Android — both have Code mode now)
- GitHub account with `artemseliverstov/english-quiz` repo (you have this)

---

## Step 1 — Apply Phase 1 bundle to repo

Two options. Pick one.

### Option A — From your laptop (one-time setup)

```bash
cd ~/Documents/english-quiz   # or wherever you have it cloned
git pull origin main          # ensure clean state

# Copy Phase 1 bundle into the repo
cp -r /path/to/phase1_skills_bundle/.claude .
cp -r /path/to/phase1_skills_bundle/references .
cp /path/to/phase1_skills_bundle/CLAUDE.md .
cp -r /path/to/phase1_skills_bundle/migration/* migration/
cp -r /path/to/phase1_skills_bundle/archive/* archive/  # if any

# Verify structure
ls -la .claude/skills references migration
cat CLAUDE.md | head -5

# Commit
git add -A
git commit -m "v20260429-s88: Phase 1 — Claude Code skills + references restructure

- Added .claude/skills/ with 4 skills (exercise-session, quiz-development, stats-review, deploy-build)
- Added references/ with 13 markdown files extracted from KB
- New short root CLAUDE.md
- HTML KB deprecated as source of truth — kept in archive/ for human reading
- migration/add_coach_notes.js — adds coach_notes field to all player docs
- Auto-memory disabled in .claude/settings.json
- Two-layer memory: GitHub repo (stable) + Firestore coach_notes (dynamic)

🤖 Generated with Claude Code"

git push origin main
```

### Option B — From Claude Code mobile (slower, requires the repo not yet have the bundle)

If you don't have a laptop available:

1. In Claude mobile, switch to Code mode
2. Connect to GitHub via OAuth
3. Open the `artemseliverstov/english-quiz` repo
4. Tell Claude: *"I have a Phase 1 bundle to apply. I'll paste each file's content. Create the structure and commit."*
5. Paste each file from the bundle one at a time

This works but is tedious. Option A is preferable for the initial setup.

---

## Step 2 — Run the coach_notes migration

This adds the `coach_notes` field to all player documents.

### From laptop:

```bash
cd ~/Documents/english-quiz/migration
node add_coach_notes.js
```

Expected output:
```
Adding coach_notes to all players in artem-grammar-hub

  artem: ✓ added empty coach_notes
  anna: ✓ added empty coach_notes
  nicole: ✓ added empty coach_notes
  ernest: ✓ added empty coach_notes
  egor: ✓ added empty coach_notes

--- Summary ---
Added: 5
Unchanged (already had): 0
Skipped (no doc): 0
Errors: 0
```

### From Claude Code mobile:

Tell Claude Code: *"Run migration/add_coach_notes.js to add coach_notes field to players."*

It will use the Firebase MCP plugin to write directly. (This is also a good first
test that the MCP plugin is working.)

---

## Step 3 — Install Firebase MCP plugin in Claude mobile

In the Claude mobile app:

1. Tap settings → Integrations / Plugins
2. Browse the Anthropic plugin marketplace
3. Find "Firebase" (official Anthropic plugin)
4. Tap Install
5. When prompted, sign in to your Google account (the one with access to `artem-grammar-hub`)
6. Grant Firebase access permissions

The plugin uses Application Default Credentials — no service account key needed.

---

## Step 4 — Verify setup

Open Claude mobile, switch to Code mode, connect to the english-quiz repo.

Run a verification prompt:

> "Read CLAUDE.md and references/family-profiles.md. Then read Anna's coach_notes from Firestore. Tell me what you see."

Expected: Claude reads the files, calls `firestore_get_documents("players/anna")`,
and reports back. Should mention Anna's coach_notes exists with empty arrays for
weak_patterns, strong_patterns, etc.

If this works, you're done with setup.

---

## Step 5 — Test each skill

Run a quick test of each skill to confirm they auto-load:

### Test exercise-session

> "This is Anna, let's do some exercises."

Expected: Claude loads the exercise-session skill, reads Anna's profile + coach_notes,
proposes an exercise type. Don't actually run the session — this is just a smoke test.

### Test quiz-development

> "I want to add 5 new B2 Idioms questions."

Expected: Claude loads quiz-development skill, reads coverage-matrix.md, asks for
specific topics or proposes some. Stop here — this is just a smoke test.

### Test stats-review

> "Run a stats review for Artem."

Expected: Claude loads stats-review skill, fetches Artem's stats from Firestore,
produces a coverage review with proposed coach_notes updates.

### Test deploy-build

> "What needs to happen for s89 deploy?"

Expected: Claude loads deploy-build skill, reads pre-deploy-checklist.md, walks
through what would need to happen. Don't deploy — this is just a smoke test.

If all four work: setup complete.

---

## Step 6 — Update userMemories in claude.ai (separate)

Now that family-related learning has moved to Firestore, the userMemories in your
claude.ai account should be slimmed down to personal/cross-project items only.

This requires manual action in claude.ai chat. Open a chat and tell Claude:

> "Update memory: family observations now live in Firestore players/{name}.coach_notes.
> Remove from memory the per-player learning patterns (Anna's prepositions, Nicole's stuck
> questions, etc.). Keep my role/location/communication preferences and family relationships."

Wait for Claude to use `memory_user_edits` and confirm.

---

## What's different now

| Task | Old (claude.ai chat) | New (Claude Code mobile) |
|---|---|---|
| Run exercise for Anna | Open chat, type, generate deeplink, Anna taps | Open Claude Code, type, direct Firestore write |
| Add questions | Upload deploy file, edit chat side, generate new deploy.html | Edit `index.html` directly, git push |
| Stats review | Paste Firestore URL, parse, propose userMemory edits | Direct Firestore read, propose coach_notes edits |
| Deploy | Generate deploy.html, download, open in Chrome, paste PAT | `git push` from terminal/Claude Code |
| Read KB | Project knowledge file (250 KB HTML) | Skills + references markdown (small, on-demand) |

---

## When something doesn't work

| Problem | Likely cause | Fix |
|---|---|---|
| Skill doesn't auto-load | Description doesn't match user's phrasing | Edit the skill's `description` field |
| MCP plugin says "not authenticated" | Google login expired | Re-authenticate in plugin settings |
| Firestore writes fail with 403 | Firestore rules deployed wrong | Re-deploy from migration bundle |
| Claude Code mobile doesn't see CLAUDE.md | Repo not connected, or branch doesn't have it | Reconnect repo / git pull |
| `coach_notes` missing | Migration script didn't run | Run `migration/add_coach_notes.js` |

---

## After setup — daily workflow

Most sessions:
1. Open Claude mobile → Code mode → english-quiz repo
2. Type your intent ("this is Anna, let's do exercises" or "add 10 Idiom questions")
3. Claude auto-loads the right skill
4. Work proceeds

Occasionally (laptop work):
1. Pull latest from main
2. Open Claude Code on laptop with same repo
3. Same flow — skills work identically

claude.ai chat is now mostly retired for quiz work. Use it for:
- Mobile sessions when you don't want to switch to Code mode
- Quick lookups (paste a Firestore URL, ask a question)
- Anything cross-project

---

## What's NOT included in this setup

- Coach tab in PWA (Phase 2)
- Cloudflare Worker for API key proxy (Phase 2)
- Anonymous Auth on Firestore (deferred indefinitely)

These are future work. Current setup is functional without them.
