import type { ResolvedDirection } from '@/lib/services/proof'

/**
 * Что сцена получает от страницы.
 *
 * Намеренно ничего о раскладке: сцена сама решает, как выглядит её
 * направление. Общими остаются только идентичность, состояние «я на экране»
 * и три обработчика, через которые страница ведёт аналитику и бриф.
 */
export interface SceneProps {
  /** id секции: он же якорь индекса и ключ активной сцены */
  id: string
  direction: ResolvedDirection
  /** Сцена в средней полосе экрана — только тогда играет её видео */
  active: boolean
  /** Открыть бриф с этим направлением */
  onBrief: (direction: ResolvedDirection) => void
  /** Переход на собственную страницу направления */
  onNavigate: (direction: ResolvedDirection) => void
  onCaseOpen: (direction: ResolvedDirection, slug: string) => void
}
