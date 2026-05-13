---
name: register-check
description: Review the messages Artem wrote in the current CC session (or a pasted batch / exported chat) and produce a B2/C1 rewrite table per message plus a register-appropriateness check. Use when Artem says "/register-check", "register check", "check my phrasing", "review my messages", "B2/C1 my messages", or asks for an end-of-session pass over how he wrote things. Review pass, not a coaching session — no scored items, no tier walk.
---

# Register Check — CC review pass

A retrospective pass over **Artem's own messages** in the session, surfacing better B2 and C1 phrasings and — equally — flagging **register mismatch** (the documented non-grammar slip: pitch-deck nominalisation in operational writing, hallway-casual leaking into formal, over-formal/Latinate in casual CC chat). Not a drill. Counterpart to the inline footer convention, but batched and persisted.

If Artem instead wants live practice on register, that's `weak-spots-session` (the REGISTER LADDER, R1–R5) — point him there, don't run drills here.

## Reads

- `references/family-profiles.md` (Artem section) — communication style, the working registers (`[brit_expat]` hallway · `[biz_oil]` operational · executive/formal · client-facing) and the `[claude_collab]` register (operational + imperative default + explicit scope)
- `node tools/get_player.js artem --field coach_notes` — `weak_patterns`, the `REGISTER LADDER` block in `engagement_notes`, `recent_observations`, `phrase_tracker`

Don't load `exercise-types.md`, `weekly-slots.md`, or library content.

## Scope — what to review

**In scope:** substantive prose messages Artem wrote this session (questions, instructions, explanations, drafts he asked feedback on).

**Out of scope — skip silently:**
- one-word / fixed-phrase answers to an exercise or drill the assistant asked for ("a, an, a"; "It was last Thursday that…")
- code, commands, file paths, git/CLI strings
- messages that are already idiomatic *and* register-appropriate — **don't manufacture a nitpick**

If invoked with pasted text or an exported Claude.ai chat, review that batch instead of the live session.

## Per-message output

For each in-scope message, pick the **single most instructive span** (max 2 for a long message). One table row per span:

| | |
|---|---|
| your span | (verbatim) |
| **B2** | a clear, correct rewrite — the floor |
| **C1** | a polished, precise, register-fitting rewrite — the target |
| tell | ≤15 words: grammar / collocation / **register-mismatch**. If the miss is register, that's the headline and both rewrites fix the register. |

Don't repeat the whole message. If a message has nothing worth fixing, omit it entirely.

**Register check is mandatory, not optional.** For every span ask: is this the right register for its context? Over-formal or Latinate in a casual CC instruction ("kindly action this", "any possibility to…", "pedagogic value"); hallway-casual or sloppy in formal/client writing; pitch-deck nominalisation ("leverage synergies to unlock value") in plain operational writing. When register is the problem, say so explicitly and let the B2/C1 rewrites land it in the target register.

## Closing

1. **Patterns this batch** — 2–4 bullets on recurring tells (e.g. "article drop on identifiable referents ×3", "over-formal in CC instructions ×2"). Tie to existing `weak_patterns` where they match.
2. **Persist (low-friction, show-then-write):**
   - Genuine `awkward → natural` swaps → list as bullets, then `node tools/capture_swaps.js artem <input.json>` with `source: "wrap"` (closest existing capture source for prompt-coaching). Tag with the register/context where it applies.
   - One brief `recent_observations` entry via `node tools/update_coach_notes.js artem <patch.json>` — date, note `"Register check — …"`, `author: "claude_code"` — naming the dominant pattern(s). Cap stays at 10.
   - **Do not** auto-promote to `weak_patterns` — single-batch observations are candidates only (2+ rule, `coach-notes-schema.md`). If a pattern already exists there, just reference it.
3. **No proficiency fold** — this isn't a scored session, no `lvlStats` touch.

## Forbidden

- Reviewing the assistant's messages — this pass is about Artem's production only
- Turning it into a drill or tier walk (that's `weak-spots-session`)
- Skipping the register check and only doing grammar
- Manufacturing corrections for already-clean, register-appropriate messages
- Auto-promoting batch observations to `weak_patterns` / `strong_patterns`

(General prohibitions live in `references/operational-rules.md`.)
