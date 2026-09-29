# DESIGN_SYSTEM — как устроен текущий сайт

Практическое описание для продолжения сайта **в том же визуальном языке**. Идеальной дизайн-системы нет и не выдумывается. Бренд-принципы — в [BRAND.md](BRAND.md). Всё про внешний вид без браузера — **UNVERIFIED**; ниже — по коду.

## Стек и правила кода
Tailwind 4 (`@theme inline` в `app/globals.css`), shadcn/Radix (`components/ui`), CVA + `cn()`, Framer Motion. Файлы kebab-case, без `;`, одинарные кавычки, 100 символов. Server Components по умолчанию. Тёмная тема прибита (`<html class="dark">`).

## Два визуальных языка (главный факт)
1. **Новый, «титровый/монтажный»** — образец для продолжения: `/services` (`components/sections/services/*`), `/clients` (`sections/clients/*`), `/reklamny-rolik` (`sections/commercial/*`), меню, top-bar, preloader, зерно.
2. **Ранний, shadcn/v0-карточный** — legacy: `/about`, `/contact`, `/booking`, `/courses`, карточки блога, часть админки-подобных форм. Не копировать; при правке страниц подтягивать к первому.
Новую страницу строить по образцу первого.

## Typography roles (`globals.css`, `.font-*`, `.text-*`)
| Роль | Класс/токен | Где |
|---|---|---|
| Дисплей сцен | `font-stage` (Montserrat Black, есть кириллица) | заголовки `/services`, ролл `/clients` |
| Hero/акцент | `font-brand-hero` (Montserrat Black Italic), `font-brand` (Epilogue Black) | hero, wordmark |
| Текст | `font-secondary`/`font-sans` (Inter ExtraLight) | абзацы |
| Рукописный акцент | `--font-handwritten` (SA No Rules) | пометки, номера |
| Техническая микро-строка | `.type-meta`, `.type-meta-sm` | подписи сцен, метки |
| Размеры | `.text-hero`, `.text-display`, `.text-section-title`, `.text-editorial` | clamp-шкала |
Legacy-шрифты (`font-oranienbaum`, `font-cormorant`, `font-playfair`, `.glass`, `.gradient-text`) в CSS остались — не для новых страниц.

## Layout patterns
- Полноэкранный hero (`h-svh`) + скролл в футер со ссылками (главная).
- Монтаж сцен: одна сцена — одно направление/кейс, sticky-стадия, индекс `01…07` (`/services`).
- «Ролл»: строка = клиент, кадр раскрывается по hover/focus (`.client-roll*`, `/clients`).
- Лендинг-воронка: hero → кейсы → задачи → процесс → цена → «почему» → форма → FAQ → финальный CTA (+ sticky CTA) (`/reklamny-rolik`).
- Кейс: галерея + описание + следующий проект; **структуры задача→результат→credits пока нет**.
- Страницы оборачиваются `MarketingLayoutClient` (`app/(marketing)/layout-client.tsx`): i18n, меню, page-transition, зерно (кроме кейсов).

## Media behaviour
Видео — Bunny Stream: HLS через `hls.js` (`lazy-hls-video`, `VideoStage`), прокси `/cdn/` в nginx (обход блокировки b-cdn.net). Постеры и первый кадр статичны (нет чёрного экрана при загрузке). Картинки — `next/image`, `qualities [50,65,75]`, remotePattern `*.b-cdn.net`; загрузки — `/uploads/*`. Первый экран `/services` просит 3 кадра, а не 8; preload только LCP-картинки главной. Видео-поля БД называются `mux_playback_id`, но содержат Bunny id.

## Interaction & motion
Hover-раскрытие кадров, focus-visible дублирует hover, `active`-состояния; меню — модальный слой с фокус-ловушкой (`aria-label`, focus first link); `useReducedMotion` и `@media (prefers-reduced-motion)` есть в services/clients/landing/preloader. Motion `/services` сведён к четырём длительностям и одной кривой. Ident-preloader 560 мс; при отключённом JS главная и проекты остаются рабочими (no-JS фолбэки, коммиты db5b2d2, 1a7228c, c6cad63).

## Формы
RHF + Zod; бриф сметы двухшаговый, honeypot, файл брифа, атрибуция. `/contact` и `/booking` — отдельные старые формы (см. STATUS).

## Known inconsistencies
- Два визуальных языка (выше). Хардкод оттенков `#0d0d0d/#1a1a1a/#050505/#070707/#0a0a0a` и `#ff2936` вместо токенов; светлая `:root`-палитра shadcn не используется.
- Посторонние акцент-цвета (`#ec4899/#8b5cf6/#3b82f6`) — проверить, не в маркетинге ли (UNVERIFIED).
- Футер: «© 2026 Savage Movie» и «2026© Видим смысл» на кейсах.
- Английские подписи в UI («Commercial reel»…).
- H1 по страницам непоследовательны: на `/projects` номера карточек размечены заголовками (UNVERIFIED в DOM).

## Legacy areas / кандидаты на чистку (0 импортов по grep — проверить перед удалением)
`components/features/*` дублирует `features/projects/components/*`; `components/sections/{HeroSection,HeroSectionClient,CTASection,ServicesSection,TestimonialsSection,AboutTeaser,ProjectsGrid,FeaturedProjects,ClientsSection,Navigation}.tsx`; `ShowreelHero.tsx` vs `showreel-hero.tsx`; `Footer.tsx` vs `site-footer.tsx`; `components/sections/MarketingLayoutClient.tsx`; файлы `mux-player.tsx` (плеер не Mux). Удаление — отдельная задача.
