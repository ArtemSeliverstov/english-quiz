# Design Decisions

Why-we-did-X notes. When you're tempted to change something fundamental, search this
file first — the previous decision usually has a rationale.

Format: `[topic]` — decision and rationale. Newest substantive decisions first.

---

## Coaching loop

### Auto-write coach_notes for session skills (2026-05-06)
Flipped `free-write` and `exercise-session` from "preview → wait for explicit confirmation → persist" to "auto-write → table read-out → non-blocking feedback ask". Trigger: too many sessions where the player closed the tab during the feedback prompt and the data was lost. The 2+ sessions rule for `weak_patterns` is mechanical, so auto-write can't promote a hallucinated pattern — single-session evidence routes to `recent_observations` only, where FIFO prunes it if not corroborated. `stats-review` (operator-mode batch review, no learner present) and `family-profiles.md` edits (git commits, harder to revert) stay confirm-first.

Player-facing read-out is a small markdown table (≤10 lines) hiding internal field names, session IDs, and status codes. Three skill-specific templates live in `coach-notes-schema.md` "Player-facing read-out templates". Feedback ask follows persist, not the other way round — if the player answers, the answer appends to `recent_observations` (auto). If not, the session is already saved.

### `weak_patterns` accepts lexical/register swaps via convention (2026-05-06)
Considered adding a dedicated `phrase_swaps` field to `coach_notes` for natural-language work, alongside the existing `weak_patterns` (grammar-only). Rejected. The grammar entries already use the `awkward → natural` shape (e.g. `"arrive to → at"`) and the worker (`worker/index.js:248`) already injects them into the Free Write system prompt. A bracketed context tag (`[brit_expat]`, `[biz_oil]`, etc.) is the only addition needed for lexical swaps to inherit recast/correction behavior. Zero schema change, zero new tooling — just a notation extension and a one-line worker prompt edit so the model treats lexical entries as recast targets, not error categories.

Crowding risk (`weak_patterns` may grow past 8–12 entries when lexical accumulates) is mitigated by routing demoted lexical swaps into the new `phrase_tracker` field (separate inventory), keeping `weak_patterns` itself bounded to active-rotation entries.

### Phrase tracker is Firestore canonical, markdown is generated (2026-05-06)
`players/{name}.phrase_tracker` map field is canonical: worker reads it directly when assembling `phrase_swap_drill` items (mixes ~4 active + ~2 retest-due). Markdown view at `progress/natural-phrases-tracker-{name}.md` × 5 is **generated** by `stats-review` on each refresh — never hand-edited. Two reasons over hand-authored markdown: (a) worker can't read repo files (Cloudflare runtime), so Firestore was already required; (b) avoiding drift between two writeable copies of the same data. Reasons over Firestore-only (no markdown): the user reads the PV trackers casually for coverage view; same instinct for natural phrases.

Spaced retest cadence: demote → 21d → first retest → if pass, 42d → second retest → if pass, 🏆 owned (no further retests). Failed retest at any point: back to active rotation, no cooldown. The cadence is mechanical; transitions happen in `stats-review`.

### Egor full family parity for supplementary surfaces (2026-05-06)
Egor was previously quiz-only ("does NOT do supplementary exercises", "no Coach tab use"). Reversed: he now has the same surfaces as Anna/Nicole/Ernest (PWA Free Write, PWA `phrase_swap_drill`, exercise sessions). Driver: the original "quiz-only" call was based on no observed engagement, but he hadn't been offered the surfaces. Themes are different from the rest of the family (`[academic_ielts] | [kpmg_consulting] | [almaty_daily]` — no `[brit_expat]` since he's in Almaty, not Bahrain). KPMG context clarified as English-speaking consulting work (Russian-L1 colleagues, English-language deliverables/clients) so the worker doesn't default to RU-translation framing. Coach language stays `en` (set previously alongside Ernest's call 2026-05-01).

---

## Storage architecture

### Firestore over RTDB (s87)
Migrated from Firebase Realtime Database to Cloud Firestore. Reason: claude.ai sandbox
allowlist permits `*.googleapis.com` (covers Firestore) but not `*.firebasedatabase.app`
(RTDB). Firestore reachable from Claude Code web sandbox; RTDB is not. Migration enables
direct writes from Claude Code without local laptop dependency.

### Append-only-leaning Firestore rules (post-t5)
Migrated from `allow read, write: if true` to per-collection rules forbidding `delete` on player docs and most subcollections, with the `exercises` subcollection write-once. Reads and create/update remain unauthenticated. Closes the "anyone with the project ID can wipe stats" hole at the rules layer. Recovery path: weekly Firestore backup branch via GitHub Actions.

App Check was the original plan but was deferred: the PWA uses raw `fetch()` (no Firebase SDK), and `tools/*.js` + the GitHub Actions backup also can't produce App Check tokens — token injection would be a multi-hour rewrite of every write path. Reconsider once a worker-as-gatekeeper centralises writes.

Anonymous Auth was a separate earlier proposal, also deferred: ties stats to a browser-scoped UID (lost on localStorage clear), and would require migrating existing player docs to claim a UID.

### Subcollection for exercises
Exercises stored as Firestore subcollection `players/{name}/exercises/{ts}` rather
than nested map field. Reason: Firestore document size limit is 1MB. Artem at ~50
sessions and growing would eventually blow the limit with nested maps. Subcollection
has no such limit.

### Questions stay inline (s82 decision, reaffirmed)
ALL_QUESTIONS lives inline in `index.html`. The s78 attempt to externalize to RTDB
failed catastrophically (rolled back s82). Rule: don't externalize data Claude needs
to read/edit unless Claude has reliable remote access. Now that Claude Code does have
that access via Firebase MCP, externalizing is theoretically possible — but the
current inline setup works fine, deploys are fast, and there's no compelling reason
to move.

### Two-layer memory model (post-s87)
- **GitHub repo** (this) — stable facts, version-controlled, manually curated
- **Firestore `coach_notes`** — dynamic per-player observations, written during sessions

Auto-memory (laptop CC) holds only CC-behavior facts. Player observations go to Firestore `coach_notes` — auto-memory is laptop-only and would never reach the mobile PWA.
See `coach-notes-schema.md`.

### Don't move profile content to Firestore (t7)
Considered moving the changeable parts of `family-profiles.md` (themes, authoring rules, learning goals) to Firestore for friction-free updates. Rejected. The high-cadence stuff is already in `coach_notes`; what's left in the file changes 5–10 times per quarter total across all 5 players. Two reasons to keep it: (a) git provides diff/blame/history that Firestore lacks; (b) the promotion rule (4-session persistence + intervention) is precisely the gate that prevented Nicole-style single-session noise from rewriting design intent. The friction is one merge per ~5 weeks via GitHub mobile or chat — a cost worth paying for the audit trail.

### Hard-remove deeplinks over soft-deprecate (t7)
Considered marking `?exlog=` / `?exstart=` / `?exupd=` / `?exfin=` deprecated and leaving the handlers in `index.html` for ~30 days. Rejected in favour of immediate removal: zero deeplink writes in 14 days of subcollection scans, claude.ai chat is now read-only-leaning, the handlers carry no operational benefit. Removed ~187 lines of code, eliminated `exercise_active` collection rule, simplified the canonical write paths to two (Coach tab + `tools/log_exercise.js`).

### Daily backup, per-player file layout, orphan branch (t7)
GHA backup workflow runs daily (was weekly), captures full subcollections (was player doc only), and writes one file per player per day at `backups/YYYY-MM-DD/{player}.json` on an orphan `backups` branch. Per-player matches the restore mental model (a future Nicole-style incident is a one-file diff). Orphan branch keeps backups out of GitHub Pages serving. Daily over weekly because the recovery worst-case is "one missing day" instead of "up to one week".

### `fsSet` refuse-player-replace (t7)
`tools/_firestore.js` now blocks `fsSet('players/{name}', ...)` unless explicitly opted in. The 2026-05-02 contamination was a full-document replace via the play loop; while the play loop doesn't go through `_firestore.js`, future tools/ scripts could trigger the same pattern. Defense-in-depth, with `opts.allowPlayerReplace` or `ALLOW_PLAYER_REPLACE=1` for legitimate restore use cases.

### Free Write CEFR rubric lives in two places (2026-05-05)
The silent CEFR-grading prompt for Free Write has two homes:
- **PWA path**: `worker/index.js` `sessionEndInstructions('free_write', ...)` — verbose, explicit per-criterion IELTS/CEFR rules.
- **CC path**: `.claude/skills/free-write/SKILL.md` — terser instruction next to the schema block.

Both anchor on the same gates ("grammar accuracy gates the level"; "confidence: low when sample < 3 sentences or off-topic — server-side skip"). When updating either, **update both in the same commit** — drift between them produces inconsistent lvlStats contributions depending on which surface the player used. The PWA prompt is the canonical version; if they disagree, sync the SKILL.md to match the worker.

### Unified daily streak across Quiz and Coach (Option D, 2026-05-05)
The two surfaces stay separate (two CTAs, distinct exercise types, separate subcollections — Quiz exercises recognition/controlled form, Coach exercises pushed output / Free Write). But `lastPlayedDate`, `currentStreak`, `longestStreak` are **shared** — any practice surface counts toward the same daily streak.

Triggered by a stats-review gap: Anna had 12 Coach-tab drills over three days but her player-doc `lastPlayedDate` showed her dormant 14 days. Earlier-session stats reviews missed her entirely.

Two corrections at once:
1. **All practice writers bump the streak.** `bumpDailyStreak(DB)` (idempotent, first-of-day) added to `coachUpsertSession` and `coachWriteSessionLogStandalone` in index.html; `bumpDailyStreakRemote(player)` added to `tools/_firestore.js` and called from `log_exercise.js` + `log_coach_session.js`.
2. **Per-surface aggregates stay split.** `qStats / catStats / lvlStats / totalAnswered / totalCorrect / totalSessions / recentSessions` remain quiz-only — Coach activity has its own ledger in the `exercises` subcollection. Only the *habit signal* unifies; the *diagnostic signals* stay surface-specific.

Rationale (web-researched):
- **Pedagogy (Krashen / Swain)**: receptive drilling and pushed free production are distinct cognitive functions and should be visible separately for diagnostics. → keep two CTAs, keep per-surface stats.
- **Gamification research (Decision Lab, *Journal of Consumer Research*)**: multiple parallel streaks correlate with fatigue, FOMO, and abandonment when one breaks. Loss aversion makes a broken streak more likely to end engagement than zero streak ever was. → unify the streak.
- **App-design convergence (Duolingo, Busuu, ELSA)**: dominant pattern is "one streak (any practice counts) + per-skill dashboard for diagnostics." Both ELSA's per-dimension scores and Duolingo's any-lesson-counts streak point this way.

Rejected alternatives:
- *A. Doc-only fix*: just mark `lastPlayedDate` quiz-only and forbid using it as activity gate. Leaves Anna's PWA home lying about her practice. UX cost.
- *B. Add `lastCoachDate`*: separate coach-side date field, no streak credit. Halfway: the home screen would show two stale-looking dates and learners with Coach-only activity get zero streak motivation.
- *C. Per-track streaks*: separate `coachStreak` / `quizStreak`. Exactly the multi-streak anti-pattern the gamification literature warns against; doubles the streak-logic surface area without diagnostic benefit.

---

## Pedagogy

### Active recall over recognition (input > gap > multi > mcq)
Type hierarchy ranked by cognitive demand. Free production (input) and constrained
production (gap) require retrieval from memory; MCQ allows elimination. Research:
the "testing effect" — retrieval effort during generation drives long-term retention.
MCQ retained only for sentence-level grammaticality judgement.

### Per-category input target ≥20%
Applies at category level, not just overall. Categories with lowest input share are
often highest-value for Russian speakers (articles, conditionals, tenses). A globally
healthy ratio masking per-category deficits gives false sense of coverage.

### Contrastive exp standard (S25, enforced S63)
Every exp must contain at least one explicit wrong-choice comparison (✗, "not X",
"unlike", etc.). Contrastive explanation is more effective than rule statement alone
for adult learners with competing L1 patterns.

### Pattern-specific L1 notes for articles (S84)
Generic "Russian has no articles" is too vague — becomes white noise. Five
pattern-specific templates: a→the (shared knowledge), zero, prep+art, fixed, dropped.
Russian этот/тот bridge at B1 only with caveat.

### Discourse-context article stems (S84)
B2+ a→the questions MUST use two-sentence stems. Research: 32–70% of article
decisions require cross-sentence context (Brown 1983, Jonz 1990). Single-sentence
stems only for zero-article rules and fixed expressions.

### Spaced repetition with interval scaling (S76)
Smart mode: each consecutive correct doubles suppression window. Intervals 1d → 2d
→ 4d → 7d → 14d. Wrong resets to 0. New-question budget capped at ~25% of batch to
prevent flooding for players with many unseen.

### Consolidation mode for struggling learners
Restricts pool to questions answered correctly at least once. For Nicole specifically
(S56). Builds retrieval confidence before re-exposing errors.

### Interleaved practice over blocked
Smart mode and Random mode pull from across all categories (interleaved). Research:
interleaved practice outperforms blocked by ~30% for long-term retention. Category
filter sessions are intentionally supported for targeted review but flagged as
suboptimal.

---

## Question authoring

### `q:` not `stem:`
The runtime reads `q:` only. `stem:` is silently ignored producing blank cards.
Historical EE questions used `stem:` — corrected in s66r6. Per-question checklist
enforces.

### Integer ans for gap/mcq, string ans for input
Gap/mcq: index into opts[] (`ans: 0`, never `ans: 'Sounds lovely'`). Input: string,
pipe-separated alternates (`ans: 'heard|had heard'`). Mismatched types silently
fail comparison.

### Hint format: bracket first, description after
Player sees only first parenthesised group before attempt. So word count must come
first: `"(2 words) past tense"`. Full hint shown after wrong answer.

### Hints never name the grammar rule
Player already sees category label. Grammar rules belong in exp (post-attempt). Pre-attempt
hint = word count + semantic clue only. (S79r2 standard.)

### G&I standard format: no hint
Pattern verb in stem, complement verb in bracket: `"She avoided ___ (MAKE) eye contact."`
The bracket makes the target unambiguous. Hint would be redundant. Exception: bare
infinitive / causative edge cases where structural constraint is non-obvious.

### Multi blank cap 2–3
Cognitive load compounds. `mc01–mc15` grandfathered (predate the cap).

---

## UX

### Three tabs: Practice, Statistics, Family
Decided early. No more tabs without strong reason.

### PIN per player, no auth
Five family members on shared devices. Trivial PIN for soft separation, no real
security. Avoids auth complexity entirely.

### Service worker caches index.html only (post-s78)
SW skips cross-origin requests. Only caches same-origin index.html. Questions live
in IDB, not SW cache. (Pre-s78: SW also cached questions; post-s82 rollback returned
to SW caching index.html only.)

### `?reset=1` for SW cache bust
Force SW refresh after deploy. Uses `location.replace(location.pathname)` (not
`document.write` — that re-executes scripts and crashes the app, s21).

---

## Operational

### Direct git push (post-s87)
The deploy.html flow is gone. Claude Code pushes `index.html` and `sw.js` directly.
Reason: Claude Code now active, GitHub OAuth available, mobile workflow primary.
Saves ~5 min per deploy. Standard git multi-file commits handle atomicity.

### Version stamping format (date-only `vYYYYMMDD` since 2026-05-07)
Identical across HTML badge, SW cache key, version constant, git commit message.
Inconsistency causes silent bugs (cache doesn't refresh, deploys point at wrong version).
Counter history: `s1`–`s100`, then a brief `t` series; date-only since 2026-05-07.
Same-day rebuilds append `-r2`, `-r3`. CI accepts legacy forms in history only.

### Live-AI-first Coach drills (Phase D reversal, 2026-05-11)
`learning-system-design.md` §6 originally listed "Live AI for every interaction" as a
don't-build (cost conservation). Reversed when Phase D shipped all five Coach drill
types live-AI primary, library content demoted to offline fallback. The cost ceiling
is a workspace spend cap on the Anthropic console, not a presence prohibition.

### Knowledge base in markdown (post-Phase 1)
HTML KB deprecated as the source of truth. Markdown files in `references/` are now
authoritative. HTML KB retained as `archive/` snapshot for human readability.

### MCQ retained for Natural English
Default ~40% target for EE category, vs reducing-over-time elsewhere. Reason:
naturalness is a whole-sentence judgement; MCQ is the right shape. Wrong options
are register-inappropriate, not ungrammatical.

---

## Things we explicitly chose NOT to do

- **Move questions to Firestore** — tried in s78, rolled back s82
- **Add Firebase Anonymous Auth now** — deferred until family scale or security need justifies
- **Sync Claude Code memory across surfaces** — auto-memory is laptop-only; would create false expectations
- **Build the deploy file generator** — replaced by direct git push (s87)
- **Add a "session in progress" PWA UI** — Stage 1.5 follow-up, infrastructure exists
- **Track per-question aggregate stats globally** — designed (s77 Session B), deferred. Each player has their own qStats; cross-player aggregates remain manual.
- **A/B test prompts on family members** — too small a sample, would distort the experience
- **Persistent leaderboard** — counter to the engagement-first policy for Nicole and Anna

---

## When to update this file

When a new fundamental decision is made (architecture, pedagogy, UX, operational).
Casual session-by-session decisions go in version-log.md instead. This file is the
"these are the rules of the road" reference, not a journal.
