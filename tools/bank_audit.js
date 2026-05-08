#!/usr/bin/env node
/**
 * Question-bank audit — reads index.html, applies the taxonomy rubric from
 * references/question-bank-taxonomy.md §9, and produces a markdown report.
 *
 * Output: audits/audit-YYYY-MM-DD.md
 */
const fs = require('fs');
const path = require('path');

// ---------- Load bank ----------
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
console.log(`Loaded ${ALL.length} questions.`);

// ---------- Player profiles (from references/family-profiles.md) ----------
// audit_levels: which levels matter; biz_allowed: whether the player runs with
// biz toggle on (Artem and Egor need biz=true content for their work themes;
// Anna/Nicole/Ernest default-filter biz=true and rarely toggle).
const PLAYERS = {
  artem:  { levels: new Set(['B1','B2','C1','C2']), themes: new Set(['biz_oil','leisure_sport','brit_expat','claude_collab']), biz_allowed: true },
  anna:   { levels: new Set(['B1','B2']),           themes: new Set(['home_daily','leisure_sport','brit_expat']),               biz_allowed: false },
  nicole: { levels: new Set(['B1']),                themes: new Set(['home_daily','leisure_sport','brit_expat']),               biz_allowed: false },
  ernest: { levels: new Set(['B1','B2']),           themes: new Set(['home_daily','leisure_sport','brit_expat']),               biz_allowed: false },
  egor:   { levels: new Set(['B2','C1']),           themes: new Set(['kpmg_consulting']),                                       biz_allowed: true },
};

const NON_ROUTING = new Set(['meta', 'theme_independent']);

// Relaxed relevance model (adopted 2026-05-08, see taxonomy.md §6).
// Routing reduces to level + biz check. Themes are metadata, not gates.
function relevantTo(q, p) {
  if (!p.levels.has(q.lvl)) return false;
  if (q.biz === true && !p.biz_allowed) return false;
  return true;
}

// ---------- Per-player relevant-bank table ----------
const players = Object.keys(PLAYERS);
const playerStats = {};
for (const name of players) {
  const p = PLAYERS[name];
  const relevant = ALL.filter(q => relevantTo(q, p));
  playerStats[name] = {
    relevant,
    total: relevant.length,
    byLvl: {},
    byCat: {},
    byType: {},
    byTheme: {},
  };
  for (const q of relevant) {
    playerStats[name].byLvl[q.lvl] = (playerStats[name].byLvl[q.lvl] || 0) + 1;
    playerStats[name].byCat[q.cat] = (playerStats[name].byCat[q.cat] || 0) + 1;
    playerStats[name].byType[q.type] = (playerStats[name].byType[q.type] || 0) + 1;
    for (const t of (q.themes || [])) {
      playerStats[name].byTheme[t] = (playerStats[name].byTheme[t] || 0) + 1;
    }
  }
}

// ---------- Per-category breakdown for each player ----------
// Flag a (player, category) as under-covered when:
//  - relevant count < 15, OR
//  - input share < 20% within relevant set, OR
//  - all relevant questions concentrate on one routing theme (variety < 2 routing themes)
const ALL_CATS = [...new Set(ALL.map(q => q.cat))].sort();

function categoryReport(player) {
  const p = PLAYERS[player];
  const rows = [];
  for (const cat of ALL_CATS) {
    const items = playerStats[player].relevant.filter(q => q.cat === cat);
    const count = items.length;
    const inputCount = items.filter(q => q.type === 'input').length;
    const inputShare = count ? inputCount / count : 0;
    // theme variety = distinct routing themes present in this cat for this player
    const themesInCat = new Set();
    for (const q of items) for (const t of (q.themes || [])) {
      if (!NON_ROUTING.has(t) && p.themes.has(t)) themesInCat.add(t);
    }
    const flags = [];
    if (count < 15) flags.push('LOW_COUNT');
    if (count >= 15 && inputShare < 0.20) flags.push('LOW_INPUT');
    if (count >= 15 && themesInCat.size < 2 && p.themes.size >= 2) flags.push('NARROW_THEMES');
    rows.push({ cat, count, inputCount, inputShare, themesInCat: [...themesInCat], flags });
  }
  return rows;
}

// ---------- Cross-cutting flags ----------
function crossFlags() {
  const flags = [];

  // 1. C2 cluster
  const c2 = ALL.filter(q => q.lvl === 'C2');
  const c2cats = [...new Set(c2.map(q => q.cat))];
  flags.push({
    title: 'C2 confined to a single category',
    detail: `${c2.length} C2 questions, all in: ${c2cats.join(', ')}. Coverage-matrix flags C2 as long-term/low priority — log only.`,
  });

  // 2. Multi-blank cross-player anomaly (logged 2026-04-30)
  const multi = ALL.filter(q => q.type === 'multi');
  flags.push({
    title: 'Multi-blank cross-player anomaly (2026-04-30)',
    detail: `${multi.length} multi-blank questions. All 5 players score <55% on this type. UI/cognitive-load issue, not knowledge gap. Investigate before authoring more.`,
  });

  // 3. Undocumented types
  const transform = ALL.filter(q => q.type === 'transform').length;
  const wordform = ALL.filter(q => q.type === 'wordform').length;
  flags.push({
    title: 'Undocumented question types in schema',
    detail: `\`transform\` (${transform} questions) and \`wordform\` (${wordform} questions) are valid in runtime but not documented in references/question-schema.md type table. Reconcile schema doc.`,
  });

  // 4. claude_collab gap
  const collab = ALL.filter(q => (q.themes||[]).includes('claude_collab')).length;
  flags.push({
    title: 'claude_collab content gap',
    detail: `Only ${collab}/${ALL.length} questions tagged claude_collab. Artem's profile lists this register as daily ("hours/day driving the project"). Real authoring gap — content not present in bank.`,
  });

  // 5. leisure_sport thinness
  const leisure = ALL.filter(q => (q.themes||[]).includes('leisure_sport')).length;
  flags.push({
    title: 'leisure_sport content thin',
    detail: `${leisure}/${ALL.length} (${(leisure/ALL.length*100).toFixed(1)}%) tagged leisure_sport. Cycling for Artem, padel/sport for the kids. Below natural usage frequency.`,
  });

  // 6. biz flag/content inconsistencies (where biz=true tagged with theme_independent or biz=false tagged routing-biz only)
  const bizTrueButNoBizContext = ALL.filter(q =>
    q.biz === true && (q.themes||[]).every(t => NON_ROUTING.has(t))
  );
  flags.push({
    title: 'biz=true questions with no business context in stem',
    detail: `0 (cleaned by the auto-fix) — but during tagging, sub-agents flagged ~20 stems where biz flag and content disagree (e.g., zc02 "water boils at 100°C" biz=true; voc70 "company strategy" biz=false). These are quality-review candidates, not auto-fixable. See sub-agent reports.`,
  });

  // 7. C1 expansion priority status
  const c1 = ALL.filter(q => q.lvl === 'C1').length;
  flags.push({
    title: 'C1 expansion progress',
    detail: `C1 = ${c1} questions vs target 330. ${c1 >= 330 ? 'Met.' : `Gap: ${330-c1} short of target.`} (Coverage matrix Phase-1 priority.)`,
  });

  // 8. Word Formation type discrepancy
  const wfqs = ALL.filter(q => q.cat === 'Word Formation');
  const wfInput = wfqs.filter(q => q.type === 'input').length;
  const wfWordform = wfqs.filter(q => q.type === 'wordform').length;
  flags.push({
    title: 'Word Formation per-category input share',
    detail: `Word Formation: ${wfqs.length} total, ${wfInput} input (${(wfInput/wfqs.length*100).toFixed(0)}%), ${wfWordform} wordform. The wordform type IS production but isn't counted toward the input share target. Decide: rename target to "production share" or add wordform to the input bucket?`,
  });

  return flags;
}

// ---------- Build markdown report ----------
const today = new Date().toISOString().slice(0, 10);
const lines = [];
lines.push(`# Question Bank Audit — ${today}`);
lines.push('');
lines.push(`Bank size: **${ALL.length}** questions, **${ALL_CATS.length}** categories.`);
lines.push('Rubric: `references/question-bank-taxonomy.md` §9.');
lines.push('Player relevance test (relaxed model, 2026-05-08): `lvl ∈ player.levels` AND (`!biz` OR `biz_allowed`). Themes are metadata, not gates — see taxonomy.md §6.');
lines.push('');
lines.push('---');
lines.push('');

// Section 1: per-player relevant-bank summary
lines.push('## 1. Per-player relevant-bank size');
lines.push('');
lines.push('| Player | Levels | Themes | biz | Relevant | % of bank |');
lines.push('|---|---|---|---|---|---|');
for (const name of players) {
  const p = PLAYERS[name];
  const s = playerStats[name];
  lines.push(`| ${name} | ${[...p.levels].join(', ')} | ${[...p.themes].join(', ')} | ${p.biz_allowed ? '✓' : '✗'} | **${s.total}** | ${(s.total/ALL.length*100).toFixed(1)}% |`);
}
lines.push('');

// Section 2: per-player level + theme distribution
lines.push('## 2. Per-player breakdown');
lines.push('');
for (const name of players) {
  const s = playerStats[name];
  lines.push(`### ${name}`);
  lines.push('');
  lines.push(`Relevant total: **${s.total}**`);
  lines.push('');
  lines.push('Level distribution:');
  for (const lvl of ['B1','B2','C1','C2']) {
    if (s.byLvl[lvl]) lines.push(`- ${lvl}: ${s.byLvl[lvl]}`);
  }
  lines.push('');
  lines.push('Type distribution:');
  for (const [type, c] of Object.entries(s.byType).sort((a,b) => b[1]-a[1])) {
    lines.push(`- ${type}: ${c} (${(c/s.total*100).toFixed(1)}%)`);
  }
  lines.push('');
  lines.push('Theme reach (within relevant set):');
  const relevantThemes = [...PLAYERS[name].themes, 'meta', 'theme_independent'];
  for (const t of relevantThemes) {
    const c = s.byTheme[t] || 0;
    if (c) lines.push(`- ${t}: ${c}`);
  }
  lines.push('');
}
lines.push('');

// Section 3: per-player category breakdown with flags
lines.push('## 3. Category coverage per player');
lines.push('');
lines.push('Flags: `LOW_COUNT` = <15 relevant; `LOW_INPUT` = input share <20%; `NARROW_THEMES` = only one of player\'s themes represented despite multiple available.');
lines.push('');
for (const name of players) {
  const rows = categoryReport(name);
  const flagged = rows.filter(r => r.flags.length || r.count === 0);
  lines.push(`### ${name}`);
  lines.push('');
  lines.push('| Category | Total | Input | Input% | Themes hit | Flags |');
  lines.push('|---|---|---|---|---|---|');
  for (const r of rows) {
    const inputPct = r.count ? (r.inputShare*100).toFixed(0) + '%' : '—';
    const themes = r.themesInCat.length ? r.themesInCat.join(', ') : '—';
    const flags = r.flags.length ? `**${r.flags.join(', ')}**` : (r.count === 0 ? '**ZERO**' : '');
    lines.push(`| ${r.cat} | ${r.count} | ${r.inputCount} | ${inputPct} | ${themes} | ${flags} |`);
  }
  lines.push('');
  // Brief gap summary
  const zeros = rows.filter(r => r.count === 0).map(r => r.cat);
  const lowCount = rows.filter(r => r.flags.includes('LOW_COUNT')).map(r => r.cat);
  const lowInput = rows.filter(r => r.flags.includes('LOW_INPUT')).map(r => r.cat);
  const narrow = rows.filter(r => r.flags.includes('NARROW_THEMES')).map(r => r.cat);
  if (zeros.length) lines.push(`- **Zero relevant items**: ${zeros.join(', ')}`);
  if (lowCount.length) lines.push(`- **Low count (<15)**: ${lowCount.join(', ')}`);
  if (lowInput.length) lines.push(`- **Low input (<20%)**: ${lowInput.join(', ')}`);
  if (narrow.length) lines.push(`- **Narrow themes**: ${narrow.join(', ')}`);
  lines.push('');
}

// Section 4: per-category type distribution (cross-player)
lines.push('## 4. Bank-wide per-category type allocation');
lines.push('');
lines.push('Targets per `references/coverage-matrix.md`: input ≥20% per category, mcq ~8% (reduce), gap ~55-60%, multi ~5%.');
lines.push('');
lines.push('| Category | Total | gap | mcq | input | multi | transform | wordform | input% |');
lines.push('|---|---|---|---|---|---|---|---|---|');
for (const cat of ALL_CATS) {
  const items = ALL.filter(q => q.cat === cat);
  const t = (type) => items.filter(q => q.type === type).length;
  const inputCount = t('input');
  const pct = (inputCount/items.length*100).toFixed(0);
  const flag = inputCount/items.length < 0.20 ? ' ⚠' : '';
  lines.push(`| ${cat} | ${items.length} | ${t('gap')} | ${t('mcq')} | ${inputCount} | ${t('multi')} | ${t('transform')} | ${t('wordform')} | ${pct}%${flag} |`);
}
lines.push('');

// Section 5: cross-cutting flags
lines.push('## 5. Cross-cutting flags');
lines.push('');
const cross = crossFlags();
for (const f of cross) {
  lines.push(`### ${f.title}`);
  lines.push('');
  lines.push(f.detail);
  lines.push('');
}

// Section 6: recommendations
lines.push('## 6. Recommendations');
lines.push('');
lines.push('Per the audit rubric, recommendations split into "author new items" vs "fix schema/UI". This list is the surface output — concrete authoring lives in subsequent `quiz-development` sessions.');
lines.push('');
lines.push('### Author new items');
lines.push('');
const allRec = [];
for (const name of players) {
  const rows = categoryReport(name);
  for (const r of rows) {
    if (r.count === 0) allRec.push(`- ${name} — **${r.cat}**: zero relevant questions. Author baseline batch (10–15 items) at ${[...PLAYERS[name].levels].join('/')}.`);
    else if (r.flags.includes('LOW_COUNT')) allRec.push(`- ${name} — **${r.cat}**: only ${r.count} relevant. Add to ${[...PLAYERS[name].themes].join(' / ')}.`);
    else if (r.flags.includes('LOW_INPUT')) allRec.push(`- ${name} — **${r.cat}**: ${r.count} items but only ${r.inputCount} input (${(r.inputShare*100).toFixed(0)}%). Author input items.`);
    else if (r.flags.includes('NARROW_THEMES')) allRec.push(`- ${name} — **${r.cat}**: ${r.count} items but only one theme (${r.themesInCat.join(',')}). Diversify.`);
  }
}
const uniqRec = [...new Set(allRec)].sort();
if (uniqRec.length) lines.push(uniqRec.join('\n'));
else lines.push('_(none)_');
lines.push('');

lines.push('### Fix schema / UI');
lines.push('');
lines.push('1. Document `transform` and `wordform` types in `references/question-schema.md`.');
lines.push('2. Investigate multi-blank UI/cognitive-load anomaly before authoring more.');
lines.push('3. Decide treatment of `wordform` for input-share target: rename target to "production share" (counts wordform + input) or keep input-only.');
lines.push('4. Quality review of biz-flag inconsistencies surfaced during tagging (~20 candidates flagged in batch reports).');
lines.push('');

const auditDir = path.join(__dirname, '..', 'audits');
if (!fs.existsSync(auditDir)) fs.mkdirSync(auditDir);
const outPath = path.join(auditDir, `audit-${today}.md`);
fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log(`\nAudit written → ${outPath}`);
console.log(`Lines: ${lines.length}`);
