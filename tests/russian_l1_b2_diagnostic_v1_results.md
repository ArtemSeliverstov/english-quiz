# Russian L1 B2 Foundation Diagnostic v1 — Results

**Test taker**: Artem
**Session**: 2026-05-18 (single sitting, ~75 min, batched 6 items per turn, no in-session feedback)
**Test**: 75 items across 12 phenomenon clusters · 37 recognition / 38 production
**Spec**: `plans/russian-l1-b2-foundation-diagnostic.md`
**Sources**: `plans/russian-l1-b2-foundation-diagnostic-sources.md`
**Raw responses**: `tests/russian_l1_b2_diagnostic_v1_responses.json`

---

## Headline

**Overall score**: 49 correct + 13 partial + 12 incorrect + 1 avoidance = **74% weighted** (c + 0.5·p / 75).

**One foundation-suspect cluster confirmed** (tense/aspect, 43%). **Conditionals** sit on the foundation-suspect borderline (50% — gap class but the failure pattern is structural, not noise). The motivating trap from 2026-05-17 (*focus to do* in the prep+gerund cluster) turned out to be **a one-off, not a stable gap** — that cluster scored a clean 100%.

---

## Per-cluster classification

| Cluster | Items | Recog (c/p/i) | Prod (c/p/i/a) | Weighted | Band |
|---|---|---|---|---|---|
| Prep+gerund | 6 | 3 / 0 / 0 | 3 / 0 / 0 / 0 | **100%** | ✅ solid |
| Modals | 5 | 2 / 0 / 0 | 3 / 0 / 0 / 0 | **100%** | ✅ solid |
| Pronouns | 5 | 3 / 0 / 0 | 1 / 1 / 0 / 0 | **90%** | ✅ solid |
| Quantifiers | 6 | 3 / 0 / 0 | 1 / 2 / 0 / 0 | 83% | ⚠ gap |
| Verb complementation | 8 | 3 / 0 / 1 | 3 / 1 / 0 / 0 | 81% | ⚠ gap |
| Prepositions | 8 | 3 / 0 / 1 | 3 / 0 / 1 / 0 | 75% | ⚠ gap |
| Word order | 6 | 2 / 0 / 1 | 2 / 1 / 0 / 0 | 75% | ⚠ gap |
| Comparatives | 5 | 1 / 0 / 1 | 2 / 1 / 0 / 0 | 70% | ⚠ gap |
| Articles | 8 | 3 / 0 / 1 | 1 / 3 / 0 / 0 | 69% | ⚠ gap |
| Agreement | 5 | 2 / 0 / 1 | 1 / 0 / 0 / 1 | 60% | ⚠ gap |
| Conditionals | 6 | 1 / 1 / 1 | 1 / 1 / 1 / 0 | **50%** | ⚠ gap (borderline foundation-suspect) |
| **Tense / aspect** | **7** | **2 / 1 / 0** | **0 / 1 / 3 / 0** | **43%** | 🔴 **foundation-suspect** |

**Band thresholds** (per spec): ✅ solid ≥ 85%; ⚠ gap 50–85%; 🔴 foundation-suspect < 50%. Weighted score = (correct + 0.5 × partial) / items.

---

## Production-vs-recognition delta (avoidance signature)

The avoidance signature is a recognition-passes / production-fails split — patterns the learner can identify in MCQ but can't deploy under cold production.

| Cluster | Recognition % | Production % | Δ (recog − prod) | Reading |
|---|---|---|---|---|
| **Tense / aspect** | 83% | 12% | **+71 pts** | 🔴 strong avoidance — recognises the perfect/backshift patterns but cannot produce them cold |
| Quantifiers | 100% | 67% | +33 pts | recognises count/mass; under production *too much people* surfaces |
| Pronouns | 100% | 75% | +25 pts | knows expletives in recog; under production *today's morning* + present-for-past slip |
| Agreement | 67% | 75% (with 1 avoidance) | −8 pts | mixed — recog miss on *everyone are*; production substituted *best practices* for *advice* (avoidance counted neutral) |
| **Comparatives** | 50% | 83% | **−33 pts** | inverse pattern — produces comparatives well but can't distinguish *as…as* from *so…as* under MCQ inspection |
| Verb complementation | 75% | 88% | −13 pts | inverse — misses *recommend to wait* recog correction but produces well |

**Reading**: tense/aspect is the only cluster with the classic C1-fossilisation avoidance fingerprint (high recog, very low prod). Quantifiers and pronouns show milder versions. Comparatives and verb complementation show the *opposite* — under attention he produces well, under MCQ inspection he can miss distinctions (specifically: *almost so X as* vs *almost as X as*, *recommend to wait* embedded in a long stem).

---

## Specific L1 traps that surfaced

Catalogue update candidates for `coach_notes.weak_patterns` extension:

| Trap ID | Status | Evidence |
|---|---|---|
| `arrive_to_calque` | 🔴 **stable gap, 3 surfaces** | items 20 (error_correction, missed), 47 (free-write "arrive to the office"), 71 (production "arrived to Bahrain"). Repeats across format and context |
| `mass_noun_indef_article_hypercorrection` | ⚠ **new pattern** | "a maintenance" (item 20), "a training load" (item 37), "a joint work" (item 73). Hypercorrection — over-applies indef article to uncountable nouns |
| `would_in_if_clause` | ⚠ recog only | item 11 (mcq) chose *would have ... would have*; item 26 caught the *would* but used bare verb instead of past simple |
| `type_2_3_collapse` | ⚠ stable | items 25, 27, 28 — Russian single-бы form collapses all hypothetical/counterfactual structures, especially mixed |
| `reported_no_backshift` | ⚠ stable | item 28 (*Claude said that this approach works*), item 18 recog passed but item 28 production failed — classic avoidance pattern |
| `present_perfect_continuous_avoidance` | ⚠ stable | item 22 (*we are already working on the contract for 8 months*) — uses present continuous + duration adverb (Russian pattern) instead of present perfect continuous |
| `past_perfect_malformed_attempt` | ⚠ structural | items 19 and 34 — recognised past perfect was needed but produced *had been already left* / *have been already covered* (mixes passive form with active intransitive) |
| `everyone_plural_agreement` | ⚠ recog miss | item 57 — under MCQ chose *everyone are* over *everyone is* (the canonical L1-ru trap) |
| `today_s_morning_calque` | ⚠ new pattern | item 66 — Russian *сегодняшнее утро* calques as *today's morning* (should be *this morning*) |
| `advice_avoidance_substitute` | ⚠ avoidance | item 65 — substituted *best practices* for the *advice* target, sidestepping the uncountable test entirely |
| `as_as_vs_so_as_distinction` | ⚠ recog only | item 71 — could not distinguish *almost so X as* (archaic/L1-calque) from *almost as X as* (modern) on first read; caught on second look |
| `to_the_moment_calque` | ⚠ new | item 34 — *to the moment, when I start* calques *к тому моменту* directly (should be *by the time I got to the start*) |
| `ionin_fh_def_nonspec_underuse_the` | ⚠ recog miss | item 13 — picked *a manager on duty* where target was *the manager on duty* (Ionin Fluctuation Hypothesis [+def −spec] cell — knows-the-rule cell missed) |

---

## Strongest signals

**Tense/aspect is the clearest foundation gap.** Across 7 items: 2 correct recognition, then 3 production failures + 1 partial + 1 partial-passive-blend. The cluster spans present perfect (continuous + simple), past perfect, and reported-speech backshift — and production failed on all three sub-patterns. Recognition was solid (the rules are known); production was structurally unable to deploy them cold.

**Conditionals failure is structural, not noisy.** Type 2 (item 24) and zero/type 1 (item 29) work. Everything more complex — counterfactual past (item 25), mixed conditional (items 27, 28) — collapses. Pattern matches the predicted Russian-single-conditional fingerprint: бы maps uniformly across English's four+ patterns.

**Prep+gerund and modals are clean foundations.** Both 100%. The *focus to do* trap from 2026-05-17 is **not a stable gap** — `focus on / interested in / look forward to / instead of / insist on / without` all deployed correctly. Worth removing from `weak_patterns` if present; it was a one-off processing slip.

**Articles is a high-volume mixed cluster.** Generic mass/abstract and definite post-modifier both handled well; Ionin-FH [+def −spec] missed; production showed mass-noun hypercorrection (article on uncountables — *a maintenance*, *a training load*, *a joint work*). Borderline gap, worth targeted attention on the FH cell + the mass-noun hypercorrection.

---

## Recommended next-cycle priorities

Ranked by severity × C1-blocking potential:

1. **🔴 Tense/aspect — present perfect family + past perfect + reported-speech backshift.** Single deep-dive on the perfect system. Production-only drill, no recognition reinforcement (recognition is already 83% — the gap is in deployment). Likely a 2–3 cycle topic; matches `weak-spots-session` skill.

2. **⚠ Conditionals — type 2/3/mixed distinction.** Targeted cycle on hypothetical vs counterfactual. The Russian-single-conditional collapse is the diagnostic — drilling type 2 and type 3 side-by-side with explicit time anchors should surface and break the calque.

3. **⚠ `arrive at / in`** — single-item-level drill, surfaced 3 times. Should be one short-cycle fix.

4. **⚠ Mass-noun + indefinite article hypercorrection.** "A maintenance / a training load / a joint work" pattern is new and worth a brief audit pass — likely sits in the article cluster as a sub-pattern.

5. **⚠ Reported-speech backshift drill** (overlaps with #1 but worth its own focus given the *Claude said that this approach works* surface).

6. **⚠ Indirect-question word order** — items 6 and 43 both failed; *I'd like to understand what is X* calque. Specific drill candidate.

7. **⚠ *Everyone are* under recognition** — surprising failure for B2; suggests Russian plural intuition leaks into recognition under load. Worth a single-item check in next exercise session.

---

## v2 decision (per spec §Acceptance)

**B1 fallback probes**: one cluster classifies foundation-suspect (tense/aspect) and one borderline (conditionals). **v2 is justified for these two clusters only**, not full-bank. Recommended scope:

- **Tense/aspect B1 probes** — confirm whether the failure is at B2-level (perfect aspect itself) or at B1-level (past simple vs past continuous, time markers, simple aspect choices). Hypothesis: it's at B2 — past simple was handled cleanly throughout the test — but B1 probes would settle it.
- **Conditional B1 probes** — confirm zero / type 1 stability under sustained production. Recognition + production of zero conditional was clean here (item 29), so B1 probes may not be needed. Defer pending tense-aspect findings.

**No v2 for the 10 non-foundation-suspect clusters.** They are all ⚠ gap or ✅ solid — remediable at B2 level via targeted drill, no B1 backstop needed.

---

## Run integrity notes

- **Authoring bug caught and fixed mid-run** (commit `3044fc4`): correct answer was at position A in 25/26 gap-mcq items as initially authored. Fix applied before batch 2; items 1–5 had been answered on content-correct basis (all five answers were the right option string), recorded as correct without re-administration.
- **Cross-batch contamination**: minimal — items mixed round-robin across clusters. Two patterns surfaced *between* batches (the *arrive to* trap recurring three times across items 20, 47, 71) suggesting stable L1 patterns rather than within-batch priming.
- **Avoidance counted neutrally** for cluster scoring; flagged separately in the trap catalogue (item 65 *advice* → *best practices*).
- **Item 46 (cmp_001) first-pass-incorrect / second-look-correct** logged with the first-pass score (diagnostic measure is realistic-output, not competence-under-attention).

---

## Test-plan checkbox status (PR #12)

- [x] Artem reviews spec
- [x] Sign-off (or revisions)
- [x] Source pass completed and committed before authoring items
- [x] ~60-80 items authored in `tests/russian_l1_b2_diagnostic_v1.json`
- [ ] Artem linguistic review of authored items — *skipped per Artem's "start the run now" decision; one authoring bug caught mid-run (option-position artefact) and fixed; one stem ambiguity flagged in-session (cmp_001 C/D distinction was subtle to Artem on first read)*
- [x] One-sitting run completed
- [x] Per-cluster scored output produced + interpretation discussion (this doc)
- [x] v2 decision made based on data (B1 probes recommended for tense/aspect only; conditionals deferred)
