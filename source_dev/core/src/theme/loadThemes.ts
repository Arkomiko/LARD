import {
  collectPresets,
  type PresetModules,
  pickPreset,
} from "../presets/presetFolder"
import {
  baseTheme,
  defaultThemeName,
  type Theme,
  type ThemeFile,
} from "./Theme"

/** Разобранная папка тем. */
export interface ThemeCollection {
  /** Готовые темы по имени файла. */
  themes: Record<string, Theme>
  /** Подписи тем — для выпадающего списка в настройках. */
  themeLabels: Record<string, string>
  /** Имена тем, найденные в папке. */
  themeNames: string[]
  /** Тема по имени. Неизвестное имя не должно ронять интерфейс. */
  getTheme: (name: string) => Theme
}

/**
 * Подпись и настройки генератора — не цвета, и попасть в тему они не должны:
 * иначе у темы из редактора оказались бы лишние ключи против остальных.
 */
const colorsOf = (file: ThemeFile): Partial<Theme> => {
  const { label: _label, generator: _generator, ...colors } = file
  return colors
}

/**
 * Собирает темы из файлов папки `Theme`.
 *
 * Базовая тема подмешивается первой: неполный файл не оставит интерфейс без
 * цветов, а просто унаследует недостающие.
 */
export const loadThemes = (
  modules: PresetModules<ThemeFile>,
): ThemeCollection => {
  const { values, labels, names } = collectPresets<ThemeFile, Theme>(modules, {
    build: (file) => ({ ...baseTheme, ...colorsOf(file) }),
    label: (file) => file.label,
  })

  return {
    themes: values,
    themeLabels: labels,
    themeNames: names,
    getTheme: (name) => pickPreset(values, name, defaultThemeName) ?? baseTheme,
  }
}
