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
const { fsSet, PLAYERS } = require('./_firestore');

const VALID_MODES = ['free_write', 'cc_session', 'escalate'];

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
  // Prefix: fw (free_write) | esc (escalate) | sess (cc_session/other)
  const prefix = mode === 'free_write' ? 'fw' : mode === 'escalate' ? 'esc' : 'sess';
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
    session_summary: typeof session.session_summary === 'string' ? session.session_summary : '',
    tokens_used: session.tokens_used == null ? null : session.tokens_used,
    model_used: session.model_used || '',
    created: session.created || now,
    ended: session.ended || now,
    source: 'cc_session', // distinguishes from PWA-driven Free Write (which omits this)
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
  console.log(JSON.stringify({ ok: true, path, session_id }, null, 2));
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
