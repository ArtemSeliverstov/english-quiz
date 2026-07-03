#!/usr/bin/env node
/**
 * loop_maintenance.js — report-only staleness tripwire for the learning loop.
 *
 * The consolidation half of the loop (tracker regens, phrase retests, signal
 * promotion) is owned by stats-review. When stats-review doesn't run, capture
 * keeps working but nothing consolidates — in May–July 2026 that stall lasted
 * 7 weeks unnoticed. This tool makes the stall visible within a day: the
 * mistakes-review skill runs it daily and quotes the summary line.
 *
 * Reports (writes NOTHING):
 *   - progress/*.md tracker staleness ("Last refresh" header vs today)
 *   - per-player phrase_tracker retest-due backlog (next_retest <= today)
 *   - per-player recent_session_signals ready to promote (count >= 2)
 *   - per-player weak_patterns length vs cap (8)
 *   - open bug:* verdicts in tools/mistake_verdicts.json
 *   - overdue retention probes ("probe due YYYY-MM-DD" in the weak-spots tracker
 *     CLOSED/maintenance tables — plans/retention-lane.md)
 *
 * Usage:
 *   node tools/loop_maintenance.js           # summary line + detail
 *   node tools/loop_maintenance.js --json
 */

const fs = require('fs');
const path = require('path');
const { fsGet, docToPlain, PLAYERS } = require('./_firestore');

const REPO = path.join(__dirname, '..');
const WEAK_PATTERNS_CAP = 8;
const STALE_DAYS = 14; // trackers older than this are flagged

function daysAgo(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

function trackerStaleness() {
  const dir = path.join(REPO, 'progress');
  const out = [];
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.md'))) {
    const text = fs.readFileSync(path.join(dir, f), 'utf8');
    const m = text.match(/Last refresh[^:]*:\s*\**\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i);
    const date = m ? m[1] : null;
    out.push({ file: f, lastRefresh: date, daysAgo: date ? daysAgo(date) : null });
  }
  return out;
}

async function playerSignals() {
  const today = new Date().toISOString().slice(0, 10);
  const out = [];
  for (const name of PLAYERS) {
    const doc = await fsGet(`players/${name}`).then(d => d ? docToPlain(d) : null);
    if (!doc) { out.push({ player: name, error: 'no doc' }); continue; }
    const entries = ((doc.phrase_tracker || {}).entries) || [];
    const retestDue = entries.filter(e =>
      e.status === 'retest_due' && e.next_retest && e.next_retest <= today).length;
    const signals = (doc.coach_notes || {}).recent_session_signals || [];
    const promotable = signals.filter(s => (s.count || 0) >= 2).length;
    const wp = ((doc.coach_notes || {}).weak_patterns || []).length;
    out.push({ player: name, retestDue, promotable, weakPatterns: wp, weakPatternsOver: wp > WEAK_PATTERNS_CAP });
  }
  return out;
}

function openVerdicts() {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(__dirname, 'mistake_verdicts.json'), 'utf8'));
    const open = (j.verdicts || []).filter(v => String(v.verdict || '').startsWith('bug:') && !v.fixed);
    return open.length;
  } catch (e) { return null; }
}

function overdueProbes() {
  try {
    const text = fs.readFileSync(path.join(REPO, 'progress', 'weak-spots-tracker-artem.md'), 'utf8');
    const today = new Date().toISOString().slice(0, 10);
    return [...text.matchAll(/probe due (\d{4}-\d{2}-\d{2})/g)]
      .map(m => m[1]).filter(d => d <= today).length;
  } catch (e) { return null; }
}

async function main() {
  const json = process.argv.includes('--json');
  const trackers = trackerStaleness();
  const players = await playerSignals();
  const openBugs = openVerdicts();
  const probesDue = overdueProbes();

  const staleTrackers = trackers.filter(t => t.daysAgo == null || t.daysAgo > STALE_DAYS);
  const retestTotal = players.reduce((a, p) => a + (p.retestDue || 0), 0);
  const promotableTotal = players.reduce((a, p) => a + (p.promotable || 0), 0);
  const overCap = players.filter(p => p.weakPatternsOver).map(p => p.player);

  const needsReview = staleTrackers.length > 0 || retestTotal > 0 || promotableTotal > 0 || overCap.length > 0 || (probesDue || 0) > 0;
  const summary =
    `loop-maintenance: ${staleTrackers.length}/${trackers.length} trackers stale (>${STALE_DAYS}d), ` +
    `${retestTotal} phrase retests due, ${promotableTotal} signals promotion-ready, ` +
    `weak_patterns over cap: ${overCap.length ? overCap.join('/') : 'none'}, ` +
    `open bug verdicts: ${openBugs ?? 'n/a'}, retention probes due: ${probesDue ?? 'n/a'}` +
    (needsReview ? ' → run stats-review' : ' → loop healthy');

  if (json) {
    console.log(JSON.stringify({ summary, needsReview, trackers, players, openBugs, probesDue }, null, 2));
    return;
  }
  console.log(summary);
  for (const t of staleTrackers) {
    console.log(`  stale: ${t.file} (last refresh ${t.lastRefresh ?? 'unknown'}${t.daysAgo != null ? `, ${t.daysAgo}d ago` : ''})`);
  }
  for (const p of players) {
    if (p.error) { console.log(`  ${p.player}: ERROR ${p.error}`); continue; }
    if (p.retestDue || p.promotable || p.weakPatternsOver) {
      console.log(`  ${p.player}: ${p.retestDue} retests due, ${p.promotable} promotable signals, weak_patterns ${p.weakPatterns}/${WEAK_PATTERNS_CAP}${p.weakPatternsOver ? ' OVER CAP' : ''}`);
    }
  }
}

main().catch(e => { console.error('Error:', e.message); process.exit(2); });
