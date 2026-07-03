#!/usr/bin/env node
/**
 * check_doc_pointers.js — dead-pointer lint for repo markdown.
 *
 * The 2026-07-03 holistic review found 6 dead cross-references (renamed/archived
 * files still pointed at from live docs). This makes that class visible on every
 * push: scans markdown for repo-relative file references and reports any whose
 * target doesn't exist.
 *
 * Two extraction passes per file:
 *   1. root-relative tokens:  docs/x.md, references/y.md, tools/z.js, ...
 *   2. markdown links:        [text](relative/or/root/path.md) resolved against
 *      the containing file's directory, then against the repo root.
 *
 * Skipped candidates: templates/globs ({, *, <, $, YYYY, N-placeholders), URLs,
 * and gitignored generated dirs (audits/, backups/) that won't exist in CI.
 *
 * Usage:
 *   node tools/check_doc_pointers.js            # report; always exit 0
 *   node tools/check_doc_pointers.js --strict   # exit 1 when anything is missing
 *   node tools/check_doc_pointers.js --quiet    # only print missing
 */

const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..');

// Archive dirs are deliberately NOT scanned — they are historical records and
// legitimately reference files as they were named at the time.
const SCAN_GLOBS = [
  'CLAUDE.md', 'README.md', 'README_FIRST.md',
  ['docs'], ['references'], ['plans'], ['progress'],
  ['tools'], ['worker'], ['tests'], ['migration'],
];
const SKILLS_DIR = path.join(REPO, '.claude', 'skills');

// Extension alternation is longest-first so `.json` never half-matches as `.js`.
const ROOT_REF_RE = /(?:docs|references|plans|progress|tools|worker|migration|archive|tests|\.claude|\.github)\/[A-Za-z0-9_\-./]*[A-Za-z0-9_)]\.(?:json|jsonl|md|js|html|yml|toml|rules)/g;
const LINK_RE = /\]\(([^)#\s]+\.(?:json|jsonl|md|js|html|yml|toml))(?:#[^)]*)?\)/g;

function isTemplate(p) {
  return /[{}*<>$|\\]|YYYY|\{date\}|\.\.\.|…/.test(p) || /(^|\/)(audits|backups)\//.test(p);
}

function listScanFiles() {
  const files = [];
  for (const entry of SCAN_GLOBS) {
    if (typeof entry === 'string') {
      const f = path.join(REPO, entry);
      if (fs.existsSync(f)) files.push(f);
      continue;
    }
    const dir = path.join(REPO, ...entry);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith('.md')) files.push(path.join(dir, f));
    }
  }
  if (fs.existsSync(SKILLS_DIR)) {
    for (const skill of fs.readdirSync(SKILLS_DIR)) {
      const d = path.join(SKILLS_DIR, skill);
      if (!fs.statSync(d).isDirectory()) continue;
      for (const f of fs.readdirSync(d)) {
        if (f.endsWith('.md')) files.push(path.join(d, f));
      }
    }
  }
  return files;
}

function main() {
  const strict = process.argv.includes('--strict');
  const quiet = process.argv.includes('--quiet');
  const missing = [];
  let checked = 0;

  for (const file of listScanFiles()) {
    const rel = path.relative(REPO, file).replace(/\\/g, '/');
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      const cands = new Set();
      for (const m of line.matchAll(ROOT_REF_RE)) cands.add(m[0].replace(/\)$/, ''));
      for (const m of line.matchAll(LINK_RE)) cands.add(m[1]);
      for (const c of cands) {
        if (isTemplate(c) || c.startsWith('http')) continue;
        checked++;
        const fromRoot = path.join(REPO, c);
        const fromFile = path.resolve(path.dirname(file), c);
        if (!fs.existsSync(fromRoot) && !fs.existsSync(fromFile)) {
          missing.push({ file: rel, line: i + 1, ref: c });
        }
      }
    });
  }

  if (!quiet) console.log(`Checked ${checked} doc pointers.`);
  if (missing.length) {
    console.log(`MISSING (${missing.length}):`);
    for (const m of missing) console.log(`  ${m.file}:${m.line} -> ${m.ref}`);
  } else if (!quiet) {
    console.log('All pointers resolve.');
  }
  process.exit(strict && missing.length ? 1 : 0);
}

main();
