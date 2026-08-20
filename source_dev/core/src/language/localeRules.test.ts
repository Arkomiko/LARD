import { describe, expect, it } from "vitest"
import { buildLocaleRules } from "./localeRules"

/** Как язык подбирает use-l10n: первое правило, совпавшее с локалью. */
const match = (rules: [RegExp, string][], locale: string) =>
  rules.find(([pattern]) => pattern.test(locale))?.[1]

describe("подбор языка по локали браузера", () => {
  const rules = buildLocaleRules(["en", "ru", "zh-Hans", "zh-Hant"])

  it("узнаёт язык по началу локали", () => {
    expect(match(rules, "ru-RU")).toBe("ru")
    expect(match(rules, "en-GB")).toBe("en")
  })

  it("разводит региональные варианты китайского по письменностям", () => {
    expect(match(rules, "zh-TW")).toBe("zh-Hant")
    expect(match(rules, "zh-CN")).toBe("zh-Hans")
    expect(match(rules, "zh")).toBe("zh-Hans")
  })

  it("не даёт короткому коду перехватить длинный", () => {
    const withShort = buildLocaleRules(["zh", "zh-Hant"])
    expect(match(withShort, "zh-Hant")).toBe("zh-Hant")
  })

  it("отбрасывает правила для языков, которых нет в папке", () => {
    // Уводить локаль на язык без файла незачем: перевода всё равно нет.
    expect(match(buildLocaleRules(["en"]), "zh-TW")).toBeUndefined()
  })
})
