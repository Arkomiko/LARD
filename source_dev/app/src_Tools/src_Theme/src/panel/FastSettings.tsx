/**
 * Упрощённый режим: пара параметров, всё остальное считается само.
 *
 * Больше здесь ничего и не должно быть — в этом весь смысл режима. Всё, что
 * получилось из этой пары, показано рядом палитрой с ролями.
 */
import {
  type HarmonyRule,
  harmonyLabels,
  harmonyRules,
  type ThemeAppearance,
} from "@lard/core"
import { useThemeEditor } from "../state/useThemeEditor"
import {
  ColorField,
  Field,
  Group,
  GroupTitle,
  Hint,
  Segmented,
  Select,
  Switch,
} from "../ui/controls"
import { PaletteStrip } from "./PaletteStrip"

const appearances: { id: ThemeAppearance; title: string; hint: string }[] = [
  { id: "dark", title: "Тёмная", hint: "Светлый текст на тёмном фоне" },
  { id: "light", title: "Светлая", hint: "Тёмный текст на светлом фоне" },
]

export const FastSettings = () => {
  const { settings, setSettings } = useThemeEditor()

  return (
    <>
      <Group>
        <GroupTitle>Основа</GroupTitle>

        <Segmented
          label="Основа темы"
          value={settings.appearance}
          options={appearances}
          onChange={(appearance) => setSettings({ appearance })}
        />

        <Hint>
          Тёмная тема или светлая — выбирается здесь и только здесь. Цвет на это
          не влияет: иначе тема переворачивалась бы прямо во время подбора,
          стоило увести ползунок яркости за середину.
        </Hint>
      </Group>

      <Group>
        <GroupTitle>Цвет и сочетание</GroupTitle>

        <Field label="Базовый цвет" meta={settings.baseColor}>
          <ColorField
            value={settings.baseColor}
            swatch={settings.baseColor}
            onChange={(baseColor) => setSettings({ baseColor })}
          />
        </Field>

        <Field label="Правило сочетания">
          <Select
            value={settings.harmony}
            onChange={(e) =>
              setSettings({ harmony: e.target.value as HarmonyRule })
            }
          >
            {harmonyRules.map((rule) => (
              <option key={rule} value={rule}>
                {harmonyLabels[rule]}
              </option>
            ))}
          </Select>
        </Field>

        <Switch
          label="Окрашенный фон"
          checked={settings.coloredBackground}
          onChange={(coloredBackground) => setSettings({ coloredBackground })}
        />

        <Switch
          label="Больше акцентных цветов"
          checked={settings.moreAccents}
          onChange={(moreAccents) => setSettings({ moreAccents })}
        />
      </Group>

      <Group>
        <GroupTitle>Палитра</GroupTitle>
        <PaletteStrip />
        <Hint>
          Первые три цвета получают роли в интерфейсе. Последние два идут только
          в украшения: ни текста, ни фона карточек ими не красят — они для этого
          слишком светлые или тёмные.
        </Hint>
      </Group>
    </>
  )
}
