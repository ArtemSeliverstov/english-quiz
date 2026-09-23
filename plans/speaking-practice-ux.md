# Speaking practice — user-friendly rebuild

**Status**: proposal, awaiting Artem's go. Research 2026-09-11; nothing built.
**Supersedes for Anna**: the Tier 1→2→3 sequencing in `speaking-lane.md`. Tier 3 infra exists since 2026-05-13, so the engagement gate moves to Tier 3b (spontaneous speaking) directly. Kid doctrine unchanged: no recording without consent.
**Companions**: `audio-coach-pipeline.md` (what shipped), `docs/audience-profiles.md` §3 (Anna's volume ceiling), `docs/learning-system-design.md` §6 (audio don't-build — needs a reversal entry in `references/design-decisions.md` on go).

## Where we are

| Layer | Today | Verdict |
|---|---|---|
| Capture | Artem: phone Voice Memo → file to laptop → path pasted into CC. PWA record button exists, Artem-only, echoes the transcript, no feedback. | The bottleneck. One logged session since ship, on 2026-09-02. Non-starter for Anna. |
| Transcription | Workers AI `whisper-large-v3-turbo`, `language: "en"`, base64 upload, R2 copy. | Still the right model at $0.0005/min inside the free tier. The worker discards `segments[].words[]` timestamps and `avg_logprob` that Whisper already returns. |
| Analysis | Claude on the transcript: `register_rubric` + `interview_rubric`. Fillers by regex, pause ratio by a WPM proxy. | Whisper is trained to drop um/uh, so filler density undercounts. Pause ratio is a guess while word timestamps are thrown away. |
| Coach voice | None. The learner reads text. | Speaking practice needs an audible reply. |
| Players | `AUDIO_ALLOWED_PLAYERS = {artem}`, mode `interview_prep` only. | Two-line gate. |

## What is feasible now

| Option | Adds | Cost at ~2 h/month | Call |
|---|---|---|---|
| Whisper-turbo `words[]` + `avg_logprob`, already in the response | Measured pause ratio, long-pause count, low-confidence word flags | $0 | **Do now** |
| Workers AI `@cf/deepgram/nova-3`, `filler_words: true` | um/uh counted, per-word confidence, English only | ~$0.60, inside the free neuron tier | Interview mode only |
| Workers AI TTS `@cf/deepgram/aura-1`, mp3 out | Coach reply spoken; 12 English voices | ~$0.05/session; free tier ≈ 7k chars/day | **Do** |
| Claude audio input | None. Messages API takes text + image only | — | Architecture stays STT → Claude |
| Gemini 3.8 Flash native audio | One call: transcript + impressionistic fluency notes | $0.0014/min | Skip. ACL BEA 2026: no audio-LM reached human level on L2 comprehensibility; a text LLM fed measured timing features did better |
| Azure Pronunciation Assessment | The only real phoneme + prosody scorer; unscripted mode needs the JS SDK in the PWA, REST caps PA at 30 s | 5 h/month free on F0 | **Step 1b** — see "Pronunciation and clarity". The one new vendor worth adding |
| Real-time voice: Gemini Live ≈ $3, OpenAI realtime-mini $2.5–12, CF RealtimeKit ≈ $1–2 | Live dialogue | under $5 | Defer. Turn-based is enough and pedagogically controllable; live adds an iOS WebRTC client with its own bugs |
| Consumer apps: Praktika, Talkpal (Russian UI), ChatGPT voice / Gemini Live free tiers | Zero build | $0–10 | Interim only. Nothing lands in Firestore or `coach_notes` |

## Surfaces for Anna

| Surface | To speak | iOS risk | Build | Logging |
|---|---|---|---|---|
| **Keyboard dictation into the Free Write field** — iPhone mic key; Win+H voice typing on the laptop for Artem's CC turns | Open Free Write → tap the keyboard mic → speak → Send | Needs the English keyboard added; dictation audio goes to Apple/Microsoft | $0, nothing to build | Text only: no audio, no timing, no fillers. Learner errors are transcribed mostly literally, so the coach still sees her real English |
| **PWA Coach → 🎙** | Open app → Coach → Поговорим → tap mic | Home-screen PWA: MediaRecorder reported to record once, then fail after reopen until restart; mic permission re-prompts. Fine in a Safari tab. **Test on her phone before building.** | ~1 day: recorder code exists; mic on the Free Write input row; worker gate + prompt hint | Unchanged: `fw_*` doc, `coach_notes` context, `phrase_tracker` |
| **Telegram bot**, Worker webhook | Hold mic in a chat she already uses | None | 2–3 days: webhook route, `getFile` (≤20 MB) → Whisper → Claude → text + `sendVoice` (ogg/mp3/m4a ≤50 MB); worker reads/writes Firestore itself; chat-id → player allowlist; idle timeout = session end | New write path worker → Firestore; mirror the `fw_*` shape |
| WhatsApp Cloud API | Same | — | Meta business setup; service replies billable from 2026-10 | — |
| Web Speech API in the PWA | — | Dead in home-screen PWA; audio goes to Apple | — | Text only |

## Recommendation

0. **Dictation probe, zero build.** Anna: English keyboard on the iPhone, Free Write, keyboard mic, speak, Send. Artem: Win+H into CC for free-write and casual turns, audio only for mock interviews where delivery metrics matter. Three or more dictated Free Write sessions in two weeks = appetite confirmed; build step 1. Wispr-Flow-style tools are the wrong tool here: their value is LLM clean-up of fillers and grammar, which erases exactly the signal a coach needs.
1. **Free Speak in the PWA.** Free Write + mic + spoken reply, Anna-enabled. Go/no-go: a 5-minute recording test on her iPhone, home-screen icon and Safari tab. If home-screen fails, she opens the site in Safari for the trial.
2. **Engagement gate 4–6 weeks** per `speaking-lane.md`. If she comes back for it, build the Telegram bot as the convenience layer: same worker, same logs, voice replies in the chat. If she doesn't, no further speaking build.
3. **Artem's interview prep leaves file drops.** Same mic flow; `interview_prep` becomes a worker chat mode (Days 2–4 of `audio-coach-pipeline.md` as originally planned); CC keeps the end-of-session rubric by reading the session doc. Nova-3 fillers for this mode only.
4. **Transcription: keep Whisper-turbo, return what it already computes.** `words[]` + `avg_logprob` in the `/v1/audio` response; `interview-rubric.md` pause ratio switches from proxy to measured.

## Pronunciation and clarity

Text transcripts carry none of it. Three layers, cheapest first; all ride the step-1 mic.

| Layer | Mechanism | What it measures | Cost / build |
|---|---|---|---|
| A. Hear yourself | Replay button on each recorded turn; the coach gets per-word ASR confidence and says "I heard *sink* — did you mean *think*? Say it once more" when a word came through low-confidence. | Intelligibility proxy: if the ASR misheard it, a listener might too. Self-listening is the biggest self-monitoring unlock in the shadowing literature (`speaking-lane.md`). | $0; hours, inside step 1 |
| B. Read it back | After a corrected turn, the coach shows the fixed sentence; she reads it aloud; Azure Pronunciation Assessment scripted mode scores each word and phoneme against the reference text; mispronounced words highlight, tap to hear the model via TTS. Same drill on retest phrases and PVs. | Segmental accuracy per word, word stress, completeness. Scripted mode is Azure's most accurate. | Azure F0 free 5 h/month; JS Speech SDK in the PWA with a short-lived token from the worker (iOS MediaRecorder gives AAC, which Azure REST rejects, so the SDK captures PCM itself); 2–3 days |
| C. Shadow and score | Tier 1 clips from `speaking-lane.md` plus Azure scripted scoring of the shadowed take. | Prosody: rhythm, sentence stress, intonation. The bigger intelligibility win for Russian L1 than any single sound. | Rides B; clip curation is the cost |

Unscripted Azure scoring (fluency, prosody, pronunciation score per Free Speak turn) lands on the `fw_*` doc for trend tracking in `stats-review`, never shown to Anna as numbers. Coach-facing output is one line: the two or three sounds or words to work on this week, aggregated into a `pronunciation_patterns` entry in `coach_notes` once the same item recurs across sessions. Expected Russian-L1 set: /θ ð/ as s/z/t/d, /w/ vs /v/, /æ/ vs /e/, /ɪ/ vs /iː/, final-consonant devoicing, missing aspiration, flat intonation.

Limits: Azure unscripted mode is en-US only; per-word scores are noisy, trends over weeks are the signal; ASR carries accent bias, so a low-confidence word is a prompt to repeat, not a verdict. No tool replaces a human ear for warmth and register.

## Build spec — Free Speak

PWA (`index.html`):
- 🎙 button beside Send on `coachInputRow`, shown in `free_write` when `profile.freeSpeakEnabled`; tap = record, tap = stop. Reuse the `coachInterviewPrep*` recorder and mime picker.
- On stop: POST `/v1/audio` with `{mode: "free_speak", player, session_id: fwSessionId, turn}` → transcript rendered as the user turn so she sees what was heard → sent through the normal `free_write` path with `context.input_modality: "speech"` and `audio_r2_key` on the message.
- Reply: text as today; play `audio_mp3_b64` when returned; 🔈 replay button.
- Session end unchanged; `audio_turns[]` on the `fw_*` doc, shape from `interview_prep`.

Worker (`worker/index.js`):
- `AUDIO_VALID_MODES` += `free_speak`; `AUDIO_ALLOWED_PLAYERS` += `anna`.
- `/v1/audio` returns `words[]`, `avg_logprob`, `duration_s`.
- `freeWriteSystemPrompt` when `input_modality === "speech"`: the text is a speech transcript — ignore punctuation and capitalisation, don't correct likely mis-hearings, one correction per turn, reply ≤80 words in spoken style, end on one question, explanation language per `coach_language`, offer to wrap after 5–6 turns (Anna's ceiling).
- `tts: true` → `@cf/deepgram/aura-1` on the English lines of the reply only → `audio_mp3_b64`. Russian explanation stays text.

Privacy: Anna's clips land in R2 under `free_speak/anna/…` with the 90-day lifecycle; tell her before the first session. Delete-my-recordings button stays on the backlog. Kids unchanged.

Docs on go: `design-decisions.md` reversal entry for §6; `speaking-lane.md` status line; `docs/data-flow.md` audio path; `references/firestore-schema.md` `audio_turns` on `fw_*`; `worker/README.md` modes.

## Sources

- Workers AI pricing and models: https://developers.cloudflare.com/workers-ai/platform/pricing/ · https://developers.cloudflare.com/workers-ai/models/nova-3/ · https://developers.deepgram.com/docs/filler-words
- Claude models take text + image only: https://platform.claude.com/docs/en/models/overview
- Gemini audio + pricing: https://ai.google.dev/gemini-api/docs/audio · https://ai.google.dev/gemini-api/docs/pricing
- L2 assessment evidence: https://aclanthology.org/2026.bea-1.49/ · https://arxiv.org/abs/2608.26137
- Azure Pronunciation Assessment: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/pronunciation-assessment-tool
- Telegram Bot API: https://core.telegram.org/bots/api · Worker webhook pattern: https://github.com/cvzi/telegram-bot-cloudflare
- iOS home-screen MediaRecorder bug: https://developer.apple.com/forums/thread/797987 · mic re-prompt: https://bugs.webkit.org/show_bug.cgi?id=215884
- Real-time voice pricing: https://developers.openai.com/api/docs/pricing · https://developers.cloudflare.com/realtime/realtimekit/pricing
- Dictation pattern: Wispr Series B https://techcrunch.com/2026/08/17/wispr-raises-280m-at-2b-valuation-as-it-looks-beyond-dictation/ · L2 speech and ASR errors, LearnerVoice https://arxiv.org/pdf/2407.04280
