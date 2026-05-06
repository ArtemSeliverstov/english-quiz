#!/usr/bin/env node
/**
 * get_recent_mistakes.js — pull quiz mistakes from the past N hours for all 5 players.
 *
 * A mistake = `qStats[qid]` on a player doc where:
 *   - `lastSeen` (ms epoch) >= cutoff (now - hours*3600s), AND
 *   - `lastWrong` is set.
 * The live quiz play loop in index.html deletes `lastWrong` on a correct
 * answer, so its presence means the most recent attempt was wrong.
 * Coach/CC supplementary surfaces fold into `qStats.{seen,correct,wrong}`
 * but never set `lastWrong` / `lastSeen` — so this tool reports quiz only,
 * which is what the mistakes-review routine needs.
 *
 * Output: JSON array to stdout. One entry per (player, qid) mistake, with
 * question metadata joined from index.html (q, opts, ans, type, cat, lvl,
 * exp, hint, keyword, raw object source). The skill consumes this to
 * classify genuine-vs-quality and propose fixes.
 *
 * Usage:
 *   node tools/get_recent_mistakes.js                 # default 31h, all players
 *   node tools/get_recent_mistakes.js --hours 48
 *   node tools/get_recent_mistakes.js --player artem
 *   node tools/get_recent_mistakes.js --pretty        # human-readable per-player blocks
 *
 * Used by the mistakes-review skill (daily 07:30 Bahrain routine, 31h window).
 */

const fs = require('fs');
const path = require('path');
const { fsGet, docToPlain, PLAYERS } = require('./_firestore');

function parseArgs(argv) {
  const out = { hours: 31, player: null, pretty: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--hours') out.hours = Number(argv[++i]);
    else if (a === '--player') out.player = argv[++i];
    else if (a === '--pretty') out.pretty = true;
    else if (a === '--help' || a === '-h') {
      console.log('Usage: node tools/get_recent_mistakes.js [--hours N] [--player NAME] [--pretty]');
      process.exit(0);
    }
  }
  return out;
}

// Walk-balanced extraction of the question object containing `id:'<qid>'`.
function extractQuestionSource(html, qid) {
  const idMarker = `id:'${qid}'`;
  const idx = html.indexOf(idMarker);
  if (idx === -1) return null;
  const open = html.lastIndexOf('{', idx);
  if (open === -1) return null;
  let depth = 0, i = open, inStr = false, strCh = null;
  while (i < html.length) {
    const c = html[i];
    if (inStr) {
      if (c === '\\') { i += 2; continue; }
      if (c === strCh) inStr = false;
    } else {
      if (c === "'" || c === '"') { inStr = true; strCh = c; }
      else if (c === '{') depth++;
      else if (c === '}') { depth--; if (depth === 0) { i++; break; } }
    }
    i++;
  }
  return html.slice(open, i);
}

function pluck(re, src) {
  const m = src.match(re);
  return m ? m[1] : null;
}

function parseQuestion(html, qid) {
  const src = extractQuestionSource(html, qid);
  if (!src) return null;
  const type = pluck(/type:'([^']+)'/, src);
  const lvl = pluck(/lvl:'([^']+)'/, src);
  const cat = pluck(/cat:'([^']+)'/, src);
  const q = pluck(/q:'((?:\\.|[^'\\])*)'/, src);
  const exp = pluck(/exp:'((?:\\.|[^'\\])*)'/, src);
  const hint = pluck(/hint:'((?:\\.|[^'\\])*)'/, src);
  const keyword = pluck(/keyword:'((?:\\.|[^'\\])*)'/, src);
  const optsRaw = pluck(/opts:\[([^\]]*)\]/, src);
  const opts = optsRaw
    ? Array.from(optsRaw.matchAll(/'((?:\\.|[^'\\])*)'/g)).map(m => m[1])
    : [];
  // ans is heterogeneous (number / string / array / object). Capture raw slice.
  const ansMatch = src.match(/,\s*ans\s*:\s*/);
  let ansRaw = null;
  if (ansMatch) {
    const start = ansMatch.index + ansMatch[0].length;
    let j = start, d = 0, s = false, sc = null;
    while (j < src.length) {
      const c = src[j];
      if (s) { if (c === '\\') { j += 2; continue; } if (c === sc) s = false; }
      else {
        if (c === "'" || c === '"') { s = true; sc = c; }
        else if (c === '[' || c === '{') d++;
        else if (c === ']' || c === '}') { if (d === 0) break; d--; }
        else if (c === ',' && d === 0) break;
      }
      j++;
    }
    ansRaw = src.slice(start, j).trim();
  }
  return { type, lvl, cat, q, exp, hint, keyword, opts, ans: ansRaw, src };
}

function resolveLastWrong(lastWrong, meta) {
  if (lastWrong === undefined || lastWrong === null) return { kind: 'none', text: null };
  if (typeof lastWrong === 'number' || (typeof lastWrong === 'string' && /^\d+$/.test(lastWrong))) {
    const idx = Number(lastWrong);
    if (meta && (meta.type === 'mcq' || meta.type === 'gap') && meta.opts && meta.opts[idx] !== undefined) {
      return { kind: 'index', index: idx, text: meta.opts[idx] };
    }
    return { kind: 'index', index: idx, text: null };
  }
  if (typeof lastWrong === 'string') return { kind: 'text', text: lastWrong };
  return { kind: 'object', text: JSON.stringify(lastWrong) };
}

function fmtAge(ms) {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${(ms / 3_600_000).toFixed(1)}h ago`;
  return `${(ms / 86_400_000).toFixed(1)}d ago`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!Number.isFinite(args.hours) || args.hours <= 0) {
    console.error('--hours must be a positive number');
    process.exit(1);
  }
  const players = args.player ? [args.player] : PLAYERS;
  const now = Date.now();
  const cutoff = now - args.hours * 3600 * 1000;

  const htmlPath = path.join(__dirname, '..', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  const playerDocs = await Promise.all(players.map(async p => {
    const doc = await fsGet(`players/${p}`);
    return [p, doc ? docToPlain(doc) : null];
  }));

  const mistakes = [];
  for (const [player, data] of playerDocs) {
    if (!data) continue;
    const qStats = data.qStats || {};
    for (const [qid, s] of Object.entries(qStats)) {
      if (!s) continue;
      const lastSeen = s.lastSeen || 0;
      if (lastSeen < cutoff) continue;
      if (s.lastWrong === undefined || s.lastWrong === null) continue;
      const meta = parseQuestion(html, qid);
      const lw = resolveLastWrong(s.lastWrong, meta);
      mistakes.push({
        player,
        qid,
        lastSeen,
        lastSeenIso: new Date(lastSeen).toISOString(),
        ageMs: now - lastSeen,
        seen: s.seen || 0,
        correct: s.correct || 0,
        wrong: s.wrong != null ? s.wrong : ((s.seen || 0) - (s.correct || 0)),
        lastWrong: s.lastWrong,
        lastWrongResolved: lw,
        question: meta || { _missing: true },
      });
    }
  }
  mistakes.sort((a, b) => b.lastSeen - a.lastSeen);

  if (args.pretty) {
    console.log(`# Recent quiz mistakes — past ${args.hours}h (cutoff ${new Date(cutoff).toISOString()})`);
    console.log(`# Found ${mistakes.length} mistake${mistakes.length === 1 ? '' : 's'} across ${players.length} player(s).\n`);
    for (const m of mistakes) {
      const meta = m.question || {};
      const stem = (meta.q || '').replace(/<[^>]+>/g, '').slice(0, 140);
      console.log(`## ${m.player} · ${m.qid} · ${meta.type || '?'} · ${meta.lvl || '?'} · ${meta.cat || '?'}`);
      console.log(`  q: ${stem}`);
      if (meta.opts && meta.opts.length) {
        meta.opts.forEach((o, i) => console.log(`    [${i}] ${o}`));
      }
      if (meta.ans) console.log(`  ans: ${meta.ans}`);
      if (meta.keyword) console.log(`  keyword: ${meta.keyword}`);
      if (meta.exp) console.log(`  exp: ${meta.exp.slice(0, 200)}`);
      const lw = m.lastWrongResolved;
      const lwStr = lw.kind === 'index'
        ? (lw.text != null ? `[${lw.index}] ${lw.text}` : `index=${lw.index}`)
        : (lw.text || JSON.stringify(m.lastWrong));
      console.log(`  lastWrong: ${lwStr}`);
      console.log(`  stats: seen=${m.seen} correct=${m.correct} wrong=${m.wrong}  lastSeen=${fmtAge(m.ageMs)}`);
      console.log('');
    }
    return;
  }

  console.log(JSON.stringify({
    generated: new Date(now).toISOString(),
    hours: args.hours,
    cutoffIso: new Date(cutoff).toISOString(),
    players,
    count: mistakes.length,
    mistakes,
  }, null, 2));
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
