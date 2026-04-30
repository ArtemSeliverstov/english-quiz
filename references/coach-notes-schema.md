# Firestore `coach_notes` — Schema and Update Protocol

The `coach_notes` field on each `players/{name}` document is the **dynamic memory layer**
for per-player observations. Stable profile data lives in `family-profiles.md`; this is
where session-by-session learning accumulates.

---

## Schema

```javascript
players/{name}.coach_notes = {
  weak_patterns: [           // confirmed weak patterns (cross-session)
    "preposition swap (arrive to → at)",
    "present perfect omission",
    "article: zero where 'the' needed (shared knowledge nouns)"
  ],
  strong_patterns: [         // confirmed strengths
    "past simple",
    "comparisons"
  ],
  engagement_notes: "Session length 8 items optimal. Prefers RU translation for hard rules. Drops focus after 12 items.",
  recent_observations: [     // FIFO, capped at 10 entries
    {
      date: "2026-04-29",
      session_id: "anna_1730000000000_abc1",
      note: "Slow on transformations, fast on translations. Stem with named referent helped article decisions.",
      author: "claude_code"  // or "coach_pwa" or "claude_chat"
    }
    // ... up to 9 more
  ],
  stuck_questions: [         // questions with 100% error rate, flagged for restructuring
    "cv03", "gi_b04", "irvpp07"
  ],
  last_updated: "2026-04-29T11:00:00Z",
  last_updated_by: "claude_code"
}
```

### Field semantics

**`weak_patterns`** — short labels for confirmed weaknesses. Add only after 2+ sessions
show the pattern. Remove when 3+ recent sessions show it resolved.

**`strong_patterns`** — same threshold (2+ sessions confirming). Useful for adjusting
question selection (don't waste time on what's solid).

**`engagement_notes`** — single string. Longest-running observations about how this
player works best. Updated when something durable shifts.

**`recent_observations`** — append-only with FIFO cap of 10. Each entry has date,
session_id (if from an exercise session), note (1-3 sentences), and author. Drop oldest
when adding 11th. This is the rolling working memory.

**`stuck_questions`** — question IDs the player consistently fails. Used to flag for
content review (restructuring or removal).

**`last_updated_by`** — which surface wrote last. Helps debug cross-surface conflicts.
Possible values:
- `claude_code` — Claude Code (laptop) via `tools/update_coach_notes.js` bash script (or future Firebase MCP if Firestore document tools become available)
- `coach_pwa` — future Coach tab in PWA via Firestore JS client
- `claude_chat` — claude.ai chat (rare — chat can't write directly, but if Artem manually
  edits via Console, mark as this)
- `manual` — direct console edit

---

## Update protocol

After any session that includes stats analysis or an exercise session, propose 0-4
updates to `coach_notes` for the affected player. Categories:

1. **New `weak_patterns` entry** — pattern confirmed across this + at least 1 prior session
2. **New `strong_patterns` entry** — same threshold
3. **`engagement_notes` revision** — durable shift in how the player engages
4. **`recent_observations` entry** — single-session note worth remembering for next time
5. **`stuck_questions` adjustment** — question crossed 100% error threshold or recovered

**Always** wait for user confirmation before writing. Show a proposed-changes table.

**Never** silently update `weak_patterns` or `strong_patterns` from a single session —
those are stable. Use `recent_observations` for one-session insights; promote to patterns
only after a second session confirms.

---

## Promotion rule — coach_notes → family-profiles.md

`coach_notes.weak_patterns` are **measured state**. `family-profiles.md` Learning Goals
are **design intent**. They are not the same thing — a measured weakness is not
automatically a learning goal.

A `weak_pattern` is promoted to a profile Learning Goal only when **both** conditions hold:

1. Persists across **4+ sessions** at consistently low accuracy (<60%), AND
2. Survives a **deliberate intervention** — a targeted exercise session or quiz-development
   pass that explicitly addressed the pattern, after which the weakness still reads.

Without the intervention test, you can't tell whether the gap is a real long-term
priority or just under-exposure. Until both conditions hold, the pattern stays in
coach_notes only.

Demotion: a profile Learning Goal whose pattern reads ≥75% across 4+ sessions can be
moved back into coach_notes (or removed entirely if confirmed resolved). Same review
threshold in reverse.

---

## Read pattern

At the start of any session for a player:

```
1. node tools/get_player.js {name}
2. Combine top-level stats + coach_notes.{weak_patterns, recent_observations, engagement_notes}
3. Read references/family-profiles.md for stable profile
4. → Use combined context to drive session
```

For Coach tab (Phase 2), same flow via Firestore JS client.

For claude.ai chat: paste the URL `https://firestore.googleapis.com/v1/projects/artem-grammar-hub/databases/(default)/documents/players/{name}` and parse the typed-value JSON.

---

## Bootstrap from current userMemories

The current claude.ai userMemories contains family observations as paragraphs. As a
one-shot bootstrap, those should be parsed into per-player `coach_notes` entries:

| Player | userMemories content → maps to |
|---|---|
| Artem | weak_patterns: ["article a→the for shared knowledge", "phrasal verb swap (get through/over)", "get across direction blind spot", "production gap on PVs"]. engagement_notes: see family-profiles.md communication style. |
| Anna | weak_patterns: ["preposition swap (arrive to→at, waiting us→for)", "zero article in time expressions"]. engagement_notes: "Detailed rule explanations in EN, RU translation for hard rules. Sessions <50% → reduce complexity." |
| Nicole | engagement_notes: "Player-initiated only. Up to 2 bonus exercises/week max. Brief, low-friction closings." stuck_questions: ["cv03", "gi_b04", "irvpp07"]. |
| Ernest | weak_patterns: ["recognition vs production on articles"]. engagement_notes: "Brief, low-friction. Error correction over MCQ." |
| Egor | (no exercise data — coach_notes minimal or skipped) |

Bootstrap script: `migration/bootstrap_coach_notes.js` (run once after `coach_notes`
field is added to player documents).

---

## What does NOT go in coach_notes

- **Stable level/persona/communication style/exercise themes** → `family-profiles.md` (this repo)
- **Prescriptive Learning Goals** (what we *want* the player working on) → `family-profiles.md` Learning Goals section
- **Personal/cross-project context about you** (Artem's role, Bahrain, family relationships) → claude.ai userMemories
- **Per-session full transcript** → `players/{name}/exercises/{ts}` (existing exercise history collection)
- **Stats numbers** (accuracy %, seen counts, streaks) → existing stats fields in player doc

`coach_notes` is the **interpretive** layer between raw stats and stable profile.

## What lives ONLY in coach_notes (not duplicated in profile)

- `stuck_questions` — qid lists. Profiles may reference the field by name but never enumerate qids.
- `recent_observations` — rolling FIFO log.
- `engagement_notes` — current-state engagement string. Stable communication-style preferences live in profile.

---

## Example update transaction

After a session where Anna scored 60% and showed slow transformations:

```bash
# Build the patch
cat > /tmp/anna_patch.json <<EOF
{
  "recent_observations_add": [
    {
      "date": "2026-04-29",
      "session_id": "anna_1730000000000_abc1",
      "note": "Slow on transformations (8 sec avg vs 4 sec on translations). Article decisions improved when stem named the referent (the contract Bapco signed).",
      "author": "claude_code"
    }
  ]
}
EOF

# Apply it (after confirming with user)
node tools/update_coach_notes.js anna /tmp/anna_patch.json
```

The script handles read-modify-write internally: fetches current coach_notes, appends
the new observation, FIFO-caps at 10 entries, sets `last_updated` automatically, and
writes back via PATCH with `updateMask=coach_notes`. Other player fields are untouched.

---

## FIFO cap enforcement

`recent_observations` is capped at 10 entries. The `tools/update_coach_notes.js` script
handles this automatically — it reads current observations, appends new ones, then slices
to keep only the most recent 10. You don't need to write this logic yourself.

If for some reason you write coach_notes manually (not via the helper script), the
read-modify-write logic is:

```javascript
const obs = current_coach_notes.recent_observations || [];
const new_obs = [...obs, new_entry].slice(-10);  // keep last 10
```

This is read-modify-write. Concurrent writes from two surfaces could race — last-write-wins
is acceptable here since observations are advisory, not authoritative.
