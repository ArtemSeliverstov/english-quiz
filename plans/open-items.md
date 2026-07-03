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

## Tracker package (from the 2026-07-03 tracker analysis — approved shape, not yet built)

- **T1 · Phrase pool hygiene** (~1h): priority score per entry (register-impact by tag:
  biz_oil > brit_expat/home > leisure > claude_collab, × recurrence) + aging rule
  (active, ≤1 rep, no rep in 60d → new `dormant` status; auto-revives on
  re-occurrence) + tracker md surfaces top-20 only. Parks ~40 of 71 actives on day one.
  Touches: `update_coach_notes.js` (STATUS_EMOJI + renderer + lifecycle),
  `coach-notes-schema.md`. Worker needs **no** change (its pool filter is
  `status==='active'`, so dormant drops out automatically). Optional phase B later:
  worker picks actives by priority (needs deploy).
- **T2 · Conversational-register lane (CR1–CR4)** — *replaced `collocation_precision`
  per Artem 2026-07-05: priority is the register acquired-through-text problem.*
  Diagnosis: spoken-casual English is an **absent variety**, not an error class —
  input diet was written business/non-fiction, so production defaults to literate
  register everywhere ("normal people don't talk like this in pubs and offices").
  Evidence: Register = worst quiz category (40%, n=15); `register_rubric` has zero
  Artem data (fires only on FW, which he doesn't use); capture channels are
  polarity-blind (correct-but-formal triggers nothing); the PV production gap is
  partly the same phenomenon (PVs = casual register, Latinate = written).
  Doctrine: passes §6 (no new surface); extends §3 conversation-keystone to the
  builder profile.
  - **CR1 · Casual-mode Free Write** (~30 min, CC `free-write` skill edit, no deploy):
    "hallway/pub mode" — coach models informal register (the missing input stream),
    correction polarity flips (too-formal flagged, not just errors). Also ends the
    register_rubric data drought automatically.
  - **CR2 · Register-down capture polarity** (~20 min, **after T1**): wrap/FW/exercise
    captures also catch correct-but-register-heavy productions as swaps
    ("I intend to depart shortly" → "I'm heading off in a bit" [brit_expat]).
    Tags + lifecycle already exist; only capture instructions change.
  - **CR3 · `conversational_register` catalog topic** (~1 session + deploy): ladder
    recognize-register → re-register for the hallway → produce casual in scenario
    (small talk, reacting, banter). PWA catalog row maps `cat: Register` → P1 routing
    finally works for the worst category. CC parity per P2; system-mechanisms §2.5
    count 6→7. Full spec → a `plans/conversational-register-lane.md` at build time.
  - **CR4 · Casual-FW weekly slot** (doc-level now; `EX_WEEKLY_TARGETS` tile rides the
    CR3 deploy — both current free_write slots are formal-flavoured).
  - Pointers: `shadow_feedback` clips should be **casual speech** (listening half of
    this lane); C1 Register/Natural-English quiz authoring → roadmap backlog.
- **T3 · PV queue + ⚠ orphans** (~30 min): stats-review generates a top-5 PV drill
  queue in the PV tracker header (focus-order + production evidence); the three
  ⚠ A2-production-weak items (come/go back, go on, look for — unre-tested since 05-03)
  join the monthly probe. Touches: PV tracker header, `stats-review` PROTOCOL,
  **retention-lane R2 + exercise-types §12** (probe composition gains the ⚠ bucket).
- **T4 · Schema owned/R4 contradiction** (2 min): `coach-notes-schema.md` "Owned: no
  further retests" → "no scheduled retests; sampled by the monthly retention probe
  (R4), miss demotes".
- **T5 · `interview_rubric` aggregation** (~10 min): stats-review PROTOCOL step 3
  aggregates `interview_rubric` alongside `register_rubric` — interview-prep sessions
  currently accumulate unanalyzed. Ordering: do before `shadow_feedback` ships.

## Confirm-first pending (proposals ready, awaiting Artem)

- **Family-profiles snapshot lines** — Anna "re-engaging (Apr 2026)" → idle-since-05-18;
  Ernest "inactive mid-Mar" → IGCSE-prep active, window 4; Egor → dormant note.
  ([data]-backed; profile edits are git commits, confirm-first by protocol.)
- **exercise-session lexical-capture policy** (roadmap Quality #6): wire
  `capture_swaps.js --source ex` for direct 🔵 capture, or keep the deliberate
  rec_obs-only strictness. Validity note: decide **after T1 lands** — direct capture
  raises inflow into a pool whose WIP problem T1 is meant to fix.

## Infrastructure (carried forward, still valid)

- **App Check on Firestore** (~2.5h remaining of 3 layers; backup layer ✅ done).
  reCAPTCHA-based `request.app != null` rule + append-only-ish hardening. Gated on
  Phase 2D acceptance per `learning-system-build.md` §11.7.
- **Live-log UI** (0.5 session): "Active session" card on the Exercises tab off the
  existing `exercise_active` doc. Infrastructure exists, UI doesn't.
- **Smaller fixes**:
  - `.mcp.json` hardcodes `D:/Claude/...` — make relative/env-driven if anyone else clones.
  - Worker `RUSSIAN_FALLBACK_PLAYERS` should log a warning when hit (stale-bundle signal).
  - **`archive/` + `ref/index.html` are publicly served via Pages** — weight *raised*
    by the folder audit: `archive/` is now deliberately tracked and its HTML KB
    snapshots include learner data; house rule 5 (personal data) argues for a Pages
    exclusion or content check. Verify nothing references them publicly, then scope out.
  - **doc-style reference ceilings** — `design-decisions.md` now ~2.6k words (2026-07-03
    entries pushed it further past the ~2.5k courtesy ceiling). Aligns with the caps
    policy decision: either add warn-only ceilings to `check_doc_caps.js` or accept
    ceilings as prose guidance. Low priority.

## Larger builds (tracked elsewhere — pointers, no duplication)

- **`shadow_feedback`** (~3 days on existing audio infra) → `plans/audio-coach-pipeline.md`. Do T5 first.
- Speaking-lane family tiers, PV Phase 2 authoring, C2 batch, article phase 3 → `references/roadmap.md`.

## Deferred with explicit triggers

| Item | Trigger to revisit |
|---|---|
| `collocation_precision` catalog topic (business half — demoted from T2 per Artem 2026-07-05) | CR3 shipped **and** the next full stats-review still shows Collocations/Word Choice as top scaled gaps (informal collocations are partly covered by the CR lane itself) |
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
