/**
 * Люди и география.
 *
 * Люди — только те, кого владелец завёл в админке (about_team): фото, имя,
 * должность, без добавленных от себя биографий и регалий. Нет ни одной записи —
 * колонка не рендерится. География — три строки без адресов: публичного офиса
 * у студии нет.
 */
'use client'

import type { CSSProperties } from 'react'
import Image from 'next/image'

import { ABOUT_PLACES } from '@/lib/about/content'
import type { TeamMember } from '@/lib/about/team'
import { cn } from '@/lib/utils'
import { KIT_KICKER, setTitle } from '../direction/direction-kit'

function Member({ member, index }: { member: TeamMember; index: number }) {
  const { crop } = member
  return (
    <li
      data-reveal=""
      style={{ '--reveal-delay': `${index * 80}ms` } as CSSProperties}
      className="group"
    >
      {member.photoUrl ? (
        <div className="relative aspect-[3/4] overflow-hidden bg-[#0a0a0a]">
          <div className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]">
            <Image
              src={member.photoUrl}
              alt={member.name ? `${member.name}, ${member.position || 'Savage Movie'}` : 'Команда'}
              fill
              quality={75}
              sizes="(min-width: 1024px) 22vw, (min-width: 640px) 40vw, 80vw"
              className="object-cover grayscale transition-[filter] duration-700 group-hover:grayscale-0"
              style={{
                objectPosition: `${crop.x}% ${crop.y}%`,
                transform: `scale(${crop.zoom})`,
                transformOrigin: `${crop.x}% ${crop.y}%`,
              }}
            />
          </div>
        </div>
      ) : null}
      <p className="mt-5 font-stage text-[clamp(1.4rem,2.2vw,2rem)] uppercase leading-none tracking-tight text-white">
        {member.name}
      </p>
      {member.position ? (
        <p className="dir-kit-meta mt-2 font-mono uppercase text-white/60">{member.position}</p>
      ) : null}
    </li>
  )
}

export function AboutPeople({ team }: { team: TeamMember[] }) {
  const hasTeam = team.length > 0

  return (
    <section
      id="about-people"
      aria-labelledby="about-people-title"
      className="relative border-t border-white/10 bg-black px-6 py-20 md:px-10 md:py-32 lg:px-20"
    >
      <div data-reveal="" className={KIT_KICKER}>
        <span aria-hidden="true" className="h-px w-8 bg-accent" />
        07 / {hasTeam ? 'Люди и география' : 'География'}
      </div>
      <h2
        id="about-people-title"
        data-reveal=""
        className="mt-6 max-w-[56rem] font-stage text-[clamp(1.9rem,3.7vw,3.4rem)] uppercase leading-[0.95] tracking-[-0.035em] text-white text-balance [overflow-wrap:anywhere]"
      >
        {setTitle(hasTeam ? 'Кто с вами работает и где мы снимаем' : 'Где мы снимаем')}
      </h2>

      <div
        className={cn(
          'mt-12 grid gap-14 md:mt-16',
          hasTeam && 'lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20'
        )}
      >
        {hasTeam ? (
          <ul
            className={cn(
              'grid max-w-[34rem] grid-cols-1 gap-8 lg:max-w-none',
              team.length > 1 && 'sm:grid-cols-2'
            )}
          >
            {team.map((member, index) => (
              <Member key={member.id} member={member} index={index} />
            ))}
          </ul>
        ) : null}

        <ul className="self-end border-t border-white/15">
          {ABOUT_PLACES.map((place, index) => (
            <li
              key={place.name}
              data-reveal=""
              style={{ '--reveal-delay': `${index * 80}ms` } as CSSProperties}
              className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-white/15 py-6 md:py-8"
            >
              <span className="font-brand-hero text-[clamp(1.9rem,4.6vw,4rem)] uppercase leading-[0.95] tracking-tighter text-white">
                {place.name}
              </span>
              <span className="dir-kit-meta font-mono uppercase text-white/60">{place.note}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
