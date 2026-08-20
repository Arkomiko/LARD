/**
 * Формат темы LARD.
 *
 * Тема — обычный JSON-файл в папке `Theme` в корне репозитория. Файл может
 * задавать только те цвета, которые хочется поменять: всё недостающее берётся
 * из базовой тёмной темы. Поэтому тема из двух строк — рабочая тема, а
 * опечатка в одном ключе не оставит интерфейс без цвета.
 *
 * Здесь только описание формата и значения по умолчанию. Чтение папки —
 * в `loadThemes`.
 */
import type { HarmonyRule } from "./generator/harmony"

export interface Theme {
  isLightContent: boolean // если true — текст светлый, фон тёмный
  font: string
  monoFont: string
  canvasFont: string
  themeColor: string
  onSurfaceColor: string // цвет содержимого поверх themeColor
  darkBackgroundColor: string
  backgroundColor: string
  secondaryBackgroundColor: string
  editorBackgroundColor: string // редактор автоматизации / аранжировка / темп
  editorGridColor: string
  editorSecondaryGridColor: string
  dividerColor: string
  popupBorderColor: string
  textColor: string
  secondaryTextColor: string
  tertiaryTextColor: string
  pianoKeyBlack: string
  pianoKeyWhite: string
  pianoWhiteKeyLaneColor: string
  pianoBlackKeyLaneColor: string
  pianoHighlightedLaneColor: string
  pianoLaneEdgeColor: string
  ghostNoteColor: string
  recordColor: string
  cursorColor: string // курсор воспроизведения
  shadowColor: string
  highlightColor: string
  greenColor: string
  redColor: string
  yellowColor: string
  /** Скругление крупных поверхностей: карточек, диалогов, панелей. */
  cornerRadius: string
  /** Скругление мелких элементов: кнопок, полей ввода, переключателей. */
  controlCornerRadius: string
}

/**
 * Базовая тема. Она же — источник значений по умолчанию для всех остальных,
 * поэтому здесь заполнены все поля без исключения.
 */
export const baseTheme: Theme = {
  isLightContent: true,
  font: "Inter, -apple-system, BlinkMacSystemFont, Avenir, Lato",
  monoFont: "Roboto Mono, monospace",
  canvasFont: "Arial",
  themeColor: "hsl(230, 70%, 55%)",
  onSurfaceColor: "#ffffff",
  textColor: "#ffffff",
  secondaryTextColor: "hsl(223, 12%, 60%)",
  tertiaryTextColor: "#5a6173",
  dividerColor: "hsl(224, 12%, 24%)",
  popupBorderColor: "hsl(228, 10%, 13%)",
  darkBackgroundColor: "hsl(228, 10%, 13%)",
  backgroundColor: "hsl(228, 10%, 16%)",
  secondaryBackgroundColor: "hsl(227, 10%, 22%)",
  editorBackgroundColor: "hsl(228, 10%, 13%)",
  editorSecondaryGridColor: "hsl(224, 12%, 19%)",
  editorGridColor: "hsl(224, 12%, 26%)",
  pianoKeyBlack: "#272a36",
  pianoKeyWhite: "#fbfcff",
  pianoWhiteKeyLaneColor: "hsl(228, 10%, 16%)",
  pianoBlackKeyLaneColor: "hsl(228, 10%, 13%)",
  pianoHighlightedLaneColor: "hsl(230, 23%, 20%)",
  pianoLaneEdgeColor: "hsl(228, 10%, 18%)",
  ghostNoteColor: "#444444",
  recordColor: "#dd3c3c",
  cursorColor: "#ff0000",
  shadowColor: "rgba(0, 0, 0, 0.1)",
  highlightColor: "#8388a51a",
  greenColor: "#31DE53",
  redColor: "#DE5267",
  yellowColor: "#DEB126",
  cornerRadius: "0.5rem",
  controlCornerRadius: "0.25rem",
}

/**
 * Режим, в котором тему собирали в редакторе.
 *
 * - `fast` — пара параметров, всё остальное считается по правилам;
 * - `advanced` — те же правила плюс ручные правки поверх;
 * - `dev` — правила не действуют, все значения заданы руками.
 */
export type ThemeEditorMode = "fast" | "advanced" | "dev"

/**
 * Основа темы: тёмная или светлая.
 *
 * Задаётся человеком и ничем не выводится. Раньше основу решала яркость
 * главного цвета — из-за этого тема прыгала из светлой в тёмную и обратно
 * прямо во время подбора цвета, стоило перевести ползунок через середину.
 */
export type ThemeAppearance = "dark" | "light"

/**
 * Общие поправки к посчитанной теме — четыре ручки поверх правил.
 *
 * Правила решают, какого цвета что; ручки — насколько густо. Ноль у каждой
 * означает «как посчитано», поэтому тема без поправок и тема со всеми нулями
 * — одна и та же тема.
 *
 * Поправки применяются **до** проверки контраста, а не после: подкрутить
 * можно что угодно, но пороги WCAG всё равно остаются за генератором. Ручка
 * меняет вид, а не читаемость.
 */
export interface ThemeAdjustments {
  /** Насыщенность цветных элементов: −100 обесцвечивает, +100 удваивает. */
  saturation: number
  /** Светлота поверхностей: плюс — к белому, минус — к чёрному. */
  brightness: number
  /** Разбег поверхностей между собой: 0 сводит панели и карточки к фону. */
  contrast: number
  /** Плотность текста: от блёклых подписей до плотных. */
  text: number
}

export const defaultAdjustments: ThemeAdjustments = {
  saturation: 0,
  brightness: 0,
  contrast: 0,
  text: 0,
}

/** Границы каждой ручки — одни на все: от −100 до +100. */
export const ADJUSTMENT_RANGE = 100

/**
 * Чем тема была получена. Приложению это не нужно — оно читает готовые цвета,
 * — но без этого редактор не смог бы открыть уже сохранённую тему в том же
 * режиме и с теми же крутилками.
 */
export interface ThemeGenerator {
  mode: ThemeEditorMode
  /** Базовый цвет, из которого выведена палитра. */
  baseColor?: string
  /** Правило сочетания цветов. */
  harmony?: HarmonyRule
  /**
   * Тёмная основа или светлая. У тем, сохранённых до появления переключателя,
   * поля нет — для них основу подсказывает `suggestAppearance`, и такая тема
   * открывается ровно такой, какой её сохранили.
   */
  appearance?: ThemeAppearance
  /** Поправки поверх правил. Нет поля — значит, все нули. */
  adjustments?: ThemeAdjustments
  /** Окрашивать ли фон подмешиванием палитры. */
  coloredBackground?: boolean
  /** Пускать ли в дело второстепенные цвета палитры. */
  moreAccents?: boolean
  /** Ручные правки поверх посчитанного — расширенный режим. */
  overrides?: Partial<Theme>
}

/** Настройки упрощённого режима по умолчанию. */
export const defaultGeneratorSettings: Required<
  Pick<
    ThemeGenerator,
    | "mode"
    | "baseColor"
    | "harmony"
    | "appearance"
    | "coloredBackground"
    | "moreAccents"
  >
> = {
  mode: "fast",
  baseColor: "#4d6bff",
  // Новая тема начинается тёмной: тёмная и есть тема LARD по умолчанию.
  appearance: "dark",
  harmony: "analogous",
  coloredBackground: false,
  moreAccents: false,
}

/**
 * Содержимое файла темы: любые поля темы, подпись для настроек и — если тему
 * собирали в редакторе — настройки, которыми её собрали.
 */
export type ThemeFile = Partial<Theme> & {
  label?: string
  generator?: ThemeGenerator
}

/**
 * Имя темы. Конкретный набор известен только на этапе сборки — он зависит от
 * того, какие файлы лежат в папке `Theme`, поэтому тип строковый.
 */
export type ThemeType = string

/** Тема, на которую переключаемся, если выбранная не найдена. */
export const defaultThemeName = "dark"
