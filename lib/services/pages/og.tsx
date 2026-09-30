/**
 * OG-картинка страницы направления.
 *
 * Композиция собрана кодом, а не подставлена кадром из портфолио: подписи
 * поверх чужого кадра без прав на публикацию в соцсетях — лишний риск. Тот же
 * приём, что у /reklamny-rolik.
 */
import { ImageResponse } from 'next/og'

export const OG_SIZE = { width: 1200, height: 630 } as const

export function directionOgImage(label: string, title: string, sub: string) {
  return new ImageResponse(
    <div
      style={{
        background: '#050505',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px 72px',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span
          style={{
            color: '#8a8a8a',
            fontSize: 22,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
          }}
        >
          Savage Movie / {label}
        </span>
        <span style={{ color: '#5f5f5f', fontSize: 20, letterSpacing: '0.16em' }}>
          Санкт-Петербург · Москва · проекты по России
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <span
          style={{
            color: '#ffffff',
            fontSize: 84,
            lineHeight: 1.02,
            letterSpacing: '-0.03em',
            maxWidth: 960,
            textTransform: 'uppercase',
          }}
        >
          {title}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ width: 3, height: 46, background: '#e5484d', display: 'flex' }} />
          <span style={{ color: '#b4b4b4', fontSize: 28 }}>{sub}</span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          borderTop: '1px solid #1f1f1f',
          paddingTop: 28,
        }}
      >
        <span
          style={{
            color: '#ffffff',
            fontSize: 30,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
          }}
        >
          Savage Movie
        </span>
        <span style={{ color: '#7a7a7a', fontSize: 24 }}>savagemovie.ru</span>
      </div>
    </div>,
    { ...OG_SIZE }
  )
}
