# Design Decisions

Why-we-did-X notes. When you're tempted to change something fundamental, search this
file first — the previous decision usually has a rationale.

Format: `[topic]` — decision and rationale. Newest substantive decisions first.

---

## Storage architecture

### Firestore over RTDB (s87)
Migrated from Firebase Realtime Database to Cloud Firestore. Reason: claude.ai sandbox
allowlist permits `*.googleapis.com` (covers Firestore) but not `*.firebasedatabase.app`
(RTDB). Firestore reachable from Claude Code web sandbox; RTDB is not. Migration enables
direct writes from Claude Code without local laptop dependency.

### Open writes (project-ID obscurity only)
Both pre-s87 RTDB and post-s87 Firestore use unauthenticated open writes (`allow read, write: if true`).
Roadmap item: tighten to `request.auth != null` with Anonymous Auth. Deferred because
each device would need UID setup, deeplink handlers need auth state, and the family
is small enough that obscurity-by-project-ID is acceptable interim.

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

No auto-memory because workflow is mobile-first (auto-memory is laptop-only filesystem).
See `coach-notes-schema.md`.

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

### Version stamping format `vYYYYMMDD-sN`
Identical across HTML badge, SW cache key, version constant, git commit message.
Inconsistency causes silent bugs (cache doesn't refresh, deploys point at wrong version).

### Knowledge base in markdown (post-Phase 1)
HTML KB deprecated as the source of truth. Markdown files in `references/` are now
authoritative. HTML KB retained as `archive/` snapshot for human readability.

### MCQ retained for Everyday English
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
