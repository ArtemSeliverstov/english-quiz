#!/usr/bin/env node
/**
 * get_player.js — fetch one player's Firestore doc and print as JSON.
 *
 * Usage:
 *   node get_player.js <player>           # default: pretty JSON of all fields
 *   node get_player.js <player> --field coach_notes
 *   node get_player.js <player> --field stats --no-empty
 *
 * Player keys: artem, anna, nicole, ernest, egor.
 *
 * Used at the start of an exercise session or stats review to load context.
 */

const { fsGet, docToPlain, PLAYERS } = require('./_firestore');

function parseArgs(argv) {
  const args = { player: null, field: null, noEmpty: false };
  let i = 0;
  while (i < argv.length) {
    const a = argv[i];
    if (a === '--field' || a === '-f') {
      args.field = argv[++i];
    } else if (a === '--no-empty') {
      args.noEmpty = true;
    } else if (a === '--help' || a === '-h') {
      args.help = true;
    } else if (!args.player) {
      args.player = a;
    }
    i++;
  }
  return args;
}

function pruneEmpty(obj) {
  if (Array.isArray(obj)) return obj.filter(v => !isEmpty(v)).map(pruneEmpty);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (!isEmpty(v)) out[k] = pruneEmpty(v);
    }
    return out;
  }
  return obj;
}

function isEmpty(v) {
  if (v == null) return true;
  if (v === '') return true;
  if (Array.isArray(v) && v.length === 0) return true;
  if (typeof v === 'object' && Object.keys(v).length === 0) return true;
  return false;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.player) {
    console.error('Usage: node get_player.js <player> [--field <name>] [--no-empty]');
    console.error(`  player: one of ${PLAYERS.join(', ')}`);
    process.exit(args.help ? 0 : 1);
  }

  if (!PLAYERS.includes(args.player)) {
    console.error(`Unknown player "${args.player}". Valid: ${PLAYERS.join(', ')}`);
    process.exit(1);
  }

  const doc = await fsGet(`players/${args.player}`);
  if (!doc) {
    console.error(`Player document not found: players/${args.player}`);
    process.exit(2);
  }

  let data = docToPlain(doc);

  if (args.field) {
    if (!(args.field in data)) {
      console.error(`Field "${args.field}" not found on players/${args.player}`);
      console.error(`Available: ${Object.keys(data).join(', ')}`);
      process.exit(3);
    }
    data = { [args.field]: data[args.field] };
  }

  if (args.noEmpty) data = pruneEmpty(data);

  console.log(JSON.stringify(data, null, 2));
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
