#!/usr/bin/env node
/**
 * Topic-level audit. Groups questions by (category, prefix) — prefix as topic
 * proxy — and reports per-topic coverage. Surfaces topic concentration
 * (one prefix dominates a category) and topic sparsity (many prefixes with <10
 * each).
 *
 * Output: audits/audit-topics-YYYY-MM-DD.md
 */
const fs = require('fs');
const path = require('path');

// Load bank
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const startMatch = html.match(/const ALL_QUESTIONS\s*=\s*\[/);
const start = startMatch.index + startMatch[0].length - 1;
let depth = 0, i = start, inStr = false, sc = null;
while (i < html.length) {
  const c = html[i];
  if (inStr) { if (c === '\\') { i += 2; continue; } if (c === sc) inStr = false; }
  else { if (c === "'" || c === '"') { inStr = true; sc = c; }
         else if (c === '[') depth++;
         else if (c === ']') { depth--; if (depth === 0) { i++; break; } } }
  i++;
}
const ALL = eval(html.slice(start, i));

// Prefix = ID with trailing digits stripped
function prefixOf(id) {
  return id.replace(/\d+$/, '') || id;
}

// Group: cat → prefix → questions[]
const byCatPrefix = {};
for (const q of ALL) {
  const p = prefixOf(q.id);
  byCatPrefix[q.cat] = byCatPrefix[q.cat] || {};
  byCatPrefix[q.cat][p] = byCatPrefix[q.cat][p] || [];
  byCatPrefix[q.cat][p].push(q);
}

// Per-category report
const cats = Object.keys(byCatPrefix).sort();
const lines = [];
const today = new Date().toISOString().slice(0, 10);
lines.push(`# Topic-level Bank Audit — ${today}`);
lines.push('');
lines.push(`Bank: ${ALL.length} questions, ${cats.length} categories.`);
lines.push('');
lines.push('Topic proxy: ID prefix (everything before the trailing digits). Within each category, prefix groups represent sub-topics.');
lines.push('');
lines.push('Thresholds: ');
lines.push('- **Singleton prefix**: 1–4 questions = sub-topic with too little practice volume');
lines.push('- **Sparse prefix**: 5–9 = below the leakage-prevention floor (≥10 per topic)');
lines.push('- **Healthy prefix**: ≥10');
lines.push('- **Concentration warning**: any single prefix carries >50% of a category with ≥30 total');
lines.push('');
lines.push('---');
lines.push('');

const summary = [];

for (const cat of cats) {
  const prefixes = byCatPrefix[cat];
  const prefixList = Object.keys(prefixes);
  const total = ALL.filter(q => q.cat === cat).length;
  prefixList.sort((a, b) => prefixes[b].length - prefixes[a].length);

  // Compute concentration
  const top = prefixes[prefixList[0]] || [];
  const topShare = top.length / total;
  const singletons = prefixList.filter(p => prefixes[p].length <= 4);
  const sparse = prefixList.filter(p => prefixes[p].length >= 5 && prefixes[p].length <= 9);
  const healthy = prefixList.filter(p => prefixes[p].length >= 10);

  const flags = [];
  if (topShare > 0.50 && total >= 30) flags.push('CONCENTRATION');
  if (singletons.length >= 5) flags.push('FRAGMENTED');
  if (healthy.length === 0 && total >= 15) flags.push('NO_HEALTHY_TOPIC');

  lines.push(`## ${cat}`);
  lines.push('');
  lines.push(`Total: **${total}** · prefixes: ${prefixList.length} · healthy ≥10: ${healthy.length} · sparse 5–9: ${sparse.length} · singleton ≤4: ${singletons.length}`);
  if (flags.length) lines.push(`Flags: **${flags.join(', ')}**`);
  lines.push('');
  lines.push('| Prefix | Count | Levels | Types | Top sample IDs |');
  lines.push('|---|---|---|---|---|');
  for (const p of prefixList) {
    const items = prefixes[p];
    const lvls = [...new Set(items.map(q => q.lvl))].sort().join(',');
    const typeCounts = {};
    for (const q of items) typeCounts[q.type] = (typeCounts[q.type] || 0) + 1;
    const types = Object.entries(typeCounts).sort((a,b)=>b[1]-a[1])
      .map(([t,n]) => `${t}(${n})`).join(' ');
    const sampleIds = items.slice(0, 4).map(q => q.id).join(', ');
    const flag = items.length <= 4 ? ' ⚠' : items.length <= 9 ? ' △' : '';
    lines.push(`| \`${p}\` | ${items.length}${flag} | ${lvls} | ${types} | ${sampleIds} |`);
  }
  lines.push('');
  summary.push({ cat, total, healthy: healthy.length, sparse: sparse.length, singletons: singletons.length, topShare, flags });
}

// Top-level summary
lines.unshift('');
lines.unshift('---');
lines.unshift('');
const flagged = summary.filter(s => s.flags.length);
const summaryLines = [];
summaryLines.push('## Summary across categories');
summaryLines.push('');
summaryLines.push('| Category | Total | Healthy ≥10 | Sparse 5–9 | Singletons ≤4 | Top-prefix share | Flags |');
summaryLines.push('|---|---|---|---|---|---|---|');
for (const s of summary.sort((a,b)=>b.total-a.total)) {
  summaryLines.push(`| ${s.cat} | ${s.total} | ${s.healthy} | ${s.sparse} | ${s.singletons} | ${(s.topShare*100).toFixed(0)}% | ${s.flags.join(', ')} |`);
}
summaryLines.push('');
summaryLines.push('### Categories flagged');
summaryLines.push('');
if (flagged.length === 0) summaryLines.push('_(none)_');
else for (const s of flagged) summaryLines.push(`- **${s.cat}** — ${s.flags.join(', ')}`);
summaryLines.push('');

lines.unshift(...summaryLines);

const outDir = path.join(__dirname, '..', 'audits');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
const outPath = path.join(outDir, `audit-topics-${today}.md`);
fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log(`Topic audit → ${outPath}`);
console.log(`Lines: ${lines.length}`);
console.log(`Flagged categories: ${flagged.length} of ${summary.length}`);
for (const s of flagged) console.log(`  ${s.cat} — ${s.flags.join(', ')}`);
