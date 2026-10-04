/**
 * Renders JSON-LD script(s) as server-side <script> tags.
 * No client JS needed — SEO crawlers get structured data immediately.
 *
 * Безопасность: `scripts` — результат JSON.stringify, но часть данных приходит из БД/CMS
 * (блог, курсы), и "</script>" внутри строки закрыл бы тег и выполнил остаток как разметку.
 * Поэтому каждый скрипт проходит через escapeJsonLd.
 */

/**
 * Экранирует JSON для вставки внутрь <script>: "<" -> \u003c, а также U+2028/U+2029.
 * Все три символа в JSON бывают только внутри строк, где \uXXXX — штатная запись,
 * поэтому JSON.parse(результат) даёт те же данные, что и JSON.parse(исходника).
 */
export function escapeJsonLd(json: string): string {
  return json
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

export function JsonLdScripts({ scripts }: { scripts: string[] }) {
  return (
    <>
      {scripts.map((json, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: escapeJsonLd(json) }}
        />
      ))}
    </>
  )
}
