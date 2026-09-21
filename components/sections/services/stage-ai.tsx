'use client'

import { motion, useMotionTemplate, useTransform } from 'framer-motion'

import { StageRail, StageShell, StageTitle } from './stage-shell'
import { SceneMedia } from './scene-media'
import { DirectionCta } from './direction-cta'
import { useStage } from './use-stage'
import type { SceneProps } from './scene-props'

/**
 * 06 — AI и гибридный production. Метафора: ШОВ.
 *
 * Экран разрезан вертикальным швом на два кадра. По сторонам шва стоят два
 * производственных словаря: язык камеры и язык генерации. Шов едет, а затем
 * растворяется — и два кадра становятся одним полем. Вывод о едином pipeline
 * делает сам экран, поэтому заголовок приходит последним и звучит как итог,
 * а не как слоган.
 *
 * Важное ограничение честности: мы нигде не утверждаем, что конкретный кадр
 * сгенерирован. Оба кадра — реальные работы Savage, а какие именно планы
 * внутри сняты, а какие собраны, знает только продакшн. Подписи REAL и
 * GENERATED относятся к словарям по сторонам шва, а не к изображениям под
 * ними. Выдуманная подпись под кадром была бы ровно тем враньём, которого
 * на этой странице быть не должно.
 *
 * Ни фиолетового, ни свечения, ни лиц из нейросети.
 */

const CAMERA_TERMS = ['35MM', 'T2.0', 'SHUTTER 180°', 'REC.709', '23.976 FPS'] as const
const MODEL_TERMS = ['MODEL', 'PROMPT', 'SEED', 'FRAME', 'RENDER'] as const

export function StageAi({ id, direction, active, onBrief, onNavigate, onCaseOpen }: SceneProps) {
  const { containerRef, progress, reduced } = useStage()
  const [left, right] = direction.works

  // Шов сначала едет вправо, потом исчезает вместе со вторым кадром
  const seam = useTransform(progress, [0, 0.5], reduced ? [50, 50] : [50, 76])
  const seamLeft = useMotionTemplate`${seam}%`
  const overlayWidth = useTransform(seam, value => `${100 - value}%`)

  const seamOpacity = useTransform(progress, [0.5, 0.86], reduced ? [0, 0] : [1, 0])
  const overlayOpacity = useTransform(progress, [0.5, 0.92], reduced ? [0, 0] : [1, 0])
  /*
   * Словари — это содержание сцены, а не оформление шва. Держать их на той же
   * прозрачности значило бы спрятать их совсем от человека, который попросил
   * убрать движение: у него шва нет с самого начала.
   */
  const vocabularyOpacity = useTransform(progress, [0.5, 0.86], reduced ? [1, 1] : [1, 0])
  const conclusion = useTransform(progress, [0.62, 0.95], reduced ? [1, 1] : [0.3, 1])

  return (
    <StageShell id={id} direction={direction} containerRef={containerRef} depth={320}>
      {/* Поле, которое в итоге остаётся одним */}
      <div className="absolute inset-0">
        {left ? (
          <SceneMedia
            work={left}
            active={active}
            aspect="auto"
            sizes="100vw"
            className="h-full w-full"
          />
        ) : null}
      </div>

      {/* Второй кадр живёт справа от шва. Контейнер обрезает, а сам кадр
          остаётся в ширину экрана — иначе он бы сплющивался по ходу сцены */}
      <motion.div
        style={{ width: overlayWidth, opacity: overlayOpacity }}
        className="absolute inset-y-0 right-0 overflow-hidden will-change-[width,opacity]"
      >
        <div className="absolute right-0 top-0 h-full w-screen">
          {right ? (
            <SceneMedia
              work={{ ...right, playbackId: null }}
              active={active}
              aspect="auto"
              sizes="100vw"
              className="h-full w-full"
            />
          ) : null}
        </div>
      </motion.div>

      <motion.span
        aria-hidden="true"
        style={{ left: seamLeft, opacity: seamOpacity }}
        className="absolute inset-y-0 z-20 w-px bg-accent"
      />

      {/* Плотность только под набором и под технической строкой: кадр, ради
          которого вся сцена и построена, не должен приходить сквозь вуаль */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[56%] bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/65 to-transparent"
      />
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#0D0D0D]/70 to-transparent"
      />

      <StageRail direction={direction} />

      {/* Два словаря по сторонам шва. Гаснут вместе с ним: к концу сцены
          разделения между ними уже нет */}
      <motion.div
        style={{ opacity: vocabularyOpacity }}
        className="absolute inset-x-0 top-[34%] z-20 flex justify-between px-6 font-mono text-[0.56rem] uppercase tracking-[0.22em] text-white/70 md:px-10 md:text-[0.66rem] lg:px-20"
      >
        <ul className="space-y-1.5">
          <li className="text-white/35">REAL</li>
          {CAMERA_TERMS.map(term => (
            <li key={term}>{term}</li>
          ))}
        </ul>
        <ul className="space-y-1.5 text-right">
          <li className="text-white/35">GENERATED</li>
          {MODEL_TERMS.map(term => (
            <li key={term}>{term}</li>
          ))}
        </ul>
      </motion.div>

      <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-14 md:px-10 md:pb-16 lg:px-20">
        <motion.div style={{ opacity: conclusion }}>
          <StageTitle
            id={id}
            className="text-[clamp(2.2rem,5.6vw,5rem)] [text-shadow:0_2px_40px_rgba(0,0,0,0.55)]"
          >
            AI video
            <br />
            без AI-эстетики.
          </StageTitle>
        </motion.div>

        <p className="mt-7 max-w-md text-sm leading-relaxed text-white/60 md:text-base">
          Генерация, live action и постпродакшн в одном pipeline.
        </p>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <DirectionCta direction={direction} onBrief={onBrief} onNavigate={onNavigate} />

          {left ? (
            <a
              href={`/projects/${left.slug}`}
              onClick={() => onCaseOpen(direction, left.slug)}
              className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-white/50 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent md:text-[0.68rem]"
            >
              {left.client} — {left.title}
            </a>
          ) : null}
        </div>
      </div>
    </StageShell>
  )
}
