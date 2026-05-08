#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const startMatch = html.match(/const ALL_QUESTIONS\s*=\s*\[/);
const start = startMatch.index + startMatch[0].length - 1;
let depth = 0, i = start, inStr = false, sc = null;
while (i < html.length) {
  const c = html[i];
  if (inStr) {
    if (c === '\\') { i += 2; continue; }
    if (c === sc) inStr = false;
  } else {
    if (c === "'" || c === '"') { inStr = true; sc = c; }
    else if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) { i++; break; } }
  }
  i++;
}
const arrText = html.slice(start, i);
console.log('Array text length:', arrText.length);
console.log('Last 60 chars:', JSON.stringify(arrText.slice(-60)));

let arr;
try { arr = eval(arrText); }
catch (e) { console.error('parse error:', e.message); process.exit(2); }
console.log(`Parsed ${arr.length} questions`);

const TAGS = new Set(['biz_oil','kpmg_consulting','home_daily','leisure_sport','brit_expat','claude_collab','meta','theme_independent']);
const ROUTING = new Set(['biz_oil','kpmg_consulting','home_daily','leisure_sport','brit_expat','claude_collab']);

let withThemes = 0, noThemes = 0, viol = 0;
for (const q of arr) {
  if (!Array.isArray(q.themes) || !q.themes.length) { noThemes++; continue; }
  withThemes++;
  const bad = q.themes.filter(t => !TAGS.has(t));
  const hasR = q.themes.some(t => ROUTING.has(t));
  const hasNR = q.themes.some(t => !ROUTING.has(t));
  if (bad.length || (hasR && hasNR)) {
    viol++;
    if (viol <= 5) console.log('  Viol:', q.id, q.themes);
  }
}
console.log(`With themes:    ${withThemes}`);
console.log(`Without themes: ${noThemes}`);
console.log(`Violations:     ${viol}`);

// biz=true rule
let bizMissing = 0;
for (const q of arr) {
  if (q.biz === true) {
    if (!q.themes || !q.themes.includes('biz_oil') || !q.themes.includes('kpmg_consulting')) {
      bizMissing++;
      if (bizMissing <= 5) console.log('  biz=true missing pair:', q.id, q.themes);
    }
  }
}
console.log(`biz=true missing pair: ${bizMissing}`);

// Sample
console.log('\nSamples:');
for (const idx of [0, 100, 500, 1000, 2024]) {
  const q = arr[idx];
  console.log(`  [${idx}] ${q.id} cat=${q.cat} biz=${q.biz} themes=${JSON.stringify(q.themes)}`);
}
