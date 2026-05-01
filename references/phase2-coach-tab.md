# Phase 2 — Coach Tab Execution Doc

**Status**: locked · drafted 2026-04-30 in claude.ai chat session
**Owner**: Artem · primary execution surface: Claude Code (laptop)
**Predecessor**: `PHASE2_PLAN.md` — superseded by this document. Delete once
this doc is in place.

This is the complete, self-contained Phase 2 execution document. It contains
the design, the build sequence, parallel content/audit work, required SKILL.md
updates, and an append-only status log. It is intended to be readable and
executable by Claude Code without needing to come back to claude.ai chat for
clarification. If something is ambiguous when CC reads this, that's a doc bug —
flag it and patch the doc rather than guess.

---

## 1. How to use this document (CC instructions)

At the start of any CC session related to Phase 2:

1. Read this document end to end (~10 minutes; one read per session).
2. Check **§17 Status log** for the latest state — what's been done, what's
   in progress.
3. Pick the next unstarted item using this priority:
   - If anything in **§13 Build sequence** is unblocked and unstarted → do
     that
   - Else: pick the next item from **§14 Parallel work tiers** following the
     tier ordering rule (Tier 1 first, then 2, then 3; Tier 4 only on
     explicit request)
4. Execute the work in the session.
5. Before ending the session, append an entry to **§17 Status log** describing
   what was done, what was learned, and any updates required to earlier
   sections of this doc.
6. If decisions in earlier sections need updating (e.g., model strings get
   confirmed in 2C), patch in place and note the change in the status log
   entry.

CC autonomy mandate: CC picks the next unstarted item within the priority
above without asking Artem. Tier 4 is the only exception — Tier 4 work runs
only when Artem explicitly requests it ("do an audit session") or when every
item in Tiers 1–3 is genuinely complete.

If a session uncovers a need to reopen a locked decision (§4), do not silently
override — surface it to Artem in the session, capture the discussion, and
update §4 if a new lock is reached.

---

## 2. Goal and end state

End state: a working family English learning system where:

- **Artem** uses Claude Code on laptop for exercise sessions and project
  maintenance. Authenticated via Max subscription. No API spend. Exercises
  are live and conversational (not pre-generated library content).
- **Anna, Nicole, Ernest** open a Coach tab inside the existing PWA on their
  own devices. Most exercises are pre-generated (rich feedback, zero API
  cost). Free Write and "explain more" escalations call the Anthropic API
  via a Cloudflare Worker. No claude.ai chat, no deeplinks, no copy-paste.
- **Egor** continues using only the quiz tabs (no exercises by design).
- **claude.ai chat** retains a narrow, stable role: cross-project personal
  context and one-shot grammar/pedagogy questions. Not used for project
  state writes.

The hybrid (pre-generated default for family + live API for Free Write +
escalate-to-AI button + live conversational for Artem in CC) is the
architectural commitment. Everything below flows from it.

---

## 3. Architecture overview

Two execution paths, fully separated.

**Artem's path**: Claude Code CLI on laptop, authenticated via Max
subscription. Firebase MCP plugin gives direct Firestore read/write. Model:
Opus by default. Cost: $0. Exercises are live and conversational; no library
reuse.

**Family path**: PWA Coach tab on family devices (iOS/iPad). Pre-generated
exercises read from Firestore `exercises_library/` and rendered/scored
locally. Free Write and Escalate POST to a Cloudflare Worker which forwards
to the Anthropic API. Auth: existing PIN flow at PWA level. Cost: prepaid
$15 ceiling on the API account.

The Cloudflare Worker (in `worker/` subfolder of the main repo) validates
origin/model/size/mode, attaches the API key from Cloudflare Secret, and
forwards to `api.anthropic.com/v1/messages`.

Data backbone for both paths: Cloud Firestore (`artem-grammar-hub` project,
`(default)` database). Existing `players/{name}` and
`players/{name}/exercises/{ts}` schemas are extended; new
`exercises_library/` and `players/{name}/coach_sessions/` collections are
added.

**Key non-overlap**: Artem's CC path never calls the Worker. The Worker
exists only because the family can't use CC. Likewise the family path never
uses Artem's CC tooling. Library content is family-only — Artem's CC sessions
generate exercises live; no library reuse. Authoring effort for the library
targets family players exclusively.

---

## 4. Locked decisions

| # | Decision | Locked value | Rationale |
|---|---|---|---|
| Q1 | Coach tab auth | Inherits PIN-protected player context from existing PWA login flow. No separate auth surface. | Coach tab lives in the same PWA; player is already identified. Rebuilding auth would be redundant. |
| Q2 | API access pattern | Cloudflare Worker proxy | Workers have ~0ms cold start, simpler secret storage, no Firebase Functions setup overhead. |
| Q3 | Worker scope | Validate origin + model whitelist + body size + mode param. Forward to API. **No rate limit.** | Prepaid balance is the real ceiling; rate limit adds complexity for marginal benefit at family scale. |
| Q4 | API key management | Dedicated key on a fresh `console.anthropic.com` account. Stored as Cloudflare encrypted Secret. $15 prepaid + $15 workspace spend cap as the hard ceiling. | Max subscription doesn't grant API access; products are separate. Two-layer cost ceiling makes runaway spend impossible. |
| Q5 | Pilot scope | MVP launches with Anna + Translation Drill (pre-generated, ~15 exercises). Other types and players added incrementally. | Anna's L1 errors are highly predictable, making translation high-coverage. 15 exercises is enough to test engagement without front-loading the build. |
| Q6 | Stats display | Minimal in MVP: last exercise score + top weak-spot card. Read from existing `players/{name}` doc. Richer surfacing deferred. | No new schema needed for MVP. Richer displays depend on `coach_notes` having real data, which requires sessions to land first. |
| Q7 | Cost cap | Prepaid balance only. No Worker rate limit, no per-session token caps in code. | Prepaid balance + workspace spend cap is a stronger architectural ceiling than rate limits. |
| Q8 | Free Write conversation persistence | Per-session standalone (no message history carried across sessions). `coach_notes` is read into the system prompt instead. CC path (Artem) handles its own persistence via CC's session model. | Carryover grows token cost linearly. Persistent learner profile in system prompt gives most of the value at fixed cost. |
| Q9 | Worker repo location | `worker/` subfolder in main `english-quiz` repo | One git history, easier cross-cutting changes, no cross-repo coordination overhead. |
| A1 | Architecture | Hybrid: pre-generated default for family + Free Write live AI + escalate-to-AI button. Artem can use either CC OR the Worker path (the latter added in s91-worker-r2 — see §17 entry). Library content remains family-only. | Pre-generated handles bounded exercise types richly; live AI handles unbounded Free Write. Artem's CC path remains zero-cost via Max; the Worker path is added for laptop-free / on-the-go convenience. Prepaid balance amply covers the extra volume at family scale. |
| N1 | Library schema | `exercises_library/{type}/{exercise_id}` per-type subcollections, with type-specific schemas (see §6). Enriched fields for future analysis. | Enables cross-cutting analysis between quiz performance and exercise performance over time. |
| N2 | Authoring workflow | CC-driven end-to-end via Firebase MCP. No claude.ai chat involvement in routine authoring. | Avoids manual copy-paste and back-and-forth. CC has full Firestore write access. |
| N3 | Model split | CC path: Opus. Worker `mode: "free_write"`: Sonnet. Worker `mode: "escalate"`: Opus. | Sonnet sufficient for grammar correction at family scale; Opus reserved for "I need more depth" moments. Halves API spend on the volume path. |
| PV1 | PV Phase 2 prefix | `pv_p2` | Already proposed; clear continuation of prefix scheme. |
| PV2 | PV Phase 2 type mix | CC picks gap/input/MCQ mix per PV based on existing per-category input share table and observed weakness in family stats. | Per-PV judgment beats a global rule; CC has the data needed to decide. |
| PV3 | PV Phase 2 Stage 1 | Starts immediately when CC reaches the PV item in Tier 2. | No reason to gate. |

---

## 5. Rejected alternatives

Captured for future-Artem so decisions don't get re-litigated without new
information.

- **Pure pre-generated, no API at all** — rejected because Free Write needs
  unbounded input and templates can't handle it. Also no graceful escape
  hatch when pre-generated patterns miss.
- **Pure live API, no pre-generation** — rejected on cost (unclear ceiling
  for family scale) and complexity (5 exercise types each needing prompt
  engineering vs. 1 type needing it).
- **Per-IP rate limit on Worker** — rejected because $15 prepaid is a
  stronger ceiling than rate limiting (no bypass, no misconfiguration risk)
  and the threat model (5 family members on a CORS-locked endpoint) doesn't
  justify it.
- **Per-session token budget tracking** — rejected as it would require
  Workers KV or Durable Objects for state. Complexity not justified for the
  threat.
- **claude.ai relay** (family copy-pastes prompts to claude.ai and back) —
  rejected because it's higher friction than the deeplink flow it would
  replace.
- **Local agent on Artem's laptop as backend for family** — rejected because
  the laptop must always be on, awake, and reachable.
- **Pure CC-for-Artem with no family-side build** — rejected because it
  leaves the family-side adoption gap unsolved.
- **Firebase Functions instead of Cloudflare Worker** — rejected because of
  cold starts (1–3s vs ~0ms) and the overhead of standing up new Firebase
  infrastructure for one endpoint.
- **Pre-generated library shared between Artem and family** — rejected
  because Artem's level + CC's live-generation capability make pre-generated
  content strictly worse for him, while authoring shared content doubles the
  maintenance burden.

---

## 6. Firestore schema

### 6.1 New collection: `exercises_library/`

One subcollection per exercise type. Each type has a tailored schema
appropriate to the exercise mechanics. Common fields (present in all types):

```
{
  id: string,
  type: string,                        // "translation" | "article_drill" | etc.
  target_player: string,               // "anna" | "nicole" | "ernest" | "all"
  level: string,                       // "B1" | "B2" | "C1" | "C2"
  focus_categories: string[],          // mirror quiz category names
  expected_difficulty: number,         // 1–5
  linked_question_ids: string[],       // quiz question IDs
  tags: string[],                      // e.g. ["L1_calque", "register_formal"]
  source_observation: string | null,
  created: ISO timestamp,
  version: number
}
```

`target_player: "artem"` is reserved but not currently used. Artem's
exercises are live, not library-backed. Reserved in case a future need for
Artem-specific library content emerges.

#### 6.1.1 `exercises_library/translation/{id}`

```
{
  ...common,
  prompt_ru: string,
  prompt_en_hint: string | null,
  correct_answers: string[],
  common_errors: [
    {
      id: string,
      pattern_label: string,
      regex: string,                   // JS-compatible, case-insensitive
      feedback: string                 // ~50–120 words, L1-aware
    }
  ],
  fallback_feedback: string            // ~30–80 words
}
```

Example entry:

```
{
  "id": "tr_anna_001",
  "type": "translation",
  "target_player": "anna",
  "level": "B2",
  "focus_categories": ["prepositions", "tenses"],
  "expected_difficulty": 3,
  "linked_question_ids": ["pp_b04", "tns_b09"],
  "tags": ["L1_calque", "preposition_omission"],
  "source_observation": "Anna missed 'wait for' in March 2026 stats",
  "created": "2026-04-30T12:00:00Z",
  "version": 1,
  "prompt_ru": "Мы ждём вас завтра.",
  "prompt_en_hint": null,
  "correct_answers": [
    "We are waiting for you tomorrow",
    "We're waiting for you tomorrow",
    "We are expecting you tomorrow",
    "We're expecting you tomorrow"
  ],
  "common_errors": [
    {
      "id": "wait_no_for",
      "pattern_label": "wait without 'for'",
      "regex": "\\bwait\\w*\\s+you(?!\\s+for)",
      "feedback": "Russian 'ждём вас' takes no preposition, but English 'wait' requires 'for'. Compare: 'expect you' (no preposition) vs 'wait for you' (with). Both are correct here."
    },
    {
      "id": "wait_no_ing",
      "pattern_label": "are/is/am + wait (no -ing)",
      "regex": "(are|is|am)\\s+wait\\b",
      "feedback": "After 'are/is/am', use the -ing form: 'waiting', not 'wait'."
    }
  ],
  "fallback_feedback": "That doesn't match the expected forms. The target uses either 'wait for' or 'expect'. Try restructuring around one of those verbs."
}
```

#### 6.1.2 `exercises_library/article_drill/{id}`

```
{
  ...common,
  sentence_template: string,           // sentence with {1}, {2} blanks
  blanks: [
    {
      position: number,
      correct: string,                 // "the" | "a" | "an" | "" (zero)
      distractors: string[],
      reasoning: string
    }
  ],
  context_note: string | null
}
```

#### 6.1.3 `exercises_library/particle_sort/{id}`

```
{
  ...common,
  sentence: string,                    // sentence with one ___ blank
  base_verb: string,
  correct_particles: string[],         // usually 1, sometimes 2
  distractor_particles: string[],
  meaning: string,
  reasoning: string
}
```

#### 6.1.4 `exercises_library/error_correction/{id}`

```
{
  ...common,
  incorrect_sentence: string,
  error_span: { start: number, end: number },
  correct_replacement: string,
  alt_correct_replacements: string[],
  error_type: string,                  // "preposition" | "article" | etc.
  reasoning: string,
  common_wrong_corrections: [          // optional
    { attempted: string, feedback: string }
  ]
}
```

#### 6.1.5 `exercises_library/russian_trap/{id}`

Same shape as `translation` plus one extra load-bearing field:

```
{
  ...translation_schema,
  calque_trap: string                  // the literal/word-for-word translation that's wrong
}
```

This makes the trap explicit so feedback can reference it: "The literal
translation '{calque_trap}' is what most Russian speakers say first, but
English uses {correct_form} because..."

### 6.2 New document: `exercises_library/_meta`

```
{
  total_exercises_per_type: { translation: N, article_drill: N, ... },
  coverage_by_player: {
    anna: { translation: N, ... },
    nicole: { ... },
    ernest: { ... },
    all: { ... }
  },
  last_authored: ISO timestamp,
  schema_version: number
}
```

CC's authoring push script maintains this doc; Coach tab reads it once per
session to show "X exercises available for you."

### 6.3 Extension to `players/{name}/exercises/{ts}`

Existing schema retained. New fields added:

```
{
  ...existing fields,
  submitted_answer: string,
  matched_pattern_id: string | null,    // which common_errors.id matched (first attempt)
  escalation_used: boolean,
  time_to_answer_ms: number,
  exercise_version: number,

  // s92 active-recall retry (only present when escalation_used is true).
  // First-attempt `correct` is preserved; retry is tracked separately.
  escalation_retry_submitted: string | null,
  escalation_retry_correct: boolean | null,
  escalation_retry_matched_pattern_id: string | null,
  escalation_retry_time_ms: number | null
}
```

Write-only-additive: older clients absent these fields; Firestore handles
missing fields gracefully.

### 6.4 New collection: `players/{name}/coach_sessions/{session_id}`

Stores full transcripts of any live-AI session (Free Write or Escalate on
the family path; Artem CC sessions also write here for parity). Persists
for cost auditing and content authoring feedback loop.

```
{
  session_id: string,                  // "{player}_{mode}_{ms}_{rand}"
  player: string,
  mode: string,                        // "free_write" | "escalate" | "cc_session"
  exercise_id: string | null,          // populated for escalate
  exercise_version: number | null,
  messages: [{ role: "system"|"user"|"assistant", content: string }],
  error_patterns_observed: string[],
  topics_covered: string[],            // for free_write/cc_session
  session_summary: string,
  tokens_used: { input: number, output: number } | null,  // null for cc_session
  model_used: string,
  created: ISO timestamp,
  ended: ISO timestamp
}
```

Worker emits metadata fields by asking Claude for a structured final
response when session is ended. CC produces the same structure at end of
Artem CC session and writes via Firebase MCP.

### 6.5 `players/{name}/coach_notes` (existing field, schema reconciled)

Already exists and initialised for all 5 players post-S87. Schema reconciled
with the existing CC SKILL.md:

```
{
  ...existing player fields,
  coach_notes: {
    weak_patterns: string[],            // durable error patterns
    recent_observations: string[],      // last ~5 session-level notes
    engagement_notes: string[],         // preferences (length, format, tone)
    last_updated: ISO timestamp,
    update_count: number
  }
}
```

`coach_notes.weak_patterns` is injected into the system prompt of every
Free Write session (§7.4) and into CC's session prompts for Artem. After
each session, durable observations from `error_patterns_observed` (in
`coach_sessions`) are merged into `weak_patterns` (cap at 8, sort by
frequency × recency; older items age out).

`recent_observations` rolls forward with the latest 5 session-level notes.
`engagement_notes` updates rarely — only when a session reveals a new
durable preference.

This schema reflects the working schema in `tools/update_coach_notes.js`.

---

## 7. Cloudflare Worker

### 7.1 Repo location

`worker/` subfolder in `english-quiz` repo:

- `worker/index.js` — Worker source (~80 lines)
- `worker/wrangler.toml` — Cloudflare deployment config (no secrets)
- `worker/README.md` — deployment instructions
- `worker/.dev.vars.example` — local dev env vars template (no real key)

Actual `.dev.vars` is gitignored; production secret lives in Cloudflare
dashboard.

### 7.2 Request/response contract

PWA POSTs to `https://english-quiz-coach.{cf-account}.workers.dev/v1/messages`.

**Request body**:

```
{
  "mode": "free_write" | "escalate",
  "model": "claude-sonnet-4-5" | "claude-opus-4-5",
  "messages": [{ "role": "user", "content": "..." }],
  "context": {
    "player": "anna",
    "level": "B2",
    "L1": "Russian",
    "focus_categories": ["prepositions", "collocations"],
    "coach_notes": {
      "weak_patterns": [...],
      "engagement_notes": [...]
    },
    "exercise": {                       // only for mode: "escalate"
      "id": "tr_anna_001",
      "prompt": "Translate: ...",
      "expected_answers": [...],
      "submitted": "We waiting you tomorrow",
      "pre_generated_feedback": "..."
    }
  },
  "session_id": "anna_free_1714485000_abc",
  "is_session_end": false
}
```

**Response body** (success):

```
{
  "ok": true,
  "content": "...",
  "tokens_used": { "input": 1200, "output": 450 },
  "model_used": "claude-sonnet-4-5-2026XXXX",
  "session_metadata": {
    "error_patterns_observed": [...],
    "topics_covered": [...],
    "session_summary": "..."
  }
}
```

**Response body** (error):

```
{
  "ok": false,
  "error_code": "API_402" | "API_5XX" | "WORKER_VALIDATION" | "WORKER_TIMEOUT",
  "error_message": "Human-readable string",
  "retriable": boolean
}
```

### 7.3 Validation rules

In order:

1. **Origin check**: `Origin` header must be
   `https://artemseliverstov.github.io`. Reject 403 otherwise.
2. **Body size**: total request body ≤ 50 KB. Reject 413 if larger.
3. **Mode whitelist**: `mode` must be `"free_write"` or `"escalate"`.
   Reject 400.
4. **Model whitelist**: `model` must be in env-configured list. Reject 400.
5. **Content sanity**: `messages` must be a non-empty array.
   `context.player` must be one of `["anna", "nicole", "ernest"]`. Reject
   400 otherwise. (Artem doesn't go through the Worker.)

### 7.4 System prompts

The Worker constructs the system prompt server-side based on `mode` and
`context`. The PWA never sends a system prompt directly. Critical control
surface.

#### 7.4.1 `mode: "free_write"`

```
You are an English language coach helping {player_name}, a Russian-speaking
learner at CEFR level {level}. They are practising free writing — they will
write text in English and you will help them improve.

Your role:
- Read what they write carefully
- Identify the most important grammatical or lexical issues (focus: clarity
  and naturalness, not style preferences)
- Give specific, actionable feedback in plain English with brief Russian
  glosses when a Russian comparison clarifies the rule
- Be encouraging but not effusive — focus on what's wrong and how to fix it
- Keep individual responses to ~150–250 words unless the player explicitly
  asks for more depth
- Suggest one concrete revision they could make, not a rewritten paragraph

About this learner:
- L1: Russian
- Level: {level}
- Focus categories: {focus_categories}
- Persistent weak patterns from previous sessions:
  {coach_notes.weak_patterns bulleted}
- Engagement preferences:
  {coach_notes.engagement_notes bulleted}

Tone: warm, direct, professional. Russian glosses are useful when a
structural contrast helps. Avoid filler praise.

If the player asks something off-topic from their writing, briefly redirect
to the writing task — but if they have a genuine grammar question about
something they wrote, engage fully.

{if is_session_end:}
Append a JSON block at the very end of your message wrapped in
<session_meta>...</session_meta> tags containing:
{
  "error_patterns_observed": ["pattern_id_1", ...],
  "topics_covered": ["topic_1", ...],
  "session_summary": "Two-sentence recap."
}
Use snake_case pattern IDs, e.g. "preposition_omission",
"tense_simplification", "article_zero_for_definite".
```

#### 7.4.2 `mode: "escalate"`

```
You are an English language coach providing additional explanation to
{player_name}, a Russian-speaking learner at CEFR level {level}.

They just attempted this exercise:
- Prompt: "{exercise.prompt}"
- Expected answers: {exercise.expected_answers}
- They submitted: "{exercise.submitted}"

The system already gave them this feedback:
"{exercise.pre_generated_feedback}"

The player tapped "explain more" because the standard feedback wasn't
sufficient. Explain in more depth and specifically address what they wrote.

Constraints:
- Single response, no follow-up questions
- 200–400 words
- Reference their actual submission verbatim at least once
- If their answer was partially right, acknowledge what was right before
  addressing what was wrong
- Provide one alternative example sentence using the correct pattern, with
  a Russian gloss if structurally relevant
- End with one sentence summarizing the takeaway

About this learner:
- L1: Russian
- Level: {level}
- Persistent weak patterns:
  {coach_notes.weak_patterns bulleted}

Tone: warm, direct, slightly more pedagogical than free_write mode.

Append a JSON block at the very end wrapped in
<session_meta>...</session_meta>:
{
  "error_patterns_observed": ["pattern_id"],
  "session_summary": "One sentence on what the underlying issue was."
}
```

### 7.5 Session metadata extraction

The Worker parses `<session_meta>...</session_meta>` from Claude's response,
extracts the JSON, returns it in the structured `session_metadata` field.
Worker also strips the `<session_meta>` block from `content` so PWA can
render `content` directly.

Malformed/absent JSON: `session_metadata` is `null`, PWA proceeds without
it.

### 7.6 CORS configuration

```
Access-Control-Allow-Origin: https://artemseliverstov.github.io
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
Access-Control-Max-Age: 86400
```

Worker responds to `OPTIONS` preflight with these headers and 204.

### 7.7 Secret configuration

In Cloudflare dashboard → Workers & Pages → english-quiz-coach → Settings →
Variables and Secrets:

- `ANTHROPIC_API_KEY` (Secret, encrypted) — dedicated key from fresh
  `console.anthropic.com` account
- `ALLOWED_MODELS` (Plain text) — comma-separated, e.g.
  `"claude-sonnet-4-5,claude-opus-4-5"`. Updateable without redeploying.
- `ALLOWED_ORIGIN` (Plain text) — `"https://artemseliverstov.github.io"`

### 7.8 Local development

Worker tested locally via `wrangler dev`. Local `.dev.vars` (gitignored)
contains test API key. CC verifies end-to-end via curl:

```bash
curl -X POST https://english-quiz-coach.{account}.workers.dev/v1/messages \
  -H "Content-Type: application/json" \
  -H "Origin: https://artemseliverstov.github.io" \
  -d '{
    "mode": "free_write",
    "model": "claude-sonnet-4-5",
    "messages": [{"role": "user", "content": "Yesterday I go to shop."}],
    "context": {"player": "anna", "level": "B2", "L1": "Russian", ...}
  }'
```

Acceptance: curl returns valid JSON with `ok: true` and meaningful
`content`.

---

## 8. Coach tab UI

### 8.1 UX principle: unified chat-style rendering

All coach interactions — pre-generated feedback, Free Write, Escalate —
render in a unified chat-style UI. Player sees a conversation: they speak,
"Coach" responds. Whether the Coach response was rendered locally from a
pre-generated exercise's `feedback` field or fetched from the Worker is
implementation detail invisible to the player.

This matters because:
- Escalation is a natural follow-up affordance, not a modal interruption
- Free Write feels continuous with everything else
- The mental model is simple: "talk to Coach"

Implementation: shared message-rendering component used by all three paths.
Pre-generated path constructs synthetic "assistant" messages from the
exercise data; live path renders real assistant responses from the Worker.

### 8.2 Tab structure

Fourth tab in the existing tab bar: **🎯 Coach** (after Quiz, Stats,
Exercises).

Layout (top to bottom):

```
┌─────────────────────────────────────┐
│ 🎯 Coach — {player name}            │
├─────────────────────────────────────┤
│ Last session: 7/10 · Translation    │
│ Top weak spot: Prepositions         │
├─────────────────────────────────────┤
│ Pick what to practise:              │
│ [ Translation Drill ] [ Free Write ]│
│ [ Articles ] [ Particles ]          │
│ [ Error Correction ] [ Russian Trap]│
├─────────────────────────────────────┤
│ (chat area renders below once       │
│  exercise type is picked)           │
└─────────────────────────────────────┘
```

Disabled exercise types (no library content yet for this player) are
greyed out with a count: "Articles (0 available)".

### 8.3 Pre-generated exercise flow

1. Player taps an exercise type (e.g. Translation Drill)
2. Coach tab queries Firestore: `exercises_library/translation` filtered
   by `target_player in ["anna", "all"]` and ordered by lowest seen_count
3. Pick first exercise, render as a chat message: "**Translate this:** Мы
   ждём вас завтра."
4. Player types answer in input box, taps send
5. Player message renders below
6. Local matching:
   - Normalize submitted: lowercase, trim, collapse whitespace, expand
     contractions (§8.4)
   - Compare against `correct_answers` (also normalized)
   - If match → render correct feedback
   - If no match → run each `common_errors[].regex` against original
     submission, in order; first match → render that pattern's feedback
   - If still no match → render `fallback_feedback`
7. Two buttons: **[Got it, next →]** and **[Hmm, explain more 🤔]**
8. **[Got it, next →]** writes result to `players/{name}/exercises/{ts}`
   and loads next exercise
9. **[Hmm, explain more 🤔]** triggers escalation flow (§8.5)

### 8.4 Fuzzy matching algorithm

Both submitted answer and each entry of `correct_answers` are normalized
via:

```js
function normalize(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\bwe're\b/g, 'we are')
    .replace(/\bi'm\b/g, 'i am')
    .replace(/\byou're\b/g, 'you are')
    .replace(/\bthey're\b/g, 'they are')
    .replace(/\bhe's\b/g, 'he is')
    .replace(/\bshe's\b/g, 'she is')
    .replace(/\bit's\b/g, 'it is')
    .replace(/\bdon't\b/g, 'do not')
    .replace(/\bdoesn't\b/g, 'does not')
    .replace(/\bdidn't\b/g, 'did not')
    .replace(/\bwon't\b/g, 'will not')
    .replace(/\bcan't\b/g, 'can not')
    .replace(/\bisn't\b/g, 'is not')
    .replace(/\baren't\b/g, 'are not')
    .replace(/[.!?,;:]+$/, '');
}

function isMatch(submitted, correctAnswers) {
  const norm = normalize(submitted);
  return correctAnswers.some(c => normalize(c) === norm);
}
```

`common_errors[].regex` runs against the original submission (not
normalized). Default expectation: regexes use case-insensitive flag.

Future iteration: Levenshtein distance ≤ 2 to absorb single-character
typos. Defer until evidence shows typos cause false negatives.

### 8.5 Escalate flow (with active-recall retry as of s92)

1. Player taps **[🤔 Hmm, explain more]** after pre-generated wrong-answer feedback
2. Coach tab shows typing indicator
3. POST to Worker with `mode: "escalate"`, full context per §7.2
4. Worker response renders as a follow-up "assistant" message in the same chat thread
5. **Immediately after the explanation**, the chat appends "Попробуй ещё раз / Try again" with the original Russian prompt; the input row reappears, routed to the retry handler.
6. Player submits a retry. The retry is scored against the same `correct_answers` and `common_errors` as the first attempt. Feedback renders inline (correct → "✓ Got it!"; wrong → pattern feedback or fallback + one canonical correct form).
7. Retry result is recorded on the same per-item row (§6.3): `escalation_retry_submitted`, `escalation_retry_correct`, `escalation_retry_matched_pattern_id`, `escalation_retry_time_ms`. **First-attempt `correct` is NOT overwritten** — first-attempt accuracy stays trackable; retry is a separate signal.
8. Action row collapses to **[Got it — next →]**. No second escalation, no second retry.
9. Worker session is logged to `players/{name}/coach_sessions/{session_id}` with `mode: "escalate"`.

Why the retry: in s91 Anna escalated on `tr_anna_b01` ("waiting for") and got a thorough Russian explanation, then on the very next run wrote "I'm waiting **a** friend" again — the rule didn't lock in without an immediate active-recall step.

The session-end card (§13.1) reports retried items: "{n} item(s) got the deep explanation, {m} correct on retry."

If Worker fails on the deep-explanation step: inline error in the chat thread; the retry isn't offered (we don't ask for a retry without an explanation in front of it). Player gets [Got it — next] only.

### 8.6 Free Write flow

1. Player taps **[Free Write]** in the picker
2. Coach tab renders a starter prompt as first "assistant" message,
   selected from a small bundled list of starters (e.g. "Tell me about
   your day.", "What are you working on this week?"). Bundled in PWA, not
   from Firestore.
3. Player writes response, taps send
4. POST to Worker with `mode: "free_write"`, `is_session_end: false`, full
   message history, context including `coach_notes`
5. Worker response renders as next "assistant" message
6. Conversation continues. Each turn POSTs the **full message array**
   (Worker is stateless). Soft cap: 20 turns. After 20 turns, UI shows:
   "We've covered a lot — wrap up?" with **[End session]** button.
7. **[End session]** button always available below latest message
8. On End session: final POST with `is_session_end: true` so Claude emits
   session metadata
9. Session logged to `coach_sessions/`, `coach_notes` updated by merging
   `error_patterns_observed` into `weak_patterns`

### 8.7 Stats card

Top of Coach tab, always visible (when data exists):

```
Last session: {score}/{total} · {exercise_type_name}
Top weak spot: {category from existing player stats}
{n} exercises available for you
```

`{n}` is read from `exercises_library/_meta.coverage_by_player[player]`
summed across types.

### 8.8 Failure modes and PWA behaviour

| Failure | PWA behaviour |
|---|---|
| API balance exhausted (`API_402`) | Free Write & Escalate buttons hidden globally for this session. Pre-generated still works. Banner: "Live Coach unavailable — using offline mode." |
| Worker 5xx | Single retry. If retry fails: inline error in chat thread, exercise can still be completed without escalation. |
| Worker validation rejection | Should not happen in production; if it does, log to console and show generic "Something went wrong" — bug to fix. |
| Network offline | Pre-generated continues (cached library + offline scoring). Free Write disabled with banner. |
| Firestore unreachable | Pre-generated falls back to small bundled-in-PWA library (~5 per type). Results queued in localStorage, synced when Firestore returns. |
| Worker URL not configured | Live AI buttons hidden. Pre-generated only. |

---

## 9. SKILL.md updates required

The existing `skills/exercise-session/SKILL.md` is mostly correct but needs
specific edits to align with this Phase 2 design. CC executes these edits
as part of Tier 1 (§14.1).

### 9.1 Path-specific behaviour section (new)

Add a section near the top (after "Reads required before starting") titled
**"Path-specific behaviour"**. Two sub-sections:

**Family path (Anna, Nicole, Ernest)** — the existing 6-step protocol
applies. Pre-generated content via library (post-Phase 2C); live AI
escalation available; bounded scoring per item.

**Artem path** — live and conversational only. No library reuse. CC
generates exercises on the fly using the §10 authoring quality bar
inverted (CC authors during the session, not in advance). Logging schema
identical (writes to `players/artem/exercises/{ts}` and
`players/artem/coach_sessions/`) but `mode` field on coach_sessions is
`"cc_session"`. No `tokens_used` (Max-backed, not metered).

### 9.2 Coach tab path note (new)

Add a brief note in the existing "When not to run" section:

> Post-Phase 2C: family members (Anna, Nicole, Ernest) typically use the
> Coach tab in the PWA directly, which handles sessions natively. This
> skill remains as a fallback for cases when (a) Coach tab is broken, (b)
> Artem wants to run a session for a family member via CC, or (c) Artem
> runs his own session. In normal operation post-2C, the family path of
> this skill is rarely invoked.

### 9.3 Logging strategy decision tree (rewrite)

The current "Live-log decision" block under Step 3 mixes three concerns
flatly. Replace with:

> ### Logging strategy
>
> Use single end-of-session logging via `tools/log_exercise.js` (Step 6).
>
> Per-item live logging (`?exupd=` deeplinks → `exercise_active`
> collection) is supported by the PWA but currently unused via CC.
> Reserve for future Phase 2C work if an Artem-path live-log proves
> useful.
>
> claude.ai chat fallback (`?exlog=` deeplink) is now legacy — only
> relevant if CC is unavailable. Phase 2C provides a Coach tab that
> handles family logging natively.

### 9.4 Coach_notes schema

The skill already references `weak_patterns`, `recent_observations`,
`engagement_notes` — that schema is correct and is reflected in §6.5. No
change to the skill needed; just confirm the schema in §6.5 stays in sync
with `tools/update_coach_notes.js`.

### 9.5 Update prompt

CC uses this exact prompt to update SKILL.md as part of Tier 1:

> Read references/phase2-coach-tab.md §9. Apply edits 9.1, 9.2, and 9.3 to
> skills/exercise-session/SKILL.md. Edit 9.4 is a no-op (already correct).
> Verify the updated SKILL.md is coherent end-to-end. Commit with message
> "skill: align with Phase 2 design (path split, Coach tab note, logging
> tree)."

---

## 10. Authoring workflow (CC-driven)

Routine content authoring happens entirely in CC sessions. claude.ai chat
is not involved.

**Session shape**:
1. Artem opens CC on laptop, points it at the repo
2. Artem says: "Let's author 15 translation exercises for Anna targeting
   prepositions"
3. CC reads `references/family-profiles.md` and recent `coach_notes.anna`
   for context
4. CC drafts exercise JSON conforming to schema in §6.1.1
5. Artem reviews in CC; pushes back or approves per-exercise
6. Once batch is ready, CC writes JSON to `library_drafts/`
7. CC runs `tools/push_library.js` (CC builds this script as part of 2B):
   - Reads draft JSON
   - For each entry: write to `exercises_library/{type}/{id}` via Firebase
     MCP
   - Update `exercises_library/_meta` totals
   - Commit the draft JSON to git for audit trail
8. CC verifies via Firebase MCP that all entries are present and well-formed

**Authoring quality bar**:
- Every translation exercise has ≥3 `correct_answers` variants
- Every translation exercise has ≥2 `common_errors` patterns covering known
  Russian L1 traps for the focus_categories
- `linked_question_ids` populated when exercise targets a pattern already
  covered in the quiz
- `source_observation` populated when authoring is triggered by a specific
  data point

**Maintenance commitment**: ~10 new exercises per family member per month,
targeted at observed patterns from prior month's `coach_sessions` and quiz
stats. Ongoing work, not one-time. The escalate-to-AI button reduces
urgency (every exercise has unbounded depth available).

---

## 11. Cost model

**One-time setup**: $0 (Cloudflare free tier, console.anthropic.com sign-up
free).

**Recurring**: prepaid $15 on the API account, refilled when balance
approaches zero.

**Worked example** (Sonnet for Free Write at family scale):
- Avg Free Write session: ~15 turns × ~1K tokens = ~15K tokens
- Sonnet pricing (~Apr 2026): roughly $3/M input + $15/M output
- ~70/30 input/output: ~$0.10–0.15/session
- Family at peak adoption: 12 sessions/month → $1.20–1.80/month
- Escalations on Opus: ~$0.05 × ~10/month = $0.50/month

**$15 prepaid runway**: 6–10 months at peak adoption. Worst case (everyone
uses it daily, Opus everywhere): still 1–2 months. Prepaid balance is the
hard ceiling.

**Artem's CC path**: $0 ongoing (Max-backed). Not metered.

---

## 12. Security posture

**Protected against**:
- Casual abuse of Worker URL: CORS limits browser-based calls to legitimate
  origin
- Runaway PWA loops: prepaid balance + workspace spend cap
- API key exposure: never leaves Cloudflare's secret store
- Cross-player data leakage in PWA: existing PIN-gated context

**Not protected against**:
- Worker URL secrecy: it's in the PWA bundle. CORS protects browsers; curl
  ignores CORS. Mitigation: prepaid balance ceiling.
- Firestore readable by anyone with project ID: open-write rules.
  `coach_sessions` contains personal Free Write content. Same posture as
  quiz stats. Mitigation: Anonymous Auth (Phase 3D parallel work).
- Compromised family device: PWA in hostile browser could burn API credit.
  Mitigation: prepaid balance.

**Not in threat model**: targeted attacks. Family English quiz; threat
model is "casual mistakes, accidental loops, URL discovery by random
people."

---

## 13. Build sequence

Four phases. Each ends with a working, deployable state. CC executes all
four; no claude.ai chat dependency.

### 13.1 Phase 2B — Coach tab MVP (pre-generated only)

**Goal**: Anna can do Translation Drill exercises with rich feedback. No
Worker, no API account, no Free Write, no Escalate.

**Build**:
- Add Coach tab to PWA tab bar
- Build chat-style message rendering shell (reused in 2C)
- Build pre-generated exercise scoring engine (normalize, match, regex,
  fallback)
- Read from `exercises_library/translation` via `fsList` helpers
- Write results to extended `players/{name}/exercises/{ts}` with new
  fields
- Stats card at top of Coach tab
- Exercise type picker (Translation enabled, others greyed out)
- Author and push initial library: ~15 translation exercises for Anna via
  CC + Firebase MCP (§10)
- Update `exercises_library/_meta`
- Service worker version bump
- Pre-deploy checklist
- Deploy

**Acceptance**:
- Anna opens Coach tab, completes 5 translation exercises in a row, sees
  rich feedback per exercise, sees her score in Firestore
- Stats card shows last session correctly
- All 7 build-quality checks pass per session prompt

### 13.2 Phase 2C — Worker + live AI

**Goal**: Free Write and Escalate work end-to-end for the family.

**Manual prerequisite (Artem, ~10 min)**: Sign up for
`console.anthropic.com` on a fresh account. Load $15 credit. Set workspace
spend limit to $15. Create a key named `english-quiz-coach-worker`. Hand
to CC for Cloudflare Secret setup.

**Build**:
- `worker/index.js` per §7, ~80 lines
- `worker/wrangler.toml`
- Set up Cloudflare account
- Deploy Worker via `wrangler deploy`
- Configure secrets in Cloudflare dashboard
- Test via curl per §7.8
- PWA: add Worker URL config, `[Free Write]` button, Escalate button on
  every pre-generated feedback
- PWA: implement Free Write conversation loop
- PWA: implement Escalate one-shot call
- PWA: implement coach_sessions logging
- PWA: implement coach_notes update on session end
- Failure-mode handling per §8.8
- Service worker version bump
- Pre-deploy checklist
- Deploy

**Acceptance**:
- Anna completes a Free Write session of 5+ turns, ends it, sees
  conversation logged to `coach_sessions/`, sees `weak_patterns` updated
- Anna taps Escalate after a translation feedback, gets richer explanation,
  sees escalation logged with `escalation_used: true`
- Worker rejects malformed requests
- API balance observable declining in Anthropic console

### 13.3 Phase 2D — Full coverage

**Goal**: All 5 exercise types live, all 3 family players supported.

Iterative. Each iteration:
- Pick exercise type and player
- Author ~10–15 exercises in CC (§10)
- Push to Firestore
- Update `_meta`
- Family member uses it; observe; iterate

**Acceptance** (when to stop iterating):
- Each of Anna, Nicole, Ernest has ≥40 exercises across ≥3 types
- Anna and Nicole have logged ≥3 Coach tab sessions each over 2-week period
  without falling back to claude.ai chat
- Live API costs within $5–15/month band

### 13.4 Phase 3 (unchanged from PHASE2_PLAN.md predecessor)

3A userMemories cleanup, 3B RTDB sunset (after 2026-05-28), 3C delete
MIGRATION_HANDOFF.md, 3D D:\Claude\English\ cleanup. Triggered when 2D
acceptance is met.

---

## 14. Parallel work tiers

Content authoring and quality audits alongside the build sequence. CC
follows the autonomy mandate in §1: pick the next unstarted item from the
lowest tier with unstarted work.

### 14.1 Tier 1 — Required for Phase 2B to ship (~3–4 CC sessions)

| Item | Estimate | Notes |
|---|---|---|
| Update `skills/exercise-session/SKILL.md` per §9 | 30 min | Edits 9.1, 9.2, 9.3. Run before any exercise sessions in CC. |
| Author `gi_b04` (missing question) | 30 min | Integrity fix. |
| Anna's 15 translation exercises | ~2 sessions | Required for Coach tab MVP. Schema §6.1.1. |
| Word Formation input (~9 questions) | 1 session | Currently 0% input share — only category at literal zero. |

### 14.2 Tier 2 — In spare CC sessions during Phase 2B/2C window

| Item | Estimate | Notes |
|---|---|---|
| Used To input (~7 questions) | 1 session | 6.3% input share — highest priority among gap-fill. |
| B2 Idioms (~15 questions) | 1–2 sessions | Fills genuine level hole; can later seed Russian Trap exercises. |
| PV Phase 2 Batch 1 (~50 questions, prefix `pv_p2`) | 3 sessions | Per locks PV1/PV2/PV3 in §4. CC picks type mix per PV. |

### 14.3 Tier 3 — Data-driven; starts after 2D acceptance OR ~10 Artem CC sessions

| Item | Estimate | Notes |
|---|---|---|
| C1 expansion (Reported Speech, Relative Clauses, G&I, Collocations) (~60 q) | 3–4 sessions | Authored against observed weakness from CC + family Coach data. |
| Article intervention (~95 q across 3 phases) | 3–4 sessions | Driven by Artem's Coach session patterns. Static diagnostic superseded by live data. |
| PV Phase 2 Batch 2 + meaning expansion (~80 q) | 4–5 sessions | Wait until Batch 1 lands and observe whether PV deficit shifts. |

### 14.4 Tier 4 — Background fill-in (opt-in only)

CC does **not** pick Tier 4 work autonomously. Tier 4 runs only when:
- Artem explicitly requests it ("do an audit session"), OR
- Every item in Tiers 1–3 is genuinely complete

| Item | Estimate | Notes |
|---|---|---|
| s78 input hint/q redundancy audit | 4–6 sessions | 406 input questions to review. Polish, not correctness. |
| `exp` contrastive rewrite (~585 fields) | 6–10 sessions | Polish. `exp_rewriter` tool already exists. |

### 14.5 Tier ordering rule

CC picks the next unstarted item by:
1. Build sequence (§13) takes precedence over parallel work when blocked
   on a required deliverable
2. Within parallel work: Tier 1 fully exhausted before Tier 2; Tier 2 fully
   exhausted before Tier 3; Tier 4 never picked autonomously
3. Within a tier, items can be done in any order

---

## 15. Open items (in-flight decisions for CC)

Decided at build time with current information. CC decides during 2B/2C
without coming back to chat.

- **Exact model strings**: confirm `claude-sonnet-4-5` and `claude-opus-4-5`
  are current (or update to whatever's current at build time).
- **Cloudflare Worker URL**: assigned by Cloudflare on first deploy; record
  in `worker/README.md` and PWA config.
- **Starter prompt list for Free Write**: 5–8 prompts, bundled in PWA. CC
  drafts based on player profiles.
- **Initial 15 translation exercises for Anna**: CC authors during 2B based
  on `family-profiles.md` and recent stats.
- **`coach_notes.weak_patterns` aging policy**: cap at 8, sort by frequency
  × recency. Exact aging weight (linear/exponential) — CC picks default.

---

## 16. Acceptance: full Phase 2 done when

- [ ] SKILL.md updated per §9 (Tier 1 complete)
- [ ] Anna has used Coach tab independently ≥5 times over 2 weeks without
      falling back to claude.ai chat
- [ ] Nicole has used Coach tab ≥3 times
- [ ] Ernest has used Coach tab ≥3 times
- [ ] All 5 pre-generated exercise types have ≥10 exercises per type for at
      least one family member
- [ ] Free Write used ≥5 times across the family with conversations in
      `coach_sessions`
- [ ] At least 3 escalations triggered with logged transcripts
- [ ] API spend within $5–15/month range
- [ ] No claude.ai chat involvement in routine content authoring for ≥2
      weeks
- [ ] CC handles all stats reviews and content authoring for Artem's path

When checked, Phase 2 ships and Phase 3 cleanup tasks (3A–3D) become next
focus.

---

## 17. Status log

Append-only. CC adds an entry at the end of every session that touches
Phase 2 work. Each entry: date, what was done, what was learned, what
changed in the doc.

---

### 2026-04-30 — Doc created

- Initial design + parallel work tiers + SKILL.md update spec consolidated
  into this single doc by claude.ai chat session
- Predecessor `PHASE2_PLAN.md` superseded; can be deleted
- All locked decisions in §4 captured; rejected alternatives in §5 noted
- Open items in §15 pending in-flight resolution

---

### 2026-04-30 — Tier 1 sweep (CC session)

**Done**:
- §9 SKILL.md edits applied: 9.1 path-specific behaviour section added,
  9.2 Coach tab note added under "When not to run", 9.3 logging strategy
  decision tree replaced. 9.4 was no-op (schema already aligned). Committed
  as `ad8b7e3` per §9.5.
- `gi_b04` integrity fix: authored as `type:'input'`, "practise + gerund"
  with bracketed complement format. Initial draft used "enjoy" but
  collided with `gi_c27` stem — switched to "practise" (no existing
  coverage in `gi_` series).
- Anna's 15 translation exercises drafted to
  `library_drafts/anna_translation_001-015.json`. JSON validates and meets
  §10 quality bar (≥3 correct_answers, ≥2 common_errors per exercise,
  regex compiles). Distribution diverged from §6.1.1's preposition-heavy
  example: only 4 prepositions, with the rest hitting Anna's actual
  measured weak_patterns (Grammar mechanics 44%, Vocabulary production
  37%, Collocations 22%, Everyday English idioms). The example in §6.1.1
  remains illustrative only.
- Word Formation input batch: 9 questions added as `wf_41`–`wf_49` with
  `type:'input'` (lifts the category from 0% input share). Used the
  `(BASE) ___` bracket convention by analogy with the G&I no-hint format.
  Fresh word families (develop, educate, inform, produce, govern,
  tradition, expect, understand, convince) — no overlap with existing
  `wf_01`–`wf_40` wordform set.

**Learned / doc-impacting**:
- Coach_notes for Anna show prepositions are NO LONGER the dominant L1
  weakness (70%, n=20). The profile-level "prioritize preposition-focused
  translation" guidance (`family-profiles.md`) still names prepositions
  among Anna's L1 issues but coach_notes is the live signal. Per CLAUDE.md
  memory model, coach_notes wins for current targeting; no doc edit
  needed here, but future Anna translation batches should similarly
  re-check current state before authoring.
- §6.1.1 example uses prepositions; left as-is (illustrative).
- The existing `wordform` type's render path expects `q.base` (line 3988
  of `index.html`) but no `wf_*` question carries a `base` field. The 9
  new input-type questions sidestep this by encoding the base in the stem
  via `(BASE) ___` and using the standard input renderer. Pre-existing
  wordform-type quirk noted but NOT touched (out of scope for this
  session).
- `library_drafts/` directory created — first staging use. `tools/push_library.js`
  still to be built in Phase 2B per §13.1; drafts will sit until then.

**Doc patches in this session**: this status entry only. No §4 (locked
decisions) reopened.

**Pre-deploy**: NOT pushed. `index.html` and `sw.js` versions unchanged
(version bump deferred to deploy session). The SKILL.md commit is local-only.

---

### 2026-04-30 — Phase 2B kickoff (CC session, continued)

**Done**:
- Built `tools/push_library.js` — schema validation (common + per-type +
  §10 quality bar + regex compile), idempotent meta updates, --dry-run.
- Firestore security rules updated and checked into the repo. Added
  permissive blocks for `exercises_library/{document=**}` and
  `players/{name}/coach_sessions/{sessionId}`. Created top-level
  `firebase.json`, `firestore.rules`, `.firebaserc` so future rules
  changes go through `firebase deploy --only firestore:rules` (not the
  console).
- Pushed Anna's 15 translation exercises live to
  `exercises_library/translation/items/tr_anna_001` … `tr_anna_015`.
  `exercises_library/_meta` initialised with totals + per-player
  coverage. Round-trip readback verified.
- Phase 2C prereq partially started: Artem loaded $5 prepaid (not $15)
  on a fresh console.anthropic.com account as a pilot test. Workspace
  spend cap should be set to $5 to match the smaller balance — TBD.

**Doc-impacting**:
- §6.1 schema mentions paths like `exercises_library/{type}/{exercise_id}`.
  Firestore requires alternating collection/doc segments, so the
  implementation uses `exercises_library/{type}/items/{exercise_id}`
  (with `items` as the per-type subcollection name). The `{type}` doc
  is currently a placeholder; we may add per-type meta to it later. No
  doc edit — implementation note captured here.
- §4 Q4 ("$15 prepaid + $15 workspace spend cap"): pilot relaxed to $5
  for testing. Lock not formally reopened — top up to $15 when the
  pilot validates the hybrid path.

**Open items now actionable**:
- §13.1 remaining 2B items: Coach tab UI in `index.html` (chat shell,
  scoring engine, exercise type picker, stats card), service worker
  bump, deploy. Library data exists; UI build can begin.
- §13.2 Phase 2C: complete Anthropic key creation + Cloudflare Worker
  build once Artem confirms prereq is finalised.

---

### 2026-04-30 — s90r2 + B1 content swap (CC session, continued)

**Done**:
- Engine fixes shipped as `v20260430-s90r2`: per-item Firestore upsert
  (`partial: true` on each answer, `partial: false` on finish, same doc id
  reused so partials survive a closed tab) + article-tolerant
  `coachNormalize` (strips `a/an/the` before equality comparison).
- Anna's first real Coach session (`players/anna/exercises/1777566265897`)
  surfaced: raw 1/15 with ~7 false negatives from typos and article drops;
  she engaged through all 15 (avg ~80s/item, max 154s); 2 patterns fired
  correctly (`clean_for_vacuum`, `on_next_week`).
- Anna's `coach_notes` updated: session log appended; engagement_notes
  notes "v1 B2 prompts too hard at MVP — content should drop to shorter
  B1 prompts and ignore article scoring".
- Content swap: deleted v1 (`tr_anna_001`–`tr_anna_015`) from Firestore;
  pushed v2 (`tr_anna_b01`–`tr_anna_b10`, 10 short B1 prompts, single-target,
  3–5 RU words / 3–6 EN words). v1 JSON kept in `library_drafts/` for git
  history. `_meta.coverage_by_player.anna.translation = 10`.

**v2 design rules** (worth pulling into `references/exercise-types.md` if
this proves stable):
- Single grammatical target per prompt (one preposition, one verb, one
  collocation — never compound).
- Russian prompt ≤ 5 words; expected English ≤ 6 words.
- Avoid hard-to-spell vocabulary (neighbour, comfortable, daughter,
  expectations) so typo surface stays low.
- Article variants don't need to be enumerated in `correct_answers` —
  s90r2 normalize() strips them.
- Pattern regexes target 1–2 known L1 traps per exercise; broad `wait`-
  style catch-all regexes proved over-specific in v1, so v2 uses tighter
  alternation lists.

**Open / deferred**:
- §5 design — should v2 design rules above be promoted into
  `exercise-types.md`? Defer to next stats review after Anna runs the v2
  set.
- Levenshtein typo tolerance still not shipped — wait and see if v2's
  shorter prompts make it unnecessary.
- The 3 other exercise types (article_drill / particle_sort /
  error_correction / russian_trap) stay greyed in the picker; library
  authoring for those is Tier 2 work.

---

### 2026-05-01 — Phase 2C shipped (Free Write + Escalate)

**Done — `v20260501-s91`** (the rest of §13.2):
- Cloudflare Worker built and deployed yesterday at
  `https://english-quiz-coach.artem2030.workers.dev` per §7. ANTHROPIC_API_KEY
  set via `wrangler secret put`. Worker validation chain (CORS, origin check,
  body size, mode/model whitelist, player whitelist) end-to-end-tested against
  the real Anthropic API: free_write (~$0.005) and escalate (~$0.022) both
  return coherent feedback with `<session_meta>` extraction working as designed.
- PWA hookup in `index.html`: Free Write button enabled, multi-turn chat
  loop, "✓ End session" with `is_session_end:true` finalisation, soft 20-turn
  cap. Escalate button on every wrong-answer translation feedback (one-shot,
  per §8.5). Failure handling per §8.8 — API_402 disables live AI for the
  tab session, 5xx gets one retry with backoff, offline state flips
  availability, missing Worker URL hides live AI.
- `coach_sessions/{session_id}` writes per §6.4 for both Free Write and
  Escalate. Free Write end-of-session merges `error_patterns_observed` into
  `coach_notes.weak_patterns` with a `(coach_session)` tag and FIFO cap at 8.
- Coach reply rendering: minimal Markdown→HTML so the chat shell renders
  Sonnet/Opus output (bold, bullets, inline code, blockquotes) legibly.
- Smoke-tested locally with a mocked Worker (CORS blocks `localhost`); test
  artefacts cleaned up.

**Updated decisions (deviations from §7 captured at build time)**:
- Model strings updated per §15: `claude-sonnet-4-6` for Free Write,
  `claude-opus-4-7` for Escalate. The §7.4 examples used `4-5` strings
  pre-current; resolved during the Worker build per Anthropic guidance.
- §4 Q4 still relaxed to `$5` prepaid balance (pilot). Workspace spend cap
  at $5 to match.

**Cache observation**: free_write system preamble is currently ~400 tokens,
below Sonnet 4.6's 2048-token minimum cacheable prefix → `cache_control`
is a silent no-op until `coach_notes` grows the preamble across the
threshold. The marker stays in the Worker (zero cost when no-op); we'll see
caching kick in automatically as `coach_notes` fills out across sessions.
Documented in `worker/README.md`.

**§16 acceptance status**:
- [x] SKILL.md updated per §9 (Tier 1 complete)
- [ ] Anna ≥5 Coach tab sessions over 2 weeks — pending real usage
- [ ] Nicole ≥3 sessions — pending
- [ ] Ernest ≥3 sessions — pending
- [ ] All 5 pre-generated exercise types ≥10 each for one player — pending
      (currently only translation has content)
- [ ] Free Write used ≥5 times across the family — pending
- [ ] At least 3 escalations triggered with logged transcripts — pending
- [ ] API spend within $5–15/month — pending observation (smoke test ~$0.03 so far)
- [ ] No claude.ai chat involvement in routine authoring for ≥2 weeks — TBD
- [x] CC handles all stats reviews and content authoring for Artem's path

Build sequence (§13) is **complete**. Remaining work is observation +
content authoring (Tier 2) — both gated on real family usage.

**Next session focus** (when family activity warrants):
- Add library content for the 3 remaining exercise types (article_drill,
  particle_sort, error_correction, russian_trap) per Tier 2 priorities in §14
- Review Anna/Nicole/Ernest Coach session data when accumulated; tune
  v2 translation set and `coach_notes` based on what the data shows
- Stats review pass when ≥5 family sessions have logged

---

### 2026-05-01 — s92: active-recall retry, lighter Free Write, richer session-done

Three observations from Anna's first real session on s91/s91r2/s91r3:

1. She ran the v2 set twice (4/10 → 9/10 — big improvement). On both runs, `tr_anna_b01` ("wait for") tripped the same trap. Escalate gave a thorough Russian explanation but, with no immediate active-recall step, the lesson didn't transfer to the next attempt.
2. She wasn't sure from the UI whether the session ended after item 10 — the small "Session done" line scrolled past among per-item feedback.
3. Free Write felt "endless" after just 7 turns — the per-turn "Попробуй сейчас:" pattern read like an indefinite homework treadmill. Soft 20-turn cap was too late.

s92 ships three changes:

**A — richer session-done card** (`coachFinishSession`): replaces the single-line "Session done" with a prominent centred card showing headline, score, elapsed time, retry stats (n items got deep explanation, m correct on retry), and pattern IDs. Action row gets three buttons: `↻ Try this set again` / `✍️ Free Write` (only if live AI reachable) / `← Pick another exercise`. The sticky "← Pick another exercise" exit row is hidden because the action buttons replace it.

**B — Free Write tone** (worker prompt + client soft cap):
- Worker `freeWriteSystemPrompt` (both `ru` and `en` paths): replaces "Suggest one concrete revision" with "Don't always assign a follow-up rewrite. Sometimes acknowledge the corrected version and let her continue freely or wrap up." Adds an "after ~4–5 exchanges, gently surface the option to wrap up" instruction.
- `COACH_FW_SOFT_TURN_CAP` dropped from 20 to 8 — the "we've covered a lot — wrap up?" UI nudge appears at turn 8 instead of 20, matching real engagement curves.

**C — active-recall retry on Escalate**: after the deep explanation renders, a "Попробуй ещё раз / Try again" prompt appears with the original Russian sentence, the input row reappears (routed to a retry handler), and the player submits one more attempt. The retry is scored against the same `correct_answers` + `common_errors` and persisted on the same per-item row via four new fields:

```
escalation_retry_submitted: string | null,
escalation_retry_correct: boolean | null,
escalation_retry_matched_pattern_id: string | null,
escalation_retry_time_ms: number | null
```

First-attempt `correct` is **not** overwritten — first-attempt accuracy stays as the canonical "did she get it the first time" signal; retry is tracked separately. Action row collapses to "Got it — next" after the retry — no second escalation, no second retry. §6.3 schema and §8.5 flow updated accordingly.

**Smoke-tested in browser preview** (mocked Worker for escalate): wrong submission → escalate → deep explanation rendered → retry prompt with Russian source visible → correct retry submitted → "✓ Got it!" rendered + retry fields populated on prevResult + action row shows only "Got it — next". Done card visually distinct, three action buttons present, retry stats line shown when escalation_used count > 0.

**Decision (rationale)**: §8.5 was originally locked as "one shot, no further escalation". The retry is added because passive explanation alone proved insufficient (the s91 wait-for repeat). It still ends after one retry — the "no second escalation" lock holds.

**Cost impact**: zero net change. Each Escalate is still one Worker call (Opus 4.7); the retry is scored client-side against existing exercise data, no extra API call.

---

### 2026-05-01 — coach_language moves to player profile (s91r3)

**Done**: The language preference (Russian vs English explanations) moved
from a hard-coded Worker constant to per-player profile data.
`FAMILY_MEMBERS` in `index.html` and the corresponding `family-profiles.md`
entries now both carry a `coachLanguage` / "Coach language" field.
`coachBuildContext()` sends it as `context.coach_language`; the Worker's
`explainInRussian(ctx)` reads it directly. The hard-coded list stays only
as a backwards-compat fallback for any client still on a pre-s91r3 bundle.

**Why**: the prior arrangement had design intent (the doc) and
implementation (the Worker constant) in two places, with no enforced
sync. Moving the field into profile data closes that loop — the doc is
now the source of truth, the PWA mirrors it, the Worker reads what's
sent.

**Decisions captured along the way**:
- Ernest stays on English (Artem's explicit call). His profile note
  flags this so it isn't ambiguous later — he could plausibly benefit
  from Russian (same L1 as Anna/Nicole), but the call was English.
- Egor marked `coachLanguage: 'en'` but with N/A note — he doesn't use
  the Coach tab.

**Verified via curl**: new payloads with `coach_language: 'ru'|'en'`
route correctly; legacy payloads (no field) still get the fallback path.
Worker version `7b47aea4-f3ee-4315-acc0-5bdeb3db86f5`.

---

### 2026-05-01 — Worker behaviour: Russian explanations for Anna + Nicole

**Done**: Worker `freeWriteSystemPrompt` and `escalateSystemPrompt` now branch on
the player. For `RUSSIAN_EXPLANATION_PLAYERS = ['anna', 'nicole']`, the model is
instructed to explain mistakes and grammar rules **in Russian**, quoting the
player's actual English back, with the corrected English form shown verbatim
(English for forms, Russian for the *why*). For Ernest and Artem the original
behaviour stays — plain English with brief Russian glosses.

**Why now**: Anna's `family-profiles.md` entry has always said "Claude
communicates explanations to Anna in Russian when explaining grammar" but the
Worker prompt was generic ("plain English with brief Russian glosses") for
everyone. Drift between intent and code, surfaced when Artem asked. Same
treatment extended to Nicole on request.

**Scope note — Ernest**: intentionally not included. His profile doesn't
specify a language preference and we weren't asked. Easy one-liner change in
the Worker (`RUSSIAN_EXPLANATION_PLAYERS` constant) if it turns out he'd
benefit too.

**Verified**: curl test — Anna's response opens with "Здесь две ошибки с
прошедшим временем" and quotes *"I go to shop"* in English; Artem's response
to the same submission stays in English with one Russian aside ("идти →
пошёл"). Worker version `0854ec44-2acd-4fa0-bc80-62b68b5d3e4f`.

**Cost impact**: zero behavioural change to token consumption. Same model
(Sonnet 4.6 free_write, Opus 4.7 escalate), same length cap (~150–250 / 200–400
words). Russian text uses ~2× tokens per character vs Latin in tokenizer terms,
but the response cap is in words not tokens, and the family-side responses
average well under cap — net spend stays in the single-digit-cents-per-session
band.

---

### 2026-05-01 — s91-worker-r2: Artem added to Worker path (decision change)

**Done**: `ALLOWED_PLAYERS` in `worker/index.js` extended from `[anna, nicole,
ernest]` to include `artem`. Worker redeployed (version
`332aea40-b76f-4b67-a6c1-4abdab194bd3`). Verified with a real curl as
`context.player: "artem"` — Sonnet 4.6 returned register-aware C1 feedback
on a business sentence, acknowledging the nominalization choice as
intentional rather than a hard error.

**Decision change**: §4 row A1 patched in place. The original lock was
"Artem's CC path: live conversational only, no library reuse" — meaning
the Worker was off-limits for Artem and his cost stayed at $0 via Max.
The relaxation: Artem can now use either CC OR the Worker (his choice
per session). Library content stays family-only — the only change is
that Artem's `players/artem/coach_sessions/` will now also accumulate
Worker-driven sessions. Cost impact at family scale is marginal (prepaid
$5–15 covers all 4 players easily).

**Why**: practical convenience. Firing up CC is friction when Artem just
wants to type a paragraph from his phone. The Worker is built and
working; gating one of four players out of it is design purity at the
expense of usability.

**No PWA change needed** — `coachBuildContext()` already reads
`currentPlayer` regardless of who's logged in, and the Free Write button
was already enabled for everyone in the picker. The 400 was purely a
Worker-side validation that's now relaxed.

**Cost impact watch**: with 4 players potentially on the Worker (vs 3),
expected monthly spend roughly doubles vs the original projection.
Still well within the $5 pilot ceiling at observed usage. Top up to $15
when usage indicates.

---

### 2026-04-30 — Coach tab MVP shipped (CC session, continued)

**Done**:
- Coach tab UI built end-to-end in `index.html` (`v20260430-s90`).
  5th tab "🎯 Coach" with: stats card (last session, top weak spot,
  available count), exercise type picker (translation enabled, others
  greyed in MVP, Free Write disabled until 2C), chat-style message
  renderer, scoring engine (`coachNormalize` + `coachIsMatch` +
  `coachMatchPattern`), per-item result capture, Firestore round-trip.
- Service worker cache key bumped to `eq-v20260430-s90`. Three version
  locations stamped (HTML meta, header badge, sw.js cache key).
- Smoke-tested in local browser preview as Anna: full translation
  drill cycle (correct + wrong-with-regex-match + fallback) including
  Firestore write of summary at `players/anna/exercises/{ts}` with
  `source: 'coach_tab'`. Test record cleaned up after.

**Doc-impacting**:
- §13.1 acceptance ("Anna opens Coach tab, completes 5 translation
  exercises in a row, sees rich feedback per exercise, sees her score
  in Firestore") is satisfied locally. Real-Anna-on-real-device
  validation remains; that's a deploy-and-observe step, not a code step.
- §8.7 stats card spec said "{n} exercises available for you" reads
  from `_meta.coverage_by_player[player]`. Implementation reads both
  `[player]` and `[all]` buckets and sums them, so future "all"-targeted
  exercises are visible to every player automatically.

**Build sequence status**:
- §13.1 Phase 2B remaining: deploy (push to GitHub Pages) — pending
  Artem's go-ahead. Service worker bump landed; pre-deploy checklist
  remains to run.
- §13.2 Phase 2C blocked on: Artem confirming Anthropic key creation
  and handing the key over for Cloudflare secret setup. Worker build
  itself is unblocked — schema, prompts, validation rules all spec'd
  in §7.

---

### 2026-04-30 — PV ladder coverage analysis (CC session, ahead of Tier 2 PV batch)

**Context**: Artem ran two CC exercise sessions today — `article_drill` (8/10)
and PV `transform` (5/8). Self-diagnosed at end of PV session: production
drills feel too steep cold, wants recognition layer first. Engagement note
captured: PV training ladder is recognition (Smart-mode quiz filter on PV)
→ particle_sort → transform/free_write. Question raised: does the planned
PV Batch 1 (§14.2 Tier 2, ~50 items, prefix `pv_p2`) actually deliver the
ladder?

**Counted current PV bank coverage** (`pv_*` + `gt_*` = 148 items):

| Rung | Format | Count | Share |
|---|---|---|---|
| Recognition | MCQ | 5 | 3.4% |
| Selection | gap-fill | 96 | 65% |
| Production | input | 47 | 32% |

The recognition rung is critically thin. With only 5 MCQ items, Smart-mode
quiz filtered to PV produces near-zero recognition warm-up before the
player hits gap/input items. This is the upstream cause of the production
failures documented in `coach_notes.weak_patterns` ("phrasal verb production
input-type 0% on get/bring/take families — gt03, gt10, pv_c03, pv_c07,
pv_ti17, pv_ti71"): you can't produce what you can't yet recognise.

**Tension in PV2 lock**: §4 PV2 says "CC picks the type mix per PV based on
existing per-category input share table and observed weakness." Read
literally, this points toward more **input** (where the documented stuck
items live). But that's chasing the symptom — the production gap is
downstream of weak recognition. Adding more input items on a 3.4%-MCQ
foundation won't fix it.

**Recommendation for the session that picks up Tier 2 PV Batch 1**:

1. **Ladder-pair the 6 stuck PVs explicitly**. For each of the family
   members get/bring/take particles surfaced in tonight's transform session
   (across, down to, around to, about, on/over, plus the inv03-adjacent
   "no sooner...than"), author all three formats — 1 MCQ + 1 gap + 1 input
   per PV. ~18 items dedicated to ladder completion on the weakest cluster.
   Use shared `linked_question_ids` across the trio so quiz analytics can
   track ladder climbing.
2. **Skew the remaining ~32 items toward MCQ** — target ~20 MCQ, ~8 gap,
   ~4 input. This rebalances the category toward the missing rung without
   abandoning the input-gap signal.
3. **Post-batch projection** (if applied):
   - MCQ: 5 → ~30 (~15× growth) — Smart-mode quiz becomes a real warm-up tool
   - Gap: 96 → ~110
   - Input: 47 → ~57

**Family path implication (Phase 2D)**: Anna/Nicole/Ernest will need
parallel `particle_sort` library content (selection rung) and eventually
MCQ-style recognition exercises in Coach tab. Today `exercises_library/`
holds translation only. The particle_sort schema is spec'd (§6.1.3) but
zero items exist. When Tier 3 PV expansion lands, mirror the ladder split
into the library so the Coach tab can deliver the same warm-up→production
progression natively.

**Decision deferred to Tier 2 session, not locked here**. PV2 is not being
reopened; this is guidance, not a doc patch to §4. Surfaced in the status
log so the next CC session reading §1's autonomy mandate sees the analysis
before drafting the batch.

---

*This file lives at `references/phase2-coach-tab.md` in the repo. Updated
by CC as decisions land in flight. Should be archived once Phase 2
acceptance (§16) is met, alongside the now-deleted PHASE2_PLAN.md and
MIGRATION_HANDOFF.md.*
