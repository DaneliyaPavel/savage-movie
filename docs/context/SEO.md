# SEO — сводка на 2026-09-29

Метки: **DONE** · **STILL RELEVANT** · **STALE** · **UNVERIFIED** · **NEXT**.
Базис: аудит 2026-09-08 ([docs/archive/seo-2026-09-08/](../archive/seo-2026-09-08/), не источник истины). Частотность, позиции, ссылки, GSC/Вебмастер — **UNKNOWN во всех документах**; цифр не приводить.

## Сверка P0/P1/P2 старого аудита с main
| # | Пункт | Статус | Доказательство |
|---|---|---|---|
| P0-1 | canonical кейсов/статей → главная | **DONE** | `projects/[slug]/page.tsx:40`, `blog/[slug]/page.tsx:46`; live canonical у sovkombank, wellery, статьи = self |
| P0-2 | нет краулимой навигации на главной | **DONE (код) / UNVERIFIED (raw HTML)** | `SiteFooter` в `page.tsx`; live-футер содержит 12 ссылок |
| P0-3 | /reklamny-rolik не в индексе | **UNVERIFIED** | нужен GSC/Вебмастер |
| P0-4 | тип VideoProductionCompany | **DONE** | `app/layout.tsx` Organization + комментарий |
| P1-1 | нет страницы под «видеопродакшн спб/москва» | **STILL RELEVANT** | H1 главной «SAVAGE MOVIE»; лид без Москвы; D-06: городских копий нет, кластер должна брать главная (вывод SERP-анализа 08.09, не решение владельца) |
| P1-2/3 | телефон/NAP | **DONE (сайт) / STILL RELEVANT (внешние профили)** | `lib/contacts.ts`, tel: на live; каталоги/Яндекс Услуги не проверялись |
| P1-4 | клиенты Lamoda/Okko… | **STILL RELEVANT** | нужны права (O-06) |
| P1-5 | анонимные отзывы | **STILL RELEVANT** | live `/about` |
| P1-6 | кейсы не кейсы | **STILL RELEVANT** | wellery ≈120 слов, без credits/VideoObject (JSON-LD на кейсах **UNVERIFIED**) |
| P1-7 | og:image главной | **DONE (код)** | `page.tsx:17`; live `og:image=/opengraph-image` |
| P2-1 | lastmod = new Date() | **DONE** | `app/sitemap.ts` |
| P2-2 | meta keywords | **STILL RELEVANT** (безвредно) | `layout.tsx` |
| P2-3 | заголовки блога с суффиксом | **STILL RELEVANT** | live /blog, H1 статьи |
| P2-4 | /clients с пустым состоянием в индексе | **DONE (код: 0ba8bf6, cdd4a9d)** | live рендерит 16 брендов |
| P2-6 | H1 /services | **DONE-ish** | H1 «Что будем снимать?» — читаемо, но не коммерческий запрос; **NEXT**: решить, кто владеет кластером |
| P2-7 | BreadcrumbList | **частично** | есть на /services, /clients, /reklamny-rolik; нет на кейсах/блоге |

## Intent-архитектура (текущая)
- «рекламный ролик / заказать / производство рекламных роликов» → `/reklamny-rolik` (единственная money-страница, 1300 слов, Service+3 Offer, FAQ, форма). Соответствует intent. Опасность: цены в разметке `Offer` берутся из CMS (старые 100–300) и не соответствуют D-03.
- «видеопродакшн спб/москва» → должна быть главная (H1/лид ещё брендовые). **NEXT #1 по SEO.**
- `/services` — хаб 7 направлений; страницы направлений не существуют (правильно: пусто хуже отсутствия).
- Курсы (`/courses`) размывают тематику, если Academy — отдельный продукт.
- Блог: 12 статей март 2026, новых нет 6 месяцев.

## NEXT PRIORITY (SEO)
1. Снять baseline GSC + Яндекс Вебмастер (бизнес).
2. Главная: коммерческий лид с обоими городами (не ломая hero).
3. Привести цены к D-03 (лендинг, `Offer`, статья, /services) и убрать «24 часа» по D-04 — отдельной задачей.
4. Кейсы → структура + VideoObject + og:image.
5. Яндекс Бизнес/NAP во внешних профилях; именованные отзывы.
6. Убрать « | Savage Movie» из H1/карточек блога.
