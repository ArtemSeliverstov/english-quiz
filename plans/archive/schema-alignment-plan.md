# Schema Alignment Plan

**Status: ✅ all three tracks shipped (2026-05-10).** Plan kept for historical context.

`players/{name}/exercises/{ts}` was written by two paths in two different shapes. Docs covered one. CC-driven sessions landed sparse (no per-item answers, no `time_to_answer_ms`); PWA Coach tab sessions landed rich; readers had to handle either shape. Resolution below: docs updated to canonical shape, CC writer accepts the rich shape, sparse-legacy explicitly documented as readable-but-not-emitted.

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

| # | Change | Files | Status |
|---|---|---|---|
| **1** | Update exercises section with full canonical shape; mark sparse as legacy-acceptable | `references/firestore-schema.md` | ✅ done 2026-05-10. Per-item table covers `exercise_id` (CC live-author vs CC library-mode vs PWA Coach), `exercise_version`, `escalation_used`. Sparse-legacy clause refined to note new writes from both surfaces emit rich shape. |
| **2** | Add per-item construction guidance + rich JSON example | `.claude/skills/exercise-session/SKILL.md` | ✅ done 2026-05-10. SKILL §2a "Library opt-in (Artem only)" specifies setting `exercise_id` + `exercise_version` per library item; step 5 cites rich-shape requirements. |
| **3** | Accept `items[]`, validate per-item fields, compute `tta_stats` and `auto_suspected` at write time. Update README example. | `tools/log_exercise.js`, `tools/README.md` | ✅ shipped earlier 2026-05; verified 2026-05-10 by a CC library-mode run that returned `items_aggregated: 8`, `tta_stats` populated, idempotency map (`aggregated_exercises`) honoured. |

Order: 1 → 2 → 3 — completed in that order; each is independent post-1.

## Open questions — resolved

- **`time_to_answer_ms` for CC sessions** — Resolved with option (b) default + (c) opt-in: CC sessions estimate timings from Bash `Date.now()` boundaries when convenient, mark as rough; the `auto_suspected` 500ms threshold tolerates sub-second imprecision. The 2026-05-10 library-mode run logged plausible timings (30–60s/item) without ceremony.
- **`auto_suspected` write-time vs read-time** — Resolved as write-time: `tools/log_exercise.js` and the Coach tab both compute it at write when `items[]` carries timing on ≥5 items. Historical sparse rows simply don't carry the flag; no backfill judged worth the effort.

## Acceptance

- Both write paths produce documents that match the canonical schema (rich where total > 0, sparse-but-compatible when only summary fits)
- `firestore-schema.md` is the single source of truth
- `log_exercise.js` validates the rich shape; warns (does not fail) on legacy sparse to preserve historical write paths during transition
- `auto_suspected` set at write time on any session with `items[]` and ≥5 items
- Stats-review skill, future analytics, and the Coach tab "Last session" line read from the same field set regardless of write origin

---

*Companion to `plans/repo-improvements.md`. Reviewed before any further write-path changes; supersedes the schema sections of `firestore-schema.md` once Track 1 ships.*
