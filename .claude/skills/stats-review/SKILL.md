---
name: stats-review
description: Analyze player stats from Firestore or uploaded JSON. Use when user uploads family_stats_ai JSON, says "review stats", "analyse Anna's progress", "what should we focus on next for Artem", or any data-driven analysis request. Produces coverage review and proposes coach_notes updates.
---

# Stats Review

You are analyzing player stats to identify patterns, weak spots, and recommended
adjustments. Output: a structured review + 0-4 proposed `coach_notes` updates per
player.

## Reads required before starting

1. **Stats source** — either uploaded JSON or `node tools/get_all_players.js` (one bash call returns all 5 player docs in a single JSON object)
2. **`references/family-profiles.md`** — for the player's stable profile and focus areas
3. **`references/coverage-matrix.md`** — for category targets, input share priorities
4. **`references/coach-notes-schema.md`** — for the update protocol

## Workflow

### Step 1 — Pull stats

Claude Code path: run `node tools/get_all_players.js` via bash. The script fetches
all 5 player docs in parallel and returns a single JSON object keyed by player name.
For a deeper dive into one player, use `node tools/get_player.js {name}`. For
recent exercise history specifically, the player's exercises subcollection isn't
wrapped in a tool yet — request a stats run only and ask user to paste exercise
history if needed.

claude.ai chat path: Artem pastes the Firestore URL or uploads JSON. Read directly.

### Step 2 — Coverage review (mandatory after every stats upload)

Per `references/coverage-matrix.md` audit protocol, produce for each player:

- **Category-level breakdown**: question count seen, level distribution, accuracy per category
- **Type distribution**: gap/input/mcq/multi accuracy
- **Trends**: comparison vs previous session if available
- **Persistent weak spots**: categories with <70% accuracy across 3+ sessions
- **Stuck questions**: questions with 100% error rate (candidates for `coach_notes.stuck_questions`)
- **Quality flags**: questions with ≥60% error rate across 3+ players (candidates for review)

### Step 2.5 — Per-question mistake audit (mandatory for any flagged item)

For any question that becomes a candidate for restructuring (≥3 attempts at <50%,
or appearing in a cross-player quality flag), pull `qStats[qid].lastWrong` from
**every** player who has seen it. Use `node tools/get_question_mistakes.js <qid> [<qid>...]`.

The actual mistake is the highest-value signal — diagnosis without it is speculation.

Output as part of the per-player coverage table:

| qid | players seen | accuracy | lastWrong (per player) |
|---|---|---|---|
| pv_c07 | artem | 0/4 | artem: "bring in" |

**Caveat**: MCQ stores option index inconsistently — sometimes resolves to text,
sometimes `<no log>`. When unavailable, mark the diagnosis as `[speculation]`
(see speculation marking below) and say so in the recommendation.

### Speculation marking — mandatory

Every claim in a stats review must carry an evidence tag. Three levels:

| Tag | When to use |
|---|---|
| **[data]** | Direct from a stat field or `lastWrong` log. E.g., "Anna typed `doesn't` 4×" |
| **[inferred]** | Pattern visible in stats but causation unstated. E.g., "Articles weakness, 233 attempts at 75% — confirms profile" |
| **[speculation]** | Interpretation beyond what data shows. E.g., "Anna may be abandoning when stems get long" |

Speculation is permitted but **must be tagged**. Untagged claims default to
[data] — so an unmarked claim that turns out to be a guess is a skill violation.

Apply to:
- "Persistent patterns" bullets
- "Action recommendations" — speculate freely about what to *try*, but tag it
- Proposed `coach_notes` updates — never write a [speculation] into `weak_patterns`;
  only [data] or [inferred] qualify. [speculation] stays in `recent_observations`
  and is marked there: `{"note":"[speculation] ..."}`.

Profile updates (`references/family-profiles.md`) require [data] only. Never
propose a profile edit on inferred or speculative grounds.

### Step 3 — Synthesize patterns

Look for:
- New weak patterns confirmed across 2+ sessions (candidates for `coach_notes.weak_patterns`)
- Resolved weaknesses — pattern was weak, now consistently strong
- Engagement shifts — session length, time of day, consistency
- L1 interference patterns specific to Russian
- Recognition vs production gaps (high MCQ but low input)

### Step 4 — Propose coach_notes updates

For each player, propose 0-4 updates. Categories:
- New `weak_patterns` entry (confirmed across 2+ sessions)
- New `strong_patterns` entry (same threshold)
- `engagement_notes` revision (durable shift)
- `recent_observations` entry (single-session note worth remembering)
- `stuck_questions` adjustment

Show as a **proposed-changes table** for each player. Wait for Artem's confirmation
on each before writing.

### Step 5 — Action recommendations

What should we do based on what we learned?

- Question authoring: which categories to expand
- Exercise type adjustments per player
- Slot plan updates for Artem (only)
- Stuck question fixes — restructure or remove

Don't apply these here — that's quiz-development or exercise-system-work skill territory.
This skill produces the recommendation; the user decides what to action and triggers
the relevant skill.

### Step 6 — Persist confirmed updates

For each confirmed update, build a patch JSON and apply it:

```bash
echo '{
  "weak_patterns_add": ["..."],
  "recent_observations_add": [{"date": "...", "session_id": "...", "note": "...", "author": "claude_code"}],
  "engagement_notes": "..."
}' > /tmp/patch.json

node tools/update_coach_notes.js {player} /tmp/patch.json
```

The script reads current coach_notes, applies the patch (dedup-merge for arrays,
FIFO-cap recent_observations at 10), and writes back via PATCH with updateMask.
`last_updated` and `last_updated_by` are set automatically.

## Forbidden

- Auto-applying coach_notes updates without confirmation
- Bringing up sensitive observations from `recent_observations` unprompted (e.g., mental health, personal crises)
- Including stats numbers in proposed memory updates (those live in stats fields, not notes)
- Promoting a single-session observation to `weak_patterns` (need 2+ sessions)
- Pushing recommendations without showing the data they're based on
- Generic recommendations — every recommendation must reference specific data

## Output structure

```
# Stats Review — {date}

## {Player name}
### Coverage
[table]

### Trends
- {bullet}

### Persistent patterns
- {bullet}

### Quality flags
- {q_id}: {issue}

### Proposed coach_notes updates
[table — wait for confirmation]

### Action recommendations
- {what to do, which skill to use}
```

Repeat per player.

## When the data is sparse

If a player has <5 sessions, flag this explicitly. Recommendations should be
correspondingly cautious. Don't over-interpret 3 data points.

## After the review

If any new durable patterns emerged that should be in stable profile (not just
recent), propose a `references/family-profiles.md` edit. Wait for approval before
committing.
