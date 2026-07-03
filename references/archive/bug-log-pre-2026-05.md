# Bug Log — archived (pre-2026-05 machinery)

Historical bugs from systems that **no longer exist**: the RTDB sync layer (frozen,
then sunset), the `deploy.html` / GitHub-Trees deploy pipeline (replaced by direct
git push post-s87), and s17-era coverage-display cosmetics. Split out of
`references/bug-log.md` on 2026-07-03 to keep the live log searchable. Every
still-applicable rule from these entries is preserved in the live log's
"Common preventive rules summary".

Do not treat these as current — they describe replaced machinery. Kept for provenance.

---

## Architecture / sync (RTDB era)

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
**Rule**: Never bulk-fetch the whole players collection. Always per-player. (Live-log summary #6.)

---

## Deploy / SW (deploy.html + GitHub-Trees era)

### Display version string hardcoded (s21)
**Bug**: Display version badge separate from SW cache name. Multiple rebuilds all showed old hash → impossible to confirm which build was running.
**Fix**: Display string updated consistently each build. Now part of pre-deploy 4-place version check.

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
**Rule**: Now baked into pre-deploy checklist (`node --check` extracted JS). (Live-log summary #1.)

---

## Coverage / stats display (s17-era cosmetics)

### LEVEL_ORDER used counts not ordinals (s17)
**Bug**: `LEVEL_ORDER = {B1:352, B2:542, C1:140, C2:16}`. C2 selected → `maxLvlNum=16` → B1 (value 352) excluded.
**Fix**: Ordinals `{B1:1, B2:2, C1:3, C2:4}`.

### lvlSeen percentages over 100%
**Bug**: Counter initialised with question totals then incremented per answer.
**Fix**: Init all to 0.

### Duplicate category tag ("GRAMMAR GRAMMAR") (s17)
**Bug**: `recordAnswer()` prepended category to #q-cat after `renderQuestion()` had set it.
**Fix**: Category written once in renderQuestion only.
