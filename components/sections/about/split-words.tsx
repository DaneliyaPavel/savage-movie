/**
 * Заголовок по словам: каждое слово поднимается из своей маски, когда блок
 * входит в экран (стили — .about-w в about.css, состояние — data-reveal на
 * родителе). Текст остаётся обычным текстом: пробелы между словами сохранены,
 * неразрывные пары из typo() не разрываются.
 */
import type { CSSProperties } from 'react'

import { typo } from '../direction/direction-kit'

export function SplitWords({ text }: { text: string }) {
  const words = typo(text).split(' ').filter(Boolean)
  return (
    <>
      {words.map((word, index) => (
        <span key={`${index}-${word}`}>
          <span className="about-w">
            <span style={{ '--i': index } as CSSProperties}>{word}</span>
          </span>
          {index < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </>
  )
}
