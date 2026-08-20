import { buildLocaleRules } from "@lard/core"
import { createLocalization } from "use-l10n"
import localization, {
  type LocalizationBase,
  languageCodes,
} from "./localization"

/**
 * Правила подбора языка по локали браузера строятся из имён файлов:
 * положили `ru.ts` — и локаль `ru-RU` подхватится сама. Сами правила собирает
 * ядро: ими же пользуется редактор языков, когда показывает, какая локаль на
 * какой файл попадёт.
 */
const localeRules = buildLocaleRules(languageCodes)

export const {
  LocalizationContext,
  useLocalization,
  useCurrentLanguage,
  Localized,
} = createLocalization(localization, "en", localeRules)

/**
 * Код языка. Конкретный набор известен только на этапе сборки — он зависит
 * от того, какие файлы лежат в папке Language, поэтому тип строковый.
 */
export type Language = string

/** Ключ строки. Набор задаётся английским файлом — он полный по определению. */
export type LocalizationKey = keyof LocalizationBase
