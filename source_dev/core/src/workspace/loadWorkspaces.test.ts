import { describe, expect, it } from "vitest"
import { loadWorkspaces } from "./loadWorkspaces"
import { baseWorkspace, type WorkspaceFile } from "./Workspace"

const modules = {
  "../../Workspace/lard.json": { default: { label: "LARD" } as WorkspaceFile },
  "../../Workspace/compact.json": {
    default: {
      label: "Компактная",
      panels: { patternList: { visible: false }, trackList: { size: 300 } },
    } as WorkspaceFile,
  },
  "../../Workspace/arrange.json": {
    default: { view: "arrange" } as WorkspaceFile,
  },
}

describe("загрузка рабочих областей", () => {
  const { workspaces, workspaceLabels, workspaceNames, getWorkspace } =
    loadWorkspaces(modules)

  it("находит раскладки по файлам папки", () => {
    expect(workspaceNames).toEqual(["lard", "compact", "arrange"])
  })

  it("берёт подпись из файла, а без неё — имя файла", () => {
    expect(workspaceLabels.compact).toBe("Компактная")
    expect(workspaceLabels.arrange).toBe("arrange")
  })

  it("добирает недостающее из базовой раскладки", () => {
    expect(workspaces.lard).toEqual(baseWorkspace)
  })

  it("сохраняет размер панели, у которой указана только видимость", () => {
    // Ради этого раскладка сливается по панелям, а не целиком.
    expect(workspaces.compact.panels.patternList).toEqual({
      visible: false,
      size: baseWorkspace.panels.patternList.size,
    })
  })

  it("сохраняет видимость панели, у которой указан только размер", () => {
    expect(workspaces.compact.panels.trackList).toEqual({
      visible: true,
      size: 300,
    })
  })

  it("задаёт раздел, который открыт при старте", () => {
    expect(workspaces.arrange.view).toBe("arrange")
    expect(workspaces.lard.view).toBe("track")
  })

  it("откатывается на базовую при неизвестном имени", () => {
    expect(getWorkspace("нет такой раскладки")).toEqual(workspaces.lard)
    expect(loadWorkspaces({}).getWorkspace("lard")).toEqual(baseWorkspace)
  })
})
