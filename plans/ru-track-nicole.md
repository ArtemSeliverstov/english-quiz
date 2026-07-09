# RU track — Nicole grade-7 prep

**Status**: active
**Owner**: Artem · execution: CC
**Deadline**: 2026-09-01 school start. Baseline: TAMOS entrance test 2026-07 — 7/20.
**Companions**: `docs/learning-system-design.md`, `references/question-schema.md`, `references/firestore-schema.md`

## Why

Nicole is a fluent oral native speaker without the formal grade 5–6 metalinguistic layer: орфограммы-алгоритмы, разряды, морфемный разбор were never encoded, so retrieval-only practice (bare MCQ) can't close the gap. Miss clusters from the entrance test: орфография-правила (6/13), морфология-классификация (4), пунктуация (2), тропы (1). Program = explicit rule encoding → guided practice → spaced interleaved retrieval → production → weekly control, on the existing quiz engine under a separate profile.

## Track architecture

- Profile `nicole_ru`, separate Firestore doc `players/nicole_ru` — zero contamination risk with English data; own streak, medals, stats, `learning_path`.
- RU questions live in `ALL_QUESTIONS` with categories prefixed `RU: `. Pool assembly filters `RU: ` categories out for every profile except `nicole_ru`, and non-RU out for `nicole_ru`. No schema change.
- `lvl` reused as difficulty band: B1 база / B2 закрепление / C1 исключения + 7-класс preview. `level_cap: B1` at start.
- `multi` type banned for the track (Nicole 17% multi — cross-player UI anomaly). Types: `mcq`, `gap`, `input`, `error_correction`.
- Coach tab hidden for `nicole_ru` — no RU worker mode yet (phase 2 trigger below).

## Topic cycle — 5 steps

| Step | Mechanism |
|---|---|
| Разбор | Kickoff with Artem at topic unlock, 15–25 min, CC-led RU tutorial + `ref/ru/` algorithm page |
| Опорная практика | Blocked quiz set; first items carry `intro` rule card (scaffold fade); every `exp` walks the algorithm step that applied |
| Закрепление | Smart/weak modes as-is: spacing, intervals; interleaving grows with the window |
| Производство | `error_correction` items + paper диктант 1×/week on the week's орфограммы, checked via photo in CC |
| Контроль | Weekly 20-item mock in entrance-test format from W3; last two on paper, timed |

## Data model additions

| Field | Where | Writer | Purpose |
|---|---|---|---|
| `study_plan` | `players/nicole_ru` | CC only | Plan as data: start/end, weeks[] {topics, planned kickoff/dictation/mock}, daily target (items ≥ 10) |
| `daily_activity` | `players/nicole_ru` | PWA play loop, bump per answer | `{"YYYY-MM-DD": {items, correct}}` — durable adherence record; `recentSessions` FIFO-10 is too shallow for 8 weeks |
| exercises rows `kickoff` / `dictation` / `mock` | subcollection | `tools/log_exercise.js` | Fact side for non-quiz events; mock rows carry total/correct + per-cluster misses in `meta` |

Deviations are computed at render, never stored. On ship update: `firestore-schema.md`, `system-mechanisms.md` §4, `exercise-types.md`, `data-flow.md`.

## Dashboard — two views, one data source

**Nicole — learner shell home card «Подготовка к школе»** (gate: `study_plan` exists on current player):

- progress bar to 1.09: темы пройдено + дней прошло
- week map: 8 chips ✅/🔵/⚪, tap → topics of the week
- «Сегодня»: one primary action — today's set / повтор / mock
- mock trajectory: positive deltas only (medal rule); a drop renders the absolute score, no arrow
- no miss counters, no red flags, no guilt mechanics — a gap renders as «продолжим сегодня?»

**Artem — builder shell, section «Программа Nicole-RU» in Stats tab** (gate: `currentPlayer === 'artem'`):

- plan-vs-fact calendar 8×7: ✅ done / ⚪ missed / — future, streams: quiz items, диктант, mock, kickoff
- deviation banner: ≥2 consecutive missed days → ⚠ + last-activity date; lag estimate in days vs plan (W8 buffer absorbs)
- per-topic: items done/planned, accuracy, status — не начата / в работе / закреплена ≥80%
- mock table: all scores + per-cluster miss breakdown
- not on Family tab — family sees each other only as light social context; full detail stays behind Artem's PIN

**CC complement**: `mistakes-review` (daily 07:30) appends a nicole_ru adherence line when ≥2 days missed; `stats-review` regenerates `progress/ru-program-tracker-nicole.md` — generated view, never hand-edit.

**Deviation rules**: day done = `daily_activity[date].items ≥ 10` · диктант/mock satisfied by a matching exercises row inside week bounds · topic lag = planned close date passed with accuracy <70% or items below plan.

## RU categories (10)

RU: Морфемика и части речи · RU: Н/НН · RU: НЕ с частями речи · RU: Слитно/раздельно/дефис · RU: Местоимения · RU: Прилагательные · RU: Наречия · RU: Числительные · RU: Пунктуация · RU: Лексика и выразительность

ID prefix `ru_` + topic slug (`ru_nn01`, `ru_ne01`). Register in `question-bank-taxonomy.md` §7 when authoring starts.

## Weekly program

W1 фундамент + Н/НН · W2 НЕ + слитно/раздельно/дефис · W3 пол-/полу-, сложные прилагательные + mock 1 · W4 разряды местоимений и прилагательных · W5 степени сравнения + числительные · W6 вводные + однородные · W7 тропы + добор слабого по статистике · W8 mock-интенсив + буфер.

Daily rhythm: 15 min app + 15 min русское чтение. Kickoff 1–2×/wk, диктант 1×/wk, mock Sundays from W3. Readiness metric: mock 7 → 16+ by late August.

## Doctrine overrides — surfaced

- «Player-initiated only» in Nicole's profile — deliberate override for this track: school prep with a deadline, not optional English extras. Agreed daily slot; her autonomy is time-of-day. Precedent: the 2026-05-12 gate drop.
- Диктант stays paper, outside the PWA — no conflict with §6 no-audio-layer.
- Daily чтение is a habit outside the system, not the §6 reading-comprehension layer.
- Worker RU coach mode (self-serve «переспросить правило») — phase 2. Trigger: kickoff model works but she needs re-explanations between sessions.

## Build order

1. Data skeleton: `players/nicole_ru` doc + `study_plan` seed + `daily_activity` bump in play loop
2. Engine: RU category gate in pool assembly + `intro` render for all types + profile tile + Coach tab hide
3. Content: фундамент + Н/НН block (~50 items) + first two `ref/ru/` algorithm pages
4. Dashboards: Nicole card → Artem section
5. CC: `log_exercise.js` canonical types kickoff/mock + `mistakes-review` adherence line
6. Weekly content: +1–2 topics per week, 3–4 parallel mock forms by W3

Largest code chunk: engine + dashboards, ~400–500 lines in `index.html`. Everything else is authoring. Content volume: ~10 topics × 25–30 items + mock forms ≈ 350–400 items total.
