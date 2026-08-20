import { describe, expect, it } from "vitest"
import {
  contrastLevel,
  contrastRatio,
  ensureContrast,
  hexToHsl,
  hexToRgb,
  hslToHex,
  mixHex,
  readableTextOn,
  relativeLuminance,
} from "./color"

describe("разбор цвета", () => {
  it("понимает короткую и длинную запись", () => {
    expect(hexToRgb("#fff")).toEqual({ r: 255, g: 255, b: 255 })
    expect(hexToRgb("4d6bff")).toEqual({ r: 77, g: 107, b: 255 })
  })

  it("не угадывает непонятную запись", () => {
    // Цвет приходит из поля ввода: молча подставленный чёрный выглядел бы
    // как поломка редактора, а не как опечатка пользователя.
    expect(hexToRgb("не цвет")).toBeUndefined()
    expect(hexToRgb("#12345")).toBeUndefined()
  })

  it("переводит в HSL и обратно без потерь", () => {
    for (const hex of ["#4d6bff", "#31de53", "#111111", "#ffffff", "#808080"]) {
      expect(hslToHex(hexToHsl(hex))).toBe(hex)
    }
  })

  it("у серого нет оттенка и насыщенности", () => {
    expect(hexToHsl("#808080").s).toBe(0)
  })
})

describe("смешивание", () => {
  it("нулевая доля оставляет первый цвет, полная даёт второй", () => {
    expect(mixHex("#000000", "#ffffff", 0)).toBe("#000000")
    expect(mixHex("#000000", "#ffffff", 1)).toBe("#ffffff")
  })

  it("половина даёт середину", () => {
    expect(mixHex("#000000", "#ffffff", 0.5)).toBe("#808080")
  })
})

describe("контраст по WCAG", () => {
  it("чёрный на белом — предельные 21:1", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1)
  })

  it("одинаковые цвета — 1:1", () => {
    expect(contrastRatio("#4d6bff", "#4d6bff")).toBeCloseTo(1, 5)
  })

  it("не зависит от порядка", () => {
    expect(contrastRatio("#333333", "#eeeeee")).toBeCloseTo(
      contrastRatio("#eeeeee", "#333333"),
      5,
    )
  })

  it("расставляет уровни доступности", () => {
    expect(contrastLevel("#000000", "#ffffff")).toBe("AAA")
    expect(contrastLevel("#767676", "#ffffff")).toBe("AA")
    expect(contrastLevel("#949494", "#ffffff")).toBe("AA-large")
    expect(contrastLevel("#eeeeee", "#ffffff")).toBe("fail")
  })

  it("белый ярче чёрного", () => {
    expect(relativeLuminance("#ffffff")).toBeGreaterThan(
      relativeLuminance("#000000"),
    )
  })
})

describe("подбор читаемого цвета", () => {
  it("на тёмном фоне пишет светлым, на светлом — тёмным", () => {
    expect(readableTextOn("#111111")).toBe("#ffffff")
    expect(readableTextOn("#ffffff")).toBe("#111111")
  })

  it("не трогает цвет, который и так читается", () => {
    expect(ensureContrast("#000000", "#ffffff")).toBe("#000000")
  })

  it("двигает яркость, пока текст не станет читаемым", () => {
    const fixed = ensureContrast("#cccccc", "#ffffff")
    expect(contrastRatio(fixed, "#ffffff")).toBeGreaterThanOrEqual(4.5)
  })

  it("сохраняет оттенок: меняется только яркость", () => {
    // Цвет выбрал человек — менять его узнаваемость грубее, чем осветлить.
    const source = "#4d6bff"
    const fixed = ensureContrast(source, "#ffffff")
    expect(Math.round(hexToHsl(fixed).h)).toBe(Math.round(hexToHsl(source).h))
  })

  it("на сером фоне уходит в ту сторону, где контраста больше", () => {
    const onDark = ensureContrast("#555555", "#222222")
    expect(hexToHsl(onDark).l).toBeGreaterThan(hexToHsl("#555555").l)
  })
})
