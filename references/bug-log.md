# Bug Log

Past gotchas, fixes, and preventive rules. **Search this before changing existing code.**

Format: `[bug] [fix] [preventive rule]`. Newest first.

---

## Architecture / sync

### Cross-player contamination — Nicole/Artem (2026-05-02)
**Bug**: Nicole's `players/nicole` Firestore doc was overwritten with a copy of Artem's data (identical `qStats` keys + `lastSeen`, `totalAnswered`, `recentSessions[1..9]`); only one genuine 2026-05-02 quiz session and `coach_notes` survived.
**Fix**: Restored from frozen RTDB baseline + the one genuine session. Daily Firestore backups now run via `.github/workflows/backup.yml` to a separate `backups` branch. `tools/_firestore.js` `fsSet` refuses player-root replaces without explicit opt-in.
**Rule**: see `plans/data-integrity-plan.md` for the full prevention/recovery plan (P0 done, P1 + P2 + PWA root-cause audit queued).

### PUT vs PATCH — Firestore equivalent (s87)
**Bug**: Firestore PATCH without `updateMask` replaces the entire document, wiping any field not in the request body — same family as RTDB's PUT-vs-PATCH issue from s72.
**Fix**: PWA `fsMerge()` helper uses `updateMask.fieldPaths=field1&...` for partial updates.
**Rule**: Always use `firestore_update` over `firestore_set` for partial updates. Direct REST calls without `updateMask` only when create-or-replace semantics are intended.

### migration_script.js wrong PLAYER_TOP_FIELDS (s87)
**Bug**: Migration script's whitelist only included emoji/pin/name, skipping all stats fields (totalAnswered, qStats, catStats etc.).
**Fix**: Replaced whitelist with "all keys except exercises". Re-ran migration after fix.
**Rule**: When migrating, prefer "all except X" over "only Y" — easier to maintain when schema grows.

### Firebase question migration cascading failures (s78→s82, rolled back)
**Bug**: Moved ALL_QUESTIONS to RTDB. Three failures: (1) endless mobile spinner from ~800KB Firebase fetch; (2) stats data loss — SW cache bust cleared IDB → empty sync via PUT → Nicole lost 34 sessions; (3) Claude couldn't read 1.1MB question uploader in context.
**Fix (s82)**: Rolled back. Questions re-embedded inline. Preserved improvements: PUT→PATCH, empty-data guard, pull-before-push flag.
**Rule**: Don't externalise data Claude needs to read/edit unless Claude has reliable remote access. The `_fbLoadComplete` guard flag prevents pull-before-push race.

### Pull-before-push race condition (s78, fixed s81)
**Bug**: `saveData` triggered `syncToFirebase` before `loadFromFirebase` completed → overwrote Firebase with blank IDB data.
**Fix**: `_fbLoadComplete` guard flag. Sync only proceeds after load completes.
**Rule**: Any sync operation must wait for the initial load to complete.

### `/players.json` bulk fetch truncates silently (s77)
**Bug**: Fetching `/players.json` to get all players in one call returns truncated JSON without error.
**Fix**: Per-player fetches via `Promise.all`. Direct sub-node fetches (`/players/artem/exercises.json`) are reliable.
**Rule**: Never bulk-fetch the whole players collection. Always per-player.

---

## Multi-blank questions

### answerMultiBlank `allCorrect` ReferenceError (s89r2)
**Bug**: Bare `allCorrect` referenced in `answerMultiBlank` (line 4176) on the last-blank submit path. Variable is declared in `recordMultiAnswer`, not in the calling scope — every multi-blank submission threw `ReferenceError: allCorrect is not defined`, aborting before `recordMultiAnswer` could enable Next. Same user-visible symptom as s84r4 (Next button stuck) but a different root cause. Introduced in s80r2 (April 1, 2026); broke every multi-blank question for ~4 weeks until reported.
**Fix**: One-character correction — use `multiState.allCorrect` (the field set on `renderMulti` and updated in `answerMultiBlank`).
**Rule**: When two functions share state, prefer the explicit object (`multiState.X`) over a bare identifier — typos resolving to undeclared globals fail silently in non-strict-ish contexts and only surface under live load. Multi-blank questions need a deploy smoke test exercising at least one full submission (see `pre-deploy-checklist.md` § 9).

### answerMultiBlank re-entry guard (s84r4)
**Bug**: Mobile double-tap fired `answerMultiBlank` twice for same blank → duplicate result pushed → tried to render blank N+1 (out of bounds) → crashed silently → Next button stayed disabled forever.
**Fix**: Guard at top of function: `if (!multiState || multiState.results.length !== blankIdx) return;`
**Rule**: ANY tap handler on multi-blank chips MUST guard against re-entry. `results.length !== blankIdx` is the canonical test. Never remove this guard.

### Multi-blank gap only filling first blank (s18)
**Bug**: `.replace('___', ...)` replaces first match only.
**Fix**: `.replace(/___/, ...)` with numbered blank IDs.

### art_b02 broken (s18)
**Bug**: gap type with single ans:0, both blanks filled "a".
**Fix**: Converted to multi type with per-blank opts/ans.

---

## Slot matching / weekly plan

### Slot double-match — one exercise marking two slots done (s84r2)
**Bug**: `Array.some()` is many-to-one. Two transform-type slots both matched a single transform exercise → "2/11" showed as 3 done.
**Fix**: `findIndex()` + `splice()` for one-to-one greedy matching.
**Rule**: Slot-matching uses one-to-one consumption — each exercise entry is consumed at most once.

### article_drill / particle_sort slots never match (s84r3)
**Bug**: Slots typed `article_drill` and `particle_sort` never matched because Claude generated deeplinks with `exercise: "error_correction"` for article drills.
**Fix**: Topic-aware fallback rules in `slotMatches()`.
**Rule**: Going forward, deeplinks must use canonical exercise names (`article_drill`, `particle_sort`) — fallback is only for old logs.

---

## Question schema / authoring

### `gi_b04` referenced in profile but missing from index.html (flagged 2026-04-30)
**Bug**: `gi_b04` had 9 cross-player attempts logged in Firestore qStats (Artem 0/2, Anna 1/2, Nicole 0/4, Egor 0/1) and was listed as a known stuck question for Nicole in `family-profiles.md`, but the qid is not present in `ALL_QUESTIONS` in `index.html`. Either deleted in a past edit without scrubbing references, or never authored — but stats accumulated regardless.
**Fix**: TBD. Either author the question (Gerunds & Infinitives B1) or scrub the qStats entries from all five players via a one-off script. Removed the dangling profile reference in same-day edit.
**Rule**: When deleting a question from `ALL_QUESTIONS`, scrub Firestore qStats references and any profile/coach_notes mentions in the same change.

### Stem field name (`stem:` vs `q:`) (s66r4)
**Bug**: 20 EE questions used `stem:` and `ans:'string value'` on gap. `renderQ` reads `q:` only → `q.q.replace()` on undefined → silent throw → blank card.
**Fix**: `renderQ` normalises stem→q at runtime. All 20 corrected to `q:` and integer ans (s66r6).
**Rule**: Always `q:`, never `stem:`. gap/mcq ans must be integer index, never string value.

### Pipe-separated ans not split (s66r7)
**Bug**: `answerInput()` treated whole pipe string as one value. Players typing any variant other than the full string were marked wrong.
**Fix**: `q.ans.split('|').map(a => a.toLowerCase().trim())`.
**Rule**: Input ans alternates: pipe-separated string. Always split at answer time.

### 76 orphaned questions outside ALL_QUESTIONS (s76)
**Bug**: 76 question objects sat between `]; ` of ALL_QUESTIONS and next code section. Bare globals, never parsed. 30 dupes + 46 missing.
**Fix**: Moved missing 46 inside array, removed dupes. Recomputed all coverage constants.
**Rule**: Question count checks must use bracket-depth-bounded extraction, not whole-file `grep -c`.

### Missing comma in ALL_QUESTIONS (s20, recurred)
**Bug**: Missing comma between aph36 and pp_ap05 → SyntaxError at line 2259. Cascaded: FB_DB_URL re-declared, showTab undefined.
**Fix**: Added comma. Pre-deploy `node --check` would have caught it.
**Rule**: Run `node --check` on extracted JS before every deploy.

### replace_exp() unescaped apostrophes (s27)
**Bug**: 15 JS strings silently broken. Contractions in exp text closed surrounding string early.
**Fix**: All 15 reconstructed with proper escaping. Premature-string-closure scanner added.
**Rule**: Any function writing into a JS string literal MUST call `.replace("'", "\\'")` first.

### Hint reveal before attempt (s17)
**Bug**: Full hint shown unconditionally before attempt → revealed answer.
**Fix**: Only word-count bracket shown pre-attempt; full hint after wrong answer.

### rs05/rs06/rs07 intros gave away answers
**Bug**: intro contained full backshift rule, naming both answers before attempt.
**Fix**: Generic category labels in intro. Per-question authoring checklist now requires intro spoiler check.

### Transform questions had source/keyword stripped (s78→s82 roundtrip, fixed s83)
**Bug**: All 45 transform-type questions had `source` and `keyword` fields stripped during s78→s82 Firebase roundtrip.
**Fix**: Recovered from s70 deploy and patched back in s83.
**Rule**: All transform questions require `source` and `keyword` fields. Never strip during migrations.

### tf_32 keyword-in-stem bug (s86)
**Bug**: Keyword "ONLY" placed in stem → validator always rejected correct answers because typed answer never contained "ONLY".
**Fix**: Rewrote with new source where keyword must appear in answer.
**Rule**: Before authoring any transform: verify keyword does NOT appear in stem before or after blank. Producible only through answer field.

---

## Coverage / stats display

### LEVEL_ORDER used counts not ordinals (s17)
**Bug**: `LEVEL_ORDER = {B1:352, B2:542, C1:140, C2:16}`. C2 selected → `maxLvlNum=16` → B1 (value 352) excluded.
**Fix**: Ordinals `{B1:1, B2:2, C1:3, C2:4}`.

### lvlSeen percentages over 100%
**Bug**: Counter initialised with question totals then incremented per answer.
**Fix**: Init all to 0.

### Duplicate category tag ("GRAMMAR GRAMMAR") (s17)
**Bug**: `recordAnswer()` prepended category to #q-cat after `renderQuestion()` had set it.
**Fix**: Category written once in renderQuestion only.

---

## Deploy / SW

### SW cache key not bumped → stale JS (s66r1–r4 root cause)
**Bug**: Decoded `var S='...'` showed cache key from prior deploy. Browser served old JS regardless of new HTML → blank card.
**Fix**: Always decode `var S` and confirm `CACHE='eq-{version}'` matches current deploy version. Never reuse SW base64 from prior deploy.
**Rule**: Pre-deploy checklist enforces SW cache key version match. Now in `pre-deploy-checklist.md`.

### Display version string hardcoded (s21)
**Bug**: Display version badge separate from SW cache name. Multiple rebuilds all showed old hash → impossible to confirm which build was running.
**Fix**: Display string updated consistently each build. Now part of pre-deploy 4-place version check.

### `?reset=1` handler used document.write (s21, s85)
**Bug**: Reset handler fetched index.html as text then `document.write(html)` re-parsed and re-executed scripts. Every const declared twice → crash.
**Fix**: Replaced with `location.replace(location.pathname)` — proper full-page navigation.

### Two sequential PUT /contents calls (pre-Git Trees)
**Bug**: Two commits → GitHub Pages two builds → first cancelled → "workflow cancelled" emails.
**Fix**: Git Trees API for atomic single commit (deploy.html era — now obsoleted by direct git push).

### Deploy file emptied by Python f-string collision (s65)
**Bug**: Python f-string interpolation collision emptied base64 variables → 7KB deploy file instead of 1.3MB.
**Fix**: Pre-deploy size check (>1MB).
**Rule** (deploy.html era — now obsoleted): always verify deploy file size before presenting.

### Deploy script had triple closing paren (s65)
**Bug**: `await(await fetch()).json())` — extra paren silently killed `deploy()` function.
**Fix**: Extract `<script>`, replace base64 with placeholders, run `node --check`.
**Rule**: Now baked into pre-deploy checklist (`node --check` extracted JS).

---

## Firebase paths

### Exercises path used root-level (s71→s72)
**Bug**: Wrote to `/{player}/exercises/{ts}.json`. Firebase rules only allow writes under `/players/`, so all exercise writes failed HTTP 401.
**Fix**: All three locations changed to `/players/{player}/exercises/{ts}.json`.
**Rule**: Any new Firebase path must use `/players/` prefix. Never write to root-level paths.

---

## Common preventive rules summary

1. Always `node --check` extracted JS before deploy
2. Question count via bracket-depth extraction, not whole-file grep
3. SW cache key bumped on every release
4. Version string identical in all 4 places
5. PATCH not PUT for partial updates (Firestore: `firestore_update`)
6. Per-player Firestore reads, never bulk
7. Multi-blank tap handlers always have re-entry guard
8. Slot-matching is one-to-one (findIndex + splice)
9. Use canonical exercise names in deeplinks (article_drill, particle_sort)
10. q: not stem: ; integer ans for gap/mcq ; pipe-split for input alternates
11. Transform questions need source + keyword fields ; keyword NOT in stem
12. Pre-deploy sparse-array scan: `},\s*,` in ALL_QUESTIONS
