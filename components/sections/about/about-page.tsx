/**
 * /about — «Окно в кадр».
 *
 * Страница читается как плёнка: скролл — воспроизведение, наверху красная нить
 * прогресса, внизу таймкод. Порядок: первый экран с манифестом → цифры → семь
 * направлений → кадр-пауза → позиция → этапы-плёнка → работы → люди и география → вопросы →
 * финал → бриф → футер. Каждый блок — своя «сцена» с номером 01…09.
 *
 * Композиция приходит с сервера готовыми данными (lib/about/load.ts); без
 * портфолио пропадают работы и лента брендов, без команды — карточки людей.
 */
'use client'

import type { AboutData } from '@/lib/about/load'
import { AboutDirections } from './about-directions'
import { AboutEnd } from './about-end'
import { AboutFaq } from './about-faq'
import { AboutHero } from './about-hero'
import { AboutHud } from './about-hud'
import { AboutInterlude } from './about-interlude'
import { AboutNumbers } from './about-numbers'
import { AboutPeople } from './about-people'
import { AboutPrinciples } from './about-principles'
import { AboutProcess } from './about-process'
import { AboutShell } from './about-shell'
import { AboutWorks } from './about-works'

export function AboutPage({ data }: { data: AboutData }) {
  return (
    <AboutShell>
      <AboutHud />
      <AboutHero />
      <AboutNumbers numbers={data.numbers} brands={data.brands} />
      <AboutDirections />
      <AboutInterlude />
      <AboutPrinciples />
      <AboutProcess />
      <AboutWorks works={data.works} />
      <AboutPeople team={data.team} />
      <AboutFaq />
      <AboutEnd />
    </AboutShell>
  )
}
