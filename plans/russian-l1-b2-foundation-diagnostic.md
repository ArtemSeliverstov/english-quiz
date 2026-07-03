# Russian L1 Foundation Diagnostic — B2

**Status**: administered + scored (v1 2026-05-18, v2 tense probes — see `tests/`); spec retained for future rounds
**Owner**: Artem (test-taker); Claude Code (authoring + scoring)
**Scope**: discovery diagnostic for hidden Russian-L1 B2 foundation gaps
**Motivated by**: 2026-05-17 article-family CC arc (5 rounds, 27/30) — exposed C1 sub-patterns plus the observation that targeted drilling on visible `coach_notes.weak_patterns` cannot find what avoidance hides. Discussion captured in coach_notes recent_observations end-of-day note.

---

## Purpose

Surface hidden Russian-L1 B2 foundation gaps that Artem may be silently routing around in daily output. Avoidance is the C1 fossilisation signature — patterns the speaker has learned to step around show up in recognition but not in production data, so they don't enter `coach_notes.weak_patterns`. Cold production under controlled stimulus exposes them.

**Distinct from a progress test.** A progress test built inside-out from `coach_notes.weak_patterns` can only re-confirm what is already tracked. This instrument is **outside-in**: items are sourced from comprehensive L1 contrastive linguistics catalogues, NOT from Artem's existing stats. The goal is finding what's not tracked.

**Why B2 first.** Artem self-identifies as B2 → C1. C1 refinements built on a leaky B2 base are fragile. Closing a foundational gap pays more than refining edge cases. C1 ceiling-finding is deferred — daily CC output and recent sessions already supply C1 signal.

---

## Methodology

**Source materials (catalogue, not stats)**:
- Swan & Smith *Learner English* — Russian chapter (canonical L1 inventory)
- EFCAMDAT / Cambridge Learner Corpus — B2-tagged errors by L1=ru
- Ionin (articles), Slabakova (aspect), Wechsler (argument structure) — phenomenon-level depth in specific zones
- `archive/article_diagnostic_2026-04-05.html` — receptive article items already authored; reuse the cadence pattern

**Design principle**: clean B2 diagnostic with **no pre-baked cascade**. Lower-level (B1) probes are deferred to v2 pending v1 findings. Interpretation assumptions don't get baked into design.

---

## Phenomenon clusters (~10–12 zones, B2-level)

1. **Articles** — B2 frequencies; lift items from `archive/article_diagnostic_2026-04-05.html` for receptive coverage; add new production items
2. **Prepositions** — high-frequency verb + preposition collocations (depend on, listen to, look at, wait for, arrive at, focus on, succeed in)
3. **Tense / aspect** — present perfect vs past simple (Russian aspect maps to neither cleanly); sequence of tenses in reported speech
4. **Conditionals** — zero / 1 / 2 / 3 + mixed (Russian has one conditional form; English has four+)
5. **Modals** — modal + perfect infinitive for past speculation (*must have / could have*); must / have to / should distinctions
6. **Verb complementation** — gerund vs infinitive after closed verb set (full B2 set: suggest, start, help, recommend, avoid, finish, keep, consider, deny, mind, enjoy, etc.)
7. **Word order** — negation placement, indirect questions (*"I don't know what is it"* calque), adverb placement, *do*-support
8. **Quantifiers** — much / many, few / little, some / any under negation and questions
9. **Subject–verb agreement** — collective nouns, mass nouns, indefinite pronouns (*everyone is*, *the team is/are*)
10. **Pronouns / anaphora** — Russian pro-drop residue, dummy *it* / *there*, *it was a [NP]* L1 carryover
11. **Preposition + gerund** — *focus on doing*, *succeed in doing*, *insist on doing* (the *focus to have* trap surfaced 2026-05-17)
12. **Comparatives** — *than* vs *that* (no homophone for *чем*), double-comparative redundancy, *as ... as* parallel structure

---

## Item budget + format mix

- **~60–80 items total**, ~5–8 per cluster
- **~50% recognition** — gap-fill, error correction, MCQ
- **~50% cold production** — RU → EN translation, constrained free-write prompts
- Cold production is the discovery surface; avoidance only surfaces under production stress

---

## Themes / context

Biz / cycling / expat real-life context per Artem's profile tags: `[biz_oil] | [leisure_sport] | [brit_expat] | [claude_collab]`. No abstract textbook sentences.

---

## Run protocol

- One sitting, ~60–90 min
- **No in-session feedback** — diagnostic, not drill; feedback contaminates the cold-production signal
- Single answer per item, no retries
- Score offline after the session ends
- Themes mixed across clusters, not blocked by cluster (don't telegraph what's being tested)
- Run all clusters even if early ones show solid pass (full coverage matters for diagnosis)

---

## Scoring & interpretation

**Per-item**: correct / partial / incorrect + `error_type` tagging matched to L1 trap catalogue.

**Per-cluster classification**:
- ✅ **solid** — ≥85% correct
- ⚠ **gap** — 50–85% correct
- 🔴 **foundation-suspect** — <50% correct (candidate for B1 probe in v2)

**Production-vs-recognition delta** per cluster — the avoidance signature is a recognition-passes / production-fails split. Worth flagging separately even within a "solid" cluster.

**Output deliverable**:
- Per-cluster status table with item-level breakdown
- Production-vs-recognition delta per cluster
- Ranked gap list with severity score (frequency × C1-blocking potential)
- Specific L1 trap IDs surfaced (linkable to `weak_patterns` extension)
- Recommended next-cycle slot priorities

---

## Authoring workflow

1. **Spec sign-off** ← here
2. **Source pass**: cite specific catalogue entries per cluster (Swan/Smith page refs, EFCAMDAT error IDs, Ionin/Slabakova specific phenomena)
3. **Item authoring**: 60–80 items in JSON, file location `tests/russian_l1_b2_diagnostic_v1.json` (new directory; this is a one-shot instrument, not a library reusable item)
4. **Item review**: Artem linguistic review before run (catches authoring artefacts; same review pattern he applies to quiz content)
5. **Run session**: single 60–90 min sitting
6. **Score + interpret**: offline analysis, joint discussion with Artem
7. **v2 decision**: whether to author B1 fallback probes for foundation-suspect clusters

---

## Open decisions (deferred from spec)

- **B1 probe authoring** — defer until v1 findings show whether any clusters classify foundation-suspect. If zero foundation-suspect clusters, v2 not needed. B1 catalogue exists in `references/family-profiles.md` (Anna's profile + L1 traps) for reuse.
- **Retest cadence** — defer; revisit after v1 results determine how much closure work is needed.
- **Cross-validation with daily output** — defer; compare diagnostic findings against last 90 days of CC session signals to see what's surfaced live vs surfaced only under diagnostic stress.
- **C1 ceiling instrument** — explicitly out of scope for v1. Daily CC output supplies C1 signal organically.

---

## Acceptance

- ~60–80 items authored across 10–12 clusters
- Artem-reviewed before run
- One-sitting run completed
- Per-cluster scored output produced
- v2 decision made based on data, not design assumption
