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

Default: next lesson day per the plan's week template and ledger. One Reading Lab and one live day per week (live day alternates `interview-prep` / casual free-write — route to that skill and let it own the session, but add the ledger line). Artem's explicit ask overrides. A real interview on the calendar → A6 surge, everything else waits. Open with a one-line agenda (module + today's mechanic), then go.

## Teacher block (≤12 min)

- Narrative first: a concrete scene (covenant slips, consultant overruns scope), then the language mechanic inside it. Never explain finance to a CFO — only the interaction layer.
- Every point as a contrast pair: document-English version → what a native says in the room.
- End with 3–5 takeaway chunks, shown once. Then production starts.

## Drill block (~25 min)

- One front, 10+ items, strictly one at a time: ask → wait → react → next.
- Today's chunks to cold production (phrase-swap / particle / transform mechanics; never show the target form or particle in the cue).
- Interleave 2–3 ▲-zone grammar items (the-overuse every session) — unlabeled.
- Miss → adaptive sibling protocol: explain → sibling → deeper + one more → log as gap, move on.
- Feedback `light`: 1–2 sentences, name the rule, no L1 contrast.

## Live scenario (~15 min)

Coach plays the counterpart — bank MD, EY partner, McKinsey EM, recruiter, CEO — in the module's context with CV-real stakes. Engineer 2–3 pushback moments. Audio-first when practical: same `/v1/audio` worker call as `interview-prep` SKILL (`meta.mode: "conversation"`), stash `audio_turns[]`. In-scenario corrections: none; hold for wrap unless communication breaks.

## Reading Lab day

Artem supplies the passage (≤1 page, The Black Company). Walk: who speaks to whom, what's unsaid, register markers, allusions. Then the twist — retell the scene twice, hallway register and board register. Harvest 3–5 chunks. Comfort self-scale 1–5 into the ledger line. Logs carry chunks + observations, never extended excerpts.

## Wrap + logging (auto-write, then read out)

1. Build silently: session doc `mode: "conversation"`, `model_used: "claude-code-cc"`, full `messages[]`, `topics_covered: ["biz_lesson:<module_id>"]`, `register_rubric` (required; anchor = the scenario's register), `assessment` (confidence rules as free-write), `audio_turns[]` if any.
2. Write: `node tools/log_coach_session.js artem -` · `node tools/update_coach_notes.js artem -` (new patterns via `recent_session_signals`, never straight to `weak_patterns`) · `node tools/capture_swaps.js artem -` with `source: "biz_lesson"` for harvested chunks.
3. Edit the plan file: prepend ledger line `S# · date · module · outcome · Тайминг` (Тайминг from transcript timestamps, total + per-block); bump module status when a module opens or closes.
4. Read-out: 4-row table (Covered / Strongest / Watch / Up next), then "How did it feel? — or skip" (answer → `recent_observations`). Offer register-check / prompt-rephrasing roundup; never inline them.

Skip logging if ≤2 exchanges of substance.

## Forbidden

- Batching drill items, or previewing upcoming items/targets — cold production dies
- Naming rubrics/assessment to the player
- Teacher block over 12 min or second lecture before he has produced
- Generic stems; `translation` drills (too easy at C1)
- Full-doc Firestore writes — patch named fields only (2026-05-20 wipe)
- Reproducing extended book passages in logs or read-outs
- Running the drill block past a flat, tired session — cut to scenario, end warm

(General prohibitions — `references/operational-rules.md`.)
