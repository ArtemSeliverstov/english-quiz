# Pre-Deploy Checklist

Run before every `git push`. Updated for the post-s87 direct-push workflow (no
deploy.html). Skipping any step risks breaking the live family site.

The order matters — earlier checks catch issues before later checks waste time.

---

## 1. Syntax check

Extract JavaScript from `index.html` and run `node --check`. Zero errors required.

```bash
# From the english-quiz repo root
python3 -c "
import re
content = open('index.html').read()
js = '\n'.join(re.findall(r'<script[^>]*>(.*?)</script>', content, re.DOTALL))
open('/tmp/quiz_check.js', 'w').write(js)
"
node --check /tmp/quiz_check.js
```

If you've made code changes, this will catch unbalanced parens, missing semicolons,
typos in identifiers. Fix and re-check before proceeding.

---

## 2. Question count

Total `ALL_QUESTIONS` count must match expected (previous session count + intentional adds).
A higher count means duplication; a lower count means accidental deletion.

```bash
# Count entries in ALL_QUESTIONS array using bracket-depth-bounded extraction
node -e "
const fs = require('fs');
const src = fs.readFileSync('index.html', 'utf8');
const m = src.match(/const ALL_QUESTIONS\s*=\s*\[([\s\S]*?)\];\s*(?:const|function|\/\/)/);
if (!m) { console.error('ALL_QUESTIONS not found'); process.exit(1); }
const arr = m[1];
const ids = (arr.match(/id:'[^']+'/g) || []).length;
console.log('Questions:', ids);
"
```

Compare against the count from the previous session's commit message or
`references/version-log.md`. If different and not intentional → investigate.

---

## 2b. Question schema lint

Catches the silent-bug class: wrong `ans` type, mismatched multi blanks, hints on gap/mcq, missing required fields, duplicate IDs.

```bash
node tools/lint_questions.js
```

Runs in <500ms on the full bank. Exits non-zero on any issue. Same script runs in CI on every push.

---

## 2c. Transform keyword-mask audit

Validates two rules on every `type:'transform'` question:
- **Rule 1**: every accepted `ans` variant must contain `keyword` (else the
  runtime check `raw.includes(kw)` blocks all submissions — the question is
  unreachable for the user).
- **Rule 2** (s86 anti-pattern): keyword must NOT appear as a word in the stem.

```bash
node tools/check_transform_keywords.js
```

Exits non-zero on any violation. ~50ms on the full bank — cheap enough to run
unconditionally rather than scope to changed questions (catches drift in
unchanged items, which is how `emph_i02` survived undetected for months).

Past failures: `tf_32` (s86 fix), `emph_i02` and `tf_16` (s89r3 fix).

---

## 2b. LEVEL_TOTALS and CAT_TOTALS

After any question additions, the coverage constants in two functions must be patched:

- `renderCoverage()` — uses `TOTAL`, `LEVEL_TOTALS`, `CAT_TOTALS`
- `playerCoverageHTML()` — uses `TOTAL`, `LEVEL_TOTALS` (no CAT_TOTALS)

Derivation:
```bash
node -e "
const fs = require('fs'); const src = fs.readFileSync('index.html', 'utf8');
const ids = (src.match(/id:'([^']+)'/g) || []).length;
const lvls = ['B1','B2','C1','C2'];
const lvlCounts = lvls.map(l => ({l, n:(src.match(new RegExp(\`lvl:'\${l}'\`,'g'))||[]).length}));
console.log('TOTAL:', ids);
lvlCounts.forEach(({l,n}) => console.log(\` \${l}: \${n}\`));
console.log('LEVEL_TOTALS sum:', lvlCounts.reduce((s,x)=>s+x.n,0));
"
```

Cross-check: sum of LEVEL_TOTALS must equal TOTAL.

---

## 3. No duplicate declarations

```bash
grep -nE "^const (FS_BASE|DB_NAME|ALL_QUESTIONS|FS_PROJECT) " index.html
```

Each must appear exactly once. Multiple declarations cause silent runtime errors.

---

## 4. Insertion sanity

For any question additions or edits, inspect 100 chars before and after each
insertion point. No merged strings, no missing commas. The most common defect is
missing trailing comma on the previous question.

---

## 5. Sparse-array scan

```bash
grep -n '},\s*,' index.html
```

Should return zero matches inside `ALL_QUESTIONS`. Any match creates an
`undefined` element → ghost "undefined" category tile in the UI. Fix: remove the
extra comma.

---

## 6. Duplicate stem check

For each newly-added or edited question, grep the first 6+ unique words:

```bash
# Example for a new question
grep -n "She had to call off the meeting" index.html
```

Confirm only the new question's ID has this stem. Gap/input pairs sharing a stem
are acceptable; identical type+stem are not.

---

## 7. Version string consistency

The version string `vYYYYMMDD-tN` must appear identically in **four** places:

1. HTML version badge (search for previous version string in `index.html`)
2. Service worker cache key in `sw.js` (`CACHE = 'eq-vYYYYMMDD-tN'`)
3. Version constant (if any) in `index.html`
4. Git commit message prefix

Counter convention: the `s` series ran s1–s100; from t1 onward use the `t` prefix. Past sessions remain at their original `sN` tags — don't retag them. New sessions increment the `t` counter. Same-session rebuilds append `r2`, `r3`.

Mismatch causes silent bugs:
- Stale SW cache key = browser serves old JS regardless of new HTML (root cause s66r1–r4 blank card bug)
- Mismatched badge = users don't know they have the latest

```bash
grep -nE "v202[0-9]{5}-[st][0-9]+(r[0-9]+)?" index.html sw.js
```

All hits should show the same version string.

---

## 8. Commit and push

Once everything above passes:

```bash
git add -A
git status  # final visual check
git commit -m "vYYYYMMDD-tN: <one-line summary>

- bullet 1
- bullet 2
- ...

🤖 Generated with Claude Code"
git push
```

Wait ~60 seconds for GitHub Pages to rebuild. Verify at
`artemseliverstov.github.io/english-quiz?reset=1` (the `?reset=1` busts SW cache).

---

## 9. Smoke test (live)

After GitHub Pages deploys:

1. Open the live URL with `?reset=1` on your phone
2. Confirm version badge shows the new version
3. Log in as one player, answer one question — verify Firestore write
4. **Answer one multi-blank question (e.g., `mc01`) end-to-end** — confirm the
   Next button enables after the last blank. Two distinct s84r4 / s89r2 bugs
   have produced an identical "Next stuck disabled" symptom; only a real submission
   exercises both paths.
5. Refresh, verify stats reload from Firestore correctly
6. Tap any deeplinks generated this session (if applicable) — verify they work

If anything fails: **revert immediately**.

```bash
git revert HEAD
git push
```

The previous version goes live in ~60 seconds. Family experience restored. Then
investigate offline.

---

## What changed from the deploy.html era

| Old workflow | New workflow |
|---|---|
| Generate deploy.html with base64 embeds | Edit `index.html` and `sw.js` directly |
| Verify base64 chars > 100 | Skipped — no base64 |
| Decode-verify after re-embedding | Skipped — no embedding |
| Download deploy.html, open in Chrome, paste PAT | `git push` from Claude Code |
| GitHub Trees API for atomic commit | Standard git commit handles atomicity |
| ~5 min deploy time | ~60 sec deploy time |

---

## Common failure modes

| Failure | Symptom | Fix |
|---|---|---|
| SW cache key not bumped | New JS doesn't load on devices that visited before | Bump `sw.js` cache key, push again |
| Sparse array (extra comma) | Ghost "undefined" category tile in UI | Find `},\s*,` and remove |
| LEVEL_TOTALS not updated | Coverage % wrong after question add | Recompute and patch in both functions |
| `q:` field missing on new question | Blank question card | Add `q:` (never use `stem:` — silently ignored) |
| Integer ans encoded as string | Answer never marked correct | `ans: 0` not `ans: '0'` for gap/mcq |
| Question count drops | Accidental deletion or merge bug | git diff to find missing block |
