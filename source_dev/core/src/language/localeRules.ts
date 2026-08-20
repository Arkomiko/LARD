/**
 * Подбор языка по локали браузера.
 *
 * Правила строятся из имён файлов: положили `ru.ts` — и локаль `ru-RU`
 * подхватится сама, дописывать что-либо в коде не нужно.
 */

/**
 * Региональные варианты китайского из имени файла не выводятся: локаль `zh-TW`
 * должна попасть в `zh-Hant`, а `zh-CN` — в `zh-Hans`. Такие пары приходится
 * задавать списком.
 */
const scriptAliases: [RegExp, string][] = [
  [/^zh$/, "zh-Hans"],
  [/^zh-CN$/, "zh-Hans"],
  [/^zh-SG$/, "zh-Hans"],
  [/^zh-TW$/, "zh-Hant"],
  [/^zh-HK$/, "zh-Hant"],
  [/^zh-MO$/, "zh-Hant"],
]

/**
 * Правила «локаль → код языка» для найденных в папке языков.
 *
 * Длинные коды идут первыми, иначе `zh` перехватил бы `zh-Hans`. Правила для
 * отсутствующих языков отбрасываются: незачем уводить локаль на язык, файла
 * которого нет.
 */
export const buildLocaleRules = (codes: string[]): [RegExp, string][] => {
  const aliases = scriptAliases.filter(([, code]) => codes.includes(code))

  const byCode = codes
    .slice()
    .sort((a, b) => b.length - a.length)
    .map((code): [RegExp, string] => [new RegExp(`^${code}`, "i"), code])

  return [...aliases, ...byCode]
}
