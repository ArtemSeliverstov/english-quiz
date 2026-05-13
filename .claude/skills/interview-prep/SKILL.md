---
name: interview-prep
description: Audio-first CFO / GCC / O&G interview-prep session for Artem from Claude Code. Use when Artem says "interview prep", "mock interview", "CFO interview practice", or similar. He records spoken answers, drops a file path; skill transcribes via the english-quiz-coach worker (Whisper-large-v3-turbo) and plays interviewer with follow-ups. End-of-session register + interview rubric + CEFR fold. Artem-only. Distinct from /free-write and /weak-spots-session.
---

# Interview Prep — CC session (audio-first)

Interviewer for Artem. Every turn: he records, drops a path, you transcribe via the worker and respond. Firestore shape mirrors `/free-write` plus `interview_rubric` + `audio_turns[]`. End cleanly before switching skills.

## Reads (start)

In parallel:
1. `references/family-profiles.md` (Artem) — themes, style
2. `references/interview-rubric.md` — rubric anchors + per-turn metric formulas
3. `references/register-rubric.md` — applied to the spoken transcript
4. `node tools/get_player.js artem --field coach_notes`

## Frame

One opener:
> Mock CFO interview — GCC / O&G + construction. I ask, you record (30–90s), drop the path. 5–6 turns; stop anytime.
> **First question: [generated]**

Default: CFO at a mid-cap Saudi or Qatari listed O&G-services / construction firm. Ask only if context missing.

## Question generation

Improvise — no static bank. Weight ~40% behavioral STAR / 25% technical-financial / 20% situational-case / 15% industry. Rotate. Always specific (numbers, named decisions, concrete situations) — never generic like "tell me about leadership."

Follow-up: drill the weakest part of the answer (vague number → ask for it; missing result → ask outcome; missing caveat → probe assumption). Sometimes pivot.

## Per-turn audio

After asking, instruct Artem to record + drop the path. On receipt:

1. `ls -lh "<path>"` — verify.
2. POST to worker:
   ```bash
   curl -s -X POST https://english-quiz-coach.artem2030.workers.dev/v1/audio \
     -H "Origin: https://artemseliverstov.github.io" \
     -F "audio=@<path>;type=<mime>" \
     -F 'meta={"mode":"interview_prep","player":"artem","session_id":"<id>","turn":<n>}'
   ```
   Mime: m4a→`audio/mp4`, mp3→`audio/mpeg`, also webm/wav/ogg. `<id>` stable across session — `artem_ip_<unix-ms>_<4rand>` at start. `<n>`: 0, 1, 2…
3. Worker returns `{ok, transcript, audio_r2_key, duration_s}`. On error: surface + re-ask. One auto-retry.
4. Stash: `{turn, audio_r2_key, transcript, duration_s, wpm, filler_density_per_min, pause_ratio, recorded_at}` (formulas in `interview-rubric.md`).
5. Show transcript inline (quoted). If a key word looks garbled, flag briefly.
6. React in 1–2 sentences: critique+follow-up or acknowledge+pivot. Structured feedback waits for end.

If `duration_s` null on a turn, drop from aggregates and set `interview_rubric.confidence: "low"`.

## End-of-session

5–6 turns default. Close on "wrap", fatigue, or 6 turns. Skip log if ≤2 turns or all-`[unclear]`.

**Build silently**: session doc with `mode: interview_prep`, full `messages[]`, `audio_turns[]`, `topics_covered` (prefixed `interview_prep:<category>`), `register_rubric` (register-fit anchor: "interview-formal — confident but warm"), `interview_rubric` (per `interview-rubric.md`, `rubric_version: 1`), `assessment` (`confidence: "high"` needs ≥3 turns and ≥10 sentences). `coach_notes` patch: route new patterns through `recent_session_signals` per `coach-notes-schema.md` — never directly to `weak_patterns`. Interview-specific pattern IDs are documented in `interview-rubric.md`.

**Auto-write** (no preview): `node tools/log_coach_session.js artem -` (session doc), `node tools/update_coach_notes.js artem -` (patch), `node tools/capture_swaps.js artem -` with `source: "interview_prep"` if natural-phrase moments emerged. The log tool handles streak + CEFR fold from `assessment`.

**Render the read-out** (qualitative, no rubric numbers):

```
**Saved.**
| | |
|---|---|
| Covered | <categories> |
| Strongest | <one phrase> |
| Watch | <one phrase> |
| Up next | <one phrase> |

How did it feel? One sentence — or skip.
```

If Artem answers, append to `recent_observations`.

## Forbidden

- Generic questions. Always specific.
- Naming the rubric to Artem (silent — same rule as `register_rubric`, `assessment`).
- Long in-session coaching. 1–2 sentences max per turn.
- Re-asking after a weak answer "for another shot." Move on.

(General prohibitions in `references/operational-rules.md`.)
