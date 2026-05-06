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

Auto-write at session close. Table read-out, then non-blocking feedback ask. The previous "preview → wait → persist" flow lost data when sessions were abandoned mid-feedback — see `coach-notes-schema.md` "Update protocol" rationale.

**1. Decide the writes silently**. Build:
- `coach_sessions/{fw_*}` log shape (schema below)
- `coach_notes` patch — `recent_observations` append (always if anything substantial happened) + `weak_patterns` add/remove on durable signals (multi-turn pattern, clear improvement, engagement shift) + `phrase_tracker` patch for any captured swaps
- Phrase swap captures: scan the session for stiff/calqued lexical moments and pair each with a natural form. Tag with the relevant context (`[biz_oil] | [brit_expat] | [leisure_sport]` for Artem). 2nd-occurrence rule is mechanical — single-session captures land in `recent_observations` only; 2nd hit promotes to `weak_patterns` lexical entry + `phrase_tracker` ⚪→🔵.
- PV swap (existing): pick at most one stiff→natural PV swap to surface to Artem; PV-specific data still lands in `pvs_used_correctly`.

**2. Auto-write everything** via the tools — no preview, no confirm:
```bash
node tools/log_coach_session.js artem <session.json>
node tools/update_coach_notes.js artem <coach_notes_patch.json>
```

**3. Render the player-facing table** (≤10 lines including the feedback ask). Use the `free_write` template from `coach-notes-schema.md` "Player-facing read-out templates" — adapt rows to what actually happened. Hide internal field names, session IDs, status codes. Example:

```
**Saved.**

| | |
|---|---|
| What we noticed | Articles solid, prepositions slipped once |
| New phrases captured | "a while ago" (instead of "sometime ago") |
| Active list | 7 phrases |

How did it feel? One sentence — or skip.
```

**4. If Artem replies to the feedback ask**, append the answer as another `recent_observations` entry (auto, no second confirm). If he doesn't reply, the session is already saved — nothing orphaned.

**5. Optional follow-up offer**: if a pattern surfaced that drill would help (articles → article_drill, particles → particle_sort, tense/prep slips → error_correction, captured swaps → phrase_swap_drill via PWA), offer as a chaser. Frame as offer, not directive.

### Session log schema

```json
{
  "mode": "free_write",
  "messages": [...],
  "error_patterns_observed": ["..."],
  "topics_covered": ["..."],
  "pvs_used_correctly": ["..."],
  "phrase_swaps_captured": [
    {"awkward": "sometime ago", "natural": "a while ago", "tag": "brit_expat"}
  ],
  "session_summary": "...",
  "assessment": {
    "estimated_level": "B2",
    "sentence_count": 14,
    "error_count": 2,
    "confidence": "high"
  }
}
```

`assessment`: silent CEFR grade folded into `lvlStats` — never mentioned in chat. Grade *production* per IELTS/CEFR (grammar gates level). `error_count` = sentences with ≥1 impeding/L1-calque error. `confidence: "low"` if <3 sentences or off-topic (fold skipped). Tool caps at 20 sentences/session.

## Skip log when

Session was 1–2 turns and nothing of substance emerged. Don't log empty.

## Forbidden

- Naming a grammar rule as a label-only correction without quoting and fixing
- Switching to `exercise-session` mid-flow without ending this one cleanly

(General prohibitions live in `references/operational-rules.md`.)
