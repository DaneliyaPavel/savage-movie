'use client'

import dynamic from 'next/dynamic'

/*
 * Тело 404 грузится отдельным чанком. Корневой not-found входит в дерево каждой
 * страницы, и без dynamic его клиентские модули (меню, TopBar, i18n) preload-ились
 * на любой странице сайта: ~24 КБ gzip, которые ни при чём к её первому экрану.
 * SSR остаётся включённым, так что HTML у 404 прежний.
 */
export const NotFoundContent = dynamic(() =>
  import('./not-found-content').then(module => module.NotFoundContent)
)
