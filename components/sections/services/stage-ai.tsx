'use client'

import { motion, useMotionTemplate, useTransform } from 'framer-motion'

import {
  SceneCredit,
  SceneFoot,
  STAGE_BOTTOM,
  StageRail,
  StageShell,
  StageTitle,
} from './stage-shell'
import { cn } from '@/lib/utils'
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
  /*
   * Правый кадр обрезается, а не сжимается.
   *
   * Раньше контейнер второго кадра ехал по width: это свойство раскладки, и
   * браузер пересчитывал её на каждом кадре прокрутки — тридцать четыре
   * пересчёта за один проход сцены, во весь экран. Видимый результат тот же:
   * clip-path режет тот же прямоугольник по той же отметке шва, но живёт в
   * композиторе и раскладку не трогает вовсе.
   */
  const overlayClip = useMotionTemplate`inset(0 0 0 ${seam}%)`

  const seamOpacity = useTransform(progress, [0.5, 0.86], reduced ? [0, 0] : [1, 0])
  const overlayOpacity = useTransform(progress, [0.5, 0.92], reduced ? [0, 0] : [1, 0])
  /*
   * Словари — это содержание сцены, а не оформление шва. Держать их на той же
   * прозрачности значило бы спрятать их совсем от человека, который попросил
   * убрать движение: у него шва нет с самого начала.
   */
  const vocabularyOpacity = useTransform(progress, [0.5, 0.86], reduced ? [1, 1] : [1, 0])
  // Вывод дотягивается до полной яркости к самому выходу из сцены: пауза
  // после него была прокруткой, на которую экран ничем не отвечал
  const conclusion = useTransform(progress, [0.62, 1], reduced ? [1, 1] : [0.3, 1])

  return (
    <StageShell id={id} direction={direction} containerRef={containerRef} depth={260}>
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

      {/* Второй кадр живёт справа от шва. Кадр всегда во весь экран и никогда
          не меняет размер — видимой остаётся только часть правее отметки */}
      <motion.div
        style={{ clipPath: overlayClip, opacity: overlayOpacity }}
        className="absolute inset-0"
      >
        <div className="absolute inset-0">
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
          которого вся сцена и построена, не должен приходить сквозь вуаль.
          Ниже она выше, чем у соседей: обе половины этой сцены сняты в
          светлом ключе, и вывод обязан читаться на любой секунде потока */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/80 to-transparent"
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
        /* Собственная тень: словари стоят в верхней трети, куда плотность
           намеренно не доходит, а обе половины сцены сняты в светлом ключе */
        className="type-meta absolute inset-x-0 top-[34%] z-20 flex justify-between px-6 font-mono uppercase text-white/80 [text-shadow:0_1px_16px_rgba(0,0,0,0.85)] md:px-10 lg:px-20"
      >
        <ul className="space-y-1.5">
          <li className="text-white/50">REAL</li>
          {CAMERA_TERMS.map(term => (
            <li key={term}>{term}</li>
          ))}
        </ul>
        <ul className="space-y-1.5 text-right">
          <li className="text-white/50">GENERATED</li>
          {MODEL_TERMS.map(term => (
            <li key={term}>{term}</li>
          ))}
        </ul>
      </motion.div>

      <div
        className={cn(
          'relative z-10 flex h-full flex-col justify-end px-6 md:px-10 lg:px-20',
          STAGE_BOTTOM
        )}
      >
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

        <SceneFoot
          className="mt-8"
          cta={<DirectionCta direction={direction} onBrief={onBrief} onNavigate={onNavigate} />}
          aside={
            left ? (
              <SceneCredit
                href={`/projects/${left.slug}`}
                onClick={() => onCaseOpen(direction, left.slug)}
              >
                {left.client} — {left.title}
              </SceneCredit>
            ) : undefined
          }
        />
      </div>
    </StageShell>
  )
}
