'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { I18nProvider, useI18n } from '@/lib/i18n-context'
import { MenuProvider } from '@/components/ui/menu-context'
import { GrainOverlay } from '@/components/ui/grain-overlay'
import { TopBar } from '@/components/ui/top-bar'
import { JalousieMenu } from '@/components/ui/jalousie-menu'

export function NotFoundContent() {
  return (
    <I18nProvider>
      <MenuProvider>
        <NotFoundBody />
        <GrainOverlay />
      </MenuProvider>
    </I18nProvider>
  )
}

/*
 * Кнопки набраны теми же классами, что первичное действие /booking, а не через
 * <Button>: у страницы тот же язык крупных прямоугольных CTA, что у остального
 * маркетинга. Press-состояние и снятие тап-подсветки — те же, что в системе.
 */
const primaryCta =
  'inline-flex items-center justify-center gap-3 h-14 px-8 bg-foreground text-background font-medium hover:bg-foreground/90 transition-[background-color,transform] duration-150 ease-out active:scale-[0.97] motion-reduce:active:scale-100 motion-reduce:active:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff2936] [-webkit-tap-highlight-color:transparent]'

const secondaryCta =
  'inline-flex items-center justify-center h-14 px-8 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-[color,border-color,transform] duration-150 ease-out active:scale-[0.97] motion-reduce:active:scale-100 motion-reduce:active:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff2936] [-webkit-tap-highlight-color:transparent]'

function NotFoundBody() {
  const { language } = useI18n()
  const isRu = language === 'ru'

  return (
    <main className="min-h-screen bg-[#000000] flex flex-col">
      <TopBar />
      <JalousieMenu />

      <section className="flex flex-1 flex-col justify-center px-6 pt-32 pb-24 md:px-10 lg:px-20">
        <span className="mb-4 block text-xs uppercase tracking-widest text-muted-foreground">
          {isRu ? 'Ошибка 404' : 'Error 404'}
        </span>

        <h1
          className="font-brand-hero text-[clamp(4rem,16vw,13rem)] uppercase leading-[0.85] tracking-tighter text-white"
          /* Только transform в появлении — контент виден в первом кадре */
        >
          404
        </h1>

        <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          {isRu
            ? 'Такой страницы нет. Возможно, проект сняли с публикации или в ссылке опечатка. Работы на месте — начните с портфолио.'
            : 'This page does not exist. The project may have been unpublished, or the link has a typo. The work is still here — start with the portfolio.'}
        </p>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row">
          <Link href="/projects" className={primaryCta}>
            {isRu ? 'Смотреть работы' : 'View the work'}
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link href="/booking" className={secondaryCta}>
            {isRu ? 'Обсудить проект' : 'Discuss a project'}
          </Link>
        </div>

        <p className="mt-16 border-t border-border pt-8 text-sm text-muted-foreground">
          {isRu ? 'Или вернитесь на ' : 'Or go back to the '}
          <Link
            href="/"
            className="underline transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff2936]"
          >
            {isRu ? 'главную' : 'home page'}
          </Link>
          .
        </p>
      </section>
    </main>
  )
}
