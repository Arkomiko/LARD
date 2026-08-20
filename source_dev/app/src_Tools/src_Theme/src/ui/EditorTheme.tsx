/**
 * Оформление редактора.
 *
 * Тему носит либо весь редактор, либо только макет — это и есть
 * `Full` / `Prototyping`:
 *
 *   - `full` — переменные правимой темы уходят корню страницы, и панель
 *     настроек перекрашивается вместе с макетом. Видно не только «как будет
 *     выглядеть окно», но и «каково этой темой пользоваться»: если подпись
 *     пропала на панели редактора, она пропадёт и в программе;
 *   - `prototype` — корню достаётся собственная тема редактора, а правимая
 *     живёт только на рамке макета. Так цвет проверяют на образце, не теряя
 *     из виду сам редактор.
 *
 * Общие правила страницы вынесены в постоянный стиль: в нём нет ни одного
 * значения из темы, поэтому emotion собирает его один раз за всё время
 * работы. Всё, что меняется, — переменные, и они ставятся мимо emotion.
 */
import { css, Global, ThemeProvider } from "@emotion/react"
import { baseTheme, type Theme } from "@lard/core"
import type { ReactNode } from "react"
import type { ThemeScope } from "../state/useThemeEditor"
import { useThemeVariables } from "./themeVariables"

export { themeVariables } from "./themeVariables"

/** Собственная тема редактора — та же тёмная, что стоит в LARD по умолчанию. */
export const editorTheme = baseTheme

const globalStyles = css`
  html,
  body,
  #root {
    height: 100%;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: var(--font-sans);
    font-size: 0.8125rem;
    color: var(--color-text);
    background: var(--color-background);
    -webkit-font-smoothing: subpixel-antialiased;
  }

  * {
    box-sizing: border-box;
  }

  /* Клавиатура должна быть видна: обводка по теме, а не системная. */
  :focus-visible {
    outline: 2px solid var(--color-theme);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    * {
      transition: none !important;
      animation: none !important;
    }
  }
`

export const EditorTheme = ({
  theme,
  scope,
  children,
}: {
  theme: Theme
  scope: ThemeScope
  children: ReactNode
}) => {
  useThemeVariables(
    document.documentElement,
    scope === "full" ? theme : editorTheme,
  )

  // Правимая тема остаётся темой emotion при любой области: по ней считают
  // контраст на вкладке элементов, а он относится к правимой теме, а не к
  // той, в которую одет редактор.
  return (
    <ThemeProvider theme={theme}>
      <Global styles={globalStyles} />
      {children}
    </ThemeProvider>
  )
}
