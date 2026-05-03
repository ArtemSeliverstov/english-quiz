#!/usr/bin/env node
/**
 * backup_players.js — daily Firestore snapshot for all 5 players.
 *
 * Writes one self-contained JSON per player to:
 *   backups/YYYY-MM-DD/{player}.json
 *
 * Each file contains:
 *   - doc:            the player document (qStats, catStats, coach_notes, ...)
 *   - exercises:      every doc in players/{name}/exercises (subcollection)
 *   - coach_sessions: every doc in players/{name}/coach_sessions (subcollection)
 *   - _meta:          snapshot timestamp, player key
 *
 * Use case: recovery after contamination or accidental wipe. The 2026-05-02
 * Nicole incident was only recoverable because RTDB was still live; once RTDB
 * sunsets (~2026-05-28), this is the only recovery source. See
 * plans/data-integrity-plan.md for the full prevention/recovery rationale.
 *
 * Usage:
 *   node tools/backup_players.js                # write today's snapshot
 *   node tools/backup_players.js --date 2026-05-03
 *   node tools/backup_players.js --player anna  # single-player snapshot
 *   node tools/backup_players.js --dry-run      # print summary, write nothing
 */

const fs = require('fs');
const path = require('path');
const { fsGet, fsList, docToPlain, PLAYERS } = require('./_firestore');

function parseArgs(argv) {
  const out = { date: null, player: null, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--date') out.date = argv[++i];
    else if (a === '--player') out.player = argv[++i];
  }
  return out;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

async function snapshotPlayer(player) {
  const [doc, exercises, coach_sessions] = await Promise.all([
    fsGet(`players/${player}`).then(d => d ? docToPlain(d) : null),
    fsList(`players/${player}/exercises`, { pageSize: 300 }).catch(() => []),
    fsList(`players/${player}/coach_sessions`, { pageSize: 300 }).catch(() => []),
  ]);
  return {
    _meta: {
      snapshotTs: new Date().toISOString(),
      player,
    },
    doc,
    exercises,
    coach_sessions,
  };
}

function summarise(snapshot) {
  const d = snapshot.doc || {};
  return {
    player: snapshot._meta.player,
    totalAnswered: d.totalAnswered ?? null,
    totalCorrect: d.totalCorrect ?? null,
    totalSessions: d.totalSessions ?? null,
    qStatsKeys: d.qStats ? Object.keys(d.qStats).length : 0,
    catStatsKeys: d.catStats ? Object.keys(d.catStats).length : 0,
    exercises: snapshot.exercises.length,
    coach_sessions: snapshot.coach_sessions.length,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.error('Usage: node tools/backup_players.js [--date YYYY-MM-DD] [--player NAME] [--dry-run]');
    process.exit(0);
  }
  if (args.player && !PLAYERS.includes(args.player)) {
    console.error(`Invalid player "${args.player}" — must be one of ${PLAYERS.join(', ')}`);
    process.exit(1);
  }

  const dateStr = args.date || todayISO();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    console.error(`Invalid --date "${dateStr}" — expected YYYY-MM-DD`);
    process.exit(1);
  }

  const players = args.player ? [args.player] : PLAYERS;
  const snapshots = await Promise.all(players.map(p => snapshotPlayer(p).catch(e => ({ _error: e.message, _meta: { player: p } }))));

  const summary = snapshots.map(s => s._error ? { player: s._meta.player, error: s._error } : summarise(s));
  console.error('Snapshot summary (' + dateStr + '):');
  for (const row of summary) {
    if (row.error) console.error(`  ${row.player}: ERROR — ${row.error}`);
    else console.error(`  ${row.player}: doc=${row.qStatsKeys} qids, ${row.catStatsKeys} cats | ${row.exercises} ex, ${row.coach_sessions} coach`);
  }

  if (args.dryRun) {
    console.error('\n--dry-run set, NOT writing.');
    return;
  }

  const outDir = path.join('backups', dateStr);
  fs.mkdirSync(outDir, { recursive: true });
  for (const s of snapshots) {
    if (s._error) continue;
    const file = path.join(outDir, `${s._meta.player}.json`);
    fs.writeFileSync(file, JSON.stringify(s, null, 2));
  }
  console.error('\nWrote ' + snapshots.filter(s => !s._error).length + ' files to ' + outDir + '/');

  console.log(JSON.stringify({ ok: true, dir: outDir, summary }, null, 2));
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
