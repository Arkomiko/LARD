import {
  defaultWorkspaceName,
  type Workspace,
  type WorkspaceName,
  type WorkspacePanel,
  type WorkspacePanelId,
  workspacePanelIds,
} from "@lard/core"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import { focusAtom } from "jotai-optics"
import { type SetStateAction, useCallback, useEffect } from "react"
import { useRouter } from "../hooks/useRouter"
import { Features } from "../lard/features"
import { getWorkspace } from "./workspaces"

/**
 * Рабочая область — текущая раскладка интерфейса.
 *
 * Выбранная раскладка запоминается между запусками, как и тема. А вот всё, что
 * пользователь подвинул руками, живёт только до конца сеанса: в FL Studio так
 * же — раскладка применяется целиком, а сохранить изменённую нужно отдельным
 * действием. Здесь это будет делать редактор из `Tools/Workspace`.
 */

// atoms with storage

const workspaceStorageAtom = atomWithStorage<{
  workspaceName: WorkspaceName
}>("WorkspaceStore", {
  workspaceName: defaultWorkspaceName,
})

const workspaceNameAtom = focusAtom(workspaceStorageAtom, (optic) =>
  optic.prop("workspaceName"),
)

/**
 * Живая раскладка. Пока её не трогали, здесь `null`, а не копия пресета:
 * иначе выбор другой раскладки в настройках пришлось бы отдельно
 * переносить сюда, и легко было бы забыть про новое поле.
 */
const layoutAtom = atom<Workspace | null>(null)

const currentWorkspaceAtom = atom((get) => {
  const layout = get(layoutAtom)
  return layout ?? getWorkspace(get(workspaceNameAtom))
})

/** Выбор раскладки: имя запоминаем, а подвинутое руками сбрасываем на пресет. */
const selectWorkspaceAtom = atom(null, (_get, set, name: WorkspaceName) => {
  set(workspaceNameAtom, name)
  set(layoutAtom, null)
})

/** Как менять панель: новыми полями или из предыдущего состояния. */
type PanelUpdate =
  | Partial<WorkspacePanel>
  | ((prev: WorkspacePanel) => Partial<WorkspacePanel>)

const createPanelAtom = (id: WorkspacePanelId) =>
  atom(
    (get) => get(currentWorkspaceAtom).panels[id],
    (get, set, update: PanelUpdate) => {
      const current = get(currentWorkspaceAtom)
      const panel = current.panels[id]
      set(layoutAtom, {
        ...current,
        panels: {
          ...current.panels,
          [id]: {
            ...panel,
            ...(typeof update === "function" ? update(panel) : update),
          },
        },
      })
    },
  )

const panelAtoms = Object.fromEntries(
  workspacePanelIds.map((id) => [id, createPanelAtom(id)]),
) as Record<WorkspacePanelId, ReturnType<typeof createPanelAtom>>

// hooks

export function useWorkspace() {
  return {
    /** Имя выбранной раскладки. */
    get name() {
      return useAtomValue(workspaceNameAtom)
    },
    /** Раскладка целиком — со всеми правками этого сеанса. */
    get workspace() {
      return useAtomValue(currentWorkspaceAtom)
    },
    /** Выбрать раскладку: применяется сразу и целиком. */
    select: useSetAtom(selectWorkspaceAtom),
  }
}

/**
 * Состояние одной панели.
 *
 * `setOpen` принимает и значение, и функцию от предыдущего — как `useState`:
 * кнопки-переключатели в тулбаре пользуются именно функцией.
 */
export function usePanel(id: WorkspacePanelId) {
  const setPanel = useSetAtom(panelAtoms[id])

  return {
    get isOpen() {
      return useAtomValue(panelAtoms[id]).visible
    },
    get size() {
      return useAtomValue(panelAtoms[id]).size
    },
    setOpen: useCallback(
      (value: SetStateAction<boolean>) =>
        setPanel((prev) => ({
          visible: typeof value === "function" ? value(prev.visible) : value,
        })),
      [setPanel],
    ),
    setSize: useCallback(
      (size: number | string) => setPanel({ size }),
      [setPanel],
    ),
  }
}

/**
 * Раздел, с которого начинается работа, тоже часть раскладки.
 *
 * Применяется при запуске и при смене раскладки, но не после каждого клика по
 * вкладкам: пока раскладка та же, выбор пользователя не трогаем.
 */
export function useApplyWorkspaceView() {
  const { workspace } = useWorkspace()
  const { setPath } = useRouter()
  const view = workspace.view

  useEffect(() => {
    // Аранжировка и темп в LARD скрыты — на них незачем уходить, даже если
    // раскладка досталась от полноценной сборки.
    setPath(Features.showDawTabs ? `/${view}` : "/track")
  }, [view, setPath])
}
