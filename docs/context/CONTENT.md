# CONTENT — правила и источники

## Что считается контентом-истиной
1. Live + API (`/api/projects`, `/api/settings` → `commercial_landing`) — источник текста лендинга. **CMS перекрывает код** (`lib/commercial-landing/merge.ts`: массивы заменяются целиком). Правка дефолтов в `content.ts` не меняет live.
2. Проекты/клиенты/отзывы/блог — БД через админку; `title_ru/title_en`.
3. Направления — `lib/services/directions.ts`; бриф — `lib/services/brief.ts`; кадры — `lib/services/frames.ts`.

## Реальные проекты (slug → тема, из sitemap/live)
ohtapark, mavin (Small Joys, Москва), wellery (Шесть утра, HoReCa, live+AI), best-western (Номер 505, 2023), sensual-car-service и sensual (Чистый силуэт), viberi-zhizn, naumi (Минус восемь), unna (Перед сном), biotherm (Молекула воды, AI), dralo (клип), vernel (Послушай), otec, cherry, t9-soldatov (27 секунд, клип), diesel (В плане дождь), yadah (Острый свет), zarina (Сегодня открытие), sovkombank (Пятница, 18:00 / «Бит тимбилдинга»).
Замечания: `sensual` и `sensual-car-service` — два URL для одного бренда, `/clients` ссылается на оба; в sitemap оба.

## Структура кейса (целевая, из инструкций)
задача → идея → производство → работа → использование/результат → credits. Сейчас: один абзац + галерея. Результатов (метрик) в данных нет — **не выдумывать**.

## Цены и срок ответа в текстах — только по [D-03/D-04](DECISIONS.md).

## Запрещено придумывать
клиентов, отзывы, награды, рейтинги, адреса, офисы, SLA, показатели. Текущие нарушения/риски: «Награждённое режиссирование», анонимные отзывы на /about, «24 часа» (D-04), «Весь мир» в футере при позиции «по России».

## Блог (12 статей, март 2026, автор «Мария»)
Коммерческие: skolko-stoit-reklamnyj-rolik, kak-vybrat-videoproduction-studiyu, korporativnoe-video, process-videoproduction, video-dlya-marketplejsov, videovizitka-dlya-biznesa. AI: ai-generaciya-video-2026, ai-vs-tradicionnaya-syomka, reklamnyj-rolik-nejroset. Прочее: kak-snyat-muzykalnyj-klip, trendy-videoproduction-2026, videokontent-dlya-socsetej-2026. Заголовок карточки/H1 содержит « | Savage Movie» — баг. Цены в статье (100–300k / 300–700k) расходятся с D-03.
