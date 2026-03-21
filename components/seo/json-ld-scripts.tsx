/**
 * Renders JSON-LD script(s) as server-side <script> tags.
 * No client JS needed — SEO crawlers get structured data immediately.
 *
 * Security: `scripts` are build-time constants from layout.tsx (JSON.stringify of
 * hard-coded objects), never user input — dangerouslySetInnerHTML is safe here.
 */
export function JsonLdScripts({ scripts }: { scripts: string[] }) {
  return (
    <>
      {scripts.map((json, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: json }}
        />
      ))}
    </>
  )
}
