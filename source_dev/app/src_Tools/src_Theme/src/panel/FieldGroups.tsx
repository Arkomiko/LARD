/**
 * Ручная правка значений темы.
 *
 * Показывается и в расширенном режиме, и в разработчиковом — разница только в
 * том, какие группы полей отданы. Правленое поле помечено и его можно вернуть
 * к посчитанному; в разработчиковом режиме возвращать не к чему, поэтому
 * кнопки возврата там нет.
 */
import styled from "@emotion/styled"
import { issuesOf, parseColor, rgbToHex, type Theme } from "@lard/core"
import { useThemeEditor } from "../state/useThemeEditor"
import {
  ColorField,
  Field,
  Group,
  GroupTitle,
  Hint,
  TextInput,
} from "../ui/controls"
import { type FieldGroup, textFields } from "./fields"

const Head = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
`

const Reset = styled.button`
  padding: 0;
  font: inherit;
  font-size: 0.6875rem;
  color: var(--color-text-secondary);
  background: none;
  border: none;
  border-bottom: 1px dashed currentColor;
  cursor: pointer;
`

const Changed = styled.span`
  font-size: 0.625rem;
  color: var(--color-theme);
`

/**
 * Пипетка понимает только `#rrggbb`. В теме цвет может быть записан иначе —
 * например `hsl(...)` или `rgba(...)`, — поэтому в пипетку отдаём приведённое
 * значение, а в текстовом поле оставляем как есть.
 */
const asSwatch = (value: string): string => {
  const rgb = parseColor(value)
  return rgb === undefined ? "#000000" : rgbToHex(rgb)
}

export const FieldGroups = ({ groups }: { groups: FieldGroup[] }) => {
  const { theme, overrides, issues, mode, setOverride, clearOverride } =
    useThemeEditor()

  return (
    <>
      {groups.map((group) => (
        <Group key={group.title}>
          <GroupTitle>{group.title}</GroupTitle>
          {group.hint !== undefined && <Hint>{group.hint}</Hint>}

          {group.fields.map(({ field, label }) => {
            const value = String(theme[field])
            const isChanged = overrides[field] !== undefined
            const canReset = isChanged && mode !== "dev"

            return (
              <Field
                key={field}
                label={
                  <Head>
                    <span>{label}</span>
                    {isChanged && mode !== "dev" && <Changed>правлено</Changed>}
                  </Head>
                }
                meta={
                  canReset ? (
                    <Reset
                      type="button"
                      onClick={() => clearOverride(field as keyof Theme)}
                    >
                      вернуть посчитанное
                    </Reset>
                  ) : (
                    value
                  )
                }
                issues={issuesOf(issues, field)}
              >
                {textFields.includes(field) ? (
                  <TextInput
                    value={value}
                    spellCheck={false}
                    onChange={(e) => setOverride(field, e.target.value)}
                  />
                ) : (
                  <ColorField
                    value={value}
                    swatch={asSwatch(value)}
                    onChange={(next) => setOverride(field, next)}
                  />
                )}
              </Field>
            )
          })}
        </Group>
      ))}
    </>
  )
}
