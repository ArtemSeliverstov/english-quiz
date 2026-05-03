# Data integrity — prevention and recovery plan

**Status**: proposed (not yet implemented)
**Drafted**: 2026-05-03
**Trigger**: 2026-05-02 contamination incident — Nicole's Firestore player doc was overwritten with a copy of Artem's data. Recovered the next day from frozen RTDB.

---

## What happened (one-paragraph summary)

On 2026-05-02 at ~10:42 UTC, Nicole's `players/nicole` Firestore document was effectively recreated: `createdAt` was reset to that minute, `totalAnswered` / `totalCorrect` / `catStats` (28 categories) / `qStats` (1791 keys, sample byte-identical including `lastSeen`) / `recentSessions[1..9]` were all overwritten with Artem's exact values, and a single 10-question quiz was logged on top as `recentSessions[0]`. `coach_notes`, `ui_shell`, `learning_path`, `displayName`, `color`, `emoji` survived — but only because they're not written by the PWA's play loop.

Detected ~28 hours later during the stats review on 2026-05-03. Recovered because the legacy RTDB at `artem-grammar-hub-default-rtdb.europe-west1.firebasedatabase.app` is still frozen-but-readable (sunset planned ~2026-05-28). Restore script: `tmp/restore_nicole.js` (cleaned up after use; rebuild from this doc + git history if needed).

Root cause: not confirmed. Most likely a PWA bug in the player-switch + write path (stale player-id variable, or IndexedDB cache flushed under wrong player ID). It was not from `tools/` — those write specific fields, not whole-doc replacements.

---

## Why this needs urgent attention

- **RTDB sunsets ~2026-05-28** (per `MIGRATION_HANDOFF.md`). After that, a similar contamination has **no recovery path**.
- Today's recovery was luck. We had no backup file in the repo, no `family_stats_ai` JSON export, no PITR (Blaze plan not enabled).
- The bug that caused it is unidentified. It can recur on any of the 5 players at any time.

---

## P0 — Daily backup before RTDB sunsets

Build a snapshot pipeline so a future contamination is recoverable from a local file rather than a soon-to-die legacy database.

### Action

- Add `tools/backup_players.js`. For each of the 5 players, fetch:
  - The player doc itself (`players/{name}`)
  - The `exercises` subcollection
  - The `coach_sessions` subcollection
  Write to `backups/YYYY-MM-DD/{player}.json` (one file per player, all three sections inside).
- Schedule it. Two options:
  - **(a) Local cron / launchd / Task Scheduler on Artem's laptop** — runs the script daily, commits to a `backups/` directory in this repo. Free, version-controlled, dead simple. Requires laptop to be on at cron time.
  - **(b) GitHub Actions on schedule** — same script in CI, commits to a `backups/` branch. Machine-independent. Needs a Firestore read token in GitHub secrets.
- Retain ~30 days; older snapshots compressed or pruned by a small monthly job.

**Recommendation: (a)** for speed. Switch to (b) later if cron flakiness becomes a problem.

### Cost / value

~15 min to write the script, ~15 min to schedule. Today's recovery would have been a 30-second `git checkout` instead of an hour of investigation.

---

## P1 — Integrity check that catches contamination within hours

A small `tools/check_player_integrity.js` that runs as part of `stats-review` (and ideally as its own daily job).

### Three cheap invariants

1. **Cross-player overlap** — if two players share >10% of `qStats` keys with byte-identical `lastSeen` values, flag. Today's Nicole-vs-Artem case would have hit 100%.
2. **`createdAt` drift** — store last-known `createdAt` per player (in the daily backup, or in a tiny `data-integrity-baseline.json`); if it changes between snapshots, alert. Today's case had `createdAt` jumping from 2026-03-01 to 2026-05-02 — would have flagged immediately.
3. **Catastrophic-shift detection** — if `totalAnswered` for any player jumps by >100 between consecutive backups without `recentSessions` accounting for the delta, flag. Today's case had `totalAnswered` jump from 780 to 2795 — flag would fire.

### Wire-in

Add a "step 0: integrity check" line to `.claude/skills/stats-review/SKILL.md`. Stats reviews start by running this; any flag must be resolved before the rest of the review proceeds.

### Cost / value

<50 lines of Node. Detection moves from "next stats review someone happens to run" (today: 28 hours) to "next daily backup" (24 hours max, often sooner).

---

## P1 — Root-cause audit in the PWA

Without finding the actual contamination source, recurrence is likely. Worth a single focused session (1–2 hours).

### What to look at in `index.html`

- How the PWA decides which player ID to write to. Search for `players/${...}` or similar string-built paths — any chance of the variable being stale across a player switch?
- IndexedDB layer: does it store the full player doc? Does it ever flush back to Firestore as a complete replace (vs field-level merge)?
- Whether the Coach tab and quiz tab share a "current player" state correctly. Switching tabs after switching players is suspect.
- The shared-device scenario specifically: log in as Artem, switch to Nicole, play one quiz — what writes happen, to which doc, with what payload?

### Outcome

Either (a) the bug is found and fixed in `index.html`, or (b) it isn't, and we accept the risk while leaning harder on backups + integrity checks. Either way, the audit is bounded.

---

## P2 — Schema validation in `tools/_firestore.js`

A defensive layer inside our own write path. Doesn't help against PWA writes (they don't use this), but ensures `tools/` can't become a future contamination source.

### What to add

- Whenever any tool calls `fsSet` or `fsPatch` on `players/{name}`, validate before the network call:
  - If `recentSessions` is being written, sanity-check the entries don't reference another player's session IDs.
  - If `qStats` is being written with a count delta of >50 keys, log a warning to stderr. Real per-session deltas are <30 keys.
  - If a write replaces the entire `players/{name}` document (vs patching specific fields), require an explicit `--full-replace` flag in the calling script. (Today's restore was a legitimate full-replace; future routine writes should never be.)

### Cost / value

~30 min. Cheap belt-and-braces.

---

## P3 — Server-side invariants (only if upgrading to Blaze)

Two things become possible on the paid plan and not before:

- **Point-in-Time Recovery (PITR)** — 7-day rolling history at minute precision. Would have made today's recovery one line. Currently rejected by Firestore: `'read_time' is too old` (PITR requires Blaze).
- **Cloud Functions** — pre-write validation triggers, e.g. a function that rejects any write to `players/{name}` whose payload references another player's session IDs, or whose `createdAt` mutates after initial creation.

Both require billing. **Not recommending an upgrade just for this** — the P0 + P1 plan covers ~95% of the risk for $0/month. Revisit only if a second contamination occurs after P0+P1 are in place.

---

## Suggested sequence

| Step | What | Time | Blocking? |
|---|---|---|---|
| 1 | Write `tools/backup_players.js`, run once manually for an immediate snapshot | ~15 min | **Yes — do before anything else** |
| 2 | Schedule the backup (local cron) | ~15 min | No |
| 3 | Write `tools/check_player_integrity.js`, wire into `stats-review` SKILL.md | ~30 min | No |
| 4 | PWA root-cause audit | 1–2 hr | No (can run in parallel) |
| 5 | Schema validation in `_firestore.js` | ~30 min | No |

Total active work: ~3 hours, spread across one or two sessions. The first 30 minutes (steps 1–2) eliminate the dependency on RTDB before sunset.

---

## Notes for whoever picks this up

- The restore script for Nicole was at `tmp/restore_nicole.js` — cleaned up after use. The pattern (RTDB read → merge with current Firestore → preserve coach_notes / Firestore-only fields → catStats/lvlStats absorb the new session deltas → write back via `fsSet`) is documented in this conversation's history if needed again.
- The `coach_notes` field survived because it's only written by `update_coach_notes.js`, never by the PWA play loop. That's a useful invariant — anything we want to be **resilient to PWA contamination** should live alongside `coach_notes` (i.e., touched only by deliberate tool writes, not by the play loop).
- RTDB read URL pattern: `https://artem-grammar-hub-default-rtdb.europe-west1.firebasedatabase.app/players/{name}.json`. Public-readable as of 2026-05-03. Until ~2026-05-28.
