#!/usr/bin/env node
/**
 * pv_cold_streak.js — compute per-PV cold-production streaks for graduation
 * tracking (🏆 in progress/phrasal-verbs-tracker.md).
 *
 * Cold-production sources (per the tracker's tier hierarchy):
 *   tier 1: coach_sessions[].pvs_used_correctly (free-write, unprompted)
 *   tier 2: exercises items[] of type russian_trap (correct/incorrect)
 *   tier 3: exercises items[] of type translation (correct/incorrect)
 *
 * NOT counted: gap, mcq, particle_sort (recognition, not production).
 * Quiz `input` qStats deferred to v2 — qStats has aggregate counts only,
 * not per-attempt timestamps needed for streak computation.
 *
 * Streak rule (🏆 graduation):
 *   3+ cold wins across ≥2 distinct formats, no failures during the streak.
 *
 * Usage:
 *   node tools/pv_cold_streak.js artem               # all PVs, table
 *   node tools/pv_cold_streak.js artem --pv "get across"   # single PV deep-dive
 *   node tools/pv_cold_streak.js artem --json        # machine-readable
 *   node tools/pv_cold_streak.js artem --graduated   # only 🏆 candidates
 *
 * Player keys: artem (others have no PV tracker; script will warn).
 *
 * Tag → PV resolution: exercise tags use snake_case (e.g. "go_on", "look_for").
 * Meta tags (categorization, not the PV itself) are filtered via TAG_DENYLIST.
 * If new categorization tags appear, add them to TAG_DENYLIST.
 */

const { fsList, PLAYERS } = require('./_firestore');

// Tags that are categorization, not the PV itself. Anything else in an exercise's
// tags array is treated as a PV identifier in snake_case form.
const TAG_DENYLIST = new Set([
  // type/category labels
  'phrasal_verb', 'phrasal_verbs', 'collocation', 'preposition_fixed_phrase',
  // failure-mode labels
  'pv_pair_confusion', 'pv_substitution_trap', 'directionality_trap',
  'particle_swap', 'calque', 'verb_no_prep_ru', 'preposition_swap',
  // meaning/semantic labels (added per-item, not PV identity)
  'discovery', 'highlight', 'eliminate', 'resolve', 'outcome',
  'assume_control', 'quit', 'establish', 'raise_topic', 'devise',
  'assume_responsibility', 'reject', 'recover', 'communicate', 'cancel',
]);

// Streak rule constants
const STREAK_THRESHOLD = 3;          // need 3 wins
const STREAK_MIN_FORMATS = 2;        // across at least 2 formats
const FAILURE_DECAY_WINDOW_DAYS = 30; // 2 failures in 30d → drop to 🟡

// ─── arg parsing ───────────────────────────────────────────────────────────

function parseArgs(argv) {
  const out = { player: null, pv: null, json: false, graduated: false, help: false };
  let i = 0;
  while (i < argv.length) {
    const a = argv[i];
    if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--json') out.json = true;
    else if (a === '--graduated') out.graduated = true;
    else if (a === '--pv') out.pv = argv[++i];
    else if (!out.player) out.player = a;
    i++;
  }
  return out;
}

// ─── PV identification ─────────────────────────────────────────────────────

function tagToPv(tag) {
  // "go_on" → "go on", "follow_up_on" → "follow up on"
  return tag.replace(/_/g, ' ').toLowerCase().trim();
}

function pvToKey(pv) {
  // Normalize for grouping: lowercase, trim, single spaces.
  return pv.toLowerCase().replace(/\s+/g, ' ').trim();
}

function extractPvFromTags(tags) {
  if (!Array.isArray(tags)) return null;
  for (const t of tags) {
    if (typeof t !== 'string') continue;
    if (TAG_DENYLIST.has(t)) continue;
    if (t.startsWith('pv_')) continue;
    if (t.endsWith('_trap') || t.endsWith('_confusion') || t.endsWith('_swap')) continue;
    return tagToPv(t);
  }
  return null;
}

// ─── data ingestion ────────────────────────────────────────────────────────

async function ingestCoachSessions(player) {
  const events = [];
  const sessions = await fsList(`players/${player}/coach_sessions`).catch(() => []);
  for (const s of sessions) {
    if (s.mode !== 'free_write' && s.mode !== 'cc_session') continue;
    const ts = s.created || s.ended || null;
    const pvs = Array.isArray(s.pvs_used_correctly) ? s.pvs_used_correctly : [];
    for (const pv of pvs) {
      events.push({
        pv: pvToKey(pv),
        timestamp: ts,
        format: 'free_write',
        correct: true,
        source_id: s._id || s.session_id || '(unknown)',
      });
    }
  }
  return events;
}

async function ingestExercises(player) {
  const events = [];
  const sessions = await fsList(`players/${player}/exercises`).catch(() => []);
  for (const sess of sessions) {
    if (sess.auto_suspected === true) continue; // skip flagged sessions
    const items = Array.isArray(sess.items) ? sess.items : [];
    for (const item of items) {
      const exType = item.type || sess.exercise_type;
      if (exType !== 'translation' && exType !== 'russian_trap') continue;
      const pv = extractPvFromTags(item.tags);
      if (!pv) continue;
      events.push({
        pv: pvToKey(pv),
        timestamp: item.timestamp || sess.created || sess._id || null,
        format: exType,
        correct: item.correct === true,
        source_id: item.exercise_id || sess._id || '(unknown)',
      });
    }
  }
  return events;
}

// ─── streak computation ───────────────────────────────────────────────────

function computeStreak(events) {
  // events: chronological array for one PV
  // Returns: { streak, formats, total_correct, total_wrong, last_seen,
  //   recent_failures, status, drill_ids }
  if (!events.length) {
    return {
      streak: 0, formats: [], total_correct: 0, total_wrong: 0,
      last_seen: null, recent_failures: 0, status: 'no_data', drill_ids: [],
    };
  }
  const sorted = events.slice().sort((a, b) =>
    String(a.timestamp || '').localeCompare(String(b.timestamp || ''))
  );

  // Walk backwards from latest, counting consecutive correct
  let streak = 0;
  const formats = new Set();
  const drill_ids = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].correct) {
      streak++;
      formats.add(sorted[i].format);
      drill_ids.push(sorted[i].source_id);
    } else {
      break;
    }
  }

  const total_correct = sorted.filter(e => e.correct).length;
  const total_wrong = sorted.length - total_correct;
  const last_seen = sorted[sorted.length - 1].timestamp;

  // Recent failures: count failures in last 30 days
  const cutoff = new Date(Date.now() - FAILURE_DECAY_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const recent_failures = sorted.filter(e =>
    !e.correct && String(e.timestamp || '') >= cutoff
  ).length;

  // Status determination
  let status;
  if (streak >= STREAK_THRESHOLD && formats.size >= STREAK_MIN_FORMATS) {
    status = 'graduated';   // 🏆
  } else if (streak >= 1) {
    status = 'building';    // partial streak
  } else if (recent_failures >= 2) {
    status = 'regressing';  // 🟡 candidate
  } else {
    status = 'unstable';    // mixed history, no streak
  }

  return {
    streak, formats: [...formats], total_correct, total_wrong,
    last_seen, recent_failures, status, drill_ids,
  };
}

// ─── output ───────────────────────────────────────────────────────────────

const STATUS_EMOJI = {
  graduated: '🏆',
  building: '🟢→🏆',
  regressing: '🟡',
  unstable: '⚪',
  no_data: '—',
};

function formatTable(rows) {
  if (!rows.length) {
    return '(no PVs with cold-production data — start drilling translation/russian_trap items or run free-write sessions)';
  }
  const order = { graduated: 0, building: 1, regressing: 2, unstable: 3, no_data: 4 };
  rows.sort((a, b) => {
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return b.streak - a.streak || a.pv.localeCompare(b.pv);
  });
  const lines = [];
  lines.push('PV                          | Status      | Streak | Formats           | Correct/Wrong | Last seen');
  lines.push('-'.repeat(110));
  for (const r of rows) {
    const pv = r.pv.padEnd(27);
    const st = (STATUS_EMOJI[r.status] + ' ' + r.status).padEnd(11);
    const streak = `${r.streak}/${STREAK_THRESHOLD}`.padEnd(6);
    const fmts = (r.formats.join(',') || '(none)').padEnd(17);
    const cw = `${r.total_correct}/${r.total_wrong}`.padEnd(13);
    const last = (r.last_seen || '').slice(0, 10) || '(never)';
    lines.push(`${pv} | ${st} | ${streak} | ${fmts} | ${cw} | ${last}`);
  }
  return lines.join('\n');
}

function formatPvDeepDive(pv, events, computed) {
  const lines = [];
  lines.push(`PV: ${pv}`);
  lines.push(`Status: ${STATUS_EMOJI[computed.status]} ${computed.status}`);
  lines.push(`Current streak: ${computed.streak}/${STREAK_THRESHOLD} (across ${computed.formats.length} format(s): ${computed.formats.join(', ') || 'none'})`);
  lines.push(`Lifetime: ${computed.total_correct} correct / ${computed.total_wrong} wrong`);
  lines.push(`Last seen: ${computed.last_seen || '(never)'}`);
  lines.push(`Recent failures (30d): ${computed.recent_failures}`);
  if (computed.status === 'graduated') {
    lines.push(`\n✅ Graduation criteria met: ≥${STREAK_THRESHOLD} cold wins across ≥${STREAK_MIN_FORMATS} formats, no failure during streak.`);
    lines.push(`   Update phrasal-verbs-tracker.md: ✓ → 🏆 since ${(computed.last_seen || '').slice(0, 10)} [${computed.drill_ids.slice(0, 3).join(', ')}]`);
  } else if (computed.status === 'building') {
    const need = STREAK_THRESHOLD - computed.streak;
    const fmtsNeed = Math.max(0, STREAK_MIN_FORMATS - computed.formats.length);
    lines.push(`\nNeed ${need} more cold win(s)${fmtsNeed ? ` across ${fmtsNeed} additional format(s)` : ''} to graduate.`);
  }
  lines.push(`\nEvent timeline (oldest → newest):`);
  const sorted = events.slice().sort((a, b) =>
    String(a.timestamp || '').localeCompare(String(b.timestamp || ''))
  );
  for (const e of sorted) {
    const mark = e.correct ? '✓' : '✗';
    lines.push(`  ${(e.timestamp || '').slice(0, 10)} ${mark} ${e.format.padEnd(13)} ${e.source_id}`);
  }
  return lines.join('\n');
}

// ─── main ──────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.player) {
    console.error('Usage: node tools/pv_cold_streak.js <player> [--pv "PV name"] [--json] [--graduated]');
    console.error(`  player: one of ${PLAYERS.join(', ')}`);
    console.error('  --pv "get across"  — deep-dive on one PV (event timeline + streak math)');
    console.error('  --graduated        — table with only 🏆 candidates');
    console.error('  --json             — machine-readable output');
    process.exit(args.help ? 0 : 1);
  }
  if (!PLAYERS.includes(args.player)) {
    console.error(`Unknown player "${args.player}". Valid: ${PLAYERS.join(', ')}`);
    process.exit(1);
  }
  if (args.player !== 'artem') {
    console.error(`Note: only Artem has a PV tracker. Other players will return empty data.`);
  }

  const [coachEvents, exerciseEvents] = await Promise.all([
    ingestCoachSessions(args.player),
    ingestExercises(args.player),
  ]);
  const allEvents = [...coachEvents, ...exerciseEvents];

  // Group by PV
  const byPv = {};
  for (const e of allEvents) {
    (byPv[e.pv] = byPv[e.pv] || []).push(e);
  }

  // Single-PV deep-dive
  if (args.pv) {
    const key = pvToKey(args.pv);
    const events = byPv[key] || [];
    const computed = computeStreak(events);
    if (args.json) {
      console.log(JSON.stringify({ pv: key, ...computed, events }, null, 2));
    } else {
      console.log(formatPvDeepDive(key, events, computed));
    }
    return;
  }

  // Full table
  const rows = Object.entries(byPv).map(([pv, events]) => ({
    pv,
    ...computeStreak(events),
  }));

  const filtered = args.graduated
    ? rows.filter(r => r.status === 'graduated' || (r.status === 'building' && r.streak === STREAK_THRESHOLD - 1))
    : rows;

  if (args.json) {
    console.log(JSON.stringify(filtered, null, 2));
  } else {
    console.log(formatTable(filtered));
    console.log(`\nTotal PVs with cold-production data: ${rows.length}`);
    console.log(`🏆 graduated: ${rows.filter(r => r.status === 'graduated').length}`);
    console.log(`🟢→🏆 building: ${rows.filter(r => r.status === 'building').length}`);
    console.log(`🟡 regressing: ${rows.filter(r => r.status === 'regressing').length}`);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
