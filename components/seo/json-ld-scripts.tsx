'use client'

import { useEffect } from 'react'

/**
 * Injects JSON-LD script(s) into the document head.
 * Used for Organization/WebSite and other schema that use build-time data only.
 */
export function JsonLdScripts({ scripts }: { scripts: string[] }) {
  useEffect(() => {
    const elements: HTMLScriptElement[] = []
    scripts.forEach(json => {
      const el = document.createElement('script')
      el.type = 'application/ld+json'
      el.textContent = json
      document.head.appendChild(el)
      elements.push(el)
    })
    return () => {
      elements.forEach(el => {
        if (el.parentNode) el.parentNode.removeChild(el)
      })
    }
  }, [scripts])
  return null
}
