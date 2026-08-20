/**
 * Цветовая арифметика: перевод между записями цвета, смешивание, контраст.
 *
 * Всё считается вручную и без библиотек: этим кодом пользуется генератор тем,
 * а он должен давать один и тот же результат и в браузере, и в тестах, и в
 * будущей сборке — без оглядки на версию сторонней зависимости.
 */

export interface Rgb {
  r: number // 0..255
  g: number
  b: number
}

export interface Hsl {
  h: number // 0..360
  s: number // 0..100
  l: number // 0..100
}

/** Загоняет число в границы. */
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

/** Приводит угол к кругу 0..360 — оттенок за краем круга это тот же оттенок. */
export const wrapHue = (hue: number): number => ((hue % 360) + 360) % 360

const hex2 = (value: number): string =>
  clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0")

/** `{r,g,b}` → `#rrggbb`. */
export const rgbToHex = ({ r, g, b }: Rgb): string =>
  `#${hex2(r)}${hex2(g)}${hex2(b)}`

/**
 * `#rgb` или `#rrggbb` → `{r,g,b}`.
 *
 * Непонятную запись не угадываем: цвет приходит из поля ввода, и молча
 * подставленный чёрный выглядел бы как поломка редактора.
 */
export const hexToRgb = (hex: string): Rgb | undefined => {
  const value = hex.trim().replace(/^#/, "")

  if (/^[0-9a-f]{3}$/i.test(value)) {
    const [r, g, b] = value.split("").map((c) => parseInt(c + c, 16))
    return { r, g, b }
  }

  if (/^[0-9a-f]{6}$/i.test(value)) {
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16),
    }
  }

  return undefined
}

/**
 * Любой цвет, который может встретиться в файле темы: `#rgb`, `#rrggbb`,
 * `rgb()`, `rgba()`, `hsl()`, `hsla()`.
 *
 * Тема — обычный JSON, который правят руками, и записывают цвет в ней как
 * привычнее: базовая тема LARD, например, вся написана через `hsl()`.
 * Прозрачность разбирается, но отбрасывается: контраст считается по тому,
 * что видно, а под цветом всегда своя подложка.
 */
export const parseColor = (color: string): Rgb | undefined => {
  const value = color.trim()

  const hex = hexToRgb(value)
  if (hex !== undefined) {
    return hex
  }

  const numbers = value
    .slice(value.indexOf("(") + 1, value.lastIndexOf(")"))
    .split(/[\s,/]+/)
    .filter((part) => part.length > 0)
    .map((part) => Number.parseFloat(part))

  if (/^rgba?\(/i.test(value) && numbers.length >= 3) {
    const [r, g, b] = numbers
    return { r, g, b }
  }

  if (/^hsla?\(/i.test(value) && numbers.length >= 3) {
    const [h, s, l] = numbers
    return hslToRgb({ h, s, l })
  }

  return undefined
}

export const rgbToHsl = ({ r, g, b }: Rgb): Hsl => {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min
  const l = (max + min) / 2

  if (delta === 0) {
    return { h: 0, s: 0, l: l * 100 }
  }

  const s = delta / (1 - Math.abs(2 * l - 1))
  let h: number

  switch (max) {
    case rn:
      h = ((gn - bn) / delta) % 6
      break
    case gn:
      h = (bn - rn) / delta + 2
      break
    default:
      h = (rn - gn) / delta + 4
      break
  }

  return { h: wrapHue(h * 60), s: clamp(s * 100, 0, 100), l: l * 100 }
}

export const hslToRgb = ({ h, s, l }: Hsl): Rgb => {
  const hue = wrapHue(h)
  const sn = clamp(s, 0, 100) / 100
  const ln = clamp(l, 0, 100) / 100
  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = ln - c / 2
  const sector = Math.floor(hue / 60) % 6

  const [r, g, b] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ][sector]

  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 }
}

/** Любая запись цвета → HSL. Непонятная даёт чёрный: считать иначе нечем. */
export const hexToHsl = (color: string): Hsl =>
  rgbToHsl(parseColor(color) ?? { r: 0, g: 0, b: 0 })

export const hslToHex = (hsl: Hsl): string => rgbToHex(hslToRgb(hsl))

/**
 * Смешивает два цвета: `amount` — доля второго, 0..1.
 *
 * Смешиваем, а не кладём один на другой с прозрачностью: результат нужен
 * сплошным цветом. Полупрозрачные значения в теме дошли бы до WebGL-отрисовки
 * пианоролла, где их пришлось бы разбирать отдельно.
 */
export const mixHex = (base: string, other: string, amount: number): string => {
  const a = parseColor(base) ?? { r: 0, g: 0, b: 0 }
  const b = parseColor(other) ?? { r: 0, g: 0, b: 0 }
  const t = clamp(amount, 0, 1)

  return rgbToHex({
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  })
}

/** Сдвигает яркость на `delta` процентных пунктов. */
export const lighten = (hex: string, delta: number): string => {
  const hsl = hexToHsl(hex)
  return hslToHex({ ...hsl, l: clamp(hsl.l + delta, 0, 100) })
}

/** Относительная яркость по WCAG 2.1 — основа для расчёта контраста. */
export const relativeLuminance = (color: string): number => {
  const { r, g, b } = parseColor(color) ?? { r: 0, g: 0, b: 0 }
  const channel = (value: number) => {
    const v = value / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/**
 * Насколько два цвета различаются на глаз — ΔE по CIE76.
 *
 * Обычная разница по RGB для этого не годится: одинаковый шаг в числах
 * человек видит по-разному в тёмном и светлом, в синем и зелёном. ΔE считает
 * в пространстве, построенном под человеческое зрение: около 2 — предел
 * заметности, меньше 12 — «почти одно и то же», больше 25 — заведомо разные.
 */
export const deltaE = (a: string, b: string): number => {
  const la = rgbToLab(parseColor(a) ?? { r: 0, g: 0, b: 0 })
  const lb = rgbToLab(parseColor(b) ?? { r: 0, g: 0, b: 0 })
  return Math.sqrt((la.l - lb.l) ** 2 + (la.a - lb.a) ** 2 + (la.b - lb.b) ** 2)
}

interface Lab {
  l: number
  a: number
  b: number
}

/** sRGB → CIE Lab через XYZ. Точка белого D65 — та же, что у мониторов. */
const rgbToLab = ({ r, g, b }: Rgb): Lab => {
  const linear = (value: number) => {
    const v = clamp(value, 0, 255) / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  const rl = linear(r)
  const gl = linear(g)
  const bl = linear(b)

  const x = (0.4124 * rl + 0.3576 * gl + 0.1805 * bl) / 0.95047
  const y = 0.2126 * rl + 0.7152 * gl + 0.0722 * bl
  const z = (0.0193 * rl + 0.1192 * gl + 0.9505 * bl) / 1.08883

  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)

  return {
    l: 116 * f(y) - 16,
    a: 500 * (f(x) - f(y)),
    b: 200 * (f(y) - f(z)),
  }
}

/** Коэффициент контраста по WCAG: от 1 (одинаковые) до 21 (чёрный на белом). */
export const contrastRatio = (a: string, b: string): number => {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const light = Math.max(la, lb)
  const dark = Math.min(la, lb)
  return (light + 0.05) / (dark + 0.05)
}

/** Порог WCAG для обычного текста. */
export const WCAG_AA_TEXT = 4.5
/** Порог WCAG для крупного текста и элементов интерфейса. */
export const WCAG_AA_LARGE = 3

/** Уровень доступности пары «текст — фон». */
export type ContrastLevel = "AAA" | "AA" | "AA-large" | "fail"

export const contrastLevel = (
  foreground: string,
  background: string,
): ContrastLevel => {
  const ratio = contrastRatio(foreground, background)
  if (ratio >= 7) return "AAA"
  if (ratio >= WCAG_AA_TEXT) return "AA"
  if (ratio >= WCAG_AA_LARGE) return "AA-large"
  return "fail"
}

/**
 * Подбирает цвет надписи поверх фона: белую или почти чёрную — ту, что читается
 * лучше. Чистый чёрный не берём: на цветном фоне он выглядит провалом.
 */
export const readableTextOn = (background: string): string =>
  contrastRatio("#ffffff", background) >= contrastRatio("#111111", background)
    ? "#ffffff"
    : "#111111"

/**
 * Двигает яркость цвета, пока он не станет читаемым на фоне.
 *
 * Оттенок и насыщенность не трогаем: пользователь выбрал цвет, и менять его
 * узнаваемость ради контраста — грубее, чем сделать его светлее или темнее.
 * Если даже на пределе яркости контраста не хватает, возвращаем что вышло:
 * решать, что делать дальше, будет вызывающий — он покажет предупреждение.
 */
export const ensureContrast = (
  color: string,
  background: string,
  minRatio: number = WCAG_AA_TEXT,
): string => {
  if (contrastRatio(color, background) >= minRatio) {
    return color
  }

  const hsl = hexToHsl(color)
  // Куда двигать: от светлого фона — вниз, от тёмного — вверх.
  const direction = relativeLuminance(background) > 0.5 ? -1 : 1
  let best = color
  let bestRatio = contrastRatio(color, background)

  for (let step = 1; step <= 100; step++) {
    const candidate = hslToHex({
      ...hsl,
      l: clamp(hsl.l + direction * step, 0, 100),
    })
    const ratio = contrastRatio(candidate, background)

    if (ratio > bestRatio) {
      best = candidate
      bestRatio = ratio
    }
    if (ratio >= minRatio) {
      return candidate
    }
  }

  return best
}
