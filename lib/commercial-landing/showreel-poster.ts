/**
 * Постер шоурила для лендинга.
 *
 * Автопостер Bunny для видео шоурила (`/cdn/<id>/thumbnail.jpg`) отвечает 404,
 * поэтому главная и /services показывают статичный кадр из public/. Лендингу
 * нужен тот же кадр, иначе hero падает на случайный кадр кейса, а блок шоурила
 * остаётся с пустым постером.
 *
 * Постер подставляется только тогда, когда видео блока — действительно шоурил:
 * у другого ролика свой кадр, и чужой постер подменил бы его.
 */
import { SHOWREEL_POSTER } from '@/lib/services/showreel'

export function showreelPosterFor(
  playbackId: string | null | undefined,
  showreelId: string
): string | null {
  const id = playbackId?.trim()
  return id && showreelId && id === showreelId ? SHOWREEL_POSTER : null
}
