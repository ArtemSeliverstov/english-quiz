#!/usr/bin/env node
/**
 * backfill_streaks.js — one-shot backfill of `lastPlayedDate` / `currentStreak` /
 * `longestStreak` for players whose Coach-tab / Free-Write activity pre-dates
 * the Option D fix (2026-05-05). Pre-fix Coach writes never bumped these
 * parent-doc fields, so the Family tab still shows stale "last played" stamps
 * for anyone whose recent practice was Coach-only.
 *
 * Two modes:
 *
 *   DEFAULT (incremental, conservative): walks `exercises[].ts` +
 *     `coach_sessions[].created`, filters to days strictly AFTER the current
 *     `lastPlayedDate`, and replays the bump rule across those new days only.
 *     Use when you've shipped Option D and need to fold in subcollection
 *     activity that the doc-level fields missed.
 *
 *   --full (recompute from history): walks ALL activity days from every
 *     source — `qStats[*].lastSeen` (per-question quiz touches),
 *     `recentSessions[].date` (finished quiz sessions), `exercises[].ts`,
 *     `coach_sessions[].created` — and replays the bump rule end-to-end. Use
 *     when the existing `currentStreak` is wrong because pre-Option-D Coach
 *     days broke a chain that the full history shows was unbroken.
 *
 * Both modes apply a strict "improve only" rule when patching:
 *   - `longestStreak` = max(existing, recomputed)            (never decreases)
 *   - `lastPlayedDate` = max(existing, recomputed)           (never decreases)
 *   - `currentStreak` updated only if the recomputed sequence ends at or
 *     after the existing `lastPlayedDate` AND the recomputed value is
 *     ≥ existing (legacy quiz days aged out of `recentSessions` would
 *     otherwise erase a streak the player legitimately earned).
 *
 * Usage:
 *   node tools/backfill_streaks.js                  # incremental, dry run
 *   node tools/backfill_streaks.js --apply          # incremental, PATCH
 *   node tools/backfill_streaks.js --full           # full-history dry run
 *   node tools/backfill_streaks.js --full --apply
 *   node tools/backfill_streaks.js anna --apply     # single player
 *   node tools/backfill_streaks.js --skip nicole    # exclude (e.g. just-restored player)
 */

const { fsGet, fsPatch, fsList, docToPlain, PLAYERS } = require('./_firestore');

function parseArgs(argv) {
  const out = { apply: false, full: false, players: [], skip: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') { out.help = true; }
    else if (a === '--apply') { out.apply = true; }
    else if (a === '--full') { out.full = true; }
    else if (a === '--skip') { out.skip.push(argv[++i]); }
    else if (PLAYERS.includes(a)) { out.players.push(a); }
  }
  if (!out.players.length) out.players = PLAYERS.slice();
  out.players = out.players.filter(p => !out.skip.includes(p));
  return out;
}

function dateOnly(iso) {
  if (!iso) return null;
  return String(iso).slice(0, 10); // YYYY-MM-DD
}

function isYesterday(prev, today) {
  const t = new Date(today + 'T00:00:00Z').getTime();
  const p = new Date(prev + 'T00:00:00Z').getTime();
  return (t - p) === 86400000;
}

async function gatherActivityDays(player, full) {
  const [exDocs, csDocs] = await Promise.all([
    fsList(`players/${player}/exercises`, { pageSize: 300 }).catch(() => []),
    fsList(`players/${player}/coach_sessions`, { pageSize: 300 }).catch(() => []),
  ]);
  const days = new Set();
  for (const e of exDocs) {
    const id = Number(e._id);
    const iso = Number.isFinite(id) ? new Date(id).toISOString() : null;
    const d = dateOnly(iso);
    if (d) days.add(d);
  }
  for (const s of csDocs) {
    const d = dateOnly(s.created);
    if (d) days.add(d);
  }
  return { days, exCount: exDocs.length, csCount: csDocs.length };
}

function addQuizDays(days, doc) {
  // qStats[*].lastSeen → most-recent-touch per qid (UTC ms). Aggregating across
  // all qids gives every day where the *last* touch of any qid occurred.
  let qStatsHits = 0;
  for (const s of Object.values(doc.qStats || {})) {
    if (s && typeof s.lastSeen === 'number' && s.lastSeen > 0) {
      const d = dateOnly(new Date(s.lastSeen).toISOString());
      if (d) { days.add(d); qStatsHits++; }
    }
  }
  // recentSessions[].date → finished quiz sessions (last ~50, FIFO).
  let recentHits = 0;
  for (const r of (doc.recentSessions || [])) {
    if (r && r.date) {
      const d = dateOnly(r.date);
      if (d) { days.add(d); recentHits++; }
    }
  }
  return { qStatsHits, recentHits };
}

function replayStreak(sortedDays) {
  // Walk chronologically, applying the same idempotent first-of-day rule the
  // live `bumpDailyStreak` uses: yesterday → +1, gap → reset to 1.
  let lastPlayedDate = null;
  let currentStreak = 0;
  let longestStreak = 0;
  for (const d of sortedDays) {
    if (lastPlayedDate === d) continue;
    currentStreak = isYesterday(lastPlayedDate || '', d) ? currentStreak + 1 : 1;
    lastPlayedDate = d;
    longestStreak = Math.max(longestStreak, currentStreak);
  }
  return { lastPlayedDate, currentStreak, longestStreak };
}

async function backfillOne(player, apply, full) {
  const docRaw = await fsGet(`players/${player}`);
  const cur = docRaw ? docToPlain(docRaw) : {};
  const before = {
    lastPlayedDate: cur.lastPlayedDate || null,
    currentStreak: cur.currentStreak || 0,
    longestStreak: cur.longestStreak || 0,
  };

  const { days, exCount, csCount } = await gatherActivityDays(player, full);
  let qStatsHits = 0, recentHits = 0;
  if (full) {
    const r = addQuizDays(days, cur);
    qStatsHits = r.qStatsHits;
    recentHits = r.recentHits;
  }

  const sorted = [...days].sort();

  let after, mode;
  if (full) {
    // Full recompute: replay across the entire history, then apply the
    // "improve only" rule against `before`.
    const recomputed = replayStreak(sorted);
    after = {
      lastPlayedDate: (recomputed.lastPlayedDate && recomputed.lastPlayedDate > (before.lastPlayedDate || ''))
        ? recomputed.lastPlayedDate
        : before.lastPlayedDate,
      currentStreak: (
        recomputed.lastPlayedDate
        && recomputed.lastPlayedDate >= (before.lastPlayedDate || '')
        && recomputed.currentStreak > before.currentStreak
      )
        ? recomputed.currentStreak
        : before.currentStreak,
      longestStreak: Math.max(before.longestStreak || 0, recomputed.longestStreak || 0),
    };
    mode = 'full';
  } else {
    // Incremental: walk only days strictly newer than the existing stamp.
    const floor = before.lastPlayedDate || '0000-01-01';
    const newDays = sorted.filter(d => d > floor);
    after = { ...before };
    for (const d of newDays) {
      if (after.lastPlayedDate === d) continue;
      after.currentStreak = isYesterday(after.lastPlayedDate || '', d)
        ? (after.currentStreak || 0) + 1
        : 1;
      after.lastPlayedDate = d;
      after.longestStreak = Math.max(after.longestStreak || 0, after.currentStreak);
    }
    mode = 'incremental';
  }

  const changed = JSON.stringify(before) !== JSON.stringify(after);
  const result = {
    player,
    mode,
    before,
    after,
    sources: full
      ? { ex_docs: exCount, cs_docs: csCount, qstats_hits: qStatsHits, recent_sessions: recentHits, unique_days: sorted.length }
      : { ex_docs: exCount, cs_docs: csCount, unique_subcoll_days: sorted.length },
    changed,
    applied: false,
  };

  if (changed && apply) {
    await fsPatch(`players/${player}`, ['lastPlayedDate', 'currentStreak', 'longestStreak'], after);
    result.applied = true;
  }

  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.error('Usage: node tools/backfill_streaks.js [player ...] [--full] [--apply] [--skip name]');
    process.exit(0);
  }

  const results = [];
  for (const p of args.players) {
    try {
      results.push(await backfillOne(p, args.apply, args.full));
    } catch (e) {
      results.push({ player: p, error: e.message });
    }
  }

  console.log(JSON.stringify({ mode: args.full ? 'full' : 'incremental', apply: args.apply, results }, null, 2));
  if (!args.apply) {
    console.error('\n(dry run — re-run with --apply to PATCH)');
  }
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
