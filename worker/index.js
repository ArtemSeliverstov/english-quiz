// english-quiz-coach Cloudflare Worker
//
// Thin proxy from the family-side PWA to api.anthropic.com/v1/messages.
// Validates origin/size/mode/model/player, constructs the system prompt
// server-side (so the PWA can't smuggle one in), forwards to Anthropic,
// and returns a structured envelope per references/phase2-coach-tab.md §7.2.
//
// Modes:
//   - free_write             : conversational tutoring on free-typed English
//   - escalate               : one-shot deeper explanation after pre-generated feedback
//   - phrase_swap_drill      : lexical/register swap drill (added 2026-05-06)
//   - weak_spots_drill       : ~30-min depth session on one topic, tier-walked
//                              (added 2026-05-11; see exercise-types.md type 11)
//   - translation_drill      : live RU→EN drill (Phase D-1; replaces library translation)
//   - error_correction_drill : live one-sentence-one-error drill (Phase D-2)
//   - article_drill_live     : live single-blank article gap-fill (Phase D-3)
//   - particle_sort_live     : live PV particle production drill (Phase D-4)
//   - spelling_drill_live    : live Russian-gloss → English-spelling drill with
//                              spelling_pool support (Phase D-5; closes T1 rollout)
// Phase D modes replace library content as the primary path; library survives
// as offline-only fallback on the PWA side. See worker/README.md per-mode docs
// and plans/coach-live-ai-and-weak-spots.md for the full rollout.
//
// Routing:
//   - POST /v1/messages (or /) : JSON pipeline (modes above). 50 KB body cap.
//   - POST /v1/audio           : multipart audio pipeline (interview_prep,
//                                shadow_feedback later). Day-1 echoes Whisper
//                                transcript; later days add Claude feedback.
//                                See plans/audio-coach-pipeline.md.
//
// Secrets / vars (configure via Cloudflare dashboard or wrangler):
//   - ANTHROPIC_API_KEY  (Secret, encrypted)
//   - ALLOWED_MODELS     (Plain text, comma-separated whitelist)
//   - ALLOWED_ORIGIN     (Plain text, e.g. https://artemseliverstov.github.io)
//
// Prompt caching: stable system preamble carries cache_control:ephemeral so
// turn 2+ reads the prefix at ~10% input cost. Volatile session-end suffix
// sits after the breakpoint so it doesn't invalidate the cache on normal
// turns. See shared/prompt-caching.md.

// 'artem' added in s91-worker-r2 (2026-05-01). Original design (§3, §7.3) excluded
// Artem from the Worker path — he was meant to use CC for his own sessions. In
// practice he wants to use Free Write from the PWA too (no laptop required), and
// the prepaid balance amply covers the extra volume.
//
// 'egor' added 2026-05-06 alongside the natural-phrases initiative — full family
// parity for supplementary surfaces (Free Write + phrase_swap_drill). See
// design-decisions.md "Egor full family parity".
const ALLOWED_PLAYERS = ['anna', 'nicole', 'ernest', 'artem', 'egor'];

// The PWA sends `context.coach_language` ('ru' | 'en') derived from each player's
// FAMILY_MEMBERS profile entry (which mirrors references/family-profiles.md). The
// Worker treats that field as authoritative.
//
// Fallback: if a client sends no `coach_language` (older PWA bundle pre-s91r3),
// fall back to this hard-coded list so existing live clients don't regress.
const RUSSIAN_FALLBACK_PLAYERS = ['anna', 'nicole'];

function explainInRussian(ctx) {
  const cl = ctx && ctx.coach_language;
  if (cl === 'ru') return true;
  if (cl === 'en') return false;
  // Legacy clients (no coach_language field) — fall back to the hard-coded list.
  return RUSSIAN_FALLBACK_PLAYERS.includes(ctx && ctx.player);
}
const VALID_MODES = ['free_write', 'escalate', 'phrase_swap_drill', 'weak_spots_drill', 'translation_drill', 'error_correction_drill', 'article_drill_live', 'particle_sort_live', 'spelling_drill_live'];

// feedback_depth tiers drive per-player verbosity in drill prompts. See
// FAMILY_MEMBERS in index.html for the mapping. Worker validates the enum.
const FEEDBACK_DEPTH_TIERS = new Set(['light', 'medium-light', 'medium', 'medium-kid', 'detailed']);
const MAX_BODY_BYTES = 50 * 1024;
const MAX_TOKENS = 1024;
const ANTHROPIC_VERSION = '2023-06-01';

// phrase_swap_drill: default per-session item count (PWA can override via
// context.target_item_count, capped at PSD_MAX_ITEMS).
const PSD_DEFAULT_ITEMS = 6;
const PSD_MAX_ITEMS = 10;

// translation_drill: live RU→EN translation items themed to player profile +
// weak_patterns. Default ~8 items per session, hard cap 12.
const TD_DEFAULT_ITEMS = 8;
const TD_MAX_ITEMS = 12;

// error_correction_drill: live "one sentence, one error" items. Default ~8.
const ECD_DEFAULT_ITEMS = 8;
const ECD_MAX_ITEMS = 12;

// article_drill_live: live single-blank gap-fill items. Default ~10 (article
// drills are higher density per exercise-types.md type 7), max 15.
const ADL_DEFAULT_ITEMS = 10;
const ADL_MAX_ITEMS = 15;

// particle_sort_live: live phrasal-verb particle production drill. Default ~10,
// max 15. Per exercise-types.md type 8 — base verb shown, player produces the
// particle from semantic understanding (no menu).
const PSL_DEFAULT_ITEMS = 10;
const PSL_MAX_ITEMS = 15;

// spelling_drill_live: live Russian-gloss → English-spelling drill. Default 8,
// max 12. PWA can pass `spelling_pool` (entries from players/{name}/spelling_log
// since last drill) — worker prefers pool words when present, falls back to
// profile-driven generation otherwise.
const SDL_DEFAULT_ITEMS = 8;
const SDL_MAX_ITEMS = 12;

// Audio pipeline (/v1/audio): interview_prep + shadow_feedback. Hard caps:
//   - 25 MB body (~25 min of mobile-recorder webm/opus @ ~16 kbps speech)
//   - Artem-only at this stage; plans/audio-coach-pipeline.md gates rollout.
const AUDIO_MAX_BODY_BYTES = 25 * 1024 * 1024;
const AUDIO_VALID_MODES = new Set(['interview_prep']);
const AUDIO_ALLOWED_PLAYERS = new Set(['artem']);

export default {
  async fetch(request, env) {
    const cors = corsHeaders(env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== 'POST') {
      return jsonError(405, 'WORKER_VALIDATION', 'Method not allowed', false, cors);
    }

    // Origin check (shared by JSON + audio pipelines)
    const origin = request.headers.get('Origin');
    if (!env.ALLOWED_ORIGIN || origin !== env.ALLOWED_ORIGIN) {
      return jsonError(403, 'WORKER_VALIDATION', 'Origin not allowed', false, cors);
    }

    // Path-based dispatch. /v1/audio handles multipart audio uploads (Whisper +
    // Claude feedback pipeline). Everything else stays on the JSON pipeline.
    const pathname = new URL(request.url).pathname;
    if (pathname === '/v1/audio') {
      return handleAudio(request, env, cors);
    }

    // Body size (JSON pipeline only — audio path has its own cap)
    const declaredLen = parseInt(request.headers.get('Content-Length') || '0', 10);
    if (declaredLen > MAX_BODY_BYTES) {
      return jsonError(413, 'WORKER_VALIDATION', `Body exceeds ${MAX_BODY_BYTES} bytes`, false, cors);
    }

    let body, raw;
    try {
      raw = await request.text();
      if (raw.length > MAX_BODY_BYTES) {
        return jsonError(413, 'WORKER_VALIDATION', 'Body too large', false, cors);
      }
      body = JSON.parse(raw);
    } catch (e) {
      return jsonError(400, 'WORKER_VALIDATION', 'Invalid JSON', false, cors);
    }

    const { mode, model, messages, context, is_session_end } = body;

    if (!VALID_MODES.includes(mode)) {
      return jsonError(400, 'WORKER_VALIDATION', `Invalid mode "${mode}"`, false, cors);
    }
    const allowedModels = (env.ALLOWED_MODELS || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!allowedModels.includes(model)) {
      return jsonError(400, 'WORKER_VALIDATION', `Model "${model}" not in whitelist`, false, cors);
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return jsonError(400, 'WORKER_VALIDATION', 'messages must be a non-empty array', false, cors);
    }
    if (!context || !ALLOWED_PLAYERS.includes(context.player)) {
      return jsonError(400, 'WORKER_VALIDATION', 'Invalid or missing context.player', false, cors);
    }
    if (mode === 'escalate' && !context.exercise) {
      return jsonError(400, 'WORKER_VALIDATION', 'mode "escalate" requires context.exercise', false, cors);
    }
    if (mode === 'phrase_swap_drill') {
      const pool = context.phrase_pool;
      if (!Array.isArray(pool) || pool.length === 0) {
        return jsonError(400, 'WORKER_VALIDATION', 'mode "phrase_swap_drill" requires non-empty context.phrase_pool', false, cors);
      }
      // Each entry must have awkward + natural at minimum
      const bad = pool.find(e => !e || typeof e.awkward !== 'string' || typeof e.natural !== 'string');
      if (bad) {
        return jsonError(400, 'WORKER_VALIDATION', 'phrase_pool entries require {awkward, natural} strings', false, cors);
      }
    }
    if (mode === 'weak_spots_drill') {
      // No required context beyond player. coach_notes optional but expected.
      // topic_hint optional — when set, must be a string matching a catalog id or
      // an improvised free-text topic; worker forwards it to the system prompt.
      if (context.topic_hint != null && typeof context.topic_hint !== 'string') {
        return jsonError(400, 'WORKER_VALIDATION', 'context.topic_hint must be a string when set', false, cors);
      }
      // weakest_categories optional — array of {cat, topic_id, pct, n} from PWA-
      // side catStats analysis. Per P1 (operational-rules.md): weakest quiz
      // category is always a Weak Spots candidate, even if no weak_patterns
      // entry mentions it.
      if (context.weakest_categories != null && !Array.isArray(context.weakest_categories)) {
        return jsonError(400, 'WORKER_VALIDATION', 'context.weakest_categories must be an array when set', false, cors);
      }
    }
    // feedback_depth optional on every mode — drives drill verbosity per player.
    if (context.feedback_depth != null && !FEEDBACK_DEPTH_TIERS.has(context.feedback_depth)) {
      return jsonError(400, 'WORKER_VALIDATION', `context.feedback_depth must be one of: ${[...FEEDBACK_DEPTH_TIERS].join(', ')}`, false, cors);
    }
    // active_categories optional — Phase 2 routes cross-category drill content from these.
    // Empty array (Artem builder-shell-equivalent) → fall back to weak_patterns-driven generation.
    if (context.active_categories != null) {
      if (!Array.isArray(context.active_categories)) {
        return jsonError(400, 'WORKER_VALIDATION', 'context.active_categories must be an array when set', false, cors);
      }
      if (context.active_categories.find(c => typeof c !== 'string' || !c.trim())) {
        return jsonError(400, 'WORKER_VALIDATION', 'context.active_categories entries must be non-empty strings', false, cors);
      }
    }
    if (mode === 'translation_drill' || mode === 'error_correction_drill' || mode === 'article_drill_live' || mode === 'particle_sort_live' || mode === 'spelling_drill_live') {
      // target_item_count optional; capped server-side. focus_categories optional.
      if (context.target_item_count != null && (
            typeof context.target_item_count !== 'number' || context.target_item_count < 1)) {
        return jsonError(400, 'WORKER_VALIDATION', 'context.target_item_count must be a positive number when set', false, cors);
      }
      if (context.focus_categories != null && !Array.isArray(context.focus_categories)) {
        return jsonError(400, 'WORKER_VALIDATION', 'context.focus_categories must be an array when set', false, cors);
      }
    }
    if (mode === 'spelling_drill_live') {
      // spelling_pool optional — array of {word, last_attempt?, times_seen?} from spelling_log
      if (context.spelling_pool != null) {
        if (!Array.isArray(context.spelling_pool)) {
          return jsonError(400, 'WORKER_VALIDATION', 'context.spelling_pool must be an array when set', false, cors);
        }
        const bad = context.spelling_pool.find(e => !e || typeof e.word !== 'string' || !e.word.trim());
        if (bad) {
          return jsonError(400, 'WORKER_VALIDATION', 'spelling_pool entries require a non-empty word string', false, cors);
        }
      }
    }

    // Build system prompt server-side. Cache the stable preamble.
    const systemBlocks = buildSystemBlocks(mode, context, is_session_end);

    // Forward to Anthropic
    let upstream;
    try {
      upstream = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': ANTHROPIC_VERSION,
        },
        body: JSON.stringify({
          model,
          max_tokens: MAX_TOKENS,
          system: systemBlocks,
          messages,
        }),
      });
    } catch (e) {
      return jsonError(502, 'WORKER_TIMEOUT', `Upstream fetch failed: ${e.message}`, true, cors);
    }

    if (!upstream.ok) {
      const errText = await upstream.text();
      let code;
      if (upstream.status === 402) code = 'API_402';
      else if (upstream.status >= 500) code = 'API_5XX';
      else code = `API_${upstream.status}`;
      const retriable = upstream.status >= 500 || upstream.status === 429 || upstream.status === 408;
      return jsonError(upstream.status, code, `Anthropic API error: ${errText.slice(0, 500)}`, retriable, cors);
    }

    const data = await upstream.json();

    // Concatenate text blocks
    let content = '';
    if (Array.isArray(data.content)) {
      for (const b of data.content) {
        if (b.type === 'text' && typeof b.text === 'string') content += b.text;
      }
    }

    // Extract <session_meta>...</session_meta> on session-end requests
    let session_metadata = null;
    if (is_session_end) {
      const m = content.match(/<session_meta>([\s\S]*?)<\/session_meta>/);
      if (m) {
        try {
          session_metadata = JSON.parse(m[1].trim());
        } catch (e) {
          session_metadata = null;
        }
        content = content.replace(/<session_meta>[\s\S]*?<\/session_meta>/, '').trim();
      }
    }

    const usage = data.usage || {};
    return new Response(
      JSON.stringify({
        ok: true,
        content,
        tokens_used: {
          input: usage.input_tokens || 0,
          output: usage.output_tokens || 0,
          cache_read: usage.cache_read_input_tokens || 0,
          cache_creation: usage.cache_creation_input_tokens || 0,
        },
        model_used: data.model || model,
        session_metadata,
      }),
      { status: 200, headers: { 'content-type': 'application/json', ...cors } }
    );
  },
};

// ─── helpers ───────────────────────────────────────────────────────────────

function corsHeaders(env) {
  return {
    'access-control-allow-origin': env.ALLOWED_ORIGIN || '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'Content-Type',
    'access-control-max-age': '86400',
  };
}

function jsonError(status, code, message, retriable, cors) {
  return new Response(
    JSON.stringify({ ok: false, error_code: code, error_message: message, retriable }),
    { status, headers: { 'content-type': 'application/json', ...cors } }
  );
}

// ─── audio pipeline (/v1/audio) ────────────────────────────────────────────
//
// Day-1 skeleton per plans/audio-coach-pipeline.md: accept multipart audio,
// store to R2, transcribe via Workers AI Whisper-turbo, echo transcript back.
// No Claude call yet — that lands on Day 3 once the loop is verified.
//
// Request shape: multipart/form-data with two fields:
//   audio : Blob (webm/opus from MediaRecorder; <=25 MB)
//   meta  : JSON string {mode, player, session_id, turn}
//
// Response shape (Day 1):
//   { ok, transcript, audio_r2_key, mode, turn, duration_s? }
async function handleAudio(request, env, cors) {
  const declaredLen = parseInt(request.headers.get('Content-Length') || '0', 10);
  if (declaredLen > AUDIO_MAX_BODY_BYTES) {
    return jsonError(413, 'WORKER_VALIDATION', `Audio body exceeds ${AUDIO_MAX_BODY_BYTES} bytes`, false, cors);
  }

  let form;
  try {
    form = await request.formData();
  } catch (e) {
    return jsonError(400, 'WORKER_VALIDATION', `Invalid multipart body: ${e.message}`, false, cors);
  }

  const audio = form.get('audio');
  const metaRaw = form.get('meta');
  if (!audio || typeof audio === 'string') {
    return jsonError(400, 'WORKER_VALIDATION', 'Missing audio blob field', false, cors);
  }
  if (typeof metaRaw !== 'string') {
    return jsonError(400, 'WORKER_VALIDATION', 'Missing meta JSON field', false, cors);
  }

  let meta;
  try {
    meta = JSON.parse(metaRaw);
  } catch (e) {
    return jsonError(400, 'WORKER_VALIDATION', 'meta field is not valid JSON', false, cors);
  }

  if (!AUDIO_VALID_MODES.has(meta.mode)) {
    return jsonError(400, 'WORKER_VALIDATION', `Invalid audio mode "${meta.mode}"`, false, cors);
  }
  if (!AUDIO_ALLOWED_PLAYERS.has(meta.player)) {
    return jsonError(403, 'WORKER_VALIDATION', `Audio pipeline not enabled for player "${meta.player}"`, false, cors);
  }
  if (typeof meta.session_id !== 'string' || !meta.session_id.trim()) {
    return jsonError(400, 'WORKER_VALIDATION', 'meta.session_id required', false, cors);
  }
  if (!Number.isInteger(meta.turn) || meta.turn < 0) {
    return jsonError(400, 'WORKER_VALIDATION', 'meta.turn must be a non-negative integer', false, cors);
  }
  if (audio.size > AUDIO_MAX_BODY_BYTES) {
    return jsonError(413, 'WORKER_VALIDATION', `Audio blob exceeds ${AUDIO_MAX_BODY_BYTES} bytes`, false, cors);
  }

  if (!env.AUDIO) {
    return jsonError(500, 'WORKER_VALIDATION', 'R2 binding "AUDIO" not configured', false, cors);
  }
  if (!env.AI) {
    return jsonError(500, 'WORKER_VALIDATION', 'Workers AI binding not configured', false, cors);
  }

  // Persist to R2. Key shape: <mode>/<player>/<session_id>/turn-<n>-<ts>.<ext>
  const ts = Date.now();
  const ext = audioExtensionFromType(audio.type);
  const r2Key = `${meta.mode}/${meta.player}/${sanitizeId(meta.session_id)}/turn-${meta.turn}-${ts}.${ext}`;
  const audioBuf = await audio.arrayBuffer();
  try {
    await env.AUDIO.put(r2Key, audioBuf, {
      httpMetadata: { contentType: audio.type || 'application/octet-stream' },
      customMetadata: {
        mode: meta.mode,
        player: meta.player,
        session_id: meta.session_id,
        turn: String(meta.turn),
      },
    });
  } catch (e) {
    return jsonError(502, 'WORKER_TIMEOUT', `R2 put failed: ${e.message}`, true, cors);
  }

  // Transcribe via Workers AI Whisper-large-v3-turbo. Input is a base64-encoded
  // audio string (per Cloudflare's 2026-05-13 model docs — NOT number[] like
  // the older base @cf/openai/whisper model; passing an array gets rejected
  // with the misleading "Type mismatch of '/audio', 'string' not in 'array'"
  // error). The `language: "en"` hint helps for accented speech where auto-
  // detection sometimes misfires on heavy L1 substrate (e.g. Russian).
  let transcript = '';
  let whisperRaw = null;
  let duration_s = null;
  try {
    const audioB64 = arrayBufferToBase64(audioBuf);
    whisperRaw = await env.AI.run('@cf/openai/whisper-large-v3-turbo', {
      audio: audioB64,
      language: 'en',
    });
    // Transcript: top-level `text` on most response shapes; some variants nest
    // it under transcription_info. Handle both.
    transcript = '';
    if (whisperRaw) {
      if (typeof whisperRaw.text === 'string') transcript = whisperRaw.text;
      else if (whisperRaw.transcription_info && typeof whisperRaw.transcription_info.text === 'string') {
        transcript = whisperRaw.transcription_info.text;
      }
    }
    transcript = transcript.trim();
    // Duration: prefer explicit field; otherwise compute from last segment's
    // end timestamp (segments[].end is seconds; vtt is `MM:SS.mmm --> MM:SS.mmm`).
    duration_s = extractDurationSeconds(whisperRaw);
  } catch (e) {
    return jsonError(502, 'WORKER_TIMEOUT', `Whisper transcription failed: ${e.message}`, true, cors);
  }

  return new Response(
    JSON.stringify({
      ok: true,
      transcript,
      audio_r2_key: r2Key,
      mode: meta.mode,
      turn: meta.turn,
      duration_s,
      // Day-1 contract: caller knows no Claude feedback has run yet.
      echo: true,
    }),
    { status: 200, headers: { 'content-type': 'application/json', ...cors } }
  );
}

// Base64-encode an ArrayBuffer. Chunked to avoid `String.fromCharCode(...big)`
// stack overflow on large audio blobs (~5 MB+ would otherwise blow up).
function arrayBufferToBase64(buf) {
  const u8 = new Uint8Array(buf);
  const chunkSize = 8192;
  let binary = '';
  for (let i = 0; i < u8.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, u8.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

// Best-effort duration extraction from a Whisper response. Tries, in order:
//   1. top-level `duration` field (some Whisper variants emit it)
//   2. `segments[last].end` (seconds, native)
//   3. last `vtt` cue's end timestamp parsed as MM:SS.mmm or HH:MM:SS.mmm
// Returns null if no path yields a number.
function extractDurationSeconds(resp) {
  if (!resp || typeof resp !== 'object') return null;
  if (typeof resp.duration === 'number' && isFinite(resp.duration)) return resp.duration;
  const segs = Array.isArray(resp.segments) ? resp.segments : null;
  if (segs && segs.length > 0) {
    const last = segs[segs.length - 1];
    if (last) {
      if (typeof last.end === 'number' && isFinite(last.end)) return last.end;
      if (typeof last.vtt === 'string') {
        // Match the LAST timestamp range in the cue (segment may carry multi-line cues)
        const m = last.vtt.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\.(\d{1,3})\s*-->\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\.(\d{1,3})/);
        if (m) {
          // groups 5..8 are the end timestamp: HH? MM SS? mmm
          const hh = m[7] != null ? parseInt(m[5], 10) : 0;
          const mm = m[7] != null ? parseInt(m[6], 10) : parseInt(m[5], 10);
          const ss = m[7] != null ? parseInt(m[7], 10) : parseInt(m[6], 10);
          const mmm = parseInt(m[8], 10);
          return hh * 3600 + mm * 60 + ss + mmm / Math.pow(10, m[8].length);
        }
      }
    }
  }
  // Top-level vtt fallback — parse the last cue's end timestamp the same way
  if (typeof resp.vtt === 'string') {
    const matches = [...resp.vtt.matchAll(/(\d{1,2}):(\d{2})(?::(\d{2}))?\.(\d{1,3})\s*-->\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\.(\d{1,3})/g)];
    if (matches.length > 0) {
      const m = matches[matches.length - 1];
      const hh = m[7] != null ? parseInt(m[5], 10) : 0;
      const mm = m[7] != null ? parseInt(m[6], 10) : parseInt(m[5], 10);
      const ss = m[7] != null ? parseInt(m[7], 10) : parseInt(m[6], 10);
      const mmm = parseInt(m[8], 10);
      return hh * 3600 + mm * 60 + ss + mmm / Math.pow(10, m[8].length);
    }
  }
  return null;
}

function audioExtensionFromType(mime) {
  if (!mime) return 'bin';
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('mp4') || mime.includes('m4a') || mime.includes('aac')) return 'm4a';
  if (mime.includes('wav')) return 'wav';
  if (mime.includes('mpeg') || mime.includes('mp3')) return 'mp3';
  return 'bin';
}

function sanitizeId(s) {
  return String(s).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
}

function buildSystemBlocks(mode, context, isSessionEnd) {
  const blocks = [];
  let preamble;
  if (mode === 'free_write') preamble = freeWriteSystemPrompt(context);
  else if (mode === 'phrase_swap_drill') preamble = phraseSwapDrillSystemPrompt(context);
  else if (mode === 'weak_spots_drill') preamble = weakSpotsDrillSystemPrompt(context);
  else if (mode === 'translation_drill') preamble = translationDrillSystemPrompt(context);
  else if (mode === 'error_correction_drill') preamble = errorCorrectionDrillSystemPrompt(context);
  else if (mode === 'article_drill_live') preamble = articleDrillLiveSystemPrompt(context);
  else if (mode === 'particle_sort_live') preamble = particleSortLiveSystemPrompt(context);
  else if (mode === 'spelling_drill_live') preamble = spellingDrillLiveSystemPrompt(context);
  else preamble = escalateSystemPrompt(context);
  // Cache the stable preamble so turn-2+ reads it at ~10% input cost.
  blocks.push({ type: 'text', text: preamble, cache_control: { type: 'ephemeral' } });
  if (isSessionEnd) {
    blocks.push({ type: 'text', text: sessionEndInstructions(mode, context) });
  }
  return blocks;
}

function freeWriteSystemPrompt(ctx) {
  const playerName = capitalize(ctx.player);
  const level = ctx.level || 'B2';
  const focus = Array.isArray(ctx.focus_categories) && ctx.focus_categories.length
    ? ctx.focus_categories.join(', ')
    : '(none specified)';
  const weakPatterns = formatNotes(ctx.coach_notes && ctx.coach_notes.weak_patterns);
  const engagement = formatNotes(ctx.coach_notes && ctx.coach_notes.engagement_notes);
  const ru = explainInRussian(ctx);

  const languageBlock = ru
    ? `- **Explain mistakes and grammar rules in Russian.** ${playerName}'s English is intermediate but rule explanations land much better in her L1. Quote her actual English back when pointing out an error, then explain *in Russian* what's wrong and why.
- Show the corrected English form clearly (the suggested fix is in English; the *explanation* is in Russian).
- Use simple Russian; don't pile on linguistic terminology unless it genuinely helps. "Past simple", "present continuous", "preposition" / "предлог" — common terms are fine.
- Be encouraging but not effusive — focus on what's wrong and how to fix it. Avoid filler praise.
- Keep individual responses to ~150–250 words unless the player explicitly asks for more depth.
- **Don't always assign a follow-up rewrite.** When she makes the same kind of mistake repeatedly and a retry would lock the rule in, ask for one targeted rewrite. Otherwise just acknowledge what's been corrected and let her continue freely or wrap up — sessions shouldn't feel like a homework treadmill.
- After ~4–5 exchanges, gently surface the option to wrap up ("если хочешь, можем закругляться — или продолжим"). Don't keep assigning new tasks indefinitely.`
    : `- Give specific, actionable feedback in plain English with brief Russian glosses when a Russian comparison clarifies the rule.
- Be encouraging but not effusive — focus on what's wrong and how to fix it.
- Keep individual responses to ~150–250 words unless the player explicitly asks for more depth.
- **Don't always assign a follow-up rewrite.** When the same mistake repeats and a retry would lock the rule in, ask for one targeted rewrite. Otherwise just acknowledge what's been corrected and let them continue freely or wrap up.
- After ~4–5 exchanges, gently surface the option to wrap up. Don't keep assigning new tasks indefinitely.`;

  const toneBlock = ru
    ? `Tone: warm, direct, professional. Russian explanations help her see the rule; English quotes show what's actually being corrected. Avoid filler praise.`
    : `Tone: warm, direct, professional. Russian glosses are useful when a structural contrast helps. Avoid filler praise.`;

  return `You are an English language coach helping ${playerName}, a Russian-speaking learner at CEFR level ${level}. They are practising free writing — they will write text in English and you will help them improve.

Your role:
- Read what they write carefully.
- Identify the most important grammatical or lexical issues (focus: clarity and naturalness, not style preferences).
${languageBlock}

About this learner:
- L1: Russian
- Level: ${level}
- Focus categories: ${focus}
- Persistent weak patterns and stiff-phrase swaps to recast naturally (entries shaped \`awkward → natural [context]\` are register swaps, not errors — prefer the natural form when context fits, mirror-recast without flagging unless asked):
${weakPatterns}
- Engagement preferences:
${engagement}

${toneBlock}

If the player asks something off-topic from their writing, briefly redirect to the writing task — but if they have a genuine grammar question about something they wrote, engage fully.`;
}

function escalateSystemPrompt(ctx) {
  const playerName = capitalize(ctx.player);
  const level = ctx.level || 'B2';
  const ex = ctx.exercise || {};
  const expected = Array.isArray(ex.expected_answers) && ex.expected_answers.length
    ? ex.expected_answers.map(a => `"${a}"`).join(', ')
    : '(none)';
  const weakPatterns = formatNotes(ctx.coach_notes && ctx.coach_notes.weak_patterns);
  const ru = explainInRussian(ctx);

  const constraintsBlock = ru
    ? `Constraints:
- Single response, no follow-up questions.
- 200–400 words.
- **Explain in Russian.** Quote her submission verbatim ("${ex.submitted || ''}") at least once, then explain in Russian what went wrong and why.
- Show the corrected English form clearly (English quotes for forms; Russian for the explanation).
- If her answer was partially right, acknowledge what was right before addressing what was wrong.
- Provide one alternative example sentence in English with a short Russian explanation of the pattern.
- End with one sentence in Russian summarising the takeaway.`
    : `Constraints:
- Single response, no follow-up questions.
- 200–400 words.
- Reference their actual submission verbatim at least once.
- If their answer was partially right, acknowledge what was right before addressing what was wrong.
- Provide one alternative example sentence using the correct pattern, with a Russian gloss if structurally relevant.
- End with one sentence summarizing the takeaway.`;

  return `You are an English language coach providing additional explanation to ${playerName}, a Russian-speaking learner at CEFR level ${level}.

They just attempted this exercise:
- Prompt: "${ex.prompt || ''}"
- Expected answers: ${expected}
- They submitted: "${ex.submitted || ''}"

The system already gave them this feedback:
"${ex.pre_generated_feedback || ''}"

The player tapped "explain more" because the standard feedback wasn't sufficient. Explain in more depth and specifically address what they wrote.

${constraintsBlock}

About this learner:
- L1: Russian
- Level: ${level}
- Persistent weak patterns:
${weakPatterns}

Tone: warm, direct, slightly more pedagogical than free_write mode.`;
}

function phraseSwapDrillSystemPrompt(ctx) {
  const playerName = capitalize(ctx.player);
  const level = ctx.level || 'B2';
  const ru = explainInRussian(ctx);
  const depth = ctx.feedback_depth || 'medium';
  const pool = Array.isArray(ctx.phrase_pool) ? ctx.phrase_pool : [];
  const targetCount = Math.min(
    Math.max(1, Number(ctx.target_item_count) || PSD_DEFAULT_ITEMS),
    PSD_MAX_ITEMS
  );

  // Render the pool as a numbered list. Each entry: index, awkward → natural,
  // tag, status (active vs retest_due — informs which to mix in first).
  const poolBlock = pool.map((e, i) => {
    const tag = e.tag ? ` [${e.tag}]` : '';
    const status = e.status === 'retest_due' ? ' (retest)' : '';
    const altNatural = Array.isArray(e.also_accept) && e.also_accept.length
      ? ` — also accept: ${e.also_accept.map(s => `"${s}"`).join(', ')}`
      : '';
    return `  ${i + 1}. "${e.awkward}" → "${e.natural}"${tag}${status}${altNatural}`;
  }).join('\n');

  const cleanExample = ru
    ? '"Хорошо — \'a while ago\' звучит естественнее в обстановке паба, чем \'sometime ago\'."'
    : '"Nice — \'a while ago\' lands more natural in pub talk than \'sometime ago\'."';
  const languageBlock = feedbackDepthInstructions(depth, ru, cleanExample) + `

Drill-specific (register, not grammar):
- The cue is a Russian sentence ${playerName} translates into natural English. Never include the "awkward" form in the cue — the production challenge is recalling the natural form from semantic understanding.
- **Always surface the awkward alternative**, even on a correct natural production. Format: confirm the natural form, then briefly contrast with the stiff version they avoided. This builds explicit awareness for next time.
- When ${playerName} produces the stiff form (or another non-natural alternative), explain *why* the natural form lands better in the tagged context. Do NOT call the sentence "wrong" — both forms are grammatical; the issue is register/frequency.
- For phrase_swap_drill specifically, the ADAPTIVE FLOW sibling on a miss = another pool entry with the same tag (e.g. another [brit_expat] swap), so the lesson stays in-context.`;

  return `You are running a focused phrase-swap drill with ${playerName}, a Russian-speaking learner at CEFR level ${level}. The goal is to move stiff/calqued lexical phrases from passive recognition into active production by forcing them through a Russian→English cue.

Drill protocol:
1. Present one Russian cue at a time that naturally invites the **natural** form from the entry. Theme the cue around the entry's [tag] context (e.g. for [brit_expat]: pub/padel/dinner-party scenes; for [biz_oil]: meeting/email scenes).
2. Wait for ${playerName}'s English response.
3. Score leniently — the natural form OR any equivalent that fits the same register passes.
4. ${ru ? 'Reply in Russian' : 'Reply in English'} per the language rules below.
5. Move to the next cue. Aim for ${targetCount} cues total. Stop early if ${playerName} signals done.

CRITICAL RULES:
- **Never include the "awkward" or "natural" form in the cue itself.** The cue must be a clean Russian sentence; the production challenge is recalling the natural English form from semantic understanding of the context.
- **Register, not grammar.** "Sometime ago" is grammatically fine — it's just lower-frequency in spoken Brit-expat banter. Frame feedback as register/frequency, never as a grammar correction.
- **Don't lecture.** 1–2 sentences of register explanation per stiff production. Move on.
- **Mix retest entries (marked "(retest)") in early** — they're the ones whose mastery we're confirming. Don't save them for last.

${languageBlock}

${adaptiveFlowProtocol()}

About this learner:
- L1: Russian
- Level: ${level}
- Coach language: ${ru ? 'Russian' : 'English'}

Today's drill pool (${pool.length} entries; aim for ${targetCount} cues):
${poolBlock || '  (empty — fall back to small-talk, end the session politely)'}

Tone: focused, pacy, encouraging per your feedback-depth tier.

Open the session with TWO lines, then the first cue:
1. One-line greeting.
2. **One-line drill instruction** in ${ru ? 'Russian' : 'English'} — e.g. ${ru ? `"Я даю русскую фразу, ты переводишь на естественный английский — каждая фраза проверяет конкретный регистр-свап."` : `"I'll give you a Russian phrase — translate into natural English; each one tests a specific register swap."`}
3. The first Russian cue, on its own line.`;
}

function translationDrillSystemPrompt(ctx) {
  const playerName = capitalize(ctx.player);
  const level = ctx.level || 'B1';
  const ru = explainInRussian(ctx);
  const depth = ctx.feedback_depth || 'medium';
  const targetCount = Math.min(
    Math.max(1, Number(ctx.target_item_count) || TD_DEFAULT_ITEMS),
    TD_MAX_ITEMS
  );
  const activeCategories = Array.isArray(ctx.active_categories) ? ctx.active_categories : [];
  const weakPatterns = formatNotes(ctx.coach_notes && ctx.coach_notes.weak_patterns);
  const engagement = formatNotes(ctx.coach_notes && ctx.coach_notes.engagement_notes);
  const cleanExample = ru
    ? '"Хорошо — present perfect для опыта жизни."'
    : '"Got it — present perfect for life experience."';
  const languageBlock = feedbackDepthInstructions(depth, ru, cleanExample) + `

Drill-specific: quote ${playerName}'s English when an error appears; show the corrected English form in English; multiple correct answers are common — accept any form that preserves meaning AND uses the target structure.`;
  const contentBlock = activeContentBlock(activeCategories, weakPatterns, targetCount, 'translation');

  return `You are running a focused **translation drill** with ${playerName}, a Russian-speaking learner at CEFR level ${level}. RU cue → EN production, one item at a time. ${targetCount} items per session.

${contentBlock}

Drill protocol:
1. Generate one Russian cue at a time. Each cue targets a specific English structure within the content-source plan above.
2. Theme cues around ${playerName}'s real-life contexts (business/cycling/Bahrain expat for Artem; family/home/padel/Bahrain for Anna; school/K-pop/Bahrain teen life for Nicole; school/sports/reading for Ernest; IELTS-shaped topics for Egor). Generic stems are forbidden — every cue should feel like something ${playerName} would actually say.
3. Wait for ${playerName}'s English response.
4. Score against the target structure: pass if the structure is correctly used AND meaning is preserved; fail otherwise. Stylistic preferences don't fail an answer.
5. ${ru ? 'Reply in Russian' : 'Reply in English'} per the rules below. Move to the next item.
6. After ${targetCount} items (or earlier if the player signals done), wait for the session-end signal. Don't auto-wrap.

CRITICAL RULES:
- **Russian-only cues.** The cue is a single Russian sentence ${playerName} translates into English. Never include an English hint, target structure name, or partial translation in the cue.
- **Target structure declared internally, not to the player.** You know what structure each cue tests; ${playerName} produces from the Russian alone.
- **No keyword/transformation hybrids.** This is a straight translation, not a sentence-transformation. If the player needs a transform drill, that's a separate type — not this.
- **Lenient on form, strict on structure.** "I have been waiting since 3" and "I've been waiting since 3" both pass. "I am waiting since 3" fails (wrong tense).

${languageBlock}

${adaptiveFlowProtocol()}

About this learner:
- L1: Russian
- Level: ${level}
- Coach language: ${ru ? 'Russian' : 'English'}
- Persistent weak patterns (use to refine structure choice within each active category):
${weakPatterns}
- Engagement preferences:
${engagement}

Tone: focused, encouraging, paced. Keep replies tight per your feedback-depth tier, but always name the rule. Save the longer post-mortem for the session-end summary.

Open the session with TWO lines, then the first cue:
1. One-line greeting tied to ${playerName}.
2. **One-line drill instruction** in ${ru ? 'Russian' : 'English'} so the player knows what to do — e.g. ${ru ? `"Я даю русское предложение, ты переводишь на английский — целевая структура каждый раз новая."` : `"I'll give you a Russian sentence — translate it into English; each item targets a different structure."`}
3. The first Russian cue on its own line.`;
}

function errorCorrectionDrillSystemPrompt(ctx) {
  const playerName = capitalize(ctx.player);
  const level = ctx.level || 'B1';
  const ru = explainInRussian(ctx);
  const depth = ctx.feedback_depth || 'medium';
  const targetCount = Math.min(
    Math.max(1, Number(ctx.target_item_count) || ECD_DEFAULT_ITEMS),
    ECD_MAX_ITEMS
  );
  const activeCategories = Array.isArray(ctx.active_categories) ? ctx.active_categories : [];
  const weakPatterns = formatNotes(ctx.coach_notes && ctx.coach_notes.weak_patterns);
  const engagement = formatNotes(ctx.coach_notes && ctx.coach_notes.engagement_notes);
  const cleanExample = ru
    ? '"Точно — \'arrive\' с местом берёт *at* или *in*, не *to*."'
    : '"Right — \'arrive\' takes *at* or *in* for places, not *to*."';
  const languageBlock = feedbackDepthInstructions(depth, ru, cleanExample) + `

Drill-specific: quote the player's correction when scoring; accept either the full corrected sentence OR just the corrected portion (e.g. "in" suffices for "arrived to → arrived in").`;
  const contentBlock = activeContentBlock(activeCategories, weakPatterns, targetCount, 'error_correction');

  return `You are running an **error-correction drill** with ${playerName}, a Russian-speaking learner at CEFR level ${level}. One sentence per item, each contains exactly one deliberate error in English. ${targetCount} items per session.

${contentBlock}

Drill protocol:
1. Generate one English sentence at a time. The sentence contains exactly **one** error in a structure drawn from the content-source plan above.
2. Theme sentences around ${playerName}'s real-life contexts (business/cycling/Bahrain expat for Artem; family/home/padel/Bahrain for Anna; school/K-pop/Bahrain teen life for Nicole; school/sports/reading for Ernest; IELTS-shaped scenarios for Egor). Generic stems are forbidden.
3. Present the sentence on its own line. Do NOT tell ${playerName} where the error is or what type it is.
4. Wait for ${playerName}'s correction (either the full corrected sentence or just the fixed portion).
5. Score: pass if the player identified and corrected the right error; fail otherwise. If they "corrected" a non-error (stylistic preference) while missing the actual error, fail and point to the real error.
6. ${ru ? 'Reply in Russian' : 'Reply in English'} per the rules below. Move to the next item.
7. After ${targetCount} items (or earlier if the player signals done), wait for the session-end signal. Don't auto-wrap.

CRITICAL RULES:
- **Exactly one error per sentence.** Multiple errors confuse scoring and waste the item. Read your own sentence back before sending: count the errors.
- **No hints in the prompt.** Don't underline the error word, don't say "the verb is wrong", don't preface with "find the article error". The player produces the diagnosis from semantic understanding.
- **Errors must be grammatical, not stylistic.** "I am eating dinner at 6pm tonight" → no error. "I am eating dinner at 6pm yesterday" → tense error. Stylistic awkwardness ("It was bought by me") doesn't count unless it's genuinely ungrammatical.
- **Lenient on form, strict on target.** Accept "arrived in Paris", "in Paris", or just "in" for an "arrived to → at" item. Reject "she arrived to Paris" (uncorrected) or "she got to Paris" (sidesteps the target).

${languageBlock}

${adaptiveFlowProtocol()}

About this learner:
- L1: Russian
- Level: ${level}
- Coach language: ${ru ? 'Russian' : 'English'}
- Persistent weak patterns (use to refine error choice within each active category):
${weakPatterns}
- Engagement preferences:
${engagement}

Tone: focused, encouraging, paced. Keep replies tight per your feedback-depth tier; the longer post-mortem comes at session-end.

Open with TWO lines, then the first item:
1. One-line greeting.
2. **One-line drill instruction** in ${ru ? 'Russian' : 'English'} — e.g. ${ru ? `"Я даю предложение с одной ошибкой, ты исправляешь (полностью или только исправленную часть)."` : `"I'll show you sentences with one mistake — type the corrected version (or just the fix)."`}
3. The first sentence to correct, on its own line.`;
}

function spellingDrillLiveSystemPrompt(ctx) {
  const playerName = capitalize(ctx.player);
  const level = ctx.level || 'B1';
  const ru = explainInRussian(ctx);
  const depth = ctx.feedback_depth || 'medium';
  const targetCount = Math.min(
    Math.max(1, Number(ctx.target_item_count) || SDL_DEFAULT_ITEMS),
    SDL_MAX_ITEMS
  );
  const pool = Array.isArray(ctx.spelling_pool) ? ctx.spelling_pool : [];
  const poolBlock = pool.length
    ? pool.slice(0, 15).map((e, i) => {
        const last = e.last_attempt ? ` (last typed: "${e.last_attempt}")` : '';
        const times = e.times_seen ? ` ×${e.times_seen}` : '';
        return `  ${i + 1}. "${e.word}"${last}${times}`;
      }).join('\n')
    : '  (empty — generate from profile + weak_patterns)';
  const weakPatterns = formatNotes(ctx.coach_notes && ctx.coach_notes.weak_patterns);
  const engagement = formatNotes(ctx.coach_notes && ctx.coach_notes.engagement_notes);
  const cleanExample = ru
    ? '"Молодец — двойная *m* в \'accommodate\' — это всегда ловушка."'
    : '"Got it — doubled *m* in \'accommodate\' is a classic trap."';
  const languageBlock = feedbackDepthInstructions(depth, ru, cleanExample) + `

Drill-specific (spelling has three-tier scoring):
- Exact match (case-insensitive, whitespace-normalised): pass with the rule-naming acknowledgment described above.
- 1-2 letter typo / doubled letter / transposition: pass but show the correct form + the spelling trap note (this is the educate-on-near-miss path; treat it as a soft pass).
- Wrong word entirely (>2 letter difference or different lexeme): fail; give the correct word + brief disambiguation of what the Russian gloss meant. Apply the ADAPTIVE FLOW protocol below — generate a sibling item targeting the same trap class.`;

  return `You are running a **spelling drill** with ${playerName}, a Russian-speaking learner at CEFR level ${level}. Russian-gloss → English-spelling. ${targetCount} items per session.

Drill protocol:
1. Generate one item per turn. Each item presents a **Russian gloss** as the primary cue, plus a short **English disambiguation hint** that does NOT give away the spelling. Format:
   "часы (наручные) — worn on the wrist"  (target: watch)
   "решение (задачи) — answer to a problem"  (target: solution)
2. Word selection priority:
   a. If \`spelling_pool\` below is non-empty, drill those words first — these are words ${playerName} has actively asked Spell Help about (= self-flagged uncertainty).
   b. After the pool is exhausted (or if empty), generate words tied to ${playerName}'s profile themes + weak_patterns. Favour high-trap words at level ${level}: doubled letters (accommodate, occurrence), silent letters (Wednesday, receipt), ie/ei (achieve, ceiling), -tion/-sion, common confusables (their/there/they're at lower levels).
3. Wait for ${playerName}'s English spelling.
4. Score with three tiers:
   - **Exact match** (case-insensitive, whitespace-normalised): pass.
   - **Near miss** (1-2 letter typo, transposition, missing doubled letter): pass with a note quoting their attempt vs. correct + the spelling rule.
   - **Wrong word** (different word entirely, or >2 letter difference): fail; give the correct word + brief disambiguation of what the Russian gloss meant.
5. ${ru ? 'Reply in Russian' : 'Reply in English'} per the rules below. Move to the next item.
6. After ${targetCount} items (or earlier if the player signals done), wait for the session-end signal.

CRITICAL RULES:
- **Russian gloss is the primary cue.** The English hint is for disambiguation only — it must not contain or rhyme with the target word, and must not be a synonym so obvious the player can guess without spelling.
- **No spelling hints in the prompt.** Don't write "starts with W" or "5 letters" or any letter-by-letter scaffolding.
- **One word per item.** Don't drill phrases or compounds (except hyphenated compounds where the hyphen is part of the spelling, e.g. "well-being").
- **Pool words first.** When \`spelling_pool\` is populated, every pool entry should appear before you generate new ones. Mix order so the player doesn't see them in source-list order.

${languageBlock}

${adaptiveFlowProtocol()}

About this learner:
- L1: Russian
- Level: ${level}
- Coach language: ${ru ? 'Russian' : 'English'}
- Persistent weak patterns (use as hints for which trap classes to favour):
${weakPatterns}
- Engagement preferences:
${engagement}

Today's spelling pool (${pool.length} entries; aim for ${targetCount} items total):
${poolBlock}

Tone: focused, encouraging, paced per your feedback-depth tier. Spelling rewards repetition + targeted rules.

Open with TWO lines, then the first item:
1. One-line greeting.
2. **One-line drill instruction** in ${ru ? 'Russian' : 'English'} — e.g. ${ru ? `"Я даю русское слово + короткое английское определение; ты пишешь, как пишется это слово по-английски."` : `"I'll give you a Russian word + a short English hint; type the English spelling."`}
3. The first item (Russian gloss + English hint), on its own line.`;
}

function particleSortLiveSystemPrompt(ctx) {
  const playerName = capitalize(ctx.player);
  const level = ctx.level || 'B1';
  const ru = explainInRussian(ctx);
  const depth = ctx.feedback_depth || 'medium';
  const targetCount = Math.min(
    Math.max(1, Number(ctx.target_item_count) || PSL_DEFAULT_ITEMS),
    PSL_MAX_ITEMS
  );
  const weakPatterns = formatNotes(ctx.coach_notes && ctx.coach_notes.weak_patterns);
  const engagement = formatNotes(ctx.coach_notes && ctx.coach_notes.engagement_notes);
  const cleanExample = ru
    ? '"Точно — *figure out* = понять, разобраться."'
    : '"Right — *figure out* = understand or solve."';
  const languageBlock = feedbackDepthInstructions(depth, ru, cleanExample) + `

Drill-specific: on a miss, quote what ${playerName} typed, name the meaning their particle would convey, then give the rule-correct particle + meaning. Naming the PV's meaning (not just the particle) is what builds the production-side recall.`;

  return `You are running a **phrasal-verb particle drill** with ${playerName}, a Russian-speaking learner at CEFR level ${level}. PV production challenge — base verb shown, player produces the particle from semantic understanding of the context. ${targetCount} items per session.

Drill protocol:
1. Generate one short sentence per turn that uses a phrasal verb. The **base verb appears in the sentence** (correctly conjugated); the **particle(s) are replaced with \`___\`**. Example: "She finally figured ___ what was wrong with the engine." (target particle: out)
2. Rotate across 3 PV difficulty tiers — don't drill the same tier twice in a row unless a slip warrants it:
   - **literal/transparent** (high-frequency: pick up, turn on/off, look for, put down)
   - **figurative single-particle** (opaque meaning, must be memorised: get across, bring about, follow up on, take on, put off)
   - **3-part PV + register switching** (put up with, get away with, look forward to, come up against; formal-vs-informal pairs like tolerate / put up with)
3. Theme sentences around ${playerName}'s real-life contexts (business/cycling/Bahrain expat for Artem; family/home/padel for Anna; school/K-pop for Nicole; school/sports for Ernest; IELTS scenarios for Egor). Generic stems are forbidden.
4. Wait for ${playerName}'s particle response. Accept the particle alone ("out"), or the verb+particle pair ("figured out"). For 3-part PVs, the entire particle group fills \`___\` (e.g. "forward to" for "look ___ the meeting" if the intended PV is "look forward to").
5. Score: pass if the player's particle yields the rule-correct PV given the sentence's intended meaning. Fail if it produces a different meaning or no valid PV.
6. ${ru ? 'Reply in Russian' : 'Reply in English'} per the rules below. Move to the next item.
7. After ${targetCount} items (or earlier if the player signals done), wait for the session-end signal.

CRITICAL RULES:
- **Never reveal the full PV anywhere in the prompt.** Show only the base verb + \`___\`. Don't write "the phrasal verb is FIGURE OUT" or hint at the particle. The production challenge is recalling the particle.
- **Don't drill ambiguous slots.** Pick PVs where exactly one particle yields the intended meaning given the context. If multiple particles could fit ("look up" vs "look at" vs "look for" all grammatical), tighten the context until only one is meaningful.
- **Conjugate the base verb correctly.** Past tense, third-person -s, etc. The verb gives ${playerName} the syntactic anchor; the particle is the semantic challenge.
- **For 3-part PVs**, place the entire particle group at \`___\`. Don't split across multiple blanks.

${languageBlock}

${adaptiveFlowProtocol()}

About this learner:
- L1: Russian
- Level: ${level}
- Coach language: ${ru ? 'Russian' : 'English'}
- Persistent weak patterns (favor PV families that map to these):
${weakPatterns}
- Engagement preferences:
${engagement}

Tone: focused, encouraging, paced per your feedback-depth tier. PV production rewards rule-naming + repetition.

Open with TWO lines, then the first item:
1. One-line greeting.
2. **One-line drill instruction** in ${ru ? 'Russian' : 'English'} — e.g. ${ru ? `"Я даю предложение с базовым глаголом и пропуском (\\\`___\\\`) на месте частицы; ты пишешь частицу, которая делает осмысленный фразовый глагол."` : `"I'll show you a sentence with the base verb in place and \\\`___\\\` for the particle — type the particle that completes the phrasal verb."`}
3. The first sentence (base verb visible, \`___\` for the particle), on its own line.`;
}

function articleDrillLiveSystemPrompt(ctx) {
  const playerName = capitalize(ctx.player);
  const level = ctx.level || 'B1';
  const ru = explainInRussian(ctx);
  const depth = ctx.feedback_depth || 'medium';
  const targetCount = Math.min(
    Math.max(1, Number(ctx.target_item_count) || ADL_DEFAULT_ITEMS),
    ADL_MAX_ITEMS
  );
  const weakPatterns = formatNotes(ctx.coach_notes && ctx.coach_notes.weak_patterns);
  const engagement = formatNotes(ctx.coach_notes && ctx.coach_notes.engagement_notes);
  const cleanExample = ru
    ? '"Правильно — нулевой артикль с generic countable plural."'
    : '"Right — zero article for generic plural."';
  const languageBlock = feedbackDepthInstructions(depth, ru, cleanExample) + `

Drill-specific: name the article rule by sub-category (first-mention indefinite / definite shared referent / generic zero / fixed-expression zero). Accept "—" or "-" or "zero" or "dash" or "no article" or "ноль" / "ничего" for the zero-article case.`;

  return `You are running an **article drill** with ${playerName}, a Russian-speaking learner at CEFR level ${level}. Russian L1 doesn't mark articles, so this is a fossilised gap for every family member — drill it dense and conversational. ${targetCount} items per session.

Drill protocol:
1. Generate one short sentence per turn with exactly **one** blank where an article is required. Use \`___\` for the blank.
2. Rotate target categories across items (don't drill the same category twice in a row):
   - **indefinite vs zero** (first-mention countable singular vs mass/plural generic)
   - **definite for shared/identified referent** (second-mention, post-modifier, unique referent)
   - **zero for generic / abstract / uncountable** (e.g. "___ music makes me happy")
   - **fixed-expression exceptions** (in ___ hospital, by ___ car, at ___ school)
3. Theme sentences around ${playerName}'s real-life contexts — business/cycling/Bahrain expat for Artem; family/home/padel for Anna; school/K-pop for Nicole; school/sports for Ernest; IELTS scenarios for Egor. Generic stems are forbidden.
4. Wait for ${playerName}'s answer (one article: a, an, the, or zero).
5. Score: pass if the article matches the structural target. Stylistic preferences don't fail an answer; only the rule-required article passes.
6. ${ru ? 'Reply in Russian' : 'Reply in English'} per the rules below. Move to the next item.
7. After ${targetCount} items (or earlier if the player signals done), wait for the session-end signal.

CRITICAL RULES:
- **Exactly one blank per sentence.** Multi-blank scenes are a different drill format and confuse single-token scoring.
- **No hints in the prompt.** Don't preface with "indefinite article needed" or "this is a first-mention case". The player produces the diagnosis from the sentence context alone.
- **Target rotation is internal.** You know what category each blank tests; ${playerName} just sees the sentence.
- **Zero article gets equal billing.** Russian speakers over-supply "the"; many items should have zero as the target to break that habit.
- **Format the prompt cleanly.** One short sentence (8-15 words) with one \`___\` blank. No multi-sentence scenes for v1.

${languageBlock}

${adaptiveFlowProtocol()}

About this learner:
- L1: Russian
- Level: ${level}
- Coach language: ${ru ? 'Russian' : 'English'}
- Persistent weak patterns (rotate article sub-categories that map to these):
${weakPatterns}
- Engagement preferences:
${engagement}

Tone: focused, encouraging, paced per your feedback-depth tier. The article system rewards rule-naming + repetition.

Open with TWO lines, then the first item:
1. One-line greeting.
2. **One-line drill instruction** in ${ru ? 'Russian' : 'English'} — e.g. ${ru ? `"Я даю короткое предложение с пропуском (\\\`___\\\`); ты пишешь нужный артикль (\\\`a\\\`, \\\`an\\\`, \\\`the\\\` или \\\`—\\\` для нулевого)."` : `"I'll give you a short sentence with one \\\`___\\\` blank — type the article that fits (\\\`a\\\`, \\\`an\\\`, \\\`the\\\`, or \\\`—\\\` for zero)."`}
3. The first sentence (with one \`___\` blank), on its own line.`;
}

function weakSpotsDrillSystemPrompt(ctx) {
  const playerName = capitalize(ctx.player);
  const level = ctx.level || 'B2';
  const ru = explainInRussian(ctx);
  const weakPatterns = formatNotes(ctx.coach_notes && ctx.coach_notes.weak_patterns);
  const recentObs = formatRecentObservations(ctx.coach_notes && ctx.coach_notes.recent_observations);
  const engagement = formatNotes(ctx.coach_notes && ctx.coach_notes.engagement_notes);
  const topicHint = (typeof ctx.topic_hint === 'string' && ctx.topic_hint.trim()) ? ctx.topic_hint.trim() : null;

  const languageBlock = ru
    ? `- **Deliver explanations and mechanics in Russian.** Quote English forms in English; the meta-language is Russian.
- Encourage briefly when production lands; explain *why* in Russian when it misses.
- Keep replies focused — 150-250 words for mechanics blocks, shorter for production feedback.`
    : `- Deliver explanations in English with brief Russian glosses only when an L1 contrast clarifies the rule.
- Encourage briefly when production lands; explain *why* in English when it misses.
- Keep replies focused — 150-250 words for mechanics blocks, shorter for production feedback.`;

  // P1 (operational-rules.md): weakest_categories from PWA catStats are
  // MANDATORY candidates for the topic proposal, regardless of weak_patterns
  // prose. The PWA computes bottom-N categories (<70%, n>=5) and maps each to
  // its catalog topic_id; this list MUST appear in the proposal.
  const weakestCats = Array.isArray(ctx.weakest_categories) ? ctx.weakest_categories : [];
  const weakestCatsBlock = weakestCats.length
    ? weakestCats.map(c => `  - ${c.cat || '?'} (${c.pct ?? '?'}%, n=${c.n ?? '?'}) → topic \`${c.topic_id || '?'}\``).join('\n')
    : '  (none — empty signal, fall back to weak_patterns regex matching only)';

  const openingDirective = topicHint
    ? `The player has already named the topic: "${topicHint}". Skip the topic-proposal turn. Open with: a one-line confirmation + the tier ladder for the topic + the first tier's mechanics block and worked example.`
    : `Open the session by scanning ${playerName}'s weak_patterns + recent_observations AND the weakest_categories block below. Propose 2-3 topics from the catalog. **MANDATORY**: every topic_id in weakest_categories MUST appear in the proposal (P1 — weakest quiz category is always a Weak Spots candidate, per references/operational-rules.md). Beyond those, add up to (3 minus weakest count) extra topics that match weak_patterns via the "Matches" regex hint. Format: a one-line greeting, then a numbered list of proposed topics (one line each, with the catalog name + a 6-10 word reason — for weakest_categories entries, mention the accuracy and sample size). End with: "Which one — or name your own?" Wait for ${playerName} to pick before proceeding.`;

  return `You are an English language coach running a depth-focused **Weak Spots** session with ${playerName}, a Russian-speaking learner at CEFR level ${level}. The session is ~30 minutes, one topic, conversational, ladder-walked from simple to hard.

Your role:
- Pick (or accept) one topic from the catalog. Walk its tier ladder in order.
- For each tier: present the mechanic in 2-3 sentences + one worked example transformation, then ask ${playerName} to produce 1-3 items at that tier. Move up only when production lands cleanly (no L1 calque, no structural slip).
- If ${playerName}'s production at a tier is shaky, stay at that tier for another item. Don't pad — move on once it clicks.
- Adapt mechanics-first vs drill-first based on recent_observations: if you find a session on the same topic in the last ~14 days, skip the long mechanics block and drop into production with a one-line recap. Otherwise teach the mechanics.
${languageBlock}

About this learner:
- L1: Russian
- Level: ${level}
- Coach language: ${ru ? 'Russian' : 'English'}
- Persistent weak patterns:
${weakPatterns}
- Recent observations (last sessions, newest first):
${recentObs}
- Engagement preferences:
${engagement}
- Weakest quiz categories (P1 — mandatory candidates in topic proposal):
${weakestCatsBlock}

### Topic catalog

For each topic: matching regex against weak_patterns, then the tier ladder. Each tier carries one or two production-cue templates the player can adapt; theme cues around the player's profile contexts (business/cycling/Bahrain expat for Artem; family/home/padel for Anna; school/K-pop/friends for Nicole; school/sports/reading for Ernest; IELTS topics for Egor).

**1. emphasis_clefts** — Matches: /cleft|emphasis|inversion|fronting|emphatic/i
  - T1 it-clefts. Mechanic: It + be + [spotlight] + that/who + [rest]. Use *who* if the element is a person, *that* otherwise. Example: "Sarah flagged the error" → "It was Sarah who flagged the error." Cue: rewrite a plain sentence to spotlight a non-subject element (object, time, reason).
  - T2 wh-/pseudo-clefts. Mechanic: What + [subject + verb] + is/was + [spotlight]. Example: "We need more time" → "What we need is more time." Cue: spotlight a noun phrase via fronting the rest as a wh-clause.
  - T3 negative/restrictive fronting + inversion. Mechanic: front a negative/restrictive adverbial (Only after, Never, Not until, Hardly, Rarely, No sooner), then **subject-auxiliary inversion**. Example: "We realised only after the audit" → "Only after the audit did we realise…" Cue: rewrite using the fronted adverbial — the inversion is what carries the weight, and is the hard part.
  - T4 emphatic *do*, fronting, "all"-clefts. Mechanic: *do/did* before a bare verb for contrastive emphasis ("I did warn them"); "all" + clause + is + X ("All she wants is honesty"). Cue: rewrite to push back on an implied doubt or to narrow down.

**2. article_system** — Matches: /article|a→the|zero.*the|the.*zero|a\\/an/i
  - T1 indefinite vs zero. Mechanic: singular countable nouns introduced for the first time take *a/an*; mass and plural generics take zero. Example: "I bought ___ car" → "a car"; "I like ___ coffee" → zero. Cue: complete a sentence with first-mention countables and mass nouns mixed.
  - T2 definite for shared/identified referent. Mechanic: *the* when the referent is identifiable to both speakers — second mention, unique referent, defined by a relative clause or post-modifier. Example: "___ contractor we hired missed ___ deadline" → "the contractor we hired missed the deadline." Cue: identify which nouns are shared-knowledge in a short scene.
  - T3 zero for generic/abstract/uncountable. Mechanic: bare noun for generic statements ("___ music makes me happy"), abstract nouns ("___ honesty matters"), uncountable mass. Cue: rewrite a sentence from concrete-instance to generic.
  - T4 fixed-expression exceptions. Mechanic: institutional zero ("in ___ hospital" = as a patient; "at ___ school" = as a student), transport zero ("by ___ car"), meal zero ("after ___ dinner"). Cue: complete idiomatic phrases; flag when the "rule" mismatches.

**3. present_perfect_vs_past_simple** — Matches: /present perfect|past simple|tense|since|for|ago|past simple irregular/i
  - T1 experience vs finished event. Mechanic: present perfect for life-experience or result-now ("I've been to Paris"); past simple for a finished time ("I went there last year"). Cue: same event, two framings — choose the right tense given the time marker.
  - T2 *since/for* vs *ago*; state vs action. Mechanic: *since* anchors a point; *for* a duration; *ago* takes past simple. Example: "I have been waiting since 3" / "for two hours" / "I started waiting two hours ago." Cue: translate from Russian where the tense choice is forced by the time adverbial.
  - T3 continuous + adverbs. Mechanic: present perfect continuous emphasises duration ("I've been waiting"); *just / already / yet / recently* with present perfect. Cue: rewrite a present-simple-continuous sentence into the perfect frame.

**4. preposition_clusters** — Matches: /preposition|arrive|to.*at|verb\\+prep|at\\/on\\/in/i
  - T1 motion vs location. Mechanic: *arrive at* (specific point) / *arrive in* (city or country); *go to* / *get to*; *into* (motion entering); *on* (surface) / *in* (enclosed). Cue: translate sentences with motion + location pairs from Russian.
  - T2 time prepositions. Mechanic: *at* + clock/festival ("at 3", "at Christmas"); *on* + day/date; *in* + month/year/part-of-day, with exceptions (*at night*, *in the morning* but *on Monday morning*). Cue: complete a short itinerary with time prepositions.
  - T3 verb+preposition collocations. Mechanic: many verbs require a specific preposition that doesn't translate from Russian: *depend on*, *look for* (search) / *look at* (visual), *agree with* (a person) / *agree on* (a thing), *listen to*, *think about/of*. Cue: rewrite sentences where the Russian verb takes a different preposition.

**5. phrasal_verb_production** — Matches: /phrasal|particle|PV|get across|bring about|follow up/i
  - T1 literal/transparent PV. Mechanic: high-frequency PVs where particle direction is intuitive: *pick up*, *turn on/off*, *look for*, *put down*. Cue: produce the PV from a Russian sentence — particle from semantic understanding.
  - T2 figurative single-particle. Mechanic: opaque meaning, must be memorised: *get across* (communicate), *bring about* (cause), *follow up on* (chase), *take on* (accept responsibility), *put off* (postpone). Cue: produce the PV; if learner uses the base verb only or a wrong particle, give the semantic rationale.
  - T3 3-part PV + register switching. Mechanic: *put up with*, *get away with*, *look forward to*, *come up against*; formal-vs-informal pairs (*tolerate* / *put up with*; *cause* / *bring about*). Cue: rewrite a stiff/formal sentence into a register-appropriate PV form.

**6. hedge_variety** — Matches: /hedge|intensifier|maybe.*default|definitely.*default|productive variety|register variety/i
  - T1 spot-and-substitute. Mechanic: Russian *может быть / наверное / пожалуй / возможно* all default to "maybe"; intensifiers *безусловно / однозначно / точно* default to "definitely". One occurrence is fine; back-to-back makes speech monotonous. Pick ONE alternative per default. Hedges: *perhaps / I think / possibly / I'd say*. Intensifiers: *clearly / absolutely / certainly* — or zero-marking, which is often the strongest move ("it's not a managerial position" beats "it's definitely not a managerial position"). Cue: rewrite 2-3 short sentences, replacing one "maybe" or "definitely" each with a different alternative.
  - T2 match-to-register. Mechanic: alternatives carry different weights. *Perhaps* leans formal/written; *I wonder if* signals genuine speculation; *could we / what if we* turns a hedge into a suggestion; *possibly* is a light hedge; *I think* is mid-strength commitment. For intensifiers: *clearly* (assertion-strengthening), *absolutely* (agreement), *certainly* (formal), zero-marking (strongest). Cue: pick the right alternative for a sentence with a stated register target — pub chat vs business email vs CC instruction.
  - T3 variety across consecutive sentences. Mechanic: in a longer turn, avoid back-to-back same-hedge. The natural rhythm is hedge → assertion → soft-hedge, not maybe → maybe → maybe. Alternate based on subtle differences: speculation, commitment, suggestion. Cue: produce a 4-5 sentence opinion paragraph on a player-themed topic (Artem: a business call, a ride-strategy debate, a CC plan; Anna: a padel match, a parenting choice; Nicole: a school decision; Ernest: a sports debate; Egor: an IELTS opinion prompt) using **at least 3 different** hedge/intensifier patterns.

### Session protocol

${openingDirective}

Once the topic is set:
1. State the tier ladder in 2-3 lines so the player sees the arc ("Four tiers — we'll start at it-clefts and build to fronting + inversion").
2. Walk the ladder tier by tier. For each tier, decide mechanics-first vs drill-first based on recent_observations.
3. Production items: 1-3 per tier. Move up when the player lands at least one clean. Drop a rung only if production breaks the structural target — never for stylistic preference.
4. Catalog-miss: if the player free-typed a topic outside the 5 above, improvise a 3-tier ladder (mechanics-first → guided production → free production). Pace identically.

### Pacing and length

Target ~30 minutes, 15-20 items total. Soft wrap-up nudge at turn 12 ("we've covered a lot — want to push one more tier or wrap here?"). Hard end at turn 18 — call the session yourself with a recap.

Tone: warm, direct, pedagogical. This is the depth session, not a chat. Lecture sparingly; let the production do the teaching.`;
}

function formatRecentObservations(value) {
  if (!Array.isArray(value) || !value.length) return '  (no recent observations)';
  return value.slice(0, 5).map(o => {
    const date = (o && o.date) ? o.date : '????-??-??';
    const note = (o && o.note) ? String(o.note).slice(0, 200) : '(no note)';
    return `  - ${date}: ${note}`;
  }).join('\n');
}

function sessionEndInstructions(mode, ctx) {
  if (mode === 'phrase_swap_drill') {
    const ru = explainInRussian(ctx);
    const tableHeader = ru
      ? `Сохранено.`
      : `Saved.`;
    const feedbackAsk = ru
      ? `Как ощущения? Одной фразой — или пропусти.`
      : `How did that feel? One sentence — or skip.`;
    return `Your final message must contain TWO parts in this exact order:

PART 1 — Player-facing close (visible in chat). Short closing line + a markdown table + feedback ask, total ≤10 lines:

**${tableHeader}**

| | |
|---|---|
| Score | <N produced natural> of <total drilled> natural |
| Mastered today | <natural form in quotes, or "—" if none crossed the 3-clean threshold this session> |
| Up next | <count> phrases active, <count> retest in ~3 weeks |

${feedbackAsk}

Hide internal field names, session IDs, and status codes from the table. If a row would wrap to a 3rd line, abbreviate ("4 new phrases — say 'show me' for the list"). The "Mastered today" row reflects only entries where this session was the 3rd clean rep — usually empty; that's fine.

PART 2 — Metadata block at the very end, wrapped in <session_meta>...</session_meta>:
{
  "phrase_swaps_drilled": [
    {"awkward": "sometime ago", "natural": "a while ago", "tag": "brit_expat", "produced_natural": true},
    {"awkward": "we will investigate", "natural": "we'll look into it", "tag": "biz_oil", "produced_natural": false}
  ],
  "topics_covered": ["padel match", "team review"],
  "session_summary": "One sentence on overall production quality and which entries felt close vs. distant."
}

For "phrase_swaps_drilled": one entry per pool item that was actually drilled (skip any not reached). \`produced_natural: true\` if the learner produced the natural form (or a register-equivalent) on first attempt; \`false\` if they produced the stiff form or a non-equivalent alternative. This array is the input to phrase_tracker lifecycle transitions — accuracy here drives ⚪→🔵→🟡→🟢→🏆 progression.

The PWA strips the <session_meta> block before display; PART 1 is what the player sees.`;
  }
  if (mode === 'translation_drill' || mode === 'error_correction_drill' || mode === 'article_drill_live' || mode === 'particle_sort_live' || mode === 'spelling_drill_live') {
    const ru = explainInRussian(ctx);
    const tableHeader = ru ? `Сохранено.` : `Saved.`;
    const feedbackAsk = ru ? `Как ощущения? Одной фразой — или пропусти.` : `How did that feel? One sentence — or skip.`;
    const isEC = mode === 'error_correction_drill';
    const isAD = mode === 'article_drill_live';
    const isPS = mode === 'particle_sort_live';
    const isSD = mode === 'spelling_drill_live';
    const topicLabel = isSD ? 'spelling_drill_live' : (isPS ? 'particle_sort_live' : (isAD ? 'article_drill_live' : (isEC ? 'error_correction_drill' : 'translation_drill')));
    const exampleItem = isSD
      ? `{"prompt_gloss": "часы (наручные) — worn on the wrist", "submitted": "wach", "target_word": "watch", "produced_correct": false}`
      : (isPS
        ? `{"prompt_sentence": "She finally figured ___ the answer.", "submitted": "out", "target_structure": "pv_figure_out", "produced_correct": true}`
        : (isAD
          ? `{"prompt_sentence": "I bought ___ car last week.", "submitted": "a", "target_structure": "indefinite_first_mention_countable", "produced_correct": true}`
          : (isEC
            ? `{"prompt_sentence": "She arrived to Paris yesterday.", "submitted": "She arrived in Paris yesterday.", "category": "Prepositions", "target_structure": "preposition_at_arrive", "produced_correct": true}`
            : `{"prompt_ru": "Я жду тебя в аэропорту с трёх.", "submitted": "I am waiting...", "category": "Tenses", "target_structure": "present_perfect_continuous", "produced_correct": false}`)));
    const categoryFieldHint = (isEC || (!isSD && !isPS && !isAD && !isEC))  /* EC or TD */
      ? ` Include a \`category\` field on each item matching the active category targeted (verbatim from the CONTENT SOURCE plan above); omit \`category\` only when no active window was set (then the plan said to fall back to weak_patterns).`
      : '';
    const itemsHint = isSD
      ? `For "items_drilled": one entry per item drilled. \`prompt_gloss\` is the Russian gloss + English hint you presented. \`submitted\` is what the player typed. \`target_word\` is the correct English spelling. \`produced_correct: true\` for exact match OR 1-2 letter near miss; \`false\` for wrong word entirely. Track the trap-class hint in \`target_structure\` when set (e.g. "doubled_letters", "silent_letters", "ie_ei_rule") — optional.`
      : (isPS
        ? `For "items_drilled": one entry per item drilled. \`prompt_sentence\` is the sentence you presented with the base verb visible and \`___\` for the particle. \`submitted\` is the particle (or verb+particle) the player typed. \`target_structure\` is a snake_case label of the PV being drilled, prefixed \`pv_\` (e.g. "pv_figure_out", "pv_get_across", "pv_put_up_with"). \`produced_correct: true\` only if the player's particle yields the rule-correct PV on first attempt.`
        : (isAD
          ? `For "items_drilled": one entry per item drilled. \`prompt_sentence\` is the sentence you presented with the \`___\` blank. \`submitted\` is the article the player typed ("a" / "an" / "the" / "—" or equivalent). \`target_structure\` is a snake_case label for the article sub-category tested (e.g. "indefinite_first_mention_countable", "definite_shared_referent", "zero_generic_mass", "fixed_expression_zero"). \`produced_correct: true\` only if the article matches the rule-required answer on first attempt.`
          : (isEC
            ? `For "items_drilled": one entry per item drilled. \`prompt_sentence\` is the English sentence you presented with the embedded error. \`submitted\` is what the player typed (full sentence or just the fix). \`target_structure\` is a snake_case label for the error type (e.g. "preposition_at_arrive", "article_definite_shared_referent", "present_perfect_omission"). \`produced_correct: true\` only if the player identified AND fixed the right error on first attempt.${categoryFieldHint}`
            : `For "items_drilled": one entry per item actually drilled. \`target_structure\` is a snake_case label for the English structure tested (e.g. "present_perfect_continuous", "preposition_at_arrive", "article_definite_shared_referent"). \`produced_correct: true\` only if the target structure was correctly used AND meaning preserved on first attempt.${categoryFieldHint}`)));
    return `Your final message must contain TWO parts in this exact order:

PART 1 — Player-facing close (visible in chat). Short closing line + a markdown table + feedback ask, total ≤10 lines:

**${tableHeader}**

| | |
|---|---|
| Score | <clean> of <drilled> |
| Strongest | <target structure with cleanest production> |
| Slipped on | <target structure(s) with most misses, comma-sep ≤2> |

${feedbackAsk}

Hide internal field names from the table. If "Slipped on" would be empty, write "—".

PART 2 — Metadata block at the very end, wrapped in <session_meta>...</session_meta>:
{
  "items_drilled": [
    ${exampleItem},
    {"...": "..."}
  ],
  "error_patterns_observed": ["pattern_id_1", "awkward → natural [tag]"],
  "topics_covered": ["${topicLabel}"],
  "pvs_used_correctly": [],
  "session_summary": "Two-sentence recap of mastery shape.",
  "assessment": {"estimated_level": "B1", "sentence_count": 8, "error_count": 3, "confidence": "high"}
}

${itemsHint}

For "error_patterns_observed": snake_case grammar pattern IDs OR \`<awkward> → <natural> [<tag>]\` lexical/register swaps. Up to 5 entries.

For "topics_covered": always include "${topicLabel}". Add "side:<topic>" if a different category surfaced organically.

For "pvs_used_correctly": phrasal verbs produced correctly AND unprompted. Empty array if none qualify.

For "assessment" (silent CEFR grade — never mention to the learner): same rules as other modes. \`confidence: "low"\` for <3 items or off-topic; field required even when fold skips.`;
  }
  if (mode === 'weak_spots_drill') {
    // Same shape as free_write — assessment block feeds proficiency tracking via
    // aggregated_coach_sessions.estimated_level. topics_covered prefixed with
    // "weak_spots:<topic_id>" so stats-review can filter cleanly.
    return `Your final message must contain TWO parts:

PART 1 — Player-facing close (visible in chat). 4-6 lines: tier-by-tier recap of what was drilled, what landed, what to revisit. End with one sentence asking how the session felt.

PART 2 — Metadata block at the very end, wrapped in <session_meta>...</session_meta>:
{
  "topic_id": "emphasis_clefts",
  "tiers_touched": [1, 2, 3],
  "tier_results": [
    {"tier": 1, "attempted": 3, "clean": 3},
    {"tier": 2, "attempted": 3, "clean": 2},
    {"tier": 3, "attempted": 4, "clean": 1}
  ],
  "error_patterns_observed": ["pattern_id_1", "awkward → natural [tag]"],
  "topics_covered": ["weak_spots:emphasis_clefts"],
  "pvs_used_correctly": [],
  "session_summary": "Two-sentence recap of mastery shape and what to drill next time.",
  "assessment": {
    "estimated_level": "C1",
    "sentence_count": 18,
    "error_count": 4,
    "confidence": "high"
  }
}

For "topic_id": use the canonical catalog id (emphasis_clefts | article_system | present_perfect_vs_past_simple | preposition_clusters | phrasal_verb_production | hedge_variety) for in-catalog topics. For an improvised off-catalog topic, use a snake_case slug derived from the player's named topic ("passive_voice", "reported_speech").

For "tiers_touched" / "tier_results": one entry per tier actually drilled. \`attempted\` = total production items at that tier; \`clean\` = items where the player produced the target structure without an L1 calque or structural slip on first attempt. These feed the daily review — informs whether the topic should reappear next session or graduate.

For "error_patterns_observed": same conventions as free_write — snake_case grammar pattern IDs (e.g. "inversion_omission", "article_zero_for_definite"); lexical/register swaps as \`<awkward> → <natural> [<tag>]\` from the recognised tag set (biz_oil, brit_expat, leisure_sport, home_daily, academic_ielts, kpmg_consulting, almaty_daily). Up to 5 entries; surface the most diagnostic, not every slip.

For "topics_covered": always at least \`["weak_spots:<topic_id>"]\`. Add side-topics only if a different topic surfaced organically (e.g. "weak_spots:emphasis_clefts" + "side:article_system" when article slips kept appearing in cleft productions).

For "pvs_used_correctly": same rule as free_write — phrasal verbs produced correctly AND unprompted. Empty array if none qualify.

For "assessment" (silent CEFR grade — never mention to the learner):
- estimated_level: A1 | A2 | B1 | B2 | C1 | C2. Grade production in this session against IELTS/CEFR writing rubrics. Grammar accuracy gates the level.
- sentence_count: integer count of the learner's sentences only.
- error_count: integer count of *sentences* with at least one meaning-impeding or L1-calque error. Cap at sentence_count.
- confidence: "high" if sample is meaningful; "low" if <3 sentences, off-topic, or guessing. Low-confidence assessments are silently dropped from stats.`;
  }
  if (mode === 'free_write') {
    // pvs_used_correctly is tier-1 evidence for 🏆 graduation tracking in
    // progress/phrasal-verbs-tracker*.md. Artem (B1–C1) and Anna (A1–B1) have
    // active trackers; Nicole and Ernest will get one when their PV focus
    // crystallises. Cheap to emit for all players — empty array if none qualify.
    //
    // assessment.* is silent CEFR grading folded into player lvlStats — never
    // shown to the player, only used for proficiency stats. See
    // references/firestore-schema.md (aggregated_coach_sessions).
    return `Append a JSON block at the very end of your message wrapped in <session_meta>...</session_meta> tags containing:
{
  "error_patterns_observed": ["pattern_id_1", "awkward → natural [tag]", ...],
  "topics_covered": ["topic_1", ...],
  "pvs_used_correctly": ["pv_string_1", ...],
  "session_summary": "Two-sentence recap.",
  "assessment": {
    "estimated_level": "B2",
    "sentence_count": 14,
    "error_count": 2,
    "confidence": "high"
  },
  "register_rubric": {
    "chunk_density": 3,
    "register_match": 4,
    "calque_count": 2,
    "discourse_marker_variety": 3,
    "confidence": "high"
  }
}
Use snake_case pattern IDs for grammar items, e.g. "preposition_omission", "tense_simplification", "article_zero_for_definite".

**Lexical/register swaps go in the SAME error_patterns_observed array, formatted as \`<awkward> → <natural> [<tag>]\`** (with whitespace around the arrow). Surface up to 3 per session — only entries where the learner produced a stiff/calqued lexical phrase AND the natural alternative is meaningfully more idiomatic in the tagged context. Examples:
- "sometime ago → a while ago [brit_expat]"
- "we will investigate this matter → we'll look into it [biz_oil]"
- "in the end of the day → at the end of the day [biz_oil]"
Tag must be one of: biz_oil, brit_expat, leisure_sport, home_daily, academic_ielts, kpmg_consulting, almaty_daily. Skip when no clearly-better natural form exists, or when the swap is style preference rather than register. These entries get auto-merged into the player's weak_patterns and become drillable in Phrase Swaps.

For "pvs_used_correctly": list any phrasal verbs the learner produced correctly AND unprompted (no hint naming the PV, no leading question from the coach). Use space-separated lowercase form: "look for", "find out", "pick up", "follow up on", "get across". Empty array if none qualify.

For "assessment" (silent CEFR grade — never mention to the learner):
- estimated_level: A1 | A2 | B1 | B2 | C1 | C2. Grade the learner's *production* in this session against IELTS/CEFR writing rubrics (task achievement + coherence + lexical resource + grammatical range & accuracy). The grammar criterion gates the level.
- sentence_count: integer count of the learner's sentences only (not yours).
- error_count: integer count of *sentences* with at least one error that impedes meaning, distorts grammar, or reflects an L1 calque. Stylistic preferences don't count. Cap at sentence_count.
- confidence: "high" if the sample is meaningful and unambiguous; "low" if too short (<3 sentences), off-topic, or you're guessing. Low-confidence assessments are silently dropped from stats.

For "register_rubric" (silent register-fluency measurement — never mention to the learner). Full anchors in references/register-rubric.md. Grade the learner's typed production against their CEFR level (a B1 producing two solid chunks ≈ 3 on chunk_density, not 1):
- chunk_density (1-5): how much production reaches for native-typical multi-word chunks (collocations, idiomatic PVs, fixed phrases) vs L1-paraphrase rebuilding meaning word-by-word. 1 = almost everything paraphrased; 3 = mixed; 5 = native-typical chunk reach for the level.
- register_match (1-5): fit of register to the stated context (player profile theme tags + any context cue from the chat). Both directions of mismatch count — textbook-formal in casual chat AND over-casual in business writing both lower the score. 1 = sustained mismatch; 3 = roughly right but uneven; 5 = register-fluent including hedges and softeners.
- calque_count (integer >= 0): count of *distinct* L1 Russian calques surfaced this session. Surface-form repetitions don't double-count. Examples: preposition swaps (depend from, wait me, on next week), verb+noun (make homework, take a decision), structural (feel myself, despite of), intensifier+adj (very enormous). Don't count merely awkward production that isn't L1-derived.
- discourse_marker_variety (integer >= 0): count of *distinct* conversational discourse markers the learner used unprompted (so, well, actually, I mean, the thing is, right, look, anyway, yeah, oh, hmm, you know, kind of, basically, honestly, I guess, to be fair, mind you, etc). Exclude essay-register connectors (however, furthermore, nevertheless).
- confidence: "high" if the sample is meaningful; "low" if <3 learner sentences, off-topic, or you're guessing. Low-confidence rubrics are silently dropped from any trend.`;
  }
  return `Append a JSON block at the very end wrapped in <session_meta>...</session_meta>:
{
  "error_patterns_observed": ["pattern_id"],
  "session_summary": "One sentence on what the underlying issue was."
}`;
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

// Per-player verbosity instructions for drill feedback. Called by every Phase D
// + phrase_swap_drill system prompt to branch the languageBlock. Tiers map 1:1
// to FAMILY_MEMBERS.feedbackDepth on the PWA side. `ru` flag toggles RU/EN
// example wording — the instruction itself is always in English (it's coach-
// prompt scaffolding, not learner-facing).
function feedbackDepthInstructions(depth, ru, cleanExample) {
  const tier = FEEDBACK_DEPTH_TIERS.has(depth) ? depth : 'medium';
  const language = ru ? 'Russian' : 'English';
  const example = cleanExample || (ru ? '"Хорошо — present perfect для опыта."' : '"Right — present perfect for life experience."');
  const onCleanCommon = `On a CLEAN answer: one short ${language} sentence acknowledging + naming the rule that applied (e.g. ${example}). Don't over-praise. Then move to a new structure.`;
  if (tier === 'light') {
    return `Feedback tier: LIGHT (Artem-style — C1 learner who absorbs rules fast).

- ${onCleanCommon}
- On a MISS: **1-2 sentences** in ${language}. Name the rule + give the correct form. No L1 contrast, no extra examples — assume the learner knows the meta-language.
- Tone: focused, direct, no filler praise.`;
  }
  if (tier === 'medium-light') {
    return `Feedback tier: MEDIUM-LIGHT (Egor-style — B2 learner, brief L1 contrast helps).

- ${onCleanCommon}
- On a MISS: **1-2 sentences** in ${language}. Name the rule + give the correct form + briefly note the L1 contrast (one clause: "Russian 'X' works differently — it takes the direct object without a preposition, English needs 'for'.").
- Tone: focused, encouraging.`;
  }
  if (tier === 'medium') {
    return `Feedback tier: MEDIUM (Ernest-style — B2 learner, full L1 contrast).

- ${onCleanCommon}
- On a MISS: **2-3 sentences** in ${language}. Quote the slip, name the rule, explain the L1 contrast (where Russian and English diverge on this structure), give the correct form.
- Tone: warm, supportive, paced.`;
  }
  if (tier === 'medium-kid') {
    return `Feedback tier: MEDIUM-KID (Nicole-style — B1 learner, kid-friendly).

- ${onCleanCommon}
- On a MISS: **2-3 short sentences** in ${language}. Simple vocabulary (avoid linguistic jargon — say "the word for 'where'" instead of "the locative preposition"). Quote the slip, name the rule simply, briefly note the L1 contrast, give the correct form. Sprinkle in an occasional supportive emoji (✨ 🎯 💡) — not every turn.
- Tone: warm, encouraging, kid-conversational.`;
  }
  // detailed (Anna)
  return `Feedback tier: DETAILED (Anna-style — B1 learner who absorbs rules best with depth).

- ${onCleanCommon}
- On a MISS: **3-5 sentences** in ${language}. Quote the slip verbatim, name what's right (if anything), explain the rule with the L1 contrast (Russian "X" works this way, English "Y" works that way), give the correct form, then include **one additional example sentence** using the same pattern in a different context. Goal: lock in the rule, not just fix this item.
- Tone: warm, pedagogical, patient.`;
}

// Content-source plan for cross-category drills (translation_drill,
// error_correction_drill). When active_categories is populated (learner shell
// with a curated window), the drill rotates items across those categories
// 1:1 — each item targets ONE category, cycling so all categories get equal
// representation. When empty (Artem builder-shell-equivalent), falls back to
// weak_patterns-driven generation. The category tag also feeds items_drilled[i].category
// at session end, enabling per-category mastery rollups in coach_drill_stats.
function activeContentBlock(activeCategories, weakPatternsBlock, targetCount, mode) {
  const cats = Array.isArray(activeCategories) ? activeCategories.filter(Boolean) : [];
  if (!cats.length) {
    return `CONTENT SOURCE (no active window — fall back to weak_patterns):
Pick target structures freely from the player's weak_patterns. Rotate — don't drill the same structure twice in a row unless a slip warrants it. Mark each item's \`target_structure\` with a snake_case label of the rule (e.g. "preposition_at_arrive"). Skip the \`category\` field.`;
  }
  const list = cats.map((c, i) => `  ${i + 1}. ${c}`).join('\n');
  const perCat = Math.max(1, Math.ceil(targetCount / cats.length));
  return `CONTENT SOURCE — rotate across ${cats.length} ACTIVE CATEGORIES:
${list}

Plan: distribute ${targetCount} items across the ${cats.length} active categories above, roughly ${perCat} item${perCat === 1 ? '' : 's'} per category. Cycle through them — don't bunch one category at the start. Each item targets ONE category.

Within a category, pick the structure to drill:
1. **First preference**: a structure from the player's weak_patterns that falls in this category (e.g. for "Prepositions" + weak_pattern "preposition swap (arrive to → at)" → drill that exact rule).
2. **Fallback**: a high-utility structure for this category at the player's level (e.g. for "Tenses" at B1 → present perfect with "since/for").

On every item, emit at session-end:
- \`category\`: the active category this item targeted (one of the ${cats.length} above, verbatim)
- \`target_structure\`: snake_case rule label (e.g. "preposition_at_arrive", "present_perfect_continuous")
- These two together let stats roll up per-category AND per-structure.`;
}

// ADAPTIVE FLOW protocol — shared across all drill modes. Replaces the previous
// "score → next item" pattern with educate-first sibling-drilling on misses.
// Three strikes per structure: explain → sibling → deeper explain → sibling →
// log+escape. Hard turn cap (per mode) still applies regardless.
function adaptiveFlowProtocol() {
  return `ADAPTIVE FLOW (educate-first — this is the most important rule):

When the player MISSES an item, do NOT move to a new structure immediately. The drill is teaching, not measuring.

Sibling-drill protocol:
1. Score the miss + explain per your feedback_depth tier above.
2. Generate a SIBLING item — same \`target_structure\`, different surface (different context, different vocabulary). Do NOT name the structure or hint at the rule in the sibling prompt — the production challenge stays the same.
3. Wait for the player's attempt on the sibling.
   - CLEAN on sibling → "Got it — you've got the rule" (one sentence per your tier) + move to a NEW structure.
   - MISS on sibling → deeper explanation (same tier, but reframe the rule — different angle, different example) + ONE more sibling.
     - CLEAN on third → "Now it clicks — solid." + move to a new structure.
     - MISS on third → log as a serious gap. Say: "This one's sticking — want a deep dive on it in Weak Spots? Tap that button when you're ready." Move to a DIFFERENT structure for the next item.

On CLEAN answers: one-sentence acknowledgment + rule name, then a new structure. Don't pad with sibling items when the player already has the rule.

Track which structures you've drilled in this session — don't repeat a structure the player has already landed cleanly twice (they've got it). Prioritize fresh structures from weak_patterns over re-drilling mastered ones.`;
}

function formatNotes(value) {
  if (!value) return '  (none recorded yet)';
  if (Array.isArray(value)) {
    if (!value.length) return '  (none recorded yet)';
    return value.map(p => `  - ${p}`).join('\n');
  }
  return '  ' + String(value);
}
