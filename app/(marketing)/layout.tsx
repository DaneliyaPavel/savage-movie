/**
 * Layout для маркетинговых страниц (главная, проекты, курсы и т.д.)
 * Портируем из v0 reference - используем I18nProvider и MenuProvider
 */
import { MarketingLayoutClient } from "./layout-client"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MarketingLayoutClient>{children}</MarketingLayoutClient>
}
