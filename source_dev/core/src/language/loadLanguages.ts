import {
  collectPresets,
  type PresetModules,
  presetNameFromPath,
} from "../presets/presetFolder"
import { defaultLanguageCode, type Translation } from "./Language"

/** Разобранная папка языков. */
export interface LanguageCollection<TBase> {
  /** Полные словари по коду языка. */
  localization: Record<string, TBase>
  /** Названия языков — для выпадающего списка в настройках. */
  languageLabels: Record<string, string>
  /** Коды языков, найденные в папке. */
  languageCodes: string[]
}

/**
 * Собирает языки из файлов папки `Language`.
 *
 * Словарь запасного языка подмешивается первым: без него неполный перевод
 * оставил бы пустые надписи, а так недостающие строки просто остаются
 * английскими.
 */
export const loadLanguages = <TBase extends object>(
  modules: PresetModules<Translation<TBase>>,
  fallbackCode: string = defaultLanguageCode,
): LanguageCollection<TBase> => {
  const fallbackEntry = Object.entries(modules).find(
    ([path]) => presetNameFromPath(path) === fallbackCode,
  )
  const fallback = (fallbackEntry?.[1]?.default ?? {}) as TBase

  const { values, labels, names } = collectPresets<Translation<TBase>, TBase>(
    modules,
    { build: (file) => ({ ...fallback, ...file }) as TBase },
  )

  return {
    localization: values,
    languageLabels: labels,
    languageCodes: names,
  }
}
