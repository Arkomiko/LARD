import { describe, expect, it } from "vitest"
import { confusingFor, simulateColorBlindness } from "../../color/colorblind"
import { baseTheme } from "../Theme"
import { checkTheme, issuesOf } from "./checkTheme"

describe("проверка темы", () => {
  it("к базовой теме претензий нет", () => {
    expect(checkTheme(baseTheme).filter((i) => i.level === "error")).toEqual([])
  })

  it("ловит нечитаемый текст и показывает, какое поле виновато", () => {
    const broken = { ...baseTheme, textColor: baseTheme.backgroundColor }
    const issues = issuesOf(checkTheme(broken), "textColor")

    expect(issues).toHaveLength(1)
    expect(issues[0].level).toBe("error")
    expect(issues[0].message).toContain("Контраст")
  })

  it("ловит надпись, потерявшуюся на кнопке", () => {
    const broken = { ...baseTheme, onSurfaceColor: baseTheme.themeColor }
    expect(issuesOf(checkTheme(broken), "onSurfaceColor")).toHaveLength(1)
  })

  it("ловит основной цвет, слившийся с фоном", () => {
    const broken = { ...baseTheme, themeColor: baseTheme.backgroundColor }
    expect(issuesOf(checkTheme(broken), "themeColor")).toHaveLength(1)
  })

  it("предупреждает, когда цвета сливаются при дальтонизме", () => {
    // Зелёный и красный различаются по яркости, но не по оттенку.
    const broken = { ...baseTheme, greenColor: "#8a7a2a", redColor: "#8a7030" }
    const issues = issuesOf(checkTheme(broken), "greenColor")

    expect(issues).toHaveLength(1)
    expect(issues[0].level).toBe("warning")
    expect(issues[0].message).toContain("сливаются")
  })

  it("отделяет ошибки от предупреждений", () => {
    // Нечитаемый текст — ошибка: интерфейсом нельзя пользоваться.
    // Спорные цвета — предупреждение: работать можно, но не всем удобно.
    const broken = { ...baseTheme, textColor: baseTheme.backgroundColor }
    expect(checkTheme(broken).some((i) => i.level === "error")).toBe(true)
  })
})

describe("дальтонизм", () => {
  it("серый остаётся серым при любом зрении", () => {
    expect(simulateColorBlindness("#808080", "deuteranopia")).toBe("#808080")
  })

  it("красный и коричневый сливаются в красно-зелёной слепоте", () => {
    // Классическая пара: различаются только оттенком вдоль той самой оси.
    const confused = confusingFor("#d03030", "#8a5a20")
    expect(confused).toContain("protanopia")
    expect(confused).toContain("deuteranopia")
  })

  it("синий и фиолетовый сливаются при тританопии", () => {
    expect(confusingFor("#3050d0", "#7040c0")).toContain("tritanopia")
  })

  it("цвета, разные по яркости, остаются различимыми", () => {
    // Красный и зелёный путают по оттенку, но не когда один заметно светлее:
    // яркость дальтонизм не отнимает, и предупреждать тут не о чем.
    expect(confusingFor("#31DE53", "#DE5267")).toEqual([])
  })

  it("чёрный и белый различимы при любом зрении", () => {
    expect(confusingFor("#000000", "#ffffff")).toEqual([])
  })
})
