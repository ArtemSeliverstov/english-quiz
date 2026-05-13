# Audio Coach Pipeline — Artem fast-track

Sister plan to [speaking-lane.md](speaking-lane.md). That plan defines family-wide doctrine (tiered rollout, engagement gates, kid privacy). **This plan is the Artem-only fast-track build** — single user, no tier gates, interview-prep deadline-aware, two modes on shared audio infrastructure.

Created 2026-05-12. **Partially executed and re-scoped 2026-05-13** — see "Status (2026-05-13)" below.

---

## Status (2026-05-13)

**What landed**:
- Worker side: `/v1/audio` endpoint deployed with `env.AI` (Workers AI Whisper-turbo) and `env.AUDIO` (R2 bucket `english-quiz-audio` with 90-day lifecycle rule). See [worker/index.js](../worker/index.js) `handleAudio` function. Live at `https://english-quiz-coach.artem2030.workers.dev/v1/audio`.
- CC skill: `/interview-prep` ([.claude/skills/interview-prep/SKILL.md](../.claude/skills/interview-prep/SKILL.md)) — audio-first interview-prep session. Artem records on phone (Voice Memo), drops file path in CC, skill curls audio to the worker, gets Whisper transcript, plays interviewer with follow-ups.
- Rubric reference: [references/interview-rubric.md](../references/interview-rubric.md) — `structure_score`, `specificity_score`, `confidence_balance`, delivery aggregates (WPM, filler density, pause ratio), `per_turn_summaries`, `confidence`, `rubric_version: 1`.
- `tools/log_coach_session.js` extended: accepts `interview_prep` mode, `ip` session-id prefix, passes through `interview_rubric` + `register_rubric` + `audio_turns[]`, and folds `interview_prep` `assessment` blocks into the silent CEFR fold same as `free_write`.
- CLAUDE.md skills table updated.

**Pivot from original plan** (logged in the skill file too): Artem prefers running interview prep through CC for the conversational flexibility — generate questions live, follow up based on what surfaced, no PWA UI plumbing in the way. The audio-first call still holds (he wants spoken practice, not text); the surface changed from "PWA Coach-tab button with MediaRecorder UI" to "CC session with phone-recorded audio file drop." Days 1-5 of the original sprint plan collapse to:
- Day 1 (audio plumbing) → done as worker `/v1/audio` deploy.
- Day 2 (question bank + multi-turn state) → replaced by skill-prompt-driven question improvisation (no static `data/interview-questions.json` file).
- Day 3 (per-turn feedback + AI follow-ups) → done as part of the conversational skill flow.
- Day 4 (end-of-session scoring + persistence) → done as the skill's end-of-session protocol + `log_coach_session.js` passthrough.
- Day 5 (polish, real session, deploy) → pending the first real session (smoke test below).

**Parked but kept**: the PWA-side Coach-tab "Interview Prep" button + `MediaRecorder` UI + `coachStartInterviewPrep` flow are implemented in [index.html](../index.html) under the `FAMILY_MEMBERS.artem.interviewPrepEnabled` gating flag, but the PWA was not re-deployed. The code is a working starting point if family-wide spoken-practice rollout (per [speaking-lane.md](speaking-lane.md)) ever flips that flag for other players or for Artem on a non-CC surface.

**Days 6-8 (`shadow_feedback` mode)** stay in the plan unchanged below — also unstarted, also CC-skill-shape when it lands.

**Day-1 smoke test result (2026-05-13)**: round-trip works. Sent a 174 KB MP3 → R2 stored at `interview_prep/artem/<session>/turn-0-<ts>.mp3` → Whisper-turbo returned a clean transcript with timestamps. Audio infra is solid.

### Resolved during Day-1 sprint

- **Whisper turbo input format.** Initial attempts with `[...new Uint8Array(buf)]` and `new Uint8Array(buf)` were rejected — the schema actually wants `audio: <base64 string>`, not a byte array. Documented in [Cloudflare's whisper-large-v3-turbo model card](https://developers.cloudflare.com/workers-ai/models/whisper-large-v3-turbo/). The misleading "Type mismatch '/audio', 'string' not in 'array','binary'" error was the schema saying our value didn't satisfy the union of allowed types. Fixed by base64-encoding the audio (chunked `btoa` to avoid stack overflow on multi-MB blobs) and adding the `language: "en"` hint — which also improves accuracy on Russian-accented English by disabling auto-language-detection (auto-detect can misfire on heavy L1 substrate).
- **`duration_s`.** Whisper-turbo returns timestamped `segments[]` and a top-level `vtt` block; `extractDurationSeconds()` in the worker parses both shapes plus the rare top-level `duration` field. Eliminates the need for client-side `ffprobe`.

### Smoke test before/after

| Model | Transcript on the same test clip |
|---|---|
| base `@cf/openai/whisper` (no language hint) | `"This is Chuk, please tell me how to give you me."` — garbled |
| `@cf/openai/whisper-large-v3-turbo` + `language: "en"` | `"This is Chuck. Please tell me how do you hear me?"` — clean, L2 slip preserved |

---

## Original plan (preserved below for context)

Pick up in a new session per "What to do first" below.

---

## Goal

Ship an end-to-end audio capture + AI feedback pipeline gated to Artem only, supporting two modes from day one:

1. **`interview_prep`** — multi-turn interview simulation (AI asks Q → Artem records spoken answer → AI gives brief feedback + asks follow-up → repeat 3–6 turns → end-of-session comprehensive report). Themed to **CFO / financial leadership / performance management / GCC (KSA/Qatar/UAE) / O&G or construction**. Deadline-driven by upcoming interview prep.
2. **`shadow_feedback`** — listen to a native-speaker clip → shadow aloud → transcript diff + prosody feedback. Same audio infra, different worker mode. Ships ~3 days after `interview_prep`.

All sessions persist to Firestore exactly like Free Write: `coach_sessions/{ip_*}` and `coach_sessions/{shadow_*}` with full instrumentation. **No data is lost to Claude.ai's stateless chat** — the original motivation for not just running interview prep in Claude.ai.

---

## Why two modes share one infrastructure

The audio pipeline is the same regardless of mode:

```
PWA MediaRecorder
  → audio blob upload to Cloudflare R2 (signed URL or worker-proxied)
  → worker accepts URL or blob
  → Workers AI: @cf/openai/whisper-large-v3-turbo → transcript
  → worker dispatches by mode (interview_prep | shadow_feedback | future)
  → mode-specific Claude prompt → feedback + scoring
  → worker returns transcript + feedback + rubric scores
  → PWA renders + persists to coach_sessions
```

Building both modes together is ~3 days more than building one. Future modes (`spoken_freewrite`, `pronunciation_drill`, anything else) drop in as additional worker dispatch branches.

---

## Sprint plan (5 days for interview_prep + 3 days for shadow_feedback)

### Day 1 — audio plumbing

- `worker/wrangler.toml`: add `[ai] binding = "AI"` and `[[r2_buckets]] binding = "AUDIO" bucket_name = "english-quiz-audio"`.
- Cloudflare dashboard: create the R2 bucket. Set 90-day lifecycle rule for object expiration (storage hygiene).
- `worker/index.js`: new mode `interview_prep`. Skeleton: accepts `{audio_r2_key, turn: 0}` → fetches audio from R2 → `env.AI.run('@cf/openai/whisper-large-v3-turbo', { audio })` → returns transcript as text. No Claude call yet. Echoes transcript back.
- `index.html`: Coach tab — new "Interview Prep" button gated by `FAMILY_MEMBERS.artem.interview_prep_enabled = true`. Invisible for everyone else.
- `index.html`: new `MediaRecorder` UI in the Coach tab — record button, stop button, playback widget. On stop: get signed R2 upload URL from worker, PUT blob to R2, send R2 key to worker.

**Day 1 ships a working transcript loop**: Artem hits record, says something, sees the transcript come back. No question, no feedback yet. Pure plumbing verification.

### Day 2 — question bank + multi-turn state

- `data/interview-questions.json` (new) — curated bank organized by category. Target ~80 questions:
  - **Behavioral STAR** (~25): "Tell me about a time you turned around a struggling P&L." / "Walk me through a difficult capital allocation decision."
  - **Technical/financial** (~20): working capital optimization, FX/oil-price hedging, IFRS for E&P or construction (IFRS 16 leases, IFRS 15 long-term contracts), KPI design for performance management, capex ROI methodology.
  - **Situational/case** (~15): "$50M overrun on a megaproject — first 24 hours." / "CEO wants to acquire a competitor at 12× EBITDA — your analysis."
  - **Industry-specific** (~10): Saudi Vision 2030 implications for construction, NEOM financing, Qatar LNG expansion economics, ADNOC IPO strategy, Aramco upstream/downstream split.
  - **Leadership / CFO-as-business-partner** (~10): managing a multinational finance team, partnering with the CEO on growth strategy, board reporting under bad-news quarters.
- Each entry: `{id, category, level, prompt_en, expected_topics: [...], follow_up_hints: [...]}`.
- `worker/index.js`: question selection logic — first turn picks from bank, weighted by category. PWA carries `messages[]` (chat-style history) per session; worker is stateless.
- `index.html`: chat-style turn UI — AI question shown, record-and-send button, AI response shown, next record-and-send.

I'll draft the question bank for you in the new session — one focused hour, not your evening. You review + edit before commit.

### Day 3 — per-turn feedback + AI follow-ups

- `worker/index.js`: after transcribing the audio, Claude call for:
  - Brief inline feedback (1–2 sentences, conversational): "Solid — give me a specific number." / "Good structure. Follow-up: how did you measure success?"
  - Follow-up question generation: based on the answer + `expected_topics` + `follow_up_hints` for the current Q. Sometimes drills deeper on the previous answer ("you mentioned restructuring — what was your COGS reduction target?"), sometimes pivots to a new question.
  - Track per-turn metrics: WPM (transcript word count / audio duration), filler density (count "um/uh/like/you know/sort of/kind of"), pause ratio (silent gaps from audio metadata).
- `index.html`: render per-turn feedback + numbers below each AI question/answer pair.

### Day 4 — end-of-session scoring + persistence

- Session-end shape (parallels Free Write's `<session_meta>` block):
  ```jsonc
  {
    "session_summary": "Two-sentence recap.",
    "topics_covered": ["interview_prep:behavioral", "interview_prep:industry_specific"],
    "register_rubric": { /* existing rubric from v20260512-r3, applied to spoken transcript */ },
    "interview_rubric": {
      "structure_score": 1..5,        // STAR adherence, coherent narrative
      "specificity_score": 1..5,      // concrete examples vs vague
      "confidence_balance": 1..5,     // hedge vs assertion balance
      "avg_filler_density_per_min": <num>,
      "avg_wpm": <num>,
      "avg_pause_ratio": <num>,
      "per_turn_summaries": [{ turn: 1, score: ..., note: "..." }, ...],
      "confidence": "high" | "low"
    },
    "assessment": { /* existing CEFR fold — uses spoken transcript */ }
  }
  ```
- `references/interview-rubric.md` (new) — anchors per dimension, analogous to `register-rubric.md`.
- `index.html`: end-of-session report card UI — register table + interview table + per-turn breakdown.
- `index.html` `coachWriteSessionLogStandalone`: pass `interview_rubric` through to Firestore (analogous to the `register_rubric` passthrough we added in r3).
- `references/firestore-schema.md`: add `interview_rubric` row.

### Day 5 — polish, real session, deploy

- Error handling: audio upload retry, Whisper timeout, Claude rate limit, R2 access fallback.
- One real session against the deployed pipeline — Artem does a 5-question interview, reads the report card, validates the feedback is useful.
- Same-day `vYYYYMMDD-rN` PWA deploy via `deploy-build` skill.
- `cd worker && wrangler deploy` from your machine.

### Days 6–8 — `shadow_feedback` mode (sibling)

Same audio infra, different worker dispatch:
- 8–10 curated clips with transcripts (cycling, business, F1 — your themes), stored as `audio/shadow-clips/{id}.mp3` + `{id}.txt` in repo.
- Worker mode `shadow_feedback`: Whisper transcript → word-level diff vs script → Claude feedback (1–2 sentences on most notable miss).
- PWA: same record UI, different result-card showing diff highlights instead of multi-turn chat.
- Persist as `coach_sessions/{shadow_*}`.

---

## Cost (validated against current accounts, 2026-05-12)

Expected usage: ~10 interview-prep sessions/month × ~10 min audio each + ~5 shadow sessions/month × ~5 min audio = ~125 min/month.

| Component | Volume | Cost |
|---|---|---|
| Cloudflare Workers AI (Whisper-turbo) | ~75k neurons/month | $0 — 25% of 300k Free tier |
| Cloudflare R2 storage | ~125 MB/month | $0 — 1.25% of 10 GB Free tier |
| Anthropic API (Sonnet 4.6, ~5 turns × 1500 tok × 15 sessions) | ~110k tokens/month | ~$0.20/mo |
| **Total** | | **~$0.20/mo** |

All on existing accounts. No new vendor, no new key, no Cloudflare plan upgrade.

---

## Scoring philosophy

The existing **`register_rubric`** (v20260512-r3) measures conversational register at the *language* level — and applies unchanged to spoken transcripts. The new **`interview_rubric`** measures interview-specific *delivery* axes that the register rubric doesn't capture:

- **Register quality**: handled by `register_rubric` (chunk_density, register_match — register_match anchor here is "interview-formal: confident but warm, no over-formality, no over-casual").
- **Content / structure**: handled by `interview_rubric.structure_score` + `specificity_score`.
- **Delivery**: handled by `interview_rubric.confidence_balance` + filler density + WPM + pause ratio.

Both rubrics emit `confidence: "high" | "low"` and follow the same silent-when-low convention as `assessment`.

---

## Privacy / retention

- Audio uploaded to private R2 bucket. Not publicly accessible — worker generates signed URLs.
- 90-day default retention on R2 objects. Player can trigger deletion from PWA at any time.
- Only Artem's audio is captured (other players don't have the gating flag). Family-wide expansion requires explicit consent per [speaking-lane.md](speaking-lane.md) before flipping flags.

---

## Open decisions before starting

1. **Interview date**: not blocking, but informs pacing. "We have time" was the latest signal — assume 3+ weeks out unless updated.
2. **Question bank ownership**: I'll draft ~80 questions in the new session. You review/edit, then commit. Source from real Saudi/Qatar/UAE finance leadership job postings + standard CFO interview banks + industry-specific O&G/construction question lists. Will document sources in `data/interview-questions.json` header.
3. **Audio retention granularity**: 90-day default sound right, or shorter? Affects R2 lifecycle rule.

---

## What to do first in the new session

1. Read this file end-to-end. Read [speaking-lane.md](speaking-lane.md) briefly for context — that plan's privacy and family-rollout sections still govern any future flag-flip beyond Artem.
2. Read [references/register-rubric.md](../references/register-rubric.md) — the register rubric applies unchanged to spoken transcripts, so the scoring scaffolding is half-built already.
3. **Confirm scope hasn't drifted**: interview date, role/region/industry still as stated above? Question bank source still "I draft, you review"?
4. **Day 1 first task**: set up R2 bucket via Cloudflare dashboard → `[r2_buckets]` binding in `wrangler.toml` → add Workers AI binding. ~30 min.
5. **Day 1 second task**: worker `interview_prep` skeleton echoing transcript. Test with curl per `worker/README.md` pattern.
6. **Day 1 third task**: PWA Coach tab "Interview Prep" button + MediaRecorder UI + R2 upload via signed URL.

End of Day 1 = working transcript-only loop. No feedback yet. Verify the audio plumbing is solid before adding the feedback layer.

---

## Reference research

Spoken-fluency-specific (in addition to speaking-lane.md's references):

- Multi-turn interview simulation effectiveness for high-stakes preparation: largely industry knowledge, but mock-interview literature consistently shows that **follow-up questions** (vs scripted-only) are the key differentiator for realism and identifying weak spots.
- IELTS Speaking Band Descriptors (Part 2/3 in particular) are the closest public rubric to professional interview speaking — useful reference even though we're not grading against IELTS bands directly.
- CFO interview literature: standard sources include Harvard Business Review CFO archives, McKinsey Global Institute publications, and the Big Four (PwC/EY/Deloitte/KPMG) thought leadership on CFO competencies — those are where the question bank pulls themes from.

---

## What this plan deliberately does not include

- **Family rollout** — covered by [speaking-lane.md](speaking-lane.md). When/if you extend `interview_prep` to others (e.g. Egor for IELTS Speaking, which is structurally similar to a job interview), follow that plan's engagement-gate doctrine.
- **Real-time voice dialogue** (Sesame / OpenAI Realtime style) — out of scope. One-shot record-and-respond per turn is enough for interview practice and dramatically simpler.
- **Pronunciation phoneme scoring** — out of scope. Whisper alone can't do it well; would need a phoneme-aware ASR. The `interview_rubric` covers delivery without going down that rabbit hole.
- **Live transcript display while recording** — nice-to-have, not blocking. Ship post-recording transcript first; add live transcription only if it's clearly worth the extra worker plumbing.
