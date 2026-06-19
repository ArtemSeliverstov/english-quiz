# Weak Spots Tracker — Artem

> **Builder-shell only.** This is a ranked weakness surface for a self-directed learner.
> Per `docs/learning-system-design.md` §2/§5 it must **never** render for learner-shell
> players (Anna/Nicole/Ernest) — ranked stats demotivate that profile.

> **Generated file (target state).** Once the gate+score rubric is encoded into
> `stats-review` (roadmap follow-up #5), this is regenerated from
> `players/artem.coach_notes` (`weak_patterns` + `recent_session_signals`) and the
> `exercises` subcollection. Until then it is a hand-seeded draft — edit through
> `stats-review`, not by hand, once generation lands.

**Source**: `coach_notes.weak_patterns`, `coach_notes.recent_session_signals`, `players/artem/exercises/*`
**Last refresh**: 2026-06-14 (hand-seeded draft; article re-test cycle `artem_ad_…_rtst`)
**Refresh trigger**: any `stats-review` run.

---

## How to read this — two tiers

The mistake is to keep one flat list. A big topic like **Articles** is simultaneously
🔴 (double-genitive) and 🟢 (last/latest) — a single "Articles" row is meaningless. So:

- **Domains** (big topics) = the **budget layer**. They never "close"; they're permanent
  competence areas. Use them to see coverage and decide which domain has gone stale.
- **Patterns** (focus topics) = the **action layer**. These *do* close. You rank and drill
  at this level. One front at a time (focused-CF, 5–7d cooldown — `learning-system-design.md` §3).

You **drill patterns; you budget domains.** The promotion rule
(`coach-notes-schema.md`: 4+ sessions + survives intervention) is the link upward.

## Lane / type legend — type routes the *method*

A domain's type decides which remediation lane its patterns go to. This is why PVs and
"past tense when speaking" must **not** sit in the drill queue.

- **rule · open-ended** — infinite sub-cases, never fully closes (Articles). Drill patterns, rotate, accept it's permanent.
- **rule · finite** — enumerable trigger set, *near-closable* with one focused drill + spaced re-test (gerund/infinitive, L1 traps, emphasis correlatives).
- **lexical inventory** — hundreds of individual items, each with own maturity. NOT pattern-drills → tracked in `phrasal-verbs-tracker.md` + `pv_cold_streak.js`.
- **production / fluency** — knowledge is present, real-time deployment is the gap. NOT drills → speaking lane (interview-prep / free-write under load, `plans/speaking-lane.md`).

## Priority legend — the action layer

- **NOW** — ready front, highest score. Drill next.
- **NEXT** — queued; ready but lower score or higher cost.
- **AMBIENT** — C1-polish / production; folded into free-write & register-check, *not* scheduled as drills.
- **PARKED** — in cooldown (recently drilled) — re-check, don't drill.
- **CLOSED** — resolved cold; de-emphasise.

🚦 🔴 live · 🟡 improving / cooling · 🟢 closed

## Scoring rubric (ranks the *ready* patterns)

Gate first (cooling → excluded from NOW/NEXT), then rank by:
1. **Intervention-resistance** — survived a deliberate re-test = top weight.
2. **Production vs recognition** — production gap outranks recognition-only.
3. **Evidence confidence** — `recent_session_signals.count` / ridge ≥ single-session.
4. **Recurrence × register-impact** — frequency weighted by where it surfaces (client-facing > leisure).
5. **Leverage** — cheap-to-close + recurring beats expensive multi-cycle at equal severity.

Edge-of-competence (§1 engagement) breaks ties.

---

## Domain rollup (budget layer)

| Domain | Type · lane | 🔴 | 🟡 | 🟢 | Last touched | Next move |
|---|---|---|---|---|---|---|
| **Articles** | rule · open-ended | 3 | 1 | 2 | 2026-06-14 | drill double-genitive (NOW); rest → maintenance |
| **Non-finite (gerund/infinitive)** | rule · **finite → near-closable** | 2 | 0 | 0 | never drilled | closed-set drill (NOW) — highest leverage |
| **Tense & aspect** | mixed · compound=rule / past-in-speech=**production** | 2 (+1 spk) | 0 | 0 | 2026-05-18 | temporal-sub drill (NOW); route past-tense to speaking lane |
| **Phrasal verbs** | **lexical inventory** | → tracker | | | 2026-05-10 | `pv_cold_streak.js`, *not* the drill queue |
| **L1 lexical / preposition** | rule · finite | 1 | 0 | 2 | 2026-05-20 | in-case-of meaning-grid (NEXT) |
| **Emphasis** | rule · finite | 0 | 1 | 1 | 2026-05-13 | correlatives — ambient |
| **Register & fluency** | **production / C1-polish** | 2 | 4 | 0 | 2026-05-18 | free-write / register-check — ambient, not drills |
| **Business English register** (domain · Learning Goal) | rule+production · **register-ladder** | 1 | 1 | 0 | 2026-05-14 | register-check: R1 direction (`register_mismatch`) + R2+ execution slips |

PV and Register/fluency counts are pointers, not drill targets — see their lanes.

---

## Pattern action list (action layer, ranked)

### NOW — drill next
| Pattern | Domain | 🚦 | Why here |
|---|---|---|---|
| Double-genitive collapse in production («коллег Бесси») | Articles | 🔴 | **intervention-resistant** — survived 4-wk re-test 6/14; production; biz |
| Gerund after suggest/start/help/recommend/avoid | Non-finite | 🔴 | finite set + 4-mo evidence + **never drilled** = cheap high-leverage |
| Temporal subordinate "when + future" ("when Bessie will send") | Tense/aspect | 🔴 | **self-confirmed**; production; cheap; never closed |

### NEXT — queued
| Pattern | Domain | 🚦 | Why here |
|---|---|---|---|
| B2 perfect-aspect compound zones (PP+already+passive / PPC+duration / backshift) | Tense/aspect | 🔴 | strong evidence + production, but **expensive** (2–3 cycles) |
| Mass-noun + indefinite hypercorrection ("an advice") | Articles | 🔴 | strong ridge; cheap cluster drill |
| "it's worth X-ing" (drops *is* + wrong complement) | Non-finite | 🔴 | gerund-adjacent; bundle with the gerund drill |
| "in case of X" calque → for / when / if | L1 lexical | 🔴 | recurring biz tic; meaning-grid drill (partly drilled 5/20) |
| `the`-overuse with abstract / zero-article nouns | Articles | 🔴 | recurred 6/14 ("take into the account"); fold into article cleanup |

### AMBIENT — exposure, not scheduled drills
| Pattern | Domain | 🚦 | Lane |
|---|---|---|---|
| **Past tense when speaking** (form solid; deployment gap) | Tense/aspect | 🔴 | **speaking** — interview-prep / free-write, monitor deployment |
| PV substitution — loses collocation force | Phrasal verbs | 🔴 | PV tracker + pre-submission self-check |
| PV cold-production gap ("get across", "get around to") | Phrasal verbs | 🔴 | `pv_cold_streak.js` |
| Chat-tempo function-word compression | Register/fluency | 🔴 | self-edit production reps |
| Execution-layer slips after register direction lands (**execution half** of Business English register) | Register/fluency | 🔴 | register-ladder R2+ |
| `register_mismatch` — register-direction selection / "bleed" (**direction half**; restored 6/16) | Register/fluency | 🟡 | register-ladder R1 (direction largely lands; execution is the residue) |
| Emphasis residual clefts (adverb placement, *for*-infinitive, "No sooner…**than**") | Emphasis | 🟡 | short correlatives drill when convenient |
| Hedge variety (everything → "maybe") | Register/fluency | 🟡 | free-write; drilled 5/18 |
| Intensifier overreliance ("definitely") | Register/fluency | 🟡 | register-marked rewriting |

### PARKED — in cooldown, re-check don't drill
| Pattern | Domain | 🚦 | Cooling since |
|---|---|---|---|
| Definite-article drop on post-modified NPs | Articles | 🟡 | held clean cold 6/14 — monitor |
| Dummy-`it` SVO carryover ("It was a bunch of…") | Register/fluency | 🟡 | drilled 5/18 |

### CLOSED — resolved cold
| Pattern | Domain | 🚦 | Closed |
|---|---|---|---|
| last/latest terminal-in-window | Articles | 🟢 | held cold 6/14 |
| of-PP identifying on existing events | Articles | 🟢 | held cold 6/14 (was a 5/17 miss) |
| "opposite **of**" not "opposite to" | L1 lexical | 🟢 | 5/20 |
| "than" vs "that" (чем trap) | L1 lexical | 🟢 | 5/20 |

---

## Cross-references

- **Phrasal verbs** → `progress/phrasal-verbs-tracker.md` (inventory + 🏆 cold-streak rule); refresh via `pv_cold_streak.js`.
- **Lexical / register swaps** → `progress/natural-phrases-tracker-artem.md` (phrase_tracker lifecycle).
- **Speaking-lane items** (past tense in speech) → `plans/speaking-lane.md`; surface in interview-prep / free-write.
- **Promotion / demotion mechanics** → `references/coach-notes-schema.md`.
