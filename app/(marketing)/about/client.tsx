/**
 * Клиентский компонент страницы About в премиум стиле Freshman.tv
 * Редакторский стиль: портрет, манифест, клиенты
 */
'use client'

import { motion } from 'framer-motion'
import { Film, Users, Award } from 'lucide-react'
import { SectionTitle } from '@/components/ui/section-title'
import { GrainOverlay } from '@/components/ui/grain-overlay'
import { EditorialCorrection } from '@/components/ui/editorial-correction'
import { HoverNote } from '@/components/ui/hover-note'
import { ScribbleMark } from '@/components/ui/graphic-marks'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { getClients } from '@/lib/api/clients'
import { useEffect, useState } from 'react'
import type { Client } from '@/lib/api/clients'
import { getSettings, type JsonValue } from '@/lib/api/settings'

type TeamMember = {
  id: string
  name: string
  position: string
  photo_url?: string | null
  photo_crop?: { x: number; y: number; zoom: number } | null
  bio?: string | null
}

const DEFAULT_CROP = { x: 50, y: 50, zoom: 1 }
const TEAM_PLACEHOLDERS = [
  '/team-placeholder-1.svg',
  '/team-placeholder-2.svg',
  '/team-placeholder-3.svg',
  '/team-placeholder-4.svg',
  '/team-placeholder-5.svg',
] as const

function hashSeed(seed: string): number {
  let h = 5381
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) + h) ^ seed.charCodeAt(i)
  }
  return h >>> 0
}

function teamPlaceholderFor(seed: string) {
  const idx = hashSeed(seed) % TEAM_PLACEHOLDERS.length
  return TEAM_PLACEHOLDERS[idx] ?? TEAM_PLACEHOLDERS[0]
}

function TeamMemberPhoto({ member }: { member: TeamMember }) {
  const [usePlaceholder, setUsePlaceholder] = useState(false)
  const crop = member.photo_crop || DEFAULT_CROP

  const resolvedPhotoUrl = member.photo_url
    ? member.photo_url.startsWith('http')
      ? member.photo_url
      : member.photo_url.startsWith('/')
        ? member.photo_url
        : `/${member.photo_url}`
    : null

  if (!resolvedPhotoUrl || usePlaceholder) {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-10">
        <div className="relative w-full h-full">
          <Image
            src={teamPlaceholderFor(member.id)}
            alt="Team placeholder"
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-contain opacity-80"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0">
      <Image
        src={resolvedPhotoUrl}
        alt={member.name || 'Team member'}
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover opacity-90"
        style={{
          objectPosition: `${crop.x}% ${crop.y}%`,
          transform: `scale(${crop.zoom})`,
          transformOrigin: `${crop.x}% ${crop.y}%`,
        }}
        onError={() => setUsePlaceholder(true)}
      />
    </div>
  )
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function normalizeCrop(raw: unknown): { x: number; y: number; zoom: number } | null {
  if (!isRecord(raw)) return null
  const x = typeof raw.x === 'number' ? raw.x : null
  const y = typeof raw.y === 'number' ? raw.y : null
  const zoom = typeof raw.zoom === 'number' ? raw.zoom : null
  if (x === null || y === null || zoom === null) return null
  return { x: clamp(x, 0, 100), y: clamp(y, 0, 100), zoom: clamp(zoom, 1, 2) }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function normalizeTeam(raw: JsonValue | undefined): TeamMember[] {
  if (!Array.isArray(raw)) return []

  const result: TeamMember[] = []
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i]
    if (!isRecord(item)) continue

    const id = typeof item.id === 'string' && item.id.trim() ? item.id : `legacy-${i}`
    const name = typeof item.name === 'string' ? item.name : ''
    const position = typeof item.position === 'string' ? item.position : ''
    const photo_url = typeof item.photo_url === 'string' ? item.photo_url : null
    const photo_crop = normalizeCrop(item.photo_crop) || DEFAULT_CROP
    const bio = typeof item.bio === 'string' ? item.bio : null

    // Не показываем полностью пустые карточки
    if (!name.trim() && !position.trim() && !photo_url && !bio) continue

    result.push({ id, name, position, photo_url, photo_crop, bio })
  }
  return result
}

export function AboutPageClient() {
  const [clients, setClients] = useState<Client[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])

  useEffect(() => {
    getClients()
      .then(setClients)
      .catch(() => setClients([]))
  }, [])

  useEffect(() => {
    getSettings()
      .then((settings) => setTeam(normalizeTeam(settings.about_team)))
      .catch(() => setTeam([]))
  }, [])

  return (
    <div className="min-h-screen pt-20 pb-20 bg-[#000000]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-20 md:mb-32 editorial-spacing"
        >
          <div className="mb-8">
            <EditorialCorrection
              wrong="О нас"
              correct="Студия"
              className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold"
            />
          </div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-editorial text-[#FFFFFF]/60 font-light leading-relaxed max-w-4xl"
          >
            Смотрим на мир через объектив кинокамеры. Работаем с лучшими исполнителями, 
            чтобы рассказать о вас миру с помощью современных технологий и креатива.
          </motion.p>
        </motion.div>

        {/* Портрет/визуал - крупный, на всю ширину */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative aspect-video md:aspect-[21/9] mb-20 md:mb-32 bg-[#050505] border border-[#1A1A1A] overflow-hidden"
        >
          <GrainOverlay />
          <div className="absolute inset-0 flex items-center justify-center">
            <Film className="w-24 h-24 text-[#FFFFFF]/10" />
          </div>
          {/* Placeholder для портрета/видео */}
        </motion.div>

        {/* Манифест */}
        <section className="mb-20 md:mb-32 editorial-spacing">
          <HoverNote note="story">
            <div className="mb-12 relative">
              <SectionTitle mark="arrow" markPosition="top-left" size="lg" className="text-[#FFFFFF]">
                Наша история
              </SectionTitle>
              {/* SVG scribble mark */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="absolute -right-8 top-1/2 -translate-y-1/2 hidden lg:block"
              >
                <ScribbleMark width={100} color="#ff2936" animate={true} />
              </motion.div>
            </div>
          </HoverNote>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8 text-editorial text-[#FFFFFF]/80 font-light leading-relaxed max-w-4xl"
          >
            <p>
              Мы работаем так, чтобы люди смотрели, а вам всегда хотелось сказать: 
              «Это именно то, что нужно!»
            </p>
            <p>
              SAVAGE MOVIE — это команда профессионалов, которые создают видеоконтент 
              высочайшего качества. От коммерческих роликов до музыкальных клипов, 
              от ИИ-генерации до полного цикла продакшна.
            </p>
            <p>
              Мы не просто снимаем видео — мы создаем истории, которые вдохновляют, 
              продают и запоминаются.
            </p>
          </motion.div>
        </section>

        {/* Достижения */}
        <section className="mb-20 md:mb-32 border-t border-[#1A1A1A] pt-16 editorial-spacing">
          <SectionTitle mark="plus" markPosition="top-left" size="lg" className="text-[#FFFFFF] mb-16">
            Достижения
          </SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
            {[
              { icon: Film, value: '100+', label: 'Проектов' },
              { icon: Users, value: '50+', label: 'Клиентов' },
              { icon: Award, value: '10+', label: 'Наград' },
            ].map((achievement, index) => {
              const Icon = achievement.icon
              return (
                <motion.div
                  key={achievement.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="mb-6">
                    <Icon className="w-8 h-8 text-[#ff2936]" />
                  </div>
                  <div className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold mb-4 text-[#FFFFFF]">
                    {achievement.value}
                  </div>
                  <p className="text-lg md:text-xl text-[#FFFFFF]/60">{achievement.label}</p>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* Миссия */}
        <section className="mb-20 md:mb-32 border-t border-[#1A1A1A] pt-16 editorial-spacing">
          <SectionTitle mark="circle" markPosition="top-left" size="lg" className="text-[#FFFFFF] mb-12">
            Наша миссия
          </SectionTitle>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-editorial text-[#FFFFFF]/80 font-light leading-relaxed max-w-4xl"
          >
            Использовать креативность для продвижения самых амбициозных брендов, 
            организаций и проектов в России и за её пределами. Создавать видеоконтент, 
            который не просто демонстрирует продукт или услугу, но и вдохновляет, 
            мотивирует и оставляет незабываемое впечатление.
          </motion.p>
        </section>

        {/* Наша команда */}
        {team.length > 0 && (
          <section className="mb-20 md:mb-32 border-t border-[#1A1A1A] pt-16 editorial-spacing">
            <SectionTitle mark="cross" markPosition="top-left" size="lg" className="text-[#FFFFFF] mb-12">
              Наша команда
            </SectionTitle>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
            >
              {team.map((m, index) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-[#050505] border border-[#1A1A1A] overflow-hidden"
                >
                  <div className="relative aspect-[3/4] bg-[#0A0A0A] overflow-hidden">
                    <GrainOverlay />
                    <TeamMemberPhoto member={m} />
                  </div>

                  <div className="p-5">
                    <div className="space-y-2">
                      <div className="font-heading font-bold text-xl text-[#FFFFFF]">{m.name || '—'}</div>
                      <div className="text-sm text-[#FFFFFF]/60">{m.position || ''}</div>
                      {m.bio && (
                        <p className="text-sm text-[#FFFFFF]/70 leading-relaxed">
                          {m.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </section>
        )}

        {/* Клиенты */}
        {clients.length > 0 && (
          <section className="border-t border-[#1A1A1A] pt-16 editorial-spacing">
            <SectionTitle mark="cross" markPosition="top-left" size="lg" className="text-[#FFFFFF] mb-12">
              Наши клиенты
            </SectionTitle>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
            >
              {clients.slice(0, 8).map((client, index) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ scale: 1.05 }}
                  className="aspect-video bg-[#050505] border border-[#1A1A1A] hover:border-[#FFFFFF]/30 transition-colors flex items-center justify-center p-4"
                >
                  {client.logo_url ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={client.logo_url}
                        alt={client.name}
                        fill
                        sizes="(min-width: 768px) 25vw, 50vw"
                        className="object-contain opacity-60 hover:opacity-100 transition-opacity"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-[#FFFFFF]/40 font-medium">{client.name}</span>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </section>
        )}

        {/* CTA к контактам */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="border-t border-[#1A1A1A] pt-16 mt-20 md:mt-32"
        >
          <div className="max-w-3xl">
            <h2 className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl mb-6 text-[#FFFFFF]">
              Готовы начать проект?
            </h2>
            <p className="text-lg md:text-xl text-[#FFFFFF]/60 font-light mb-8 leading-relaxed">
              Свяжитесь с нами, и мы обсудим ваш проект
            </p>
            <HoverNote note="let's talk">
              <Link href="/contact">
                <motion.div
                  className="inline-flex items-center gap-4 group"
                  whileHover={{ x: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="text-xl md:text-2xl font-medium text-[#FFFFFF] group-hover:text-[#ff2936] transition-colors">
                    Связаться
                  </span>
                  <ArrowRight className="w-6 h-6 text-[#FFFFFF]/60 group-hover:text-[#ff2936] transition-colors" />
                </motion.div>
              </Link>
            </HoverNote>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
