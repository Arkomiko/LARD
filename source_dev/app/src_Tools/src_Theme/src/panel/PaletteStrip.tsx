/**
 * Палитра с ролями.
 *
 * Пять цветов показаны не просто образцами, а вместе с тем, чем каждый из них
 * становится в интерфейсе: это и есть правило упрощённого режима. Видно сразу
 * и то, почему два последних цвета никуда не попали, кроме украшений.
 */
import styled from "@emotion/styled"
import { useThemeEditor } from "../state/useThemeEditor"

const Strip = styled.ol`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
`

const Swatch = styled.li<{ $muted: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  opacity: ${({ $muted }) => ($muted ? 0.6 : 1)};
`

const Chip = styled.span`
  height: 2.25rem;
  border-radius: var(--radius-control);
  border: 1px solid var(--color-divider);
`

const Role = styled.span`
  font-size: 0.625rem;
  line-height: 1.2;
  color: var(--color-text-secondary);
`

const Value = styled.span`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--color-text-tertiary);
`

/** Кому достаётся каждый цвет палитры — по порядку выразительности. */
const roles = [
  { name: "Основной", what: "Главные кнопки, активные вкладки, переключатели" },
  { name: "Вторичный", what: "Обводки полей, второстепенные кнопки, ссылки" },
  { name: "Фон-акцент", what: "Бейджи, подсветка выделенных строк" },
  { name: "Украшение", what: "Линии и значки. Ни текста, ни фона карточек" },
  { name: "Украшение", what: "Графики. Ни текста, ни фона карточек" },
]

export const PaletteStrip = () => {
  const { palette } = useThemeEditor()

  return (
    <Strip>
      {palette.map((color, index) => (
        // Ключ — место в палитре: цвета в ней могут совпасть, роли — нет.
        <Swatch
          key={`slot-${index}-${roles[index].name}`}
          $muted={index >= 3}
          title={roles[index].what}
        >
          <Chip style={{ background: color }} />
          <Role>{roles[index].name}</Role>
          <Value>{color}</Value>
        </Swatch>
      ))}
    </Strip>
  )
}
