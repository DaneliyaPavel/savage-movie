/**
 * Статичный постер подставляется только шоурилу: у любого другого ролика свой
 * кадр, и чужой постер подменил бы его.
 */
import { describe, expect, it } from 'vitest'

import { SHOWREEL_POSTER } from '@/lib/services/showreel'
import { showreelPosterFor } from '../showreel-poster'

const SHOWREEL_ID = '83ad0e8e-c614-46fd-8324-2c26659ad721'

describe('showreelPosterFor', () => {
  it('видео блока — шоурил: отдаёт статичный постер', () => {
    expect(showreelPosterFor(SHOWREEL_ID, SHOWREEL_ID)).toBe(SHOWREEL_POSTER)
    expect(showreelPosterFor(` ${SHOWREEL_ID} `, SHOWREEL_ID)).toBe(SHOWREEL_POSTER)
  })

  it('другой ролик остаётся со своим автопостером', () => {
    expect(showreelPosterFor('1ea8ba75-551a-428e-be79-d8a2add06a01', SHOWREEL_ID)).toBeNull()
  })

  it('нет видео или нет id шоурила: постера нет, пустые строки не совпадают', () => {
    expect(showreelPosterFor(null, SHOWREEL_ID)).toBeNull()
    expect(showreelPosterFor(undefined, SHOWREEL_ID)).toBeNull()
    expect(showreelPosterFor('', '')).toBeNull()
    expect(showreelPosterFor(SHOWREEL_ID, '')).toBeNull()
  })
})
