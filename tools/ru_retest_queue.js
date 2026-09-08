#!/usr/bin/env node
/**
 * ru_retest_queue.js — generate the RU-track retest queue for one player
 * from their `players/{player}/exercises` rows (CC-logged mock / kickoff /
 * error_correction / dictation). Reads `error_types[]`, `errors[]`, `date`.
 *
 * Queue rule (decision 2026-09-08, plans/ru-track-nicole.md § Session protocol):
 * a pattern is retested cold at +3 days while it has 0 cold passes, +7 after
 * 1, +14 after 2, and leaves the queue after 3. Cold passes are recorded by
 * the session log as `meta.cold_passes: {pattern_id: n}` on any exercise
 * row; any later fail (`error_types[]`) resets the count to 0. Immediate
 * retests right after teaching are NOT evidence and are never counted.
 *
 * Output: markdown to stdout, or written to --out (generated view, never
 * hand-edit). Read-only against Firestore.
 *
 * Usage:
 *   node tools/ru_retest_queue.js                       # nicole_ru → stdout
 *   node tools/ru_retest_queue.js --player ernest_ru
 *   node tools/ru_retest_queue.js --out progress/ru-retest-queue-nicole.md
 */
const fs = require('fs');
const { fsList } = require('./_firestore');

function parseArgs(argv) {
  const a = { player: 'nicole_ru', out: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--player') a.player = argv[++i];
    else if (argv[i] === '--out') a.out = argv[++i];
  }
  return a;
}
const DAY = 86400000;
const iso = d => new Date(d).toISOString().slice(0, 10);
const gapDays = cold => (cold <= 0 ? 3 : cold === 1 ? 7 : 14);

(async () => {
  const { player, out } = parseArgs(process.argv.slice(2));
  const rows = await fsList(`players/${player}/exercises`, { pageSize: 300 });
  rows.sort((x, y) => String(x.date).localeCompare(String(y.date)) || x._id.localeCompare(y._id));
  const pat = {};
  for (const r of rows) {
    const date = r.date || iso(Number(r._id));
    for (const t of r.error_types || []) {
      const p = (pat[t] = pat[t] || { id: t, events: [], notes: [] });
      p.events.push({ date, type: 'fail', n: 1 });
    }
    // errors[] is written in the same order as error_types[] by the CC log
    // convention; pair positionally when lengths match, else fall back to topic.
    const ets = r.error_types || [], errs = r.errors || [];
    ets.forEach((t, i) => {
      const p = pat[t];
      const txt = errs.length === ets.length ? errs[i] : (r.topic || r.exercise);
      if (p && txt && p.notes.length < 3) p.notes.push(`${date.slice(5)} ${txt}`);
    });
    const cp = (r.meta && r.meta.cold_passes) || {};
    for (const [t, n] of Object.entries(cp)) {
      const p = (pat[t] = pat[t] || { id: t, events: [], notes: [] });
      p.events.push({ date, type: 'pass', n: Number(n) || 0 });
    }
  }
  const today = iso(Date.now());
  const items = Object.values(pat).map(p => {
    p.events.sort((a, b) => a.date.localeCompare(b.date));
    let cold = 0, n = 0;
    for (const e of p.events) { if (e.type === 'fail') { n++; cold = 0; } else cold += e.n; }
    p.cold = cold;
    const last = p.events.length ? p.events[p.events.length - 1].date : null;
    const due = last ? iso(new Date(last).getTime() + gapDays(cold) * DAY) : null;
    const closed = cold >= 3;
    const status = closed ? 'закрыт' : !due ? '—' : due <= today ? 'ПОРА' : 'ждёт';
    return { ...p, n, last, due, status };
  });
  const open = items.filter(i => i.status !== 'закрыт').sort((a, b) => String(a.due).localeCompare(String(b.due)));
  const closed = items.filter(i => i.status === 'закрыт');
  const lines = [];
  lines.push(`# Очередь ретестов — RU-трек, ${player}`);
  lines.push('');
  lines.push(`Сгенерировано \`tools/ru_retest_queue.js\` ${today} из ${rows.length} строк \`exercises\`. **Не править руками** — правило и источник в шапке скрипта. Холодная разминка сессии берёт строки со статусом **ПОРА** (до 5 штук), по одной, без объяснения перед ответом.`);
  lines.push('');
  lines.push('| Паттерн | Промахов | Последний | Ретест с | Холодных ✅ | Статус | Что было |');
  lines.push('|---|---|---|---|---|---|---|');
  for (const i of open) lines.push(`| \`${i.id}\` | ${i.n} | ${i.last || '—'} | ${i.due || '—'} | ${i.cold}/3 | ${i.status} | ${i.notes.join(' · ').replace(/\|/g, '/')} |`);
  if (closed.length) {
    lines.push('');
    lines.push('Закрыто (3 холодных попадания): ' + closed.map(i => `\`${i.id}\``).join(' · '));
  }
  const md = lines.join('\n') + '\n';
  if (out) { fs.writeFileSync(out, md, 'utf8'); console.log(`written ${out}: ${open.length} open, ${closed.length} closed`); }
  else process.stdout.write(md);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
