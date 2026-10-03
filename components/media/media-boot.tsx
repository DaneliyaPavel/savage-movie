/**
 * Загрузчик медиа-поверхностей, вставленный инлайном в <head>.
 *
 * Инлайном, а не внешним скриптом: ни одного дополнительного запроса, и
 * hero-видео начинает качаться, как только парсер увидел <video>, — до
 * гидратации. Код собирается из lib/media/boot/boot.ts (npm run media:boot).
 */
import { MEDIA_BOOT_SCRIPT } from '@/lib/media/boot/boot.generated'

export function MediaBoot() {
  return <script id="sm-boot" dangerouslySetInnerHTML={{ __html: MEDIA_BOOT_SCRIPT }} />
}
