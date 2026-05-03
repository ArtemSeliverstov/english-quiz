# Schema Alignment Plan

`players/{name}/exercises/{ts}` is written by two paths in two different shapes. Docs cover one. CC-driven sessions land sparse (no per-item answers, no `time_to_answer_ms`); PWA Coach tab sessions land rich; readers must handle either shape.

Deeplinks (`?exlog=`, `?exstart=`, `?exupd=`, `?exfin=`) are out of scope — being hard-removed in a parallel change. This plan covers only the two live writers.

## Current state

| Write path | Trigger | Doc shape |
|---|---|---|
| `coachUpsertSession` (PWA Coach tab) | Family taps a Coach exercise | **Rich**: `items[]` with `exercise_id`, `submitted_answer`, `correct`, `matched_pattern_id`, `time_to_answer_ms`, `exercise_version`, `escalation_used`; plus `source: 'coach_tab'`, `partial`, `planned_total` |
| `tools/log_exercise.js` (CC `exercise-session` skill) | Artem runs a session via Claude Code | **Sparse**: `exercise`, `topic`, `level`, `total`, `correct`, `date`, `categories`, `error_types[]`, `errors[]` (strings) |

## Where docs go silent

| Doc | Gap |
|---|---|
| `references/firestore-schema.md` | Lists 11 fields for the exercises subcollection; omits `items[]`, `source`, `partial`, `planned_total`, `tta_stats` |
| `.claude/skills/exercise-session/SKILL.md` | No mention of per-item structure |
| `tools/log_exercise.js` | Validates 5 fields; ignores `items[]` |

## Proposed canonical shape

`players/{name}/exercises/{ts}`:

```jsonc
{
  // Identity & summary (both paths)
  "exercise": "translation",
  "topic": "RU→EN prepositions",
  "level": "B2",
  "total": 8,
  "correct": 5,
  "date": "2026-04-29",
  "source": "coach_tab" | "cc_session",   // write-path origin
  "partial": false,                        // true if session ended mid-pool
  "planned_total": 8,                      // pool size at session start

  // Per-item detail (rich; required when total > 0)
  "items": [
    {
      "exercise_id": "tr_anna_b04",        // library id, or null for CC-authored
      "submitted_answer": "I have been waiting for you...",
      "correct": true,
      "matched_pattern_id": "preposition_for_duration",
      "time_to_answer_ms": 4200,
      "exercise_version": 1,
      "escalation_used": false
    }
  ],

  // Aggregations (computed at write)
  "categories": ["Prepositions"],
  "error_types": ["preposition_calque"],

  // Integrity
  "tta_stats": { "mean": 4100, "median": 3800, "min": 1200, "max": 9400, "n": 8 },
  "auto_suspected": false,                 // true when avg_tta < 500ms over ≥5 items

  // Provenance
  "chat_url": "https://claude.ai/chat/abc123",
  "meta": {}
}
```

Sparse legacy rows (pre-rich `tools/log_exercise.js` writes) keep working — `items[]` and `tta_stats` simply absent. Readers treat absence as pre-rich, not as a violation.

## Migration tracks

| # | Change | Files | Est. |
|---|---|---|---|
| **1** | Update exercises section with full canonical shape; mark sparse as legacy-acceptable | `references/firestore-schema.md` | ~80w added |
| **2** | Add per-item construction guidance + rich JSON example | `.claude/skills/exercise-session/SKILL.md` | ~60w added |
| **3** | Accept `items[]`, validate per-item fields, compute `tta_stats` and `auto_suspected` at write time. Update README example. | `tools/log_exercise.js`, `tools/README.md` | ~40 lines + ~20w |

Order: 1 → 2 → 3. Each independent post-1.

## Open questions

- **`time_to_answer_ms` for CC sessions** — no clean "rendered → submitted" pair in chat. Options: (a) skip the field on CC-logged items (loss of integrity-flag signal for CC sessions), (b) approximate from message turn timestamps if available, (c) require CC to record per-item start/end deliberately. Recommend (b) default + (c) opt-in.
- **`auto_suspected` write-time vs read-time** — write-time means historical sessions never get the flag; read-time means every consumer recomputes. Recommend write-time for new sessions plus a one-time backfill script for any historical rows worth flagging.

## Acceptance

- Both write paths produce documents that match the canonical schema (rich where total > 0, sparse-but-compatible when only summary fits)
- `firestore-schema.md` is the single source of truth
- `log_exercise.js` validates the rich shape; warns (does not fail) on legacy sparse to preserve historical write paths during transition
- `auto_suspected` set at write time on any session with `items[]` and ≥5 items
- Stats-review skill, future analytics, and the Coach tab "Last session" line read from the same field set regardless of write origin

---

*Companion to `plans/repo-improvements.md`. Reviewed before any further write-path changes; supersedes the schema sections of `firestore-schema.md` once Track 1 ships.*
