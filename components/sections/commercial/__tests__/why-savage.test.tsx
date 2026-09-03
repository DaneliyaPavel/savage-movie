/**
 * Proof-ссылка тезиса «Почему Savage» должна сверяться со всеми реально
 * опубликованными проектами, а не только с четырьмя карточками, показанными
 * в гриде кейсов лендинга — иначе существующий кейс (например, AI-работа)
 * молча теряет доказательство только из-за того, что не попал в топ-4.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import type { WhyContent } from '@/lib/commercial-landing/content'
import { WhySavage } from '../why-savage'

/** whileInView опирается на IntersectionObserver, которого нет в jsdom */
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

const content: WhyContent = {
  title: 'Почему Savage',
  items: [
    {
      title: 'Live action + AI в одном пайплайне',
      description: 'Снимаем и дорисовываем в одной команде',
      caseSlug: 'biotherm-ai',
      caseLabel: 'Смотреть кейс Biotherm',
    },
    {
      title: 'Тезис без реального кейса',
      description: 'На такой тезис ссылку не ставим',
      caseSlug: 'nonexistent-slug',
      caseLabel: 'Смотреть кейс',
    },
  ],
}

describe('WhySavage — proof-ссылки', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)
  })

  it('показывает ссылку на кейс, которого нет в четырёх карточках грида, но который реально опубликован', () => {
    render(
      <WhySavage
        content={content}
        // biotherm-ai не входит в 4 карточки грида лендинга, но есть в полном
        // списке опубликованных проектов
        availableCaseSlugs={['wellery', 'mavin', 'best-western', 'biotherm-ai']}
        onCaseOpen={vi.fn()}
      />
    )

    const link = screen.getByRole('link', { name: /Смотреть кейс Biotherm/ })
    expect(link).toHaveAttribute('href', '/projects/biotherm-ai')
  })

  it('не показывает ссылку, если кейс реально не существует в портфолио', () => {
    render(
      <WhySavage
        content={content}
        availableCaseSlugs={['wellery', 'mavin', 'best-western', 'biotherm-ai']}
        onCaseOpen={vi.fn()}
      />
    )

    expect(screen.queryByRole('link', { name: 'Смотреть кейс' })).not.toBeInTheDocument()
  })
})
