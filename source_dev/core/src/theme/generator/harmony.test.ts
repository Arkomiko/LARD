import { describe, expect, it } from "vitest"
import { hexToHsl } from "../../color/color"
import {
  buildHarmony,
  buildPalette,
  harmonyRules,
  PALETTE_SIZE,
  vividness,
} from "./harmony"

const BASE = "#4d6bff"
const baseHue = Math.round(hexToHsl(BASE).h)

const hues = (colors: { h: number }[]) => colors.map((c) => Math.round(c.h))

describe("правила сочетания цветов", () => {
  it("каждое правило даёт ровно пять цветов", () => {
    for (const rule of harmonyRules) {
      expect(buildHarmony(BASE, rule)).toHaveLength(PALETTE_SIZE)
    }
  })

  it("первым идёт сам выбранный цвет", () => {
    for (const rule of harmonyRules) {
      const first = buildHarmony(BASE, rule)[0]
      if (rule === "shades") {
        // У «Shades» меняется насыщенность, поэтому совпадает оттенок.
        expect(Math.round(first.h)).toBe(baseHue)
      } else {
        expect(Math.round(first.h)).toBe(baseHue)
      }
    }
  })

  it("монохром держит один оттенок и меняет яркость", () => {
    const colors = buildHarmony(BASE, "monochromatic")
    expect(new Set(hues(colors)).size).toBe(1)
    expect(new Set(colors.map((c) => Math.round(c.l))).size).toBe(PALETTE_SIZE)
  })

  it("соседние оттенки отходят на 30 и 60 градусов", () => {
    const colors = hues(buildHarmony(BASE, "analogous"))
    expect(colors).toContain((baseHue + 30) % 360)
    expect(colors).toContain((baseHue + 330) % 360)
    expect(colors).toContain((baseHue + 60) % 360)
  })

  it("противоположный — это плюс 180 градусов", () => {
    expect(hues(buildHarmony(BASE, "complementary"))).toContain(
      (baseHue + 180) % 360,
    )
  })

  it("триада — плюс 120 и 240", () => {
    const colors = hues(buildHarmony(BASE, "triad"))
    expect(colors).toContain((baseHue + 120) % 360)
    expect(colors).toContain((baseHue + 240) % 360)
  })

  it("квадрат — плюс 90, 180 и 270", () => {
    const colors = hues(buildHarmony(BASE, "square"))
    for (const offset of [90, 180, 270]) {
      expect(colors).toContain((baseHue + offset) % 360)
    }
  })

  it("«Shades» перебирает насыщенность от 20 до 80 с шагом 15", () => {
    const colors = buildHarmony(BASE, "shades")
    expect(colors.map((c) => Math.round(c.s))).toEqual([20, 35, 50, 65, 80])
  })

  it("правилу с двумя оттенками недостающие цвета берутся из своих же", () => {
    // «Complementary» даёт два оттенка — остальные три это их варианты
    // по яркости, а не чужие оттенки со стороны.
    const colors = buildHarmony(BASE, "complementary")
    const allowed = new Set([baseHue, (baseHue + 180) % 360])
    for (const hue of hues(colors)) {
      expect(allowed.has(hue)).toBe(true)
    }
  })
})

describe("порядок палитры", () => {
  it("сортирует от самого выразительного к самому блёклому", () => {
    const palette = buildPalette(BASE, "shades")
    const scores = palette.map((hex) => vividness(hexToHsl(hex)))
    expect(scores).toEqual([...scores].sort((a, b) => b - a))
  })

  it("выцветший цвет уступает первое место насыщенному", () => {
    // Порядок ролей задан выразительностью, а не тем, в каком порядке
    // правило выдало цвета: главным должен стать самый заметный.
    const palette = buildPalette("#808080", "shades")
    expect(vividness(hexToHsl(palette[0]))).toBeGreaterThanOrEqual(
      vividness(hexToHsl(palette[4])),
    )
  })

  it("одна и та же пара параметров всегда даёт одну и ту же палитру", () => {
    expect(buildPalette(BASE, "triad")).toEqual(buildPalette(BASE, "triad"))
  })
})
