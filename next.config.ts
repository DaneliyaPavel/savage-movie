import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.b-cdn.net',
      },
    ],
    // Next 16 требует явного списка quality. 50 — кадры под затемнением в ролле
    // /clients, 65 — превью в блоке задач, 75 — дефолт для остальных картинок.
    qualities: [50, 65, 75],
    // Разрешаем загруженные файлы с локального сервера
    unoptimized: false,
  },
  // Оптимизация для видео
  experimental: {
    optimizePackageImports: [
      'hls.js',
      'lucide-react',
      'framer-motion',
      'date-fns',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
    ],
  },
  // Веб-видео и постеры (docs/media-pipeline.md): имя файла содержит хеш содержимого,
  // поэтому кеш вечный. nginx отдаёт то же самое, это — для dev и прямого доступа
  async headers() {
    return [
      {
        source: '/media/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },
  // Поддержка статических файлов из uploads через API route
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
    ]
  },
}

export default nextConfig
