# Speaking lane

Parallel track to the register-fluency lane. The text path (Free Write + Phrase Swaps + register rubric) handles **production-side conversational register**. This track handles **spoken** sub-skills the text path cannot reach — fluency under time pressure, prosody, self-monitoring through self-recording.

Created 2026-05-12. **Not yet started.** Pick up in a new session when register-fluency work has a few weeks of accumulating signal and you have appetite to open a second front.

---

## Why a separate lane

The original v20260512-r3 plan dropped audio entirely after Artem clarified the priority was **conversational register fluency, not speaking itself**. That call stands for the primary track. But speaking has independent value:

- Register fluency in text doesn't transfer perfectly to speech under real-time pressure. Production with no editing is a separate skill.
- Pronunciation drift in adult L2 learners is hard to self-diagnose. Without external feedback or self-recording, fossilized pronunciation persists indefinitely.
- 2025 SLA research (Conti systematic review; T&F shadowing review) is consistent: **shadowing + structured speech repetition** is the lowest-cost path to fluency gains for adults without a teacher, and works solo with just a recording.
- Family lives in Bahrain — actual living-in-English context. Better speaking compounds outside any app.

The two lanes don't compete for the same engineering or content time:
- Register lane = worker prompts + stats consumers + drill modes (text)
- Speaking lane = PWA audio UI + Cloudflare Workers AI + new feedback prompts

---

## Sub-skill targets — pick the right one

Five distinct sub-skills, ROI per engineering hour varies wildly:

| Sub-skill | Worth chasing? | Why |
|---|---|---|
| **Fluency** (rate, pause patterns) | **Yes** | Cheap to measure (WPM, filled-pause ratio). Anna B1→B2 lift, Egor IELTS Speaking. |
| **Listening comprehension** | **Yes** | Couples with speaking via shadowing. Cheap (transcript questions). |
| **Prosody / intonation** | Maybe | Bigger intelligibility win than segments. Hard to auto-score without specialised tools. Self-listening helps. |
| Pronunciation (segments — /θ/, /æ/, devoicing) | Skip initially | Russian-L1 markers fossilize, but ROI per engineering hour is bad without phoneme-aware ASR. |
| Automaticity (chunk retrieval speed) | Indirect | The actual mission output, but hard to isolate from fluency. Address via the register lane's phrase recall drill (P1.2). |

**Target: fluency + listening first, prosody as bonus from self-recording.** Skip pronunciation scoring until/unless a Tier 4 with phoneme-aware ASR becomes obviously worth it.

---

## Three-tier mechanism plan

Each tier is roughly 2× the cost of the previous. **Tier 1 is the engagement gate.** Don't build past it without real usage signal.

### Tier 1 — listen + self-rate ($0, ~1–2 days)

- Curated 30–90s audio clips per player profile (cycling podcast snippets for Artem, family-life vlogs for Anna, kid-content for Nicole/Ernest, IELTS academic for Egor).
- PWA Coach tab gains a "Shadow" button alongside Free Write / Phrase Swaps.
- Player taps a clip → plays it → shadows aloud (no recording) → self-rates "could you follow it?" and "could you match it?" on a 3-point scale.
- Writes `coach_sessions/{listen_*}` with the rating + clip id.

Tech: file hosting (clips as `audio/*` in repo or Cloudflare R2) + audio element + a 3-tap rating UI. No API, no recording, no privacy concerns.

**Engagement gate**: ship for ~4–6 weeks. If 2+ of 5 players use it regularly, go to Tier 2. If 0–1, kill the lane and reclaim the engineering for the register track.

### Tier 2 — record + replay, no AI scoring (~3–5 days, $0–1/mo)

- Player records themselves shadowing the clip via `MediaRecorder` (works on Safari iOS so Nicole's iPad is fine).
- Recording uploads to Cloudflare R2 or Firebase Storage.
- PWA shows clip + player recording side-by-side for self-listening playback.
- No AI feedback. The whole value is the player hearing themselves.

Research basis: recording-and-listening is the single biggest unlock for self-monitoring per Conti 2025. AI feedback on speech at this point would be worse than none.

### Tier 3 — transcript + diff + AI feedback (~1–2 weeks engineering, ~$0.05/mo ongoing)

- Audio uploads to the existing Cloudflare Worker (new endpoint).
- Worker calls **Workers AI** via the `AI` binding: `env.AI.run('@cf/openai/whisper-large-v3-turbo', { audio })` → transcript.
- Worker calls **Claude API** (existing key in the worker's secrets) with `{transcript, target_script, wpm, pause_ratio}` for a 1–2 sentence "most notable miss" feedback turn.
- Returns transcript + diff highlights + feedback to PWA.
- Persists to `coach_sessions/{shadow_*}` with the rubric-style score fields.

**Cost (validated against actual account state, May 2026):**

| Component | Family-scale volume | Cost |
|---|---|---|
| Cloudflare Workers AI (Whisper-turbo) | ~100 min audio/month × ~600 neurons/min = 60k neurons/month | $0 — fits in 300k/month Free tier (20% used) |
| Anthropic API (feedback turn) | ~100 calls/month × ~600 tokens on Sonnet 4.6 | ~$0.05/mo |
| Cloudflare R2 storage | ~100 min × ~1 MB/min = ~100 MB/month | $0 — fits in 10 GB Free tier |
| **Total ongoing** | | **~$0.05/mo** |

No Cloudflare upgrade required. The Anthropic balance you already use for the worker covers the feedback cost.

### Tier 3b — spontaneous speaking (additive, not a separate tier)

Once Tier 3 is up, add a "Free Speak" mode: player records 60s spontaneous on a prompt; same pipeline transcribes + feeds a Free-Write-equivalent worker mode. This is the spoken counterpart to today's Free Write — and the **register rubric (v20260512-r3) applies unchanged**. Don't design it separately; reuse the register-rubric scoring on the transcript.

---

## Sequencing + decision gates

```
Tier 1 ship  →  4–6 wk engagement watch  →  gate: 2+ players use it?
   ├── no  →  kill the lane, reclaim time for register track
   └── yes →  Tier 2 ship  →  4–6 wk engagement watch  →  gate: recordings happening?
                  ├── no  →  hold at Tier 2 indefinitely (self-listening is real value)
                  └── yes →  Tier 3 ship  →  Tier 3b additive when ready
```

No hard timelines. Don't push past a gate that's failing.

---

## Per-player targeting

| Player | Primary sub-skill | Tier-1 clip type | Notes |
|---|---|---|---|
| Artem | Prosody + automaticity (business meetings) | Cycling podcasts, F1 commentary, business interviews | Highest engagement; lowest risk. |
| Anna | Fluency + pronunciation | Family-life vlogs, expat school chatter, padel chat | Engagement-positive on Free Write; speaking might work similarly. |
| Nicole | Listening comprehension + low-stakes speaking | Kid YouTubers, K-pop English interviews | Fragile B1. Self-rating only at Tier 1. **No recording without explicit parental consent (Artem).** |
| Ernest | Comprehension first; speaking only if engagement returns | Age-appropriate gaming/sport clips | Currently stalled. Tier 1 might be the engagement lever; don't bet on it. |
| Egor | Fluency + IELTS Speaking criteria | Academic English (TED-Ed, IELTS prep podcasts), KPMG-style client interviews | IELTS-relevant. Add IELTS-rubric scoring at Tier 3 (separate criteria from family rubric). |

---

## Risks

1. **Engagement collapse.** Speaking is more effortful than typing. Tier 1's near-zero friction (no recording) is the engagement filter. If Tier 1 fails, the lane fails — don't escalate.
2. **Privacy with minors.** Nicole/Ernest are kids. Tier 1 has zero recording so zero concern. Tier 2+ needs explicit consent from Artem and a clear retention/deletion policy. R2 retention default: 90 days. Player can delete own recordings from the UI.
3. **AI feedback quality on speech is lower than on text.** Tier 3 must validate that Claude's feedback on Whisper transcripts is at least *neutral* (not actively misleading) before relying on it. If feedback is worse than silence, hold at Tier 2.
4. **iPad UX (Nicole).** Safari iOS supports `MediaRecorder` from iOS 14.3+. Test the record button is tappable, permissions flow is obvious. Probably fine — major friction was historically iOS Safari, now caught up.
5. **Engineering opportunity cost.** Each tier is 1–2 weeks. That time isn't going into register-track P1.1 (register-pair drill, the B2→C1 gating drill per research). Be honest about which lane returns more on a given fortnight.

---

## Prerequisites before starting

- [ ] Register-fluency lane (v20260512-r3) has accumulated **~2–4 weeks of real session data** so we know whether rubric instrumentation is producing useful signal before splitting attention.
- [ ] Confirm Cloudflare Workers AI free-tier neuron budget (300k/month) is still valid at start time — Cloudflare changes free-tier limits occasionally.
- [ ] Artem grants explicit consent for Nicole/Ernest recordings (only needed at Tier 2; not blocking Tier 1).
- [ ] Pick the first batch of Tier-1 clips per player — content task, ~1 evening.

---

## What to do first in the new session

When you open the new session and want to kick off this lane:

1. Read this file end-to-end.
2. Read [references/register-rubric.md](../references/register-rubric.md) — the register rubric applies unchanged at Tier 3b spontaneous speaking, so the spoken track inherits the measurement scaffolding the text track built.
3. Curate **5 clips × 5 players = 25 clips total** for Tier 1. 30–90 sec each. YouTube clip download or direct podcast snippets work. Store as `audio/clips/{player}/{id}.mp3` in the repo (or R2 if size becomes annoying). Each clip needs: a transcript file alongside (`{id}.txt`) for Tier 3 later, a difficulty tag (`easy`/`medium`/`hard` relative to player level), and a context tag (`[biz_oil]`, `[brit_expat]`, etc. per `coach-notes-schema.md` recognised tags).
4. Add a "Shadow" button to the PWA Coach tab next to Free Write / Phrase Swaps. Gated by `playerProfile.shadow_enabled` (default `false` for all five) so it's invisible until you flip it on per player.
5. Wire the player tile to: pick a clip from the player's pool → audio element → "I listened" / "I shadowed" buttons → 3-point rating → write `coach_sessions/{listen_*}` with `{clip_id, listened: true, shadowed: bool, follow_rating: 1-3, match_rating: 1-3}`.
6. Ship as a same-day `vYYYYMMDD-r{N}` deploy. Enable for Artem first, then Anna, then the kids over the following week.

**That's the entire Tier 1 build.** No worker change. No AI. No recording. ~1–2 days of PWA work plus the clip curation.

---

## Reference research

- Shadowing for fluency, prosody, and listening comprehension — Language Gym 2025: https://gianfrancoconti.com/2025/07/26/shadowing-for-fluency-prosody-and-listening-comprehension-the-what-why-and-how-according-to-sla-research/
- Systematic review of shadowing for L2 pronunciation — T&F 2025: https://www.tandfonline.com/doi/full/10.1080/29984475.2025.2546827
- Extensive listening + comprehensible input (95–98% rule) — Language Gym 2025: https://gianfrancoconti.com/2025/02/27/why-the-input-we-give-our-learners-must-be-95-98-comprehensible-in-order-to-enhance-language-acquisition-the-theory-and-the-research-evidence/
- Cloudflare Workers AI Whisper model card: https://developers.cloudflare.com/workers-ai/models/whisper-large-v3-turbo/

---

## What this plan deliberately does not include

- **Pronunciation-focused scoring as an early goal.** High engineering cost, low ROI without phoneme-aware ASR.
- **Quarterly audio benchmark suite** (was in the original v1 plan). Too formal for family scale; won't get done.
- **Voice-input for dictation** (already in `roadmap.md` long-term aspirations). Different problem — typing-replacement, not speaking-practice. Don't conflate.
- **Live conversation with AI via voice.** Tier 3b spontaneous speaking is one-shot recordings against a prompt, not real-time dialogue. Real-time voice loop is its own thing, much later, if ever.
