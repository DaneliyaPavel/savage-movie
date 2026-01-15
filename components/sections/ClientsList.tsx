/**
 * Компонент списка Clients в стиле Freshman.tv
 * Вертикальный список с hover видео эффектами
 */
'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { VideoPlayer } from '@/components/features/VideoPlayer'
import type { Client } from '@/lib/api/clients'

interface ClientsListProps {
  clients: Client[]
}

export function ClientsList({ clients }: ClientsListProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  if (clients.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-lg">Клиенты не найдены</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="space-y-px md:space-y-1">
      {clients.map((client, index) => (
        <motion.div
          key={client.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
          onMouseEnter={() => setHoveredId(client.id)}
          onMouseLeave={() => setHoveredId(null)}
          className="group relative"
        >
          <Link
            href={client.slug ? `/clients/${client.slug}` : '#'}
            className="block relative overflow-hidden bg-background/50 hover:bg-background transition-colors"
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between py-8 md:py-12 border-b border-border/30 group-hover:border-primary/50 transition-colors">
                {/* Левая часть - имя и описание */}
                <div className="flex-1 relative z-10">
                  <div className="mb-2">
                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground group-hover:text-primary transition-colors">
                      {client.name}
                    </h3>
                  </div>
                  {client.description && (
                    <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-2xl">
                      {client.description}
                    </p>
                  )}
                </div>

                {/* Правая часть - видео preview при hover */}
                {hoveredId === client.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: 50 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: 50 }}
                    transition={{ duration: 0.4 }}
                    className="absolute right-8 top-1/2 -translate-y-1/2 w-[300px] md:w-[400px] aspect-video rounded-lg overflow-hidden shadow-2xl z-20 pointer-events-none"
                  >
                    {client.video_playback_id ? (
                      <VideoPlayer
                        playbackId={client.video_playback_id}
                        autoplay
                        muted
                        loop
                        controls={false}
                        className="w-full h-full object-cover"
                      />
                    ) : client.video_url ? (
                      <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                      >
                        <source src={client.video_url} type="video/mp4" />
                      </video>
                    ) : client.logo_url ? (
                      <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                        <img
                          src={client.logo_url}
                          alt={client.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    ) : null}
                  </motion.div>
                )}

                {/* Индикатор "смотреть" */}
                <div className="relative z-10 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-primary font-medium text-sm md:text-base">
                    Смотреть →
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
