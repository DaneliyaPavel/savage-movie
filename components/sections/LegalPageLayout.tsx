'use client'

import { motion } from 'framer-motion'
import { TopBar } from '@/components/ui/top-bar'
import { JalousieMenu } from '@/components/ui/jalousie-menu'

interface LegalPageLayoutProps {
  title: string
  subtitle?: string
  date?: string
  children: React.ReactNode
}

export function LegalPageLayout({ title, subtitle, date, children }: LegalPageLayoutProps) {
  return (
    <main className="min-h-screen bg-background">
      <TopBar />
      <JalousieMenu />

      <article className="pt-32 pb-24 px-6 md:px-10 lg:px-20">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight leading-tight mb-4">
              {title}
            </h1>
            {subtitle && (
              <p className="text-lg text-muted-foreground">{subtitle}</p>
            )}
            {date && (
              <p className="text-sm text-muted-foreground mt-4 font-mono">
                Дата утверждения: {date}
              </p>
            )}
          </motion.header>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="legal-content"
          >
            {children}
          </motion.div>
        </div>
      </article>

      {/* Footer */}
      <footer className="px-6 md:px-10 lg:px-20 py-10 border-t border-border">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <span>&copy; 2026 Savage Movie</span>
          <div className="flex gap-6 font-mono text-xs uppercase tracking-wider">
            <a href="/privacy" className="hover:text-foreground transition-colors">
              Политика ПД
            </a>
            <a href="/terms" className="hover:text-foreground transition-colors">
              Условия
            </a>
            <a href="/consent" className="hover:text-foreground transition-colors">
              Согласие
            </a>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .legal-content section {
          margin-bottom: 2.5rem;
        }
        .legal-content h2 {
          font-size: 1.25rem;
          font-weight: 500;
          margin-bottom: 1rem;
          margin-top: 2rem;
          letter-spacing: -0.01em;
        }
        .legal-content h3 {
          font-size: 1.05rem;
          font-weight: 500;
          margin-bottom: 0.75rem;
          margin-top: 1.5rem;
          opacity: 0.9;
        }
        .legal-content p {
          margin-bottom: 0.75rem;
          line-height: 1.75;
          opacity: 0.85;
        }
        .legal-content ul {
          list-style: none;
          padding-left: 0;
          margin-bottom: 1rem;
        }
        .legal-content ul li {
          position: relative;
          padding-left: 1.25rem;
          margin-bottom: 0.5rem;
          line-height: 1.7;
          opacity: 0.85;
        }
        .legal-content ul li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.7em;
          width: 6px;
          height: 1px;
          background: currentColor;
          opacity: 0.4;
        }
        .legal-content strong {
          font-weight: 500;
        }
      `}</style>
    </main>
  )
}
