/**
 * Рабочие области LARD: чтение папки `source_dev/Tools_presets/Workspace`.
 *
 * Сам формат раскладки и наложение файла на базовую живут в `@lard/core` — тем
 * же кодом читает раскладки редактор рабочих областей. Здесь остаётся только
 * разворачивание папки средствами сборщика.
 *
 * Чтобы сделать свою раскладку, достаточно положить в папку JSON-файл — он сам
 * появится в настройках. Ничего регистрировать в коде не нужно.
 */
import { loadWorkspaces, type WorkspaceFile } from "@lard/core"

/**
 * `import.meta.glob` разворачивается на этапе сборки в статический список
 * импортов, поэтому папка читается без обращений к диску во время работы.
 * В режиме разработки правка JSON подхватывается на лету.
 */
const modules = import.meta.glob<{ default: WorkspaceFile }>(
  "../../../Tools_presets/Workspace/*.json",
  { eager: true },
)

const collection = loadWorkspaces(modules)

/** Готовые раскладки по имени файла. */
export const workspaces = collection.workspaces

/** Подписи раскладок по имени — для выпадающего списка в настройках. */
export const workspaceLabels = collection.workspaceLabels

/** Имена раскладок, найденные в папке. */
export const workspaceNames = collection.workspaceNames

/** Раскладка по имени. Неизвестное имя не должно ронять интерфейс. */
export const getWorkspace = collection.getWorkspace

export type {
  Workspace,
  WorkspaceFile,
  WorkspaceName,
  WorkspacePanel,
  WorkspacePanelId,
  WorkspaceView,
} from "@lard/core"
export { defaultWorkspaceName } from "@lard/core"
