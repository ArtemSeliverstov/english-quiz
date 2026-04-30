#!/usr/bin/env node
/**
 * check_transform_keywords.js — validate transform questions' keyword constraints.
 *
 * Two rules enforced (introduced after s89r3 emph_i02 / tf_16 audit):
 *
 *   Rule 1 (runtime constraint): every accepted `ans` variant must contain
 *     `keyword` (case-insensitive). The runtime check at index.html:4380
 *     (`raw.includes(kw)`) blocks any submission missing the keyword. A variant
 *     that fails this check is unreachable — typing it shows "must include X"
 *     forever.
 *
 *   Rule 2 (s86 anti-pattern): keyword must NOT appear as a whole word in the
 *     stem (`q` field). If it does, the student isn't producing the keyword —
 *     the validator is satisfied by stem text, but the test isn't testing what
 *     the keyword name implies.
 *
 * Exits non-zero on any violation. Used by pre-deploy-checklist.md § 2c.
 *
 * Usage:
 *   node tools/check_transform_keywords.js
 *
 * Cost: ~50ms on the full 1,872-question bank.
 */

const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const m = html.match(/const ALL_QUESTIONS\s*=\s*\[([\s\S]*?)\];\s*(?:const|function|\/\/)/);
if (!m) {
  console.error('ALL_QUESTIONS array not found in index.html');
  process.exit(2);
}
const arr = m[1];

// Walk balanced-brace question objects starting with `{id:'`
function walkObjects(src) {
  const objs = [];
  const re = /\{id:'([^']+)'/g;
  let match;
  while ((match = re.exec(src)) !== null) {
    let depth = 0, i = match.index, inStr = false, strCh = null;
    while (i < src.length) {
      const c = src[i];
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
    objs.push({ id: match[1], obj: src.slice(match.index, i) });
  }
  return objs;
}

function parseAns(obj) {
  const ansArr = obj.match(/ans:\[((?:[^\[\]]|\[[^\]]*\])*)\]/);
  const ansStr = obj.match(/ans:'((?:\\.|[^'\\])*)'/);
  if (ansArr) return Array.from(ansArr[1].matchAll(/'((?:\\.|[^'\\])*)'/g)).map(x => x[1]);
  if (ansStr) return ansStr[1].split('|');
  return [];
}

const issues = [];
let checked = 0;

for (const { id, obj } of walkObjects(arr)) {
  const type = (obj.match(/type:'([^']+)'/) || [])[1];
  if (type !== 'transform') continue;
  checked++;

  const cat = (obj.match(/cat:'([^']+)'/) || [])[1] || '?';
  const keyword = (obj.match(/keyword:'((?:\\.|[^'\\])*)'/) || [])[1];
  const stem = (obj.match(/q:'((?:\\.|[^'\\])*)'/) || [])[1] || '';
  const ansList = parseAns(obj);

  if (!keyword) {
    issues.push({ id, cat, problem: 'missing keyword field' });
    continue;
  }
  if (ansList.length === 0) {
    issues.push({ id, cat, keyword, problem: 'missing ans field' });
    continue;
  }

  const kw = keyword.toLowerCase();

  // Rule 1
  const passing = ansList.filter(a => a.toLowerCase().includes(kw));
  if (passing.length === 0) {
    issues.push({
      id, cat, keyword, ansList,
      problem: 'RULE 1 FAIL: no accepted answer contains the keyword (validator blocks all submissions)'
    });
  } else if (passing.length < ansList.length) {
    const failing = ansList.filter(a => !a.toLowerCase().includes(kw));
    issues.push({
      id, cat, keyword, ansList,
      problem: 'RULE 1 PARTIAL: variants unreachable: ' + JSON.stringify(failing)
    });
  }

  // Rule 2 (whole-word match, case-insensitive)
  const wordRe = new RegExp('\\b' + kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'i');
  if (wordRe.test(stem)) {
    issues.push({
      id, cat, keyword, stem,
      problem: 'RULE 2 FAIL: keyword appears as a word in the stem (s86 anti-pattern)'
    });
  }
}

if (issues.length === 0) {
  console.log(`OK — ${checked} transform questions checked, no keyword-mask issues.`);
  process.exit(0);
}

console.error(`FAIL — ${checked} transforms checked, ${issues.length} issue(s):`);
console.error('');
for (const { id, cat, keyword, ansList, stem, problem } of issues) {
  console.error(`  [${id}]  cat=${cat}  keyword=${JSON.stringify(keyword)}`);
  if (ansList) console.error(`    ans:  ${JSON.stringify(ansList)}`);
  if (stem) console.error(`    stem: ${JSON.stringify(stem)}`);
  console.error(`    → ${problem}`);
  console.error('');
}
process.exit(1);
