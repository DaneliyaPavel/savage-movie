/**
 * Упрощенный footer в стиле The Up&Up Group
 */
'use client'

import Link from 'next/link'
import { Mail, Phone, MessageCircle, Instagram, Youtube } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-border/30 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <h3 className="font-heading font-bold text-2xl mb-4 text-foreground">
              SAVAGE MOVIE
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Полный цикл видеопродакшна от разработки креативной концепции до публикации.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-heading font-semibold mb-4 text-sm uppercase tracking-wider text-foreground/70">
              Навигация
            </h4>
            <ul className="space-y-2 text-sm">
              {[
                { href: '/about', label: 'О нас' },
                { href: '/projects', label: 'Проекты' },
                { href: '/courses', label: 'Курсы' },
                { href: '/contact', label: 'Контакты' },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h4 className="font-heading font-semibold mb-4 text-sm uppercase tracking-wider text-foreground/70">
              Контакты
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="mailto:savage.movie@yandex.ru"
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  savage.movie@yandex.ru
                </a>
              </li>
              <li>
                <a
                  href="tel:+79214021839"
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  +7 921 402-18-39
                </a>
              </li>
              <li className="flex items-center gap-3 pt-2">
                {[
                  { href: 'https://t.me/mariseven', icon: MessageCircle, label: 'Telegram' },
                  { href: 'https://www.instagram.com/mari.seven/', icon: Instagram, label: 'Instagram' },
                  { href: 'https://youtube.com/@savagemovie', icon: Youtube, label: 'YouTube' },
                ].map((social) => {
                  const Icon = social.icon
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={social.label}
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  )
                })}
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/30 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} SAVAGE MOVIE. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  )
}
