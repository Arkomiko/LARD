/**
 * Правила сочетания цветов.
 *
 * Из одного выбранного цвета получаем пять — этого хватает, чтобы раздать роли
 * интерфейса и не заставлять человека подбирать каждый цвет вручную.
 * Смещения по цветовому кругу взяты из классической теории цвета.
 */
import { clamp, type Hsl, hexToHsl, hslToHex, wrapHue } from "../../color/color"

export const harmonyRules = [
  "monochromatic",
  "analogous",
  "complementary",
  "split-complementary",
  "triad",
  "square",
  "compound",
  "shades",
] as const

export type HarmonyRule = (typeof harmonyRules)[number]

/** Подписи правил для списка в редакторе. */
export const harmonyLabels: Record<HarmonyRule, string> = {
  monochromatic: "Monochromatic — один оттенок",
  analogous: "Analogous — соседние оттенки",
  complementary: "Complementary — противоположный",
  "split-complementary": "Split complementary — два вокруг противоположного",
  triad: "Triad — треугольник",
  square: "Square — квадрат",
  compound: "Compound — тетрада",
  shades: "Shades — одна насыщенность за другой",
}

/** Сколько цветов в палитре. Роли расписаны ровно под это число. */
export const PALETTE_SIZE = 5

/** Смещения оттенка по кругу. Базовый цвет (0°) добавляется первым всегда. */
const hueOffsets: Record<HarmonyRule, number[]> = {
  monochromatic: [],
  analogous: [30, -30, 60, -60],
  complementary: [180],
  "split-complementary": [150, 210],
  triad: [120, 240],
  square: [90, 180, 270],
  compound: [30, 180, 210],
  shades: [],
}

/**
 * Сдвиги яркости для правил, где оттенок один.
 * Порядок такой, чтобы первым шёл сам выбранный цвет.
 */
const monochromaticLightness = [0, 5, -5, 15, -15, 25, -25]

/** Насыщенность для «Shades»: от 20% до 80% с шагом 15%. */
const shadesSaturation = [20, 35, 50, 65, 80]

/**
 * Добивает палитру до пяти цветов, если правило дало меньше.
 *
 * Правил на пять оттенков хватает не у всех — у «Complementary» их всего два.
 * Недостающее берём как более светлые и более тёмные варианты уже полученных:
 * так палитра остаётся внутри выбранного сочетания и не тянет чужие оттенки.
 */
const extendToSize = (colors: Hsl[], size: number): Hsl[] => {
  const result = [...colors]
  const deltas = [12, -12, 24, -24, 36, -36]

  for (let i = 0; result.length < size; i++) {
    const source = colors[i % colors.length]
    const delta = deltas[Math.floor(i / colors.length) % deltas.length]
    result.push({ ...source, l: clamp(source.l + delta, 8, 92) })
  }

  return result.slice(0, size)
}

/** Строит палитру из пяти цветов в HSL. */
export const buildHarmony = (baseColor: string, rule: HarmonyRule): Hsl[] => {
  const base = hexToHsl(baseColor)

  if (rule === "monochromatic") {
    return monochromaticLightness
      .slice(0, PALETTE_SIZE)
      .map((delta) => ({ ...base, l: clamp(base.l + delta, 8, 92) }))
  }

  if (rule === "shades") {
    return shadesSaturation.map((s) => ({ ...base, s }))
  }

  const byHue = [
    base,
    ...hueOffsets[rule].map((offset) => ({
      ...base,
      h: wrapHue(base.h + offset),
    })),
  ]

  return extendToSize(byHue, PALETTE_SIZE)
}

/**
 * Насколько цвет «звонкий»: насыщенный и не заваленный в белое или чёрное.
 *
 * По этой мере палитра сортируется, а не по порядку получения: правило может
 * выдать самый выразительный цвет вторым, а роль главного должна доставаться
 * действительно самому заметному.
 */
export const vividness = ({ s, l }: Hsl): number =>
  (s / 100) * (1 - Math.abs(l - 50) / 50)

/**
 * Палитра из пяти цветов, отсортированная от самого выразительного к самому
 * блёклому: Color_1 … Color_5 из описания задачи.
 */
export const buildPalette = (baseColor: string, rule: HarmonyRule): string[] =>
  buildHarmony(baseColor, rule)
    .slice()
    .sort((a, b) => vividness(b) - vividness(a))
    .map(hslToHex)
