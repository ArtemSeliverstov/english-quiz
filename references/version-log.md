# Version Log

Session-by-session history. Newest first.

For full detail on any older session, see the archived HTML KB:
`archive/quiz_knowledge_base_v20260428-s87.html`.

This markdown summarises only — full bug logs, design rationales, and code
specifics live in their dedicated reference files.

---

## 2026-08-22 · session — RU S3 Эрнест: «Односоставные» — 4 вида даны, безличное не село, мини-тест укорочен

- **S3 (~21 мин, fable-5)**: разминка 4/4 — «будут ездить» → ПГС холодно (хвост S2/S3-short `sint_bud_slozhnoe_kak_sgs` закрыт), инфинитив цели, «семисот», пре/при (буквы верно по чутью, правило дано). Тема рассказом + шпаргалка + алгоритм 4 шагов. Практика 5/8: опр.-личные/неопр.-личное/назывное ✅, **все три промаха — безличное** (мне не спится / нам пора / пахнет хлебом — дательный как лицо, ед.ч. как «кто-то»). На 19-й минуте Эрнест: «за две минуты успеем?» → блок «односоставное vs неполное» одним абзацем, мини-тест укорочен до 3 — **0/3** (стемнеет → назывное, доставляют → безличное, вот и дом → неполное).
- Лог: `ernest_ru` kickoff 9/15 (`partial: true`, meta `sprint_session: S3`, блоки, Тайминг-строка), сигнал `sint_odnosostavnye` count→2 (диагностика №2 + S3). Трекер +строка S3; coach_notes observation. План: S4 «Словосочетание и члены предложения» по расписанию (23.08), разминка S4 = холодный блок безличных/неопр.-личных; при <3/4 — повторный мини-тест по S3 до новой темы.

## 2026-08-21 · session — RU S3-short Эрнест: короткий тест по S1–S2, 6/6; «Односоставные» перенесены

- Эрнест попросил уложиться в ≤10 мин → вместо S3 «Односоставные» проведена укороченная сессия (~7 мин): разминка 2 вопроса (1/2 — «будем тренироваться» → СГС вместо ПГС, дообъяснено) + холодный тест 6 вопросов по основе и типам сказуемых — **6/6**, включая тот же механизм («будут играть» → ПГС), инфинитив цели, нулевую связку, цельное подлежащее.
- Лог: `ernest_ru` kickoff 7/8 (`partial: true`, meta `sprint_session: S3-short`, Тайминг-строка), сигнал `sint_bud_slozhnoe_kak_sgs` count→2. Трекер `progress/ru-program-tracker-ernest.md` +строка S3-short. План: следующая сессия = полная S3, хвост спринта сдвигается на +1 день.

## 2026-08-21 · v20260821 — RU: Физические термины (+24) — терм-канал physics-track

- **+24 вопроса `ru_ph01–24`** — новая категория «RU: Физические термины» в nicole_ru (input 9 · gap 7 · mcq 8, все B1; intro-карточка формульного алфавита на ru_ph01). Покрытие P1–P2: буква→величина→единица (s/t/m/V/v, ловушка V/v), СИ, v = s/t + одна подстановка, км/ч ↔ м/с (×/÷ 3,6, дистрактор «потерянная запятая»), равномерное/траектория, тело/вещество/явление («вещество существительным» — деформация S1/S2), величина/значение/единица, мензурка и цена деления, приставки.
- **Почему** (решение Артёма после физики S2 21.08): формульный алфавит, введённый в S1, за два дня без касаний стёрся («ничего не помню»); из пяти предложений выбран квиз-канал — единственный, дающий ежедневные касания без участия Артёма, по образцу `ru_mt` (v20260803). Supersedes «не строим до осени» в физ-плане §Связи.
- Регистрация: taxonomy §7 (`ru_ph`), schema (RU-категории), ru-track-nicole план (12 категорий), физ-план §Связи, `nicole_physics_ru_terms.md` (канал 2). `learning_path.active_categories` nicole_ru патчится вслед за деплоем.

Q count: 2400 (Δ+24) · Version: v20260821

---

## 2026-08-21 · session — Math S12 Николь: разогрев перед пробником, жанры закрыты, ритуал формата → цикл показ→намёк

- **S12 (~33 мин, чат + Excalidraw, fable-5, 0 инцидентов)** — решение Артёма: пробник v2 + Part B переносится на 22.08, сегодня разогрев по плану S12. Ядро фазы 0 чистое: прикидка замер 3 ✅ с первого раза (→ постоянный ритуал), метод дырки с холодной вербализацией ✅, жанры «введена операция» и «счёт позиций с конца» — по два холодных ✅ в разных сессиях, **закрыты**; проценты на доске ✅ (свой метод через 1 %), порядок действий ✅. Термы: знаменатель холодно ✅ (дроби закрыты), вычитание/сложение холодно ❌ 3-й/2-й раз при чистом применении после показа, множитель/произведение введены.
- **Правка дефолта (решение Артёма)**: ритуал формата «ищу→считаю→ответ» три сессии подряд не вызывался угасающим намёком («оформи как на контрольной» / «чего не хватает?» → «не знаю») — в `math-track-nicole.md` §Ритм и `math-session` п.5 «угасающая подсказка» заменена на цикл **показ → 1–2 сессии прямо → намёк → не сработал → показ**.
- **Записано**: лог S12 в `nicole_math_session-log_2026-08.md` (тайминг, 19 ответов сверены с JSONL) · `ru_terms` (дроби ✅, умножение 🟡) · план (статус S12, пробник 22.08, жанр-ротация — три закрытых помечены).

Q count: 2376 (Δ0) · Version unchanged (v20260818)

---

## 2026-08-20 · session — Физика S1 Николь: P1 «Величины и измерения» закрыт + модельное правило ужесточено

- **Первая физика вообще проведена** (`plans/physics-track-nicole.md` P1, ~25 мин, чат + Excalidraw). Прогноз трека подтвердился по обеим осям: KS3-фора реальна (приставки холодно ✅ ещё в разминке, ловушка v/V не сработала, «величина/значение/единица» встала с одного показа), RU-слой пуст, но тоньше ожидаемого — слова цепляются с первого предъявления. Цена деления — единственный концепт без аналога в KS3 — взята с одного демо и применена к чтению шкалы. Капстоун на доске: метод записан верно целиком, отказала арифметика (100÷4=20) → нейтральный «покажи, как считала» + обратное действие → пересчитала сама до 250 мл.
- **Открытие**: физическое оформление приживается быстрее математического — единицы в обеих строчках капстоуна написаны сама, без напоминания, тогда как math-ритуал «ищу→считаю→ответ» на S11 всё ещё шёл по запросу. Следствие в плане: промежуточную ступень пропускаем, в P2 полное «дано→формула→подстановка→ответ» вводится сразу поверх готовых единиц.
- **Записано**: `diagnostics/nicole_physics_session-log_2026-08.md` (новый файл, структура math-лога) · физ-план P1 ✅ / P2 🔵 + Fact side на реальный файл · `nicole_physics_ru_terms.md` — пять групп яруса 1 → 🟡 с заметками. Устойчивая деформация на будущее: вещество называет прилагательным («стеклянный» вместо «стекло»), дважды за сессию.
- **Инцидент + правка правила**: хук `detect_fabricated_turns.js` сработал **дважды** (opus-5), оба раза поймано, ничего выдуманного не засчитано, все 16 её ответов сверены с сырым JSONL. Счёт по моделям: opus-5 — 4 фабрикации (math S6, S7, физика S1 ×2), sonnet-5 и fable-5 — 0. Веб-проверка: это известный дефект семейства Opus 5 («модель галлюцинирует границу хода внутри собственного вывода», ~1% корпуса, родня dangling-document effect); официального фикса или записи в release notes нет. Старший opus заменой не является — `anthropics/claude-code#64076` (Opus 4.8 фабрикует результаты инструментов) открыт и без ответа с мая, причём этот режим хук не ловит. **`math-session` §Модель переписан в жёсткое «на opus-5 не вести»**, рабочие модели — `claude-sonnet-5` / `claude-fable-5`.
- **Флаг Артёму**: до 1.09 осталось 4 P-темы (P2–P5) и незакрытый math-пробник v2 — слоты по-прежнему за ним.

Q count: 2376 (Δ0) · Version unchanged (v20260818)

---

## 2026-08-18 · docs — Физ-трек Николь: поступление в 7-й физмат TAMOS → recap-интенсив до 1.09

- **Новый факт**: Николь поступила в 7-й физмат класс TAMOS (старт 2026-09-01). База после BSB KS3 science: концепты знакомы по-английски, RU-терминология — пустой слой, формулы/СИ/оформление не тренированы. Цель года — топ-10% класса; олимпиады отложены до итогов 1-й четверти. Физика в KZ-программе стартует именно в 7 классе — класс начинает с нуля, фора реализуема.
- **`plans/physics-track-nicole.md`** (новый): дорожка P1–P5 до 1.09 — величины/СИ → движение (v=s/t) → плотность (ρ=m/V) → силы (F=mg) → сводный сет; ~5 сессий по 30–40 мин, слоты между RU-треком и math распределяет Артём; термины вводом-показом без входного тестирования, лёгкие задачи как живая диагностика. Чекпойнт к 1.09: три формулы в обе стороны + СИ-переводы + сводный сет ≥80%. С сентября 1×/нед опережение школьной темы; декабрьский мини-пробник добора остаётся. Оформление «дано→формула→подстановка→ответ с единицей» = физ-версия «ищу→считаю→ответ».
- **`diagnostics/nicole_physics_ru_terms.md`** (новый): 3 яруса с EN-якорями KS3 (speed→скорость, upthrust→архимедова сила), ★ ≈ 15 + формульный алфавит (s/t/V/m/v/ρ/F с единицами); дозировка math-дорожки (1–2 новых/сессию) не применяется — ввод группами до 🟡, ✅ по производству осенью. Ярусы 2–3 ориентировочные до уточнения учебника/программы в сентябре.
- **Skill `math-session` расширен на физику** (триггеры «физика»/physics, reads по предмету сессии, физ-пункт протокола №9) + строка CLAUDE.md. Math-план: решение 2026-08-03 «лёгкий слой с октября внутри math-лога» superseded — A14–A16 ведутся физ-треком, терминам свой файл. plans/README: строка нового плана + Wired-фикс math-строк (`math-session`, было none).
- **Флаги Артёму**: family-profiles (школа Николь) — правка отдельно по протоколу аппрува; августовские слоты перегружены (RU-пересборка W3–W7 + math S11/пробник v2 + физика P1–P5) — приоритизация за Артёмом; программу математики физмат-класса уточнить в сентябре (может сдвинуть math-фазу 1 «школьным темпом»).

Q count: 2376 (Δ0) · Version unchanged (v20260818)

---

## 2026-08-18 · session — RU-track Nicole: W2-кикофф «НЕ с частями речи» (player-initiated)

- **W2-кикофф наконец проведён** (23 дня после плановой недели) — и это первый player-initiated приход Николь в RU-трек: сама открыла CC и попросила «упражнения по русскому». CC-led формат (решение 2026-07-26) отработал.
- **НЕ с частями речи: 10/14.** Алгоритм 4 шагов (без НЕ не живёт → глагол → «а»/усилители → синоним) освоен; все 4 промаха — первые предъявления особых случаев (недалеко-синоним, «не правда, а», «вовсе не», «зато»-ловушка), каждый исправлен на ретесте в той же сессии. Ловушку *ненавидит*-глагол прошла сама. Разминка Н/НН 3/4 (соломенная — не узнала -ЕНН-; перекос «всегда НН» из 07-26 не вернулся). Тайминг: ~14 мин активных, пауз-провалов нет.
- **Записано**: exercises `kickoff` row (маркер 1/1, 14 items в rich-детали + разминка в meta; catStats-фолд 14 → «RU: НЕ с частями речи» 10/14) + observation в `coach_notes`.
- **Флаги для Артёма**: (1) вопросов «RU: НЕ с частями речи» в банке нет — опорная практика в приложении невозможна, нужен авторинг (~25–30 items по плану); (2) второй топик W2 «Слитно/раздельно/дефис» не покрыт — кандидат на следующий кикофф; (3) программа отстаёт на ~5 недель при дедлайне 2026-09-01 — пересборка оставшихся недель (W3–W7 → 2 недели) за Артёмом.

Q count: 2376 (Δ0) · Version unchanged (v20260818)

---

## 2026-08-18 · v20260818 — RU-закладка (?track=ru) + спринт-категории Эрнеста (+45)

- **Закладки EN/RU разделены**: `?track=ru` — отдельный вход русского трека (запрос Артёма «разделим english и русский в разные закладки»). Пикер имён фильтруется по входу: EN — пять английских профилей, RU — 🐻 Эрнест + 🪆 Николь. Boot-reconciliation: сохранённый профиль не с того трека → тихий свитч через `confirmPlayer` (same-PIN sibling, guards контаминации сохранены) или пикер того трека. URL следует за профилем (`history.replaceState`); мост на learner home работает как раньше. Кросс-ссылки: «📕 Русский» добавлен на quiz home + setup + mathsprint + memory; на RU-входе ссылка переворачивается в «🇬🇧 Английский». `sw.js` fetch-матчинг → `{ignoreSearch:true}`, иначе `/?track=ru` мимо прекэша офлайн. Rationale: `design-decisions.md` §Surfaces.
- **+45 вопросов RU-банка** под спринт Эрнеста (`plans/ru-track-ernest.md`): «RU: Синтаксис» `ru_sin01–15` (основа, типы сказуемых, односоставные, виды связи, члены предложения) · «RU: Причастия и деепричастия» `ru_pr01–15` (залог, вид, Н/НН причастий, обороты и пунктуация) · «RU: Сложное предложение» `ru_sl01–15` (ССП/СПП/БСП, знаки БСП, придаточные, косвенная речь). Registered: taxonomy §7 + schema. RU-банк: 130 items. Чипы/тоталы динамические — ручной регистрации в UI не требуют.
- **`ernest_ru.learning_path` перекомпонован**: окно 2→3 — Синтаксис + Причастия + Сложное; Морфемика/Н-НН → `next_unlock_options`. Основание: диагностика №2 24/45 (2026-08-18, `diagnostics/ru-ernest-diagnostic-2-results.md`) — синтаксис 33% на n=9, Н/НН причастий 0/2, сложное 67% чутьём без терминов.
- Контекст: Эрнест поступил в **Tamos Cambridge School, 10 класс** — рамка «pre-OGE / 9 класс» в family-profiles/kk-track устарела; правка профиля пойдёт отдельно по протоколу аппрува.

Q count: 2376 (Δ+45) · Version: v20260818

---

## 2026-08-03 · v20260803 — mathsprint: дуэль недели + errItems · RU: Математические термины (+16)

- **mathsprint.html задеплоен**: `errItems[]` в документах прогонов (с первого послелагерного прогона Дробей видно, какие именно примеры падают) + «Дуэль недели» — ротация ord→pct→frac→int→lite с якоря пн 03.08, баннер с лучшим недели, 🏅 в списке режимов. SW-кэш бампнут (mathsprint в прекэше — без бампа устройства держали бы старый JS).
- **+16 вопросов `ru_mt01–16`** — категория «RU: Математические термины» (терм-канал math-track, ярус-1 ★; input 7 · gap 6 · mcq 3, все B1). Регистрация: taxonomy §7, schema, ru-track план (11 категорий). `learning_path.active_categories` nicole_ru патчится вслед за деплоем (окно 2→3).
- **Физика — решение (по ревью)**: отдельного трека нет — та же инфраструктура; лёгкий слой с октября каждой второй сессией + декабрьский мини-пробник формата добора; план §Ритм и механика + строка A14.

Q count: 2331 (Δ+16) · Version: v20260803

---

## 2026-08-02 · docs+code — Math track: ревью → дуэль-ротация + errItems, math-session skill, терм-пересчёт

- **Полное ревью трека (запрос Артёма)**: подход подтверждён — ограничение не математика, а жанр/язык/формат (все 3 промаха Part A нематематические; обучаемость «один показ → перенос» стабильна S1–S9). Свежий Firestore: 31.07 Целые-10 43,8 с/0 — рекорд на следующий день после пробника (в лог дописано); Дроби — плато ровно 2 ошибки × 4 прогона; Порядок/Проценты/Профи — 0 прогонов за всё время (уклонение в комфортные режимы).
- **mathsprint.html (код; не задеплоено, версии не бампались)**: (1) `errItems[]` в документе прогона — {q, a, in, v?} по каждому несходу с первого раза, кап 10 — диагностика точностных плато; общий `scoreDoc()` для push/flush; `data-flow.md` обновлён. (2) «Дуэль недели» — второй титул к замороженной классике «База, 10»: ротация ord→pct→frac→int→lite по понедельникам с 2026-08-03, баннер с лучшим недели + 🏅 в списке режимов, тап = выбор. Проверено на localhost (ONLINE=false): ротация/баннер/клик/errItems-путь чисто, консоль пустая. Доктрина §6 (no competitive ranking) — конфликта нет: семейная таблица mathsprint — установленное решение плана вне английской системы.
- **`math-session` skill** (новый, в CLAUDE.md): протокол из плана §Ритм и механика + уроки инцидентов в одном месте — reads, opus-чек, Excalidraw-протокол, показ→сама, холодные проверки, дозировка ритуалов, fabrication guard + JSONL-сверка, шаблон логирования. Закрывает риск класса S4 (параллельная ветка без контекста). CLAUDE.md ужат до 519 слов (заходил в CI-буфер).
- **Терм-дорожка пересчитана**: 26 терминов яруса 1 при 1–2 новых/сессию к 1.09 не закрываются → ★-набор (14, помечены в инвентаре) к 1.09, остальное к 1.10; второй канал — категория «RU: Математические термины» в квизе nicole_ru (решение принято; вопросы — таблицей на аппрув, вставка + патч `learning_path.active_categories` следующим шагом).
- **Жанр-разминка** в плане (2 микро-жанровые задачи/сессию с сентября, источник — matol вне пула v2). **Гигиена**: блоки «Столбик» и «Чекпойнт» фазы 0 ужаты до статусов (история — в логе); в лог — дополнение 31.07.

Q count: 2315 (Δ0) · Version unchanged (v20260725; правки mathsprint локальные, деплой отдельно)

---

## 2026-07-27 · docs — Math S8: столбик взят · уголок в багаже · friction ввода

- **S8 (Николь, ~59 мин контента)**: разминка — Тип 2 на холоде: 16,2 (направление, Тип 1 вместо Типа 2) → самокоррекция 20 от нейтрального вопроса о методе + третий свой метод (100:90×18). Столбик: дефолт снова дистрибутивный (замер №2), формат со сдвигом взят с одного показа (456×38 → 17328 на бумаге, стрелка сдвига своя); в дистрибутивной попытке сумма 27328 ❌ — класс ошибки S7, в столбике не воспроизвёлся (сдвиг страхует сложение). Уголок 848:4=212 чисто по шагам — знаком со школы (демо шло до попытки, замер не холодный); остаток в середине / ноль в частном → разминка S9.
- **Само-разбор (запрос Артёма)**: по сырому транскрипту — 16 реальных реплик, фабрикаций нет, хук молчал (первая полная math-сессия на sonnet-5). Улучшить: (1) пропущена неверная сумма 27328 — «всё верно» сказано без пересчёта; (2) канал ответа не задан в задании → ~23 мин мышиных картинок; (3) уголок: демо до проверки — замер не холодный; (4) фрейм «новый приём» → протест «знала с 3-го класса», подавать как «формат контрольной».
- **Friction ввода — главный вывод**: мышь нечитаема, бумага+фото работает, но фотать не нравится; тача у ноутбука нет (GetSystemMetrics=0). Варианты к решению до S9: Excalidraw-комната с iPad (живая доска, чтение из браузерной панели CC) · режим «Столбик» в mathsprint (клеточный ввод, «новый навык = новый режим») · Учи.ру для солодриллов · графпланшет (задел на геометрию). Ежедневка уходит с бумаги; таймированные прогоны и пробники остаются бумажными (формат экзамена). **Решение (вечер 2026-07-27)**: Excalidraw-комната протестирована живьём с Артёмом (Galaxy + S Pen ↔ браузерная панель CC, синк в обе стороны, рукопись читается отлично) — принята стандартом с S9; протокол старта (разминка в чат + параллельный подъём доски + ссылка отдельной строкой) — в плане §Ритм и механика.

Q count: 2315 (Δ0) · Version unchanged (v20260725, приложение не тронуто)

---

## 2026-07-26 · docs — RU-track: 14-day gap surfaced, Н/НН single-Н gap closed

- **Adherence check via live Firestore** (`players/nicole_ru`): last activity 2026-07-12, one day of practice total since the 2026-07-09 launch (35 items, 3 sessions same morning). W2 kickoff (НЕ, слитно/раздельно/дефис) never run; program calendar was already into W3 (mock week) with nothing beyond W1 touched. Программный трекер (`progress/ru-program-tracker-nicole.md`) unchanged since launch — confirms no fold has happened.
- **Н/НН diagnosis**: 9/17 (53%), and all 5 wrong answers share one signature — «нн» written where «н» was correct (серебряное, комариный, ветреный, румяные, зелёная). Clean single-cause finding: defaults to doubling, never checks the single-Н triggers. Морфемика holding strong at 17/18 (94%) — no action needed there.
- **Targeted reteach run** (not a fresh W2 kickoff — closing the open W1 hole first): taught the three single-Н triggers (suffix -АН-/-ЯН-/-ИН-, непроизводные, the «ветреный» exception) against her own missed words, then tested 6 unseen bank items one at a time — 6/6, including the ветреный/ветряная discrimination pair with a correct verbal rule explanation (not a lucky guess).
- Logged `exercise: 'kickoff'` row (canonical total:1/correct:1 marker, real 6/6 detail in `items[]`/`meta`) + first `coach_notes.recent_observations` entry for `nicole_ru` (doc had none before — Coach tab is hidden for this profile, so this is the first write to that field). W2 kickoff still outstanding — flagged, not run today.

Q count: 2315 (Δ0) · Version unchanged (v20260725, приложение не тронуто)

---

## 2026-07-26 · docs — Math S7: A2 закрыта · график до лагеря · хук поймал инцидент №2

- **S7 (Николь, ~29 мин)**: холодный чек вычеркнутого из S6 — 4/4; Тип 3 взят (вывела сама, обратив Тип 2); **проценты + пропорции (A2) закрыты целиком**; повтор отношений на новом варианте (средняя часть) чисто; столбик — найдена дыра формата: дистрибутивное разложение вместо классического RU-алгоритма (предсказано планом S6), деление уголком не проверено.
- **Инцидент №2, ущерб нулевой**: opus-5 снова дописал реплику за ученицу (`user36`) — первое живое срабатывание `detect_fabricated_turns.js` посреди детской сессии: строка процитирована, ответ переспрошен, ничего не засчитано. Оба инцидента (S6, S7) — на claude-opus-5; третий → обсуждать дефолтную модель математических сессий.
- **Решения Артёма**: ритуал старта дозирован — полный формат на одной контрольной задаче за сессию (расписывать каждый пример утомляет); график сжат к отъезду в лагерь: S8 столбик+уголок · S9 отрицательные · S10 порядок действий+мелкие хвосты · Part A + бонус; выпал день → жертвуем S10, Part A не двигается.
- **Пробник v1 перекроен**: Part B → после лагеря (нетренированные B-кластеры, перерыв не влияет); в Part A добавлен бонус-блок A11–A12 (экс-B-4/B-6 — единственные посильные без нетронутой теории); послелагерная Part B добирает замены из пула; v2 — подтверждающий гейт после «всё повторим».

Q count: 2315 (Δ0) · Version unchanged (v20260725, приложение не тронуто)

---

## 2026-07-25 · docs — Math S6 incident: лог пересобран, поставлен fabricated-turn guard

- **Инцидент**: claude-opus-5 на уроке математики Николь (S6) семь раз дописал её реплики внутри собственных сообщений, ответил на них и залогировал выдуманные результаты. Форензика по сырому JSONL сессии; запись S6 пересобрана — из 10 реальных ответов чистых 7, утечки ответов на экран помечены; статус A2 откачен; сфабрикованные «события» (просьба про английский, вопрос «зачем») вычеркнуты. Репорт ушёл в Anthropic через /bug (requestId пяти сбойных ответов внутри).
- **Ритуал старта переопределён** (решение Артёма): три строки «ищу → считаю → ответ», ввод «3 образца на демо-задачах → с 4-й сама»; задачу ученицы учитель не дорешивает никогда.
- **Защита**: `.claude/hooks/detect_fabricated_turns.js` (Stop + PreToolUse) — сканирует ответы ассистента на маркеры сфабрикованных реплик, блокирует инструменты записи и принуждает к оповещению. Пайп-тесты 5/5, боевое срабатывание доказано.

Q count: 2315 (Δ0) · Version unchanged (v20260725, приложение не тронуто)

---

## 2026-07-25 · v20260725 — Trainer cross-links + English-only family boards

- **Cross-links between the three tools** — quiet footer row on every landing surface: quiz learner home + builder setup screen get «⚡ Устный счёт · ◈ Память»; mathsprint/memory menus get «🇬🇧 Английский» + each other. Hrefs (`./`, bare filenames) match `sw.js` precache keys exactly, so switching works offline; no manifest `scope` set → in-scope navigation keeps installed PWAs in their standalone window.
- **Family boards show English profiles only** — `ruTrack` docs (`nicole_ru`, `ernest_ru`) had crept into learner-home Family streaks/levels (7 rows), the who-played-today pills, and the builder Family tab (leaderboard, co-op weekly totals vs the 25-session target, CEFR strip). All three renderers now filter `FAMILY_MEMBERS` on `!m.ruTrack` → 5 rows. Deliberately unfiltered: login name picker (kids enter RU profiles there) and `exportForAI` (stats-review must keep seeing RU docs).

Q count: 2315 (Δ0) · Version: v20260725

---

## 2026-07-24 · v20260724 — Memory trainer (`memory.html`): new standalone surface

- **New surface `memory.html`** — working-memory/attention trainer, requested by Artem («забываю, о чём говорил, если отвлёкся»). Mathsprint template: same look, PIN hashes, Firestore REST helpers; family board in new `memory_trainer_scores` collection (one immutable doc per run, top-50 prune, Artem-PIN-gated deletes). Rationale + evidence review: `references/design-decisions.md` (2026-07-24 entry).
- **4 modes, all standard lab paradigms, adaptive-level scoring** (score = level reached, not time): «Помехи» (Brown–Peterson: запомни символы → 15 с обязательных «чёт/нечёт» → вспомни среди ловушек; validity gate ≥6 ответов при ≥60%), «N-назад» (spatial n-back, Jaeggi 2008: 500 мс/3 с, 20+n проб, 6 целей, ≤2 ош → уровень вверх; resume-level per player), «Кубики» / «Кубики ⇄» (Corsi span forward/backward, 2 попытки на длину).
- **Evidence-honest UI**: menu carries a «Что это тренирует — честно» disclosure (near transfer only, дозировка 10–15 мин 3–5×/нед); every run ends with a rotating strategy/lifestyle tip (resumption cues, chunking, сон, аэробика) — the part that transfers.
- Icons: `memory.svg` + generated `icon-memory-180.png` + `memory.webmanifest` (standalone install, «Память»). Infra: Pages allowlist, `sw.js` precache + CACHE bump, `firestore.rules` block, README root-files row, `docs/data-flow.md` surface row.
- Playwright smoke test (localhost, offline mode): full «Помехи» run (pass L3 → double fail L4 → score 3, PB framing), full «Кубики» run (score 4), n-back round render, abort path — no console errors.

Q count: 2315 (Δ0) · Version: v20260724

---

## 2026-07-23 · v20260723-r2 — Kill keyboard writing suggestions in answer fields (Android)

- Artem reported a "pre-filled answer" ghost text appearing in answer inputs ("autoprompt"), on the Android PWA. The app never pre-fills any field — the injection is the keyboard/browser layer (Gboard predictive text via Chrome).
- **Root cause of why the existing `autocorrect = 'off'` didn't help**: Chrome 134+ standardised `autocorrect` as a *boolean* IDL property, so the JS assignment `field.autocorrect = 'off'` assigns a truthy string — reflecting as autocorrect **enabled**. On Android, `autocorrect=off` + `spellcheck=false` is what Chromium maps to the IME `textNoSuggestions` flag that tells Gboard to stop suggesting. Fixed by using `setAttribute('autocorrect','off')` on all four dynamic quiz fields (`input-field`, `transform-field`, `wordform-field`, `errcorr-field`).
- Also added the standard `writingsuggestions="false"` attribute (Chrome 136+/Safari 18.4+) to every free-text answer surface, incl. coach textarea (`coachInputField`) and both spell-help inputs — suppresses browser-provided inline writing suggestions on both platforms. Coach textarea keeps `autocorrect="on"` deliberately (`coachNormalize` already compensates for the iOS l'm/I'm swap).
- No behaviour change beyond suppressing suggestion overlays; attributes are no-ops on browsers that don't support them.

Q count: 2315 (Δ0) · Version: v20260723-r2

---

## 2026-07-11 · v20260711-r3 — Switch-player button in the main app

- **Gap found via live family use** (shared device, Anna → Nicole): the name picker only ever appeared on first run — no way to switch players afterwards. Now the **player name in the header is tappable** → opens the existing PIN-gated name picker (same contamination-guarded `confirmPlayer` path as first login; wipe-before-sync preserved).
- Picker gets a **Cancel** button, shown only when someone is already logged in (first-run choice stays mandatory).
- DOM-only verification in preview (no login → no Firestore writes, per probe-safety rule).

Q count: 2315 (Δ0) · Version: v20260711-r3

---

## 2026-07-11 · v20260711-r2 — Math Sprint: app icon + leaderboard readability

- **Icon set**: `mathsprint.svg` (favicon + Android/maskable, safe-zone bolt on navy), `icon-math-180.png` (apple-touch-icon), `mathsprint.webmanifest` (standalone install, «Устный счёт» on the home screen). Pages allowlist extended; head links wired.
- **Board readability** (Artem's live feedback «сложно понять результат»): each row now shows the error count («9 ош · 11.07»), and time is always plain seconds — «97,7 с» instead of «1:37,7» (single unit, glance-comparable).
- SW CACHE bump so phones refetch the updated mathsprint.html.

Q count: 2315 (Δ0) · Version: v20260711-r2

---

## 2026-07-11 · v20260711 — Math Sprint: family mental-math game ships (math track)

- **New surface `mathsprint.html`** (root, outside the quiz engine — scoped §6 exception, `references/design-decisions.md`): timed sprint, 7 modes (Лайт/База/Дроби/Целые/Проценты/Порядок/Профи) × 10/25, auto-advance input, retry-until-correct + **+5 с penalty per error** (accuracy over speed), «Самые медленные» post-run review, PIN identical to the main app (honors `pinHash_*` overrides).
- **Online family leaderboard** — long ranked per-run list (minesweeper «Times» style): Firestore `math_sprint_scores` (rules deployed same day: create-only, runs immutable, delete open for prune/curation), per-combo `runQuery` + 60 s cache + no polling (Spark quota), offline outbox (≤20 pending runs auto-pushed on reconnect), client prune to top-50 per mode×length, row delete + board clear PIN-gated to artem.
- **Phase-0 content** (`plans/math-track-nicole.md`): Дроби incl. смешанные ↔ неправильные (␣-key mixed-number input, enforced несократимый вид) + 0,4→дробь; Проценты — три школьных типа + пропорции; Порядок — порядок действий (формат пробника A1).
- **Data-driven gates**: 25-сет открывается «10-сет ≤ 100 с, ≤1 ош» (все игроки); Профи у Николь — до «База 10 ≤ 60 с, ≤1 ош». Greyed tiles show unlock conditions; unlock is automatic from results (local + online union).
- Mode mixes **frozen from launch** (leaderboard comparability); new skills = new modes («Делимость» — Sep 2026, roadmap).
- Infra: Pages allowlist + README root-files row; `sw.js` now precaches mathsprint (offline play; updates ride CACHE bumps); `docs/data-flow.md` surface row; weekly duel protocol (База 10, воскресенье) in the plan.
- Plans: `math-track-nicole.md` (Artem's rewrite: пути к РФМШ для гражданки РФ, фазы 0–4, календарь 2026/27) + new `math-track-ernest.md` (broad numeracy) + `kk-track-ernest.md` (parked) + Nicole baseline probe v1 instrument.

Q count: 2315 (Δ0) · Version: v20260711

---

## 2026-07-10 · v20260710 — Ernest joins the RU track

- **`ernest_ru` profile** («🐻 Эрнест», same PIN as ernest, separate stats doc): full 69-item RU bank, `level_cap: B2` (older kid — закрепление tier available from day one), no `study_plan` yet — his OGE-year program lands after the placement diagnostic is scored.
- Sibling switch on both his homes; bridge labels now derived from the sibling profile (emoji + generic «Русский язык») — was hardcoded to Nicole's pair.
- `ernest_ru` in tools `PLAYERS`: integrity baseline (7 players), backups, stats-review.
- **Placement instrument** `diagnostics/ru-ernest-diagnostic-1.md`: 38 single-choice items, 40 min, grades 5–8 span (13 орфография / 10 пунктуация / 8 морфология / 4 синтаксис / 3 речь), no topic labels on items, key + cluster map + scoring thresholds for Artem.

Q count: 2315 (Δ0) · Version: v20260710

---

## 2026-07-09 · v20260709-r4 — RU terminology foundation layer

Day-1 data response (first-pass 67% with term-guessing; weak-replay 100%): teach the metalanguage before testing it.

- +16 items `ru_mor21–36` (Морфемика 20→36, bank 2315): part-of-speech recognition on word families, find-in-sentence, morpheme identification, 3 input productions. intro micro-lesson on 21/36 морфемика items (was 2) — card teaches first, then asks; intro examples never coincide with the answer.
- `kickoff`/`mock` canonical types in `log_exercise.js` + `exercise-types.md` §13 — program events for dashboards' plan-vs-fact marks.
- Kickoff #1 script re-aimed at «слова о словах» — section in `plans/ru-track-nicole.md`.

Q count: 2315 (Δ+16) · Version: v20260709-r4

---

## 2026-07-09 · v20260709-r3 — serializer fix: map keys with '/' no longer dropped

One-line data-loss fix found while reviewing Nicole's first RU session. `_fsValue` silently skipped map keys containing '/' (RTDB-era guard carried into the s87 Firestore migration) — `catStats['RU: Н/НН']` + session `catBreakdown` never reached the cloud (17 answers invisible to dashboards/topic status). Guard narrowed to the Firestore-reserved `__` prefix; unit-verified. nicole_ru `catStats` backfilled from `qStats` (Н/НН 14/17) after deploy. Full entry: `references/bug-log.md`.

Q count: 2299 (Δ0) · Version: v20260709-r3

---

## 2026-07-09 · v20260709-r2 — RU-track program dashboards

Two views over one data source (`study_plan` + `daily_activity` + exercises rows), deviations computed at render, never stored.

- **Nicole learner card «Подготовка к школе»** (home, gate: `study_plan` on current player): progress bar to 1.09, week chips ✓/current, three-state «Сегодня» line, mock trajectory with positive-deltas-only rule. No miss counters — a gap renders as «продолжим сегодня?» (doctrine §5/§6).
- **Artem admin «Программа Nicole-RU»** (builder Stats tab, gate `currentPlayer === 'artem'`, NOT Family tab): plan-vs-fact calendar 8 weeks × days (✓/partial/miss/today), weekly kickoff/диктант/mock marks, ⚠ banner at ≥2 consecutive below-target days, per-topic status table (⚪/🔵/🟢 at ≥80% & ≥20 items), mock line from the 7/20 baseline. Read-only remote fetches.
- `nicole_ru` added to tools `PLAYERS` (`_firestore.js`): integrity checker baseline (seeded), nightly backups, stats-review sweep. Checker's hardcoded "5 players" summary now uses `PLAYERS.length`.
- data-flow: PWA cross-player read-only reads documented (family boards + program admin).

Q count: 2299 (Δ0) · Version: v20260709-r2

---

## 2026-07-09 · v20260709 — RU track W1: Nicole grade-7 prep goes live

Russian grade-7 entrance-prep track for Nicole (7/20 on the TAMOS entrance test; program deadline 2026-09-01). Plan of record: `plans/ru-track-nicole.md`. Program started same day — `study_plan.start_date` 2026-07-09.

- **Profile `nicole_ru`** («🪆 Николь», same PIN as nicole, separate Firestore doc — zero contamination surface). Seeded with `learning_path` (window: Морфемика + Н/НН, cap B1) + `study_plan` (8 weeks, daily target 10 items, диктант weekly, mock from W3).
- **Engine**: RU category gate in `selectQuestions` + category chips (single choke point — `RU: ` categories visible only to ruTrack profiles, both directions verified); `intro` rule-card now renders for every question type (scaffold-fade); `daily_activity` per-day {items, correct} store bumped in both record paths (adherence data for program dashboards); `study_plan` read-only on PWA (excluded from `buildPayload`); fresh-profile bootstrap in `loadFromFirebase`; learner-home RU routing (quiz-only, Coach hidden, no English fallback); **sibling one-tap profile switch** nicole ↔ nicole_ru (PIN skipped only on matching pinHash; goes through `confirmPlayer` guards).
- **Content W1**: 53 questions — `RU: Морфемика и части речи` (20) + `RU: Н/НН` (33); gap н/нн chips, mcq classification, input whole-word production, error_correction; 5 intro algorithm cards; exceptions flagged `hard`. Prefixes `ru_mor`/`ru_nn` registered.
- **Reference**: `ref/ru.html` — состав слова, части речи, Н/НН decision tree + исключения; hub card «🇷🇺 Русский · 7 класс».
- Docs: firestore-schema (`study_plan`, `daily_activity`, nicole_ru), data-flow, system-mechanisms §4 (13 stores), question-schema (intro all-types + RU cats), taxonomy §7, roadmap RU section, plans README.

Q count: 2299 (Δ+53) · Version: v20260709

---

## 2026-07-04 · v20260704 — conversational-register lane (T1 + CR1–CR4)

Ships Artem's 2026-07-03 priority call: spoken-casual English as an **absent variety** (acquired-through-text profile — `docs/audience-profiles.md` §1, `references/design-decisions.md`). Full lane record: `plans/conversational-register-lane.md`.

- **T1 phrase-pool hygiene** (prerequisite): 💤 `dormant` status + 60d aging (weight-4 tags exempt) + auto-revive on re-capture + priority score (tag weight × recurrence) + top-20 drill queue in the tracker md. Backfill sweep at `--aging-days 50`: 71 actives → 18 (all 12 biz_oil kept), 53 dormant-revivable. `update_coach_notes.js --apply-aging`; stats-review PROTOCOL step 6 runs it.
- **CR1** — `free-write` skill: casual "hallway/pub" mode (coach models informal register; correction polarity flips — correct-but-formal is the primary catch); `register_rubric` now REQUIRED on every CC free-write log (ends the rubric data drought).
- **CR2** — register-down capture polarity in free-write, exercise-session capture card, and register-check (correct-but-over-formal → `formal → casual [tag]` swaps).
- **CR3** — `conversational_register` catalog topic #7: worker 3-tier ladder (recognize triples → re-register down → sustain casual in scenario; wrong register fails the tier even with clean grammar) — worker redeployed `593bd005`; PWA `COACH_WEAK_SPOTS_CATALOG` row maps `cat: Register` → **P1 finally routes Artem's worst quiz category** (40%, n=15). CC parity automatic via the shared catalog.
- **CR4** — `EX_WEEKLY_TARGETS.artem` slot #12 "Hallway talk — casual register" (total 11→12); `weekly-slots.md` updated.
- Docs: exercise-types §11 IDs + system-mechanisms §2.5 → 7 topics; plans README + open-items updated (T1 ✅, T2 ✅).

- **Follow-up (same day, repo-only — T3 + T5 + capture policy)**: PV tracker gains a stats-review-regenerated **Top-5 drill queue** (get around to → get through ¹ → come up with → read up on → cut down on; PROTOCOL 6c); ⚠ A2 direction traps route to the retention probe (R2 bucket 4 + exercise-types §12); `interview_rubric` aggregation live (PROTOCOL step 3 + rubric § Stats-review aggregation + firestore-schema rows) — unblocks shadow_feedback; **capture policy decided (Artem)**: exercise-session swaps go direct 🔵 via `capture_swaps --source ex` (roadmap Quality #6 closed; safe post-T1).

- **Privacy layers 1+2 (same day)**: Pages → artifact deploy serving app files only (index.html, sw.js, manifest, icons, ref/) — learner data URLs (diagnostics/, progress/, archive/) now 404, verified live; nightly backups (full coach_sessions transcripts) moved to the **private `english-quiz-backups` repo** via write-scoped deploy key — history migrated, public `backups` branch deleted, local `backups` remote added for recovery. Layer 3 (private repo + Pro) = open decision in `plans/open-items.md`.

Q count: 2246 (Δ0) · Version: v20260704 · Worker: 593bd005

---

## 2026-07-03 · v20260703 — holistic-review remediation + Nikolay teardown

Big maintenance session driven by the 2026-07-03 holistic review. Four repo commits + this deploy.

- **Incident**: `players/artem` root doc had been replaced (not patched) by a CC weak-spots end-write on 2026-05-20 — qStats (1,883), catStats, createdAt, recentSessions, phrase_tracker, learning_path lost; silent for 6 weeks. **Restored** from `backups/2026-05-20` via masked PATCH (coach_notes/lvlStats/totals kept live). See `references/bug-log.md`.
- `check_player_integrity.js`: three new shrink/removal invariants; baseline no longer auto-ratchets on count shrink (`--accept-shrink`).
- Word caps raised: CLAUDE.md 550, SKILL.md 800, 30-word enforced buffer; `stats-review` procedure moved to skill-local `PROTOCOL.md`; trimmed substance restored; trim-safety rule in `doc-style.md`.
- Loop wiring: `stats-review` PROTOCOL step 8 regenerates the weak-spots tracker; `weak-spots-session` consumes it (lane checks, unified NOW/NEXT/AMBIENT/PARKED/CLOSED vocabulary); `tools/loop_maintenance.js` staleness tripwire runs daily via `mistakes-review`; `tools/mistake_verdicts.json` verdict ledger (mistakes-review → stats-review → quiz-development); `update_coach_notes.js` warns on weak_patterns >8. Rebase-merged with PR #16 (signals-pipeline hardening: `promote_signals.js`, `_signals.js` CC exercise auto-fold, `weak-spots-rubric.md`, tracker refresh 2026-06-19) — the two efforts compose: #16's promotion tooling slots into PROTOCOL step 7, its rubric into step 8.
- Docs sweep: 7 contradictions ruled against live data (Anna window 3; Egor learner-shell; free_write = Anna keystone; date-only versioning; 6-topic catalog; unlock 1+3; category counting rule), data-flow.md rebuilt for the live-AI era, roadmap/coverage-matrix de-duplicated + shipped rows closed, plans archived/reindexed, worker/README `/v1/audio` documented.
- **Nikolay teardown** (this deploy): FAMILY_MEMBERS entry removed; worker `ALLOWED_PLAYERS` redeployed (`e97f713d`, gate verified rejecting `nikolay`); Firestore `players/nikolay` + 5 subdocs deleted after local snapshot.
- **Follow-up (same day, repo-only)**: stats-review proposals applied — artem `weak_patterns` 23→8 structured `[Domain · TIER]` labels (dossiers → tracker appendix), Anna/Egor engagement notes, Ernest window 6→4; `deploy-build` gains a mandatory docs-sweep step; new `tools/check_doc_pointers.js` dead-pointer lint in CI (--strict; found + fixed 7 on first run); `pv_cold_streak.js` now ingests production-format particle_sort (get_around_to ×2 fail now visible) + both PV trackers refreshed; fractional `totalCorrect` traced to CC half-credit exercises (documented, not a bug); **retention lane shipped** (`plans/retention-lane.md` R1–R5): post-CLOSED expanding probes (+2w/+6w/+4m), monthly ~15-item `retention_probe` type, untrained-sibling retirement rule, owned-material lifetime sampling; `loop_maintenance` counts overdue probes (4 due at ship).

- **Folder audit cleanup (same day, repo-only)**: ~152MB local cruft purged (125MB personal claude.ai export deleted per Artem, 17MB index.html .bak copies, stale worktrees, root tmp/, 55 gitignored one-off scripts — safety-zipped to session scratchpad first); `tests/` → `diagnostics/`; `migration/` dissolved (setup runbook + README_FIRST archived to `plans/archive/`); `tools/uploads` → `archive/phrase-harvests-2026-05/`; real `README.md` written (repo map: folder contract + 5 house rules); `.gitignore` one-off blocklist replaced by the scratchpad rule; `audits/` + `archive/` now deliberately tracked; `library_drafts/` + `ref/` routed (CLAUDE.md, data-flow, system-mechanisms §2.9); backups get nightly `exercises_library` snapshot + 90-day retention pruning.

Q count: 2246 (Δ0) · Version: v20260703

---

## 2026-07-01 — IGCSE/IB diagnostics + two-tier weak-spots tracker (no deploy)

Repo-only session; no index.html change, no version bump.

- `tests/` — IGCSE/IB entrance diagnostics + prep packs for Ernest and Nicole (14 files, commit b082b67).
- `progress/weak-spots-tracker-artem.md` — two-tier tracker landed (#15, c945287): domains = budget layer, patterns = action layer (NOW/NEXT/AMBIENT/PARKED/CLOSED), lane routing (PV → inventory, production → speaking lane).
- Catch-up note: mid-June CC sessions (2026-06-14 article re-test cycle `artem_ad_…_rtst`; 2026-06-16 register work) ran without version-log entries — evidence lives in the tracker and coach_notes.

Q count: 2246 (Δ0) · no deploy

---

## 2026-06-08 · v20260608 — temporary demo guest player (Nikolay)

Added a short-lived guest identity so a friend can try both surfaces (HTML quiz + Coach/API exercises) without touching family data. Isolated Firestore identity; no contamination of the five real learners.

- `index.html` — added `nikolay` to `FAMILY_MEMBERS` (PIN 3092, SHA-256 hashed; coachLanguage `ru`, level B1). Appears in the name picker.
- `worker/index.js` — added `'nikolay'` to `ALLOWED_PLAYERS` (the Coach/API path hard-rejects unknown players at the validation gate). Worker redeployed (`english-quiz-coach`, version `97e216bb`); smoke test confirmed `ok:true` for player `nikolay`.
- Both entries carry dated `TEARDOWN` comments. **Cleanup after the trial:** delete both entries, redeploy Pages + worker, delete the Firestore `players/nikolay` doc.
- Caveat: daily `mistakes-review` / `stats-review` sweep all players, so his demo activity will surface as noise until torn down. Acceptable for a short window.
- No question changes (count 2246). Version bumped in meta, hdr-ver badge, sw.js cache key.

Q count: 2246 (Δ0) · Version: v20260608

---

## 2026-05-20 · v20260520 — mistakes-review fixes: 3 stem tightenings

Landed the 3 quality fixes from the 2026-05-20 mistakes review (issue #14). All re-stems keep biz_oil/kpmg/home_daily theme tags (Artem-relevant) and follow his documented preference for a single correct answer over alt-answer widening.

- `aph32` (Articles): re-stemmed "We are at ___ stage where costs must be cut" → "There comes ___ stage in every turnaround when costs simply have to be cut." Existential *there comes a…* forces `a`; removes the defining-relative-clause licence for `the` that drove Artem 0/4.
- `aph33` (Articles, latent): noun swap "point of no return" → "critical juncture" so the indefinite `a` key no longer competes with the fixed *the point of no return* idiom.
- `lki25` (Linking Words): tightened hint + exp so plain `if` is off-target; the item now explicitly drills the emphatic proviso (provided/as long as). Was Artem 0/1, lw="if".
- Backstops clean: `lint_questions.js` 2246, `check_transform_keywords.js` 55. No total/coverage change (no adds/removes).

## 2026-05-13 · v20260513-r2 — drill-mode prompt diet + structural item card

Anna fed back that the live-AI drills "all look like Free Write" — exercises hard to spot, especially short ones like spelling. Today's EC#1 transcript surfaced a smoking-gun: she "corrected" an embedded illustrative example sentence because the real drill item was visually indistinguishable from the surrounding prose (a split-attention violation per Cognitive Load Theory).

Web research informed two differentiated tracks. Adults: 2025 Frontiers study + multimedia-learning meta-analyses show KCR ("correct response only") outperforms KCR+elaboration; Babbel adult pattern (1-2 sentence rule + drill, not paragraph) wins on retention. Kids: explicit correction remains evidence-backed, but gamification + emoji rhythm (Duolingo pattern) pairs better than dense prose. Two prompt tracks shipped on this basis; rendering fix universal.

**Worker** (6 drill modes — phrase_swap, translation, error_correction, spelling, particle, article; FW + weak_spots untouched):

- New `feedbackDepthInstructionsForDrill`. Adult tiers (`light`/`medium-light`/`detailed`): `✓` + ≤4-word rule tag on CLEAN, 1-2 sentence MISS, no extra example. Kid tiers (`medium-kid`/`medium`): same brevity + streak counter every 2-3 CLEAN + occasional rule recap (1 of 3) + emoji rhythm.
- Universal rules: ban standalone illustrative example sentences (the EC#1 bug); require `---` separator before next item; item-label format `**Item N/total:**`.
- New `drillOpeningInstructions`: drops the FW-style greeting/meta-instruction opening across all 6 modes; turn 1 is just the item card.
- Anna's `detailed` tier — original spec (3-5 sentences + L1 contrast + extra example) preserved only for FW; drill-mode variant capped at 1-2 sentences with no extra example.

**PWA**:

- New `coachRenderDrillTurn(content)` — splits assistant message on the last `---` and wraps trailing block in `.coach-msg-item-card`. Heuristics reject session-end tables (starts with `|`) and oversize trailing blocks (>320 chars); opening-only `**Item N/M:**` messages without separator also get carded.
- New CSS `.coach-msg-item-card`: 3px accent left-border, subtle bg tint, accent-coloured `<strong>` for the "Item N/M:" label.
- 12 drill mid-session call sites routed through new renderer (psd, td, ec, ad, pst, spd — each start + send). Weak spots, Free Write, escalation, and all `feedback-correct` end-of-session table renders kept on `coachRenderMarkdownLite`.

Synthetic renderer probe: 6/6 cases pass, including the EC#1 regression scenario (embedded italic example stays in feedback prose, real drill item gets carded distinctly). Visual confirmed in preview — 3px accent left border + bg tint render as intended. `node --check` clean; question count unchanged.

Worker version: `97416e24-f31c-43b7-865e-61aa9f50910f`.

Q count: 2246 (no change) · Version: v20260513-r2

---

## 2026-05-13 · v20260513 — typo-vs-swap quality fix + stats-review rubric consumer

Two issues caught from Anna's first instrumented Free Write yesterday:

1. **Typo masquerading as register swap.** The worker prompt allowed pure orthographic differences ("one and a half ours → one and a half hours [leisure_sport]") to be emitted as lexical swaps, and the PWA accepted them — polluting `phrase_tracker`. Two-layer fix shipped:
   - `worker/index.js` Free Write `sessionEndInstructions`: explicit "Not a lexical swap" block with anti-pattern examples. Typos must go to `error_patterns_observed` as `spelling_*` pattern IDs only, no `→` entries. **Needs `wrangler deploy` to take effect.**
   - `index.html` `coachParseLexicalWeakPattern`: subsequence-based guardrail. Rejects same-word-count pairs where one word is a subsequence of the other with ≤2 chars missing (`ours⊂hours`, `wnt⊂went`). Preserves real lemma swaps (`take/make`, `in/at`, `from/on`). Transpositions (`thier/their`, `recieve/receive`) leak through by design — worker prompt is primary defense. 10/10 unit tests pass.
   - Anna's bad entry removed from `players/anna.phrase_tracker.entries` (8 → 7); independently verified.

2. **Stats-review rubric consumer wired.** The register rubric instrumented in r3 was dark — `stats-review` didn't read it. Now does:
   - `.claude/skills/stats-review/SKILL.md` step 3 + new `### Register fluency` output section.
   - `references/register-rubric.md` gains the "Stats-review aggregation" section: procedure (last-5 rolling mean, Δ vs prior 5, sparse-data caveat at n<3), flag rules, per-player output shape.
   - `references/firestore-schema.md` updated: stats-review consumer flipped to active.

Q count: 2246 (no change) · Version: v20260513

---

## 2026-05-12 · v20260512-r3 — Free Write register-rubric instrumentation (silent measurement)

Adds the project's first longitudinal signal for the stated mission ("improving conversational register"). Existing `assessment` block grades CEFR-general; this rubric scores register specifically — chunk reach, context fit, L1 calque load, conversational scaffolding. Dark instrumentation: never shown to learner, no `stats-review` consumer yet. Sets up P0.3 (tag register slips as `weak_pattern` subtypes) and P1.1 (productive-retrieval register-pair drill).

- `worker/index.js` Free Write `sessionEndInstructions`: `<session_meta>` now includes `register_rubric{ chunk_density: 1-5, register_match: 1-5, calque_count: int, discourse_marker_variety: int, confidence: 'high'|'low' }`. Inline prose anchors guide scoring; full anchors live in the ref doc. Free Write only — other drill modes left untouched.
- `index.html` `coachWriteSessionLogStandalone`: passes `meta.register_rubric` through to the `coach_sessions/{fw_*}` doc; defaults to `null` when worker hasn't been redeployed yet.
- `references/register-rubric.md` (new): canonical scoring guide. 4 dimensions + per-score anchors + scoring discipline + consumers + versioning rule.
- `references/firestore-schema.md`: `register_rubric` row added under the `coach_sessions/{sessionId}` table.

**Two-surface deploy**: PWA shipped here. Worker change requires separate `cd worker && wrangler deploy` from Artem's machine. PWA-first order is safe — old worker continues to omit the field, new PWA writes `null` until worker catches up.

Q count: 2246 (no change) · Version: v20260512-r3

---

## 2026-05-12 · v20260512-r2 — fix PWA Free Write lexical-swap capture leak

`coachMergeWeakPatterns` was dropping every lexical swap emitted by Free Write (and every Phase D drill) since the 2026-05-12 stats-sprawl cleanup — the partition branch said `// Lexical entries: no-op here; phrase_tracker is canonical` but no other code path wrote them to the canonical store. Net effect: Anna/Nicole/Ernest/Egor had **zero** Free Write lexical signal landing in `phrase_tracker`; only Artem's CC `capture_swaps.js` path worked. Anna's 7 entries were all from `psd` self-feedback; the other three players had 0 entries each.

- `index.html` `coachMergeWeakPatterns` (~11985): lexical entries now parsed via `coachParseLexicalWeakPattern` and written to `phrase_tracker.entries[]` with PWA capture-source rule (⚪ `first_pass` → 🔵 `active` on 2nd-session hit). Untagged-single-word skip preserved (mirrors `capture_swaps.js`). Mode-prefix routing for `sources[]`: `fw`/`wsd`/`td`/`ec`/`ad`/`pst`/`spd`/`pwa`.
- `fsMerge` payload extended to include `phrase_tracker` when the lexical handler dirties it; same single PATCH call.
- No worker / schema / UI change. `coachBuildPhrasePool` already filters out `first_pass` so noisy single-session captures stay quarantined.
- Verified end-to-end as Anna via `preview_eval` + independent Firebase MCP read; player state restored byte-exact post-test.

Q count: 2246 (no change) · Version: v20260512-r2

---

## 2026-05-12 · v20260512 — Nicole + Ernest free_write gate dropped

Test the `learning-system-design.md` §3 conversation-keystone hypothesis (children engage naturally with conversational AI). Original flip criteria in `audience-profiles.md` §5 (`level_cap: B1+` stable OR ≥5 Phrase Swaps + Weak Spots sessions ≥70%) couldn't be met while the gate held back the very surface that drives engagement. Override is reversible — stats-review owns the reinstate-on-frustration call.

- `index.html` FAMILY_MEMBERS: Nicole + Ernest `avoidTypes: []` (was `['free_write']`)
- `docs/audience-profiles.md` §2/§5/§6: record override + watch-list (frustration signals to reinstate the gate)
- `references/exercise-types.md`: free_write moved Avoid → Secondary (open hypothesis) for Nicole + Ernest
- `plans/archive/coach-live-ai-and-weak-spots.md` §7b: closed-with-experiment

Q count: 2246 (no change) · Version: v20260512

---

## 2026-05-11 · Session r4 — Phase D-3/4/5 live AI + per-type badges (v20260511-r3 → r7)

Five sub-deploys in one build session, closing the T1 rollout from `plans/archive/coach-live-ai-and-weak-spots.md`. After r4 every Coach picker type is live-AI primary; library survives as offline-only fallback across the board.

- **r3 (transient)** — quick label fix for Artem's reported "11 available" badge on Translation. The router was correctly going to live AI but `coachLoadMeta` left the library count in the badge text. Added `coachUpdateConvertedTypeAvailability` (superseded by r4 below). Visible to a small window of users between deploys.
- **r4 — Per-type badge signal (Option 2)**. Replaces "live AI" / "library only" with actionable per-type info: Translation + Error Correction show "N weak" (weak_patterns count), Article Drill + Particle Sort show `N%` accuracy from `qStats` for their category, Spelling Drill shows "N queued" from `spelling_log` since last drill, Weak Spots shows "N weak spots". Free Write empty when healthy (anytime activity). Offline / API-down degrades to "offline" / "paused" / "library only". New `coachUpdateLiveDrillBadges` + `coachCategoryAccuracyPct` helpers; `coachLoadMeta` skips dynamically-badged types via a `DYNAMIC_BADGE_TYPES` list. Live-converted types re-enable on `liveAvail`.
- **r5 — Phase D-3 `article_drill_live`**. One short sentence per turn with one `___` blank, rotates 4 article sub-categories (indefinite / definite for shared referent / generic zero / fixed-expression zero). 10 items default, max 15. Accepts `a`/`an`/`the`/`—`/`zero`/`no article` as equivalent for the zero case.
- **r6 — Phase D-4 `particle_sort_live`**. Base verb shown in context with `___` for the particle (player produces from semantic understanding, no menu). Rotates 3 PV tiers (literal, figurative single-particle, 3-part PV). 10 items default, max 15. Critical rule enforced in prompt: never reveal the full PV.
- **r7 — Phase D-5 `spelling_drill_live`**. Russian-gloss → English-spelling with three-tier scoring (exact / 1-2 letter near miss / wrong word). 8 items default, max 12. PWA passes `players/{name}/spelling_log` entries since last drill as `context.spelling_pool`; worker drills self-flagged uncertainty first, falls back to profile-driven generation. End-of-drill refreshes the "N queued" badge so drilled words drop off.

Worker session-end branch now handles all 5 Phase D drills via one consolidated return path with mode-specific `items_drilled` shapes. Each deploy: PWA + worker, `node --check` + version consistency + doc caps green, preview probe (3 routing cases per type). All 5 modes covered by curl tests in `worker/README.md`.

Plan in `plans/archive/coach-live-ai-and-weak-spots.md` status log has per-phase detail. T1 + T2 tracks fully shipped per the plan; only Phase E (this docs sweep) remains.

Q count: 2246 → 2246 (no change) · Version: v20260511-r7 (final of five)

---

## 2026-05-11 · Session r3 — Weak Spots drill + Phase D-1/D-2 live-AI rollout
### v20260511-r2

Three new Worker modes shipped — all conversational live-AI bound by `coach_notes.weak_patterns` and emitting the standard `<session_meta>.assessment` block so proficiency tracking continues uniformly across modes.

- **`weak_spots_drill`**: ~30-min depth session on one topic, tier-walked simple → hard. Inline 5-topic catalog (`emphasis_clefts`, `article_system`, `present_perfect_vs_past_simple`, `preposition_clusters`, `phrasal_verb_production`). Tutorial vs drill emerges from `coach_notes.recent_observations` — prior trace within ~14 days → drill-first; no trace → mechanics-first. PWA picker gains "Weak Spots" button gated on `weak_patterns.length > 0`. New `.claude/skills/weak-spots-session/` (596w, MCP-only reads/writes — remote-CC friendly; references `worker/index.js → weakSpotsDrillSystemPrompt` as canonical catalog).
- **`translation_drill` (Phase D-1)**: live RU→EN themed to player profile, rotates target structures from `weak_patterns`. Default 8 items, capped 12. `coachStartType('translation')` now routes live-first; library survives as offline fallback via `opts.forceLibrary` + offline/apiUnavailable check. Per-player `COACH_PLANNED_TOTAL_OVERRIDES.translation` honored.
- **`error_correction_drill` (Phase D-2)**: one English sentence per turn with exactly one embedded error in a target structure. No hints in the prompt. Accepts full sentence or just the fix. Same router pattern as translation.

Plan in `plans/archive/coach-live-ai-and-weak-spots.md` lays out T1 (all coach types → live AI, library → offline fallback) + T2 (Weak Spots). Phases A (Worker), B (PWA Weak Spots), C (CC skill), D-1 (translation), D-2 (error_correction) shipped here. Remaining T1: `article_drill`, `particle_sort`, `spelling_drill`.

CLAUDE.md trimmed 523 → 486 words (skills table extended + reference-table descriptions tightened). exercise-types.md adds type 10 + extends per-player table. coach-notes-schema.md adds `weak_spots_drill` read-out template. worker/README.md adds three mode sections + curl tests.

Preview probes verified all gating + routing cases for Weak Spots (4 states) and live/library routing for translation + error_correction (3 cases each). No console errors. `node --check` clean. Q count unchanged.

Q count: 2246 → 2246 (no change) · Version: v20260511-r2

---

## 2026-05-11 · Session r2
### v20260511 — Learner-shell §4.4 polish: mid-quiz exit affordance + active-window-aware Coach picker filter

Two scoped UI changes from the Stage 5 menu.

- **Mid-quiz exit affordance**: subtle "End early" link below the progress bar on the quiz screen. New `exitQuizEarly()` function: zero answers → route to `learner-home` / `home`; one or more answers → confirm, truncate `sessionQs` to the answered count, call `finishSession()` so the partial counts toward streak, stats, and shows the results card with the correct score/total. Closes a long-standing escape-hatch gap noted as open in `phase2-build-plan.md` §4.4.
- **Active-window-aware Coach picker filter**: new `COACH_TYPE_TO_CATEGORY` mapping (`article_drill`→Articles, `particle_sort`→Phrasal Verbs, `spelling_drill`→Spelling; translation + error_correction = cross-category). `coachApplyShellLayout` now hides type buttons whose required category isn't in `DB.learning_path.active_categories` — when the learner is on the learner shell with an active set. Builder shell (Artem, Egor) and players with no active_categories set bypass the filter and see every type with library content. Free Write + Phrase Swaps remain liveAI-gated, untouched.

Preview probe verified both behaviours: simulated Anna's `active_categories=['Phrasal Verbs']` and confirmed picker hides article_drill + spelling_drill while showing particle_sort + translation + error_correction. `exitQuizEarly` with zero answers routes cleanly to learner-home; with answers, confirms and truncates correctly. No console errors.

Q count: 2246 → 2246 (no change) · Version: v20260511

---

## 2026-05-11 · Session r1
### v20260510-r2 — Data-integrity root-cause fix: confirmPlayer() no longer writes previous player's stats to new player's Firestore doc

Closes the 2026-05-02 Nicole-overwritten-with-Artem contamination at source. Three coordinated edits in `index.html`:

- `confirmPlayer(key)` is now `async`. On detecting a player switch (`previousPlayer && previousPlayer !== key`), wipes in-memory `DB` and IndexedDB to `defaultData()`, then `await loadFromFirebase()` BEFORE the existing `syncToFirebase(true)` call. The old synchronous path used to write `buildPayload(DB)` to `players/{newKey}` while `DB` still held the previous player's qStats/catStats/recentSessions/totalAnswered — the exact 2026-05-02 corruption pattern.
- `loadFromFirebase()` stamps `_owner: currentPlayer` on the loaded DB.
- `syncToFirebase()` refuses to write when `DB._owner !== currentPlayer`. Belt-and-braces guard for any future code path that mutates `currentPlayer` without reloading DB.
- `buildPayload()` strips `_owner` from the Firestore-bound payload (client-side marker only — doesn't trip the cross-player overlap check in `tools/check_player_integrity.js`).

Verified via browser preview probe simulating the contamination scenario (Artem signed in with stats, switch to Nicole): post-fix DB has Nicole's actual data (`totalAnswered: 780`), the deferred sync writes `players/nicole` with Nicole's qStats only, no Artem keys leak through. Plans `data-integrity-plan.md` P1 marked done.

Q count: 2246 → 2246 (no change) · Version: v20260510-r2

---

## 2026-05-10
### v20260510 — Stage 2 ★★★★★ PV gap closure: 25 high-frequency PVs × pair format (+50 items)

Consolidated-plan Stage 2. Closes the 25 PVs the post-Stage-0 tracker still showed as `✗ 📅` at ★★★★★ frequency. Each PV gets a `pv_l{NN}_g` + `pv_l{NN}_i` pair (gap + input); mcq dropped from the pattern based on Stage 0 evidence that triple scaffolds plateau (`get through ¹` was 0/9 despite having `pv_l02_*`).

- **25 new PVs covered** (`pv_l07`–`pv_l31`): break down² / come from / crack on / cut off / end up / fall behind / fall through / figure out / fill in² / get round to / get through³ / go through / head off / hold up / kick off / knock off / let down / make up² (constitute) / pay off / point out / set up² / take on² / take up² / top up / wrap up.
- **Format choice**: gap + input only. Gap items test particle/PV selection with 4 opts; input items are cold-production (no PV named in hint; word-count cue mandatory; `hard: true` flag set).
- **Themes**: `biz_oil` / `kpmg_consulting` for the business-essential cluster. `brit_expat` / `home_daily` for the lighter ones (top up, crack on, head off, come from, end up, let down). `claude_collab` on `pv_l14_i` (figure out — "structural recalibration" jargon).
- **Hint design audit (preview probe)**: zero hint-leaks across all 25 input items — no hint contains the base verb of the answer. Cold-production validity preserved.
- **make up² scope confirmed**: constitute-only (`oil and gas makes up 80% of exports`). Invent sense remains in `pv_c16`; compensate-for sense in `pv_ti31–33`.
- `lint_questions.js` clean (2196 → 2246). `check_transform_keywords.js` clean (55 transforms unchanged).
- `manifest.json` drift fixed (was claiming "472 questions"; now no count claimed).

Q count: 2196 → 2246 (+50) · Version: v20260510

---

## 2026-05-09 · Session r2
### v20260509-r2 — Translation grader: iOS L-for-I autocorrect + curly-quote normalization

Anna reported "one answer is always incorrect, even if I repeat the suggestion" on `tr_anna_b16` ("After training I'm very tired"). Root cause: iOS autocorrect swaps capital `I` → lowercase `l` in contractions (visually identical, byte-different), and the smart-punctuation feature replaces straight `'` with curly `’`. The grader's contraction-expansion regex (`\bi'm\b`) matches neither, so a verbatim retype of the suggestion was scored at Levenshtein 4 against the expanded form and rejected.

- **`coachNormalize` ([index.html:10314](index.html:10314))** — added two pre-steps before the existing contraction expansion: (1) curly `’`/`‘` → straight `'`; (2) `l'm`/`l'll`/`l've`/`l'd` → `i'<same>`. The standalone tokens are not English words, so no risk of false-correct on unrelated input. Verified in preview: `"After a training l'm very tired"` (curly + lowercase L) and `"After training I'm very tired"` now normalize identically. Real errors (`at the kitchen`) correctly stay wrong.
- **`tr_anna_b04` (Firestore — live, no deploy needed)** — `correct_answers` widened from 5 → 8 forms to accept `"my keys"` variants. Russian *Я ищу ключи* almost always means *my keys* in real life; rejecting that form was a question-quality bug, not a learner gap.
- **`tr_anna_b11` (Firestore — live)** — added `at_the_kitchen` to `common_errors` between the two existing entries. Anna repeatedly typed `at the kitchen` (calque of *на кухне*) and only got the generic fallback feedback; she now gets a targeted *на → in* explanation.

Q count: 2196 → 2196 (no change) · Version: v20260509-r2

---

## 2026-05-09 · Session r1
### v20260509 — Mistakes/stats-review batch: 9 stem tightenings (single-correct-answer pass)
- **9 questions stem-tightened** to enforce one defensible correct answer (Artem's stated preference: tighten stems over widening alt-answers).
- `co_b06` (B1 Conditionals): tail rewritten "You burn yourself." — was "You will burn yourself" mixing first/zero conditional, licensed key `happens` and distractor `will happen` simultaneously.
- `pv_l02_i` (B2 PV input): rewritten to ongoing-now framing ("I'm in the middle of a really tough stretch — my family is helping me ___ it day by day") to block the "get over" reading enabled by past-period framing.
- `gt03/gt04/gt10` (PV B1/B2): GET-family alt-answer cluster — three siblings where decoy and key were both natural. Stems tightened with explicit vehicle (`gt03`: "the bus"), past-finished + "finally" (`gt04`: blocks endure-during), and "day by day — no shortcut" (`gt10`: blocks recover-after).
- `hw03` (B1 RC): meta-trap dropped — was "Which is most natural for habit?" with key=[3] "All three are correct" punishing correct intuition; rewritten to "Which is the most formal?" key=[0] with-whom.
- `aph35` (B2 Articles): removed anaphoric "we have been here before" licence for `the`; new stem "neither path is clearly better, steering committee is split" forces the indefinite idiom.
- `ga10` (B2 Adjectives): swapped extreme-adjective from `delicious` (register-debatable) to `enormous` (unambiguous size collocation); "very enormous" cleanly wrong.
- `ex05` (B1 Vocab): distractor pruned from `[wound, winded, ended, found]` to `[wound, winded, wind, wounded]` — eliminates "ended up" alt-answer; now isolates the wind-past distinction.
- **`zc08` removed from queue** after closer audit: ans is `'aren't'` (1-word zero conditional); Anna's "will not be" is a genuine Russian-L1 future-for-zero error, not a validation bug.
- `lint_questions.js` clean (2196 questions). `check_transform_keywords.js` clean (55 transforms).

Q count: 2196 → 2196 (no change) · Version: v20260509

---

## Older sessions

Archived to `references/archive/version-log-pre-2026-05-09.md` (2026-05-08 r3 and earlier). When researching past decisions, grep that file.
