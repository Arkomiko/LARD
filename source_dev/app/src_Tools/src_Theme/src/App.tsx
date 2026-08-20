/**
 * LARDed — Theme: редактор тем LARD.
 *
 * Слева настройки, справа макет. Между ними ничего не пересылается вручную:
 * и то и другое читает одно состояние, а тему по нему считает ядро.
 *
 * Куда попадёт правка — решает `scope`: при `Full` тему носит весь редактор,
 * при `Prototyping` — только макет. Разбирается с этим `EditorTheme`.
 */
import styled from "@emotion/styled"
import { SettingsPanel } from "./panel/SettingsPanel"
import { Preview } from "./preview/Preview"
import { ThemeEditorProvider, useThemeEditor } from "./state/useThemeEditor"
import { EditorTheme } from "./ui/EditorTheme"

const Layout = styled.div`
  display: flex;
  height: 100%;
  min-height: 0;
`

const Editor = () => {
  const { theme, scope } = useThemeEditor()

  return (
    <EditorTheme theme={theme} scope={scope}>
      <Layout>
        <SettingsPanel />
        <Preview />
      </Layout>
    </EditorTheme>
  )
}

export const App = () => (
  <ThemeEditorProvider>
    <Editor />
  </ThemeEditorProvider>
)
