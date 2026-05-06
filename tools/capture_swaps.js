#!/usr/bin/env node
/**
 * capture_swaps.js — capture awkward→natural swaps to phrase_tracker.
 *
 * Thin wrapper over update_coach_notes.js. Centralises the CC capture-source
 * asymmetry rule (skip ⚪ first_pass, land directly at 🔵 active) so callers
 * don't need to know the patch shape, lifecycle stamps, or sources prefix.
 *
 * Callers:
 *   - free-write skill                  → source: 'fw'
 *   - exercise-session skill            → source: 'ex'
 *   - phrase_swap_drill (PWA worker)    → source: 'psd'
 *   - end-of-session prompt-coaching    → source: 'wrap'
 *
 * Usage:
 *   node tools/capture_swaps.js <player> <input.json | -> [--dry-run]
 *   cat input.json | node tools/capture_swaps.js artem -
 *
 * Input JSON shape:
 *   {
 *     "source": "fw" | "psd" | "wrap" | "ex",
 *     "session_id": "artem_fw_1778100000000_xy12",   // optional but recommended
 *     "swaps": [
 *       { "awkward": "sometime ago", "natural": "a while ago", "tag": "brit_expat" },
 *       { "awkward": "audit my mistake", "natural": "review my mistake" }
 *     ]
 *   }
 *
 * Behaviour:
 *   - Each swap → phrase_tracker_add entry with status:'active', sources:[source],
 *     event 'captured' on today's date.
 *   - One summary recent_observations_add entry referencing session_id.
 *   - tag is optional (untagged = applies across all contexts).
 *
 * See references/coach-notes-schema.md "Phrase tracker lifecycle" for the full
 * state machine.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const VALID_SOURCES = new Set(['fw', 'psd', 'wrap', 'ex']);
const PLAYERS = ['artem', 'anna', 'nicole', 'ernest', 'egor'];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function parseArgs(argv) {
  if (argv[0] === '--help' || argv[0] === '-h') return { help: true };
  return {
    player: argv[0],
    inputPath: argv[1],
    dryRun: argv.includes('--dry-run'),
  };
}

async function readJson(p) {
  if (p === '-') {
    const chunks = [];
    for await (const c of process.stdin) chunks.push(c);
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

// Format a swap as the lexical-swap string the PWA parser expects:
//   tagged:    "<awkward> → <natural> [<tag>]"
//   untagged:  "<awkward> → <natural>"
// See coachParseLexicalWeakPattern in index.html for the parser. Note: the PWA
// skips untagged entries with single-word naturals (treats them as grammar
// shorthand) — caller-side warning emitted in buildPatch().
function formatLexicalSwap(s) {
  return s.tag
    ? `${s.awkward} → ${s.natural} [${s.tag}]`
    : `${s.awkward} → ${s.natural}`;
}

function buildPatch(input) {
  const { source, session_id, swaps } = input || {};
  if (!VALID_SOURCES.has(source)) {
    throw new Error(`Invalid source "${source}". Must be one of: ${[...VALID_SOURCES].join(', ')}`);
  }
  if (!Array.isArray(swaps) || swaps.length === 0) {
    throw new Error('swaps must be a non-empty array');
  }

  const phrase_tracker_add = swaps.map((s, i) => {
    if (!s.awkward || !s.natural) {
      throw new Error(`Swap[${i}] requires awkward + natural fields. Got: ${JSON.stringify(s)}`);
    }
    return {
      awkward: s.awkward,
      natural: s.natural,
      tag: s.tag || null,
      status: 'active',         // CC capture-source asymmetry: skip ⚪ first_pass
      first_seen: todayISO(),
      sources: [source],
      event_note: s.note || null,
    };
  });

  // Dual-write: every active swap also goes into weak_patterns as a lexical
  // string so the PWA's coachBuildPhrasePool picks it up. Without this the
  // entry sits in phrase_tracker but the Phrase Swaps button stays grey.
  const weak_patterns_add = swaps.map(formatLexicalSwap);

  // Hard validation: untagged + single-word natural is invisible to the PWA
  // parser (it treats those as grammar shorthand and skips them). Fail fast
  // here so the swap doesn't silently miss the drill rotation.
  const tooShort = swaps
    .map((s, i) => ({ i, s }))
    .filter(({ s }) => !s.tag && s.natural.split(/\s+/).length < 2);
  if (tooShort.length) {
    const lines = tooShort.map(({ i, s }) =>
      `  swap[${i}] "${s.awkward} → ${s.natural}": untagged + single-word natural`
    );
    throw new Error(
      'Untagged swaps require 2+ words in the natural form, otherwise the PWA parser skips them as grammar shorthand:\n' +
      lines.join('\n') +
      '\n  Fix: expand the natural form (e.g., "fix" → "sort it out") OR add a tag (biz_oil/leisure_sport/brit_expat/...).'
    );
  }

  const sessionRef = session_id || `${source}_capture_${Date.now()}`;
  const previewList = swaps
    .map(s => `"${s.awkward}" → "${s.natural}"`)
    .join('; ');
  const note = `Captured ${swaps.length} awkward→natural swap(s) via ${source}: ${previewList}`;

  return {
    phrase_tracker_add,
    weak_patterns_add,
    recent_observations_add: [{
      date: todayISO(),
      session_id: sessionRef,
      author: 'claude_code',
      note,
    }],
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.player || !args.inputPath) {
    console.error('Usage:');
    console.error('  node tools/capture_swaps.js <player> <input.json | -> [--dry-run]');
    console.error('');
    console.error(`Player: one of ${PLAYERS.join(', ')}`);
    console.error('Input: { source: "fw|psd|wrap|ex", session_id?: "...", swaps: [{awkward, natural, tag?, note?}] }');
    process.exit(args.help ? 0 : 1);
  }
  if (!PLAYERS.includes(args.player)) {
    console.error(`Unknown player "${args.player}"`);
    process.exit(1);
  }

  const input = await readJson(args.inputPath);
  const patch = buildPatch(input);

  // Write patch to a sibling temp file and shell out to update_coach_notes.js.
  // (Reuses its read-modify-write Firestore logic, validation, and FIFO cap.)
  const tmpPath = path.join(__dirname, `.capture_swaps_${Date.now()}.json`);
  fs.writeFileSync(tmpPath, JSON.stringify(patch, null, 2));

  try {
    const updateScript = path.join(__dirname, 'update_coach_notes.js');
    const cmdArgs = [updateScript, args.player, tmpPath];
    if (args.dryRun) cmdArgs.push('--dry-run');
    const r = spawnSync(process.execPath, cmdArgs, { encoding: 'utf8' });
    if (r.stdout) process.stdout.write(r.stdout);
    if (r.stderr) process.stderr.write(r.stderr);
    if (r.status !== 0) process.exit(r.status || 1);
  } finally {
    try { fs.unlinkSync(tmpPath); } catch (_) {}
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}

module.exports = { buildPatch };
