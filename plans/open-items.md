# Open items — consolidated backlog

**Status**: backlog — the single remaining-items file. Combined 2026-07-03 from the
holistic review, retention analysis, tracker-system analysis, folder audit, and the
prior operational backlog; every item validity-checked against the others (see
Cross-checks). Not loaded by any SKILL — picked up on Artem's prompt.
**Scope**: excludes content-authoring backlogs (those stay in `references/roadmap.md`
+ `plans/question-bank-plan.md` — no duplication per the redundancy rule).

---

## Practice queue (Artem — dated, do in order)

| When | What | ~Time |
|---|---|---|
| now | **Retention probe #1** — 4 patterns overdue (than/that, opposite-of-prep, last/latest, of-PP) + siblings + due re-checks | 15 min |
| ~07-08 | Weak-spots session: re-checks (gerund set, when+future, mass-noun) + open the **B2 perfect-aspect** front | 30 min |
| ~07-16 | **Double-genitive** spaced re-test (not earlier — priming risk) | 10 min |
| next psd | "over budget and **behind** schedule" re-enters automatically (failed 07-03 retest) | — |
| on your word | Session-wrap **prompt round-up** (2–3 rephrasings collected from today, starting with "wholistic review of the projecting") | 5 min |
| human | **Anna re-engagement nudge** — low-pressure invite to one Free Write (her keystone); no drills until she's back | — |

Validity note: probe #1's owned-material bucket is **empty this month** (0 owned
phrases — the 12 mastered on 07-03 reach owned only after their +42d retest ≈ mid-Aug;
0 🏆 PVs), so the probe runs ~12 items, not 15. Expected, not a defect.

## Tracker package (from the 2026-07-03 tracker analysis)

- **T1 · Phrase pool hygiene** — ✅ done 2026-07-03: priority score (tag weight ×
  recurrence, weight-4 tags exempt from aging), 💤 `dormant` status + 60d aging rule +
  auto-revive on re-capture, top-20 drill queue in the tracker md. One-time backfill
  sweep at `--aging-days 50` parked 53 of 71 actives (kept: all 12 biz_oil + 5
  multi-evidence + 1 brit_expat). Standing rule runs in stats-review step 6
  (`--apply-aging`). Phase B (worker picks by priority) stays deferred.
- **T2 · Conversational-register lane (CR1–CR4)** — ✅ shipped 2026-07-04 (decision
  2026-07-03). Full record: `plans/conversational-register-lane.md`. CR1 casual-mode
  Free Write + mandatory `register_rubric` on CC logs; CR2 register-down captures in
  all three channels (after T1); CR3 `conversational_register` catalog topic #7
  mapping `cat: Register` (P1 now routes the worst category; worker + PWA deployed);
  CR4 weekly slot #12 "Hallway talk". Pointers live on: `shadow_feedback` clips in
  casual register; C1 Register/Natural-English authoring → roadmap backlog.
- **T3 · PV queue + ⚠ orphans** — ✅ done 2026-07-04: Top-5 drill queue seeded in the
  PV tracker (get around to → get through ¹ → come up with → read up on → cut down on;
  regenerated at each stats-review per PROTOCOL 6c); ⚠ A2 direction traps route to the
  retention probe (R2 bucket 4 widened; exercise-types §12 + exercise-session updated).
- **T4 · Schema owned/R4 contradiction** — ✅ done 2026-07-03 (schema + the
  design-decisions phrase-tracker entry both amended: owned = no *scheduled* retests,
  sampled monthly per R4, miss demotes).
- **T5 · `interview_rubric` aggregation** — ✅ done 2026-07-04: PROTOCOL step 3
  aggregates it (last-5 high-confidence convention); `interview-rubric.md` gained its
  § Stats-review aggregation (specificity_score is the flag axis); firestore-schema
  rows added (interview_rubric; register_rubric writers updated for CR1). Unblocks
  `shadow_feedback`.

## Confirm-first pending (proposals ready, awaiting Artem)

- **Family-profiles snapshot lines** — Anna "re-engaging (Apr 2026)" → idle-since-05-18;
  Ernest "inactive mid-Mar" → IGCSE-prep active, window 4; Egor → dormant note.
  ([data]-backed; profile edits are git commits, confirm-first by protocol.)
- **exercise-session lexical-capture policy** — ✅ decided 2026-07-04 (Artem: wire it):
  captures route via `capture_swaps.js --source ex` (direct 🔵). Sequenced correctly —
  T1 pool hygiene landed first, so the widened intake stays bounded.

## Infrastructure (carried forward, still valid)

- **App Check on Firestore** (~2.5h remaining of 3 layers; backup layer ✅ done).
  reCAPTCHA-based `request.app != null` rule + append-only-ish hardening. Gated on
  Phase 2D acceptance per `learning-system-build.md` §11.7.
- **Live-log UI** (0.5 session): "Active session" card on the Exercises tab off the
  existing `exercise_active` doc. Infrastructure exists, UI doesn't.
- **Smaller fixes**:
  - `.mcp.json` hardcodes `D:/Claude/...` — make relative/env-driven if anyone else clones.
  - Worker `RUSSIAN_FALLBACK_PLAYERS` should log a warning when hit (stale-bundle signal).
  - **Public exposure — DECISION NEEDED (verified 2026-07-04)**: probe confirmed the
    entire repo is publicly reachable via Pages with predictable URLs — not just
    `archive/` (HTTP 200 on the KB snapshot and the PV mastery plan with Artem's
    stats) but also `diagnostics/` (**the kids' scored IGCSE results and study
    schedules**) and `progress/` trackers. Nothing links to them from the app
    (0 references in index.html) — obscurity only. Inherent to public-repo Pages
    since day one, but the kids' assessment data (added 07-01) raises the stakes.
    Options: (a) accept — first names only, unguessable-ish URLs, low sensitivity;
    (b) publish only app files (index.html, sw.js, manifest, icons, ref/) via an
    Actions-driven Pages deploy — ~1h, changes the deploy flow, repo stays public
    but docs/learner data stop being *served*; (c) private repo + external static
    host for the app. Artem's call; (b) recommended.
  - **doc-style reference ceilings** — ✅ resolved 2026-07-03: history logs
    (version-log, bug-log, design-decisions) manage size via **archive splits**, not
    word ceilings (rule now in doc-style; precedent: both prior log splits).
    design-decisions splits when it crosses ~3.5k words.

## Larger builds (tracked elsewhere — pointers, no duplication)

- **`shadow_feedback`** (~3 days on existing audio infra) → `plans/audio-coach-pipeline.md`. Do T5 first.
- Speaking-lane family tiers, PV Phase 2 authoring, C2 batch, article phase 3 → `references/roadmap.md`.

## Deferred with explicit triggers

| Item | Trigger to revisit |
|---|---|
| `collocation_precision` catalog topic (business half — demoted from T2 per Artem 2026-07-03) | CR3 shipped **and** the next full stats-review still shows Collocations/Word Choice as top scaled gaps (informal collocations are partly covered by the CR lane itself) |
| `retention_log` trend store | 2–3 monthly probes of data exist |
| PWA slot tile for the probe (`EX_WEEKLY_TARGETS` #12) | probe habit sticks ≥2 months |
| Learner-shell retention probes | a learner sustains high volume |
| PV tracker full Status re-derivation | fresh quiz-tab data exists (none since 05-20) |
| Worker priority-pick for phrase pool (T1 phase B) | next worker deploy after T1 |

## Dropped / won't-do (decisions of record)

- **RTDB deletion** — dropped by Artem 2026-07-03; stays frozen indefinitely (roadmap row updated to match).
- **Worker rate limit** — won't-do per `worker/README.md` threat model; revisit only on observed abuse.

## Done and moved out (see version-log 2026-07-03 for the full record)

Log caps (version-log ✅, bug-log ✅) · backups retention + `exercises_library`
snapshot ✅ · tripwire action-matching messaging ✅ · everything from the holistic
review, retention lane R1–R5, folder audit cleanup, Nikolay teardown.

---

## Cross-checks (validity of the set as a whole, 2026-07-03)

1. Probe #1 runs before T3 → ⚠ PV items join from the *next* monthly probe; no conflict.
1b. **CR2 sequenced after T1** (same logic as the capture-policy item: don't widen
   phrase-pool intake — register-down captures will add volume — before the aging +
   priority machinery exists). CR1 has no such dependency and can go first.
1c. **CR3 takes T2's catalog slot** — still one new topic, same §6 pass; collocation
   topic deferred with an explicit trigger, and its informal half is covered by CR
   drills anyway.
1d. **CR1 revives register_rubric** → by the time CR3 ships there will be baseline
   register data to measure the lane against (measurement precedes intervention).
2. T1's `dormant` status is worker-safe without a deploy (pool filter excludes it); the
   md renderer + schema are the only touches.
3. T2 needs two catalog rows sharing one topic id — the P1 helper handles duplicate ids
   fine (both categories surface as candidates).
4. T3 amends the retention-lane R2 composition — retention-lane.md and exercise-types
   §12 must change in the same commit as the PROTOCOL line.
5. Capture-policy decision deliberately sequenced after T1 (don't widen the intake
   while fixing the backlog).
6. T5 precedes shadow_feedback (aggregation shape informs the sibling mode's metadata).
7. The archive/-on-Pages item interacts with house rule 5 and the now-tracked archive/
   — scope-out is the likely resolution, not un-tracking.
