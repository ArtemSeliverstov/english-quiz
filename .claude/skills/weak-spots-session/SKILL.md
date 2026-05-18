---
name: weak-spots-session
description: Run a depth-focused ~30-min Weak Spots session for any family member (Artem, Anna, Nicole, Ernest, Egor). Use when the user says "let's do 30 min on X", "weak spots session", "deep dive on Y", "let's practise emphasis/articles/clefts", or any request for a tier-walked tutorial on a single topic. Distinct from `exercise-session` (short multi-format drill, "exercises"/"упражнения") and `free-write` (unstructured chat, "let's chat"/"поговорим").
---

# Weak Spots — CC session

Depth session, one topic, ~30 min, ladder-walked simple → hard. CC-side counterpart to the PWA Coach tab's Weak Spots button. Works in remote CC: all reads/writes via Firebase MCP, no `tools/*.js`.

If the player asks for general drills mid-session — that's `exercise-session`. Close cleanly first.

## Reads

- `references/family-profiles.md` — level, communication style, themes, `coachLanguage`
- `players/{name}` via `mcp__firebase__firestore_get_document` — `coach_notes.{weak_patterns, recent_observations, engagement_notes}`
- `worker/index.js` → `weakSpotsDrillSystemPrompt` — **canonical topic catalog**. Same 6 IDs and tier ladders as PWA. Read before running; do not re-derive.

Canonical IDs: `emphasis_clefts | article_system | present_perfect_vs_past_simple | preposition_clusters | phrasal_verb_production | hedge_variety`.

## Topic selection

**Artem only — lead with a compact status table.** Before any topic proposal, scan `coach_notes.weak_patterns` + `recent_session_signals` + the last ~5 `recent_observations` to derive status per pattern. Render a single table, ≤10 rows (most actionable first), columns: `# | Pattern | Cat | Status | Last activity | Next move`. Status legend: 🔴 untouched drill candidate · 🟠 surfacing recently (count building) · 🟡 in consolidation (drilled ≤7 days) · 🟢 locked under intervention · ⚪ self-/data-only. Sort by priority: 🟠 promote-candidates first → 🔴 untouched → 🟡 in-consolidation → 🟢 locked. Drop the legend block if it pushes the response longer; the emojis carry the meaning. Then either confirm the named topic or propose 2-3 picks *from* the table. (Other players: skip the table — go straight to proposal.)

If the request names the topic ("30 min on emphasis"), still show the table briefly (Artem uses it to verify pick is on the right pattern), then confirm + state the ladder.

Off-catalog free-text → improvise a 3-tier ladder (mechanics → guided → free production) under a snake_case slug.

## During session

**Mechanics vs drill.** Check `recent_observations` for prior sessions on the same topic in last ~14 days. Found → one-line recap, straight to production. Not found → 2-3 sentence mechanic + one worked example per tier.

**Tier walk.** 1-3 production items per tier. Up when production lands clean. Stay on a tier if the player slips — don't pad, don't escalate over a structural miss. Cue with the player's profile themes.

**Length.** Target ~30 min, 15-20 items. Soft nudge at exchange 12 ("push one more tier or wrap?"). Hard end at 18.

**Coach language.** Per `family-profiles.md` `coachLanguage` — Russian for Anna/Nicole, English for Artem/Ernest/Egor; English quotes for forms in both. Tone: warm, direct, pedagogical. Production teaches.

## End-of-session protocol

Auto-write at close, then read out.

**1. Build session_metadata** matching the worker's shape (see `worker/index.js` `sessionEndInstructions` for `weak_spots_drill`): `topic_id`, `tiers_touched`, `tier_results[]`, `error_patterns_observed[]`, `topics_covered: ["weak_spots:<topic_id>"]`, `pvs_used_correctly[]`, `session_summary`, `assessment{}`.

**Assessment REQUIRED** — drives the silent CEFR fold. `confidence: "low"` for <3 sentences or off-topic; field must be present even when fold skips.

**2. Auto-write via Firebase MCP** (no preview):

- **Session log** → `mcp__firebase__firestore_add_document` to `players/{name}/coach_sessions` with `session_id`, `player`, `mode: "weak_spots_drill"`, `messages[]`, all session_metadata fields, `model_used: "claude-code-cc"`, `created`, `ended`. Mirror `coachWriteSessionLogStandalone` in `index.html`.
- **coach_notes patch** → re-read `players/{name}`, merge: append `recent_observations` entry (date, session_id, note `"Weak Spots ({topic_id}) — ..."`, `author: "claude_code"`); apply `weak_patterns` adjustments per the 2+ session rule in `coach-notes-schema.md`. Cap `recent_observations` at 10. `mcp__firebase__firestore_update_document` on `players/{name}`.
- **Proficiency fold** — if `assessment.confidence === "high"`, `sentence_count >= 3`, level matches `/^[ABC][12]$/`: cap `sentence_count` at 20, `correct = sentence_count - error_count` (≥0). Increment `lvlStats[level].{seen,correct}`, `totalAnswered`, `totalCorrect`; set `aggregated_coach_sessions[session_id] = sentence_count`. Idempotent — skip if `aggregated_coach_sessions` already has the session_id.

**3. Render the player-facing table** using the `weak_spots_drill` template in `coach-notes-schema.md`.

**4. Ask** "How did it feel? — or skip." Non-blocking. If answered, append to `recent_observations`.

## Skip log when

Session was 1-2 turns and nothing of substance emerged. Don't log empty.

## Forbidden

- Inventing `topic_id`s outside the catalog (off-catalog uses a snake_case slug, never an existing canonical ID)
- Skipping the proficiency fold when `confidence === "high"` (breaks `lvlStats` continuity)
- Lecturing the rule without making the player produce
- Re-deriving tier ladders from scratch — read `worker/index.js` first

(General prohibitions live in `references/operational-rules.md`.)
