# Plans index

Active plans, what they cover, which SKILL (if any) loads them.

## Active

| Plan | Scope | Wired to SKILL |
|---|---|---|
| `learning-system-build.md` | Engineering / system build (Phase 2D): active windows, learner shell, spelling layer engine, medal display, schemas, restart-readiness, Phase 3 cleanup. Decisions D1–D14 locked here. | none — Artem's working execution doc |
| `question-bank-plan.md` | Content authoring + bank quality: waves 0–5 per player, workstreams (PV ladder, articles, orthography), Coach library per player, MCQ distractor audit, Idioms re-engineering, tier priorities. | `quiz-development` |
| `open-items.md` | **The consolidated backlog** (2026-07-03): practice queue, tracker package T1–T5, confirm-first pendings, App Check + smaller fixes, deferred-with-triggers, dropped decisions. Cross-checked as a set. | none — picked up on Artem's prompt |
| `speaking-lane.md` | Speaking lane doctrine: spoken sub-skills the text path can't reach (fluency, listening comprehension, prosody via self-recording). Family-wide tiered rollout, engagement gates, kid privacy. Lane itself not started; sibling `audio-coach-pipeline.md` ships the audio infra its Tier 2/3 would use. | none — doctrine for family-wide rollout post-Artem |
| `audio-coach-pipeline.md` | Artem-only audio fast-track on shared infra: `/v1/audio` Worker endpoint (Whisper-large-v3-turbo + R2) + CC interview-prep flow shipped 2026-05-13; `shadow_feedback` mode (Days 6–8) unstarted. | none — Artem execution doc; shipped surface is the `interview-prep` skill |
| `retention-lane.md` | Long-term retention mechanics (shipped 2026-07-03): post-CLOSED expanding probes (+2w/+6w/+4m), monthly ~15-item mixed `retention_probe`, untrained-sibling retirement rule, lifetime sampling of owned phrases/PVs. Builder-shell only. | `exercise-session` (probe mode) + `stats-review` (probe dates, step 8) |
| `russian-l1-b2-foundation-diagnostic.md` | Discovery diagnostic for hidden Russian-L1 B2 foundation gaps. Outside-in design from contrastive linguistics catalogues (not from `coach_notes.weak_patterns`). ~60-80 items across 10-12 clusters, 50/50 recognition/cold-production, one-shot ~60-90 min sitting. B1 fallback deferred to v2. Companion: `russian-l1-b2-foundation-diagnostic-sources.md` (per-cluster catalogue citations + item budget). | none — Artem instrument |

`learning-system-build.md` and `question-bank-plan.md` cross-reference each other; the split is by concern (engineering vs content authoring), not chronology. Read the one matching your task.

## Archive

`plans/archive/` holds shipped or postmortem plans, kept for history. Not loaded by any SKILL and not surfaced from CLAUDE.md.

| File | What it is |
|---|---|
| `phase2-status-log-2026-05.md` | Session-by-session execution records s93–t6, extracted from former `phase2-build-plan.md` §12 |
| `emphasis-rebuild-spec.md` | Shipped post-t2r4 — Emphasis category rebalanced to 55 items / 29% input share |
| `schema-alignment-plan.md` | All three tracks shipped 2026-05-10 |
| `data-integrity-postmortem.md` | 2026-05-02 Nicole-contamination incident record + remediation (P0–P2 shipped t7/2026-05-10/2026-05-11) |
| `repo-improvements-completed.md` | Doc discipline + file reallocation + architecture hardening tracks (Tracks 1, 2, 3.1, 3.2, 3.5, 3.6 shipped; open items extracted to `plans/open-items.md`) |
| `stats-sprawl-cleanup.md` | Shipped through r12 — `coach_notes.weak_patterns` split into three stores (durable grammar / `recent_session_signals` / `phrase_tracker`); per-player migration done 2026-05-12 |
| `coach-live-ai-and-weak-spots.md` | Shipped through r15 — T1 (all Coach types live AI via Worker, library → offline fallback) + T2 (`weak_spots_drill`) complete 2026-05-11; r11–r15 enhancement waves codified back into doctrine |

When researching past decisions, grep `plans/archive/`. Don't apply archived plans as current truth — they describe what was done, not what to do next.

## Convention

- New plans land in `plans/` at the root with `**Status**: active` in the first 10 lines.
- When a plan ships fully, move to `plans/archive/` and update its status line.
- Don't write new plans into `plans/archive/`.
