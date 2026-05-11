# english-quiz-coach Worker

Thin Cloudflare Worker that proxies the family-side PWA's Free Write and
"explain more" requests to `api.anthropic.com/v1/messages`. The PWA cannot
hold the Anthropic API key in client-side code, so this Worker holds it
on Cloudflare's encrypted secret store and forwards on origin/mode/model
validation.

Full design: `references/phase2-coach-tab.md` §7.

## Files

| File | Role |
|---|---|
| `index.js` | Worker source (~280 lines). Validation, system-prompt construction, Anthropic forward, `<session_meta>` parse. |
| `wrangler.toml` | Deploy config: name, plain-text vars (`ALLOWED_ORIGIN`, `ALLOWED_MODELS`). No secrets. |
| `.dev.vars.example` | Local-dev env-var template. Copy to `.dev.vars` for `wrangler dev`. |
| `.dev.vars` | (gitignored) Real local-dev values. Never committed. |

## First-time deploy

Prerequisites:
- `npm install -g wrangler` and `wrangler login` (one-time, browser auth)
- An `english-quiz-coach-worker` API key on a `console.anthropic.com` account
  with a workspace spend cap matching the prepaid balance

Steps:

```bash
cd worker
wrangler deploy
```

Wrangler creates the Worker on first deploy. The output prints the URL
(e.g. `https://english-quiz-coach.<your-subdomain>.workers.dev`). Wire this
URL into the PWA's Coach tab config.

Then set the API key as an encrypted secret (one-time):

```bash
wrangler secret put ANTHROPIC_API_KEY
# Wrangler prompts for the value; paste from your password manager.
# The key goes directly into Cloudflare's encrypted store.
```

The `ALLOWED_ORIGIN` and `ALLOWED_MODELS` values come from `wrangler.toml`
and are baked in at deploy time. To change them, edit `wrangler.toml` and
re-run `wrangler deploy`. (The secret persists across deploys.)

## Updating the model whitelist

Edit `ALLOWED_MODELS` in `wrangler.toml` and `wrangler deploy`. The PWA
must send `model` matching one of the whitelisted strings or the Worker
returns `400 WORKER_VALIDATION`.

## Updating the API key

Anthropic console: rotate the `english-quiz-coach-worker` key.

```bash
wrangler secret put ANTHROPIC_API_KEY
# Paste the new value when prompted.
```

The new key takes effect on the next request.

## Local development

```bash
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your real ANTHROPIC_API_KEY (gitignored).
wrangler dev
```

`wrangler dev` runs the Worker on `localhost:8787` against real
`api.anthropic.com` (consuming real prepaid credit).

## Testing

Curl test per `references/phase2-coach-tab.md` §7.8:

```bash
WORKER_URL="https://english-quiz-coach.<your-subdomain>.workers.dev/v1/messages"

# free_write
curl -s -X POST "$WORKER_URL" \
  -H "Content-Type: application/json" \
  -H "Origin: https://artemseliverstov.github.io" \
  -d '{
    "mode": "free_write",
    "model": "claude-sonnet-4-6",
    "messages": [{"role": "user", "content": "Yesterday I go to shop."}],
    "context": {
      "player": "anna",
      "level": "B2",
      "L1": "Russian",
      "focus_categories": ["tenses", "prepositions"],
      "coach_notes": {
        "weak_patterns": ["past simple irregulars (44%)", "preposition omission"],
        "engagement_notes": "RU translation for grammar rules helps."
      }
    },
    "session_id": "anna_test_1",
    "is_session_end": false
  }' | jq

# phrase_swap_drill
curl -s -X POST "$WORKER_URL" \
  -H "Content-Type: application/json" \
  -H "Origin: https://artemseliverstov.github.io" \
  -d '{
    "mode": "phrase_swap_drill",
    "model": "claude-sonnet-4-6",
    "messages": [{"role": "user", "content": "ready"}],
    "context": {
      "player": "artem",
      "level": "B2",
      "coach_language": "en",
      "target_item_count": 3,
      "phrase_pool": [
        {"awkward": "sometime ago", "natural": "a while ago", "tag": "brit_expat", "status": "active",
         "also_accept": ["a few weeks back"]},
        {"awkward": "we will investigate this matter", "natural": "we will look into it", "tag": "biz_oil", "status": "active"},
        {"awkward": "in the end of the day", "natural": "at the end of the day", "tag": "biz_oil", "status": "retest_due"}
      ]
    },
    "session_id": "artem_psd_test_1",
    "is_session_end": false
  }' | jq

# translation_drill
curl -s -X POST "$WORKER_URL" \
  -H "Content-Type: application/json" \
  -H "Origin: https://artemseliverstov.github.io" \
  -d '{
    "mode": "translation_drill",
    "model": "claude-sonnet-4-6",
    "messages": [{"role": "user", "content": "ready"}],
    "context": {
      "player": "anna",
      "level": "B1",
      "coach_language": "ru",
      "target_item_count": 6,
      "focus_categories": ["tenses", "prepositions"],
      "coach_notes": {
        "weak_patterns": ["preposition swap (arrive to → at)", "present perfect omission"],
        "engagement_notes": "RU translation for grammar rules helps."
      }
    },
    "session_id": "anna_td_test_1",
    "is_session_end": false
  }' | jq

# article_drill_live
curl -s -X POST "$WORKER_URL" \
  -H "Content-Type: application/json" \
  -H "Origin: https://artemseliverstov.github.io" \
  -d '{
    "mode": "article_drill_live",
    "model": "claude-sonnet-4-6",
    "messages": [{"role": "user", "content": "ready"}],
    "context": {
      "player": "anna",
      "level": "B1",
      "coach_language": "ru",
      "target_item_count": 8,
      "coach_notes": {
        "weak_patterns": ["article: zero where the needed", "a→the for shared knowledge"],
        "engagement_notes": "Short feedback, RU explanations."
      }
    },
    "session_id": "anna_ad_test_1",
    "is_session_end": false
  }' | jq

# error_correction_drill
curl -s -X POST "$WORKER_URL" \
  -H "Content-Type: application/json" \
  -H "Origin: https://artemseliverstov.github.io" \
  -d '{
    "mode": "error_correction_drill",
    "model": "claude-sonnet-4-6",
    "messages": [{"role": "user", "content": "ready"}],
    "context": {
      "player": "ernest",
      "level": "A2",
      "coach_language": "en",
      "target_item_count": 6,
      "focus_categories": ["prepositions", "articles"],
      "coach_notes": {
        "weak_patterns": ["preposition swap (arrive to → at)", "article: zero where the needed"],
        "engagement_notes": "Prefers short, targeted feedback."
      }
    },
    "session_id": "ernest_ec_test_1",
    "is_session_end": false
  }' | jq

# weak_spots_drill
curl -s -X POST "$WORKER_URL" \
  -H "Content-Type: application/json" \
  -H "Origin: https://artemseliverstov.github.io" \
  -d '{
    "mode": "weak_spots_drill",
    "model": "claude-sonnet-4-6",
    "messages": [{"role": "user", "content": "ready"}],
    "context": {
      "player": "artem",
      "level": "C1",
      "coach_language": "en",
      "topic_hint": "emphasis_clefts",
      "coach_notes": {
        "weak_patterns": ["cleft + inversion under-use", "article: zero where 'the' needed"],
        "recent_observations": [
          {"date": "2026-05-08", "note": "Strong on it-clefts, shaky on negative fronting (Only after...did we)."}
        ],
        "engagement_notes": "Prefers fast pace, explicit mechanics blocks."
      }
    },
    "session_id": "artem_ws_test_1",
    "is_session_end": false
  }' | jq

# escalate
curl -s -X POST "$WORKER_URL" \
  -H "Content-Type: application/json" \
  -H "Origin: https://artemseliverstov.github.io" \
  -d '{
    "mode": "escalate",
    "model": "claude-opus-4-7",
    "messages": [{"role": "user", "content": "explain more"}],
    "context": {
      "player": "anna",
      "level": "B2",
      "L1": "Russian",
      "focus_categories": [],
      "coach_notes": {"weak_patterns": [], "engagement_notes": ""},
      "exercise": {
        "id": "tr_anna_b04",
        "prompt": "Я ищу ключи.",
        "expected_answers": ["I am looking for the keys"],
        "submitted": "I look at keys",
        "pre_generated_feedback": "look at = visual focus; for search use look FOR."
      }
    },
    "session_id": "anna_escalate_1",
    "is_session_end": true
  }' | jq
```

Successful response shape:

```json
{
  "ok": true,
  "content": "...",
  "tokens_used": {
    "input": 1200,
    "output": 180,
    "cache_read": 0,
    "cache_creation": 1100
  },
  "model_used": "claude-sonnet-4-6",
  "session_metadata": null
}
```

On the second turn within the 5-minute cache window, `cache_read` should
report a positive value and `input` should drop to the volatile suffix only.

> **Note (s91 smoke-test observation):** The current free_write system
> preamble renders to ~400 tokens. Sonnet 4.6's minimum cacheable prefix
> is **2048 tokens** — below that, `cache_control` is a silent no-op
> (no error, just `cache_read: 0` / `cache_creation: 0` on every turn).
> The `cache_control` marker is left in the Worker as a no-op cost
> (zero) so caching kicks in automatically once `coach_notes` data
> grows the preamble across the threshold. Track this via the
> `tokens_used.cache_read` field on responses.

Error shape:

```json
{
  "ok": false,
  "error_code": "WORKER_VALIDATION" | "API_402" | "API_5XX" | "WORKER_TIMEOUT",
  "error_message": "...",
  "retriable": true | false
}
```

## Validation rules (per §7.3)

In order:
1. Origin header must equal `ALLOWED_ORIGIN` (403 otherwise).
2. Body ≤ 50 KB (413 otherwise).
3. `mode` must be `"free_write"`, `"escalate"`, `"phrase_swap_drill"`, `"weak_spots_drill"`, `"translation_drill"`, `"error_correction_drill"`, or `"article_drill_live"` (400 otherwise).
4. `model` must be in `ALLOWED_MODELS` whitelist (400 otherwise).
5. `messages` non-empty array; `context.player` ∈ {anna, nicole, ernest, artem, egor}; for `escalate`, `context.exercise` is required; for `phrase_swap_drill`, `context.phrase_pool` is required as a non-empty array of `{awkward, natural, tag?, status?, also_accept?}` entries; for `weak_spots_drill`, `context.topic_hint` (if set) must be a string; for `translation_drill`, `error_correction_drill`, and `article_drill_live`, `context.target_item_count` (if set) must be a positive number and `context.focus_categories` (if set) must be an array (400 otherwise).

## phrase_swap_drill mode (added 2026-05-06)

Lexical/register swap drill — RU cue → EN production, lenient scoring (multiple natural forms accepted), 1–2 sentence register explanation on stiff production. Driven by `players/{name}.weak_patterns` lexical entries (`awkward → natural [tag]` notation) and `players/{name}.phrase_tracker` retest-due entries. See `references/exercise-types.md` type 9 and `references/coach-notes-schema.md` "Phrase tracker lifecycle".

PWA payload shape:

```json
{
  "mode": "phrase_swap_drill",
  "model": "claude-sonnet-4-6",
  "messages": [{"role": "user", "content": "ready"}],
  "context": {
    "player": "artem",
    "level": "B2",
    "coach_language": "en",
    "target_item_count": 6,
    "phrase_pool": [
      {"awkward": "sometime ago", "natural": "a while ago", "tag": "brit_expat", "status": "active",
       "also_accept": ["a few weeks back", "some time back"]},
      {"awkward": "we will investigate", "natural": "we'll look into it", "tag": "biz_oil", "status": "active"},
      {"awkward": "right at the start", "natural": "right off the bat", "tag": "brit_expat", "status": "retest_due"}
    ]
  },
  "session_id": "artem_psd_test_1",
  "is_session_end": false
}
```

Default `target_item_count` is 6, max 10 (capped server-side). PWA is responsible for assembling `phrase_pool` by filtering `weak_patterns` lexical entries and reading `phrase_tracker.entries` where `status == "retest_due"` and `next_retest <= today`. Recommended mix: 4 active + 2 retest-due.

Session-end response shape (when `is_session_end: true`):

The model's reply contains both a player-facing close (markdown table + feedback ask) and a `<session_meta>` block with `phrase_swaps_drilled`, `topics_covered`, `session_summary`. The Worker strips and parses the `<session_meta>` block into `session_metadata` on the response. `phrase_swaps_drilled[].produced_natural` (boolean, per pool entry actually drilled) feeds the phrase_tracker lifecycle transitions in `stats-review`.

## translation_drill mode (added 2026-05-11)

Live RU→EN translation drill, conversational scoring, one item at a time. Replaces the library-driven `translation` Coach type as the primary path; library survives as offline fallback (PWA routes live-first when online + API up, falls back to `exercises_library/translation/items` otherwise).

PWA payload shape:

```json
{
  "mode": "translation_drill",
  "model": "claude-sonnet-4-6",
  "messages": [{"role": "user", "content": "ready"}],
  "context": {
    "player": "anna",
    "level": "B1",
    "coach_language": "ru",
    "target_item_count": 8,
    "focus_categories": ["tenses", "prepositions"],
    "coach_notes": {
      "weak_patterns": ["preposition swap (arrive to → at)", "present perfect omission"],
      "engagement_notes": "RU translation for grammar rules helps."
    }
  },
  "session_id": "anna_td_test_1",
  "is_session_end": false
}
```

`target_item_count` default 8, max 12 (capped server-side). `focus_categories` and `coach_notes.weak_patterns` shape which structures the AI rotates through. Cues are themed to the player's real-life contexts per `family-profiles.md` — no generic stems.

Session-end response shape (when `is_session_end: true`):

Player-facing summary table + a `<session_meta>` block with `items_drilled[]` (per-item: `prompt_ru`, `submitted`, `target_structure`, `produced_correct`), `error_patterns_observed[]`, `topics_covered: ["translation_drill"]`, `pvs_used_correctly[]`, `session_summary`, and `assessment{}`. The `assessment` block feeds `aggregated_coach_sessions.estimated_level` for proficiency tracking — same path as `free_write` and `weak_spots_drill`. `items_drilled[].produced_correct` feeds per-item stats aggregation.

## article_drill_live mode (added 2026-05-11)

Live single-blank article gap-fill, conversational scoring. Replaces the library-driven `article_drill` Coach type as primary when online + API up; library remains offline fallback.

Each turn: AI presents one short sentence (8-15 words) with one `___` blank, themed to player profile. Player types one article (`a` / `an` / `the` / `—` / `zero` / `no article` — all accepted). AI scores against the rule-required article and rotates across four article sub-categories (indefinite, definite, generic zero, fixed-expression zero).

Payload + session-end shape mirror `translation_drill` / `error_correction_drill`. `target_item_count` default 10, max 15 (article drills are higher density). Session-end emits `items_drilled[]` with `prompt_sentence`, `submitted`, `target_structure` (snake_case article sub-category), `produced_correct`. Proficiency tracking via the same `assessment.estimated_level` path.

## error_correction_drill mode (added 2026-05-11)

Live "one sentence, one error" drill, conversational scoring. Replaces the library-driven `error_correction` Coach type as the primary path when online + API up; library survives as offline fallback.

PWA payload shape mirrors `translation_drill` (same `target_item_count` default 8, max 12; `focus_categories` + `coach_notes` shape target structures). The AI generates one English sentence per turn containing exactly one error in a target structure drawn from `weak_patterns` / `focus_categories`. Player corrects (full sentence or just the fix); AI scores conversationally.

Session-end emits the same shape as `translation_drill` — `items_drilled[]` (with `prompt_sentence` instead of `prompt_ru`), `error_patterns_observed[]`, `topics_covered: ["error_correction_drill"]`, `pvs_used_correctly[]`, `session_summary`, and `assessment{}`. Proficiency tracking via the same `assessment.estimated_level` → `aggregated_coach_sessions` path.

## weak_spots_drill mode (added 2026-05-11)

Depth-focused live AI session on a single topic. ~30 minutes, 15-20 production items, tier-ladder structure. Tutorial-vs-drill emerges from `coach_notes.recent_observations` — if the AI finds a prior session on the same topic in the last ~14 days, it skips long mechanics blocks and drops into production.

PWA payload shape:

```json
{
  "mode": "weak_spots_drill",
  "model": "claude-sonnet-4-6",
  "messages": [{"role": "user", "content": "ready"}],
  "context": {
    "player": "artem",
    "level": "C1",
    "coach_language": "en",
    "topic_hint": null,
    "coach_notes": {
      "weak_patterns": ["cleft + inversion under-use", "article: zero where 'the' needed"],
      "recent_observations": [
        {"date": "2026-05-08", "note": "Strong on it-clefts, shaky on negative fronting."}
      ],
      "engagement_notes": "Prefers fast pace, explicit mechanics blocks."
    }
  },
  "session_id": "artem_ws_test_1",
  "is_session_end": false
}
```

`topic_hint` is optional. When `null`, the AI proposes 2-3 topics on turn 1 from the catalog matching the player's `weak_patterns`; player picks. When set, the AI skips the propose-and-pick turn and walks the ladder directly. Canonical catalog ids: `emphasis_clefts | article_system | present_perfect_vs_past_simple | preposition_clusters | phrasal_verb_production`. Off-catalog free-text values are accepted — the AI improvises a 3-tier ladder.

Session-end response shape (when `is_session_end: true`):

Player-facing tier-by-tier recap + a `<session_meta>` block with `topic_id`, `tiers_touched`, `tier_results[]`, `error_patterns_observed[]`, `topics_covered[]` (prefixed `weak_spots:<topic_id>`), `pvs_used_correctly[]`, `session_summary`, and `assessment{}`. The `assessment` block feeds `aggregated_coach_sessions.estimated_level` for proficiency tracking — same path as `free_write`. `tier_results[]` feeds the daily review to inform whether a topic should reappear next session or graduate.

## Threat model

Per `references/phase2-coach-tab.md` §12: open Worker URL, no rate limit,
prepaid Anthropic balance + workspace spend cap as the hard ceiling.
CORS protects browser-based abuse; curl can bypass CORS but the prepaid
balance bounds the blast radius. Family scale (~5 users) doesn't justify
Workers KV / Durable Objects state for per-IP rate limiting.

## Cost ceiling

Recurring: prepaid balance on `console.anthropic.com` (currently $5
pilot — top up to $15 when validated). Workspace spend cap matches the
prepaid balance. Full worked example in §11 of the design doc.

## Future / deferred

- Streaming response — current Worker buffers the full Anthropic response.
  Family-scale tutoring fits in 1024 max_tokens so latency is acceptable;
  switch to SSE forwarding if responses get longer.
- Replace `<session_meta>` regex parse with `output_config.format` JSON
  schema on session-end requests for cleaner extraction.
- Per-IP rate limiting via Workers KV if the prepaid balance ceiling
  proves insufficient.
