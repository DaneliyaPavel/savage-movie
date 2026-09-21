'use client'

import Image from 'next/image'

import {
  SceneCredit,
  SceneFoot,
  STAGE_BOTTOM,
  STAGE_TOP,
  StageRail,
  StageShell,
  StageTitle,
} from './stage-shell'
import { canOptimizePoster } from '@/lib/commercial-landing/poster-url'
import { SceneMedia } from './scene-media'
import { DirectionCta } from './direction-cta'
import { useStage, useStageStep } from './use-stage'
import { cn } from '@/lib/utils'
import type { SceneProps } from './scene-props'

/**
 * 04 — регулярный production. Метафора: РАЗМНОЖЕНИЕ КАДРА.
 *
 * Здесь продукт не объясняется, а показывается. Сцена начинается одним
 * мастер-кадром 16:9. По ходу прокрутки он делится: на два, на четыре, на
 * восемь — и каждая доля подписана тем, чем она станет на выдаче. К концу
 * экран превращается в контрольный лист смены, и только тогда приходит
 * «одна смена — не один ролик». Человек понимает предложение раньше, чем
 * дочитывает его.
 *
 * Все восемь долей — один и тот же материал, обрезанный по-разному. Это и
 * точнее по смыслу (одна смена, не восемь съёмок), и дешевле: одна картинка
 * на восемь кадров вместо восьми загрузок.
 */

/**
 * Во что превращается смена. Порядок производственный: сначала главный ролик.
 *
 * У каждой доли своя точка и своя крупность — иначе восемь ячеек выглядели бы
 * восемью копиями одного плана, и лист перестал бы доказывать, что из смены
 * получаются РАЗНЫЕ выдачи. Продуктовый план самый крупный, ретейл — самый
 * общий, вертикали разведены к противоположным кромкам.
 *
 * Разброс крупности здесь нарочно грубый. На прежних значениях (1,05–1,95)
 * восемь долей отличались друг от друга меньше, чем мягкость исходного кадра,
 * и монтажный лист честно показывал восемь почти одинаковых картинок — то
 * есть доказывал ровно обратное тому, ради чего он нарисован.
 */
const CELLS = [
  { label: 'HERO', position: '50% 38%', zoom: 1 },
  { label: '9:16', position: '26% 55%', zoom: 1.8 },
  { label: '9:16', position: '76% 40%', zoom: 1.8 },
  { label: 'LOOP', position: '50% 82%', zoom: 1.3 },
  { label: 'PRODUCT', position: '40% 20%', zoom: 2.8 },
  { label: 'STORY', position: '66% 86%', zoom: 2.1 },
  { label: 'WEBSITE', position: '50% 46%', zoom: 1.05 },
  { label: 'RETAIL', position: '16% 34%', zoom: 1.45 },
] as const

/** Сколько долей видно на каждом шаге деления */
const VISIBLE_BY_STEP = [1, 2, 4, 8] as const

/**
 * Как доля занимает сетку 4×2 на каждом шаге. Видимые доли всегда делят лист
 * поровну, поэтому размер у них общий.
 */
const SPAN_BY_STEP: ReadonlyArray<string> = [
  'col-span-4 row-span-2',
  'col-span-2 row-span-2',
  'col-span-2 row-span-1',
  'col-span-1 row-span-1',
]

export function StageContent({
  id,
  direction,
  active,
  onBrief,
  onNavigate,
  onCaseOpen,
}: SceneProps) {
  const { containerRef, progress, reduced } = useStage()
  const step = useStageStep(progress, VISIBLE_BY_STEP.length, reduced)
  const master = direction.works[0]

  const visible = VISIBLE_BY_STEP[step] ?? 8
  const span = SPAN_BY_STEP[step] ?? SPAN_BY_STEP[3]!
  const complete = step >= VISIBLE_BY_STEP.length - 1

  return (
    <StageShell id={id} direction={direction} containerRef={containerRef} depth={380}>
      <StageRail direction={direction} />

      {/*
        Лист занимает остаток экрана, а не половину его высоты при
        фиксированном резерве в четырнадцать рем под набор. На 1440×720 набор
        просил больше, чем резерв, и «ОДНА СМЕНА» накрывала нижний ряд долей.
      */}
      {/* Без собственного z: иначе обёртка создаёт контекст наложения и
          заявление уходит под затемнение и под пометку на полях */}
      <div className="flex h-full flex-col">
        <div
          className={cn(
            'flex min-h-0 flex-1 items-center justify-center px-4 md:px-10 lg:px-20',
            STAGE_TOP
          )}
        >
          {/* Рамка монтажного листа: линии сетки — это зазор фона, поэтому в
            стыках не удваивается толщина */}
          {/* На телефоне лист выше пропорцией: при 16:9 на узком экране восемь
            долей ужимаются в полоску и перестают быть доказательством */}
          {/* Рамка по внешней кромке той же толщины, что и линии сетки: без неё
            лист обрывался на краю крайних долей и читался сеткой, а не
            монтажным листом */}
          <div
            className="grid aspect-[5/4] w-full max-w-[min(94vw,1480px)] grid-cols-4 grid-rows-2 gap-[2px] bg-white/15 p-[2px] md:aspect-[16/9]"
            /* Не выше половины экрана и не выше того, что осталось */
            style={{ maxHeight: 'min(50svh, 100%)' }}
          >
            {CELLS.map((cell, index) => {
              const shown = index < visible

              return (
                <div
                  key={`${cell.label}-${index}`}
                  /*
                  Невидимая доля убирается из раскладки, а не гасится
                  прозрачностью: в сетке с двумя явными рядами погашенная
                  ячейка всё равно занимает место и выдавливает лист за
                  пределы кадра. Перечень выдачи при этом не теряется для
                  поиска — он есть текстом в спецификации ниже по странице.
                */
                  /* transition-opacity здесь не было смысла: доля появляется
                   через display, а его браузер не интерполирует */
                  className={cn(
                    'relative min-h-0 min-w-0 overflow-hidden bg-[#0D0D0D]',
                    shown ? span : 'hidden'
                  )}
                >
                  {index === 0 && step === 0 ? (
                    /*
                    Движение живёт ровно столько, сколько лист остаётся одним
                    мастер-кадром. Дальше это контрольный лист смены, и все
                    доли — один и тот же кадр под разной обрезкой. Раньше
                    первая доля продолжала играть видео, пока остальные семь
                    показывали постер: два разных изображения на листе,
                    который весь построен на том, что съёмка была одна.
                  */
                    master ? (
                      <SceneMedia
                        work={master}
                        active={active}
                        aspect="auto"
                        sizes="92vw"
                        className="h-full w-full"
                      />
                    ) : null
                  ) : master?.posterUrl ? (
                    /*
                    Доли — один и тот же кадр под разной обрезкой, и sizes у них
                    тот же, что у мастер-кадра. Это не формальность: оптимизатор
                    строит URL из sizes, поэтому все восемь долей и мастер-кадр
                    просят ровно один файл, который к моменту деления уже лежит
                    в кэше. Раньше доли брали исходник CMS напрямую — лист в
                    середине сцены догружал вторую, неоптимизированную копию
                    того же кадра.
                  */
                    canOptimizePoster(master.posterUrl) ? (
                      <Image
                        src={master.posterUrl}
                        alt=""
                        fill
                        sizes="92vw"
                        quality={75}
                        className="object-cover"
                        style={{
                          objectPosition: cell.position,
                          transform: `scale(${cell.zoom})`,
                        }}
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={master.posterUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-cover"
                        style={{
                          objectPosition: cell.position,
                          transform: `scale(${cell.zoom})`,
                        }}
                      />
                    )
                  ) : null}

                  {/*
                  Подписи приходят вместе с последним делением. Пока лист ещё
                  делится, они только мешают увидеть само деление; нумерация
                  убрана совсем — долю, которую видно, человек считает глазами.
                */}
                  <span
                    className={cn(
                      'type-meta-sm absolute bottom-2 left-2 font-mono uppercase text-white/80 transition-opacity duration-[var(--motion-move)] ease-[var(--ease-out-expo)] [text-shadow:0_1px_2px_rgba(0,0,0,0.95),0_0_12px_rgba(0,0,0,0.75)]',
                      complete ? 'opacity-100' : 'opacity-0'
                    )}
                  >
                    {cell.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/*
        Единственная рукописная пометка страницы.
        
        Контрольный лист смены — производственный документ, и на настоящем
        документе всегда есть отметка от руки. Это не декорация и не второй
        акцент: она приходит вместе с последним делением, стоит белым (красный
        на этой странице занят одним словом) и говорит ровно тот факт, которого
        нет ни в заголовке, ни в подписях долей.
      */}
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute right-6 z-[6] -rotate-[7deg] text-lg text-white/70 transition-opacity duration-[var(--motion-cut)] ease-[var(--ease-out-expo)] md:right-12 md:text-2xl lg:right-24',
            /* На поле рядом с заявлением, а не поверх листа: пометка на полях
             читается, пометка поверх кадра — нет */
            'bottom-[30%] md:bottom-[15%]',
            complete ? 'opacity-100' : 'opacity-0'
          )}
          style={{ fontFamily: 'var(--font-handwritten), cursive' }}
        >
          одна площадка, один день
        </span>

        {/* Лист уходит под заявление: без затемнения белый набор ложится на
          светлый кадр и перестаёт читаться ровно в момент вывода */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[28%] bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/80 to-transparent"
        />

        <div className={cn('relative z-10 shrink-0 px-6 pt-8 md:px-10 lg:px-20', STAGE_BOTTOM)}>
          <StageTitle
            id={id}
            className={cn(
              /*
              Кегль подтянут к общему кеглю территорий. Единственный красный
              удар страницы стоял в самом мелком заголовке из восьми — то есть
              самое дорогое предложение студии было набрано тише всего
              остального.
            */
              'text-[clamp(2rem,6.6vw,5.8rem)] transition-opacity duration-[var(--motion-move)] ease-[var(--ease-out-expo)]',
              complete ? 'opacity-100' : 'opacity-25'
            )}
          >
            Одна смена.
            {/*
            Единственный красный удар всей страницы. Он стоит здесь, а не в
            beauty: это момент, когда экран уже доказал самое дорогое
            предложение студии, и слово просто совпадает с доказательством.
          */}
            <span
              className={cn(
                'block transition-colors duration-[var(--motion-move)] ease-[var(--ease-out-expo)]',
                complete && 'text-accent'
              )}
            >
              Не один ролик.
            </span>
          </StageTitle>

          <SceneFoot
            className="mt-7"
            cta={<DirectionCta direction={direction} onBrief={onBrief} onNavigate={onNavigate} />}
            aside={
              master ? (
                <SceneCredit
                  href={`/projects/${master.slug}`}
                  onClick={() => onCaseOpen(direction, master.slug)}
                >
                  Мастер-материал — {master.client}
                </SceneCredit>
              ) : undefined
            }
          />
        </div>
      </div>
    </StageShell>
  )
}
