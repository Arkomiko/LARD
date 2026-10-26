// Всё, что нужно частям интерфейса: хранилище, действия, оболочка, настройки.
// Передаётся одним объектом, чтобы не тянуть десяток параметров.

import type { Notice, ProjectActions } from "../app/projectActions";
import type { AppInfo, AppSettings, HostApi } from "../host/hostApi";
import type { ProjectStore } from "../state/projectStore";

export interface ViewContext {
  store: ProjectStore;
  actions: ProjectActions;
  host: HostApi;
  appInfo: AppInfo;
  getSettings(): AppSettings;
  /** Сохранить настройки и сразу применить (лимит отмены, интервал автосохранения). */
  applySettings(settings: AppSettings): Promise<void>;
  notify(notice: Notice): void;
}
