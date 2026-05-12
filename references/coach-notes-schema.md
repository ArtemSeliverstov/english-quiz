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

**`weak_patterns`** — DURABLE GRAMMAR signal ONLY (since 2026-05-12 stats-sprawl cleanup).
Short prose labels with sample sizes where available. Added by `stats-review` only,
after a pattern accumulates ≥2 `session_ids` in `recent_session_signals` (promotion gate).
Removed when 3+ recent clean sessions confirm the pattern is resolved.

Shape — grammar pattern only:
- `"a→the for shared knowledge"`
- `"preposition swap (arrive to → at)"`
- `"L1 calque cluster (verb+prep + time prepositions + verb+noun): wait_for, listen_to..."`

**Lexical / register swaps live elsewhere** — they go into `phrase_tracker.entries[]` (canonical
lifecycle) and `recent_session_signals` is bypassed for them. Format `"<awkward> → <natural> [<context_tag>]"`
is recognised by the lexical-swap parser; if it appears in `weak_patterns`, it's legacy migration
debt — stats-review should move it to `phrase_tracker` and drop it from this field.

Cap: 8 entries total, priority-aware (durable entries kept; the cap is enforced when promotions
land — see "Promotion lifecycle" below).

### `recent_session_signals` — single-session capture buffer (NEW 2026-05-12)

Where session-end auto-merges land. Replaces the prior practice of writing single-session
captures directly to `weak_patterns` with a `(coach_session DATE)` tag.

```javascript
coach_notes.recent_session_signals = [
  {
    pattern_id: "plural_noun_omission",
    session_ids: ["anna_fw_1778...", "anna_td_1778..."],
    count: 2,
    first_seen: "2026-05-01",
    last_seen: "2026-05-11",
    category: "Grammar",                   // optional — when active_categories context tagged it
    source_modes: ["free_write", "translation_drill"]
  },
  ...
]
```

**Cap**: 20 entries.

**Eviction (priority-weighted)** when buffer full and a new pattern arrives:
- Sort buffer by `count` ASC, then `last_seen` ASC (oldest singleton first).
- Drop the first entry. Singletons go before multi-evidence entries — ensures patterns
  accumulating evidence aren't churned out before they can promote.

**Write path** — every drill end-handler (Free Write, Phrase Swap, Weak Spots, Translation,
Error Correction, Article Drill, Particle Sort, Spelling Drill):
1. For each `pattern_id` in `session_metadata.error_patterns_observed[]`:
   - If lexical (`X → Y [tag]` format): skip — `phrase_tracker` handles it.
   - If grammar (snake_case): look up by `pattern_id`. Found → append `session_id` if new,
     bump `count`, update `last_seen`. Not found → append. Evict per rule if at cap.

**Promotion** (stats-review skill, daily): for each entry with `count >= 2`, compose a durable
prose label, append to `weak_patterns`, remove from this buffer.

**Demotion**: none beyond eviction. Singletons that don't recur naturally roll off.

### Recognised tags for lexical swaps

Allowed tag → player matrix (since 2026-05-12 — `biz_general` retired for non-business players):

| Tag | Artem | Egor | Anna | Nicole | Ernest |
|---|---|---|---|---|---|
| `biz_oil` | ✓ | — | — | — | — |
| `biz_general` | ✓ | ✓ | — | — | — |
| `kpmg_consulting` | — | ✓ | — | — | — |
| `academic_ielts` | — | ✓ | — | — | — |
| `brit_expat` | ✓ | — | ✓ | ✓ | ✓ |
| `home_daily` | ✓ | — | ✓ | ✓ | ✓ |
| `leisure_sport` | ✓ | — | ✓ | ✓ | ✓ |
| `almaty_daily` | — | ✓ | — | — | — |
| `claude_collab` | ✓ | — | — | — | — |

Untagged lexical swaps default to all contexts (use sparingly — most lexical swaps are register-bound).

Lifecycle for lexical swaps is the `phrase_tracker.entries[]` state machine — `active → retest_due → mastered`.
See "Phrase tracker lifecycle" below. **No more dual-write to `weak_patterns`** as of 2026-05-12.

**`strong_patterns`** — same threshold (2+ sessions confirming). Useful for adjusting
question selection (don't waste time on what's solid).

**`engagement_notes`** — single string. Longest-running observations about how this
player works best. Updated when something durable shifts.

**`recent_observations`** — append-only with FIFO cap of 10. Each entry has date,
session_id (if from an exercise session), note (1-3 sentences), and author. Drop oldest
when adding 11th. This is the rolling working memory.

**`stuck_questions`** — question IDs the player consistently fails. Used to flag for
content review (restructuring or removal).

**`coach_drill_stats`** (sibling field on `players/{name}`, not under `coach_notes`) — per-target-structure mastery map written by the 5 Phase D live drills. Shape:

```js
players/{name}.coach_drill_stats = {
  "preposition_at_arrive":     { seen: 12, correct: 8, last_seen: "2026-05-11", last_correct: "2026-05-09" },
  "indefinite_first_mention":  { seen: 8,  correct: 7, last_seen: "2026-05-10", last_correct: "2026-05-10" },
  "pv_figure_out":             { seen: 4,  correct: 4, last_seen: "2026-05-08", last_correct: "2026-05-08" },
  ...
}
```

Updater: `coachFoldDrillStats(items_drilled)` in `index.html`, called from inside
`coachWriteSessionLogStandalone` whenever `session_metadata.items_drilled[]` is
non-empty. Read by future home-page status bars; consumed by drill prompts to
skip already-mastered structures; used by Weak Spots to suggest topics from the
bottom-N structures by accuracy. Keys come straight from `items_drilled[].target_structure`
(snake_case, mode-prefixed where relevant — e.g. `pv_*` for phrasal verbs).

**`last_updated_by`** — which surface wrote last. Helps debug cross-surface conflicts.
Possible values:
- `claude_code` — Claude Code (laptop) via `tools/update_coach_notes.js` bash script (or future Firebase MCP if Firestore document tools become available)
- `coach_pwa` — future Coach tab in PWA via Firestore JS client
- `claude_chat` — claude.ai chat (rare — chat can't write directly, but if Artem manually
  edits via Console, mark as this)
- `manual` — direct console edit

---

## Update protocol

Two modes depending on caller — session skills auto-write at session end; batch
review skills (stats-review) stay confirm-first.

### Session skills (`free-write`, `exercise-session`, PWA worker)

After any session, decide 0–4 updates to `coach_notes` for the affected player. Categories:

1. **New `weak_patterns` entry** — pattern confirmed across this + at least 1 prior session
2. **New `strong_patterns` entry** — same threshold
3. **`engagement_notes` revision** — durable shift in how the player engages
4. **`recent_observations` entry** — single-session note worth remembering for next time
5. **`stuck_questions` adjustment** — question crossed 100% error threshold or recovered
6. **`phrase_tracker` transitions** — captured swaps moving through ⚪ → 🔵 → 🟡 → 🟢 → 🏆

Then:

1. **Auto-write** via `node tools/update_coach_notes.js {player} <patch.json>` (or PWA equivalents) — no operator approval, no preview wait. The 2+ sessions rule for `weak_patterns` is mechanical; single-session evidence routes to `recent_observations` only.
2. **Render the player-facing read-out** (table, ≤10 lines including feedback ask). Use the appropriate template below.
3. **Ask for one-sentence feedback** ("How did that feel? — or skip."). Non-blocking. If the player answers, append the answer as another `recent_observations` entry (auto). If they don't answer, the session is already saved; nothing orphaned.

**Why auto-write**: the previous "preview → wait → persist" flow lost data when a player closed the tab mid-feedback. Resilience-to-abandonment matters more than the marginal accuracy of operator approval. Single-session miswrites are recoverable next session ("remove the X swap").

### Player-facing read-out templates

Hide internal field names, session IDs, and status codes from the table. ≤10 lines including the feedback ask. If a row would wrap to a 3rd line, abbreviate ("4 new phrases — say 'show me' for the list").

**`phrase_swap_drill`**:

```
**Saved.**

| | |
|---|---|
| Score | 4 of 6 natural |
| Mastered today | "we'll look into it" |
| Up next | 5 phrases active, 1 retest in ~3 weeks |

How did that feel? One sentence — or skip.
```

**`free_write`**:

```
**Saved.**

| | |
|---|---|
| What we noticed | Articles solid, prepositions slipped once |
| New phrases captured | "a while ago" (instead of "sometime ago") |
| Active list | 7 phrases |

How did it feel? One sentence — or skip.
```

**`exercise-session`** (translation / drill):

```
**Saved.**

| | |
|---|---|
| Score | 7 of 10 |
| Strongest | conditionals |
| Slipped on | preposition swaps (×2) |

How did it feel? One sentence — or skip.
```

**`weak_spots_drill`**:

```
**Saved.**

| | |
|---|---|
| Topic | Emphasis (clefts + fronting) |
| Tiers landed | T1 it-clefts ✓ · T2 wh-clefts ✓ · T3 fronting + inversion partial |
| Up next | Drill T3 again next session |

How did it feel? One sentence — or skip.
```

### Batch review skill (`stats-review`)

Confirm-first protocol stays in place — operator-mode, multi-player, no learner present.

1. **Preview** the patch in human-readable prose, not JSON. For arrays, list the new entries with one line of context each.
2. **Wait for explicit user confirmation.** Don't auto-write.
3. **Persist** via `node tools/update_coach_notes.js {player} <patch.json>`.

### Family-profiles edits

Edits to `references/family-profiles.md` (Learning Goals promotion, persona shifts) are git commits — always confirm-first. The auto-write change does not apply to repo files.

### Forbidden across all skills

- Promoting single-turn observations to `weak_patterns` / `strong_patterns` (those need 2+ sessions)
- Bypassing the promotion rule below
- Auto-writing repo-file edits (CLAUDE.md, references/, progress/ — except generated tracker markdown regenerated mechanically by stats-review)

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

## Phrase tracker lifecycle (lexical / register swaps)

Lexical swaps captured via the `awkward → natural [tag]` notation in `weak_patterns`
have a longer lifecycle than grammar entries because they need spaced retesting.
The state machine is mechanical and runs in `stats-review`.

**Capture-source asymmetry** (added 2026-05-06): CC captures skip the ⚪ first_pass
step and land directly as 🔵 active. Rationale: the coach observed the slip in
real time during a structured session, which is much higher signal than an
ML-inferred capture from the PWA worker. PWA worker captures (lower signal) still
go through ⚪ first_pass and require a 2nd-session hit before promotion. Both
routes converge at 🔵 active and follow the same lifecycle from that point.

CC routes that use the asymmetry — all go through `tools/capture_swaps.js`, which
stamps the right `sources` prefix and skips ⚪:
- `fw` — `free-write` skill, lexical/register slips during chat
- `ex` — `exercise-session` skill, slips during structured drills
- `wrap` — end-of-session prompt-coaching round-up (Artem's stiff/calqued prompts
  to CC, captured at session wrap per the `feedback_cc_prompt_coaching` memory rule)

```
[CC route]   captured 1× → tracker 🔵 active (immediate)
[PWA route]  captured 1× (rec_obs, ⚪) → 2nd hit → tracker 🔵 active
  ↓ 3 clean reps in phrase_swap_drill or unprompted in free_write
demoted from weak_patterns → tracker 🟡 retest-due (date = demote + 21 days)
  ↓ retest window opens; next phrase_swap_drill auto-includes the entry
  ↓ passes
tracker 🟢 mastered (next retest = pass + 42 days)
  ↓ passes 2nd retest
tracker 🏆 owned (no further retests)
  ↓ fails any retest
back to weak_patterns 🔵 active; tracker logs ✗ failed-retest event
```

### Where the data lives

- **Firestore canonical**: `players/{name}.phrase_tracker` field (map). Worker reads it directly when generating `phrase_swap_drill` items (mixes ~4 active + ~2 retest-due).
- **Markdown view**: `progress/natural-phrases-tracker-{name}.md`. **Generated**, not hand-edited. Regenerated by `stats-review` on each refresh. Human-readable inventory + coverage tables.

### `phrase_tracker` field shape

```javascript
players/{name}.phrase_tracker = {
  entries: [
    {
      awkward: "sometime ago",
      natural: "a while ago",
      tag: "brit_expat",
      status: "active",          // ⚪ first_pass | 🔵 active | 🟡 retest_due | 🟢 mastered | 🏆 owned | ✗ failed_retest
      first_seen: "2026-05-08",
      last_drilled: "2026-05-19",
      next_retest: "2026-06-09", // null if active or owned
      reps: 4,
      sources: ["fw", "psd", "psd", "psd"],  // session prefixes
      events: [                  // append-only state-change log
        { date: "2026-05-08", event: "captured", session: "fw_artem_..." },
        { date: "2026-05-12", event: "promoted_to_weak_patterns" },
        { date: "2026-05-19", event: "demoted_to_retest", retest_due: "2026-06-09" }
      ]
    }
  ],
  last_updated: "2026-05-19T11:00:00Z"
}
```

### Retest cadences

- Demote → first retest: **+21 days**
- First retest pass → second retest: **+42 days**
- Failed retest: back to active rotation immediately, no cooldown
- Owned status: no further retests (B2+ register lexis is durable)

### Worker selection rule

When the worker assembles a `phrase_swap_drill` (default 6 items):

1. Pull `weak_patterns` entries containing ` → ` and ` [`
2. Pull `phrase_tracker.entries` where `status == "retest_due"` and `next_retest <= today`
3. Mix 4 active + 2 retest-due. If retest pool is short, fill from active. If active pool is short, drop session count and tell the player.

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
