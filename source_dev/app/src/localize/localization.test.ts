import { describe, expect, it } from "vitest"
import en from "../../../Tools_presets/Language/en"
import localization, { languageCodes, languageLabels } from "./localization"

describe("автоматическая регистрация языков", () => {
  it("находит файлы в папке Language без ручной регистрации", () => {
    expect(languageCodes).toContain("en")
    expect(languageCodes).toContain("ru")
  })

  it("берёт подпись для списка языков из самого файла", () => {
    expect(languageLabels.en).toBe("English")
    expect(languageLabels.ru).toBe("Русский")
  })

  it("использует перевод там, где он есть", () => {
    expect(localization.ru["piano-roll"]).toBe("Пианоролл")
  })

  it("подставляет английский вместо непереведённых ключей", () => {
    // "midi-routing" намеренно не переведён в ru.ts — на нём и проверяем,
    // что неполный перевод не оставляет пустых надписей.
    expect(localization.ru["midi-routing"]).toBe(en["midi-routing"])
  })

  it("даёт каждому языку полный набор ключей", () => {
    const expected = Object.keys(en).sort()
    for (const code of languageCodes) {
      expect(Object.keys(localization[code]).sort()).toEqual(expected)
    }
  })
})
