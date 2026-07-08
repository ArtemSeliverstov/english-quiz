# Exercise Domain Map — Artem

Program-level view of every active learning front, **sorted by leverage** (not by domain), with a momentum axis and a next-action per front. This is the "where is my whole program" dashboard — distinct from the per-lane trackers (`phrasal-verbs-tracker.md`, `weak-spots-tracker-artem.md`).

**Owner**: Artem · **Surface**: Claude Code
**Refreshed by**: `stats-review`, and on demand (see triggers below).
**Format decided**: 2026-07-08 — plain markdown table, leverage-sorted. **Never render this as a widget/graphic** — Artem prefers table view (memory `feedback_prefers_tables_over_visuals`).

---

## Triggers — when to produce this

- **"program view" / "domain map" / "show my exercise program" / "where am I overall"** → render the **full table** below (regenerate first if stats moved since last refresh).
- **Start of any `exercise-session` for Artem** → surface **only the ▲ leverage-zone rows** (top cluster) as the orienting read, then proceed to session selection. Don't dump the whole table mid-session.
- **`stats-review`** → regenerate the whole table from source (below) and bump the date.

---

## How to build it (regeneration recipe)

**Sources** (in priority order):
1. `players/artem.coach_notes.weak_patterns` — each entry is `[Domain · TIER] front — detail`. Tier prefix (`NOW`/`NEXT`/`AMBIENT`) → **Tier** column.
2. `coach_notes.recent_observations` — most-recent evidence per front → **Move** + **Signal** + **Last touched**.
3. `progress/phrasal-verbs-tracker.md` **Top-5 drill queue** + chronic (🔴) rows → PV fronts.
4. `references/weekly-slots.md` — which fronts have a live drilling lane.
5. `progress/weak-spots-tracker-artem.md` — CLOSED / PARKED status for the ✓ and ⏸ rows.

**Columns**:
| Col | Meaning |
|---|---|
| (zone) | `▲` = leverage zone: Tier 🔴 NOW **and** Move ↓ or →. Blank otherwise. |
| Front | The specific thing being drilled (not the domain). |
| Domain | Articles · Tense/aspect · Phrasal verbs · Verb+prep · L1 lexical · Register/fluency · Emphasis. |
| Tier | 🔴 NOW · 🟡 NEXT · 🔵 AMBIENT (chat lane) · ✓ closed · ⚪ dormant. From weak_patterns prefix. |
| Move | ↓ regressing (failed/regressed at last touch) · → stuck/flat (chronic, no recent gain) · ⏸ parked (deliberately waiting — priming lock / scheduled re-test) · ↑ converting (recent cold win, not yet consolidated) · ✓ closed (passed; spot-check only) · ~ ambient (monitored, not drilled). |
| Signal | The hard evidence — score/ratio/date. Keep it a number where possible. |
| Next action | One imperative, ≤6 words. |
| Last touched | Date of most recent drill/evidence. Distinguishes *parked* (recent, deliberate) from *neglected* (old, fell off). |

**Sort**: leverage DESC — Tier (NOW → NEXT → AMBIENT → closed → dormant), then Move (↓/→ above ⏸/↑ within a tier). The table top is the to-do list.

---

## Table — as of 2026-07-08

▲ = leverage zone (spend session weight here). Rows below the converting line need **re-checks, not drills**.

| | Front | Domain | Tier | Move | Signal | Next action | Last touched |
|---|---|---|---|---|---|---|---|
| ▲ | "the"-overuse (abstract/zero nouns) | Articles | 🔴 | ↓ | recurred 7/07 & 7/08 | interleave as secondary, every session | 2026-07-08 |
| ▲ | get through¹ (survive difficulty) | Phrasal verbs | 🔴 | → | 0/9 chronic | production-force, drop recognition reps | 2026-05-20 |
| ▲ | get around to | Phrasal verbs | 🔴 | → | fossil, 1/2 | lead the next PV touch | 2026-07-07 |
| ▲ | agree to (accept a proposal) | Verb+prep | 🔴 | → | missed 2× 7/08 | drill b01/b02, spaced ~1wk | 2026-07-08 |
| ▲ | stem from | Verb+prep | 🔴 | → | avoided 7/08 | force production, b03/b04 | 2026-07-08 |
| | of-PP identifying ("cause of the delay") | Articles | 🟡 | ↓ | sibling fail 7/05 | pair with the-overuse set | 2026-07-05 |
| | perfect-aspect compounds | Tense/aspect | 🔴 | ⏸ | cycle 1 done 7/05 | re-test ~Jul 26 (priming lock) | 2026-07-05 |
| | come up with · read up on · cut down on | Phrasal verbs | 🟡 | → | Top-5 chronic | rotate into PV batches | 2026-07-07 |
| | temporal-anchor calque (past + present verb) | Tense/aspect | 🟡 | → | promoted 6/19 | short set when fresh | 2026-06-19 |
| | "opposite of X" determiner | Articles | 🟡 | → | residual 5/20 | fold into article drill | 2026-05-20 |
| | raise / bring up WITH (not "to") | PV / verb+prep | 🔴 | ↑ | clean cold 7/08 | re-check only, ~1wk | 2026-07-08 |
| | prevent / stop from + -ing | Verb+prep | 🔴 | ↑ | 3/3 round 2 | re-check, b05 | 2026-07-08 |
| | "in case of X" calque | L1 lexical | 🟡 | ↑ | held 7/08 | re-check | 2026-07-08 |
| | hedges · intensifiers · function-drops · dummy-it | Register/fluency | 🔵 | ~ | ambient | watch in free-write / register-check | ongoing |
| | subject–verb agreement | Tense/aspect | ✓ | ✓ | strong 7/06 | done — spot-check only | 2026-07-06 |
| | emphasis / inversion | Emphasis | ⚪ | — | never opened | open only if adding range | — |

---

## Leverage-zone read (2026-07-08)

Six fronts are 🔴 NOW **and** not moving — that's where session time pays. The cluster is **articles the-overuse** (chronic + regressing + live daily → interleave everywhere, not a standalone drill), **two PV fossils** (get through¹ 0/9, get around to — scaffolds aren't converting, need production-forcing), and the **two fresh verb+prep residuals** (agree to, stem from — queued in the vprep tracker). The ↑ converting row (raise-with, prevent-from, in-case-of) needs spaced re-checks only. Perfect-aspect is *parked on a clock*, not neglected.
