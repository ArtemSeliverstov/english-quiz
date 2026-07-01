# Weak-Spots Ranking Rubric

How `stats-review` regenerates `progress/weak-spots-tracker-artem.md`. Builder-shell only
(Artem, and Egor if ever added) — a ranked weakness table is a stats surface that
`learning-system-design.md` §2/§5 forbids for learner-shell players.

This rubric is the reproducible procedure behind the tracker: the ranking is a **judgement
call, not a pure computation** (intervention-resistance and lane assignment aren't in
structured data), so `stats-review` applies this rubric with the coach_notes context rather
than a generator emitting the file blind.

---

## Two tiers

A flat list breaks because a domain like Articles is simultaneously 🔴 (double-genitive) and
🟢 (last/latest). So:

- **Domains** (big topics) = **budget layer**. Never "close"; permanent competence areas
  (map to `family-profiles.md` Learning Goals). Used for coverage + spotting a stale domain.
  Rendered as the **domain rollup** header (live/cooling/closed counts + last-touched + lane).
- **Patterns** (focus topics) = **action layer**. These *do* close. Ranked and drilled here.
  One front at a time (focused-CF, 5–7d cooldown — `learning-system-design.md` §3).

The `coach-notes-schema.md` promotion rule (4+ sessions + survives intervention) is the link
upward from pattern to Learning Goal.

## Lane / type — routes the *method*, not the priority

Tag each domain; the tag decides which lane a pattern's remediation goes to. This is what keeps
PVs and spoken production out of the drill queue.

| Type | Meaning | Lane |
|---|---|---|
| `rule · open-ended` | infinite sub-cases, never fully closes (Articles) | drill patterns, rotate |
| `rule · finite` | enumerable trigger set, near-closable (gerund/infinitive, L1 traps, correlatives) | one focused drill + spaced re-test |
| `lexical inventory` | hundreds of individual items (PVs, natural phrases) | `phrasal-verbs-tracker.md` / `phrase_tracker` — **not** drills |
| `production / fluency` | knowledge present, real-time deployment is the gap (past tense when speaking) | speaking lane (`plans/speaking-lane.md`) — **not** drills |

## Readiness gate (do this first)

A pattern in cooldown is **excluded** from NOW/NEXT until its cooldown expires. Binary:
`ready` vs `cooling`. Cooling = drilled within the last 5–7 days (`recent_observations` /
exercise dates), or explicitly held-clean pending a maintenance re-check.

## Priority score (ranks the *ready* patterns)

Rank by, in order of weight:

1. **Intervention-resistance** — survived a deliberate re-test = top weight. This is the
   strongest signal in the system (mirrors the `coach-notes-schema.md` promotion/demotion
   test). A pattern that beat a spaced re-test outranks everything.
2. **Production vs recognition** — a production gap outranks a recognition-only one. Watch for
   the avoidance fingerprint (recognition high / production low).
3. **Evidence confidence** — `recent_session_signals.count` / ridge ≥ single-session.
4. **Recurrence × register-impact** — frequency weighted by where it surfaces
   (client-facing/biz > leisure).
5. **Leverage (cost-to-close)** — cheap-to-close + recurring beats expensive multi-cycle at
   equal severity.

**Edge-of-competence** (`learning-system-design.md` §1 engagement) breaks ties.

## Tiers (the rendered buckets)

- **NOW** — ready, highest score. Drill next.
- **NEXT** — ready, lower score or higher cost.
- **AMBIENT** — `ceiling`/`production` types; folded into free-write / register-check / the
  PV & phrase trackers, *not* scheduled as drills. Tag each with its lane.
- **PARKED** — cooling (recently drilled); re-check, don't drill.
- **CLOSED** — resolved cold; de-emphasise.

🚦 🔴 live · 🟡 improving / cooling · 🟢 closed.

---

## Regeneration procedure (stats-review)

1. Pull `coach_notes.weak_patterns`, `recent_session_signals`, and recent `exercises` /
   `recent_observations` for the player.
2. Assign each `weak_patterns` entry to a **domain** + **type/lane** (Articles, Non-finite,
   Tense/aspect, Phrasal verbs, L1 lexical, Emphasis, Register/fluency, …).
3. Apply the **readiness gate**, then the **priority score** to the ready set.
4. Sort into NOW / NEXT / AMBIENT / PARKED / CLOSED; route AMBIENT lexical/production items to
   their trackers rather than the drill queue.
5. Build the **domain rollup** (per-domain 🔴/🟡/🟢 counts + last-touched + next move).
6. Write `progress/weak-spots-tracker-artem.md`. The five scoring factors are the *rationale*
   behind placement — surface tiers + lights, not numeric scores (false precision is worse
   than honest buckets).

**Data limitation (future work):** `weak_patterns` are prose strings with no structured
`domain` / `tier` / `lane` fields, so step 2 is judgement, not a lookup. If those become
structured fields on each pattern, the rollup counts (steps 2 + 5) could be generated
mechanically and only the score would need review.
