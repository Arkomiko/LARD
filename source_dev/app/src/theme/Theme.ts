/**
 * Темы LARD: чтение папки `source_dev/Tools_presets/Theme`.
 *
 * Сам формат темы, базовые цвета и наложение файла на них живут в
 * `@lard/core` — тем же кодом читает темы редактор тем. Здесь остаётся только
 * то, что приложение обязано сделать само: развернуть папку средствами
 * сборщика.
 *
 * Чтобы сделать свою тему, достаточно положить в папку JSON-файл — он сам
 * появится в настройках. Ничего регистрировать в коде не нужно.
 */
import { loadThemes, type ThemeFile } from "@lard/core"

/**
 * `import.meta.glob` разворачивается на этапе сборки в статический список
 * импортов, поэтому папка читается без обращений к диску во время работы.
 * В режиме разработки правка JSON подхватывается на лету.
 */
const modules = import.meta.glob<{ default: ThemeFile }>(
  "../../../Tools_presets/Theme/*.json",
  { eager: true },
)

const collection = loadThemes(modules)

/** Готовые темы по имени файла. */
export const themes = collection.themes

/** Подписи тем по имени — для выпадающего списка в настройках. */
export const themeLabels = collection.themeLabels

/** Имена тем, найденные в папке. */
export const themeNames = collection.themeNames

/** Тема по имени. Неизвестное имя не должно ронять интерфейс. */
export const getTheme = collection.getTheme

export type { Theme, ThemeFile, ThemeType } from "@lard/core"
export { defaultThemeName } from "@lard/core"
