#!/usr/bin/env node
/**
 * update_coach_notes.js — apply a patch to a player's coach_notes field.
 *
 * Usage:
 *   node update_coach_notes.js <player> <patch_json_path>
 *   cat patch.json | node update_coach_notes.js anna -
 *
 * Patch JSON shape (any subset of these keys):
 *   {
 *     "weak_patterns_add": ["preposition swap (RU L1)"],
 *     "weak_patterns_remove": ["resolved-pattern"],
 *     "strong_patterns_add": ["past simple"],
 *     "strong_patterns_remove": [],
 *     "engagement_notes": "Optimal session length 8 items.",
 *     "recent_observations_add": [
 *       {
 *         "date": "2026-04-29",
 *         "session_id": "anna_1730_abc1",
 *         "note": "Slow on transformations, fast on translations.",
 *         "author": "claude_code"
 *       }
 *     ],
 *     "stuck_questions_add": ["cv03"],
 *     "stuck_questions_remove": []
 *   }
 *
 * Behaviour:
 *   - *_add fields are appended (deduped against existing values for arrays of strings)
 *   - *_remove fields are filtered out
 *   - engagement_notes is replaced (single string)
 *   - recent_observations_add is FIFO-capped at 10 entries (oldest dropped)
 *   - last_updated and last_updated_by are auto-set
 *   - Read-modify-write: fetches current coach_notes, applies patch, writes back
 *
 * See references/coach-notes-schema.md for full schema and update protocol.
 */

const fs = require('fs');
const path = require('path');
const { fsGet, fsPatch, docToPlain, PLAYERS } = require('./_firestore');
const { applyRecentSessionSignalsPatch } = require('./_signals');

const RECENT_OBS_CAP = 10;
const VALID_KEYS = new Set([
  'weak_patterns_add', 'weak_patterns_remove',
  'strong_patterns_add', 'strong_patterns_remove',
  'engagement_notes',
  'recent_observations_add',
  'stuck_questions_add', 'stuck_questions_remove',
  // Phase 2: phrase_tracker patches (lexical/register swaps; see references/coach-notes-schema.md)
  'phrase_tracker_add', 'phrase_tracker_transition', 'phrase_tracker_remove',
  // 2026-05-12 stats-sprawl cleanup: single-session capture buffer with promotion lifecycle
  'recent_session_signals_add', 'recent_session_signals_promote', 'recent_session_signals_remove',
]);

// Per-player context tag lists. Used by --regen-tracker-md to render the coverage
// table. Mirrors references/family-profiles.md theme tags.
const PLAYER_TAGS = {
  artem:  ['biz_oil', 'leisure_sport', 'brit_expat', 'claude_collab'],
  anna:   ['home_daily', 'leisure_sport', 'brit_expat'],
  nicole: ['home_daily', 'leisure_sport', 'brit_expat'],
  ernest: ['home_daily', 'leisure_sport', 'brit_expat'],
  egor:   ['academic_ielts', 'kpmg_consulting', 'almaty_daily'],
};

const STATUS_EMOJI = {
  first_pass:    '⚪',
  active:        '🔵',
  retest_due:    '🟡',
  mastered:      '🟢',
  owned:         '🏆',
  failed_retest: '✗',
  dormant:       '💤',
};

const RETEST_DAYS_FIRST  = 21;
const RETEST_DAYS_SECOND = 42;

// ─── T1 phrase-pool hygiene (2026-07-03, plans/open-items.md) ───────────────
// Aging: an active entry with ≤1 rep and no drill inside AGING_DAYS goes
// dormant (never-drilled entries age from first_seen). Dormant = out of every
// drill pool (worker + CC filter on status==='active') but auto-revives to
// active if the same phrase is captured again.
const AGING_DAYS_DEFAULT = 60;

// Priority: register-impact by tag × recurrence. Weight dominates; recurrence
// (reps + capture count) tiebreaks. Drives the tracker's Top-actives section
// and CC drill picks; the worker still samples plain actives until phase B.
const TAG_PRIORITY_WEIGHT = {
  biz_oil: 4, kpmg_consulting: 4,
  brit_expat: 3, home_daily: 3, academic_ielts: 3,
  leisure_sport: 2, almaty_daily: 2,
  claude_collab: 1,
};
function phrasePriority(e) {
  const w = e.tag == null ? 2 : (TAG_PRIORITY_WEIGHT[e.tag] ?? 2);
  return w * 10 + (Number(e.reps) || 0) + ((e.sources || []).length);
}
function agingCutoffISO(days) {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}

function parseArgs(argv) {
  if (argv[0] === '--help' || argv[0] === '-h') return { help: true };
  // Positionals are non-flag args; flags start with '--'. This matters when
  // --regen-tracker-md is passed without a patch file (would otherwise be
  // mistaken for the patch path).
  const positionals = argv.filter(a => !a.startsWith('--'));
  const agingIdx = argv.indexOf('--aging-days');
  return {
    player: positionals[0],
    jsonPath: positionals[1],
    dryRun: argv.includes('--dry-run'),
    regenTrackerMd: argv.includes('--regen-tracker-md'),
    applyAging: argv.includes('--apply-aging'),
    agingDays: agingIdx >= 0 ? Number(argv[agingIdx + 1]) || AGING_DAYS_DEFAULT : AGING_DAYS_DEFAULT,
  };
}

async function readJsonInput(jsonPath) {
  if (jsonPath === '-') {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  }
  return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
}

function unique(arr) {
  return [...new Set(arr)];
}

function applyArrayPatch(current, addList, removeList) {
  const removeSet = new Set(removeList || []);
  const filtered = (current || []).filter(item => !removeSet.has(item));
  return unique([...filtered, ...(addList || [])]);
}

function applyObservationsPatch(current, addList) {
  const updated = [...(current || []), ...(addList || [])];
  // FIFO cap: keep most recent N
  return updated.length > RECENT_OBS_CAP
    ? updated.slice(updated.length - RECENT_OBS_CAP)
    : updated;
}

// recent_session_signals buffer + promotion lifecycle now live in ./_signals.js
// (shared with log_exercise.js auto-fold and promote_signals.js). Imported above.

// ─── phrase_tracker helpers ────────────────────────────────────────────────

function entryKey(e) {
  return `${e.awkward}|||${e.natural}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Validate a phrase_tracker patch against the player's profile tags BEFORE
// applying. Catches tag/profile mismatches at write time so they don't pollute
// the data (the renderer treats unknown tags as the "Other" bucket — visible
// but not what we want long-term).
//
// Allows tag === null (untagged is valid for cross-context register tendencies).
// Throws on any tag string that isn't in the player's PLAYER_TAGS list.
function validatePhraseTrackerPatch(player, patch) {
  const validTags = new Set(PLAYER_TAGS[player] || []);
  const errors = [];
  for (const [i, add] of (patch.phrase_tracker_add || []).entries()) {
    if (add.tag != null && !validTags.has(add.tag)) {
      errors.push(`phrase_tracker_add[${i}] ("${add.awkward}"): tag "${add.tag}" is not in ${player}'s profile tags (${[...validTags].join(', ') || 'none'}). Use null for cross-context entries, or one of the listed tags.`);
    }
  }
  if (errors.length) {
    throw new Error('Phrase tracker validation failed:\n  ' + errors.join('\n  '));
  }
}

function applyPhraseTrackerPatch(current, patch) {
  const tracker = current && typeof current === 'object'
    ? { entries: Array.isArray(current.entries) ? [...current.entries] : [], last_updated: current.last_updated || null }
    : { entries: [], last_updated: null };

  // Order matters: removes → adds → transitions. Removes must run first
  // so a retag (remove + re-add same composite key) actually replaces the
  // entry. If adds ran first, the new entry would hit the dedupe check
  // against the still-present old entry and be silently dropped.
  let idx = new Map();
  for (const e of tracker.entries) idx.set(entryKey(e), e);

  // 1. Removes — by composite key
  if (Array.isArray(patch.phrase_tracker_remove) && patch.phrase_tracker_remove.length) {
    const removeSet = new Set(patch.phrase_tracker_remove.map(entryKey));
    tracker.entries = tracker.entries.filter(e => !removeSet.has(entryKey(e)));
    idx = new Map();
    for (const e of tracker.entries) idx.set(entryKey(e), e);
  }

  // 2. Adds — new entries (typically at first ⚪→🔵 promotion)
  for (const add of (patch.phrase_tracker_add || [])) {
    if (!add.awkward || !add.natural) continue;
    const k = entryKey(add);
    if (idx.has(k)) {
      // Re-capture of an existing entry. If it went dormant under the aging
      // rule, the re-occurrence is exactly the revive signal (T1).
      const existing = idx.get(k);
      if (existing.status === 'dormant') {
        existing.status = 'active';
        existing.next_retest = null;
        if (add.sources && add.sources.length) existing.sources = [...(existing.sources || []), ...add.sources];
        existing.events = existing.events || [];
        existing.events.push({ date: todayISO(), event: 'dormant_to_active', note: 're-captured — auto-revive' });
      }
      continue; // dedupe — transition path handles other updates
    }
    const entry = {
      awkward: add.awkward,
      natural: add.natural,
      tag: add.tag || null,
      status: add.status || 'active',
      first_seen: add.first_seen || todayISO(),
      last_drilled: add.last_drilled || null,
      next_retest: add.next_retest || null,
      reps: Number(add.reps) || 0,
      sources: Array.isArray(add.sources) ? add.sources : [],
      events: [
        { date: todayISO(), event: 'captured', note: add.event_note || null },
      ],
    };
    tracker.entries.push(entry);
    idx.set(k, entry);
  }

  // 3. Transitions — change status, append event, optionally update next_retest
  for (const tr of (patch.phrase_tracker_transition || [])) {
    if (!tr.awkward || !tr.natural || !tr.to_status) continue;
    if (!STATUS_EMOJI[tr.to_status]) continue;
    const e = idx.get(entryKey(tr));
    if (!e) continue;
    const prev = e.status;
    e.status = tr.to_status;
    if (tr.next_retest !== undefined) e.next_retest = tr.next_retest;
    else if (tr.to_status === 'retest_due')   e.next_retest = addDaysISO(RETEST_DAYS_FIRST);
    else if (tr.to_status === 'mastered')     e.next_retest = addDaysISO(RETEST_DAYS_SECOND);
    else if (tr.to_status === 'owned')        e.next_retest = null;
    else if (tr.to_status === 'active')       e.next_retest = null;
    else if (tr.to_status === 'dormant')      e.next_retest = null;
    if (typeof tr.reps_delta === 'number') e.reps = (e.reps || 0) + tr.reps_delta;
    if (tr.last_drilled) e.last_drilled = tr.last_drilled;
    if (tr.source && Array.isArray(e.sources)) e.sources.push(tr.source);
    e.events = e.events || [];
    e.events.push({
      date: todayISO(),
      event: `${prev || 'unknown'}_to_${tr.to_status}`,
      note: tr.event_note || null,
      next_retest: e.next_retest || null,
    });
  }

  tracker.last_updated = new Date().toISOString();
  return tracker;
}

// ─── tracker markdown view (regenerated, never hand-edited) ────────────────

function renderTrackerMarkdown(player, tracker) {
  const tags = PLAYER_TAGS[player] || [];
  const entries = (tracker && Array.isArray(tracker.entries)) ? tracker.entries : [];
  const lastRefresh = todayISO();
  const playerCap = player.charAt(0).toUpperCase() + player.slice(1);

  // Coverage counts: rows = tags, cols = statuses. Three buckets:
  //   - profile tags (player's own)
  //   - Untagged (tag === null) — for cross-context register tendencies
  //   - Other (tag set but outside player's profile) — likely a tag-validation slip
  // Totals row counts every entry (regardless of tag) so the rightmost cell
  // reconciles with entries.length — no silently invisible rows.
  const statusOrder = ['first_pass', 'active', 'retest_due', 'mastered', 'owned', 'failed_retest', 'dormant'];
  const counts = {};
  for (const t of tags) counts[t] = Object.fromEntries(statusOrder.map(s => [s, 0]));
  const untagged = Object.fromEntries(statusOrder.map(s => [s, 0]));
  const other = Object.fromEntries(statusOrder.map(s => [s, 0]));
  let untaggedTotal = 0, otherTotal = 0;
  let totals = Object.fromEntries(statusOrder.map(s => [s, 0]));
  for (const e of entries) {
    if (totals[e.status] !== undefined) totals[e.status]++;
    if (e.tag == null) {
      if (untagged[e.status] !== undefined) untagged[e.status]++;
      untaggedTotal++;
    } else if (counts[e.tag]) {
      if (counts[e.tag][e.status] !== undefined) counts[e.tag][e.status]++;
    } else {
      if (other[e.status] !== undefined) other[e.status]++;
      otherTotal++;
    }
  }

  const statusCells = c => statusOrder.map(s => c[s]).join(' | ');
  const profileRows = tags.map(t => {
    const c = counts[t];
    const total = statusOrder.reduce((a, s) => a + c[s], 0);
    return `| \`[${t}]\` | ${statusCells(c)} | ${total} |`;
  }).join('\n');
  const extraRows = [];
  if (untaggedTotal > 0) extraRows.push(`| _Untagged_ | ${statusCells(untagged)} | ${untaggedTotal} |`);
  if (otherTotal > 0) extraRows.push(`| _Other_ | ${statusCells(other)} | ${otherTotal} |`);
  const coverageRows = [profileRows, ...extraRows].filter(Boolean).join('\n');
  const totalRow = `| **Total** | ${statusCells(totals)} | ${entries.length} |`;

  // T1: top actives by priority — the drill queue. Full inventory stays below.
  const TOP_ACTIVES = 20;
  const actives = entries.filter(e => e.status === 'active')
    .sort((a, b) => phrasePriority(b) - phrasePriority(a));
  const topActiveRows = actives.slice(0, TOP_ACTIVES).map((e, i) =>
    `| ${i + 1} | ${e.awkward} | ${e.natural} | \`[${e.tag || '—'}]\` | ${phrasePriority(e)} | ${e.reps || 0} |`
  ).join('\n') || `| _(no active entries)_ | | | | | |`;
  const activesNote = actives.length > TOP_ACTIVES
    ? `\n${actives.length - TOP_ACTIVES} more actives below the line — drills pull from this top block first.`
    : '';

  // Inventory rows
  const inventoryRows = entries.length
    ? entries.map(e => {
        const status = `${STATUS_EMOJI[e.status] || '?'} ${e.status || 'unknown'}`;
        const sources = (e.sources || []).join(', ');
        return `| ${e.awkward} | ${e.natural} | \`[${e.tag || '—'}]\` | ${e.first_seen || '—'} | ${e.last_drilled || '—'} | ${status} | ${e.next_retest || '—'} | ${e.reps || 0} | ${sources || '—'} |`;
      }).join('\n')
    : `| _(empty — no captures yet)_ | | | | | | | | |`;

  const tagDescriptions = {
    biz_oil:        'business meetings, O&G operations, Bahrain settings',
    leisure_sport:  'cycling, F1, gym, sports talk',
    brit_expat:     'pubs, padel club, dinner parties, expat banter',
    home_daily:     'home life, daily-life situations',
    academic_ielts: 'IELTS Writing/Speaking, academic register',
    kpmg_consulting:'English-speaking consulting work at KPMG Almaty',
    almaty_daily:   'Almaty city life, weekend, family',
    claude_collab:  'prompts to Claude Code / claude.ai, project shared vocab, system-behaviour talk, git/CLI collab',
  };
  const tagLines = tags.map(t => `\`[${t}]\` — ${tagDescriptions[t] || ''}`).join('\n');

  return `# Natural Phrases Tracker — ${playerCap}

> **Generated file.** Regenerated by \`stats-review\` from \`players/${player}.phrase_tracker\`. Never hand-edit — changes will be overwritten.

**Baseline source**: first \`phrase_swap_drill\` session.
**Last refresh**: ${lastRefresh}
**Refresh trigger**: any \`stats-review\` skill run that pulls ${playerCap}'s \`coach_sessions\`.

---

## Status legend

- ⚪ **first-pass** — captured once in \`recent_observations\`, awaiting 2nd hit
- 🔵 **active** — in \`weak_patterns\`, drilling now
- 🟡 **retest-due** — demoted; retest window open (≥21 days since demotion)
- 🟢 **mastered** — passed first retest, no failures since
- 🏆 **owned** — passed 2nd retest 6+ weeks after first; out of scheduled rotation (sampled by the monthly retention probe)
- ✗ **failed-retest** — last retest failed; back in active rotation
- 💤 **dormant** — single capture, no rep in ${AGING_DAYS_DEFAULT}d; out of drill pools, auto-revives on re-capture

---

## Context tags

${tagLines}

---

## Coverage

| Tag | ⚪ | 🔵 | 🟡 | 🟢 | 🏆 | ✗ | 💤 | Total |
|---|---|---|---|---|---|---|---|---|
${coverageRows}
${totalRow}

---

## Top actives — the drill queue (priority = tag weight × recurrence)

| # | Awkward | Natural | Tag | Prio | Reps |
|---|---|---|---|---|---|
${topActiveRows}${activesNote}

---

## Inventory

| Awkward | Natural | Tag | First seen | Last drill | Status | Next retest | Reps | Sources |
|---|---|---|---|---|---|---|---|---|
${inventoryRows}

---

## Lifecycle

See \`references/coach-notes-schema.md\` "Phrase tracker lifecycle" for the state machine, retest cadences (21d / 42d), and worker selection rule.
`;
}

async function regenTrackerMarkdown(player) {
  const doc = await fsGet(`players/${player}`);
  if (!doc) throw new Error(`Player document not found: players/${player}`);
  const root = docToPlain(doc) || {};
  const tracker = root.phrase_tracker || { entries: [] };
  const md = renderTrackerMarkdown(player, tracker);
  // Write to repo path. Resolve from this script's location → progress/.
  const outPath = path.join(__dirname, '..', 'progress', `natural-phrases-tracker-${player}.md`);
  fs.writeFileSync(outPath, md, 'utf8');
  return { outPath, entries: tracker.entries.length };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.player) {
    console.error('Usage:');
    console.error('  node update_coach_notes.js <player> <patch.json | -> [--dry-run]');
    console.error('  node update_coach_notes.js <player> --regen-tracker-md          # standalone markdown regen');
    console.error(`  player: one of ${PLAYERS.join(', ')}`);
    process.exit(args.help ? 0 : 1);
  }

  if (!PLAYERS.includes(args.player)) {
    console.error(`Unknown player "${args.player}"`);
    process.exit(1);
  }

  // Standalone tracker-md regen (no patch file required)
  if (args.regenTrackerMd && !args.jsonPath) {
    const r = await regenTrackerMarkdown(args.player);
    console.log(JSON.stringify({ ok: true, ...r }, null, 2));
    return;
  }

  if (!args.jsonPath) {
    console.error('Missing patch.json path. (Or pass --regen-tracker-md alone for markdown-only regen.)');
    process.exit(1);
  }

  const patch = await readJsonInput(args.jsonPath);

  // Validate patch keys
  const unknownKeys = Object.keys(patch).filter(k => !VALID_KEYS.has(k));
  if (unknownKeys.length) {
    console.error(`Unknown patch keys: ${unknownKeys.join(', ')}`);
    console.error(`Valid keys: ${[...VALID_KEYS].join(', ')}`);
    process.exit(1);
  }

  // Read current state
  const doc = await fsGet(`players/${args.player}`);
  if (!doc) {
    console.error(`Player document not found: players/${args.player}`);
    process.exit(2);
  }
  const root = docToPlain(doc);
  const current = root.coach_notes || {
    weak_patterns: [],
    strong_patterns: [],
    engagement_notes: '',
    recent_observations: [],
    stuck_questions: [],
  };
  const currentTracker = root.phrase_tracker || { entries: [], last_updated: null };

  // Apply coach_notes patch
  const signalsTouched =
    Array.isArray(patch.recent_session_signals_add) ||
    Array.isArray(patch.recent_session_signals_promote) ||
    Array.isArray(patch.recent_session_signals_remove);
  const updated = {
    weak_patterns: applyArrayPatch(
      current.weak_patterns,
      patch.weak_patterns_add,
      patch.weak_patterns_remove
    ),
    strong_patterns: applyArrayPatch(
      current.strong_patterns,
      patch.strong_patterns_add,
      patch.strong_patterns_remove
    ),
    engagement_notes: 'engagement_notes' in patch
      ? patch.engagement_notes
      : current.engagement_notes,
    recent_observations: applyObservationsPatch(
      current.recent_observations,
      patch.recent_observations_add
    ),
    recent_session_signals: signalsTouched
      ? applyRecentSessionSignalsPatch(current.recent_session_signals, patch)
      : (current.recent_session_signals || []),
    stuck_questions: applyArrayPatch(
      current.stuck_questions,
      patch.stuck_questions_add,
      patch.stuck_questions_remove
    ),
    last_updated: new Date().toISOString(),
    last_updated_by: 'claude_code',
  };

  // T1 aging sweep (--apply-aging): mechanical dormancy for stale singles.
  // active + ≤1 rep + no drill inside agingDays (never-drilled age from first_seen).
  if (args.applyAging) {
    const cutoff = agingCutoffISO(args.agingDays);
    // Weight-4 tags (biz_oil, kpmg_consulting) are exempt — high-impact singles
    // are victims of the queue clog, not noise; they hold the top of the queue.
    const stale = (currentTracker.entries || []).filter(e =>
      e.status === 'active' &&
      (Number(e.reps) || 0) <= 1 &&
      (e.tag == null ? 2 : (TAG_PRIORITY_WEIGHT[e.tag] ?? 2)) < 4 &&
      ((e.last_drilled || e.first_seen || '9999') < cutoff));
    if (stale.length) {
      patch.phrase_tracker_transition = [
        ...(patch.phrase_tracker_transition || []),
        ...stale.map(e => ({
          awkward: e.awkward, natural: e.natural, to_status: 'dormant',
          event_note: `aging sweep: ≤1 rep, no drill since ${e.last_drilled || e.first_seen || '?'} (cutoff ${cutoff})`,
        })),
      ];
    }
    console.error(`[aging] ${stale.length} active singles past ${args.agingDays}d → dormant (cutoff ${cutoff})`);
  }

  // Apply phrase_tracker patch (separate field on player root)
  const trackerTouched =
    Array.isArray(patch.phrase_tracker_add) ||
    Array.isArray(patch.phrase_tracker_transition) ||
    Array.isArray(patch.phrase_tracker_remove);
  if (trackerTouched) {
    try {
      validatePhraseTrackerPatch(args.player, patch);
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
  }
  const updatedTracker = trackerTouched
    ? applyPhraseTrackerPatch(currentTracker, patch)
    : currentTracker;

  // weak_patterns cap (coach-notes-schema.md: 8, priority-aware). Warn — don't block:
  // stats-review owns the audit that trims it back down, but the overflow must be loud.
  const WEAK_PATTERNS_CAP = 8;
  if (updated.weak_patterns.length > WEAK_PATTERNS_CAP) {
    console.error(
      `WARN: weak_patterns for ${args.player} now at ${updated.weak_patterns.length} ` +
      `(cap ${WEAK_PATTERNS_CAP}). Drills read this list whole — overflow dilutes every prompt. ` +
      `Run stats-review step 7 to audit/demote.`);
  }

  // Show diff
  const diff = {
    weak_patterns: { before: current.weak_patterns?.length || 0, after: updated.weak_patterns.length },
    strong_patterns: { before: current.strong_patterns?.length || 0, after: updated.strong_patterns.length },
    recent_observations: { before: current.recent_observations?.length || 0, after: updated.recent_observations.length },
    recent_session_signals: signalsTouched ? {
      before: (current.recent_session_signals || []).length,
      after: updated.recent_session_signals.length,
      touched: true,
    } : null,
    stuck_questions: { before: current.stuck_questions?.length || 0, after: updated.stuck_questions.length },
    engagement_notes_changed: 'engagement_notes' in patch &&
      patch.engagement_notes !== current.engagement_notes,
    phrase_tracker: trackerTouched
      ? {
          before: (currentTracker.entries || []).length,
          after: updatedTracker.entries.length,
          touched: true,
        }
      : { touched: false },
  };

  if (args.dryRun) {
    console.log(JSON.stringify({
      dry_run: true,
      diff,
      would_write: { coach_notes: updated, ...(trackerTouched ? { phrase_tracker: updatedTracker } : {}) },
    }, null, 2));
    return;
  }

  // Single PATCH carries both fields when tracker was touched.
  if (trackerTouched) {
    await fsPatch(
      `players/${args.player}`,
      ['coach_notes', 'phrase_tracker'],
      { coach_notes: updated, phrase_tracker: updatedTracker }
    );
  } else {
    await fsPatch(
      `players/${args.player}`,
      ['coach_notes'],
      { coach_notes: updated }
    );
  }

  // Optional follow-up: regenerate the markdown view from the updated tracker.
  let regen = null;
  if (args.regenTrackerMd) {
    try {
      regen = await regenTrackerMarkdown(args.player);
    } catch (e) {
      console.warn(`[update_coach_notes] WARNING: tracker md regen failed: ${e.message}`);
    }
  }

  console.log(JSON.stringify({
    updated: `players/${args.player}.coach_notes${trackerTouched ? ' + .phrase_tracker' : ''}`,
    diff,
    tracker_md_regen: regen,
  }, null, 2));
}

if (require.main === module) {
  main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}

module.exports = {
  applyPhraseTrackerPatch,
  validatePhraseTrackerPatch,
  renderTrackerMarkdown,
  applyArrayPatch,
  applyObservationsPatch,
  PLAYER_TAGS,
};
