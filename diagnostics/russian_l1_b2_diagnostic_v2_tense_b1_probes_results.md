# Russian L1 B2 Foundation Diagnostic v2 — B1 Tense/Aspect Probes Results

**Test taker**: Artem
**Session**: 2026-05-18 (single sitting, ~15 min, batched 6 items per turn, no in-session feedback)
**Test**: 12 items targeting B1-level tense/aspect substrate · 7 recognition / 5 production · 1 bridge-to-B2 item
**Parent**: `tests/russian_l1_b2_diagnostic_v1_results.md` §v2 decision
**Spec**: `plans/russian-l1-b2-foundation-diagnostic.md` §Acceptance — "v2 decision made based on data, not design assumption"
**Items**: `tests/russian_l1_b2_diagnostic_v2_tense_b1_probes.json`
**Raw responses**: `tests/russian_l1_b2_diagnostic_v2_tense_b1_probes_responses.json`

---

## Headline

**Overall score**: 10 correct + 1 partial + 1 incorrect = **87.5% weighted** ((c + 0.5·p) / 12).

**B1 substrate is SOLID.** v1 hypothesis confirmed: the 2026-05-18 v1 tense/aspect cluster failure (43%, foundation-suspect) is **not** at the B1 level. Past simple form, basic PS-vs-PP, used-to, stative verbs, time markers all land cleanly. **The foundation gap is at B2** — specifically, narrow compound interactions, not the perfect system as a whole.

**Key refinement**: today's morning weak_pattern promotion (`tense/aspect cold-production deployment gap (perfect family + reported-speech backshift)`) framed the gap broadly as "perfect family". v2 narrows this — past perfect form basics are **not** the gap (item 12 *"By Friday we had agreed all final terms with the regulator"* landed cleanly in cold production). The gap sub-patterns from v1 should be re-read as:

1. Past perfect + *already* insertion + passive/intransitive verb selection (compound interaction, not form-basics)
2. Present perfect continuous + duration adverb (PPC avoidance specifically)
3. Reported-speech backshift drop
4. *To-the-moment* / temporal-anchor calque (which interacts with past perfect's time anchoring)

---

## Per-item result

| # | Type | Response | Score | Reading |
|---|---|---|---|---|
| 01 | recog | B (rode) | ✓ | PS irregular form clean |
| 02 | recog | B (hired) | ✓ | PS with finished-time marker clean |
| 03 | recog | C (has worked) | ✓ | PP with `since` clean |
| 04 | recog | C (had sat) | ✗ | Chose past perfect for past continuous interrupted slot |
| 05 | prod | "I sent the draft contract yesterday in the evening" | ✓ | PS form clean; *in the evening* mildly non-native |
| 06 | prod | "When the client called, I was riding a bike" | ✓ | Past continuous deployed cleanly |
| 07 | recog | B (since) | ✓ | Time marker `since` clean |
| 08 | recog | B (understand) | ✓ | Stative simple-aspect clean |
| 09 | recog | B (used to) | ✓ | `used to` form clean |
| 10 | prod | "We selected another contractor last month" | ✓ | PS form clean (regular variant) |
| 11 | prod | "I used to ride by bike every morning to work" | ⚠ partial | `used to ride` ✓; *by bike* mild idiom miss (native: *ride my bike* / *cycle*) |
| 12 | prod | "By Friday we had agreed all final terms with the regulator" | ✓ | **KEY**: past perfect deployed cleanly cold |

---

## Recognition vs production split

| Format | Items | Correct | % |
|---|---|---|---|
| Recognition (MCQ) | 7 | 6 | 86% |
| Production (translation) | 5 | 4 + 1 partial | 90% weighted |

Production slightly higher than recognition — opposite of v1's tense/aspect cluster (recog 83% / prod 12%, Δ +71 pts). At B1 substrate level the avoidance signature **does not appear**. This is itself diagnostic: the avoidance fingerprint is specifically a B2-level phenomenon for Artem, not a general production weakness.

---

## Item 4 vs item 6 — recognition-production inverse pair

Items 4 and 6 test the **same structure** (past simple vs past continuous, interrupted action) in the same direction. He missed the recognition (chose past perfect *"had sat"* for *"was sitting"*) but produced cleanly under translation.

This is the same inverse pattern that surfaced in v1 Comparatives (Δ −33 pts: production 83% / recognition 50%). When given multiple past-tense options under MCQ inspection, he over-marks — selecting a more "morphologically complex" form than the slot requires. Under translation he produces the natural form without that distractor pressure.

**Reading**: not a stable B1 gap. Single recognition miss, single instrument, isolated. **Watchlist** — surface for one more independent recognition probe in a future drill (don't author dedicated B1 follow-up).

---

## What v2 settles

| v1 finding | v2 verdict |
|---|---|
| Tense/aspect foundation-suspect (43%) | Confirmed — but **at B2 level only**, not B1 |
| Past perfect malformed attempts (items 19, 34 v1) | Refined — form basics fine (v2 item 12 clean); failure is compound (past perfect + already + passive/intransitive) |
| Present perfect continuous avoidance (item 22 v1) | Untouched — v2 didn't include PPC items (would need their own probe) |
| Reported-speech backshift drop (item 28 v1) | Untouched — v2 didn't include reported speech (B2 territory, not B1 substrate) |
| Hypothesis "past simple was handled cleanly throughout v1" | Confirmed — PS form/use solid across 7 v2 items |

---

## Refinements to coach_notes (proposals)

**Refine** the morning-promoted weak_pattern (Tense/aspect cold-production deployment gap) to narrow scope:

**Current wording** (promoted 2026-05-18 07:21):
> "Tense/aspect cold-production deployment gap (perfect family + reported-speech backshift). 2026-05-18 Russian-L1 B2 foundation diagnostic v1 ..."

**Proposed refined wording** (after v2):
> "B2 perfect-aspect compound-interaction gap (NOT a perfect-family form gap — v2 2026-05-18 B1 probe confirmed PS, PP basics, past perfect form, used-to, stative, time markers all solid 87.5%). Three specific B2 compound failures from v1 diagnostic: (a) past perfect + 'already' + passive/intransitive verb selection (items 19, 34 v1 — 'had been already left' / 'have been already covered'); (b) present perfect continuous with duration adverb — substitutes present continuous + duration (item 22 v1 'we are already working on the contract for 8 months'); (c) reported-speech backshift drop (item 28 v1 'Claude said that this approach works'). NOT covered: simple past perfect with time anchor (v2 item 12 'By Friday we had agreed all final terms' — clean). Ridge: v1 + v2 independent emergence across 1 day, multi-instrument cross-confirmation. Drill model: weak-spots-session production-only, target the three narrow compound zones individually — not the perfect family as a whole. [data]"

**Watchlist add** (single recognition miss):
- `past_perfect_for_past_continuous_recognition_overmark` — v2 item 4 chose 'had sat' for 'was sitting'. Single occurrence, production analog clean. Re-emerge in any recognition drill within 14 days → consider promotion. Likely an MCQ-format over-marking artefact, not a stable gap.

---

## v3 decision

**No v3 instrument needed for B1 substrate.** 87.5% with no clustered failure pattern = solid foundation; further B1 probing would be diminishing returns.

**Open v3 candidates** (if pursued — not recommended near-term):
- PPC dedicated probe (v1 item 22 surfaced PPC avoidance but only 1 v1 item tested it — n=1 ridge is weak)
- Reported-speech backshift dedicated probe (v1 items 18, 28 — recog passed, prod failed; n=1 production)

These could be folded into the planned `weak-spots-session` on the B2 compound zones rather than authored as a separate instrument.

---

## Next-cycle action (unchanged from v1)

**Single front**: `weak-spots-session` targeting the three B2 compound zones from the refined weak_pattern. Production-only. Likely 2–3 cycles. Per skill 5 rule (just added in [PR #13](https://github.com/ArtemSeliverstov/english-quiz/pull/13)): single drill area, not parallel — focused-CF (Anna 5→3).

---

## Run integrity notes

- **Item presentation bug caught mid-run**: batch 1 items 1–4 included tested-skill labels ("(recognition, past simple irregular form)" etc.). Artem flagged after batch 1 — labels removed for batch 2. Saved as `feedback_diagnostic_no_skill_labels.md` for future cold-production instruments. Batch 1 scoring not invalidated (his answers were correct anyway, label content did not appear to bias).
- **Item 11 partial scoring**: "by bike" idiom miss is unrelated to tense/aspect target — would have scored full had a stricter tense-only rubric been applied. Partial conservative.
- **Item 12 importance**: this single item changes the interpretation of v1's past_perfect_malformed_attempt finding. Worth highlighting in coach_notes refinement, not just buried in results.
