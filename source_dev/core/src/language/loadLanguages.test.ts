import { describe, expect, it } from "vitest"
import { loadLanguages } from "./loadLanguages"

const en = { play: "Play", stop: "Stop", "midi-routing": "MIDI routing" }
type Base = typeof en

const modules = {
  "../../Language/en.ts": { default: en, label: "English" },
  "../../Language/ru.ts": {
    default: { play: "Играть", stop: "Стоп" },
    label: "Русский",
  },
  "../../Language/fr.ts": { default: { play: "Jouer" } },
}

describe("загрузка языков", () => {
  const { localization, languageLabels, languageCodes } =
    loadLanguages<Base>(modules)

  it("находит языки по файлам папки", () => {
    expect(languageCodes).toEqual(["en", "ru", "fr"])
  })

  it("берёт название языка из файла, а без него — код", () => {
    expect(languageLabels.ru).toBe("Русский")
    expect(languageLabels.fr).toBe("fr")
  })

  it("использует перевод там, где он есть", () => {
    expect(localization.ru.play).toBe("Играть")
  })

  it("подставляет английский вместо непереведённых ключей", () => {
    expect(localization.ru["midi-routing"]).toBe(en["midi-routing"])
  })

  it("даёт каждому языку полный набор ключей", () => {
    const expected = Object.keys(en).sort()
    for (const code of languageCodes) {
      expect(Object.keys(localization[code]).sort()).toEqual(expected)
    }
  })

  it("не падает, когда запасного языка в папке нет", () => {
    const { localization: only } = loadLanguages<Base>({
      "../../Language/ru.ts": { default: { play: "Играть" } },
    })
    expect(only.ru.play).toBe("Играть")
  })
})
