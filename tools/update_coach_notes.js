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

const RECENT_OBS_CAP = 10;
const VALID_KEYS = new Set([
  'weak_patterns_add', 'weak_patterns_remove',
  'strong_patterns_add', 'strong_patterns_remove',
  'engagement_notes',
  'recent_observations_add',
  'stuck_questions_add', 'stuck_questions_remove',
  // Phase 2: phrase_tracker patches (lexical/register swaps; see references/coach-notes-schema.md)
  'phrase_tracker_add', 'phrase_tracker_transition', 'phrase_tracker_remove',
]);

// Per-player context tag lists. Used by --regen-tracker-md to render the coverage
// table. Mirrors references/family-profiles.md theme tags.
const PLAYER_TAGS = {
  artem:  ['biz_oil', 'leisure_sport', 'brit_expat'],
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
};

const RETEST_DAYS_FIRST  = 21;
const RETEST_DAYS_SECOND = 42;

function parseArgs(argv) {
  if (argv[0] === '--help' || argv[0] === '-h') return { help: true };
  // Positionals are non-flag args; flags start with '--'. This matters when
  // --regen-tracker-md is passed without a patch file (would otherwise be
  // mistaken for the patch path).
  const positionals = argv.filter(a => !a.startsWith('--'));
  return {
    player: positionals[0],
    jsonPath: positionals[1],
    dryRun: argv.includes('--dry-run'),
    regenTrackerMd: argv.includes('--regen-tracker-md'),
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

function applyPhraseTrackerPatch(current, patch) {
  const tracker = current && typeof current === 'object'
    ? { entries: Array.isArray(current.entries) ? [...current.entries] : [], last_updated: current.last_updated || null }
    : { entries: [], last_updated: null };

  // Index existing entries by composite key
  const idx = new Map();
  for (const e of tracker.entries) idx.set(entryKey(e), e);

  // 1. Adds — new entries (typically at first ⚪→🔵 promotion)
  for (const add of (patch.phrase_tracker_add || [])) {
    if (!add.awkward || !add.natural) continue;
    const k = entryKey(add);
    if (idx.has(k)) continue; // dedupe — transition path handles updates
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

  // 2. Transitions — change status, append event, optionally update next_retest
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

  // 3. Removes — by composite key
  if (Array.isArray(patch.phrase_tracker_remove) && patch.phrase_tracker_remove.length) {
    const removeSet = new Set(patch.phrase_tracker_remove.map(entryKey));
    tracker.entries = tracker.entries.filter(e => !removeSet.has(entryKey(e)));
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

  // Coverage counts: rows = tags, cols = statuses
  const statusOrder = ['first_pass', 'active', 'retest_due', 'mastered', 'owned', 'failed_retest'];
  const counts = {};
  for (const t of tags) counts[t] = Object.fromEntries(statusOrder.map(s => [s, 0]));
  let totals = Object.fromEntries(statusOrder.map(s => [s, 0]));
  for (const e of entries) {
    if (!counts[e.tag]) continue; // entries with unknown tag don't roll up
    if (counts[e.tag][e.status] !== undefined) counts[e.tag][e.status]++;
    if (totals[e.status] !== undefined) totals[e.status]++;
  }

  const coverageRows = tags.map(t => {
    const c = counts[t];
    const total = statusOrder.reduce((a, s) => a + c[s], 0);
    return `| \`[${t}]\` | ${c.first_pass} | ${c.active} | ${c.retest_due} | ${c.mastered} | ${c.owned} | ${c.failed_retest} | ${total} |`;
  }).join('\n');
  const totalRow = `| **Total** | ${totals.first_pass} | ${totals.active} | ${totals.retest_due} | ${totals.mastered} | ${totals.owned} | ${totals.failed_retest} | ${entries.length} |`;

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
- 🏆 **owned** — passed 2nd retest 6+ weeks after first; out of rotation
- ✗ **failed-retest** — last retest failed; back in active rotation

---

## Context tags

${tagLines}

---

## Coverage

| Tag | ⚪ | 🔵 | 🟡 | 🟢 | 🏆 | ✗ | Total |
|---|---|---|---|---|---|---|---|
${coverageRows}
${totalRow}

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
    stuck_questions: applyArrayPatch(
      current.stuck_questions,
      patch.stuck_questions_add,
      patch.stuck_questions_remove
    ),
    last_updated: new Date().toISOString(),
    last_updated_by: 'claude_code',
  };

  // Apply phrase_tracker patch (separate field on player root)
  const trackerTouched =
    Array.isArray(patch.phrase_tracker_add) ||
    Array.isArray(patch.phrase_tracker_transition) ||
    Array.isArray(patch.phrase_tracker_remove);
  const updatedTracker = trackerTouched
    ? applyPhraseTrackerPatch(currentTracker, patch)
    : currentTracker;

  // Show diff
  const diff = {
    weak_patterns: { before: current.weak_patterns?.length || 0, after: updated.weak_patterns.length },
    strong_patterns: { before: current.strong_patterns?.length || 0, after: updated.strong_patterns.length },
    recent_observations: { before: current.recent_observations?.length || 0, after: updated.recent_observations.length },
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
  renderTrackerMarkdown,
  applyArrayPatch,
  applyObservationsPatch,
};
