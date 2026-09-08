/**
 * Динамическая генерация robots.txt
 */
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://savagemovie.ru'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      /*
       * /login, /register, /callback и /payment/ раньше «прятались» за
       * унаследованным из корневого layout canonical на главную. Canonical
       * оттуда убран, поэтому служебные маршруты закрываются явно — они не
       * должны попадать в индекс сами по себе.
       */
      disallow: [
        '/dashboard/',
        '/admin/',
        '/api/',
        '/login',
        '/register',
        '/callback',
        '/payment/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
