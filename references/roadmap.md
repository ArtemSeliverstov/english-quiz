# Roadmap

What's next, what's deferred. Ordered by category, not strict priority.

---

## Infrastructure (post-s87)

| # | What | Estimate | Why |
|---|---|---|---|
| 1 | Anonymous Auth migration: tighten Firestore rules from open writes to `request.auth != null`. Each device gets a UID. | 1 session | Security hardening. Current open-write posture is project-ID obscurity only. |
| 2 | Live log UI: "Active session" card on Exercises tab, shown when `exercise_active` doc exists for current player. Progress bar, cancel button. | 0.5 session | Stage 1.5 — infrastructure exists, UI doesn't. |
| 3 | 30-day RTDB sunset: after 2026-05-28, delete RTDB data via Firebase Console. Keep `rtdb_backup_<ts>.json` indefinitely. | — | Cleanup. Frozen RTDB is harmless but noisy. |
| 4 | Phase 2: Coach tab in PWA + Cloudflare Worker for API key proxy. Family-facing exercise interface. | 3-4 sessions | Self-service exercises for family on their own phones. |
| 5 | coach_notes Firestore field + bootstrap script | included in Phase 1 | Two-layer memory model. See `coach-notes-schema.md`. |

---

## Phase 1 — Content priorities

| # | What | Estimate | Source | Why |
|---|---|---|---|---|
| 1 | B2 Idioms | ~15 q | New questions needed | Idioms category entirely C1; B2 absent |
| 2 | C1 expansion (Reported Speech, Relative Clauses, G&I, Collocations C1) | ~60 q | Scraped exercises partially done | C1 at 250/330 target. Egor IELTS focus. |
| 3 | C2 — initial batch | ~40 q | New questions needed | C2 at 16; needed for Artem ceiling push |
| 4 | Everyday English — new category | ~30 q | New questions needed | Pragmatics & natural register. Anna engagement driver. |

Done items (S31): B1 Grammar expansion, B1 Articles expansion, Used To category,
C1 Indirect Questions, C1 Modal Verbs, C1 Linking Words, C1 Vocabulary.

---

## Phase 1 — Quality / audit backlog

| # | What | Estimate | Why |
|---|---|---|---|
| 1 | s78 input hint/q redundancy audit — 406 input questions, present fix table before applying | 1 session | Hint quality consistency. Already partially done in s79r2. |
| 2 | Remaining ~585 `exp` fields lacking contrastive structure | Multi-session | exp_rewriter tool (s80) exists. Export batches of ~50, rewrite via chat, import and PATCH to Firestore. |
| 3 | Article intervention: ~95 new questions across three phases | Multi-session | Per article diagnostic. Article Decision Drill now in Artem's weekly slot plan. |
| 4 | Phrasal Verbs Phase 2 — ~80 questions, `pv_p2` prefix | 2-3 sessions | Backlog. Three pending decisions: ID prefix scheme, question-type mix, Stage 1 start. |
| 5 | Per-question authoring checklist hardening | Ongoing | Captured in `question-authoring-standards.md`. |

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
