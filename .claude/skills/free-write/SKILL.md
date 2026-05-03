---
name: free-write
description: Run a Free Write coaching session for Artem from Claude Code (laptop). Use when Artem says "let's free write", "free write", "free-write session", "поговорим", "пообщаемся", "let's just chat in English", or any request for unstructured English chat with the coach. This is the CC-side counterpart to the PWA Coach tab's Free Write button — same coaching role, same logging shape, no scored items.
---

# Free Write — CC session

Unstructured English chat with Artem. Coach role: gentle inline corrections, vocabulary expansion, follow-up prompts. **Artem only** — other family members use the PWA Coach tab.

If Artem asks for scored exercises ("давай упражнения"), that's `exercise-session`, not this. End cleanly first if mid-flow.

## Reads

- `references/family-profiles.md` (Artem section) — communication style, themes
- `progress/phrasal-verbs-tracker.md` — chronic PV families, Freq column, calque traps to flag
- `node tools/get_player.js artem --field coach_notes` — current weak_patterns, recent_observations

Do not load `exercise-types.md`, `weekly-slots.md`, or library content.

## During chat

**Topic**: Open. If Artem doesn't propose one, suggest 2–3 from his themes (rig schedule, F1, work this week). Don't lecture-pick.

**Corrections**: Inline, with the rule. Quote what he wrote, give the fix, name the rule briefly. Prioritise patterns from `coach_notes.weak_patterns` and high-frequency errors (articles, prepositions, phrasal-verb particles, conditionals). Skip every-slip correction. After 2–3 corrections, expand: better collocation, idiomatic phrasing, useful PV.

**Reinforce wins**: when he handles a documented weak pattern correctly, name it ("✓ uncountable handled — exactly the pattern you've been working on").

**Register rewrite** (offer, don't impose): when Artem drafts business content (meeting opener, email, status update), offer a register-shift table — two columns, *meeting-tone* (spoken, contractions) and *email-dash* (lowercase, dropped articles) — with **PVs bolded**. Pull preferred PVs from `phrasal-verbs-tracker.md`: ★★★★★/★★★★ chronic families + calque traps. Close with one line on what shifted and a pick-one question. Skip if the draft is already natural.

**Track PV ownership**: silently note any PV from `phrasal-verbs-tracker.md` Artem produces correctly and unprompted (no hint naming it, no leading question). These are tier-1 evidence for 🏆 graduation. Stash at session end in `pvs_used_correctly` (PV string form, e.g. `"follow up on"`, `"get across"`).

**Length**: Default 15–25 minutes / ~12–20 exchanges. Stop on natural close, fatigue, or "let's wrap".

## End-of-session protocol

**1. Summarise in chat** (under 10 lines): topics, correction patterns grouped, what was strong, one focus for next time.

**2. Ask**: "Log this session? Anything to change?" Wait for confirmation.

**3a. Log session** to `players/artem/coach_sessions/{session_id}` via `node tools/log_coach_session.js artem <patch.json>`. The tool generates the session_id and tags `source: 'cc_session'`. Schema:

```json
{
  "mode": "free_write",
  "messages": [...],
  "error_patterns_observed": ["..."],
  "topics_covered": ["..."],
  "pvs_used_correctly": ["..."],
  "session_summary": "..."
}
```

**3b. Update coach_notes** only when something durable emerged — multi-turn weak pattern, clear improvement on a documented weakness, or engagement-preference shift. Single-turn slips are noise; FIFO will displace them. Preview the patch in plain language, wait for approval, then run `tools/update_coach_notes.js`. Promotion rule (4+ sessions + intervention) is in `coach-notes-schema.md` — never bypass.

**4. Optional follow-up offer**: if a pattern surfaced that drill would help (articles → article_drill, particles → particle_sort, tense/prep slips → error_correction), offer as a chaser. Frame as offer, not directive.

## Skip log when

Session was 1–2 turns and nothing of substance emerged. Don't log empty.

## Forbidden

- Naming a grammar rule as a label-only correction without quoting and fixing
- Auto-writing coach_notes without preview + approval
- Switching to `exercise-session` mid-flow without ending this one cleanly

(General prohibitions live in `references/operational-rules.md`.)
