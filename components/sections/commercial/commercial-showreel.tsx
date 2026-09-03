/**
 * Полноширинная визуальная пауза между коммерчески плотными секциями.
 *
 * Здесь нужен отдельный commercial cut на 30–45 секунд — бренды, продукты,
 * HoReCa, fashion, business, AI и live action. Общий showreel с музыкальными
 * клипами эту задачу не решает: он про другое портфолио.
 *
 * Пока такой cut не смонтирован, playbackId в CMS пуст и блок не рендерится.
 * Показывать вместо него общий ролик было бы подменой обещания.
 */
'use client'

import type { ShowreelContent } from '@/lib/commercial-landing/content'
import { LazyHlsVideo } from './lazy-hls-video'

interface CommercialShowreelProps {
  content: ShowreelContent
  onVideoMilestone: (milestone: 'start' | 'half' | 'complete') => void
}

export function CommercialShowreel({ content, onVideoMilestone }: CommercialShowreelProps) {
  if (!content.playbackId) return null

  return (
    <section className="relative border-t border-[#1A1A1A] bg-[#000000]">
      <LazyHlsVideo
        playbackId={content.playbackId}
        loop
        autoPlay
        controls
        aspect="16 / 9"
        title={content.title}
        className="w-full"
        onProgressMilestone={onVideoMilestone}
      />
      <div className="px-6 py-6 md:px-10 lg:px-20">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-white/55 md:text-xs">
          {content.title}
        </p>
        <p className="mt-2 text-sm text-white/50">{content.caption}</p>
      </div>
    </section>
  )
}
