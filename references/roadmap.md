# Roadmap

What's next, what's deferred. Ordered by category, not strict priority.

---

## Infrastructure (post-s87)

| # | What | Estimate | Why |
|---|---|---|---|
| 1 | App Check (or worker-as-gatekeeper) for Firestore writes. Current rules are append-only-leaning (delete forbidden everywhere except `exercise_active`); reads + create/update still unauthenticated. | 3-5h | Closes the remaining "anyone can spam writes" hole. Anonymous Auth was deferred (browser-scoped UID = lockout on localStorage clear). App Check needs the Firebase SDK or manual token injection — pair with worker rewrite. |
| 2 | Live log UI: "Active session" card on Exercises tab, shown when `exercise_active` doc exists for current player. Progress bar, cancel button. | 0.5 session | Stage 1.5 — infrastructure exists, UI doesn't. |
| 3 | RTDB sunset: data frozen; **deletion dropped per Artem 2026-07-03** — stays frozen indefinitely. Keep `rtdb_backup_<ts>.json` indefinitely. | — | Frozen RTDB is harmless; decision of record in `plans/open-items.md`. |
| 4 | ✅ Done — Phase 2 Coach tab + Cloudflare Worker shipped; all five drill types live-AI primary since 2026-05-11 (Phase D). | — | See `plans/archive/coach-live-ai-and-weak-spots.md`. |
| 5 | ✅ Done — coach_notes field live on all players; bootstrap superseded by the 2026-05-12 stats-sprawl schema. | — | See `coach-notes-schema.md`. |
| 6 | ✅ Done 2026-07-03 — weak-spots tracker generation encoded in `stats-review` PROTOCOL step 8 (rubric: `weak-spots-rubric.md`, per #16); consumed by `weak-spots-session`; loop tripwire (`tools/loop_maintenance.js`) runs daily via `mistakes-review`. | — | Closes the tracker's former "hand-seeded draft" state. |

---

## Phase 1 — Content priorities

Canonical table lives in `references/coverage-matrix.md` (single home — this section
used to duplicate it and both copies drifted). Current bank: 2,246 q / 27 categories
(B1 759 · B2 1128 · C1 348 · C2 11 — `audits/` 2026-07-03). Highlights: Natural
English shipped (30 q, in Anna's window); C1 target met; C2 remains the open gap.

Done items (S31): B1 Grammar expansion, B1 Articles expansion, Used To category,
C1 Indirect Questions, C1 Modal Verbs, C1 Linking Words, C1 Vocabulary.

---

## Emphasis rebuild (per `plans/archive/emphasis-rebuild-spec.md`)

| Phase | What | Status |
|---|---|---|
| 1 | Audit existing 18 + add Cleft, Do-emphasis, So/Neither, Intensifiers (26 new) | ✅ done t2r3 |
| 2 | Business inversion (6 new) + Fronting (5 new, distinction skill) | ✅ done t2r4 |
| 3 | Academic inversion polish (no new authoring; possibly retire 1–2 redundant `inv` mcqs) | **deferred** — Egor-triggered. Activate when Egor reactivates exercise sessions. |

Phase 1 outcomes: Emphasis 18→44, input share 16.7%→25%, B1 0→7, B2 1→20. So/Neither/Nor and Do-emphasis subtopics added from zero. Cleft expanded 1→7.

Phase 2 outcomes: Emphasis 44→55, input share 25%→29%. Business inversion 2→8 (added Should-you / Had-I-known / Were-we-to / Under-no-circumstances production). Fronting 0→5 with the focus on distinction-from-inversion (the most common over-extension error). Phase 3 still deferred.

---

## Phase 1 — Quality / audit backlog

| # | What | Estimate | Why |
|---|---|---|---|
| 1 | s78 input hint/q redundancy audit — 406 input questions, present fix table before applying | 1 session | Hint quality consistency. Already partially done in s79r2. |
| 2 | Remaining ~585 `exp` fields lacking contrastive structure | Multi-session | exp_rewriter tool (s80) exists. Export batches of ~50, rewrite via chat, import and PATCH to Firestore. |
| 3 | Article intervention: ~95 new questions across three phases | Multi-session | Per article diagnostic. Article Decision Drill now in Artem's weekly slot plan. |
| 4 | Phrasal Verbs Phase 2 — ~80 questions, `pv_p2` prefix | 2-3 sessions | Backlog. Three pending decisions: ID prefix scheme, question-type mix, Stage 1 start. |
| 5 | Per-question authoring checklist hardening | Ongoing | Captured in `question-authoring-standards.md`. |
| 6 | `exercise-session` skill: reconcile capture policy with CC asymmetry | <0.5h | Skill currently writes swaps to `recent_observations` only (gate-2-sessions PWA-worker rule). `tools/capture_swaps.js` supports `source: 'ex'` for direct phrase_tracker capture (skip ⚪) — wire up when policy is revisited, or document why exercise-session deliberately stays strict. |

---

## Family — engagement & adaptation

| # | Player | What | Why |
|---|---|---|---|
| 1 | Nicole | Re-engagement intervention design — alternative to player-initiated model | Player-initiated is not working. Coach tab (Phase 2) might help. |
| 2 | Anna | Re-export family stats in ~2 weeks (post-s83) to assess Phase 1 PV remediation | Was scheduled. Run when convenient. |
| 3 | Ernest | Easy-input scaffolding for input questions | Input accuracy 25% on 8 seen — needs gentler entry |
| 4 | Egor | Continue C1+ academic vocab additions | IELTS focus |

---

## Pedagogy / research

| # | What | Estimate | Status |
|---|---|---|---|
| 1 | Brief metacognitive reflection at session end | Done S34 | "Weakest this session: [Category]" yellow banner |
| 2 | Time-interval spaced repetition | Done S76 | Interval scaling 1d→2d→4d→7d→14d |
| 3 | Discourse-context article stems for B2+ | Done S84 | Standard added to authoring checklist |
| 4 | Pattern-specific L1 notes for articles | Done S84 | 5 templates in standard |
| 5 | C1 fluctuation matrix coverage | In progress | Per article authoring checklist |

---

## Speaking lane (parallel to register-fluency)

Separate track from the in-flight register-fluency work (v20260512-r2, r3). Two coordinated plans:

**1. Artem fast-track build** — [`plans/audio-coach-pipeline.md`](../plans/audio-coach-pipeline.md). Single-user sprint, no tier gates, deadline-aware (CFO interview prep). Ships audio infrastructure + two modes (`interview_prep` multi-turn + `shadow_feedback`) on shared plumbing. ~5 days for interview_prep + 3 days for shadow_feedback. **Pick up in a new session.** Cost: ~$0.20/mo on existing accounts.

**2. Family-wide rollout doctrine** — [`plans/speaking-lane.md`](../plans/speaking-lane.md). Three-tier mechanism with engagement gates (Tier 1 $0 listen-and-rate → Tier 2 record-and-replay → Tier 3 transcribe-and-score). Governs flag-flips beyond Artem once the fast-track infra exists.

| # | Track | Estimate | Status |
|---|---|---|---|
| 1 | Artem fast-track: `interview_prep` + audio infra | ~5 days | ✅ **Shipped 2026-05-13** — worker `/v1/audio` (Whisper) + `/interview-prep` CC skill live. |
| 2 | Artem fast-track: `shadow_feedback` (sibling mode) | +3 days | Next on shared infra — not started. |
| 3 | Family rollout — Tier 1 (listen + self-rate) | 1–2 days + clip curation | Gated on Artem fast-track shipping + engagement signal. |
| 4 | Family rollout — Tier 2 (record + replay, no AI) | 3–5 days | Gated on Tier 1 engagement. |
| 5 | Family rollout — Tier 3 (Whisper + Claude feedback) | +1–2 days (infra exists from Artem fast-track) | Gated on Tier 2 recordings happening. |

Prerequisites before starting either track: ~2–4 weeks of register-fluency rubric data first, so we know that lane is producing useful signal before splitting attention. Override possible for the Artem fast-track if interview date pressures the timeline.

---

## Long-term aspirations (no commitment)

- C2 expansion to full 240 questions
- Voice input for dictation exercises (mobile native)
- Chrome extension for inline corrections in any text field
- Spaced repetition export — calendar reminders for due reviews
- Multi-language support (would be next L1 group: Spanish, Mandarin)

These are sketched ideas, not commitments. Don't start without explicit agreement.

---

## How items get on this list

1. Identified during a session as "we should do X"
2. Confirmed with Artem
3. Sized roughly (1 session, 2-3 sessions, ongoing)
4. Added to the right table

When something's done, move it to a "Done" entry in the relevant section, with the
session number. Or move to `version-log.md` if it's session-specific.
