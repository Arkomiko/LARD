import { describe, expect, it } from "vitest"
import { collectPresets, pickPreset, presetNameFromPath } from "./presetFolder"

describe("имя пресета из пути файла", () => {
  it("берёт имя файла без расширения", () => {
    expect(presetNameFromPath("../../Theme/dark.json")).toBe("dark")
    expect(presetNameFromPath("../../Language/zh-Hans.ts")).toBe("zh-Hans")
  })

  it("понимает пути, которые отдаёт сборщик для файлов вне корня", () => {
    // Vite отдаёт ключи то относительным путём, то в виде /@fs/...
    expect(presetNameFromPath("/@fs/E:/LARD/Theme/light.json")).toBe("light")
    expect(presetNameFromPath("E:\\LARD\\Theme\\light.json")).toBe("light")
  })
})

describe("сбор пресетов из папки", () => {
  const modules = {
    "./presets/a.json": { default: { value: 1, label: "Первый" } },
    "./presets/b.json": { default: { value: 2 } },
  }

  const collect = () =>
    collectPresets(modules, {
      build: (file) => ({ ...{ value: 0, extra: true }, ...file }),
      label: (file) => file.label,
    })

  it("называет пресеты по именам файлов", () => {
    expect(collect().names).toEqual(["a", "b"])
  })

  it("накладывает файл на базовое значение", () => {
    expect(collect().values.b).toEqual({ value: 2, extra: true })
  })

  it("берёт подпись из файла, а без неё — имя файла", () => {
    expect(collect().labels.a).toBe("Первый")
    expect(collect().labels.b).toBe("b")
  })

  it("предпочитает подпись отдельным экспортом", () => {
    // Так устроены языки: они лежат в .ts и выносят label наружу.
    const withExport = collectPresets(
      { "./ru.ts": { default: {}, label: "Русский" } },
      { build: (file) => file },
    )
    expect(withExport.labels.ru).toBe("Русский")
  })

  it("пропускает пустой файл, не роняя остальные", () => {
    const broken = collectPresets(
      {
        "./ok.json": { default: { value: 1 } },
        "./broken.json": { default: undefined as unknown as { value: number } },
      },
      { build: (file) => file },
    )
    expect(broken.names).toEqual(["ok"])
  })
})

describe("выбор пресета по имени", () => {
  const values = { dark: "тёмная", light: "светлая" }

  it("возвращает запрошенный", () => {
    expect(pickPreset(values, "light", "dark")).toBe("светлая")
  })

  it("откатывается на запасной, если такого имени нет", () => {
    // Так бывает, когда файл удалили, а в настройках имя осталось.
    expect(pickPreset(values, "нет такого", "dark")).toBe("тёмная")
  })

  it("возвращает undefined, если нет и запасного", () => {
    expect(pickPreset({}, "нет такого", "dark")).toBeUndefined()
  })
})
