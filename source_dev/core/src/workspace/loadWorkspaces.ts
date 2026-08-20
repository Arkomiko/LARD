import {
  collectPresets,
  type PresetModules,
  pickPreset,
} from "../presets/presetFolder"
import {
  baseWorkspace,
  defaultWorkspaceName,
  type Workspace,
  type WorkspaceFile,
  type WorkspacePanel,
  type WorkspacePanelId,
  workspacePanelIds,
} from "./Workspace"

/** Разобранная папка рабочих областей. */
export interface WorkspaceCollection {
  /** Готовые раскладки по имени файла. */
  workspaces: Record<string, Workspace>
  /** Подписи раскладок — для выпадающего списка в настройках. */
  workspaceLabels: Record<string, string>
  /** Имена раскладок, найденные в папке. */
  workspaceNames: string[]
  /** Раскладка по имени. Неизвестное имя не должно ронять интерфейс. */
  getWorkspace: (name: string) => Workspace
}

/**
 * Накладывает файл на базовую раскладку.
 *
 * В отличие от темы, где поля плоские, здесь два уровня: панель, указанная в
 * файле частично, должна добрать недостающее у базовой, а не заменить её
 * целиком. Иначе `{"trackList": {"visible": false}}` стёрло бы её размер.
 */
const mergeWorkspace = (file: WorkspaceFile): Workspace => {
  const panels = {} as Record<WorkspacePanelId, WorkspacePanel>

  for (const id of workspacePanelIds) {
    panels[id] = { ...baseWorkspace.panels[id], ...file.panels?.[id] }
  }

  return { view: file.view ?? baseWorkspace.view, panels }
}

/** Собирает рабочие области из файлов папки `Workspace`. */
export const loadWorkspaces = (
  modules: PresetModules<WorkspaceFile>,
): WorkspaceCollection => {
  const { values, labels, names } = collectPresets<WorkspaceFile, Workspace>(
    modules,
    {
      build: (file) => mergeWorkspace(file),
      label: (file) => file.label,
    },
  )

  return {
    workspaces: values,
    workspaceLabels: labels,
    workspaceNames: names,
    getWorkspace: (name) =>
      pickPreset(values, name, defaultWorkspaceName) ?? baseWorkspace,
  }
}
