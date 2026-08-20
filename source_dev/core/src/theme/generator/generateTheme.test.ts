import { describe, expect, it } from "vitest"
import { contrastRatio, hexToHsl } from "../../color/color"
import { baseTheme } from "../Theme"
import { checkTheme } from "./checkTheme"
import {
  assignSlots,
  defaultSettings,
  generateTheme,
  suggestAppearance,
  themeFromGenerator,
} from "./generateTheme"

const light = { ...defaultSettings, appearance: "light" as const }
const dark = { ...defaultSettings, appearance: "dark" as const }

describe("сборка темы из пары параметров", () => {
  it("заполняет все поля темы", () => {
    const { theme } = generateTheme()
    expect(Object.keys(theme).sort()).toEqual(Object.keys(baseTheme).sort())
  })

  it("на светлой основе строит светлую тему", () => {
    const { theme } = generateTheme(light)
    expect(theme.isLightContent).toBe(false)
    expect(hexToHsl(theme.backgroundColor).l).toBeGreaterThan(50)
  })

  it("на тёмной основе строит тёмную тему", () => {
    const { theme } = generateTheme(dark)
    expect(theme.isLightContent).toBe(true)
    expect(hexToHsl(theme.backgroundColor).l).toBeLessThan(50)
  })

  it("не переворачивает основу вслед за цветом", () => {
    // Ради этого основу и вынесли в отдельный параметр: подбор цвета не
    // должен перекидывать тему из светлой в тёмную и обратно.
    for (const baseColor of ["#0b1020", "#4d6bff", "#f2f6ff"]) {
      expect(generateTheme({ ...dark, baseColor }).theme.isLightContent).toBe(
        true,
      )
      expect(generateTheme({ ...light, baseColor }).theme.isLightContent).toBe(
        false,
      )
    }
  })

  it("держит текст читаемым в обеих основах", () => {
    for (const settings of [light, dark]) {
      const { theme } = generateTheme(settings)
      expect(
        contrastRatio(theme.textColor, theme.backgroundColor),
      ).toBeGreaterThanOrEqual(4.5)
      expect(
        contrastRatio(theme.secondaryTextColor, theme.backgroundColor),
      ).toBeGreaterThanOrEqual(4.5)
    }
  })

  it("держит читаемой надпись на кнопке основного цвета", () => {
    for (const settings of [light, dark]) {
      const { theme } = generateTheme(settings)
      expect(
        contrastRatio(theme.onSurfaceColor, theme.themeColor),
      ).toBeGreaterThanOrEqual(4.5)
    }
  })

  it("отделяет основной цвет от фона", () => {
    for (const settings of [light, dark]) {
      const { theme } = generateTheme(settings)
      expect(
        contrastRatio(theme.themeColor, theme.backgroundColor),
      ).toBeGreaterThanOrEqual(3)
    }
  })

  it("не даёт готовой теме поводов для замечаний", () => {
    for (const rule of ["analogous", "triad", "shades"] as const) {
      const { theme } = generateTheme({ ...defaultSettings, harmony: rule })
      expect(checkTheme(theme).filter((i) => i.level === "error")).toEqual([])
    }
  })

  it("делает текст ахроматическим", () => {
    // Цветные надписи первыми теряют читаемость, поэтому оттенка у них нет.
    const { theme } = generateTheme({ ...defaultSettings, moreAccents: true })
    expect(hexToHsl(theme.textColor).s).toBeLessThan(2)
    expect(hexToHsl(theme.secondaryTextColor).s).toBeLessThan(2)
  })

  it("оставляет тень чёрной и полупрозрачной", () => {
    const { theme } = generateTheme({
      ...defaultSettings,
      baseColor: "#ff00aa",
    })
    expect(theme.shadowColor).toMatch(/^rgba\(0, 0, 0, 0\.\d+\)$/)
  })

  it("окрашивает фон только по просьбе", () => {
    const plain = generateTheme({
      ...defaultSettings,
      coloredBackground: false,
    })
    const tinted = generateTheme({
      ...defaultSettings,
      coloredBackground: true,
    })

    expect(hexToHsl(plain.theme.backgroundColor).s).toBeLessThan(2)
    expect(hexToHsl(tinted.theme.backgroundColor).s).toBeGreaterThan(2)
  })

  it("карточка отличается от фона окна и без окрашивания", () => {
    const { theme } = generateTheme({
      ...defaultSettings,
      coloredBackground: false,
    })
    expect(theme.secondaryBackgroundColor).not.toBe(theme.backgroundColor)
  })

  it("без «больше акцентов» цветным остаётся только главное", () => {
    const plain = generateTheme({ ...defaultSettings, moreAccents: false })
    const rich = generateTheme({ ...defaultSettings, moreAccents: true })

    expect(hexToHsl(plain.theme.dividerColor).s).toBeLessThan(2)
    expect(hexToHsl(rich.theme.dividerColor).s).toBeGreaterThan(2)
  })

  it("не перекрашивает служебные цвета", () => {
    // Зелёный — успех, красный — запись: смысл важнее палитры.
    const { theme } = generateTheme({
      ...defaultSettings,
      baseColor: "#8800ff",
      moreAccents: true,
    })
    expect(hexToHsl(theme.greenColor).h).toBeGreaterThan(80)
    expect(hexToHsl(theme.greenColor).h).toBeLessThan(180)
  })

  it("одна и та же пара параметров даёт одну и ту же тему", () => {
    expect(generateTheme(light).theme).toEqual(generateTheme(light).theme)
  })
})

describe("поправки поверх правил", () => {
  const withAdjust = (
    adjustments: Partial<typeof defaultSettings.adjustments>,
  ) =>
    generateTheme({
      ...defaultSettings,
      adjustments: { ...defaultSettings.adjustments, ...adjustments },
    }).theme

  it("нули оставляют тему такой же, как без поправок", () => {
    expect(withAdjust({})).toEqual(generateTheme(defaultSettings).theme)
  })

  it("насыщенность обесцвечивает палитру", () => {
    const grey = generateTheme({
      ...defaultSettings,
      adjustments: { ...defaultSettings.adjustments, saturation: -100 },
    })

    for (const color of grey.palette) {
      expect(hexToHsl(color).s).toBeLessThan(2)
    }
  })

  it("светлота двигает фон окна", () => {
    const lighter = hexToHsl(withAdjust({ brightness: 100 }).backgroundColor).l
    const plain = hexToHsl(withAdjust({}).backgroundColor).l

    expect(lighter).toBeGreaterThan(plain)
  })

  it("нулевой разбег сводит панели с фоном", () => {
    const flat = withAdjust({ contrast: -100 })
    expect(flat.darkBackgroundColor).toBe(flat.backgroundColor)
    expect(flat.secondaryBackgroundColor).toBe(flat.backgroundColor)
  })

  it("разбег в плюс уводит панели глубже", () => {
    const deep = hexToHsl(withAdjust({ contrast: 100 }).darkBackgroundColor).l
    const plain = hexToHsl(withAdjust({}).darkBackgroundColor).l

    expect(deep).toBeLessThan(plain)
  })

  it("плотность текста меняет подписи", () => {
    const dense = withAdjust({ text: 100 })
    const faint = withAdjust({ text: -100 })

    expect(dense.tertiaryTextColor).not.toBe(faint.tertiaryTextColor)
  })

  it("ни одна ручка не роняет контраст ниже нормы", () => {
    // Ручка меняет вид, а не читаемость: пороги WCAG остаются за генератором.
    for (const amount of [-100, -50, 50, 100]) {
      for (const key of [
        "saturation",
        "brightness",
        "contrast",
        "text",
      ] as const) {
        const theme = withAdjust({ [key]: amount })

        expect(
          contrastRatio(theme.textColor, theme.backgroundColor),
        ).toBeGreaterThanOrEqual(4.5)
        expect(
          contrastRatio(theme.onSurfaceColor, theme.themeColor),
        ).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  it("тема без поля поправок читается как тема с нулями", () => {
    // Основу задаём явно: без неё сработала бы подсказка по цвету, и
    // сравнивать пришлось бы с другой основой, а не с другими поправками.
    const theme = themeFromGenerator({ mode: "fast", appearance: "dark" })
    expect(theme).toEqual(generateTheme(defaultSettings).theme)
  })
})

describe("подсказка основы по цвету", () => {
  it("светлому цвету советует светлую основу, тёмному — тёмную", () => {
    expect(suggestAppearance("#f2f6ff")).toBe("light")
    expect(suggestAppearance("#0b1020")).toBe("dark")
  })

  it("тема без выбранной основы открывается по подсказке", () => {
    // Так открываются темы, сохранённые до появления переключателя: иначе
    // они вывернулись бы наизнанку.
    const withoutAppearance = themeFromGenerator({
      mode: "fast",
      baseColor: "#f2f6ff",
    })
    expect(withoutAppearance.isLightContent).toBe(false)
  })

  it("выбранная основа сильнее подсказки", () => {
    const theme = themeFromGenerator({
      mode: "fast",
      baseColor: "#f2f6ff",
      appearance: "dark",
    })
    expect(theme.isLightContent).toBe(true)
  })
})

describe("роли цветов палитры", () => {
  it("раздаёт первые три цвета по слотам, остальные — в украшения", () => {
    const slots = assignSlots(["#1", "#2", "#3", "#4", "#5"])
    expect(slots.primary).toBe("#1")
    expect(slots.secondary).toBe("#2")
    expect(slots.accentBackground).toBe("#3")
    expect(slots.decorative).toEqual(["#4", "#5"])
  })

  it("не остаётся без цвета, если палитра короче", () => {
    const slots = assignSlots(["#1"])
    expect(slots.secondary).toBe("#1")
    expect(slots.decorative).toEqual(["#1", "#1"])
  })
})

describe("тема из настроек редактора", () => {
  it("в упрощённом режиме считает всё по правилам", () => {
    const theme = themeFromGenerator({ mode: "fast", baseColor: "#1f2d6b" })
    expect(theme).toEqual(
      generateTheme({ ...defaultSettings, baseColor: "#1f2d6b" }).theme,
    )
  })

  it("в расширенном режиме кладёт правки поверх посчитанного", () => {
    const theme = themeFromGenerator({
      mode: "advanced",
      baseColor: "#1f2d6b",
      overrides: { themeColor: "#ff0000", cornerRadius: "1rem" },
    })
    expect(theme.themeColor).toBe("#ff0000")
    expect(theme.cornerRadius).toBe("1rem")
    // Остальное всё ещё посчитано по правилам.
    expect(theme.backgroundColor).toBe(
      generateTheme({ ...defaultSettings, baseColor: "#1f2d6b" }).theme
        .backgroundColor,
    )
  })

  it("в разработчиковом режиме правила не действуют", () => {
    const theme = themeFromGenerator({
      mode: "dev",
      baseColor: "#1f2d6b",
      overrides: { themeColor: "#00ff00" },
    })
    expect(theme.themeColor).toBe("#00ff00")
    expect(theme.backgroundColor).toBe(baseTheme.backgroundColor)
  })
})
