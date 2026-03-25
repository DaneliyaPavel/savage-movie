import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.b-cdn.net',
      },
    ],
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
