# Exercise Domain Map — Artem

Program-level view of every active learning front, **sorted by leverage** (not by domain), with size, momentum, and a due indicator. Two tables: **Fronts** (what's broken) and **Lanes** (the engine that works them). Distinct from the per-lane trackers (`phrasal-verbs-tracker.md`, `weak-spots-tracker-artem.md`).

**Owner**: Artem · **Surface**: Claude Code
**Refreshed by**: `stats-review`, and on demand (see triggers).
**Format decided**: 2026-07-08 — plain markdown tables, leverage-sorted, symbol-forward. **Never render as a widget/graphic** — Artem prefers table view (memory `feedback_prefers_tables_over_visuals`). This file is uncapped (only `CLAUDE.md`/`SKILL.md` are word-capped), so the full recipe lives here, not in the skill — the skill carries only a pointer.

---

## Triggers — when to produce this

- **"program view" / "domain map" / "show my exercise program" / "where am I overall"** → render **both tables** (regenerate first if stats moved).
- **Start of any `exercise-session` for Artem** → surface only the **▲ leverage-zone rows** of the Fronts table, then proceed. Don't dump the whole thing mid-session.
- **`stats-review`** → regenerate from source and bump the date.

---

## How to build it (regeneration recipe)

**Sources** (priority order):
1. `players/artem.coach_notes.weak_patterns` — each entry is `[Domain · TIER] front — detail`. Tier prefix (`NOW`/`NEXT`/`AMBIENT`) → **Tier**.
2. `coach_notes.recent_observations` — most-recent evidence per front → **Size**, **Move**, and the scheduled dates that drive **Due**. (Raw signal/last-touched live here — deliberately NOT columns in the view; derive, don't duplicate.)
3. `progress/phrasal-verbs-tracker.md` Top-5 queue + chronic (🔴) rows → PV fronts + their Freq (feeds Size).
4. `references/weekly-slots.md` — the Lanes table + weekly cadence.
5. `progress/weak-spots-tracker-artem.md` — CLOSED / PARKED status (✓ and ⏸) + scheduled re-test dates.
6. `plans/retention-lane.md` — retention-probe cadence for the Lanes table.

### Fronts table — columns

| Col | Meaning |
|---|---|
| (zone) | `▲` = leverage zone: Tier 🔴 NOW **and** Move ↓ or →. Blank otherwise. |
| Front | The specific gap (not the domain). |
| Domain | Articles · Tense/aspect · Phrasal verbs · Verb+prep · L1 lexical · Register/fluency · Emphasis. |
| **Size** | How much it costs him = **frequency × stuckness × breadth**, on a 5-dot scale ●●●●● (big) → ●○○○○ (small); `○○○○○`/`—` = closed or dormant. Frequency from the PV Freq stars / how often it surfaces in production; stuckness from Move + accuracy; breadth from how many contexts/items it touches. |
| Tier | 🔴 NOW · 🟡 NEXT · 🔵 AMBIENT (chat lane) · ✓ closed · ⚪ dormant. |
| Move | ↓ regressing · → stuck/flat · ⏸ parked (deliberate wait) · ↑ converting · ✓ closed · ~ monitored. |
| Do | One imperative, ≤5 words. Names the lane it routes to where useful. |
| **Due** | Stored as an **absolute date** here; **rendered relative to today**: `⏰` due-now/overdue (≤ today) · `⏳` this week (≤7 days) · `🗓 <date>` scheduled later (>7 days) · *blank* = opportunistic, no clock. **Most fronts are blank by design** — only spaced re-checks and scheduled re-tests carry a date, which is what keeps the column low-noise. |

**Sort**: leverage DESC — Tier (NOW→NEXT→AMBIENT→closed→dormant), then Move (↓/→ above ⏸/↑), then Size DESC within a group. Table top = the to-do list.

**Due only applies to** the scheduled subset: spaced re-checks (converting items — re-drilling too early tests memory not retrieval), parked re-tests, the monthly probe, and weekly slots. Everything else is worked opportunistically → blank.

---

## Fronts — as of 2026-07-08

▲ = leverage zone. Due shown as absolute date; render relative to today (⏰/⏳/🗓 per recipe).

| | Front | Domain | Size | Tier | Move | Do | Due |
|---|---|---|---|---|---|---|---|
| ▲ | "the"-overuse (abstract/zero nouns) | Articles | ●●●●● | 🔴 | ↓ | interleave every session | |
| ▲ | get through¹ (survive difficulty) | Phrasal verbs | ●●●●○ | 🔴 | → | force production | |
| ▲ | get around to | Phrasal verbs | ●●●○○ | 🔴 | → | lead next PV touch | |
| ▲ | agree to (accept a proposal) | Verb+prep | ●●○○○ | 🔴 | → | drill b01/b02 | 2026-07-15 |
| ▲ | stem from | Verb+prep | ●●○○○ | 🔴 | → | force production, b03/b04 | 2026-07-15 |
| | perfect-aspect compounds | Tense/aspect | ●●●●○ | 🔴 | ⏸ | re-test | 2026-07-26 |
| | determiner on of-pinned nouns ("cause of the delay" · "the opposite of") | Articles | ●●●○○ | 🟡 | ↓ | pair with the-overuse | |
| | embedded/indirect-question & wh-word structure | Syntax | ●●●○○ | 🟡 | → | drill wh-word order (interview) | |
| | come up with · read up on · cut down on | Phrasal verbs | ●●●○○ | 🟡 | → | rotate into PV batches | |
| | temporal-anchor calque (past + present verb) | Tense/aspect | ●●○○○ | 🟡 | → | short set when fresh | |
| | raise / bring up WITH (not "to") | PV / verb+prep | ●●○○○ | 🔴 | ↑ | re-check | 2026-07-15 |
| | prevent / stop from + -ing | Verb+prep | ●●○○○ | 🔴 | ↑ | re-check, b05 | 2026-07-15 |
| | "in case of X" calque | L1 lexical | ●○○○○ | 🟡 | ↑ | re-check | 2026-07-15 |
| | hedges · intensifiers · function-drops · dummy-it | Register/fluency | ●●●○○ | 🔵 | ~ | watch in free-write | |
| | subject–verb agreement | Tense/aspect | ○○○○○ | ✓ | ✓ | spot-check only | |
| | emphasis / inversion | Emphasis | — | ⚪ | — | open if adding range | |

**Legend** — **Size** ●●●●● big → ●○○○○ small (cost = freq × stuckness × breadth). **Tier** 🔴 now · 🟡 next · 🔵 ambient · ✓ closed · ⚪ dormant. **Move** ↓ regressing · → stuck · ⏸ parked · ↑ converting · ~ monitored. **Due** ⏰ now · ⏳ ≤7d · 🗓 date · blank = no clock.

---

## Lanes — the engine

The delivery lanes that work the fronts above. Cadence + next due; Due rendered relative to today like the Fronts table.

| Lane | Feeds | Cadence | Due |
|---|---|---|---|
| Free-write / register (CR1–4) | register-ambient row + PV consolidation | weekly + ad hoc | *open* |
| Weekly slots (×12) | article drill, particle sort, collocations | weekly | weekly (this wk) |
| Verb+prep lane (b01→) | agree to · stem from + extensions | per touch, expanding | 2026-07-15 |
| PV cold-production batches | the 🔴 PV fossils | per PV touch | |
| Retention probe (R2) | re-tests closed/parked + ⚠ PVs | monthly | 2026-08-01 |
| Weak-spots sessions | one deep front (perfect-aspect…) | ad hoc, ~30 min | |

---

## Leverage-zone read (2026-07-08)

Five ▲ fronts are 🔴 NOW and not moving — but **Size** splits them: the genuinely big-and-active problems are only two — **the-overuse (●●●●●)** and **get through¹ (●●●●○)**. The other three (get around to, agree to, stem from) are smaller and quick to close. **Due** surfaces a convergence: five items (agree to, stem from, raise-with, prevent-from, in-case-of) all fall due ~Jul 15 — run them as **one re-check session next week**, not piecemeal. Perfect-aspect is a big (●●●●○) problem sitting *parked* until Jul 26 — deliberate, not neglected.

*Refreshed 2026-07-08 via `stats-review` (regeneration + audit half): added the new **Syntax** front (embedded/indirect-question structure, from the grammar harvest) and merged the two Articles·NEXT determiner rows into one. `weak_patterns` audited, clean at cap 8.*
