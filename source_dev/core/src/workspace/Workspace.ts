/**
 * Формат рабочей области LARD.
 *
 * Рабочая область — это пресет раскладки интерфейса: какие панели видны и
 * какого они размера. Лежит она обычным JSON-файлом в папке `Workspace` в
 * корне репозитория, ровно как темы в `Theme`.
 *
 * Устройство взято из FL Studio (офлайн-мануал, «Main Windows» и меню
 * «View»): там раскладка — это именованный набор окон, каждое из которых
 * показывается или прячется, и отдельно переключаются панели инструментов.
 * Готовые раскладки идут списком — Desktop, Alternate, Tablet, Custom, — и
 * любую можно сохранить как свою. Здесь то же самое, только вместо окон,
 * плавающих по рабочему столу, — области одного окна: LARD рассчитан на
 * работу рядом с Ableton Live, и разлетающиеся окна ему только мешали бы.
 *
 * Файл может задавать только то, что хочется поменять: недостающее берётся из
 * базовой раскладки — как и у тем.
 */

/** Раздел редактора, который открыт при старте. */
export const workspaceViews = ["track", "arrange", "tempo"] as const
export type WorkspaceView = (typeof workspaceViews)[number]

/**
 * Области интерфейса, которыми управляет рабочая область.
 *
 * Соответствие с FL Studio:
 * - `patternList` — список паттернов слева, ближайший аналог Playlist;
 * - `trackList` — стойка инструментов справа, аналог Channel Rack;
 * - `eventList` — список событий, аналог Event editor;
 * - `controlPane` — полоса автоматизации под пианороллом;
 * - `navigation`, `toolbar`, `transport` — панели инструментов, они же
 *   «Toolbars» в меню View.
 */
export const workspacePanelIds = [
  "navigation",
  "toolbar",
  "patternList",
  "trackList",
  "eventList",
  "controlPane",
  "transport",
] as const
export type WorkspacePanelId = (typeof workspacePanelIds)[number]

export interface WorkspacePanel {
  visible: boolean
  /**
   * Размер самой панели: пикселями числом либо долей окна строкой — `"40%"`.
   * У панелей инструментов размера нет, он задан их содержимым.
   */
  size?: number | string
}

export interface Workspace {
  view: WorkspaceView
  panels: Record<WorkspacePanelId, WorkspacePanel>
}

/** Содержимое файла рабочей области: любые её поля плюс подпись. */
export interface WorkspaceFile {
  label?: string
  view?: WorkspaceView
  panels?: Partial<Record<WorkspacePanelId, Partial<WorkspacePanel>>>
}

/**
 * Базовая раскладка — она же значения по умолчанию для всех остальных.
 * Размеры повторяют те, что зашиты в разделители панелей редактора.
 */
export const baseWorkspace: Workspace = {
  view: "track",
  panels: {
    navigation: { visible: true },
    toolbar: { visible: true },
    patternList: { visible: true, size: 170 },
    trackList: { visible: true, size: 240 },
    eventList: { visible: false, size: 240 },
    controlPane: { visible: true, size: "40%" },
    transport: { visible: true },
  },
}

/** Имя рабочей области. Набор зависит от файлов в папке, поэтому строка. */
export type WorkspaceName = string

/** Раскладка, на которую откатываемся, если выбранная не найдена. */
export const defaultWorkspaceName = "lard"
