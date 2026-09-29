# STATUS — читать первым

Snapshot **2026-09-29**. Этот файл + [DECISIONS.md](DECISIONS.md) главнее любого другого документа в репозитории.

**Правило приоритета.** Код, CMS или старый документ не становятся product/business truth, если существует более новое решение владельца. Порядок: прямое указание владельца → решения в DECISIONS.md → verified production → current main → данные CMS/API → остальные docs. Содержимое `docs/archive/` источником не является.

| Поле | Значение |
|---|---|
| Production | https://savagemovie.ru (ветка `main`, push = автодеплой) |
| main SHA на момент аудита | `c49bedaac6b6768eb5c37d100db56cd088f81626` (2026-09-21) |
| Как проверялся live | 2026-09-29, текстово (WebFetch: markdown + meta). Браузер/скриншоты/mobile/raw HTML/JSON-LD/Lighthouse — **UNVERIFIED**, egress-прокси блокирует Chromium |
| Не проверялось | GSC, Яндекс Вебмастер, CMS/БД, сервер, тесты/lint/build |

## Фактическое состояние
- Работают: `/`, `/projects` (19 кейсов), `/clients`, `/services` (7 направлений), `/reklamny-rolik`, `/about`, `/contact`, `/booking`, `/blog` (12 статей), `/courses`, юр. страницы. Sitemap 44 URL.
- Воронка: бриф `/api/estimate` → email/SMTP + Telegram + n8n webhook, атрибуция, цель Метрики `production_lead_success`.
- Исправлено после SEO-аудита 08.09: self-canonical кейсов/статей, ссылки в футере главной, Organization-разметка, телефон, og:image главной, lastmod.

## Активные расхождения (решения приняты, реализация НЕ выполнена)
1. **Цена.** Утверждено D-03 (350–700 тыс., от 700 тыс.; «до 350» не рекламируется). Live `/reklamny-rolik` ещё показывает «100–300 / 300–700 / от 700» (запись `commercial_landing` в CMS перекрывает код); в коде дефолт «до 350 / 350–700 / от 700» тоже не соответствует D-03. Статья `/blog/skolko-stoit-reklamnyj-rolik` — старые диапазоны. Не менять до отдельной задачи.
2. **Срок ответа.** Утверждено D-04 (без «24 часов»). Live: «в течение 24 часов» на `/reklamny-rolik` и `/contact` (`lib/i18n-context.tsx:123`, CMS `sla`). Не менять до отдельной задачи.
3. `/contact` — старая форма (бюджет-слайдер 10–500К, без атрибуции и n8n).
4. Кейсы тонкие (~110–135 слов, без структуры и credits).
5. `/about`: анонимные отзывы, «Награждённое режиссирование» без подтверждения.
6. Деплой без гейта (нет lint/test в CI), миграции на старте контейнера, отката нет.

## UNKNOWN / UNVERIFIED
Индексация `/reklamny-rolik`, позиции, ссылочный профиль; визуальные принципы (см. BRAND.md §C); JSON-LD на live; поведение mobile; доставка лидов до n8n/CRM; расписание бэкапов; работает ли `/api/admin/revalidate` через nginx.

## Приоритетная работа
См. [ROADMAP.md](ROADMAP.md). Сейчас: документация и контекст (эта ветка) → затем реализация D-03/D-04 по отдельному разрешению.

## Карта контекста
[BRAND](BRAND.md) · [BUSINESS](BUSINESS.md) · [SITE](SITE.md) · [DESIGN_SYSTEM](DESIGN_SYSTEM.md) · [CONTENT](CONTENT.md) · [SEO](SEO.md) · [TECH](TECH.md) · [DECISIONS](DECISIONS.md) · [ROADMAP](ROADMAP.md)
