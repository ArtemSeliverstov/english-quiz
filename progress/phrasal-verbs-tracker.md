# Phrasal Verbs Tracker — Artem

Canonical PV inventory A1→C1 with quiz coverage, current accuracy, and frequency in your context. Refreshed at each stats-review.

**Baseline source**: `archive/phrasal_verbs_mastery_plan.html` (stats export 2026-04-04)
**Last refresh**: 2026-05-03
**Next refresh trigger**: any `stats-review` skill run that uploads fresh `family_stats_ai` JSON.

---

## Targets

| Metric | Baseline (Apr) | Phase 1 | Phase 4 |
|---|---|---|---|
| PV input accuracy | 50% | 65% | 75%+ |
| PV overall accuracy | 69% | 75% | 80%+ |
| B2/C1 unique PVs in quiz | 90 / 153 (41%) | +7 scaffolds | ~140 (~90%) |
| Chronic failures (≥50% error) | 11 | ≤5 | 0 |

---

## Status legend

- 🔴 **chronic** — ≥50% error rate in quiz/exercises
- 🟠 **struggling** — 50–70% accuracy
- 🟡 **weak** — 70–85% accuracy
- 🟢 **solid** — 85%+ accuracy
- 🏆 **owned** — graduated via cold-production streak (see rule below)
- ⚪ **untested** — in quiz, fewer than 3 production attempts
- ✗ **gap** — not in quiz
- 📅 **planned** — slated for Batch 1/2 or meaning expansion
- ⚠ **A2 production-weak** — failed in cold production test, even though A2-level. Don't use as confident distractor until drill passes.

## Frequency legend (in your context — finance/strategy exec, business + cycling + Bahrain life)

- ★★★★★ — daily; nearly every meeting or email
- ★★★★ — weekly; common in business writing/speech
- ★★★ — monthly; situational
- ★★ — rare; specialized
- ★ — almost never; literary/dialect niche

Frequency uses CEFR level as the base proxy, then adjusts for business-exec context: casual A2 PVs (*sit down*, *stand up*) drop to ★★★; business-essential B2 PVs (*sort out*, *follow up*) climb to ★★★★★; strategic C1 (*shore up*, *hammer out*) sits at ★★★★; literary C1 (*gloss over*) at ★★★.

---

## Cold-production rule (🏆 graduation)

🏆 is awarded only when cold production is repeatedly correct across at least two distinct exposure formats. Distinct from 🟢, which can mask the recognition-production gap (high MCQ + gap + particle_sort scores can drag a PV to 🟢 even while cold input is shaky).

### What counts as "cold production"

| Tier | Source | Counts? |
|---|---|---|
| 1 | Spontaneous use in free-write (your own sentence, no prompt naming the PV) | ✓ strongest |
| 2 | `russian_trap` drill correct | ✓ |
| 3 | `translation` drill correct (no `prompt_en_hint` populated) | ✓ |
| 4 | Quiz `input` type correct (hint must not name the PV) | ✓ |
| — | `gap` / `mcq` / `particle_sort` / any item showing the PV in hint | ✗ recognition, not production |

### Streak rule

🏆 requires **3 cold wins across ≥2 distinct formats, no failures during the streak**. Three input attempts on the same prompt do not qualify — the "≥2 formats" clause prevents single-prompt memorization.

### Decay rule

🏆 sticks until a cold-production failure. One failure → drops to 🟢. Two failures within 30 days → drops to 🟡. No time-based decay (B2 lexis doesn't fade from disuse the way kids' vocabulary does).

### Insufficient drill coverage

If a PV has fewer than 3 cold-production items in the bank (across input quiz + translation + russian_trap + free-write opportunity), it is structurally un-rankable for 🏆 → flag in Notes as "📦 needs more cold-production items" and author them before chasing graduation.

### Inline streak tracking (Notes column)

- `Cold streak: 2/3 [tr_artem_b02, fw 2026-05-03]` — partial
- `🏆 since 2026-06-15 [3 wins: tr_b02, rt_b01, fw]` — graduated
- `📦 needs more cold-production items (only 1 in bank)` — un-rankable until authored

---

## Focus order — what to drill first

When time is limited, work from the top of the master table looking for these patterns:

1. **🔴 + ★★★★★** — chronic failures on PVs you use every day. Highest leverage.
2. **🔴 + ★★★★** — chronic failures on weekly PVs.
3. **📅 + ★★★★★** — essential PVs not yet in quiz.
4. **🟠 + ★★★★★** — struggling daily PVs. Already partially scaffolded; nudge to 🟢.
5. **C1 + ★★★★** that aren't 🟢 — strategic C1 (*shore up*, *hammer out*, *water down*). Consolidate before expanding.
6. **🟢 + ★★★★★** — chase 🏆 by surfacing in 2+ cold-production formats over 4–6 weeks. Don't drill aggressively; let natural rotation + free-write opportunities carry it.

Do **not** drill ★★ or ★ items unless they specifically came up in real conversation.

---

## All PVs by frequency

Sort: Freq DESC, then alphabetical by PV. Multi-meaning PVs appear once per meaning. **Scan top-down for 🔴 / 📅 / 🟠 next to ★★★★★ — those are the lagging high-priority items.**

| PV | Meaning | Lvl | Freq | Quiz | Status | Notes |
|---|---|---|---|---|---|---|
| break down ² | negotiations fail | B1 | ★★★★★ | ✗ | 📅 | Phase 3 — "talks broke down" |
| bring up ² | mention a topic | B2 | ★★★★★ | ✓ | 🟡 | meeting-essential |
| come back | return | A2 | ★★★★★ | ✗ | ⚠ | **A2 production-weak (2026-05-03 test)** — direction trap with *go back*. Drill: tr_artem_b03. Use as distractor only after re-test passes. |
| come from | originate | A2 | ★★★★★ | ✗ | — | A2 distractor |
| come up | arise / be mentioned | B2 | ★★★★★ | ✗ | 📅 | Batch 2 — "this came up" |
| come up with | propose / produce idea | B2 | ★★★★★ | ✓ | 🔴 | Phase 1 gap-scaffold |
| cut off | disconnect / isolate | B2 | ★★★★★ | ✗ | 📅 | Batch 2 — "cut off funding" |
| end up | finally be in a state/place | B2 | ★★★★★ | ✗ | 📅 | Batch 1 |
| fall behind | fail to keep up | B2 | ★★★★★ | ✗ | 📅 | Batch 2 |
| fall through | fail to happen | B2 | ★★★★★ | ✗ | 📅 | Batch 2 — "deals fall through" |
| figure out | understand / solve | B2 | ★★★★★ | ✗ | 📅 | Batch 1 |
| fill in ² | inform someone | B2 | ★★★★★ | ✗ | 📅 | Phase 3 — "fill me in" |
| find out | discover | B1 | ★★★★★ | ✗ | 📅 | Batch 1 — A2-level but never tested |
| follow up (on) | revisit / pursue | B2 | ★★★★★ | ✓ | 🟠 | obligatory *on* — keeps dropping it |
| get across | communicate an idea | B2 | ★★★★★ | ✓ | 🔴 | 2/6 — board comms essential |
| get back | return | A2 | ★★★★★ | ✓ | 🟡 | |
| get out of | avoid / escape obligation | B2 | ★★★★★ | ✓ | 🔴 | 0/3 — meeting-essential |
| get round to | finally do | B2 | ★★★★★ | ✗ | — | candidate — you use the calque "never got around to" |
| get through ³ | finish a task | B2 | ★★★★★ | ✗ | 📅 | Phase 3 — "get through these emails" |
| get up | rise from bed | A1 | ★★★★★ | ✓ | 🟢 | foundational |
| give up | stop trying | B1 | ★★★★★ | ✓ | ⚪ | only MCQ — no production test (Batch 1) |
| go through | experience / examine | B2 | ★★★★★ | ✗ | 📅 | Batch 1 |
| hold up | delay / rob / remain strong | B2 | ★★★★★ | ✗ | 📅 | Batch 2 — 3 meanings |
| let down | disappoint | B2 | ★★★★★ | ✗ | 📅 | Batch 2 |
| make up ² | constitute | B2 | ★★★★★ | ✗ | 📅 | Phase 3 — "make up 60% of revenue" |
| pay off | repay / be worthwhile | B2 | ★★★★★ | ✗ | 📅 | Batch 2 — business-critical |
| point out | draw attention to | B2 | ★★★★★ | ✗ | 📅 | Batch 1 |
| put off ¹ | postpone | B2 | ★★★★★ | ✓ | 🟢 | |
| run into ² | encounter problems | B2 | ★★★★★ | ✗ | 📅 | Phase 3 — "ran into delays" |
| set up ¹ | establish | B2 | ★★★★★ | ✓ | 🟡 | "set up a JV" |
| set up ² | arrange / prepare | B2 | ★★★★★ | ✗ | 📅 | Phase 3 — "set up a meeting" |
| sign up | register / enrol | B2 | ★★★★★ | ✗ | 📅 | Batch 2 |
| sort out | organise / resolve | B2 | ★★★★★ | ✗ | 📅 | Batch 1 — *убрать* calque target |
| take off ³ | become successful | B2 | ★★★★★ | ✗ | 📅 | Phase 3 — "product took off" |
| take on ² | accept a challenge | B2 | ★★★★★ | ✗ | 📅 | Phase 3 — "take on the project" |
| take over | assume control | B2 | ★★★★★ | ✗ | 📅 | Batch 1 — M&A, ops |
| take up ² | occupy time | B2 | ★★★★★ | ✗ | 📅 | Phase 3 — "merger taking up all my time" |
| turn down | reject | B2 | ★★★★★ | ✓ | 🔴 | "turn down an offer" |
| turn into | become / transform | B2 | ★★★★★ | ✗ | 📅 | Batch 1 — strategy lexicon |
| turn off ¹ | switch off | A2 | ★★★★★ | ✓ | ⚪ | Batch 1 |
| turn on | activate | A2 | ★★★★★ | ✓ | 🟢 | |
| turn out ¹ | prove to be | B2 | ★★★★★ | ✓ | 🔴 | 0/4 — every analysis |
| work out | calculate / exercise / succeed | B2 | ★★★★★ | ✗ | 📅 | Batch 1 — 3 meanings |
| break out | start suddenly / escape | B2 | ★★★★ | ✗ | 📅 | Batch 2 |
| break up | end relationship / disintegrate | B2 | ★★★★ | ✗ | 📅 | Batch 2 |
| bring about | cause | B2 | ★★★★ | ✓ | 🔴 | Phase 1 gap-scaffold |
| bring forward | move earlier | B2 | ★★★★ | ✓ | 🟠 | meeting register |
| bring in | introduce / earn | B2 | ★★★★ | ✗ | — | candidate — "bring in revenue" |
| build up | increase gradually | B2 | ★★★★ | ✗ | 📅 | Batch 1 |
| call off | cancel | B1 | ★★★★ | ✓ | 🟠 | only particle gap (Batch 1) |
| check out | examine / leave hotel | B2 | ★★★★ | ✗ | 📅 | Batch 1 |
| come across ¹ | seem / appear | B2 | ★★★★ | ✓ | 🟡 | |
| come across ² | find by chance | B2 | ★★★★ | ✗ | 📅 | Phase 3 |
| come in | enter | A2 | ★★★★ | ✗ | — | A2 distractor |
| come on | encouragement / progress | A2 | ★★★★ | ✗ | — | A2 distractor |
| cut down on | reduce | B2 | ★★★★ | ✓ | 🔴 | Phase 1 gap-scaffold |
| drill down into | analyse in depth | B2 | ★★★★ | ✓ | 🔴 | Phase 1 gap-scaffold — analysis lexicon |
| drum up | generate (interest, support) | C1 | ★★★★ | ✓ | — | "drum up support" |
| fill in ¹ | complete a form | B2 | ★★★★ | ✓ | 🟡 | |
| get along (with) | have good relations | B2 | ★★★★ | ✗ | — | candidate addition |
| get away with | escape punishment | B2 | ★★★★ | ✗ | 📅 | Batch 1 |
| get by | manage / survive | B2 | ★★★★ | ✗ | — | candidate addition |
| get in | enter (vehicle/place) | A2 | ★★★★ | ✗ | — | add as distractor in *get* gaps |
| get into ¹ | be accepted / enter | B2 | ★★★★ | ✓ | ⚪ | |
| get into ² | become interested in | B2 | ★★★★ | ✗ | 📅 | Phase 3 — "got into cycling" |
| get off | exit transport | A2 | ★★★★ | ✓ | 🔴 | 0/4 — confused with *get out of* |
| get on | board transport | A2 | ★★★★ | ✓ | 🟡 | |
| get over | recover from | B2 | ★★★★ | ✓ | 🔴 | 1/2 |
| get through ¹ | survive difficulty | B2 | ★★★★ | ✓ | 🔴 | 0/3 |
| give back | return (an object) | A2 | ★★★★ | ✓ | — | |
| go away | leave | A2 | ★★★★ | ✗ | — | A2 distractor |
| go back | return | A2 | ★★★★ | ✗ | ⚠ | **A2 production-weak (2026-05-03 test)** — direction trap with *come back*. Drill: tr_artem_b03. |
| go off | explode / alarm sounds / deteriorate | B2 | ★★★★ | ✗ | 📅 | Batch 2 — 3 meanings |
| go on ¹ | continue | A2 | ★★★★ | ✗ | ⚠ | **A2 production-weak (2026-05-03 test)** — substituted with non-PV "happening". Drill: tr_artem_b01. |
| go on ² | happen | B2 | ★★★★ | ✗ | 📅 | Batch 2 |
| go out | leave the house | A2 | ★★★★ | ✗ | — | A2 distractor |
| grow up | mature | A2 | ★★★★ | ✗ | — | A2 distractor |
| hammer out | negotiate to agreement | C1 | ★★★★ | ✓ | — | "hammer out a deal" |
| iron out | resolve (small issues) | C1 | ★★★★ | ✓ | — | "iron out the wrinkles" |
| keep up with | maintain pace | B2 | ★★★★ | ✗ | 📅 | Batch 1 |
| look at | examine | A2 | ★★★★ | ✗ | — | A2 distractor |
| look for | seek | A2 | ★★★★ | ✗ | ⚠ | **A2 production-weak (2026-05-03 test)** — confused with *look after* (caregiving). Drills: tr_artem_b02 + rt_artem_b01/b02. |
| look like | resemble | A2 | ★★★★ | ✗ | — | A2 distractor |
| pick up ¹ | collect someone | B1 | ★★★★ | ✓ | 🟢 | |
| pick up ² | learn informally | B1 | ★★★★ | ✗ | 📅 | Phase 3 — "picked up Arabic" |
| pick up ³ | improve | B1 | ★★★★ | ✗ | — | candidate — "sales picked up" |
| put on | wear / apply | A2 | ★★★★ | ✗ | — | A2 distractor |
| put up with | tolerate | B2 | ★★★★ | ✗ | 📅 | Batch 1 |
| rule out | eliminate possibility | B2 | ★★★★ | ✗ | 📅 | Batch 1 |
| set aside | reserve | B2 | ★★★★ | ✗ | — | candidate — "set aside funds" |
| set off | begin a journey | B2 | ★★★★ | ✗ | 📅 | Batch 2 — flagged |
| set out | depart / present formally | B2 | ★★★★ | ✓ | 🟠 | "set out the opportunity for" — wrong dep prep |
| shore up | strengthen / reinforce | C1 | ★★★★ | ✓ | — | "shore up the balance sheet" |
| show up | arrive / appear | B2 | ★★★★ | ✗ | 📅 | Batch 1 |
| sign off | approve / end | B2 | ★★★★ | ✗ | 📅 | Batch 2 |
| step down | resign from position | B2 | ★★★★ | ✗ | 📅 | Batch 1 — business-critical |
| take off ¹ | plane departs | B1 | ★★★★ | ✓ | 🟢 | |
| take on ¹ | hire | B2 | ★★★★ | ✓ | 🟡 | |
| take up ¹ | start a hobby | B2 | ★★★★ | ✓ | 🟡 | |
| turn up | arrive / appear | B2 | ★★★★ | ✓ | 🔴 | 2/4 |
| wake up | stop sleeping | A2 | ★★★★ | ✓ | — | |
| water down | weaken | C1 | ★★★★ | ✓ | — | "watered-down version" |
| weed out | eliminate the unwanted | C1 | ★★★★ | ✓ | — | "weed out underperformers" |
| wind down | relax / gradually end | B2 | ★★★★ | ✗ | 📅 | Batch 2 — *расслабиться* calque trap |
| write down | record on paper | A2 | ★★★★ | ✗ | — | A2 distractor |
| break down ¹ | machine stops | B1 | ★★★ | ✓ | 🟢 | |
| break down ³ | cry / lose control | B1 | ★★★ | ✗ | — | candidate |
| bring out | release / reveal | B2 | ★★★ | ✗ | — | candidate |
| bring up ¹ | raise (a child) | B2 | ★★★ | ✓ | 🟡 | |
| brush aside | dismiss | C1 | ★★★ | ✓ | — | dismissive lexicon |
| come about | happen | B2 | ★★★ | ✗ | — | candidate |
| come round ¹ | change opinion | B2 | ★★★ | ✗ | 📅 | Batch 2 |
| cut through | find quick route / bypass | B2 | ★★★ | ✗ | 📅 | Batch 2 — flagged |
| get through ² | contact by phone | B2 | ★★★ | ✓ | 🔴 | 1/2 |
| give out ¹ | distribute | B2 | ★★★ | ✓ | 🟡 | |
| give out ² | stop working | B2 | ★★★ | ✗ | 📅 | Phase 3 — "legs gave out" |
| gloss over | downplay | C1 | ★★★ | ✓ | — | analyst-speak |
| hurry up | move faster | A2 | ★★★ | ✗ | — | A2 distractor |
| lie down | recline | A2 | ★★★ | ✗ | — | A2 distractor |
| log in / log on | authenticate | A2 | ★★★ | ✗ | — | tech distractor |
| look out for | watch for / protect | B2 | ★★★ | ✗ | 📅 | Batch 2 — flagged |
| make up ¹ | fabricate | B2 | ★★★ | ✓ | 🟡 | |
| paper over | conceal a flaw | C1 | ★★★ | ✓ | — | "paper over the cracks" |
| press on | continue despite difficulty | B2 | ★★★ | ✗ | 📅 | Batch 2 — flagged |
| pull over | stop vehicle at roadside | B2 | ★★★ | ✗ | 📅 | Batch 2 — flagged |
| put down | place on a surface | A2 | ★★★ | ✗ | — | A2 distractor |
| put off ² | discourage | B2 | ★★★ | ✗ | 📅 | Phase 3 |
| run away | flee | A2 | ★★★ | ✗ | — | A2 distractor |
| run into ¹ | meet by chance | B2 | ★★★ | ✓ | 🟡 | |
| sit down | take a seat | A1 | ★★★ | ✗ | — | passive only — too basic to add |
| stand up | rise to feet | A1 | ★★★ | ✗ | — | passive only — too basic to add |
| switch off / switch on | toggle | A2 | ★★★ | ✗ | — | A2 distractor |
| take back | retract | B2 | ★★★ | ✗ | — | candidate |
| take in | absorb / deceive | B2 | ★★★ | ✓ | 🟠 | flagged PV |
| take off ² | remove clothing | A2 | ★★★ | ✓ | 🟢 | |
| take out | remove / extract | A2 | ★★★ | ✗ | — | A2 distractor |
| try on | test-fit clothing | A2 | ★★★ | ✗ | — | A2 distractor |
| turn off ² | repel / disgust | B2 | ★★★ | ✗ | 📅 | Batch 1 |
| turn out ² | attend an event | B2 | ★★★ | ✗ | 📅 | Phase 3 — "200 turned out" |
| turn out ³ | produce | B2 | ★★★ | ✗ | — | candidate |
| turn round | reverse direction | A2 | ★★★ | ✗ | — | candidate |
| wear out | exhaust / deteriorate | B2 | ★★★ | ✗ | 📅 | Batch 2 — flagged |
| come round ² | visit | B2 | ★★ | ✗ | 📅 | Batch 2 — UK-leaning |
| knuckle down | apply oneself | C1 | ★★ | ✓ | — | British, casual |
| make up ³ | reconcile | B2 | ★★ | ✗ | — | candidate |
| set up ³ | frame someone | C1 | ★★ | ✗ | — | candidate |
| take after | resemble | B2 | ★★ | ✗ | — | candidate |
| take off ⁴ | leave quickly | C1 | ★★ | ✗ | — | candidate |
| come round ³ | regain consciousness | B2 | ★ | ✗ | 📅 | Batch 2 — niche |

**Counts**: 43 ★★★★★ · 61 ★★★★ · 37 ★★★ · 6 ★★ · 1 ★ · **148 PV-meanings total**

---

## Russian-calque traps (anti-patterns)

These four show up repeatedly in your exercise logs. Watch for them in free-write.

| Russian | Calque to avoid | Correct PV | Freq |
|---|---|---|---|
| расслабиться | relax myself | wind down | ★★★★ |
| объехать | drive around | get around / bypass / cut through | ★★★★ |
| зашло в тупик | dead ended | broke down / stalled | ★★★★★ |
| убрать | put behind | sort out / deal with | ★★★★★ |
| делать фото | make photos | take photos | ★★★★ |

---

## Particle Meaning Map (mental scaffold, not rules)

When you blank on a particle, this gives a starting point.

| Particle | Core meaning | Examples |
|---|---|---|
| UP | completion · increase · appearance · creation | set up, turn up, build up, take up |
| DOWN | decrease · rejection · cessation · recording | turn down, cut down, break down, write down |
| OUT | discovery · exhaustion · distribution · disappearance | find out, work out, give out, run out |
| OFF | separation · departure · disconnection · cancellation | take off, call off, set off, pay off |
| ON | continuation · attachment · activation | carry on, take on, go on, turn on |
| OVER | transfer · repetition · covering · recovery | take over, get over, go over, paper over |
| THROUGH | completion · endurance · penetration | get through, go through, break through, fall through |
| INTO | collision · transformation · involvement | run into, turn into, get into, look into |
| ABOUT | causation · movement · concerning | bring about, come about, go about |
| BACK | return · reversal · support | get back, hold back, back up, pay back |
| AWAY | removal · distance · disappearance | give away, go away, take away |
| FORWARD | advancement · progression | bring forward, put forward, look forward to |

---

## Refresh protocol

On each `stats-review` run that includes a fresh `family_stats_ai` upload for Artem:

1. Pull per-PV accuracy from quiz attempts (filter on `cat: 'Phrasal Verbs'` + tag-based PV identification)
2. Update **Status** column above. Run `node tools/pv_cold_streak.js artem` to compute current streaks across all PVs; use its output to update the **Cold streak** annotation in Notes and promote 🟢 → 🏆 for items meeting the streak rule.
3. Bump **Last refresh** date
4. Move PVs that crossed thresholds (e.g., 🔴 → 🟠) and note in `version-log.md`
5. If a 📅 planned PV has been added to the quiz, change ✗ → ✓ and seed status from new attempts
6. Adjust **Freq** only if a PV has unexpectedly surfaced/disappeared in real-life usage (free-write transcripts) — otherwise leave it stable

Do not edit the Lvl / Meaning columns — those are stable design intent.
