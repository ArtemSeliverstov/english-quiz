#!/usr/bin/env node
/**
 * check_player_integrity.js — three-invariant contamination probe.
 *
 * Detects within ≤24h the kind of cross-player overwrite that hit Nicole on
 * 2026-05-02 (her doc replaced with a copy of Artem's data; only caught the
 * next day during stats review). See plans/data-integrity-plan.md.
 *
 * Three invariants:
 *   1. cross-player overlap — any two players sharing > overlapThreshold of
 *      qStats keys with byte-identical lastSeen values flag. The 05-02 case
 *      would have hit 100%.
 *   2. createdAt drift — current createdAt vs last-known baseline. The 05-02
 *      case had createdAt jumping from 2026-03-01 to 2026-05-02.
 *   3. catastrophic shift — totalAnswered delta > shiftThreshold without
 *      recentSessions accounting for it. The 05-02 case jumped 780 → 2795.
 *
 * Baseline lives at tools/data-integrity-baseline.json. First run creates it.
 * Subsequent runs compare against it, then update it on success (no flags).
 *
 * Exit codes:
 *   0  — all invariants clean
 *   1  — at least one flag fired (output describes which)
 *   2  — operational error (network, parse, etc.)
 *
 * Usage:
 *   node tools/check_player_integrity.js                   # check + auto-update baseline if clean
 *   node tools/check_player_integrity.js --dry-run         # check, never update baseline
 *   node tools/check_player_integrity.js --reset-baseline  # force-rewrite baseline from current state
 *   node tools/check_player_integrity.js --json            # machine-readable output
 */

const fs = require('fs');
const path = require('path');
const { fsGet, docToPlain, PLAYERS } = require('./_firestore');

const BASELINE_PATH = path.join(__dirname, 'data-integrity-baseline.json');

// Thresholds
const OVERLAP_THRESHOLD = 0.10;   // 10% shared qStats keys with identical lastSeen → flag
const SHIFT_THRESHOLD = 100;       // totalAnswered delta > 100 without session backing → flag
const MIN_OVERLAP_KEYS = 5;        // ignore overlap if < 5 shared keys (sparse data)

function parseArgs(argv) {
  const out = { dryRun: false, reset: false, json: false };
  for (const a of argv) {
    if (a === '--dry-run') out.dryRun = true;
    else if (a === '--reset-baseline') out.reset = true;
    else if (a === '--json') out.json = true;
    else if (a === '-h' || a === '--help') out.help = true;
  }
  return out;
}

async function fetchPlayer(name) {
  const doc = await fsGet(`players/${name}`).then(d => d ? docToPlain(d) : null);
  if (!doc) throw new Error(`No doc for ${name}`);
  return doc;
}

function countSessionsTotal(recentSessions) {
  if (!Array.isArray(recentSessions)) return 0;
  return recentSessions.reduce((acc, s) => acc + (Number(s?.total) || 0), 0);
}

function loadBaseline() {
  if (!fs.existsSync(BASELINE_PATH)) return null;
  try { return JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8')); }
  catch (e) { return null; }
}

function writeBaseline(snapshot) {
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(snapshot, null, 2));
}

// Invariant 1: cross-player qStats overlap with byte-identical lastSeen.
function checkOverlap(docs) {
  const flags = [];
  const names = Object.keys(docs);
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const a = names[i], b = names[j];
      const aQ = docs[a].qStats || {};
      const bQ = docs[b].qStats || {};
      const aKeys = Object.keys(aQ);
      const bKeys = Object.keys(bQ);
      const sharedKeys = aKeys.filter(k => k in bQ);
      if (sharedKeys.length < MIN_OVERLAP_KEYS) continue;

      let identical = 0;
      const sampleIdentical = [];
      for (const k of sharedKeys) {
        const aLs = aQ[k]?.lastSeen;
        const bLs = bQ[k]?.lastSeen;
        if (aLs != null && bLs != null && aLs === bLs) {
          identical++;
          if (sampleIdentical.length < 3) sampleIdentical.push(k);
        }
      }
      const ratio = identical / Math.max(aKeys.length, bKeys.length);
      if (ratio > OVERLAP_THRESHOLD) {
        flags.push({
          invariant: 'cross_player_overlap',
          severity: ratio > 0.5 ? 'critical' : 'warn',
          players: [a, b],
          identicalCount: identical,
          ratio: Number(ratio.toFixed(3)),
          sampleKeys: sampleIdentical,
          message: `${a} and ${b} share ${identical} qStats keys with byte-identical lastSeen (${(ratio * 100).toFixed(1)}% of larger qStats). Possible cross-player overwrite.`,
        });
      }
    }
  }
  return flags;
}

// Invariant 2: createdAt drift vs baseline.
function checkCreatedAtDrift(docs, baseline) {
  if (!baseline) return [];
  const flags = [];
  for (const name of Object.keys(docs)) {
    const cur = docs[name].createdAt;
    const prev = baseline.players?.[name]?.createdAt;
    if (cur == null || prev == null) continue;
    if (cur !== prev) {
      flags.push({
        invariant: 'createdAt_drift',
        severity: 'critical',
        player: name,
        baseline: prev,
        current: cur,
        message: `${name} createdAt changed: baseline=${prev} → current=${cur}. createdAt should never mutate after initial creation.`,
      });
    }
  }
  return flags;
}

// Invariant 3: catastrophic totalAnswered shift not backed by recentSessions.
function checkCatastrophicShift(docs, baseline) {
  if (!baseline) return [];
  const flags = [];
  for (const name of Object.keys(docs)) {
    const cur = docs[name].totalAnswered ?? 0;
    const prev = baseline.players?.[name]?.totalAnswered ?? 0;
    const delta = cur - prev;
    if (delta <= SHIFT_THRESHOLD) continue;

    // How much of the delta does recentSessions account for?
    const recentTotal = countSessionsTotal(docs[name].recentSessions);
    // recentSessions[10] is rolling — they may have rolled out items contributing
    // to delta. We treat the raw recentTotal as a *minimum* accountable contribution.
    // If delta is larger than what the rolling window can explain at typical sizes
    // (recentSessions caps at 10 entries; sessions usually 5–30 items), flag when
    // delta substantially exceeds what 10 typical sessions could provide.
    const looselyAccountable = recentTotal + (10 * 30); // 10 rolled sessions × 30 max items each
    if (delta > looselyAccountable) {
      flags.push({
        invariant: 'catastrophic_shift',
        severity: 'critical',
        player: name,
        baseline: prev,
        current: cur,
        delta,
        recentSessionsTotal: recentTotal,
        message: `${name} totalAnswered jumped ${delta} (${prev} → ${cur}); recentSessions accounts for only ${recentTotal}, plus rolling window can absorb at most ~${10 * 30} more. Delta unexplained.`,
      });
    }
  }
  return flags;
}

function snapshotForBaseline(docs) {
  const out = { savedAt: new Date().toISOString(), players: {} };
  for (const [name, d] of Object.entries(docs)) {
    out.players[name] = {
      createdAt: d.createdAt ?? null,
      totalAnswered: d.totalAnswered ?? 0,
      qStatsCount: Object.keys(d.qStats || {}).length,
    };
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.error('Usage: node tools/check_player_integrity.js [--dry-run] [--reset-baseline] [--json]');
    process.exit(0);
  }

  // Pull all 5 player docs.
  const docs = {};
  for (const name of PLAYERS) {
    try {
      docs[name] = await fetchPlayer(name);
    } catch (e) {
      console.error(`Error fetching ${name}: ${e.message}`);
      process.exit(2);
    }
  }

  const baseline = loadBaseline();
  const flags = [
    ...checkOverlap(docs),
    ...checkCreatedAtDrift(docs, baseline),
    ...checkCatastrophicShift(docs, baseline),
  ];

  const result = {
    ok: flags.length === 0,
    flagCount: flags.length,
    baselinePresent: baseline != null,
    baselineSavedAt: baseline?.savedAt ?? null,
    flags,
  };

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    if (flags.length === 0) {
      console.log(`Integrity check OK — 5 players, ${baseline ? 'baseline-compared' : 'no-baseline (first run; baseline being seeded)'}.`);
    } else {
      console.log(`Integrity check FAILED — ${flags.length} flag${flags.length > 1 ? 's' : ''}:`);
      for (const f of flags) {
        const sev = f.severity === 'critical' ? '[CRITICAL]' : '[WARN]';
        console.log(`  ${sev} ${f.invariant}: ${f.message}`);
      }
    }
  }

  // Auto-update baseline on clean run, OR on --reset-baseline, never on failure or --dry-run.
  const shouldUpdateBaseline = !args.dryRun && (args.reset || (flags.length === 0));
  if (shouldUpdateBaseline) {
    writeBaseline(snapshotForBaseline(docs));
    if (!args.json) console.error(`Baseline ${baseline ? 'updated' : 'seeded'} at ${BASELINE_PATH}`);
  }

  process.exit(flags.length === 0 ? 0 : 1);
}

main().catch(e => { console.error('Error:', e.message); process.exit(2); });
