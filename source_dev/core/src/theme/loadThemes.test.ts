import { describe, expect, it } from "vitest"
import { loadThemes } from "./loadThemes"
import { baseTheme, type ThemeFile } from "./Theme"

const modules = {
  "../../Theme/dark.json": { default: { label: "Тёмная" } as ThemeFile },
  "../../Theme/neon.json": {
    default: { label: "Неон", themeColor: "#00ff88" } as ThemeFile,
  },
  "../../Theme/bare.json": { default: {} as ThemeFile },
}

describe("загрузка тем", () => {
  const { themes, themeLabels, themeNames, getTheme } = loadThemes(modules)

  it("находит темы по файлам папки", () => {
    expect(themeNames).toEqual(["dark", "neon", "bare"])
  })

  it("берёт подпись из файла, а без неё — имя файла", () => {
    expect(themeLabels.neon).toBe("Неон")
    expect(themeLabels.bare).toBe("bare")
  })

  it("использует цвета файла там, где они заданы", () => {
    expect(themes.neon.themeColor).toBe("#00ff88")
  })

  it("добирает недостающие цвета из базовой темы", () => {
    expect(themes.bare).toEqual(baseTheme)
  })

  it("не тащит подпись в саму тему", () => {
    // Иначе у темы с подписью оказался бы лишний ключ против остальных.
    expect(Object.keys(themes.neon).sort()).toEqual(
      Object.keys(baseTheme).sort(),
    )
  })

  it("откатывается на тёмную при неизвестном имени", () => {
    expect(getTheme("нет такой темы")).toEqual(themes.dark)
  })

  it("не падает, когда папка пуста", () => {
    expect(loadThemes({}).getTheme("dark")).toEqual(baseTheme)
  })
})
