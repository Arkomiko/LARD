/**
 * Раздача переменных темы элементу.
 *
 * Имена — те же, что раздаёт LARD, поэтому разметка редактора и разметка
 * макета написаны одинаково: `var(--color-text)` и там и там.
 *
 * Переменные ставятся прямо на элемент, а не собираются в стиль emotion.
 * Разница видна руками: стиль на каждую правку цвета пересобирается заново и
 * вставляется в таблицу стилей новым правилом — за один проход по ползунку
 * пипетки их набегают сотни, и браузер каждый раз перечитывает таблицу
 * целиком. `setProperty` меняет одно значение, и пересчитывается только то,
 * что от него зависит. Ради этого же переменные сравниваются с предыдущими:
 * из сорока с лишним при подборе цвета меняются единицы.
 *
 * Второе, что это даёт, — область. Переменные наследуются вниз по дереву,
 * поэтому «тема только на макете» — это те же переменные, поставленные не
 * корню страницы, а рамке макета. Никакой отдельной ветки в разметке.
 */
import type { Theme } from "@lard/core"
import { type RefObject, useLayoutEffect, useRef } from "react"

/** Переменные темы — тот же набор имён, что раздаёт LARD. */
export const themeVariables = (theme: Theme): Record<string, string> => ({
  "--font-sans": theme.font,
  "--font-mono": theme.monoFont,
  "--color-theme": theme.themeColor,
  "--color-on-surface": theme.onSurfaceColor,
  "--color-background": theme.backgroundColor,
  "--color-background-secondary": theme.secondaryBackgroundColor,
  "--color-background-dark": theme.darkBackgroundColor,
  "--color-editor-background": theme.editorBackgroundColor,
  "--color-editor-grid": theme.editorGridColor,
  "--color-editor-grid-secondary": theme.editorSecondaryGridColor,
  "--color-divider": theme.dividerColor,
  "--color-popup-border": theme.popupBorderColor,
  "--color-text": theme.textColor,
  "--color-text-secondary": theme.secondaryTextColor,
  "--color-text-tertiary": theme.tertiaryTextColor,
  "--color-piano-key-black": theme.pianoKeyBlack,
  "--color-piano-key-white": theme.pianoKeyWhite,
  "--color-piano-lane-black": theme.pianoBlackKeyLaneColor,
  "--color-piano-lane-white": theme.pianoWhiteKeyLaneColor,
  "--color-piano-lane-highlighted": theme.pianoHighlightedLaneColor,
  "--color-piano-lane-edge": theme.pianoLaneEdgeColor,
  "--color-ghost-note": theme.ghostNoteColor,
  "--color-record": theme.recordColor,
  "--color-cursor": theme.cursorColor,
  "--color-shadow": theme.shadowColor,
  "--color-highlight": theme.highlightColor,
  "--color-green": theme.greenColor,
  "--color-red": theme.redColor,
  "--color-yellow": theme.yellowColor,
  "--radius-corner": theme.cornerRadius,
  "--radius-control": theme.controlCornerRadius,
})

type Target = HTMLElement | RefObject<HTMLElement | null> | null

const resolve = (target: Target): HTMLElement | null => {
  if (target === null) {
    return null
  }
  return target instanceof HTMLElement ? target : target.current
}

/**
 * Ставит на элемент переменные темы, трогая только изменившиеся.
 *
 * Смена элемента или темы обрабатывается одинаково: предыдущие значения
 * помнятся, новые с ними сравниваются. При смене элемента сравнивать не с чем
 * — тогда пишется весь набор.
 */
export const useThemeVariables = (target: Target, theme: Theme): void => {
  const applied = useRef<{
    element: HTMLElement | null
    variables: Record<string, string>
  }>({ element: null, variables: {} })

  useLayoutEffect(() => {
    const element = resolve(target)
    if (element === null) {
      return
    }

    const next = themeVariables(theme)
    const previous =
      applied.current.element === element ? applied.current.variables : {}

    for (const [name, value] of Object.entries(next)) {
      if (previous[name] !== value) {
        element.style.setProperty(name, value)
      }
    }

    applied.current = { element, variables: next }
  }, [target, theme])
}
