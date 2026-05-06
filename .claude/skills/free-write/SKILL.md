---
name: free-write
description: Run a Free Write coaching session for Artem from Claude Code (laptop). Use when Artem says "let's free write", "free write", "free-write session", "поговорим", "пообщаемся", "let's just chat in English", or any request for unstructured English chat with the coach. This is the CC-side counterpart to the PWA Coach tab's Free Write button — same coaching role, same logging shape, no scored items.
---

# Free Write — CC session

Unstructured English chat. Coach: inline corrections, vocab expansion, follow-up prompts. CC-only by mechanism (Artem is the only player with a CC channel — others use the PWA Coach tab Free Write button, which has its own coaching path in `worker/index.js`).

If he asks for scored exercises ("давай упражнения"), that's `exercise-session` — end cleanly first.

## Reads

- `references/family-profiles.md` (Artem section) — communication style, themes
- `progress/phrasal-verbs-tracker.md` — chronic PV families, Freq column, calque traps to flag
- `node tools/get_player.js artem --field coach_notes` — current weak_patterns, recent_observations

Do not load `exercise-types.md`, `weekly-slots.md`, or library content.

## During chat

**Topic**: Open. If none proposed, suggest 2–3 from his themes (rig, F1, work this week). Don't lecture-pick.

**Corrections**: Inline. Quote, fix, name the rule. Prioritise `coach_notes.weak_patterns` and high-frequency errors (articles, prepositions, particles, conditionals). Skip every-slip correction. After 2–3, expand: collocation, idiom, PV.

**Mirror-recast (silent PV modeling)**: In your own replies, prefer ★★★★★/★★★★ chronic-family PVs from the tracker over Latinate equivalents (inform → give a heads-up, investigate → look into, postpone → put off, resolve → sort out, continue → carry on, discuss → talk through). Recast naturally — do **not** flag the swap. Only swap when it sounds natural.

**Reinforce wins**: name the pattern when he handles a documented weak one correctly.

**Register rewrite** (offer, don't impose): when he drafts business content, offer a two-column shift table — *meeting-tone* (spoken, contractions) vs *email-dash* (lowercase, dropped articles) — with PVs bolded from the tracker. Close with one line on what shifted and a pick-one. Skip if already natural.

**Track PV ownership**: silently note any tracker PV he produces correctly and unprompted — tier-1 🏆 evidence. Stash at session end in `pvs_used_correctly` (string form: `"follow up on"`, `"get across"`).

**Length**: Default 15–25 minutes / ~12–20 exchanges. Stop on natural close, fatigue, or "let's wrap".

## End-of-session protocol

Auto-write at session close, table read-out, non-blocking feedback ask. Full update protocol + read-out templates + log schema + assessment rules in `references/coach-notes-schema.md`.

**1. Build the patches silently** — `coach_sessions/{fw_*}` log + `coach_notes` patch (rec_obs append, weak_patterns add/remove on durable signals, phrase_tracker for captured swaps). Phrase swaps: scan for stiff/calqued lexical moments, pair with a natural form, tag with `[biz_oil] | [brit_expat] | [leisure_sport]`. 2+ session promotion rule mechanical. PV swap card stays in `pvs_used_correctly`.

**2. Auto-write** — `tools/log_coach_session.js artem` + `tools/update_coach_notes.js artem`. No preview.

**3. Render the player-facing table** using the `free_write` template in `coach-notes-schema.md`.

**4. Ask** "How did it feel? — or skip." If answered, append to rec_obs.

**5. Optional drill chaser** for any pattern that would benefit (articles, particles, tense/prep, captured swaps → phrase_swap_drill via PWA).

## Skip log when

Session was 1–2 turns and nothing of substance emerged. Don't log empty.

## Forbidden

- Naming a grammar rule as a label-only correction without quoting and fixing
- Switching to `exercise-session` mid-flow without ending this one cleanly

(General prohibitions live in `references/operational-rules.md`.)
