/**
 * Левая панель: всё, чем правят тему.
 *
 * Порядок сверху вниз — от «что за тема» к «как она выглядит» и «куда её
 * деть». Расширенный режим показывает сначала упрощённые настройки, а под
 * ними ручные правки: правила остаются в силе, правки ложатся поверх.
 */
import styled from "@emotion/styled"
import { useState } from "react"
import { themeFileOf, useThemeEditor } from "../state/useThemeEditor"
import {
  downloadThemeFile,
  themeFileText,
  themeLabels,
  themeNames,
} from "../storage/themeFiles"
import {
  Button,
  Field,
  Group,
  GroupTitle,
  Hint,
  Select,
  TextInput,
} from "../ui/controls"
import { Adjustments } from "./Adjustments"
import { DevModeDialog } from "./DevModeDialog"
import { FastSettings } from "./FastSettings"
import { FieldGroups } from "./FieldGroups"
import { advancedOnlyGroups, colorGroups } from "./fields"

const Panel = styled.aside`
  display: flex;
  flex-direction: column;
  width: 21rem;
  flex-shrink: 0;
  height: 100%;
  overflow-y: auto;
  padding: 0 1rem 1rem;
  border-right: 1px solid var(--color-divider);
  background: var(--color-background-dark);
`

const Sticky = styled.div`
  position: sticky;
  top: 0;
  z-index: 1;
  padding-top: 1rem;
  background: var(--color-background-dark);
`

const Tabs = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.25rem;
  margin-top: 0.75rem;
  padding: 0.25rem;
  border-radius: var(--radius-control);
  background: var(--color-background-secondary);
`

const Tab = styled.button<{ $active: boolean }>`
  padding: 0.4rem 0.25rem;
  font: inherit;
  font-size: 0.6875rem;
  border: none;
  border-radius: calc(var(--radius-control) - 1px);
  cursor: pointer;
  color: ${({ $active }) =>
    $active ? "var(--color-on-surface)" : "var(--color-text-secondary)"};
  background: ${({ $active }) => ($active ? "var(--color-theme)" : "transparent")};

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`

const Row = styled.div`
  display: flex;
  gap: 0.5rem;
`

const modes = [
  { id: "fast", title: "Fast Designed" },
  { id: "advanced", title: "Advanced" },
  { id: "dev", title: "Dev-Designed" },
] as const

export const SettingsPanel = () => {
  const editor = useThemeEditor()
  const { mode, name, label, setMode, enterDevMode } = editor
  const [askDev, setAskDev] = useState(false)

  const isDev = mode === "dev"

  return (
    <Panel>
      <Sticky>
        <Tabs role="tablist">
          {modes.map(({ id, title }) => (
            <Tab
              key={id}
              type="button"
              role="tab"
              aria-selected={mode === id}
              $active={mode === id}
              disabled={isDev && id !== "dev"}
              title={
                isDev && id !== "dev"
                  ? "Из разработчикового режима возврата нет — создайте новую тему"
                  : undefined
              }
              onClick={() => {
                if (id === "dev") {
                  setAskDev(true)
                } else {
                  setMode(id)
                }
              }}
            >
              {title}
            </Tab>
          ))}
        </Tabs>
      </Sticky>

      <Group>
        <GroupTitle>Тема</GroupTitle>

        <Field label="Название" meta={`${name}.json`}>
          <TextInput
            value={label}
            onChange={(e) => editor.setLabel(e.target.value)}
          />
        </Field>

        <Field label="Имя файла">
          <TextInput
            value={name}
            spellCheck={false}
            onChange={(e) => editor.setName(e.target.value)}
          />
        </Field>

        <Field label="Открыть тему из папки Theme">
          <Select
            value={themeNames.includes(name) ? name : ""}
            onChange={(e) => editor.openTheme(e.target.value)}
          >
            <option value="" disabled>
              Выберите тему
            </option>
            {themeNames.map((themeName) => (
              <option key={themeName} value={themeName}>
                {themeLabels[themeName]}
              </option>
            ))}
          </Select>
        </Field>
      </Group>

      {mode !== "dev" && <FastSettings />}

      {mode === "advanced" && (
        <>
          <Adjustments />

          <Group>
            <GroupTitle>Ручные правки</GroupTitle>
            <Hint>
              Правила сочетания продолжают работать: правки ложатся поверх
              посчитанного. Если правка ломает читаемость, под ней появится
              сообщение.
            </Hint>
          </Group>
          <FieldGroups groups={colorGroups} />
        </>
      )}

      {isDev && (
        <>
          <Group>
            <GroupTitle>Все значения</GroupTitle>
            <Hint>
              Правила не действуют — тема состоит ровно из того, что задано
              здесь. Проверки читаемости остаются: они предупреждают, но ничего
              не меняют.
            </Hint>
          </Group>
          <FieldGroups groups={[...colorGroups, ...advancedOnlyGroups]} />
        </>
      )}

      <Group>
        <GroupTitle>Файл темы</GroupTitle>
        <Row>
          <Button
            type="button"
            $variant="primary"
            onClick={() => downloadThemeFile(name, themeFileOf(editor))}
          >
            Сохранить {name}.json
          </Button>
          <Button
            type="button"
            onClick={() =>
              navigator.clipboard?.writeText(themeFileText(themeFileOf(editor)))
            }
          >
            Скопировать
          </Button>
        </Row>
        <Hint>
          Положите файл в папку <code>Theme</code> в корне репозитория — тема
          появится в настройках LARD сама.
        </Hint>
        <Button type="button" onClick={editor.newTheme}>
          Новая тема
        </Button>
      </Group>

      {askDev && (
        <DevModeDialog
          onKeep={() => {
            enterDevMode(true)
            setAskDev(false)
          }}
          onReset={() => {
            enterDevMode(false)
            setAskDev(false)
          }}
          onCancel={() => setAskDev(false)}
        />
      )}
    </Panel>
  )
}
