# Stats sprawl cleanup — `weak_patterns` split

**Status**: shipped through r12 (Phase A–E complete; per-player migration via Firebase MCP done 2026-05-12)
**Owner**: Artem · execution: Claude Code (laptop, with Firebase MCP)
**Doctrine cross-refs**: `docs/system-mechanisms.md` §4 (stats stores inventory — canonical post-cleanup state), `references/operational-rules.md` (P3 single feedback DB), `references/coach-notes-schema.md` (schema + lifecycle authority).

`coach_notes.weak_patterns` had drifted into three jobs. Anna's pool was the worked example: 17 entries against a stated cap of 8, mixing durable grammar signal (6), single-session captures (4), and lexical-swap dupes of `phrase_tracker.entries[]` (7). Drill prompts that read this pool got noisy context every turn. This plan split the three jobs into three stores.

---

## Contents

1. End state
2. The split
3. Tag hygiene
4. Phasing
5. Per-player migration map
6. Open items
7. Status log

---

## 1. End state

- `coach_notes.weak_patterns` = durable grammar only. Cap 6-8. Sample-sized prose labels. Promoted from `recent_session_signals` after ≥2 sessions of same `pattern_id`. Stats-review owns the lifecycle.
- `coach_notes.recent_session_signals` = single-session capture buffer (new). Cap 20. Priority-weighted eviction (singletons first). Auto-written by every drill end-handler. Promoted on threshold met.
- `phrase_tracker.entries[]` = lexical swap lifecycle (unchanged). Canonical. No more dual-write to weak_patterns.
- `recent_observations` = unchanged. Free-text session notes (1-3 sentences). FIFO 10.
- Tag hygiene: `biz_*` tags allowed only on Artem + Egor entries.

After the split, every drill prompt's "weak patterns to weave in" block goes from ~800 words of mixed-quality context to ~200 words of high-trust signal. Token cost down, signal density up.

---

## 2. The split

### `recent_session_signals` shape

```js
coach_notes.recent_session_signals = [
  {
    pattern_id: "plural_noun_omission",            // snake_case grammar tag from error_patterns_observed
    session_ids: ["anna_fw_1778...", "anna_td_1778..."],  // distinct sessions where it fired
    count: 2,                                       // === session_ids.length
    first_seen: "2026-05-01",
    last_seen: "2026-05-11",
    category: "Grammar",                            // optional — when active_categories context tagged it
    source_modes: ["free_write", "translation_drill"]
  },
  ...
]
```

### Lifecycle

**Write path** — every drill end-handler that emits `error_patterns_observed[]`:
1. For each `pattern_id` in the array:
   - If `pattern_id` is a lexical swap (`X → Y [tag]` format): skip — phrase_tracker handles it.
   - If `pattern_id` matches a snake_case grammar label (no arrow): look up in `recent_session_signals`.
     - Found: append `session_id` to `session_ids` if not already there, bump `count`, update `last_seen`.
     - Not found: append new entry. If buffer at cap (20), evict by priority rule below.
2. **Promotion check**: if any entry now has `count >= PROMOTION_THRESHOLD` (2), flag for stats-review (or auto-promote — see open item).

**Priority-weighted eviction** (when buffer at cap and new pattern arrives):
1. Sort buffer by `count ASC`, then `last_seen ASC` (oldest singleton first).
2. Drop the first entry. Singletons go before multi-evidence entries.
3. This ensures high-priority patterns (multi-session evidence, near promotion) survive churn.

**Promotion** (stats-review, daily):
1. For each entry with `count >= 2`:
   - Compose a durable prose label (e.g. `"plural noun omission — 3 sessions (free_write, translation_drill, error_correction_drill) since 2026-05-01"`).
   - Append to `coach_notes.weak_patterns` (subject to existing cap 8, priority-aware).
   - Remove the source entry from `recent_session_signals`.

**Demotion** (stats-review, daily):
1. For each `weak_patterns` entry with 3+ recent clean sessions (no re-firing in last 14 days): archive — append to `strong_patterns` or just remove.

### `weak_patterns` scope (narrowed)

- Only durable grammar signal. No lexical entries. No `(coach_session ...)`-tagged single-session captures.
- Writers: `stats-review` skill only (CC, after promotion gate).
- Cap stays at 8, priority-aware logic stays (durable entries kept, multi-session-confirmed entries fight for slots).

### `phrase_tracker` (no change)

- Canonical lexical swap store. Lifecycle: `active → retest_due → mastered`, reps-based.
- `tools/capture_swaps.js` writes here only — drop the `weak_patterns_add` dual-write.
- PWA `coachBuildPhrasePool` already reads from here.

---

## 3. Tag hygiene

Allowed tag → player matrix:

| Tag | Artem | Egor | Anna | Nicole | Ernest |
|---|---|---|---|---|---|
| `biz_oil` | ✓ | — | — | — | — |
| `biz_general` (NEW — for non-oil business contexts) | ✓ | ✓ | — | — | — |
| `kpmg_consulting` | — | ✓ | — | — | — |
| `academic_ielts` | — | ✓ | — | — | — |
| `brit_expat` | ✓ | — | ✓ | ✓ | ✓ |
| `home_daily` | ✓ | — | ✓ | ✓ | ✓ |
| `leisure_sport` | ✓ | — | ✓ | ✓ | ✓ |
| `almaty_daily` | — | ✓ | — | — | — |
| `claude_collab` | ✓ | — | — | — | — |

Anna's existing `[biz_general]` entries (7 lexical swaps) retag to context-appropriate alternatives:
- `take a decision / on next week → make a decision / next week` → `[home_daily]` (generic daily life)
- `wait me → wait for me` → `[home_daily]`
- `made homework / during two hours → did homework / for two hours` → `[home_daily]` (family context)
- `on last week → last week` → `[home_daily]`
- `listen for / are you hearing → listen to / can you hear` → `[brit_expat]` (conversational meeting talk)
- `on next week → next week` → `[home_daily]`
- `depends from → depends on` → `[brit_expat]`

---

## 4. Phasing

**Phase A — Schema docs** (no code, ships in any commit):
- `references/coach-notes-schema.md`: narrow weak_patterns scope, new `recent_session_signals` section + lifecycle + eviction rule, tag-hygiene matrix.
- This plan file lands.

**Phase B — PWA refactor** (deploy as `v20260511-r12`):
- Refactor `coachMergeWeakPatterns` in `index.html`:
  - Split into `coachMergeWeakPatterns` (durable only, no-op for session captures) + new `coachMergeRecentSessionSignals` (handles the buffer).
  - Lexical entries (with ` → ` and `[tag]`) skip both — phrase_tracker is canonical.
  - Eviction logic as specified.
- Drill end-handlers call `coachMergeRecentSessionSignals` instead of (or alongside) the legacy merge.

**Phase C — CC tools** (no deploy, immediate):
- `tools/capture_swaps.js`: drop `weak_patterns_add` from the patch — only write `phrase_tracker_add`.
- `tools/update_coach_notes.js`: support `recent_session_signals_add`, `recent_session_signals_promote`, `recent_session_signals_remove` keys.

**Phase D — stats-review skill update**:
- New step at session start: scan `recent_session_signals` → promote any `count >= 2` to `weak_patterns` with a stats-derived prose label, prune the source.
- Audit weak_patterns: flag any session-tagged entries (legacy noise) for migration.

**Phase E — Per-player migration (one-off via MCP)**:
- For each player: read current `weak_patterns`, split into the three buckets.
  - Durable grammar entries (no `(coach_session ...)` tag, no `→` arrow with `[tag]`) → stay in weak_patterns.
  - Single-session-tagged entries (`(coach_session DATE)`) → move to `recent_session_signals` with `count: 1, session_ids: [parsed-from-tag]`.
  - Lexical entries (`X → Y [tag]`) → drop from weak_patterns (already in phrase_tracker).
- Retag Anna's `[biz_general]` lexical entries per the table above.

---

## 5. Per-player migration map

| Player | Pre-split `weak_patterns` count | After split: durable | recent_session_signals | (phrase_tracker — unchanged) |
|---|---|---|---|---|
| Anna | 17 | 6 | 4 | 7 (already in tracker) |
| Artem | 49 | 11 | 5 | 33 (already in tracker) |
| Ernest | 3 | 3 | 0 | 0 |
| Nicole | 8 | 4 | 4 | 0 |
| Egor | 2 | 2 | 0 | 0 |

All five players migrated 2026-05-12 via Firebase MCP. Anna's `[biz_general]` lexical retags applied per §3 table. No further per-player migration outstanding.

---

## 6. Decisions taken (closed) + still-open

**Closed**:
1. **Auto-promote vs flag-for-review** — resolved **stats-review-driven**. Daily cadence is fine; the prose-label quality matters for drill prompt readability. PWA auto-merges signals on session end; stats-review composes durable labels and promotes.
2. **Coach drill stats overlap** — `coach_drill_stats[target_structure]` serves a distinct purpose (mastery accuracy, drill side of recognition-vs-production split). Surfaced in `getCategoryProgress` from r13. Kept separate from `recent_session_signals`; both shipped.

**Still open**:
- **Promotion-threshold tuning** — 2 sessions might be too eager for some pattern types (e.g. typos shouldn't promote to durable). Per-pattern-class thresholds (typos = 3, grammar = 2) add complexity. Defer until we see actual patterns of false promotion in post-r12 data.

---

## 7. Status log

Append-only. One entry per session that advances this plan.

### 2026-05-12 · plan landed

Plan written from conversation. Three-way split locked: weak_patterns (durable only) / recent_session_signals (single-session buffer with priority eviction) / phrase_tracker (lexical lifecycle, no change). Tag hygiene matrix specified. `biz_general` retired for non-business players; remains valid for Artem + Egor.

### 2026-05-12 · Phase A–E shipped in r12 (commit 9a92a4e)

**Phase A — Schema docs**: `references/coach-notes-schema.md` updated with narrowed `weak_patterns` scope, new `recent_session_signals` section + lifecycle + priority-weighted eviction, tag-hygiene matrix.

**Phase B — PWA refactor**: `coachMergeWeakPatterns` in `index.html` split into durable-only path + new `coachMergeRecentSessionSignals` for the single-session buffer. Lexical entries (`X → Y [tag]` shape) now skip both paths — `phrase_tracker` is canonical. Eviction logic shipped as specified (sort by count ASC, then last_seen ASC, drop first). Drill end-handlers wired to call the new merge.

**Phase C — CC tools**: `tools/capture_swaps.js` dropped the `weak_patterns_add` dual-write — phrase_tracker only. `tools/update_coach_notes.js` gained `recent_session_signals_add`, `recent_session_signals_promote`, `recent_session_signals_remove` keys.

**Phase D — stats-review skill**: new step at session start scans `recent_session_signals` → promotes any `count >= 2` to `weak_patterns` with a stats-derived prose label, prunes source. Legacy session-tagged entries flagged for one-time migration.

**Phase E — Per-player migration** (via Firebase MCP, one-off): Anna 17→6+4 / Artem 49→11+5 / Ernest 3→3+0 / Nicole 8→4+4 / Egor 2→2+0. Anna's `[biz_general]` lexicals retagged to `[home_daily]` / `[brit_expat]` per §3 matrix. No further migration outstanding.

### 2026-05-12 · Post-r12 enhancement (informational)

r13 surfaced `coach_drill_stats` alongside `qStats`/`catStats` in `getCategoryProgress` (closing the recognition-vs-production gap on the learner stats panel). r14 fixed a regression where `coachBuildPhrasePool` and `coachUpdatePhraseSwapAvailability` still read lexicals from the now-cleaned `weak_patterns` — switched both to `phrase_tracker.entries[status==='active']` (the canonical post-cleanup source). Both improvements are downstream of this plan but didn't reshape the split — logged here for cross-ref.
