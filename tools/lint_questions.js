#!/usr/bin/env node
/**
 * lint_questions.js — schema validation for ALL_QUESTIONS in index.html.
 *
 * Catches the silent-bug class of authoring errors: wrong ans type, wrong
 * field for type, duplicate ids, hint-naming-the-rule, etc. Runs in <500ms
 * on the full 1,872-question bank. Exits non-zero on any violation.
 *
 * For type-specific keyword/transform rules, see check_transform_keywords.js.
 *
 * Usage:
 *   node tools/lint_questions.js
 */

const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const m = html.match(/const ALL_QUESTIONS\s*=\s*\[([\s\S]*?)\];\s*(?:const|function|\/\/)/);
if (!m) {
  console.error('FATAL: ALL_QUESTIONS array not found in index.html');
  process.exit(2);
}
const arr = m[1];

const VALID_TYPES = new Set(['gap', 'mcq', 'input', 'multi', 'transform', 'wordform']);
const VALID_LEVELS = new Set(['B1', 'B2', 'C1', 'C2']);

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

function getStr(obj, field) {
  const m = obj.match(new RegExp(field + ":'((?:\\\\.|[^'\\\\])*)'"));
  return m ? m[1] : null;
}
function getRawField(obj, field) {
  const m = obj.match(new RegExp(field + ':([^,}]+)'));
  return m ? m[1].trim() : null;
}
function hasField(obj, field) {
  return new RegExp('\\b' + field + ':').test(obj);
}
function getInt(obj, field) {
  const m = obj.match(new RegExp(field + ':(\\d+)(?:[,}])'));
  return m ? parseInt(m[1], 10) : null;
}
function getIntArray(obj, field) {
  const m = obj.match(new RegExp(field + ':\\[((?:\\d+(?:,\\d+)*)?)\\]'));
  if (!m) return null;
  return m[1] === '' ? [] : m[1].split(',').map(n => parseInt(n.trim(), 10));
}
function getStringArray(obj, field) {
  // Match field:['a','b',...] (string array, top-level only — not nested in blanks[])
  const m = obj.match(new RegExp(field + ":\\[((?:'(?:\\\\.|[^'\\\\])*'(?:,\\s*)?)+)\\]"));
  if (!m) return null;
  return Array.from(m[1].matchAll(/'((?:\\.|[^'\\])*)'/g)).map(x => x[1]);
}
function getOpts(obj) {
  // Top-level opts:[...]
  const m = obj.match(/\bopts:\[((?:[^\[\]]|\[[^\]]*\])*)\]/);
  if (!m) return null;
  return Array.from(m[1].matchAll(/'((?:\\.|[^'\\])*)'/g)).map(x => x[1]);
}
function getBlanks(obj) {
  // Find blanks:[ … ] using balanced bracket counting (handles nested opts:[...]).
  const start = obj.search(/\bblanks:\[/);
  if (start === -1) return null;
  let i = obj.indexOf('[', start);
  let depth = 0, end = -1, inStr = false, strCh = null;
  for (; i < obj.length; i++) {
    const c = obj[i];
    if (inStr) {
      if (c === '\\') { i++; continue; }
      if (c === strCh) inStr = false;
    } else {
      if (c === "'" || c === '"') { inStr = true; strCh = c; }
      else if (c === '[') depth++;
      else if (c === ']') { depth--; if (depth === 0) { end = i; break; } }
    }
  }
  if (end === -1) return null;
  const inner = obj.slice(obj.indexOf('[', start) + 1, end);
  // Walk top-level {…} blocks
  const blocks = [];
  let j = 0, bDepth = 0, bStart = -1, bs = false, bsCh = null;
  for (; j < inner.length; j++) {
    const c = inner[j];
    if (bs) {
      if (c === '\\') { j++; continue; }
      if (c === bsCh) bs = false;
    } else {
      if (c === "'" || c === '"') { bs = true; bsCh = c; }
      else if (c === '{') { if (bDepth === 0) bStart = j; bDepth++; }
      else if (c === '}') {
        bDepth--;
        if (bDepth === 0 && bStart !== -1) {
          const blockSrc = inner.slice(bStart, j + 1);
          const optsM = blockSrc.match(/\bopts:\[((?:[^\[\]]|\[[^\]]*\])*)\]/);
          const opts = optsM ? Array.from(optsM[1].matchAll(/'((?:\\.|[^'\\])*)'/g)).map(x => x[1]) : [];
          const ansM = blockSrc.match(/\bans:(\d+)/);
          blocks.push({ opts, ans: ansM ? parseInt(ansM[1], 10) : null });
          bStart = -1;
        }
      }
    }
  }
  return blocks;
}
function countBlanks(q) {
  // Count `___` occurrences (3+ consecutive underscores)
  return (q.match(/_{3,}/g) || []).length;
}

const issues = [];
const seenIds = new Map();
let checked = 0;

for (const { id, obj } of walkObjects(arr)) {
  checked++;
  const cat = getStr(obj, 'cat');
  const lvl = getStr(obj, 'lvl');
  const type = getStr(obj, 'type');
  const q = getStr(obj, 'q');

  // Duplicate IDs
  if (seenIds.has(id)) {
    issues.push({ id, cat, problem: `duplicate id (also at index ${seenIds.get(id)})` });
  } else {
    seenIds.set(id, checked);
  }

  // Common required fields
  for (const f of ['cat', 'lvl', 'biz', 'type', 'q', 'exp']) {
    if (!hasField(obj, f)) {
      issues.push({ id, cat, problem: `missing required field: ${f}` });
    }
  }

  // Valid type / lvl
  if (type && !VALID_TYPES.has(type)) {
    issues.push({ id, cat, problem: `invalid type: ${JSON.stringify(type)}` });
  }
  if (lvl && !VALID_LEVELS.has(lvl)) {
    issues.push({ id, cat, problem: `invalid lvl: ${JSON.stringify(lvl)} (expected B1|B2|C1|C2)` });
  }

  // q must not contain stem: marker (silent bug s66r4)
  if (hasField(obj, 'stem')) {
    issues.push({ id, cat, problem: 'uses `stem:` field (renderQ reads `q:` only — silent bug)' });
  }

  // Type-specific checks
  if (type === 'gap' || type === 'mcq') {
    const opts = getOpts(obj);
    const ansInt = getInt(obj, 'ans');
    const ansArr = getIntArray(obj, 'ans');
    const ansRaw = getRawField(obj, 'ans');
    const ansVals = ansArr !== null ? ansArr : (ansInt !== null ? [ansInt] : null);

    if (!opts) {
      issues.push({ id, cat, problem: `${type}: missing opts[]` });
    }
    if (ansRaw === null) {
      issues.push({ id, cat, problem: `${type}: missing ans` });
    } else if (ansVals === null) {
      issues.push({ id, cat, problem: `${type}: ans must be integer or integer array (got ${ansRaw}; string ans silently fails)` });
    } else if (opts) {
      for (const a of ansVals) {
        if (a < 0 || a >= opts.length) {
          issues.push({ id, cat, problem: `${type}: ans=${a} out of range for opts[${opts.length}]` });
        }
      }
    }

    if (hasField(obj, 'hint')) {
      issues.push({ id, cat, problem: `${type}: must NOT have hint field` });
    }
    if (type === 'mcq' && q && /_{3,}/.test(q)) {
      issues.push({ id, cat, problem: 'mcq stem contains `___` (use gap or input instead)' });
    }
  }

  if (type === 'input') {
    const ansStr = getStr(obj, 'ans');
    const ansArr = getStringArray(obj, 'ans');
    if (ansStr === null && ansArr === null) {
      issues.push({ id, cat, problem: 'input: missing ans (string or string array)' });
    }
    // hint required unless G&I-style bracket format: blank followed by `(word)`.
    const hint = getStr(obj, 'hint');
    const isGIBracketFormat = q && /_{3,}\s*\([A-Za-z][A-Za-z,\s]*\)/.test(q);
    if (!hint && !isGIBracketFormat) {
      issues.push({ id, cat, problem: 'input: missing hint (G&I bracket format is the only exception)' });
    }
  }

  if (type === 'multi') {
    const blanks = getBlanks(obj);
    if (!blanks || blanks.length === 0) {
      issues.push({ id, cat, problem: 'multi: missing blanks[]' });
    } else {
      const qBlankCount = q ? countBlanks(q) : 0;
      if (qBlankCount !== blanks.length) {
        issues.push({ id, cat, problem: `multi: ${blanks.length} blanks defined but q has ${qBlankCount} \`___\` markers` });
      }
      blanks.forEach((b, i) => {
        if (b.ans === null) {
          issues.push({ id, cat, problem: `multi blank ${i}: missing ans` });
        } else if (b.opts.length === 0) {
          issues.push({ id, cat, problem: `multi blank ${i}: missing or empty opts[]` });
        } else if (b.ans < 0 || b.ans >= b.opts.length) {
          issues.push({ id, cat, problem: `multi blank ${i}: ans=${b.ans} out of range for opts[${b.opts.length}]` });
        }
      });
    }
    if (hasField(obj, 'hint')) {
      issues.push({ id, cat, problem: 'multi: must NOT have hint field' });
    }
  }
}

if (issues.length === 0) {
  console.log(`OK — ${checked} questions checked, no schema issues.`);
  process.exit(0);
}

console.error(`FAIL — ${checked} questions checked, ${issues.length} issue(s):`);
console.error('');
const byId = new Map();
for (const issue of issues) {
  if (!byId.has(issue.id)) byId.set(issue.id, []);
  byId.get(issue.id).push(issue);
}
for (const [id, list] of byId) {
  console.error(`  [${id}] cat=${list[0].cat || '?'}`);
  for (const i of list) console.error(`    → ${i.problem}`);
  console.error('');
}
process.exit(1);
