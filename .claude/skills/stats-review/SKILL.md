---
name: stats-review
description: Analyze player stats from Firestore or uploaded JSON. Use when user uploads family_stats_ai JSON, says "review stats", "analyse Anna's progress", "what should we focus on next for Artem", or any data-driven analysis request. Produces coverage review and proposes coach_notes updates.
---

# Stats Review

You are analyzing player stats to identify patterns, weak spots, and recommended
adjustments. Output: a structured review + 0-4 proposed `coach_notes` updates per
player.

## Reads required before starting

1. **Stats source** — either uploaded JSON or `firestore_get_documents("players/{name}")` for each player
2. **`references/family-profiles.md`** — for the player's stable profile and focus areas
3. **`references/coverage-matrix.md`** — for category targets, input share priorities
4. **`references/coach-notes-schema.md`** — for the update protocol

## Workflow

### Step 1 — Pull stats

Claude Code path: `firestore_get_documents("players/{name}")` for each player.
Read the `stats`, `coach_notes`, and any recent `players/{name}/exercises` history.

claude.ai chat path: Artem pastes the Firestore URL or uploads JSON. Read directly.

### Step 2 — Coverage review (mandatory after every stats upload)

Per `references/coverage-matrix.md` audit protocol, produce for each player:

- **Category-level breakdown**: question count seen, level distribution, accuracy per category
- **Type distribution**: gap/input/mcq/multi accuracy
- **Trends**: comparison vs previous session if available
- **Persistent weak spots**: categories with <70% accuracy across 3+ sessions
- **Stuck questions**: questions with 100% error rate (candidates for `coach_notes.stuck_questions`)
- **Quality flags**: questions with ≥60% error rate across 3+ players (candidates for review)

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

For each confirmed update:
```
firestore_update("players/{name}", {
  "coach_notes.{path}": {new value},
  "coach_notes.last_updated": new Date().toISOString(),
  "coach_notes.last_updated_by": "claude_code"
})
```

For `recent_observations` (FIFO cap of 10): read-modify-write — slice oldest if at cap.

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
