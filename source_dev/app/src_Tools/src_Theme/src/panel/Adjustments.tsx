/**
 * Поправки поверх правил — четыре ручки.
 *
 * Правила решают, какого цвета что; ручки — насколько густо. Это и есть
 * разница между расширенным режимом и упрощённым: там пара параметров и всё
 * считается само, здесь тем же правилам можно задать характер, не выписывая
 * каждый цвет руками.
 *
 * Ноль у каждой ручки означает «как посчитано», поэтому тема со всеми нулями
 * — ровно та же тема, что и без поправок. Двойной щелчок возвращает ноль.
 *
 * Испортить читаемость ручками нельзя: поправки применяются до проверки
 * контраста, и пороги WCAG остаются за генератором.
 */

import styled from "@emotion/styled"
import type { ThemeAdjustments } from "@lard/core"
import { useThemeEditor } from "../state/useThemeEditor"
import { Group, GroupTitle, Hint } from "../ui/controls"
import { Knob } from "../ui/Knob"

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: space-between;
`

const knobs: {
  key: keyof ThemeAdjustments
  label: string
  hint: string
}[] = [
  {
    key: "saturation",
    label: "Saturation",
    hint: "Насыщенность цветных элементов: в минус — до серого, в плюс — до звонкого",
  },
  {
    key: "brightness",
    label: "Brightness",
    hint: "Светлота поверхностей: в плюс — к белому, в минус — к чёрному",
  },
  {
    key: "contrast",
    label: "Contrast",
    hint: "Разбег поверхностей: в минус — панели сливаются с фоном, в плюс — расходятся",
  },
  {
    key: "text",
    label: "Text",
    hint: "Плотность текста: от блёклых подписей до плотных",
  },
]

export const Adjustments = () => {
  const { settings, setAdjustment } = useThemeEditor()

  return (
    <Group>
      <GroupTitle>Adjustments</GroupTitle>

      <Row>
        {knobs.map(({ key, label, hint }) => (
          <Knob
            key={key}
            label={label}
            hint={hint}
            value={settings.adjustments[key]}
            onChange={(value) => setAdjustment(key, value)}
          />
        ))}
      </Row>

      <Hint>
        Тянуть вверх и вниз, двойной щелчок — ноль. Ноль означает «как
        посчитано»: правила при этом продолжают держать контраст в норме, что бы
        вы ни накрутили.
      </Hint>
    </Group>
  )
}
