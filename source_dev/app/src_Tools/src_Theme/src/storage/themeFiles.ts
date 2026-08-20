/**
 * Файлы тем: чтение папки `Theme` в корне репозитория и запись новой темы.
 *
 * Читаем через то же ядро, что и приложение, — иначе редактор показывал бы
 * тему не такой, какой её увидит LARD.
 *
 * Пишем пока выгрузкой файла: редактор запускается в браузере, а тот в папку
 * репозитория ничего положить не может. Когда редактор соберётся в отдельное
 * окно Electron (этап 7), сюда добавится запись прямо в папку — остальной код
 * при этом не изменится, потому что он ходит только за этими двумя функциями.
 */
import {
  loadThemes,
  type Theme,
  type ThemeFile,
  type ThemeGenerator,
} from "@lard/core"

const modules = import.meta.glob<{ default: ThemeFile }>(
  "../../../../../Tools_presets/Theme/*.json",
  { eager: true },
)

const collection = loadThemes(modules)

/** Темы, лежащие в папке, — по имени файла. */
export const themes = collection.themes

/** Подписи тем — для списка «открыть тему». */
export const themeLabels = collection.themeLabels

/** Имена тем в папке. */
export const themeNames = collection.themeNames

/**
 * Исходное содержимое файла темы: с ним, в отличие от готовой темы, видно,
 * что автор задал сам, а что досталось от базовой темы по умолчанию.
 */
export const themeFiles: Record<string, ThemeFile> = Object.fromEntries(
  Object.entries(modules).map(([path, module]) => [
    path.replace(/^.*\//, "").replace(/\.json$/, ""),
    module.default,
  ]),
)

/** Собирает содержимое файла темы: подпись, настройки редактора и все цвета. */
export const buildThemeFile = (
  label: string,
  generator: ThemeGenerator,
  theme: Theme,
): ThemeFile => ({ label, generator, ...theme })

/** Текст файла темы — то, что уйдёт на диск и что показывает редактор. */
export const themeFileText = (file: ThemeFile): string =>
  `${JSON.stringify(file, null, 2)}\n`

/**
 * Отдаёт файл темы пользователю.
 *
 * Ссылку создаём и убираем тут же: браузер держит объект в памяти, пока на
 * него ссылаются, а тема — это мегабайты текста только в страшном сне.
 */
export const downloadThemeFile = (name: string, file: ThemeFile): void => {
  const blob = new Blob([themeFileText(file)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = `${name}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
