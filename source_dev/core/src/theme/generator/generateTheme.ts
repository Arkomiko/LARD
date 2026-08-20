/**
 * Сборка полной темы LARD из пары параметров.
 *
 * Это и есть «упрощённый режим» редактора: человек выбирает цвет и правило
 * сочетания, а роли по интерфейсу расписываются здесь — так, чтобы контраст
 * оставался читаемым, а тема не разъезжалась.
 *
 * Порядок ровно такой:
 *   1. из базового цвета и правила получаем палитру из пяти цветов;
 *   2. берём основу — тёмную или светлую — из настроек, а не из цвета;
 *   3. раздаём цвета по ролям и добираем недостающее смешиванием с основой;
 *   4. проверяем контраст и правим яркость там, где он не дотягивает.
 */
import {
  clamp,
  contrastRatio,
  ensureContrast,
  hexToHsl,
  hslToHex,
  mixHex,
  readableTextOn,
  WCAG_AA_LARGE,
  WCAG_AA_TEXT,
} from "../../color/color"
import {
  baseTheme,
  defaultAdjustments,
  defaultGeneratorSettings,
  type Theme,
  type ThemeAdjustments,
  type ThemeAppearance,
  type ThemeGenerator,
} from "../Theme"
import { buildPalette, type HarmonyRule } from "./harmony"

/** Параметры упрощённого режима. */
export interface GeneratorSettings {
  /** Базовый цвет — единственный, который выбирают пикером. */
  baseColor: string
  /** Правило сочетания цветов. */
  harmony: HarmonyRule
  /**
   * Тёмная основа или светлая. Отдельный выбор человека: цвет на неё не
   * влияет, поэтому подбор цвета больше не перекидывает тему из светлой в
   * тёмную и обратно.
   */
  appearance: ThemeAppearance
  /** Окрашенный фон: подмешать в фон третий цвет палитры. */
  coloredBackground: boolean
  /** Больше акцентных цветов: пустить в дело всю палитру, а не только главный. */
  moreAccents: boolean
  /** Поправки поверх правил: насыщенность, светлота, разбег, текст. */
  adjustments: ThemeAdjustments
}

export const defaultSettings: GeneratorSettings = {
  baseColor: defaultGeneratorSettings.baseColor,
  harmony: defaultGeneratorSettings.harmony,
  appearance: defaultGeneratorSettings.appearance,
  adjustments: defaultAdjustments,
  coloredBackground: defaultGeneratorSettings.coloredBackground,
  moreAccents: defaultGeneratorSettings.moreAccents,
}

/** Роли цветов палитры — то, чем они становятся в интерфейсе. */
export interface PaletteSlots {
  /** Slot A: главные кнопки, активные вкладки, переключатели. */
  primary: string
  /** Slot B: обводки полей, второстепенные кнопки, ссылки. */
  secondary: string
  /** Slot C: бейджи, подсветка выделенных строк. */
  accentBackground: string
  /** Только украшения: линии, значки, графики. Ни текста, ни фона карточек. */
  decorative: [string, string]
}

export interface GeneratedTheme {
  theme: Theme
  palette: string[]
  slots: PaletteSlots
}

/** Насколько плотным выглядит текст: заголовки, основной, подписи. */
const TEXT_STRENGTH = { title: 0.92, body: 0.65, caption: 0.35 }

/**
 * Тень всегда чёрная и слабая. Цветное свечение делает интерфейс нарядным и
 * нечитаемым одновременно, поэтому цвет тени из палитры не выводится вовсе.
 */
const SHADOW = "rgba(0, 0, 0, 0.16)"

/** Раздаёт палитру по ролям. */
export const assignSlots = (palette: string[]): PaletteSlots => ({
  primary: palette[0],
  secondary: palette[1] ?? palette[0],
  accentBackground: palette[2] ?? palette[1] ?? palette[0],
  decorative: [
    palette[3] ?? palette[0],
    palette[4] ?? palette[1] ?? palette[0],
  ],
})

/**
 * Какую основу подсказал бы сам цвет.
 *
 * Ровно то правило, по которому основа выбиралась раньше сама: светлый
 * главный цвет — светлая тема. Как поведение оно не годится (тема прыгала во
 * время подбора цвета), но как подсказка остаётся полезным, и по нему же
 * открываются темы, сохранённые до появления переключателя.
 */
export const suggestAppearance = (
  baseColor: string,
  harmony: HarmonyRule = defaultSettings.harmony,
): ThemeAppearance =>
  hexToHsl(buildPalette(baseColor, harmony)[0]).l > 50 ? "light" : "dark"

/**
 * Насыщенность цвета, подкрученная ручкой: −100 обесцвечивает, +100 удваивает.
 * Оттенок и светлота не трогаются — иначе это была бы уже другая палитра.
 */
const withSaturation = (color: string, amount: number): string => {
  if (amount === 0) {
    return color
  }

  const hsl = hexToHsl(color)
  return hslToHex({ ...hsl, s: clamp(hsl.s * (1 + amount / 100), 0, 100) })
}

/** Сдвиг светлоты: плюс — к белому, минус — к чёрному. */
const withBrightness = (color: string, amount: number): string => {
  if (amount === 0) {
    return color
  }

  const strength = (Math.abs(amount) / 100) * 0.18
  return mixHex(color, amount > 0 ? "#ffffff" : "#000000", strength)
}

/**
 * Множитель разбега поверхностей.
 *
 * Панель глубже окна, полотно ещё глубже, карточка светлее — все эти сдвиги
 * умножаются на одно число. При −100 оно обнуляется, и поверхности сливаются
 * в одну; при +100 удваивается.
 */
const depthFactor = (contrast: number): number => 1 + contrast / 100

/** Собирает тему из параметров упрощённого режима. */
export const generateTheme = (
  settings: GeneratorSettings = defaultSettings,
): GeneratedTheme => {
  const adjust = settings.adjustments ?? defaultAdjustments

  const palette = buildPalette(settings.baseColor, settings.harmony).map(
    (color) => withSaturation(color, adjust.saturation),
  )
  const slots = assignSlots(palette)
  const { primary, secondary, accentBackground, decorative } = slots
  const { coloredBackground, moreAccents } = settings

  const depth = depthFactor(adjust.contrast)

  // Светлая основа или тёмная — сказано в настройках.
  const lightBase = settings.appearance === "light"
  const baseBg = withBrightness(
    lightBase ? "#ffffff" : "#111111",
    adjust.brightness,
  )
  const baseText = lightBase ? "#111111" : "#ffffff"

  /** Подмешать в основу столько-то текста: так получаются оттенки серого. */
  const onBase = (strength: number) => mixHex(baseBg, baseText, strength)

  /**
   * Плотность текста с поправкой. Ниже порога WCAG опуститься всё равно не
   * даст `ensureContrast` — ручка меняет вид надписи, а не её читаемость.
   */
  const density = (strength: number) =>
    clamp(strength * (1 + adjust.text / 100), 0.08, 1)

  /**
   * Фон карточек. С окрашенным фоном — основа с примесью третьего цвета
   * (85/15), без него — та же основа, сдвинутая на пару процентов, чтобы
   * карточка всё-таки отличалась от окна. На белом сдвигать можно только
   * в тёмную сторону: светлее белого ничего нет.
   */
  const cardBg = coloredBackground
    ? mixHex(baseBg, accentBackground, 0.15)
    : mixHex(baseBg, baseText, 0.04 * depth)

  const windowBg = coloredBackground
    ? mixHex(baseBg, accentBackground, 0.07)
    : baseBg

  // Панели и заголовки — глубже окна, полотно редактора — ещё глубже.
  const panelBg = mixHex(windowBg, "#000000", 0.07 * depth)
  const editorBg = mixHex(
    windowBg,
    "#000000",
    (lightBase ? 0.04 : 0.25) * depth,
  )

  // Главный цвет должен отличаться от фона: на нём кнопки и активные вкладки.
  // И на нём же надпись, которую надо прочитать. Двигать надпись бессмысленно
  // — белее белого не бывает, — поэтому подгоняется сам цвет. Оба требования
  // тянут яркость в одну сторону: на светлом окне цвет темнеет, на тёмном
  // светлеет, поэтому второго прохода хватает.
  let themeColor = ensureContrast(primary, windowBg, WCAG_AA_LARGE)
  for (let pass = 0; pass < 2; pass++) {
    themeColor = ensureContrast(
      themeColor,
      readableTextOn(themeColor),
      WCAG_AA_TEXT,
    )
    themeColor = ensureContrast(themeColor, windowBg, WCAG_AA_LARGE)
  }
  const onSurfaceColor = readableTextOn(themeColor)

  // Второстепенный цвет идёт в обводки, только если разрешены акценты.
  const outline = moreAccents ? mixHex(windowBg, secondary, 0.45) : onBase(0.18)

  // Украшения: сетка редактора и ноты-призраки.
  const gridStrong = moreAccents
    ? mixHex(editorBg, decorative[0], 0.4)
    : mixHex(editorBg, baseText, 0.22)
  const gridWeak = moreAccents
    ? mixHex(editorBg, decorative[0], 0.18)
    : mixHex(editorBg, baseText, 0.1)

  const theme: Theme = {
    ...baseTheme,
    isLightContent: !lightBase,

    themeColor,
    onSurfaceColor,

    backgroundColor: windowBg,
    secondaryBackgroundColor: cardBg,
    darkBackgroundColor: panelBg,
    editorBackgroundColor: editorBg,

    editorGridColor: gridStrong,
    editorSecondaryGridColor: gridWeak,

    dividerColor: outline,
    popupBorderColor: mixHex(windowBg, baseText, 0.28),

    // Текст всегда ахроматический: цветные надписи первыми теряют читаемость.
    // Плотность задаёт вид (заголовок, основной, подпись), но последнее слово
    // за контрастом: подпись в 35% на светлом фоне уже не читается, поэтому
    // её осветляют ровно настолько, чтобы дотянуть до нижнего порога WCAG.
    textColor: ensureContrast(
      onBase(density(TEXT_STRENGTH.title)),
      windowBg,
      WCAG_AA_TEXT,
    ),
    secondaryTextColor: ensureContrast(
      onBase(density(TEXT_STRENGTH.body)),
      windowBg,
      WCAG_AA_TEXT,
    ),
    tertiaryTextColor: ensureContrast(
      onBase(density(TEXT_STRENGTH.caption)),
      cardBg,
      WCAG_AA_LARGE,
    ),

    // Подсветка строк и выделения — третий цвет палитры.
    highlightColor: mixHex(
      windowBg,
      accentBackground,
      moreAccents ? 0.22 : 0.1,
    ),
    pianoHighlightedLaneColor: mixHex(editorBg, accentBackground, 0.25),

    pianoKeyWhite: mixHex(
      "#fbfcff",
      accentBackground,
      coloredBackground ? 0.06 : 0,
    ),
    pianoKeyBlack: mixHex(panelBg, "#000000", 0.35),
    pianoWhiteKeyLaneColor: mixHex(editorBg, baseText, 0.05),
    pianoBlackKeyLaneColor: editorBg,
    pianoLaneEdgeColor: mixHex(editorBg, baseText, 0.08),
    ghostNoteColor: mixHex(
      editorBg,
      moreAccents ? decorative[1] : baseText,
      0.3,
    ),

    // Служебные цвета остаются узнаваемыми: зелёный — успех, красный — запись.
    // Их подгоняют по контрасту, но не перекрашивают: смысл важнее палитры.
    greenColor: ensureContrast(baseTheme.greenColor, windowBg, WCAG_AA_LARGE),
    redColor: ensureContrast(baseTheme.redColor, windowBg, WCAG_AA_LARGE),
    yellowColor: ensureContrast(baseTheme.yellowColor, windowBg, WCAG_AA_LARGE),
    recordColor: ensureContrast(baseTheme.recordColor, windowBg, WCAG_AA_LARGE),
    cursorColor: ensureContrast(
      moreAccents ? secondary : "#ff2d2d",
      editorBg,
      WCAG_AA_LARGE,
    ),

    shadowColor: SHADOW,
  }

  return { theme, palette, slots }
}

/**
 * Тема из настроек редактора целиком: посчитанное плюс ручные правки.
 *
 * В режиме `dev` правила не применяются вовсе — там правки и есть тема.
 */
export const themeFromGenerator = (
  generator: ThemeGenerator,
  devBase: Theme = baseTheme,
): Theme => {
  if (generator.mode === "dev") {
    return { ...devBase, ...generator.overrides }
  }

  const baseColor = generator.baseColor ?? defaultSettings.baseColor
  const harmony = generator.harmony ?? defaultSettings.harmony

  const { theme } = generateTheme({
    baseColor,
    harmony,
    // У старых тем поля нет: восстанавливаем основу тем же правилом, по
    // которому её тогда и выбрали, — иначе тема открылась бы вывернутой.
    appearance: generator.appearance ?? suggestAppearance(baseColor, harmony),
    coloredBackground:
      generator.coloredBackground ?? defaultSettings.coloredBackground,
    moreAccents: generator.moreAccents ?? defaultSettings.moreAccents,
    adjustments: generator.adjustments ?? defaultAdjustments,
  })

  return generator.mode === "advanced"
    ? { ...theme, ...generator.overrides }
    : theme
}

/** Контраст пары «цвет на фоне» — для подсказок в редакторе. */
export const ratioOf = (foreground: string, background: string): number =>
  Math.round(contrastRatio(foreground, background) * 100) / 100
