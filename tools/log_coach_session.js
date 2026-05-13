#!/usr/bin/env node
/**
 * log_coach_session.js — write a Coach chat session (Free Write style) to
 * players/{name}/coach_sessions/{session_id}.
 *
 * Mirrors the PWA's `coachWriteSessionLogStandalone` shape (see index.html
 * §coach_sessions logging). Used by the `free-write` CC skill to log a
 * conversational session that does not produce per-item scores.
 *
 * Why a separate tool from log_exercise.js:
 *   - log_exercise.js writes to players/{name}/exercises/{ts} — meant for
 *     scored items (translation drill, article drill, etc.) where
 *     total/correct/items make sense.
 *   - log_coach_session.js writes to players/{name}/coach_sessions/{session_id}
 *     — meant for chat-style sessions (Free Write) where the artifact is the
 *     transcript + observations, not item-level scores.
 *
 * The PWA uses both collections; CC should use both for parity. Stats card
 * on the PWA Coach tab pulls from `exercises`; the coach_sessions archive
 * is read by Last-session resume + future analytics.
 *
 * Usage:
 *   node log_coach_session.js <player> <session_json_path>
 *   cat session.json | node log_coach_session.js artem -
 *
 * Session JSON shape:
 *   {
 *     "mode": "free_write",                    // required
 *     "session_id": "artem_fw_1730_abc1",      // optional; auto-generated if omitted
 *     "messages": [                            // optional
 *       { "role": "user",      "content": "..." },
 *       { "role": "assistant", "content": "..." }
 *     ],
 *     "error_patterns_observed": [             // optional; can later feed coach_notes merge
 *       "preposition swap (RU L1)"
 *     ],
 *     "topics_covered": ["F1 racing", "rig schedule"],   // optional
 *     "session_summary": "Practiced PV particles in...",  // optional
 *     "model_used": "claude-opus-4.7",         // optional
 *     "tokens_used": null,                     // optional; CC = null (Max-backed)
 *     "created": "2026-05-02T15:00:00Z",       // optional; default = now
 *     "ended":   "2026-05-02T15:35:00Z"        // optional; default = now
 *   }
 *
 * Returns the document path on success.
 */

const fs = require('fs');
const {
  fsSet, fsGet, fsPatch, docToPlain, PLAYERS, bumpDailyStreakRemote,
} = require('./_firestore');

const VALID_MODES = ['free_write', 'cc_session', 'escalate', 'phrase_swap_drill', 'interview_prep'];

function parseArgs(argv) {
  const out = { dryRun: false, player: null, jsonPath: null };
  for (const a of argv) {
    if (a === '--help' || a === '-h') { out.help = true; }
    else if (a === '--dry-run') { out.dryRun = true; }
    else if (!out.player) { out.player = a; }
    else if (!out.jsonPath) { out.jsonPath = a; }
  }
  return out;
}

async function readJsonInput(jsonPath) {
  if (!jsonPath) throw new Error('No session JSON provided');
  if (jsonPath === '-') {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  }
  return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
}

function makeSessionId(player, mode) {
  // Mirror coachMakeSessionId in index.html:
  //   {player}_{prefix}_{ts}_{rand}
  // Prefix: fw (free_write) | esc (escalate) | psd (phrase_swap_drill) | sess (cc_session/other)
  const prefix =
    mode === 'free_write' ? 'fw' :
    mode === 'escalate' ? 'esc' :
    mode === 'phrase_swap_drill' ? 'psd' :
    mode === 'interview_prep' ? 'ip' :
    'sess';
  const r = Math.random().toString(36).slice(2, 6);
  return `${player}_${prefix}_${Date.now()}_${r}`;
}

function validate(session, player) {
  if (!PLAYERS.includes(player)) {
    throw new Error(`Invalid player "${player}" — must be one of ${PLAYERS.join(', ')}`);
  }
  if (!session.mode) throw new Error('Missing required field: mode');
  if (!VALID_MODES.includes(session.mode)) {
    throw new Error(`Invalid mode "${session.mode}" — must be one of ${VALID_MODES.join(', ')}`);
  }
  if (session.messages && !Array.isArray(session.messages)) {
    throw new Error('messages must be an array if provided');
  }
  if (session.error_patterns_observed && !Array.isArray(session.error_patterns_observed)) {
    throw new Error('error_patterns_observed must be an array if provided');
  }
  if (session.topics_covered && !Array.isArray(session.topics_covered)) {
    throw new Error('topics_covered must be an array if provided');
  }
  if (session.pvs_used_correctly && !Array.isArray(session.pvs_used_correctly)) {
    throw new Error('pvs_used_correctly must be an array if provided');
  }
  if (session.phrase_swaps_captured && !Array.isArray(session.phrase_swaps_captured)) {
    throw new Error('phrase_swaps_captured must be an array if provided');
  }
  if (session.phrase_swaps_drilled && !Array.isArray(session.phrase_swaps_drilled)) {
    throw new Error('phrase_swaps_drilled must be an array if provided');
  }
  // Sanity-check entries (don't enforce — schema may evolve)
  for (const e of (session.phrase_swaps_drilled || [])) {
    if (!e || typeof e.awkward !== 'string' || typeof e.natural !== 'string') {
      throw new Error('phrase_swaps_drilled entries require {awkward, natural} strings');
    }
  }
  if (session.assessment != null) {
    const a = session.assessment;
    if (typeof a !== 'object' || Array.isArray(a)) {
      throw new Error('assessment must be an object if provided');
    }
    if (a.estimated_level && !/^[ABC][12]$/.test(String(a.estimated_level))) {
      throw new Error('assessment.estimated_level must be A1|A2|B1|B2|C1|C2');
    }
    if (a.confidence && !['high', 'low'].includes(a.confidence)) {
      throw new Error('assessment.confidence must be "high" or "low"');
    }
  }
}

/**
 * Silent CEFR fold for Free Write — mirrors the PWA `coachFoldFreeWriteAssessment`
 * logic. Idempotent via the `aggregated_coach_sessions` map on the player root.
 * Skips low-confidence assessments and tiny samples; caps at 20 sentences/session
 * so one long Free Write doesn't dominate the player's lvlStats.
 */
async function applyAssessmentFold(player, sessionId, assessment) {
  if (!assessment || assessment.confidence !== 'high') return { applied: false, reason: 'low confidence or absent' };
  const lvl = assessment.estimated_level;
  if (!/^[ABC][12]$/.test(String(lvl || ''))) return { applied: false, reason: 'invalid level' };
  const rawSeen = Number(assessment.sentence_count) || 0;
  if (rawSeen < 3) return { applied: false, reason: 'sentence_count < 3' };
  const seen = Math.min(rawSeen, 20);
  const errors = Math.max(0, Math.min(Number(assessment.error_count) || 0, seen));
  const correct = seen - errors;
  const root = docToPlain(await fsGet(`players/${player}`)) || {};
  const map = root.aggregated_coach_sessions || {};
  if (map[sessionId]) return { applied: false, reason: 'already folded' };
  const lvlStats = root.lvlStats || {};
  const cur = lvlStats[lvl] || { seen: 0, correct: 0 };
  lvlStats[lvl] = { seen: cur.seen + seen, correct: cur.correct + correct };
  const totalAnswered = (root.totalAnswered || 0) + seen;
  const totalCorrect = (root.totalCorrect || 0) + correct;
  const newMap = { ...map, [sessionId]: seen };
  await fsPatch(`players/${player}`,
    ['lvlStats', 'totalAnswered', 'totalCorrect', 'aggregated_coach_sessions'],
    { lvlStats, totalAnswered, totalCorrect, aggregated_coach_sessions: newMap });
  return { applied: true, level: lvl, sentences_folded: seen, correct };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.player || !args.jsonPath) {
    console.error('Usage: node tools/log_coach_session.js <player> <session.json> [--dry-run]');
    console.error('       cat session.json | node tools/log_coach_session.js artem - [--dry-run]');
    process.exit(args.help ? 0 : 1);
  }

  const session = await readJsonInput(args.jsonPath);
  validate(session, args.player);

  const session_id = session.session_id || makeSessionId(args.player, session.mode);
  const now = new Date().toISOString();

  const doc = {
    session_id,
    player: args.player,
    mode: session.mode,
    exercise_id: session.exercise_id || null,
    exercise_version: session.exercise_version || null,
    messages: Array.isArray(session.messages) ? session.messages : [],
    error_patterns_observed: Array.isArray(session.error_patterns_observed) ? session.error_patterns_observed : [],
    topics_covered: Array.isArray(session.topics_covered) ? session.topics_covered : [],
    pvs_used_correctly: Array.isArray(session.pvs_used_correctly) ? session.pvs_used_correctly : [],
    phrase_swaps_captured: Array.isArray(session.phrase_swaps_captured) ? session.phrase_swaps_captured : [],
    phrase_swaps_drilled: Array.isArray(session.phrase_swaps_drilled) ? session.phrase_swaps_drilled : [],
    session_summary: typeof session.session_summary === 'string' ? session.session_summary : '',
    tokens_used: session.tokens_used == null ? null : session.tokens_used,
    model_used: session.model_used || '',
    created: session.created || now,
    ended: session.ended || now,
    source: 'cc_session', // distinguishes from PWA-driven Free Write (which omits this)
    assessment: session.assessment || null, // silent CEFR grade — see firestore-schema.md
    // Rubric passthroughs — emitted by /free-write and /interview-prep skills.
    // Persisted unchanged so future stats-review can aggregate. Low-confidence
    // rubrics are kept (downstream consumers filter on `confidence: "low"`).
    register_rubric: session.register_rubric || null,   // chunk_density, register_match, calque_count, discourse_marker_variety, confidence
    interview_rubric: session.interview_rubric || null, // structure_score, specificity_score, confidence_balance, delivery metrics, per_turn_summaries, confidence
    // Audio turns — populated by /interview-prep when each turn is transcribed
    // via the worker /v1/audio endpoint. Mirrors the PWA's coachState.ipTurns.
    audio_turns: Array.isArray(session.audio_turns) ? session.audio_turns : [],
  };

  const path = `players/${args.player}/coach_sessions/${session_id}`;

  if (args.dryRun) {
    console.error('--dry-run set, NOT writing.');
    console.error('Would write to:', path);
    console.error('Document:');
    console.error(JSON.stringify(doc, null, 2));
    return;
  }

  await fsSet(path, doc);

  // Unified daily streak — Free Write / cc_session activity credits the same
  // streak as Quiz play (Option D, see references/design-decisions.md). Idempotent.
  let streakBumped = false;
  try {
    streakBumped = await bumpDailyStreakRemote(args.player);
  } catch (e) {
    console.warn(`[log_coach_session] WARNING: streak bump failed: ${e.message}`);
  }

  // Silent CEFR grade fold for conversational modes that produce sentence_count.
  // Idempotent via aggregated_coach_sessions map on the player root. Low-confidence
  // assessments are skipped silently. interview_prep folds the same way as
  // free_write — same `assessment` block, same sentence-count cap.
  const CEFR_FOLD_MODES = new Set(['free_write', 'interview_prep']);
  let assessmentFold = { applied: false };
  if (CEFR_FOLD_MODES.has(session.mode) && session.assessment) {
    try {
      assessmentFold = await applyAssessmentFold(args.player, session_id, session.assessment);
    } catch (e) {
      console.warn(`[log_coach_session] WARNING: assessment fold failed: ${e.message}`);
    }
  }

  console.log(JSON.stringify({
    ok: true, path, session_id,
    streak_bumped: streakBumped,
    assessment_fold: assessmentFold,
  }, null, 2));
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
