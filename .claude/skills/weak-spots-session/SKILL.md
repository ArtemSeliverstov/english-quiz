---
name: weak-spots-session
description: Run a depth-focused ~30-min Weak Spots session for any family member (Artem, Anna, Nicole, Ernest, Egor). Use when the user says "let's do 30 min on X", "weak spots session", "deep dive on Y", "let's practise emphasis/articles/clefts", or any request for a tier-walked tutorial on a single topic. Distinct from `exercise-session` (short multi-format drill) and `free-write` (unstructured chat).
---

# Weak Spots — CC session

Depth session, one topic, ~30 min, simple → hard ladder. CC counterpart to the PWA Coach Weak Spots button. Remote-CC safe: reads/writes via Firebase MCP, no `tools/*.js`.

Mid-session request for general drills → that's `exercise-session`; close cleanly first.

## Reads

- `references/family-profiles.md` — level, communication style, themes, `coachLanguage`
- `players/{name}` via `mcp__firebase__firestore_get_document` — `coach_notes.{weak_patterns, recent_observations, engagement_notes}`
- `worker/index.js` → `weakSpotsDrillSystemPrompt` — **canonical topic catalog** (6 IDs + ladders, same as PWA). Read first; don't re-derive.

## Topic selection

**Artem only — lead with a compact status table.** Before proposing, scan `coach_notes.weak_patterns` + `recent_session_signals` + last ~5 `recent_observations` → per-pattern status. Render one table, ≤10 rows, most actionable first: `# | Pattern | Cat | Status | Last activity | Next move`. Status: 🔴 untouched · 🟠 surfacing · 🟡 consolidating (≤7d) · 🟢 locked · ⚪ data-only. Sort 🟠→🔴→🟡→🟢; drop the legend if it runs long. Then confirm the topic or propose 2-3 picks *from* it. (Other players: skip the table, go straight to proposal.)

Named topic ("30 min on emphasis"): still show the table (Artem verifies the pick), then confirm + state the ladder.

Off-catalog free-text → improvise a 3-tier ladder (mechanics → guided → free production) under a snake_case slug.

## During session

**Mechanics vs drill.** Check `recent_observations` for the same topic in ~14 days. Found → one-line recap, straight to production. Not found → 2-3 sentence mechanic + one worked example per tier.

**Tier walk.** 1-3 items per tier. Up when production lands clean; stay if the player slips — don't pad, don't escalate over a structural miss. Cue with profile themes.

**Length.** ~30 min, 15-20 items. Soft nudge at exchange 12 ("push one more tier or wrap?"). Hard end at 18.

**Coach language.** Per `family-profiles.md` `coachLanguage` — Russian for Anna/Nicole, English for Artem/Ernest/Egor; English quotes for forms either way. Tone: warm, direct.

## End-of-session protocol

Auto-write at close, then read out.

**1. Build session_metadata** to the worker's `weak_spots_drill` shape (`worker/index.js` `sessionEndInstructions` is canonical) — note `topics_covered: ["weak_spots:<topic_id>"]` and `assessment{}`.

**Assessment REQUIRED** — drives the silent CEFR fold; `confidence:"low"` for <3 sentences or off-topic, present even when the fold skips.

**2. Auto-write via Firebase MCP** (no preview):

- **Session log** → `firestore_add_document` to `players/{name}/coach_sessions`, `mode: "weak_spots_drill"`, `model_used: "claude-code-cc"`, plus session_metadata — mirror `coachWriteSessionLogStandalone` in `index.html`.
- **coach_notes patch** → re-read `players/{name}`, append a `recent_observations` entry (date, session_id, note `"Weak Spots ({topic_id}) — ..."`, `author: "claude_code"`), apply `weak_patterns` per the 2+ session rule (`coach-notes-schema.md`), cap `recent_observations` at 10, then `firestore_update_document`.
- **Proficiency fold** — if `confidence==="high"`, `sentence_count>=3`, level `/^[ABC][12]$/`: cap `sentence_count` at 20, `correct=sentence_count-error_count` (≥0); increment `lvlStats[level].{seen,correct}`, `totalAnswered`, `totalCorrect`; set `aggregated_coach_sessions[session_id]=sentence_count`. Idempotent — skip if the session_id is already present.

**3. Render the player-facing table** (`weak_spots_drill` template, `coach-notes-schema.md`).

**4. Ask** "How did it feel? — or skip." Non-blocking; if answered, append to `recent_observations`.

## Skip log when

Session was 1-2 turns and nothing of substance emerged. Don't log empty.

## Forbidden

- Inventing `topic_id`s outside the catalog (off-catalog → snake_case slug, never a canonical ID)
- Skipping the proficiency fold when `confidence==="high"` (breaks `lvlStats`)
- Lecturing the rule without making the player produce
- Re-deriving tier ladders — read `worker/index.js` first
