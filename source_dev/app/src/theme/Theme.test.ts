import { describe, expect, it } from "vitest"
import { getTheme, themeLabels, themeNames, themes } from "./Theme"

describe("автоматическая регистрация тем", () => {
  it("находит файлы в папке Theme без ручной регистрации", () => {
    expect(themeNames).toContain("dark")
    expect(themeNames).toContain("light")
    expect(themeNames).toContain("windows10")
    expect(themeNames).toContain("flstudio")
  })

  it("берёт подпись для списка тем из самого файла", () => {
    expect(themeLabels.windows10).toBe("Windows 10")
    expect(themeLabels.flstudio).toBe("FL Studio")
  })

  it("использует цвета темы там, где они заданы", () => {
    // Системный синий Windows 10.
    expect(themes.windows10.themeColor).toBe("#0078d4")
    // Линия такта в палитре FL Studio.
    expect(themes.flstudio.editorGridColor).toBe("#1a2c37")
  })

  it("даёт каждой теме полный набор полей", () => {
    const expected = Object.keys(themes.dark).sort()
    for (const name of themeNames) {
      expect(Object.keys(themes[name]).sort()).toEqual(expected)
    }
  })

  it("не роняет интерфейс на неизвестном имени темы", () => {
    // Так бывает, когда файл темы удалили, а в настройках она осталась.
    expect(getTheme("нет такой темы")).toEqual(themes.dark)
  })
})
