// english-quiz-coach Cloudflare Worker
//
// Thin proxy from the family-side PWA to api.anthropic.com/v1/messages.
// Validates origin/size/mode/model/player, constructs the system prompt
// server-side (so the PWA can't smuggle one in), forwards to Anthropic,
// and returns a structured envelope per references/phase2-coach-tab.md §7.2.
//
// Modes:
//   - free_write       : conversational tutoring on free-typed English
//   - escalate         : one-shot deeper explanation after pre-generated feedback
//   - phrase_swap_drill: lexical/register swap drill — RU cue, EN production,
//                        lenient scoring, register explanation on stiff production
//                        (added 2026-05-06; see references/exercise-types.md type 9)
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
const VALID_MODES = ['free_write', 'escalate', 'phrase_swap_drill'];
const MAX_BODY_BYTES = 50 * 1024;
const MAX_TOKENS = 1024;
const ANTHROPIC_VERSION = '2023-06-01';

// phrase_swap_drill: default per-session item count (PWA can override via
// context.target_item_count, capped at PSD_MAX_ITEMS).
const PSD_DEFAULT_ITEMS = 6;
const PSD_MAX_ITEMS = 10;

export default {
  async fetch(request, env) {
    const cors = corsHeaders(env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== 'POST') {
      return jsonError(405, 'WORKER_VALIDATION', 'Method not allowed', false, cors);
    }

    // Origin check
    const origin = request.headers.get('Origin');
    if (!env.ALLOWED_ORIGIN || origin !== env.ALLOWED_ORIGIN) {
      return jsonError(403, 'WORKER_VALIDATION', 'Origin not allowed', false, cors);
    }

    // Body size
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

function buildSystemBlocks(mode, context, isSessionEnd) {
  const blocks = [];
  let preamble;
  if (mode === 'free_write') preamble = freeWriteSystemPrompt(context);
  else if (mode === 'phrase_swap_drill') preamble = phraseSwapDrillSystemPrompt(context);
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

  const languageBlock = ru
    ? `- **Деliver each cue and explanation in Russian.** ${playerName} reads English fluently but absorbs register feedback faster in her L1.
- The cue is a Russian sentence ${playerName} should translate into natural English. The "awkward" form in the pool is the L1-calque or stiff alternative — never include it in the cue.
- When ${playerName} produces the natural form (or a near-equivalent that fits the register), confirm briefly in Russian and move on. No grammar lecture.
- When she produces the stiff form (or another non-natural alternative), give a 1–2 sentence Russian explanation of *why* the natural form lands better in the tagged context. Do NOT call her sentence "wrong" — both forms are grammatical; the issue is register/frequency.
- Keep replies short. This is a drill, not a tutorial.`
    : `- Deliver each cue in Russian (the player's L1) so the production challenge is genuinely from-scratch English. The "awkward" form in the pool is the stiff alternative — never include it in the cue.
- When ${playerName} produces the natural form (or a near-equivalent that fits the register), confirm briefly in English and move on.
- When ${playerName} produces the stiff form (or another non-natural alternative), give a 1–2 sentence English explanation of *why* the natural form lands better in the tagged context. Do NOT call the sentence "wrong" — both forms are grammatical; the issue is register/frequency.
- Keep replies short. This is a drill, not a tutorial.`;

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

About this learner:
- L1: Russian
- Level: ${level}
- Coach language: ${ru ? 'Russian' : 'English'}

Today's drill pool (${pool.length} entries; aim for ${targetCount} cues):
${poolBlock || '  (empty — fall back to small-talk, end the session politely)'}

Tone: focused, pacy, encouraging. This is a sub-5-minute drill, not a chat.

Open the session with: a one-line greeting + the first Russian cue. No preamble about what the drill is — ${playerName} already knows.`;
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
  "error_patterns_observed": ["pattern_id_1", ...],
  "topics_covered": ["topic_1", ...],
  "pvs_used_correctly": ["pv_string_1", ...],
  "session_summary": "Two-sentence recap.",
  "assessment": {
    "estimated_level": "B2",
    "sentence_count": 14,
    "error_count": 2,
    "confidence": "high"
  }
}
Use snake_case pattern IDs, e.g. "preposition_omission", "tense_simplification", "article_zero_for_definite".

For "pvs_used_correctly": list any phrasal verbs the learner produced correctly AND unprompted (no hint naming the PV, no leading question from the coach). Use space-separated lowercase form: "look for", "find out", "pick up", "follow up on", "get across". Empty array if none qualify.

For "assessment" (silent CEFR grade — never mention to the learner):
- estimated_level: A1 | A2 | B1 | B2 | C1 | C2. Grade the learner's *production* in this session against IELTS/CEFR writing rubrics (task achievement + coherence + lexical resource + grammatical range & accuracy). The grammar criterion gates the level.
- sentence_count: integer count of the learner's sentences only (not yours).
- error_count: integer count of *sentences* with at least one error that impedes meaning, distorts grammar, or reflects an L1 calque. Stylistic preferences don't count. Cap at sentence_count.
- confidence: "high" if the sample is meaningful and unambiguous; "low" if too short (<3 sentences), off-topic, or you're guessing. Low-confidence assessments are silently dropped from stats.`;
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

function formatNotes(value) {
  if (!value) return '  (none recorded yet)';
  if (Array.isArray(value)) {
    if (!value.length) return '  (none recorded yet)';
    return value.map(p => `  - ${p}`).join('\n');
  }
  return '  ' + String(value);
}
