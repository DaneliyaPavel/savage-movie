import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SAVAGE MOVIE | Видеопродакшн | ИИ-генерация | Обучение",
  description: "Полный цикл видеопродакшна от разработки креативной концепции до публикации. Реклама, клипы, имиджевые видео. Обучение ИИ-генерации, съемке и монтажу.",
  keywords: ["видеопродакшн", "ИИ-генерация", "обучение видео", "съемка", "монтаж", "продюсирование"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <body
        className={`${inter.variable} ${montserrat.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
