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
report ~1100 and `input` should drop to the volatile suffix only.

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
3. `mode` must be `"free_write"` or `"escalate"` (400 otherwise).
4. `model` must be in `ALLOWED_MODELS` whitelist (400 otherwise).
5. `messages` non-empty array; `context.player` ∈ {anna, nicole, ernest}; for `escalate`, `context.exercise` is required (400 otherwise).

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
