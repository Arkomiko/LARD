/**
 * Проверка темы на читаемость.
 *
 * Упрощённый режим не даёт испортить тему — там контраст подгоняется сам.
 * А в расширенном и разработчиковом человек правит цвета руками, и тогда
 * единственное, что можно сделать, — сказать, что именно сломалось и где.
 * Поэтому у каждой находки указано поле темы: редактор показывает сообщение
 * прямо под той крутилкой, из-за которой оно появилось.
 */

import { contrastRatio, WCAG_AA_LARGE, WCAG_AA_TEXT } from "../../color/color"
import { colorBlindnessLabels, confusingFor } from "../../color/colorblind"
import type { Theme } from "../Theme"

export type ThemeIssueLevel = "error" | "warning"

export interface ThemeIssue {
  /** Поле темы, к которому относится замечание. */
  field: keyof Theme
  level: ThemeIssueLevel
  message: string
}

/**
 * Пары «цвет на фоне», которые обязаны читаться.
 *
 * Уровень задан у каждой пары, а не выведен из недобора: то, без чего
 * интерфейсом нельзя пользоваться, — ошибка, а бледная подпись рядом с
 * читаемым текстом — повод предупредить, но не запрещать.
 */
const textPairs: {
  field: keyof Theme
  background: keyof Theme
  what: string
  minRatio: number
  level: ThemeIssueLevel
}[] = [
  {
    field: "textColor",
    background: "backgroundColor",
    what: "основной текст на фоне окна",
    minRatio: WCAG_AA_TEXT,
    level: "error",
  },
  {
    field: "secondaryTextColor",
    background: "backgroundColor",
    what: "второстепенный текст на фоне окна",
    minRatio: WCAG_AA_TEXT,
    level: "error",
  },
  {
    field: "tertiaryTextColor",
    background: "secondaryBackgroundColor",
    what: "подписи и подсказки на фоне полей",
    minRatio: WCAG_AA_LARGE,
    level: "warning",
  },
  {
    field: "onSurfaceColor",
    background: "themeColor",
    what: "надпись на кнопке основного цвета",
    minRatio: WCAG_AA_TEXT,
    level: "error",
  },
  {
    field: "themeColor",
    background: "backgroundColor",
    what: "основной цвет на фоне окна",
    minRatio: WCAG_AA_LARGE,
    level: "warning",
  },
]

/** Цвета, которые обязаны различаться между собой. */
const distinctPairs: {
  field: keyof Theme
  other: keyof Theme
  what: string
}[] = [
  { field: "greenColor", other: "redColor", what: "зелёный и красный" },
  { field: "recordColor", other: "themeColor", what: "запись и основной цвет" },
  {
    field: "cursorColor",
    other: "editorGridColor",
    what: "курсор воспроизведения и сетка редактора",
  },
]

const round = (value: number) => Math.round(value * 10) / 10

/**
 * Все замечания к теме. Пустой список — тема читаемая.
 *
 * Ошибка — там, где текст не прочитать; предупреждение — там, где интерфейс
 * работает, но части людей будет тяжело.
 */
export const checkTheme = (theme: Theme): ThemeIssue[] => {
  const issues: ThemeIssue[] = []

  for (const { field, background, what, minRatio, level } of textPairs) {
    const ratio = contrastRatio(String(theme[field]), String(theme[background]))

    if (ratio < minRatio) {
      issues.push({
        field,
        level,
        message: `Контраст ${round(ratio)}:1 — ${what} читается плохо. Нужно от ${minRatio}:1.`,
      })
    }
  }

  for (const { field, other, what } of distinctPairs) {
    const confused = confusingFor(String(theme[field]), String(theme[other]))

    if (confused.length > 0) {
      issues.push({
        field,
        level: "warning",
        message: `${what[0].toUpperCase()}${what.slice(1)} сливаются при ${confused
          .map((type) => colorBlindnessLabels[type])
          .join(", ")}.`,
      })
    }
  }

  return issues
}

/** Замечания по одному полю — редактору, чтобы показать их рядом с крутилкой. */
export const issuesOf = (issues: ThemeIssue[], field: keyof Theme) =>
  issues.filter((issue) => issue.field === field)
