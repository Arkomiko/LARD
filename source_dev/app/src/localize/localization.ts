/**
 * Языки LARD: чтение папки `source_dev/Tools_presets/Language`.
 *
 * Слияние неполного перевода с английским живёт в `@lard/core` — тем же кодом
 * читает переводы редактор языков. Здесь остаётся только разворачивание папки
 * средствами сборщика.
 *
 * Папка лежит рядом с исходниками, а не внутри `src`: переводы правятся как
 * обычные текстовые файлы, без хождения по дереву кода. В готовый продукт она
 * копируется как `Data/Language` рядом с программой.
 */
import { loadLanguages } from "@lard/core"
import type en from "../../../Tools_presets/Language/en"

/** Полный набор ключей задаёт английский — он же основа для остальных. */
export type LocalizationBase = typeof en

/** Перевод может покрывать не все ключи: недостающие берутся из английского. */
export type Translation = Partial<LocalizationBase>

/**
 * `import.meta.glob` разворачивается на этапе сборки в статический список
 * импортов, поэтому достаточно положить в папку новый файл — язык сам
 * появится и в настройках, и в подборе по локали браузера.
 */
const modules = import.meta.glob<{ default: Translation; label?: string }>(
  "../../../Tools_presets/Language/*.ts",
  { eager: true },
)

const collection = loadLanguages<LocalizationBase>(modules)

/** Подписи языков по коду — для выпадающего списка в настройках. */
export const languageLabels = collection.languageLabels

/** Коды языков, найденные в папке. Английский есть всегда. */
export const languageCodes = collection.languageCodes

export default collection.localization
