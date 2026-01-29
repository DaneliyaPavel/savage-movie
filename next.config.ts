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
        hostname: '**.mux.com',
      },
      {
        protocol: 'https',
        hostname: 'image.mux.com',
      },
    ],
    // Разрешаем загруженные файлы с локального сервера
    unoptimized: false,
  },
  // Оптимизация для видео
  experimental: {
    optimizePackageImports: ['@mux/mux-player-react', 'lucide-react'],
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
