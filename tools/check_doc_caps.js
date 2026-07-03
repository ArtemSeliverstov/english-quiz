#!/usr/bin/env node
/**
 * check_doc_caps.js — local pre-push word-cap check for CLAUDE.md and SKILL.md files.
 *
 * Mirrors the CI's `wc -w` count using Node's Unicode-aware whitespace split.
 * Necessary because MSYS2 / Windows Git Bash `wc -w` undercounts UTF-8 content
 * by ~3% on files with em-dashes and Cyrillic — caught the hard way on
 * commits 1d5ab13 and 6cf61ad where CI counted 615 vs local 596 on
 * stats-review/SKILL.md.
 *
 * Caps from references/doc-style.md, matched to .github/workflows/ci.yml
 * "Doc word caps" step (raised 2026-07-03 — the old 600/500 caps were binding
 * on all 10 skills and the trims cost real substance; see version-log):
 *   - CLAUDE.md ≤ 550
 *   - .claude/skills/*\/SKILL.md ≤ 800
 *
 * The last BUFFER (30) words below each cap are reserved headroom for
 * cross-platform count drift and future small fixes — landing inside the
 * buffer FAILS too. Effective ceilings: 520 / 770.
 *
 * Usage:
 *   node tools/check_doc_caps.js              # check all caps; exit 1 if any fail
 *   node tools/check_doc_caps.js --quiet      # only print failures
 *   node tools/check_doc_caps.js path/to/file # check a single file (uses extension to pick cap)
 *
 * Recommended: run before `git push` on any CLAUDE.md or SKILL.md edit.
 */

const fs = require('fs');
const path = require('path');

const CAPS = [
  { cap: 550, file: 'CLAUDE.md' },
];
const BUFFER = 30; // reserved headroom below each cap; landing inside it fails

// All SKILL.md files under .claude/skills/
function findSkillFiles() {
  const dir = '.claude/skills';
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .map(name => path.join(dir, name, 'SKILL.md'))
    .filter(p => fs.existsSync(p));
}

function wordCount(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  // JS regex \s+ split matches Linux `wc -w` on UTF-8 content (Unicode whitespace aware).
  // Filter empty tokens at start/end.
  return text.split(/\s+/).filter(Boolean).length;
}

function parseArgs(argv) {
  const out = { quiet: false, target: null };
  for (const a of argv) {
    if (a === '--quiet' || a === '-q') out.quiet = true;
    else if (a === '-h' || a === '--help') out.help = true;
    else if (!a.startsWith('-')) out.target = a;
  }
  return out;
}

function pickCap(file) {
  if (path.basename(file) === 'CLAUDE.md') return 550;
  if (path.basename(file) === 'SKILL.md') return 800;
  return null;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.error('Usage: node tools/check_doc_caps.js [--quiet] [path/to/file]');
    process.exit(0);
  }

  let targets;
  if (args.target) {
    const cap = pickCap(args.target);
    if (cap == null) {
      console.error(`No cap defined for ${args.target}. Add to CAPS in this script if needed.`);
      process.exit(2);
    }
    targets = [{ cap, file: args.target }];
  } else {
    targets = [...CAPS, ...findSkillFiles().map(f => ({ cap: 800, file: f }))];
  }

  let failures = 0;
  for (const { cap, file } of targets) {
    if (!fs.existsSync(file)) continue;
    const n = wordCount(file);
    const limit = cap - BUFFER;
    const fail = n > limit;
    const status = fail ? 'FAIL' : 'OK';
    if (fail) failures++;
    if (!args.quiet || fail) {
      const note = n > cap
        ? `(over cap by ${n - cap})`
        : (fail ? `(inside the ${BUFFER}-word buffer — trim to ≤${limit})` : `(${limit - n} below buffer line ${limit})`);
      console.log(`${status}: ${file.padEnd(50)} = ${String(n).padStart(4)} words (cap ${cap}) ${note}`);
    }
  }

  process.exit(failures > 0 ? 1 : 0);
}

main();
