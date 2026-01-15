import type { NextConfig } from "next";

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
  },
  // Оптимизация для видео
  experimental: {
    optimizePackageImports: ['@mux/mux-player-react', 'lucide-react'],
  },
  // Поддержка статических файлов из uploads
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
    ];
  },
};

export default nextConfig;
