---
name: register-check
description: Review the messages Artem wrote in the current CC session (or a pasted batch / exported chat) and produce a B2/C1 rewrite table per message plus a register-appropriateness check. Use when Artem says "/register-check", "register check", "check my phrasing", "review my messages", "B2/C1 my messages", or asks for an end-of-session pass over how he wrote things. Review pass, not a drill — no scored items, no tier walk.
---

# Register Check — CC review pass

Retrospective pass over **Artem's own messages** this session: better B2 and C1 phrasings for the most instructive span of each, plus — equally — a **register-mismatch** verdict (the documented non-grammar slip — pitch-deck nominalisation in operational writing, hallway-casual leaking into formal, over-formal/Latinate in casual CC chat). Batched, persisted counterpart to the inline B2/C1 footer convention.

Live register practice = `weak-spots-session` (the REGISTER LADDER, R1–R5), not this — point him there if he wants drills.

## Reads

- `references/family-profiles.md` (Artem) — communication style, the working registers (`[brit_expat]` hallway · `[biz_oil]` operational · executive/formal · client-facing) and `[claude_collab]` (operational + imperative + explicit scope)
- `node tools/get_player.js artem --field coach_notes` — `weak_patterns`, the `REGISTER LADDER` block in `engagement_notes`, `recent_observations`, `phrase_tracker`

Don't load `exercise-types.md`, `weekly-slots.md`, or library content.

## Scope

**In scope:** substantive prose Artem wrote — questions, instructions, explanations, drafts.

**Skip silently:** one-word / fixed-phrase answers to an exercise the assistant set; code, commands, file paths, git/CLI strings; messages already idiomatic *and* register-appropriate — don't manufacture a nitpick.

Invoked with pasted text or an exported Claude.ai chat → review that batch instead.

## Per-message output

Pick the **single most instructive span** (max 2 for a long message). One table row per span:

| | |
|---|---|
| your span | (verbatim) |
| **B2** | a clear, correct rewrite — the floor |
| **C1** | a polished, precise, register-fitting rewrite — the target |
| tell | ≤15 words: grammar / collocation / **register-mismatch** |

Don't repeat the whole message. Nothing worth fixing → omit that message.

**Register check is mandatory.** For every span: is this the right register for its context? Over-formal/Latinate in a casual CC instruction ("kindly action this", "any possibility to…"), hallway-casual in formal/client writing, pitch-deck nominalisation ("leverage synergies") in plain operational writing. When register is the miss, that's the tell — and both rewrites land it in the target register.

## Closing

1. **Patterns this batch** — 2–4 bullets on recurring tells; tie to existing `weak_patterns` where they match.
2. **Persist (show, then write):**
   - Genuine `awkward → natural` swaps → list as bullets, then `node tools/capture_swaps.js artem <input.json>` with `source: "wrap"`. Tag with the register/context it applies to. **Register-down swaps count** (CR2): a grammatically correct but over-formal span in a casual context is a genuine swap (`formal → casual [brit_expat]`), not merely a verdict.
   - One brief `recent_observations` entry via `node tools/update_coach_notes.js artem <patch.json>` — date, note `"Register check — …"`, `author: "claude_code"`. Cap stays at 10.
   - **Don't** auto-promote to `weak_patterns` — single-batch observations are candidates only (2+ rule, `coach-notes-schema.md`).
3. **No proficiency fold** — not a scored session; no `lvlStats` touch.

## Forbidden

- Reviewing the assistant's messages — this pass is Artem's production only
- Turning it into a drill or tier walk (that's `weak-spots-session`)
- Skipping the register check and doing grammar only
- Correcting already-clean, register-appropriate messages
- Auto-promoting batch observations to `weak_patterns` / `strong_patterns`

(General prohibitions: `references/operational-rules.md`.)
