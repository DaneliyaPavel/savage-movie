import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import localFont from "next/font/local"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { GrainOverlay } from "@/components/ui/grain-overlay"
import { MenuProvider } from "@/components/ui/menu-context"
import { I18nProvider } from "@/lib/i18n-context"

const geistSans = Geist({
  subsets: ["latin", "cyrillic"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-geist-mono",
})

const saNoRules = localFont({
  src: "../public/fonts/sa-no-rules-regular.woff2",
  variable: "--font-handwritten",
  display: "swap",
  preload: false,
})

export const metadata: Metadata = {
  title: "SAVAGE — Видеопродакшн и AI",
  description:
    "Премиальная продакшн-студия, создающая кинематографичный контент, AI-проекты и обучающие программы для брендов и артистов.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#141414",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${saNoRules.variable} font-sans antialiased bg-background text-foreground overflow-x-hidden`}
      >
        <I18nProvider>
          <MenuProvider>{children}</MenuProvider>
        </I18nProvider>
        <GrainOverlay />
        <Analytics />
      </body>
    </html>
  )
}
