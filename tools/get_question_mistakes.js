#!/usr/bin/env node
/**
 * get_question_mistakes.js — for given qid(s), report each player's
 * seen / correct / wrong counts and lastWrong text. Resolves MCQ/gap option
 * indices to option text by parsing index.html.
 *
 * Usage:
 *   node get_question_mistakes.js <qid> [<qid> ...]
 *   node get_question_mistakes.js pv_c03 pv_c07 inv03
 *
 * Output: per-qid block listing each player who has seen the question,
 * with seen, correct, wrong, and lastWrong (text where resolvable).
 *
 * Used by stats-review (Step 2.5) and quiz-development (Fixing single questions).
 */

const fs = require('fs');
const path = require('path');
const { fsGet, docToPlain, PLAYERS } = require('./_firestore');

function parseQuestion(html, qid) {
  // Match a question object: {id:'<qid>',...} where braces are balanced.
  const idMarker = `id:'${qid}'`;
  const idx = html.indexOf(idMarker);
  if (idx === -1) return null;
  // Find the opening brace before idMarker
  const openBrace = html.lastIndexOf('{', idx);
  if (openBrace === -1) return null;
  // Walk forward to find the matching close brace
  let depth = 0;
  let i = openBrace;
  let inStr = false;
  let strCh = null;
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
  const obj = html.slice(openBrace, i);
  // Extract a few fields by regex — good enough for type/opts/ans
  const type = (obj.match(/type:'([^']+)'/) || [])[1] || '?';
  const lvl  = (obj.match(/lvl:'([^']+)'/) || [])[1] || '?';
  const cat  = (obj.match(/cat:'([^']+)'/) || [])[1] || '?';
  const qtxt = (obj.match(/q:'((?:\\.|[^'\\])*)'/) || [])[1] || '';
  const optsRaw = (obj.match(/opts:\[([^\]]*)\]/) || [])[1] || '';
  const opts = optsRaw ? Array.from(optsRaw.matchAll(/'((?:\\.|[^'\\])*)'/g)).map(m => m[1]) : [];
  return { type, lvl, cat, q: qtxt, opts };
}

function resolveLastWrong(lastWrong, meta) {
  if (lastWrong === undefined || lastWrong === null) return '<no log>';
  // For MCQ/gap, lastWrong is sometimes a numeric option index.
  if (typeof lastWrong === 'number' || (typeof lastWrong === 'string' && /^\d+$/.test(lastWrong))) {
    const idx = Number(lastWrong);
    if (meta && (meta.type === 'mcq' || meta.type === 'gap') && meta.opts[idx] !== undefined) {
      return `[${idx}] ${meta.opts[idx]}`;
    }
    return `index=${idx}`;
  }
  return JSON.stringify(lastWrong);
}

async function main() {
  const qids = process.argv.slice(2).filter(a => !a.startsWith('-'));
  if (qids.length === 0) {
    console.error('Usage: node get_question_mistakes.js <qid> [<qid> ...]');
    process.exit(1);
  }

  // Load index.html once for question metadata
  const htmlPath = path.join(__dirname, '..', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const metas = {};
  for (const qid of qids) {
    metas[qid] = parseQuestion(html, qid);
    if (!metas[qid]) {
      console.error(`Warning: question ${qid} not found in index.html`);
    }
  }

  // Fetch all players in parallel
  const playerDocs = await Promise.all(
    PLAYERS.map(async (p) => {
      const doc = await fsGet(`players/${p}`);
      return [p, doc ? docToPlain(doc) : null];
    })
  );

  for (const qid of qids) {
    const meta = metas[qid];
    console.log(`\n=== ${qid} ===`);
    if (meta) {
      console.log(`  type: ${meta.type}  lvl: ${meta.lvl}  cat: ${meta.cat}`);
      console.log(`  q: ${meta.q.slice(0, 100)}${meta.q.length > 100 ? '…' : ''}`);
      if (meta.opts.length) {
        meta.opts.forEach((o, i) => console.log(`    [${i}] ${o}`));
      }
    } else {
      console.log('  (question not found in index.html)');
    }
    console.log();
    let anyseen = false;
    for (const [player, data] of playerDocs) {
      if (!data) continue;
      const qStats = data.qStats || {};
      const s = qStats[qid];
      if (!s || !s.seen) continue;
      anyseen = true;
      const seen = s.seen || 0;
      const cor = s.correct || 0;
      const wrong = s.wrong != null ? s.wrong : (seen - cor);
      const lw = resolveLastWrong(s.lastWrong, meta);
      const acc = seen ? `${(100 * cor / seen).toFixed(0)}%` : '-';
      console.log(`  ${player.padEnd(8)}  seen=${seen}  correct=${cor}  wrong=${wrong}  acc=${acc.padStart(4)}  lastWrong=${lw}`);
    }
    if (!anyseen) console.log('  (no player has seen this question)');
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
