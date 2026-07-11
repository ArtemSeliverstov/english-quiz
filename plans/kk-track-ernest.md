# KK track — Ernest: казахский с нуля к экзамену 9 класса

**Status**: parked — design only, no build. Start trigger: Artem's explicit go, after Ernest's RU program is running (diagnostic scored + first weeks stable). School-format confirmation strongly preferred before Phase 3.
**Owner**: Artem · execution: CC
**Target**: экзамен «казахский язык и литература» для классов с русским языком обучения, июнь 2027 — текст 300–350 слов + 3 задания (лексика по теме / оценка смысла / письменное изложение на казахском), 2 акад. часа, кириллица. Target proficiency: solid A2, receptive B1.
**Runway**: старт лето 2026 → экзамен июнь 2027 ≈ 11–14 месяцев. Budget: 15 мин/день (лето) → 30–40 мин/день (учебный год) + школьные уроки казахского (4–5 ч/нед) ≈ 350–400 часов суммарно.

## Why parked

RU track is the priority lane for both kids; Kazakh starts as a light summer layer only after Ernest's Russian program is live. Parking the design now preserves the research (exam format, script status) without splitting build focus.

## Architecture (same engine, third track)

- Profile `ernest_kk` — same pattern as `*_ru`: separate Firestore doc, zero contamination.
- Categories prefixed `KK: `. **Engineering note**: the current gate is a boolean `ruTrack` ↔ `RU: ` prefix; generalize to per-member `trackPrefix` (`'RU: '` / `'KK: '`) before the third track lands. Sibling switch is pairwise today (ernest ↔ ernest_ru); for three profiles either a cycle switch or two bridge buttons — decide at build.
- Cyrillic throughout — Latin transition officially stalled past 2030; exam is Cyrillic. If the reform ever lands, re-reading a known language in Latin is a two-week task, not a rebuild.
- `study_plan` + dashboards: same mechanism as RU.
- Coach tab / Worker: out of scope — no Kazakh mode; track is quiz + paper only.

## Content phases (~400 items over the year)

| Phase | When | What | ~Items |
|---|---|---|---|
| 0 Алфавит и звук | 1–2 нед | 9 специфических букв (ә ғ қ ң ө ұ ү һ і), звуковые пары қ/к, ғ/г, сингармонизм на слух; чтение вслух с Артёмом (бумажная дорожка) | 30 |
| 1 Ядро-200 | лето, 6–8 нед | Топ-200 слов (семья, числа, время, еда, школа, базовые глаголы) + формулы вежливости; RU→KK и KK→RU, input-производство | 150 |
| 2 Конструктор аффиксов | сен–дек | Агглютинация по одному аффиксу за раз: -лар/-лер (гармония), притяжательные, падежи по одному, личные окончания, настоящее/прошедшее, отрицание -ма/-ме. Intro-карточка на каждый аффикс — fade-scaffold создан для этого | 120 |
| 3 Экзаменационные шаблоны | янв–апр 2027 | Адаптированные тексты 150→300 слов с вопросами; клише письменного ответа (менің ойымша…); лексика частотных экзаменационных тем | 80 + тексты |
| 4 Моки | апр–май 2027 | 3–4 полных прогона формата: текст + 3 задания, 2 часа, по таймеру | 4 формы |

## School-driven checkpoints

1. При зачислении спросить школу: как аттестуют по казахскому прибывших из-за рубежа; возможен ли ИУП на первый год (правила аттестации: вопрос ИА для обучающихся по ИУП решает педсовет).
2. Запросить примеры материалов их управления образования → перекалибровать Phase 3 под реальные задания.

## Risks — named

- **Content accuracy**: CC не носитель казахского; формы с гармонией гласных валидировать по УМК «Қазақ тілі» (Т2) и словарю; при возможности — вычитка носителем. Не шипить непроверенные парадигмы.
- **Мотивация**: язык «по обязанности» для подростка; лечение — короткие сессии, его лексические домены (гейминг, спорт), видимый прогресс-бар, честная рамка «инструмент для аттестата».
- **Конкуренция за время с RU-треком**: KK стартует только лёгким слоем и не раньше, чем RU-программа Эрнеста стабильна 2+ недели.

## Build order (when unparked)

1. Engine: `trackPrefix` generalization + `ernest_kk` profile + bridge decision
2. `ref/kk.html`: алфавит + таблицы аффиксов
3. Phase 0+1 content (первые ~80 items) + study_plan seed
4. Далее по фазам; mock-формы к апрелю 2027
