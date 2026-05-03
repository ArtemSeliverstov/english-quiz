# Data Flow

How user actions on each surface produce reads/writes against Firestore. Use this when planning UI changes, debugging cross-surface bugs, or onboarding to a new flow.

Field-level ownership lives in `references/firestore-schema.md` (writer/reader columns). This doc adds the *flows* that connect those writes.

## Surfaces

| Surface | Code | Reads | Writes |
|---|---|---|---|
| **PWA quiz tab** | `index.html` (play loop) | `players/{name}` | `players/{name}` (qStats, catStats, lvlStats, recentSessions, totals, streaks) |
| **PWA Coach tab** | `index.html` (Coach UI) | `players/{name}`, `exercises_library/*` | `players/{name}/exercises/{ts}`, `players/{name}/coach_sessions/{sid}` |
| **CC `exercise-session` skill** | `tools/log_exercise.js` + `tools/update_coach_notes.js` | `players/{name}` (via `get_player.js`) | `players/{name}/exercises/{ts}`, `players/{name}.coach_notes` |
| **CC `free-write` skill** | `tools/log_coach_session.js` + `tools/update_coach_notes.js` | `players/{name}` | `players/{name}/coach_sessions/{sid}`, `players/{name}.coach_notes` |
| **CC `stats-review` skill** | `tools/get_all_players.js`, `tools/get_recent_activity.js`, `tools/update_coach_notes.js` | all of `players/*` + subcollections | `players/{name}.coach_notes` |
| **RTDB legacy** | `artem-grammar-hub-default-rtdb.europe-west1.firebasedatabase.app` | read-only | frozen, sunset ~2026-05-28 |

Two writers touch the player root document: the PWA play loop (everything except `coach_notes`) and `tools/update_coach_notes.js` (only `coach_notes`). One writer touches `exercises` and `coach_sessions` per surface (Coach tab from PWA, `tools/*.js` from CC). No surface owns more than one collection's write path.

## Canonical flows

### Flow 1 — Family member plays the quiz tab

```mermaid
sequenceDiagram
    participant U as Player
    participant Q as PWA quiz tab
    participant FS as Firestore players/{name}
    U->>Q: Pick mode (smart/weak/random), level
    Q->>FS: GET full player doc
    FS-->>Q: qStats, catStats, learning_path, settings
    loop per item
        Q->>U: Render question
        U->>Q: Answer
        Q->>Q: Update local IndexedDB (qStats[qid], catStats, lvlStats)
    end
    Q->>FS: PATCH player doc (qStats deltas, catStats deltas, recentSessions append, totals)
```

**Critical**: the PWA writes the **full player doc shape it has in memory**, scoped by `updateMask`. If the in-memory copy was last loaded for a different player and the player switcher didn't fully reload, the wrong player's stats can be patched into the active player's doc. (This is the failure mode behind the 2026-05-02 Nicole contamination — see `plans/data-integrity-plan.md`.)

### Flow 2 — Family member runs a Coach-tab exercise

```mermaid
sequenceDiagram
    participant U as Player
    participant C as PWA Coach tab
    participant L as exercises_library
    participant FS as Firestore subcollections
    U->>C: Tap a Coach exercise
    C->>L: Load exercise pool
    L-->>C: Items[]
    loop per item
        C->>U: Render
        U->>C: Submit
        C->>C: Local match (matched_pattern_id, time_to_answer_ms)
    end
    C->>FS: SET players/{name}/exercises/{ts} (rich shape: items[], source=coach_tab, partial, planned_total)
```

`coach_sessions` is written in parallel for free-write/escalate modes; `exercises` is written for scored drills. Same player doc not touched directly — `qStats` is **not** updated by the Coach tab.

### Flow 3 — CC runs an exercise session for a player

```mermaid
sequenceDiagram
    participant A as Artem (CC)
    participant CC as Claude Code
    participant T as tools/*.js
    participant FS as Firestore
    A->>CC: "this is Anna, let's do exercises"
    CC->>T: get_player.js anna
    T->>FS: GET players/anna
    FS-->>CC: stats + coach_notes
    Note over CC: Run session in chat
    CC->>T: log_exercise.js anna /tmp/ex.json
    T->>FS: SET players/anna/exercises/{ts}
    CC->>T: update_coach_notes.js anna /tmp/patch.json
    T->>FS: PATCH players/anna.coach_notes (FIFO-managed)
```

CC never writes to `qStats`. Only the PWA play loop does.

### Flow 4 — Player switches profile on a shared device (contamination-relevant)

```mermaid
sequenceDiagram
    participant D as Device (Artem profile loaded)
    participant Q as PWA quiz tab
    participant FS as Firestore
    Note over D: localStorage.currentPlayer = "artem"<br/>IDB cache = Artem's stats
    D->>D: Player picker → switch to Nicole
    Note over D: localStorage.currentPlayer = "nicole"
    Q->>FS: GET players/nicole
    FS-->>Q: Nicole's stats
    Note over Q: ⚠ Race condition risk:<br/>if a write fires before<br/>the GET completes, or<br/>if IDB still holds Artem's<br/>data, Nicole's doc gets<br/>overwritten with Artem's
    Q->>FS: PATCH players/nicole (player-id matched, payload contaminated)
```

This is the unconfirmed root-cause hypothesis for the 2026-05-02 incident. Audit point: any code path that PATCHes `players/{currentPlayer}` should re-read `currentPlayer` *and* the matching IDB cache atomically before writing.

### Flow 5 — Stats review

```mermaid
sequenceDiagram
    participant A as Artem (CC)
    participant T as tools/*.js
    participant FS as Firestore
    A->>T: "review stats"
    T->>FS: get_all_players.js → 5 player docs
    T->>FS: get_recent_activity.js → exercises + coach_sessions per player
    Note over A: Synthesize patterns
    A->>T: update_coach_notes.js per player (with confirmation)
    T->>FS: PATCH players/{name}.coach_notes
```

Stats review reads everything; only `coach_notes` is written, only via `update_coach_notes.js`. The discipline is invariant — see `references/operational-rules.md`.

## Pre-redesign checklist

Before changing any UI surface or write path:

1. Which fields does this surface write? (Check `firestore-schema.md` writer column.)
2. Who else reads those fields? (Reader column.)
3. Is the player ID resolved at write time, or earlier? (Flow 4 risk.)
4. Does this introduce a new write path to a field that has a single canonical writer? (E.g. anything writing `coach_notes` outside `update_coach_notes.js` is a violation.)
5. Are the surface inventory and any affected diagram in this doc still accurate after the change? Update them in the same PR.

## When to update this doc

- New surface added (new tool, new tab)
- New collection or root-level field added
- A flow diagram becomes inaccurate (e.g. write path moved, ordering changed)
- A surface is removed (mark in surface table; remove diagram)

Aim for terse: rough word count <1000. If it grows, narrative detail belongs in `design-decisions.md`, not here.
