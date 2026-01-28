/**
 * Админка: "О нас" → "Наша команда"
 * Хранение: settings.about_team (JSON массив)
 */
'use client'

import type React from 'react'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { BackButton } from '@/components/ui/back-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FileUpload } from '@/components/admin/FileUpload'
import { SortableList } from '@/components/admin/SortableList'
import { getSettings, updateSettings, type JsonValue } from '@/lib/api/settings'
import { ChevronDown, Loader2, Plus, Trash2 } from 'lucide-react'

type PhotoCrop = {
  x: number // 0..100 (object-position)
  y: number // 0..100 (object-position)
  zoom: number // 1..2
}

type TeamMember = {
  id: string
  name: string
  position: string
  photo_url?: string | null
  photo_crop?: PhotoCrop | null
  bio?: string | null
}

const DEFAULT_CROP: PhotoCrop = { x: 50, y: 50, zoom: 1 }

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function normalizeCrop(raw: unknown): PhotoCrop | null {
  if (!isRecord(raw)) return null
  const x = typeof raw.x === 'number' ? raw.x : null
  const y = typeof raw.y === 'number' ? raw.y : null
  const zoom = typeof raw.zoom === 'number' ? raw.zoom : null
  if (x === null || y === null || zoom === null) return null
  return { x: clamp(x, 0, 100), y: clamp(y, 0, 100), zoom: clamp(zoom, 1, 2) }
}

function toDisplayUrl(url: string) {
  if (!url) return url
  return url.startsWith('http') ? url : url.startsWith('/') ? url : `/${url}`
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

    result.push({ id, name, position, photo_url, photo_crop, bio })
  }
  return result
}

function generateId(): string {
  // crypto.randomUUID может отсутствовать / быть недоступен (http, старые браузеры)
  if (typeof crypto !== 'undefined') {
    if ('randomUUID' in crypto && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
    if ('getRandomValues' in crypto && typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16)
      crypto.getRandomValues(bytes)
      return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    }
  }
  return `tmp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function newMember(): TeamMember {
  const id = generateId()
  return { id, name: '', position: '', photo_url: null, photo_crop: DEFAULT_CROP, bio: null }
}

function PhotoCropper({
  url,
  crop,
  onChange,
}: {
  url: string
  crop: PhotoCrop
  onChange: (crop: PhotoCrop) => void
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const dragState = useRef<{ startX: number; startY: number; startCrop: PhotoCrop } | null>(null)
  const [dragging, setDragging] = useState(false)
  const ignoreMouseUntil = useRef<number>(0)

  useEffect(() => {
    if (!dragging) return

    const handleMove = (clientX: number, clientY: number) => {
      if (!ref.current) return
      const st = dragState.current
      if (!st) return

      const rect = ref.current.getBoundingClientRect()
      const dx = clientX - st.startX
      const dy = clientY - st.startY
      const nextX = clamp(st.startCrop.x - (dx / rect.width) * 100, 0, 100)
      const nextY = clamp(st.startCrop.y - (dy / rect.height) * 100, 0, 100)
      onChange({ ...crop, x: nextX, y: nextY })
    }

    const onPointerMoveWin = (e: PointerEvent) => handleMove(e.clientX, e.clientY)
    const onPointerUpWin = () => {
      dragState.current = null
      setDragging(false)
    }

    // Поддержка браузеров без Pointer Events (на всякий случай)
    const onMouseMoveWin = (e: MouseEvent) => handleMove(e.clientX, e.clientY)
    const onMouseUpWin = () => {
      dragState.current = null
      setDragging(false)
    }

    window.addEventListener('pointermove', onPointerMoveWin, { passive: true })
    window.addEventListener('pointerup', onPointerUpWin, { passive: true })
    window.addEventListener('pointercancel', onPointerUpWin, { passive: true })
    window.addEventListener('mousemove', onMouseMoveWin, { passive: true })
    window.addEventListener('mouseup', onMouseUpWin, { passive: true })

    return () => {
      window.removeEventListener('pointermove', onPointerMoveWin)
      window.removeEventListener('pointerup', onPointerUpWin)
      window.removeEventListener('pointercancel', onPointerUpWin)
      window.removeEventListener('mousemove', onMouseMoveWin)
      window.removeEventListener('mouseup', onMouseUpWin)
    }
  }, [dragging, crop, onChange])

  const startDrag = (clientX: number, clientY: number) => {
    dragState.current = { startX: clientX, startY: clientY, startCrop: crop }
    setDragging(true)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    ignoreMouseUntil.current = Date.now() + 800
    startDrag(e.clientX, e.clientY)
  }

  const onMouseDown = (e: React.MouseEvent) => {
    if (Date.now() < ignoreMouseUntil.current) return
    if (e.button !== 0) return
    e.preventDefault()
    startDrag(e.clientX, e.clientY)
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">
        Потяните фото мышкой/пальцем, чтобы выбрать кадр. Можно также настроить ползунками.
      </div>

      <div
        ref={ref}
        className="relative w-full max-w-sm aspect-[3/4] overflow-hidden rounded-lg border bg-muted select-none touch-none cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onMouseDown={onMouseDown}
      >
        <Image
          src={toDisplayUrl(url)}
          alt="Preview"
          fill
          sizes="(min-width: 768px) 384px, 100vw"
          className="object-cover"
          style={{
            objectPosition: `${crop.x}% ${crop.y}%`,
            transform: `scale(${crop.zoom})`,
            transformOrigin: `${crop.x}% ${crop.y}%`,
          }}
          draggable={false}
        />
        {/* Overlay */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10" />
          <div className="absolute left-1/2 top-1/2 w-12 h-12 -translate-x-1/2 -translate-y-1/2 border border-white/40 rounded-full" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-white/20" />
          <div className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 bg-white/20" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">X</div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={crop.x}
            onChange={(e) => onChange({ ...crop, x: Number(e.target.value) })}
            className="w-full"
          />
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Y</div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={crop.y}
            onChange={(e) => onChange({ ...crop, y: Number(e.target.value) })}
            className="w-full"
          />
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Zoom</div>
          <input
            type="range"
            min={1}
            max={2}
            step={0.01}
            value={crop.zoom}
            onChange={(e) => onChange({ ...crop, zoom: Number(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {Math.round(crop.x)}% / {Math.round(crop.y)}% / {crop.zoom.toFixed(2)}x
        </span>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange(DEFAULT_CROP)}>
          Сбросить
        </Button>
      </div>
    </div>
  )
}

export default function AdminAboutTeamPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [team, setTeam] = useState<TeamMember[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const canSave = useMemo(() => !saving && !loading, [saving, loading])

  useEffect(() => {
    const load = async () => {
      try {
        const settings = await getSettings()
        const loaded = normalizeTeam(settings.about_team)
        setTeam(loaded)
        setExpandedId(loaded[0]?.id || null)
      } catch (e) {
        console.error('Ошибка загрузки settings:', e)
        setTeam([])
        setExpandedId(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const updateMember = (id: string, patch: Partial<TeamMember>) => {
    setTeam((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }

  const removeMember = (id: string) => {
    setTeam((prev) => prev.filter((m) => m.id !== id))
  }

  const save = async () => {
    setSaving(true)
    try {
      // Нормализуем пустые строки → null (для JSON-аккуратности)
      const payload = team.map((m) => ({
        id: m.id,
        name: m.name.trim(),
        position: m.position.trim(),
        photo_url: m.photo_url && m.photo_url.trim() ? m.photo_url.trim() : null,
        photo_crop: m.photo_crop
          ? {
              x: clamp(m.photo_crop.x, 0, 100),
              y: clamp(m.photo_crop.y, 0, 100),
              zoom: clamp(m.photo_crop.zoom, 1, 2),
            }
          : DEFAULT_CROP,
        bio: m.bio && m.bio.trim() ? m.bio.trim() : null,
      }))

      await updateSettings({
        about_team: payload,
      })
      alert('Команда сохранена!')
    } catch (e) {
      console.error('Ошибка сохранения команды:', e)
      alert(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8">Загрузка...</div>

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <Breadcrumbs
          items={[{ label: 'Админ-панель', href: '/admin' }, { label: 'О нас / Команда' }]}
          className="mb-4"
        />
        <BackButton href="/admin" className="mb-4" />
        <h1 className="text-3xl font-bold mb-2">О нас — Наша команда</h1>
        <p className="text-muted-foreground">
          Добавляйте/удаляйте участников, меняйте фото, должность и описание. Отображается в блоке «Наша команда» на
          странице «О нас / Студия».
        </p>
      </div>

      <div className="sticky top-16 z-10 bg-background/80 backdrop-blur border border-border rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Участников: <span className="text-foreground font-medium">{team.length}</span>
          </div>
          <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const m = newMember()
            setTeam((prev) => [...prev, m])
            setExpandedId(m.id)
          }}
          disabled={saving}
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить участника
        </Button>

        <Button type="button" onClick={save} disabled={!canSave}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Сохранение...
            </>
          ) : (
            'Сохранить'
          )}
        </Button>
          </div>
        </div>
      </div>

      {team.length === 0 ? (
        <div className="p-6 border rounded-lg text-muted-foreground">Список пуст. Добавьте первого участника.</div>
      ) : (
        <SortableList
          items={team}
          getItemId={(m) => m.id}
          onReorder={(items) => setTeam(items)}
          className="space-y-3"
        >
          {(member) => (
            <div className="space-y-4">
              <div
                role="button"
                tabIndex={0}
                className="w-full flex items-center justify-between gap-4 text-left cursor-pointer"
                onClick={() => setExpandedId((prev) => (prev === member.id ? null : member.id))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setExpandedId((prev) => (prev === member.id ? null : member.id))
                  }
                }}
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{member.name?.trim() || 'Новый участник'}</div>
                  <div className="text-sm text-muted-foreground truncate">{member.position?.trim() || 'Без должности'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeMember(member.id)
                      setExpandedId((prev) => (prev === member.id ? null : prev))
                    }}
                    disabled={saving}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Удалить
                  </Button>
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground transition-transform ${
                      expandedId === member.id ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>

              {expandedId === member.id ? (
                <div className="pt-2 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor={`member-name-${member.id}`} className="text-sm font-medium">Имя</label>
                      <Input
                        id={`member-name-${member.id}`}
                        value={member.name}
                        onChange={(e) => updateMember(member.id, { name: e.target.value })}
                        placeholder="Например: Павел Данелия"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor={`member-position-${member.id}`} className="text-sm font-medium">Должность</label>
                      <Input
                        id={`member-position-${member.id}`}
                        value={member.position}
                        onChange={(e) => updateMember(member.id, { position: e.target.value })}
                        placeholder="Например: Режиссёр / Продюсер"
                      />
                    </div>
                  </div>

              <div className="space-y-2">
                <label htmlFor={`member-bio-${member.id}`} className="text-sm font-medium">Описание (опционально)</label>
                <Textarea
                  id={`member-bio-${member.id}`}
                  value={member.bio || ''}
                  onChange={(e) => updateMember(member.id, { bio: e.target.value })}
                  rows={3}
                  placeholder="Коротко о человеке / специализация"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor={`member-photo-${member.id}`} className="text-sm font-medium">Фото</label>
                <FileUpload
                  type="image"
                  inputId={`member-photo-${member.id}`}
                  existingFiles={member.photo_url ? [member.photo_url] : []}
                  onUpload={(url) =>
                    updateMember(member.id, {
                      photo_url: url,
                      photo_crop: member.photo_crop || DEFAULT_CROP,
                    })
                  }
                  onRemove={() => updateMember(member.id, { photo_url: null })}
                />
              </div>

              {member.photo_url ? (
                <div className="pt-2">
                  <label className="text-sm font-medium block mb-2">Кадрирование фото</label>
                  <PhotoCropper
                    url={member.photo_url}
                    crop={member.photo_crop || DEFAULT_CROP}
                    onChange={(photo_crop) => updateMember(member.id, { photo_crop })}
                  />
                </div>
              ) : null}
                </div>
              ) : null}
            </div>
          )}
        </SortableList>
      )}
    </div>
  )
}
