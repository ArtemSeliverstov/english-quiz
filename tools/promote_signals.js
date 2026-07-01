#!/usr/bin/env node
/**
 * promote_signals.js — surface / apply recent_session_signals promotions.
 *
 * The promotion gate (count>=2 → weak_patterns) previously only ran when a
 * human kicked off stats-review, so ready signals could rot for weeks
 * (temporal_anchor sat promotable for 27 days). This tool makes the sweep
 * cheap enough to run daily from mistakes-review:
 *
 *   node promote_signals.js <player|all> --list
 *       → JSON worklist of count>=2 signals not obviously already in
 *         weak_patterns. Label composition stays with the skill (Claude) so
 *         weak_patterns keep their rich prose — this tool never auto-writes a
 *         machine-generated label.
 *
 *   node promote_signals.js <player> --apply <patch.json | ->
 *       → patch: { "promotions": [ { "pattern_id": "...", "label": "<durable prose>" } ] }
 *         Appends each label to weak_patterns (deduped) AND drops the promoted
 *         pattern_id from recent_session_signals, in one write.
 *
 * See references/coach-notes-schema.md "recent_session_signals" + "Promotion".
 */

const fs = require('fs');
const { fsGet, fsPatch, docToPlain, PLAYERS } = require('./_firestore');
const { applyRecentSessionSignalsPatch, isLexicalSlug } = require('./_signals');
const { applyArrayPatch } = require('./update_coach_notes');

const PROMOTION_THRESHOLD = 2;

function parseArgs(argv) {
  if (argv[0] === '--help' || argv[0] === '-h') return { help: true };
  const positionals = argv.filter(a => !a.startsWith('--'));
  return {
    player: positionals[0],
    jsonPath: positionals[1],
    list: argv.includes('--list'),
    apply: argv.includes('--apply'),
  };
}

async function readJsonInput(jsonPath) {
  if (jsonPath === '-') {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  }
  return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
}

// Heuristic "already covered" flag — advisory only, so the skill doesn't
// re-promote a pattern whose prose label already exists. A signal is flagged
// covered when a weak_patterns entry contains the pattern_id verbatim
// (underscores or spaces) or all of its significant (>4 char) tokens.
function likelyCovered(patternId, weakPatterns) {
  const hay = (weakPatterns || []).map(w => String(w).toLowerCase());
  const idUnderscore = patternId.toLowerCase();
  const idSpaced = idUnderscore.replace(/_/g, ' ');
  if (hay.some(w => w.includes(idUnderscore) || w.includes(idSpaced))) return true;
  const tokens = idUnderscore.split('_').filter(t => t.length > 4);
  if (!tokens.length) return false;
  return hay.some(w => tokens.every(t => w.includes(t)));
}

async function listForPlayer(player) {
  const doc = await fsGet(`players/${player}`);
  if (!doc) return { player, error: 'player document not found' };
  const cn = (docToPlain(doc) || {}).coach_notes || {};
  const signals = cn.recent_session_signals || [];
  const weak = cn.weak_patterns || [];
  const promotable = signals
    .filter(s => Number(s.count) >= PROMOTION_THRESHOLD && !isLexicalSlug(s.pattern_id || ''))
    .map(s => ({
      pattern_id: s.pattern_id,
      count: Number(s.count),
      first_seen: s.first_seen,
      last_seen: s.last_seen,
      category: s.category || null,
      source_modes: s.source_modes || [],
      likely_covered: likelyCovered(s.pattern_id || '', weak),
    }))
    .sort((a, b) => (b.count - a.count) || String(a.last_seen).localeCompare(String(b.last_seen)));
  return { player, promotable_count: promotable.filter(p => !p.likely_covered).length, promotable };
}

async function applyForPlayer(player, promotions) {
  if (!Array.isArray(promotions) || !promotions.length) {
    throw new Error('--apply patch must contain a non-empty "promotions" array');
  }
  for (const p of promotions) {
    if (!p || typeof p.pattern_id !== 'string' || typeof p.label !== 'string' || !p.label.trim()) {
      throw new Error('each promotion needs { pattern_id: string, label: non-empty string }');
    }
  }
  const doc = await fsGet(`players/${player}`);
  if (!doc) throw new Error(`player document not found: players/${player}`);
  const cn = (docToPlain(doc) || {}).coach_notes || {};

  const labels = promotions.map(p => p.label.trim());
  const ids = promotions.map(p => p.pattern_id);

  cn.weak_patterns = applyArrayPatch(cn.weak_patterns, labels, []);
  cn.recent_session_signals = applyRecentSessionSignalsPatch(
    cn.recent_session_signals, { recent_session_signals_promote: ids }
  );
  cn.last_updated = new Date().toISOString();
  cn.last_updated_by = 'claude_code';

  await fsPatch(`players/${player}`, ['coach_notes'], { coach_notes: cn });
  return {
    player,
    promoted: ids,
    weak_patterns_count: cn.weak_patterns.length,
    signals_remaining: cn.recent_session_signals.length,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.player) {
    console.error('Usage:');
    console.error('  node promote_signals.js <player|all> --list');
    console.error('  node promote_signals.js <player> --apply <patch.json | ->');
    console.error(`  player: one of ${PLAYERS.join(', ')} (or "all" for --list)`);
    process.exit(args.help ? 0 : 1);
  }

  if (args.apply) {
    if (!PLAYERS.includes(args.player)) {
      console.error(`--apply needs a single player; got "${args.player}"`);
      process.exit(1);
    }
    const patch = await readJsonInput(args.jsonPath || '-');
    const r = await applyForPlayer(args.player, patch.promotions);
    console.log(JSON.stringify(r, null, 2));
    return;
  }

  // default: --list
  const players = args.player === 'all' ? PLAYERS : [args.player];
  if (args.player !== 'all' && !PLAYERS.includes(args.player)) {
    console.error(`Unknown player "${args.player}"`);
    process.exit(1);
  }
  const results = [];
  for (const p of players) results.push(await listForPlayer(p));
  console.log(JSON.stringify(args.player === 'all' ? results : results[0], null, 2));
}

if (require.main === module) {
  main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}

module.exports = { likelyCovered, listForPlayer, applyForPlayer, PROMOTION_THRESHOLD };
