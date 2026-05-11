# Open operational items

**Status**: backlog
**Scope**: operational/infrastructure work not tied to active build plans (`plans/learning-system-build.md` for engineering, `plans/question-bank-plan.md` for content). Not loaded by any SKILL — picked up explicitly on Artem's prompt.

Most items were extracted from `plans/repo-improvements.md` after the bulk of that plan shipped; full archive at `plans/archive/repo-improvements-completed.md`.

---

## Cap append-only logs

- **`references/version-log.md`** (~755 lines): keep last 5–10 sessions; archive older to `references/archive/version-log-pre-{date}.md`.
- **`references/bug-log.md`**: keep unresolved + last year; archive older to `references/archive/bug-log-pre-2026.md`.

**Why**: append-only logs grow without bound and dilute current signal when grep-discovered. Anthropic skill guidance ("Avoid time-sensitive information; if needed, move to an 'old patterns' section") applies — except here the old-pattern section becomes a separate archive file.

**Source**: `archive/repo-improvements-completed.md` §2.4.

---

## App Check on Firestore (Phase 3 follow-on)

Highest-priority Phase 3 item per `learning-system-build.md` §11.7. Gated on Phase 2D acceptance.

Three layers:
- **Firebase App Check (~1.5h)** — verifies requests come from the deployed PWA via reCAPTCHA Enterprise. Rule becomes `allow read, write: if request.app != null`. Closes the "anyone with the endpoint URL can write" hole at the network layer. No migration of existing docs, no per-user UIDs.
- **Append-only-ish rules (~1h)** — forbid `delete`, forbid shrinking arrays, cap document size. **Partially done**: `firestore.rules` already forbid delete on player docs (per `references/operational-rules.md` invariant); `tools/_firestore.js` refuses player-doc full-replace.
- **Weekly backup job** — ✅ done (GitHub Action runs daily, commits to orphan `backups` branch).

**Source**: `archive/repo-improvements-completed.md` §3.3, `learning-system-build.md` §11.7.

---

## Worker rate limit

Cloudflare KV or Durable Object counter: N req/min/player, N/hour/IP. Closes the "anyone with the worker URL drains the prepaid balance" hole. Independent of App Check work — worker fronts AI calls, not Firestore.

**Estimated**: ~2h.

**Source**: `archive/repo-improvements-completed.md` §3.4.

---

## Smaller fixes

- **`.mcp.json` hardcodes `D:/Claude/...`** — make relative or env-driven. Confirm whether anyone other than Artem clones this repo before acting.
- **Worker `RUSSIAN_FALLBACK_PLAYERS`** should log a warning when hit — signal old PWA bundles still pinging the worker after migration.
- **`archive/` and `ref/index.html` deployed publicly via Pages** — verify nothing references them before moving out of scope or adding to `.gitignore` for Pages.

**Source**: `archive/repo-improvements-completed.md` §3.7.

---

## Plan housekeeping

- **Doc-style.md "design 2500" cap** — `references/design-decisions.md` is at ~2,560 words after recent edits. `tools/check_doc_caps.js` only enforces CLAUDE.md and SKILL.md caps; the design-doc cap is aspirational. Either tighten the checker to enforce it, or drop the line from `doc-style.md`. Low priority either way.

---

## Items NOT carried forward from repo-improvements.md

Everything else from the original plan is shipped. See `plans/archive/repo-improvements-completed.md` for the full record.
