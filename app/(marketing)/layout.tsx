/**
 * Layout для маркетинговых страниц (главная, проекты, курсы и т.д.)
 * Серверный компонент для получения данных, клиентский для анимаций
 */
import { NavigationWrapper } from '@/components/sections/NavigationWrapper'
import { MarketingLayoutClient } from '@/components/sections/MarketingLayoutClient'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // NavigationWrapper - серверный компонент, получает пользователя
  const navigation = <NavigationWrapper />

  return (
    <MarketingLayoutClient navigation={navigation}>
      {children}
    </MarketingLayoutClient>
  )
}
