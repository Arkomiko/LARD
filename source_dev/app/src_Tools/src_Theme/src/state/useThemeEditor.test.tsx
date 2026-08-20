import { baseTheme, generateTheme } from "@lard/core"
import { act, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { describe, expect, it } from "vitest"
import { themes } from "../storage/themeFiles"
import {
  ThemeEditorProvider,
  themeFileOf,
  useThemeEditor,
} from "./useThemeEditor"

const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeEditorProvider>{children}</ThemeEditorProvider>
)

const render = () => renderHook(() => useThemeEditor(), { wrapper })

describe("упрощённый режим", () => {
  it("начинает с настроек по умолчанию", () => {
    const { result } = render()
    expect(result.current.mode).toBe("fast")
    expect(result.current.palette).toHaveLength(5)
  })

  it("пересчитывает тему при смене базового цвета", () => {
    const { result } = render()
    const before = result.current.theme.themeColor

    act(() => result.current.setSettings({ baseColor: "#1f2d6b" }))

    expect(result.current.theme.themeColor).not.toBe(before)
    expect(result.current.theme).toEqual(
      generateTheme({ ...result.current.settings }).theme,
    )
  })

  it("правило сочетания меняет палитру", () => {
    const { result } = render()
    const before = result.current.palette

    act(() => result.current.setSettings({ harmony: "triad" }))

    expect(result.current.palette).not.toEqual(before)
  })

  it("окрашенный фон делает фон окна цветным", () => {
    const { result } = render()
    const plain = result.current.theme.backgroundColor

    act(() => result.current.setSettings({ coloredBackground: true }))

    expect(result.current.theme.backgroundColor).not.toBe(plain)
  })
})

describe("основа темы", () => {
  it("новая тема начинается тёмной", () => {
    const { result } = render()
    expect(result.current.settings.appearance).toBe("dark")
    expect(result.current.theme.isLightContent).toBe(true)
  })

  it("переключается на светлую и обратно", () => {
    const { result } = render()

    act(() => result.current.setSettings({ appearance: "light" }))
    expect(result.current.theme.isLightContent).toBe(false)

    act(() => result.current.setSettings({ appearance: "dark" }))
    expect(result.current.theme.isLightContent).toBe(true)
  })

  it("не переворачивается вслед за цветом", () => {
    // Из-за этого переключатель и появился: раньше основу решала яркость
    // цвета, и подбор цвета кидал тему из светлой в тёмную и обратно.
    const { result } = render()

    for (const baseColor of ["#f2f6ff", "#0b1020", "#e8d8a0"]) {
      act(() => result.current.setSettings({ baseColor }))
      expect(result.current.theme.isLightContent).toBe(true)
    }
  })

  it("уходит в файл темы", () => {
    const { result } = render()

    act(() => result.current.setSettings({ appearance: "light" }))

    expect(themeFileOf(result.current).generator?.appearance).toBe("light")
  })
})

describe("поправки", () => {
  it("начинаются с нулей", () => {
    const { result } = render()
    expect(result.current.settings.adjustments).toEqual({
      saturation: 0,
      brightness: 0,
      contrast: 0,
      text: 0,
    })
  })

  it("подкручиваются поштучно и меняют тему", () => {
    const { result } = render()
    const before = result.current.theme.backgroundColor

    act(() => result.current.setAdjustment("brightness", 60))

    expect(result.current.settings.adjustments.brightness).toBe(60)
    expect(result.current.settings.adjustments.saturation).toBe(0)
    expect(result.current.theme.backgroundColor).not.toBe(before)
  })

  it("уходят в файл темы", () => {
    const { result } = render()

    act(() => result.current.setAdjustment("contrast", -40))

    expect(themeFileOf(result.current).generator?.adjustments?.contrast).toBe(
      -40,
    )
  })

  it("новая тема возвращает нули", () => {
    const { result } = render()

    act(() => result.current.setAdjustment("saturation", 100))
    act(() => result.current.newTheme())

    expect(result.current.settings.adjustments.saturation).toBe(0)
  })
})

describe("сцена: макет и область применения", () => {
  it("начинает с окна и полной области", () => {
    const { result } = render()
    expect(result.current.tab).toBe("window")
    expect(result.current.scope).toBe("full")
  })

  it("переключает вкладку и область", () => {
    const { result } = render()

    act(() => result.current.setTab("elements"))
    act(() => result.current.setScope("prototype"))

    expect(result.current.tab).toBe("elements")
    expect(result.current.scope).toBe("prototype")
  })

  it("добавляет и убирает элементы макета", () => {
    const { result } = render()
    const before = result.current.mockup.tools.length

    act(() => result.current.addToMockup("tools"))
    expect(result.current.mockup.tools).toHaveLength(before + 1)

    const removed = result.current.mockup.tools[0].id
    act(() => result.current.removeFromMockup("tools", removed))

    expect(result.current.mockup.tools).toHaveLength(before)
    expect(result.current.mockup.tools.map((t) => t.id)).not.toContain(removed)
  })

  it("убирает именно указанный элемент, а не соседний", () => {
    const { result } = render()
    const [first, second] = result.current.mockup.patterns

    act(() => result.current.removeFromMockup("patterns", first.id))

    expect(result.current.mockup.patterns).toHaveLength(1)
    expect(result.current.mockup.patterns[0].id).toBe(second.id)
  })

  it("не растёт без предела", () => {
    const { result } = render()

    for (let i = 0; i < 50; i++) {
      act(() => result.current.addToMockup("tools"))
    }

    expect(result.current.mockup.tools.length).toBeLessThanOrEqual(10)
  })

  it("прячет и возвращает панель, не теряя её размер", () => {
    const { result } = render()
    const size = result.current.mockup.panels.patternList.size

    act(() => result.current.togglePanel("patternList"))
    expect(result.current.mockup.panels.patternList.visible).toBe(false)

    act(() => result.current.togglePanel("patternList"))
    expect(result.current.mockup.panels.patternList.visible).toBe(true)
    expect(result.current.mockup.panels.patternList.size).toBe(size)
  })

  it("начинает с раскладки LARD по умолчанию", () => {
    // Те же панели и размеры, что в Tools_presets/Workspace/lard.json.
    const { panels } = render().result.current.mockup

    expect(panels.patternList).toEqual({ visible: true, size: 170 })
    expect(panels.trackList).toEqual({ visible: true, size: 240 })
    expect(panels.eventList.visible).toBe(false)
    expect(panels.controlPane.size).toBe(40)
  })

  it("тянет разделитель и упирается в предел", () => {
    const { result } = render()

    act(() => result.current.resizePanel("patternList", 40))
    expect(result.current.mockup.panels.patternList.size).toBe(210)

    act(() => result.current.resizePanel("patternList", -1000))
    expect(result.current.mockup.panels.patternList.size).toBe(110)

    act(() => result.current.resizePanel("patternList", 1000))
    expect(result.current.mockup.panels.patternList.size).toBe(320)
  })

  it("панелям инструментов размер не меняет", () => {
    // У них его нет: он задан содержимым, как и в рабочей области.
    const { result } = render()

    act(() => result.current.resizePanel("toolbar", 40))

    expect(result.current.mockup.panels.toolbar.size).toBeUndefined()
  })

  it("сброс возвращает и панели, и элементы", () => {
    const { result } = render()

    act(() => result.current.togglePanel("trackList"))
    act(() => result.current.resizePanel("patternList", 50))
    act(() => result.current.addToMockup("tools"))
    act(() => result.current.resetMockup())

    const { panels, tools } = result.current.mockup
    expect(panels.trackList.visible).toBe(true)
    expect(panels.patternList.size).toBe(170)
    expect(tools).toHaveLength(3)
  })

  it("даёт добавленным элементам собственные имена", () => {
    const { result } = render()

    act(() => result.current.addToMockup("instruments"))
    const list = result.current.mockup.instruments
    const added = list[list.length - 1]

    expect(added.title).toBe("Трек 3")
    expect(added.caption).not.toBe("")
  })

  it("новая тема не трогает собранный макет", () => {
    // Макет — это про то, как смотрят, а не про то, какую тему правят.
    const { result } = render()

    act(() => result.current.addToMockup("tools"))
    act(() => result.current.togglePanel("trackList"))
    const tools = result.current.mockup.tools.length

    act(() => result.current.newTheme())

    expect(result.current.mockup.tools).toHaveLength(tools)
    expect(result.current.mockup.panels.trackList.visible).toBe(false)
  })
})

describe("расширенный режим", () => {
  it("кладёт правку поверх посчитанного", () => {
    const { result } = render()

    act(() => result.current.setMode("advanced"))
    act(() => result.current.setOverride("themeColor", "#ff0000"))

    expect(result.current.theme.themeColor).toBe("#ff0000")
    // Остальное всё ещё считается правилами.
    expect(result.current.theme.backgroundColor).toBe(
      generateTheme(result.current.settings).theme.backgroundColor,
    )
  })

  it("возвращает поле к посчитанному", () => {
    const { result } = render()
    const computed = result.current.theme.themeColor

    act(() => result.current.setMode("advanced"))
    act(() => result.current.setOverride("themeColor", "#ff0000"))
    act(() => result.current.clearOverride("themeColor"))

    expect(result.current.theme.themeColor).toBe(computed)
  })

  it("сообщает о нечитаемой правке, но не отменяет её", () => {
    const { result } = render()

    act(() => result.current.setMode("advanced"))
    act(() =>
      result.current.setOverride(
        "textColor",
        result.current.theme.backgroundColor,
      ),
    )

    const issues = result.current.issues.filter((i) => i.field === "textColor")
    expect(issues).toHaveLength(1)
    expect(issues[0].level).toBe("error")
  })

  it("возврат в упрощённый режим отбрасывает правки", () => {
    const { result } = render()

    act(() => result.current.setMode("advanced"))
    act(() => result.current.setOverride("themeColor", "#ff0000"))
    act(() => result.current.setMode("fast"))

    expect(result.current.overrides).toEqual({})
    expect(result.current.theme.themeColor).not.toBe("#ff0000")
  })
})

describe("разработчиковый режим", () => {
  it("с сохранением настроек оставляет тему такой же", () => {
    const { result } = render()
    const before = result.current.theme

    act(() => result.current.enterDevMode(true))

    expect(result.current.mode).toBe("dev")
    expect(result.current.theme).toEqual(before)
  })

  it("с нуля даёт базовую тему редактора", () => {
    const { result } = render()

    act(() => result.current.enterDevMode(false))

    expect(result.current.theme).toEqual(baseTheme)
  })

  it("правила больше не действуют", () => {
    const { result } = render()

    act(() => result.current.enterDevMode(false))
    act(() => result.current.setSettings({ baseColor: "#ff0000" }))

    // Базовый цвет остался в настройках, но на тему уже не влияет.
    expect(result.current.theme).toEqual(baseTheme)
  })

  it("новая тема возвращает редактор в упрощённый режим", () => {
    const { result } = render()

    act(() => result.current.enterDevMode(false))
    act(() => result.current.newTheme())

    expect(result.current.mode).toBe("fast")
  })
})

describe("открытие темы из папки", () => {
  it("тему, написанную руками, открывает разработчиковым режимом", () => {
    // Правилами её уже не объяснить: в файле только значения.
    const { result } = render()

    act(() => result.current.openTheme("dark"))

    expect(result.current.name).toBe("dark")
    expect(result.current.mode).toBe("dev")
    expect(result.current.theme).toEqual(themes.dark)
  })

  it("подхватывает подпись темы", () => {
    const { result } = render()

    act(() => result.current.openTheme("flstudio"))

    expect(result.current.label).toBe("FL Studio")
  })
})

describe("файл темы", () => {
  it("содержит подпись, настройки и все цвета", () => {
    const { result } = render()
    act(() => result.current.setLabel("Проверка"))

    const file = themeFileOf(result.current)

    expect(file.label).toBe("Проверка")
    expect(file.generator?.mode).toBe("fast")
    expect(file.generator?.baseColor).toBe(result.current.settings.baseColor)
    expect(file.themeColor).toBe(result.current.theme.themeColor)
    // Цвета выписаны все: приложение читает файл без генератора.
    for (const key of Object.keys(baseTheme)) {
      expect(file).toHaveProperty(key)
    }
  })

  it("у темы из разработчикового режима настроек генератора нет", () => {
    const { result } = render()

    act(() => result.current.enterDevMode(true))
    const file = themeFileOf(result.current)

    expect(file.generator?.mode).toBe("dev")
    expect(file.generator?.baseColor).toBeUndefined()
  })
})
