import { act, renderHook } from "@testing-library/react"
import { Provider } from "jotai"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it } from "vitest"
import { useRouter } from "../hooks/useRouter"
import { useApplyWorkspaceView, usePanel, useWorkspace } from "./useWorkspace"

/**
 * Каждый тест — со своим хранилищем jotai, иначе раскладка протекала бы из
 * теста в тест: атомы у неё общие на весь модуль.
 */
const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider>{children}</Provider>
)

/** Геттеры внутри хука вызывают useAtomValue, поэтому читаем их в рендере. */
const renderPanel = (id: "patternList" | "trackList" | "eventList") =>
  renderHook(
    () => {
      const panel = usePanel(id)
      return {
        isOpen: panel.isOpen,
        size: panel.size,
        setOpen: panel.setOpen,
        setSize: panel.setSize,
      }
    },
    { wrapper },
  )

beforeEach(() => {
  localStorage.clear()
})

describe("рабочая область", () => {
  it("по умолчанию берётся раскладка LARD из папки Workspace", () => {
    const { result } = renderHook(
      () => {
        const { name, workspace } = useWorkspace()
        return { name, workspace }
      },
      { wrapper },
    )

    expect(result.current.name).toBe("lard")
    expect(result.current.workspace.panels.patternList).toEqual({
      visible: true,
      size: 170,
    })
    expect(result.current.workspace.panels.eventList.visible).toBe(false)
  })

  it("переключатель панели меняет раскладку", () => {
    const { result } = renderPanel("trackList")

    expect(result.current.isOpen).toBe(true)
    act(() => result.current.setOpen(false))
    expect(result.current.isOpen).toBe(false)
  })

  it("принимает функцию от предыдущего состояния — как useState", () => {
    // Именно так переключают панель кнопки в тулбаре.
    const { result } = renderPanel("patternList")

    act(() => result.current.setOpen((prev) => !prev))
    expect(result.current.isOpen).toBe(false)
  })

  it("запоминает размер, перетащенный разделителем", () => {
    const { result } = renderPanel("patternList")

    act(() => result.current.setSize(300))
    expect(result.current.size).toBe(300)
  })

  it("скрытая панель не теряет свой размер", () => {
    // Ради этого панель хранится целиком, а не одним флагом видимости.
    const { result } = renderPanel("trackList")

    act(() => result.current.setOpen(false))
    expect(result.current.size).toBe(240)
  })

  it("выбор другой раскладки применяется целиком и сбрасывает правки", () => {
    const { result } = renderHook(
      () => {
        const { name, select } = useWorkspace()
        const patternList = usePanel("patternList")
        return {
          name,
          select,
          isOpen: patternList.isOpen,
          size: patternList.size,
          setOpen: patternList.setOpen,
        }
      },
      { wrapper },
    )

    act(() => result.current.setOpen(false))
    expect(result.current.isOpen).toBe(false)

    act(() => result.current.select("flstudio"))
    expect(result.current.name).toBe("flstudio")
    // Панель вернулась, и ширина — из нового пресета, а не прежняя.
    expect(result.current.isOpen).toBe(true)
    expect(result.current.size).toBe(200)
  })

  it("открывает раздел, заданный раскладкой", () => {
    const { result } = renderHook(
      () => {
        useApplyWorkspaceView()
        return useRouter().path
      },
      { wrapper },
    )

    expect(result.current).toBe("/track")
  })
})
