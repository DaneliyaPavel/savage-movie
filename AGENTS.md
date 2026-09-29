# AGENTS.md — Savage Movie

**Начни с [docs/context/STATUS.md](docs/context/STATUS.md)**, затем [docs/context/DECISIONS.md](docs/context/DECISIONS.md). Полные правила проекта, стек, механики и команды — в [CLAUDE.md](CLAUDE.md); здесь только то, что обязателен любой агент.

## Правила
1. **Это живой production** студии Savage Movie (не портфолио видеографа). Не менять `main`, не делать push/merge/deploy, не запускать prod-миграции, не трогать nginx/DNS/secrets/auth/payments/формы/аналитику/n8n без явной задачи владельца. Ветка + draft PR, без merge.
2. **Источник истины:** решение владельца → `docs/context/DECISIONS.md` → verified production → main → CMS/API → остальное. Код, CMS и старые документы не перекрывают более новое решение. `docs/archive/` — не источник.
3. **Видео — Bunny Stream**, не Mux. **Calendly не используется.** Лиды: estimate → email / Telegram / n8n; аналитика — Яндекс.Метрика.
4. **CMS priority:** текст `/reklamny-rolik` берётся из settings и перекрывает `content.ts`.
5. **Новый `/api/*` роут Next → добавить `location` в nginx** (иначе 404 из FastAPI).
6. Не выдумывать клиентов, кейсы, награды, отзывы, адреса, результаты, SLA. Цены и срок ответа — только по D-03 / D-04.
7. Бренд — по production и main, Brand OS/Brandbook/Tokens v2 не используются ([BRAND.md](docs/context/BRAND.md)).
8. Перед задачей: код в main → live-страница → сравнить → только потом выводы. Перед завершением frontend-задачи: `npm run lint && npm run type-check && npm test` (backend-тестов нет).
9. Не рефакторить попутно, не удалять файлы без явной задачи.
