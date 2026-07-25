---
name: business-lesson
description: Artem's daily ~60-min teacher-led business-English hour. Use when Artem says "урок", "давай урок", "lesson", "business english", "бизнес-английский", "reading lab", or asks to start his daily English hour. Teacher mini-lecture → drills → live scenario, per plans/biz-english-track-artem.md. Distinct from exercise-session (short drills), weak-spots-session (one grammar topic), free-write (unstructured), interview-prep (mock interview).
---

# Business Lesson — Artem's daily hour

Teacher-led session implementing `plans/biz-english-track-artem.md`. Read that plan first — module map, week template, session anatomy live there; this skill carries only the run rules.

## Reads (start, parallel)

1. `plans/biz-english-track-artem.md` — ledger + module statuses → today's shape and module
2. `references/family-profiles.md` (Artem) — themes, style, feedback tier `light`
3. `progress/exercise-domain-map-artem.md` — ▲-zone rows only, for drill interleave
4. `node tools/get_player.js artem --field coach_notes`
5. `references/register-rubric.md`

## Day shape

Default: next lesson day per the plan's week template and ledger. One Reading Lab and one live day per week (live day alternates `interview-prep` / casual free-write — route there, but add the ledger line). His explicit ask overrides. A real interview on the calendar → A6 surge. Low time or energy → minimum viable session: teacher block + one micro-block, ~20 min, logged normally. Open with a one-line agenda, then go.

## Teacher block (~15 min) — teach, don't tabulate

His ask (2026-07-25): **more tutoring, less "here's a table, now apply it."** A table summarises a lesson; it isn't one.

- Narrative first: a concrete scene, then the mechanic inside it. Never explain finance to a CFO — only the interaction layer.
- Explain **why** the form behaves that way: what the listener is doing, what it signals, why the L1 habit misfires. He asks for rules unprompted — feed that.
- Contrast pairs as *worked examples* — walk one properly rather than listing six.
- ≤1 table, only after the idea has landed in prose. End with 3–5 chunks, then production.

## Micro-blocks (~30 min, 3 × ~10 min)

Replaces the single long drill block. Each = **2–3 min mini-teach on one front → 5–6 items → one-line close naming what moved.**

Pick 3: register dial (Latinate→Germanic, particles) · determiners (over-use *and* speech-drop) · perfect-aspect open windows · contractions + spoken markers · chunk-fit · module chunks cold. One block always carries articles.

- One item at a time: ask → wait → react → next. Never preview the target.
- Miss → sibling protocol: explain → sibling → deeper + one more → log as gap, move on.
- Feedback `light`: 1–2 sentences, name the rule, no L1 contrast.

## Live scenario (~10–15 min)

Coach plays the counterpart — bank MD, EY partner, recruiter, CEO — with CV-real stakes. **State intensity up front and let him set it**: light (cooperative) · normal (2 pushbacks) · hard (hostile, contested facts). Default normal; never hard unprompted — S1's scene read as stressful unannounced. Audio-first when practical via the `interview-prep` `/v1/audio` call (`meta.mode: "conversation"`), stash `audio_turns[]`. No corrections in role. Debrief interaction strategy, not only language.

## Reading Lab day

He supplies the passage (≤1 page, The Black Company). Walk: who speaks to whom, what's unsaid, register markers, allusions. Then the twist — retell it twice, hallway register and board register. Harvest 3–5 chunks. Comfort self-scale 1–5 into the ledger. Logs carry chunks + observations, never excerpts.

## Wrap + logging (auto-write, then read out)

1. Build silently: session doc `mode: "cc_session"` (`VALID_MODES` has no `conversation`), `model_used: "claude-code-cc"`, full `messages[]`, `topics_covered: ["biz_lesson:<module_id>"]`, `register_rubric` (required), `assessment`, `audio_turns[]` if any. `cc_session` sits outside `CEFR_FOLD_MODES` — assessment persists for `stats-review`, never moves `lvlStats`; taught material isn't a proficiency sample.
2. Write: `node tools/log_coach_session.js artem -` · `node tools/update_coach_notes.js artem -` (new patterns via `recent_session_signals`, never straight to `weak_patterns`) · `node tools/capture_swaps.js artem -` with `source: "ex"` (valid: `fw|psd|wrap|ex`).
3. Plan file: prepend ledger line `S# · date · module · outcome · Тайминг`; bump module status on open/close.
4. Read-out: 4-row table (Covered / Strongest / Watch / Up next), then "How did it feel? — or skip" (answer → `recent_observations`). Offer register-check / prompt-rephrasing roundup; never inline them.

Skip logging if ≤2 exchanges of substance.

## Forbidden

- Batching drill items, or previewing upcoming items/targets — cold production dies
- Naming rubrics/assessment to the player
- Table-first teaching, or a second lecture before he has produced
- Generic stems; `translation` drills (too easy at C1)
- Full-doc Firestore writes — patch named fields only (2026-05-20 wipe)
- Reproducing extended book passages in logs or read-outs
- Unannounced hostile roleplay; pushing a flat or tired session — cut and end warm

(General prohibitions — `references/operational-rules.md`.)
