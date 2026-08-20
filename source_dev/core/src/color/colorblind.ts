/**
 * Как цвета выглядят при дальтонизме.
 *
 * Матрицы — общепринятое приближение (Виено и др.): точную картину они не
 * дают, но для проверки «различит ли человек эти два цвета» их достаточно.
 * Редактор по ним предупреждает, а не запрещает: решение остаётся за автором
 * темы.
 */
import { clamp, deltaE, parseColor, type Rgb, rgbToHex } from "./color"

export const colorBlindnessTypes = [
  "protanopia",
  "deuteranopia",
  "tritanopia",
] as const

export type ColorBlindnessType = (typeof colorBlindnessTypes)[number]

/** Подписи для сообщений редактора. */
export const colorBlindnessLabels: Record<ColorBlindnessType, string> = {
  protanopia: "протанопии (не различается красный)",
  deuteranopia: "дейтеранопии (не различается зелёный)",
  tritanopia: "тританопии (не различается синий)",
}

const matrices: Record<ColorBlindnessType, number[][]> = {
  protanopia: [
    [0.567, 0.433, 0],
    [0.558, 0.442, 0],
    [0, 0.242, 0.758],
  ],
  deuteranopia: [
    [0.625, 0.375, 0],
    [0.7, 0.3, 0],
    [0, 0.3, 0.7],
  ],
  tritanopia: [
    [0.95, 0.05, 0],
    [0, 0.433, 0.567],
    [0, 0.475, 0.525],
  ],
}

/**
 * Матрицы работают с линейным светом, а цвет в теме записан в sRGB — с гаммой.
 * Без перевода туда и обратно красный с зелёным остаются «различимыми» там,
 * где человек их не различает.
 */
const toLinear = ({ r, g, b }: Rgb): Rgb => {
  const channel = (value: number) => {
    const v = value / 255
    return (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4) * 255
  }
  return { r: channel(r), g: channel(g), b: channel(b) }
}

const fromLinear = ({ r, g, b }: Rgb): Rgb => {
  const channel = (value: number) => {
    const v = clamp(value / 255, 0, 1)
    return (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055) * 255
  }
  return { r: channel(r), g: channel(g), b: channel(b) }
}

/** Яркость линейного цвета — та же формула, что у контраста по WCAG. */
const luminanceOf = ({ r, g, b }: Rgb): number =>
  0.2126 * r + 0.7152 * g + 0.0722 * b

/**
 * Пересчитывает цвет так, как его увидит человек с таким зрением.
 *
 * После матрицы яркость возвращается к исходной. Без этого простые матрицы
 * заодно меняют светлоту, и два цвета, которые человек различает только по
 * оттенку, оставались бы «различимыми» — по яркости, которой в оригинале не
 * было. Именно такие пары и надо ловить.
 */
export const simulateColorBlindness = (
  color: string,
  type: ColorBlindnessType,
): string => {
  const source = toLinear(parseColor(color) ?? { r: 0, g: 0, b: 0 })
  const [row1, row2, row3] = matrices[type]

  const seen = {
    r: row1[0] * source.r + row1[1] * source.g + row1[2] * source.b,
    g: row2[0] * source.r + row2[1] * source.g + row2[2] * source.b,
    b: row3[0] * source.r + row3[1] * source.g + row3[2] * source.b,
  }

  const seenLuminance = luminanceOf(seen)
  const scale = seenLuminance === 0 ? 1 : luminanceOf(source) / seenLuminance

  return rgbToHex(
    fromLinear({ r: seen.r * scale, g: seen.g * scale, b: seen.b * scale }),
  )
}

/**
 * Ниже этой разницы цвета для человека сливаются.
 *
 * Считаем через ΔE, а не через разницу чисел RGB: одинаковый шаг в числах
 * человек видит по-разному в тёмном и светлом. Около 2 — предел заметности,
 * 15 — «путаются на глаз». Порог намеренно не выше: иначе редактор ругался бы
 * на любую похожесть, и предупреждения перестали бы читать.
 */
const MIN_DELTA_E = 15

/**
 * Виды дальтонизма, при которых два цвета сливаются.
 * Пустой список — цвета различимы при всех проверяемых видах.
 */
export const confusingFor = (a: string, b: string): ColorBlindnessType[] =>
  colorBlindnessTypes.filter(
    (type) =>
      deltaE(simulateColorBlindness(a, type), simulateColorBlindness(b, type)) <
      MIN_DELTA_E,
  )
