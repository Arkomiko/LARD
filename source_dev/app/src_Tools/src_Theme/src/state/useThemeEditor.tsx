/**
 * Состояние редактора тем.
 *
 * Разделено на две части, и это не мелочь:
 *
 *   - тема — то, что уйдёт в файл: имя, режим, настройки, ручные правки;
 *   - сцена — как на неё смотрят: вкладка превью, область применения, макет.
 *
 * Сцена в файл не попадает и от смены темы не зависит, поэтому и живёт
 * отдельным состоянием. Заодно её кусок сохраняет ссылку, пока его не трогали,
 * — на этом держится `memo` у макета: подбор цвета его не перерисовывает.
 *
 * Сама тема нигде не хранится: она каждый раз считается ядром из настроек.
 * Держать её рядом было бы вторым источником правды, и он немедленно
 * разошёлся бы с первым.
 */
import {
  assignSlots,
  baseTheme,
  checkTheme,
  defaultAdjustments,
  defaultSettings,
  type GeneratorSettings,
  generateTheme,
  suggestAppearance,
  type Theme,
  type ThemeAdjustments,
  type ThemeEditorMode,
  type ThemeGenerator,
  type ThemeIssue,
  themeFromGenerator,
} from "@lard/core"
import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react"
import { buildThemeFile, themeFiles, themes } from "../storage/themeFiles"

/** Что показано в превью. */
export type PreviewTab = "window" | "elements"

/**
 * Куда ложатся правки темы.
 *
 * `full` — на весь редактор: панель настроек и та перекрашивается. Видно не
 * только «как будет выглядеть окно», но и «каково этой темой пользоваться».
 * `prototype` — только на макет. Редактор остаётся в своей теме, и правки
 * видны как на образце, а не изнутри.
 */
export type ThemeScope = "full" | "prototype"

/**
 * Элемент макета.
 *
 * Личность у каждого своя и не зависит от места в ряду: убрали соседа — этот
 * остался собой. Без неё React считал бы элементы по номерам и после удаления
 * из середины переписывал бы содержимое всем, кто стоит дальше.
 */
export interface MockupItem {
  id: string
  title: string
  caption?: string
}

/**
 * Панели макета — те же, что описывает формат рабочей области LARD
 * (`Workspace` в ядре), и в том же порядке слева направо.
 *
 * Заголовка окна и полосы вкладок (`navigation` в рабочей области) здесь нет
 * намеренно: макет показывает редактор, а не окно вокруг него.
 */
export const mockupPanelIds = [
  "toolbar",
  "patternList",
  "eventList",
  "controlPane",
  "trackList",
  "transport",
] as const

export type MockupPanelId = (typeof mockupPanelIds)[number]

export interface MockupPanel {
  visible: boolean
  /**
   * Размер панели. У боковых — ширина в пикселях, у полосы автоматизации —
   * доля высоты в процентах, как и в файле рабочей области. У панелей
   * инструментов размера нет: он задан содержимым.
   */
  size?: number
}

/** Изменяемая часть макета: какие панели видны и что в них лежит. */
export interface Mockup {
  panels: Record<MockupPanelId, MockupPanel>
  /** Кнопки на панели инструментов — безымянные, отличаются только местом. */
  tools: MockupItem[]
  patterns: MockupItem[]
  instruments: MockupItem[]
}

/** Части макета, которые собираются поштучно. */
export const mockupParts = ["tools", "patterns", "instruments"] as const
export type MockupPart = (typeof mockupParts)[number]

/**
 * Сколько чего макет выдерживает.
 *
 * Ограничение не про память, а про смысл: два десятка кнопок в миниатюре
 * окна перестают быть похожими на окно, а ради этого сходства макет и нужен.
 */
const mockupLimit: Record<MockupPart, number> = {
  tools: 10,
  patterns: 8,
  instruments: 8,
}

/**
 * Пределы размеров панелей. У боковых — пиксели, у полосы автоматизации —
 * проценты. Взяты у настоящего редактора: там разделители не дают ни задавить
 * пианоролл, ни сплющить саму панель.
 */
export const panelBounds: Partial<
  Record<MockupPanelId, { min: number; max: number }>
> = {
  patternList: { min: 110, max: 320 },
  eventList: { min: 140, max: 360 },
  trackList: { min: 140, max: 360 },
  controlPane: { min: 12, max: 70 },
}

/** Подписи панелей — для переключателей над макетом. */
export const panelLabels: Record<MockupPanelId, string> = {
  toolbar: "Инструменты",
  patternList: "Паттерны",
  eventList: "События",
  controlPane: "Автоматизация",
  trackList: "Стойка",
  transport: "Транспорт",
}

const instrumentNames = [
  "Acoustic Grand Piano",
  "Fretless Bass",
  "Studio Drums",
  "Warm Pad",
  "Nylon Guitar",
  "Synth Lead",
  "String Ensemble",
  "Electric Piano",
]

let lastId = 0

/** Новый элемент нужной части, подписанный по её правилам. */
const makeItem = (part: MockupPart, index: number): MockupItem => {
  const id = `mockup-${++lastId}`

  switch (part) {
    case "tools":
      return { id, title: "" }
    case "patterns":
      return {
        id,
        title: `Pattern ${index + 1}`,
        caption: `${8 + ((index * 7) % 24)} нот`,
      }
    case "instruments":
      return {
        id,
        title: `Трек ${index + 1}`,
        caption: instrumentNames[index % instrumentNames.length],
      }
  }
}

/** Начальный набор части — столько элементов, сколько просят. */
const initialPart = (part: MockupPart, count: number): MockupItem[] =>
  Array.from({ length: count }, (_, index) => makeItem(part, index))

/**
 * Макет по умолчанию — раскладка LARD из `Tools_presets/Workspace/lard.json`:
 * те же панели и те же размеры, что у настоящего редактора.
 */
const defaultMockup = (): Mockup => ({
  panels: {
    toolbar: { visible: true },
    patternList: { visible: true, size: 170 },
    eventList: { visible: false, size: 240 },
    controlPane: { visible: true, size: 40 },
    trackList: { visible: true, size: 240 },
    transport: { visible: true },
  },
  tools: initialPart("tools", 3),
  patterns: initialPart("patterns", 2),
  instruments: initialPart("instruments", 2),
})

interface ThemeState {
  /** Имя файла темы — оно же имя темы в настройках LARD. */
  name: string
  /** Подпись в списке тем. */
  label: string
  mode: ThemeEditorMode
  settings: GeneratorSettings
  /** Ручные правки поверх посчитанного. */
  overrides: Partial<Theme>
}

interface StageState {
  scope: ThemeScope
  tab: PreviewTab
  mockup: Mockup
}

const initialTheme: ThemeState = {
  name: "my-theme",
  label: "Моя тема",
  mode: "fast",
  settings: defaultSettings,
  overrides: {},
}

const initialStage: StageState = {
  scope: "full",
  tab: "window",
  mockup: defaultMockup(),
}

/** Действия редактора. Их набор не меняется — ссылки на них живут вечно. */
export interface ThemeEditorActions {
  setName: (name: string) => void
  setLabel: (label: string) => void
  setSettings: (settings: Partial<GeneratorSettings>) => void
  /** Подкрутить одну поправку: насыщенность, светлоту, разбег или текст. */
  setAdjustment: (key: keyof ThemeAdjustments, value: number) => void
  setOverride: (field: keyof Theme, value: string | boolean) => void
  clearOverride: (field: keyof Theme) => void
  /** Переход между упрощённым и расширенным режимами. */
  setMode: (mode: Exclude<ThemeEditorMode, "dev">) => void
  /**
   * Переход в разработчиковый режим. `keep` — перенести посчитанное в правки,
   * иначе начать с базовой темы. Обратной дороги нет: правила больше не
   * применяются, и восстанавливать из них нечего.
   */
  enterDevMode: (keep: boolean) => void
  /** Открыть тему из папки. */
  openTheme: (name: string) => void
  /** Начать новую тему с настроек по умолчанию. */
  newTheme: () => void

  setScope: (scope: ThemeScope) => void
  setTab: (tab: PreviewTab) => void
  /** Добавить элемент в макет. Сверх предела ничего не добавляется. */
  addToMockup: (part: MockupPart) => void
  removeFromMockup: (part: MockupPart, id: string) => void
  /** Показать или спрятать панель макета — как «Toolbars» в FL Studio. */
  togglePanel: (id: MockupPanelId) => void
  /** Потянуть разделитель: размер меняется на столько-то и упирается в предел. */
  resizePanel: (id: MockupPanelId, by: number) => void
  /** Вернуть макет к раскладке LARD по умолчанию. */
  resetMockup: () => void
}

export interface ThemeEditor
  extends ThemeState,
    StageState,
    ThemeEditorActions {
  /** Готовая тема — то, что увидит LARD. */
  theme: Theme
  /** Пять цветов палитры в порядке выразительности. */
  palette: string[]
  /** Роли цветов палитры. */
  slots: ReturnType<typeof assignSlots>
  /** Замечания по читаемости. */
  issues: ThemeIssue[]
  /** Настройки, которые уйдут в файл темы. */
  generator: ThemeGenerator
}

const ThemeEditorContext = createContext<ThemeEditor | null>(null)
const ActionsContext = createContext<ThemeEditorActions | null>(null)

export const ThemeEditorProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<ThemeState>(initialTheme)
  const [stage, setStage] = useState<StageState>(initialStage)

  const actions = useMemo<ThemeEditorActions>(
    () => ({
      setName: (name) => setTheme((prev) => ({ ...prev, name })),

      setLabel: (label) => setTheme((prev) => ({ ...prev, label })),

      setSettings: (settings) =>
        setTheme((prev) => ({
          ...prev,
          settings: { ...prev.settings, ...settings },
        })),

      setAdjustment: (key, value) =>
        setTheme((prev) => ({
          ...prev,
          settings: {
            ...prev.settings,
            adjustments: { ...prev.settings.adjustments, [key]: value },
          },
        })),

      setOverride: (field, value) =>
        setTheme((prev) => ({
          ...prev,
          overrides: { ...prev.overrides, [field]: value },
        })),

      clearOverride: (field) =>
        setTheme((prev) => {
          const overrides = { ...prev.overrides }
          delete overrides[field]
          return { ...prev, overrides }
        }),

      setMode: (mode) =>
        setTheme((prev) => ({
          ...prev,
          mode,
          // Возврат в упрощённый режим отбрасывает ручные правки: там всё
          // считается по правилам, и держать поверх них чужие значения нельзя.
          overrides: mode === "fast" ? {} : prev.overrides,
        })),

      enterDevMode: (keep) =>
        setTheme((prev) => ({
          ...prev,
          mode: "dev",
          overrides: keep
            ? themeFromGenerator({
                mode: prev.mode,
                ...prev.settings,
                overrides: prev.overrides,
              })
            : { ...baseTheme },
        })),

      openTheme: (name) => {
        const file = themeFiles[name]
        const generator = file?.generator

        if (generator !== undefined && generator.mode !== "dev") {
          setTheme((prev) => ({
            ...prev,
            name,
            label: file.label ?? name,
            mode: generator.mode,
            settings: {
              baseColor: generator.baseColor ?? defaultSettings.baseColor,
              harmony: generator.harmony ?? defaultSettings.harmony,
              // У тем, сохранённых до переключателя основы, поля нет —
              // ядро подскажет ту основу, с которой их и собирали.
              appearance:
                generator.appearance ??
                suggestAppearance(
                  generator.baseColor ?? defaultSettings.baseColor,
                  generator.harmony ?? defaultSettings.harmony,
                ),
              coloredBackground:
                generator.coloredBackground ??
                defaultSettings.coloredBackground,
              moreAccents: generator.moreAccents ?? defaultSettings.moreAccents,
              // Поправок в старых темах нет — значит, все нули.
              adjustments: generator.adjustments ?? defaultAdjustments,
            },
            overrides: generator.overrides ?? {},
          }))
          return
        }

        // Тему, написанную руками, правилами уже не объяснить: открываем её
        // разработчиковым режимом, где значения и есть тема.
        setTheme((prev) => ({
          ...prev,
          name,
          label: file?.label ?? name,
          mode: "dev",
          overrides: { ...(themes[name] ?? baseTheme) },
        }))
      },

      // Сцену не трогаем: макет и вкладка — это про то, как смотрят, а не
      // про то, какую тему правят.
      newTheme: () => setTheme(initialTheme),

      setScope: (scope) => setStage((prev) => ({ ...prev, scope })),

      setTab: (tab) => setStage((prev) => ({ ...prev, tab })),

      // Части макета устроены одинаково, поэтому и добавление с удалением
      // общие: что именно появится, знает `makeItem`, а не эти две строки.
      addToMockup: (part) =>
        setStage((prev) => {
          const items = prev.mockup[part]

          if (items.length >= mockupLimit[part]) {
            return prev
          }

          return {
            ...prev,
            mockup: {
              ...prev.mockup,
              [part]: [...items, makeItem(part, items.length)],
            },
          }
        }),

      removeFromMockup: (part, id) =>
        setStage((prev) => ({
          ...prev,
          mockup: {
            ...prev.mockup,
            [part]: prev.mockup[part].filter((item) => item.id !== id),
          },
        })),

      togglePanel: (id) =>
        setStage((prev) => {
          const panel = prev.mockup.panels[id]

          return {
            ...prev,
            mockup: {
              ...prev.mockup,
              panels: {
                ...prev.mockup.panels,
                // Размер прячущейся панели сохраняется: вернётся она той же
                // ширины, что и была. Так же ведёт себя рабочая область.
                [id]: { ...panel, visible: !panel.visible },
              },
            },
          }
        }),

      resizePanel: (id, by) =>
        setStage((prev) => {
          const panel = prev.mockup.panels[id]
          const bounds = panelBounds[id]

          if (panel.size === undefined || bounds === undefined) {
            return prev
          }

          const size = Math.min(
            bounds.max,
            Math.max(bounds.min, panel.size + by),
          )

          if (size === panel.size) {
            return prev
          }

          return {
            ...prev,
            mockup: {
              ...prev.mockup,
              panels: { ...prev.mockup.panels, [id]: { ...panel, size } },
            },
          }
        }),

      resetMockup: () =>
        setStage((prev) => ({ ...prev, mockup: defaultMockup() })),
    }),
    [],
  )

  const value = useMemo<ThemeEditor>(() => {
    const generator: ThemeGenerator = {
      mode: theme.mode,
      ...(theme.mode === "dev" ? {} : theme.settings),
      ...(Object.keys(theme.overrides).length > 0
        ? { overrides: theme.overrides }
        : {}),
    }

    // Палитра и тема считаются одним заходом: до этого `generateTheme`
    // вызывался дважды за перерисовку — один раз внутри `themeFromGenerator`
    // и ещё раз ради палитры.
    const generated = generateTheme(theme.settings)
    const finalTheme =
      theme.mode === "dev"
        ? { ...baseTheme, ...theme.overrides }
        : theme.mode === "advanced"
          ? { ...generated.theme, ...theme.overrides }
          : generated.theme

    return {
      ...theme,
      ...stage,
      ...actions,
      theme: finalTheme,
      palette: generated.palette,
      slots: generated.slots,
      issues: checkTheme(finalTheme),
      generator,
    }
  }, [theme, stage, actions])

  return (
    <ActionsContext.Provider value={actions}>
      <ThemeEditorContext.Provider value={value}>
        {children}
      </ThemeEditorContext.Provider>
    </ActionsContext.Provider>
  )
}

export const useThemeEditor = (): ThemeEditor => {
  const editor = useContext(ThemeEditorContext)
  if (editor === null) {
    throw new Error("useThemeEditor вызван вне ThemeEditorProvider")
  }
  return editor
}

/**
 * Только действия — без перерисовки на каждую правку цвета.
 *
 * Годится всему, что умеет менять состояние, но ничего из него не показывает:
 * кнопкам макета, переключателям вкладок.
 */
export const useThemeEditorActions = (): ThemeEditorActions => {
  const actions = useContext(ActionsContext)
  if (actions === null) {
    throw new Error("useThemeEditorActions вызван вне ThemeEditorProvider")
  }
  return actions
}

/** Содержимое файла темы для текущего состояния редактора. */
export const themeFileOf = (editor: ThemeEditor) =>
  buildThemeFile(editor.label, editor.generator, editor.theme)
