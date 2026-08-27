# Plans index

Active plans, what they cover, which SKILL (if any) loads them.

## Active

| Plan | Scope | Wired to SKILL |
|---|---|---|
| `learning-system-build.md` | Engineering / system build (Phase 2D): active windows, learner shell, spelling layer engine, medal display, schemas, restart-readiness, Phase 3 cleanup. Decisions D1–D14 locked here. | none — Artem's working execution doc |
| `question-bank-plan.md` | Content authoring + bank quality: waves 0–5 per player, workstreams (PV ladder, articles, orthography), Coach library per player, MCQ distractor audit, Idioms re-engineering, tier priorities. | `quiz-development` |
| `open-items.md` | **The consolidated backlog** (2026-07-03): practice queue, tracker package T1–T5, confirm-first pendings, App Check + smaller fixes, deferred-with-triggers, dropped decisions. Cross-checked as a set. | none — picked up on Artem's prompt |
| `speaking-lane.md` | Speaking lane doctrine: spoken sub-skills the text path can't reach (fluency, listening comprehension, prosody via self-recording). Family-wide tiered rollout, engagement gates, kid privacy. Lane itself not started; sibling `audio-coach-pipeline.md` ships the audio infra its Tier 2/3 would use. | none — doctrine for family-wide rollout post-Artem |
| `audio-coach-pipeline.md` | Artem-only audio fast-track on shared infra: `/v1/audio` Worker endpoint (Whisper-large-v3-turbo + R2) + CC interview-prep flow shipped 2026-05-13; `shadow_feedback` mode (Days 6–8) unstarted. | none — Artem execution doc; shipped surface is the `interview-prep` skill |
| `retention-lane.md` | Long-term retention mechanics (shipped 2026-07-03): post-CLOSED expanding probes (+2w/+6w/+4m), monthly ~15-item mixed `retention_probe`, untrained-sibling retirement rule, lifetime sampling of owned phrases/PVs. Builder-shell only. | `exercise-session` (probe mode) + `stats-review` (probe dates, step 8) |
| `conversational-register-lane.md` | CR1–CR4 (shipped 2026-07-04): casual-mode Free Write (modeled informal input + flipped correction polarity), register-down captures, `conversational_register` catalog topic #7 (P1 finally routes Artem's worst category), weekly slot #12. Why: spoken-casual as an absent variety. | `free-write` (CR1) + `weak-spots-session` (CR3) |
| `russian-l1-b2-foundation-diagnostic.md` | Discovery diagnostic for hidden Russian-L1 B2 foundation gaps. Outside-in design from contrastive linguistics catalogues (not from `coach_notes.weak_patterns`). ~60-80 items across 10-12 clusters, 50/50 recognition/cold-production, one-shot ~60-90 min sitting. B1 fallback deferred to v2. Companion: `russian-l1-b2-foundation-diagnostic-sources.md` (per-cluster catalogue citations + item budget). | none — Artem instrument |
| `ru-track-nicole.md` | Russian grade-7 prep for Nicole, deadline 2026-09-01: `nicole_ru` profile, `RU: ` question track, 5-step topic cycle, two-view program dashboard (learner card + Artem plan-vs-fact), paper dictation + weekly mocks. | none — Artem-driven; authoring via `quiz-development` |
| `ru-track-ernest.md` | **Спринт 19–31.08.2026**: 10 CC-сессий по ~60 мин к старту 10 класса Tamos Cambridge School — терминосистема синтаксиса, причастия/Н-НН, сложное предложение, обособления; S10 = контрольный срез. Формат часа (объяснение прозой + практика + мини-тест), логи `kickoff`/`mock` в `ernest_ru`, трекер `progress/ru-program-tracker-ernest.md`. Диагностики №1–2 — базовая линия. Учебный год — отдельным планом после S10 + ответа школы о формате аттестации. | none — Artem-driven CC sessions |
| `kk-track-ernest.md` | **Parked, design only.** Kazakh from zero to the grade-9 RK exam (June 2027) for Ernest: `KK: ` third track on the same engine (`trackPrefix` generalization), 5 content phases ≈400 items, school ИУП checkpoints. Unparks on Artem's go after Ernest's RU program is stable. | none |
| `school-adaptation-ernest.md` | **Культурный бриф + беседы Б1–Б7** к старту 10 класса Tamos: рамка «два регистра» (Cambridge-поток / госстандарт-блок), негласные правила класса, красные линии с историческим слоем (ашаршылық → Желтоксан → Қаңтар → Жаңа Қазақстан: Конституция-2026, парламент-Курултай, возврат активов и олигархи через IGCSE-экономику, Нацфонд-детям, АЭС/ИИ), казахский декодер-слой «что услышит от сверстников», смолл-ток-валюта, интровертная тактика входа. Формат бесед: рассказ → чек → сценки-декодеры, статус-таблица в плане. | none — CC ведёт беседы, триггер «это Эрнест, культурная беседа» |
| `math-track-ernest.md` | **Broad goal, light layer.** General numeracy for Ernest (16, no math specialization) — everyday mental-calc fluency + school-math confidence, not olympiad/РФМШ. Carried mainly by `mathsprint.html` (family speed game); CC session only on-demand for a surfaced gap. RU track stays priority. | `math-session` |
| `biz-english-track-artem.md` | Artem's daily ~60-min business-English hour while job-hunting: Lane A spoken-professional modules (meetings, numbers aloud, banks/advisors, interviews) + Lane B register range (Black Company Reading Lab), 12-week phases with checkpoints + recalibration rule. Composes interview-prep / CR lane / retention; no new exercise types or surfaces. | `business-lesson` |
| `math-track-nicole.md` | Math for Nicole: РФМШ Алматы. As an RF citizen she's barred from the grant конкурс itself (п. 2.8) — paths = платный добор в 8 класс (авг/дек 2027) + olympiad leverage (юниорская/Смагуловская/РЖО finals; п. 6.3 автоматом только гражданам РК). 7-класс olympiad ladder, two topic lanes (exam A1–A16 incl. физика / olympiad B1–B12), phase program 0–4 ramping from weak UK-Year-8 base (checkpoints + recalibration rule), season calendar. **CC + paper only, outside the quiz engine.** Fact side: `diagnostics/nicole_math_session-log_*.md`. | `math-session` |
| `physics-track-nicole.md` | **Recap-интенсив до 1.09 + школьный темп.** Физика для Николь — 7-й физмат класс TAMOS с 2026-09-01; цель года — топ-10% класса, олимпиады отложены до итогов 1-й четверти. Дорожка P1–P5 (величины/СИ → движение → плотность → силы → свод), термины вводом-показом с EN-якорями KS3 (`diagnostics/nicole_physics_ru_terms.md`), с сентября 1×/нед опережение школьной темы; декабрьский мини-пробник добора РФМШ (кормит A14–A16 math-плана). **CC + доска, вне quiz-движка.** Fact side: `diagnostics/nicole_physics_session-log_*.md`. | `math-session` |
| `career-masters-egor.md` | **Handover-док для Егора** (RU, самодостаточный; ШАД сознательно исключён): рамка revenue-side DS + QB как хвостовая ставка (5 QB-человек в Алматы, найм через макрорегион), шортлист магистратур с фильтром «не терять доход» (оплачиваемые KAUST/MBZUAI/Erasmus Mundus + LSE/Imperial/Bocconi/TUM/ETH), гранты под гражданство РК (Болашак/Chevening — отработка vs Gulf-план), заочные альтернативы (GaTech OMSA, Imperial online), KPMG stay-until-offer + переход в продуктовую DS при сдвиге, цикл подач сен-2026 → старт осень-2027, два открытых решения. Companion: `career-egor-network-intel.md` — скрипты разведвстреч (экс-рекрутер QB, партнёр BCG Ташкент) + секции «Итоги» под ответы. | none — Artem-driven |
| `math-track-egor.md` | **Assessment-first.** Поступление в ШАД (Яндекс), набор-2028 (2027 снят: выпускная сессия UoL в мае 2027 + начатый FRM): карта пробелов «Вторая школа + КБТУ/UoL BSc Data Science and Business Analytics (LSE)» × официальная программа ШАД (7 строк, ~490–640 ч; фон 3–5 ч/нед до выпуска, ядро 10–12 ч/нед после), формат отбора-2026 (тест 9+3 / экзамен 6+2 / собеседования), фазы 0–4 с мартовским гейтом-2028. Самостоятельный взрослый трек: Егор по карте, CC — диагностика S1, разборы, статусы. **Вне quiz-движка.** Fact side: `diagnostics/egor_shad_session-log_*.md`. | none — Artem-driven |

`learning-system-build.md` and `question-bank-plan.md` cross-reference each other; the split is by concern (engineering vs content authoring), not chronology. Read the one matching your task.

## Archive

`plans/archive/` holds shipped or postmortem plans, kept for history. Not loaded by any SKILL and not surfaced from CLAUDE.md.

| File | What it is |
|---|---|
| `phase2-status-log-2026-05.md` | Session-by-session execution records s93–t6, extracted from former `phase2-build-plan.md` §12 |
| `emphasis-rebuild-spec.md` | Shipped post-t2r4 — Emphasis category rebalanced to 55 items / 29% input share |
| `schema-alignment-plan.md` | All three tracks shipped 2026-05-10 |
| `data-integrity-postmortem.md` | 2026-05-02 Nicole-contamination incident record + remediation (P0–P2 shipped t7/2026-05-10/2026-05-11) |
| `repo-improvements-completed.md` | Doc discipline + file reallocation + architecture hardening tracks (Tracks 1, 2, 3.1, 3.2, 3.5, 3.6 shipped; open items extracted to `plans/open-items.md`) |
| `stats-sprawl-cleanup.md` | Shipped through r12 — `coach_notes.weak_patterns` split into three stores (durable grammar / `recent_session_signals` / `phrase_tracker`); per-player migration done 2026-05-12 |
| `coach-live-ai-and-weak-spots.md` | Shipped through r15 — T1 (all Coach types live AI via Worker, library → offline fallback) + T2 (`weak_spots_drill`) complete 2026-05-11; r11–r15 enhancement waves codified back into doctrine |

When researching past decisions, grep `plans/archive/`. Don't apply archived plans as current truth — they describe what was done, not what to do next.

## Convention

- New plans land in `plans/` at the root with `**Status**: active` in the first 10 lines.
- When a plan ships fully, move to `plans/archive/` and update its status line.
- Don't write new plans into `plans/archive/`.
