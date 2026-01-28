import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Handwritten font "Sa No Rules Regular" - next/font/local fails build if files are missing; fallback is runtime only.
const saNoRules = localFont({
  src: [
    {
      path: "../public/fonts/SANoRulesRegular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/SANoRulesRegular.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/SANoRulesRegular.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-handwritten",
  display: "swap",
  fallback: ["Kalam", "Caveat", "cursive"],
});


export const metadata: Metadata = {
  title: "SAVAGE MOVIE | Видеопродакшн | ИИ-генерация | Обучение",
  description: "Полный цикл видеопродакшна от разработки креативной концепции до публикации. Реклама, клипы, имиджевые видео. Обучение ИИ-генерации, съемке и монтажу.",
  keywords: ["видеопродакшн", "ИИ-генерация", "обучение видео", "съемка", "монтаж", "продюсирование"],
  icons: {
    icon: "/sm-logo.svg",
    shortcut: "/sm-logo.svg",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <body
        className={`${saNoRules.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
