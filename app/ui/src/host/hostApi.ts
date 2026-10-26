// Всё, что интерфейс может попросить у оболочки, — одним списком с типами.
// Код интерфейса работает только через HostApi, поэтому в тестах оболочку
// легко подменить поддельной (tests/fakeHost.ts).

import { ShellBridge, type WebViewChannel } from "./shellBridge";

export interface AppInfo {
  version: string;
  /** Папка данных программы: %APPDATA%\MiliPlain. */
  dataFolder: string;
}

/** Настройки программы. Хранит и проверяет их движок. */
export interface AppSettings {
  undoLimit: number;
  /** 0 — автосохранение выключено. */
  autosaveIntervalMinutes: number;
  /** Сколько последних резервных копий хранить для каждого проекта. */
  autosaveKeepCount: number;
}

export interface ProjectFile {
  path: string;
  /** Текст project.json из архива .mpj. */
  projectText: string;
}

export interface BackupEntry {
  path: string;
  projectId: string;
  projectName: string;
  /** Время записи в формате ISO 8601. */
  savedAt: string;
}

export type SaveChangesAnswer = "save" | "discard" | "cancel";

export interface HostApi {
  getAppInfo(): Promise<AppInfo>;
  loadSettings(): Promise<AppSettings>;
  /** Возвращает настройки после проверки движком (лишнее обрезано до границ). */
  saveSettings(settings: AppSettings): Promise<AppSettings>;
  /** Окно «Открыть». null — пользователь передумал. */
  showOpenProjectDialog(): Promise<ProjectFile | null>;
  readProjectFile(path: string): Promise<ProjectFile>;
  writeProjectFile(path: string, projectText: string): Promise<void>;
  /** Окно «Сохранить как» и запись. Возвращает выбранный путь или null. */
  showSaveProjectDialog(suggestedName: string, projectText: string): Promise<string | null>;
  writeBackup(projectId: string, projectName: string, projectText: string): Promise<void>;
  listBackups(): Promise<BackupEntry[]>;
  /** Заголовок окна и отметка «есть несохранённое» (нужна оболочке при закрытии). */
  setWindowState(title: string, hasUnsavedChanges: boolean): Promise<void>;
  /** Системный вопрос «Сохранить изменения в …?». */
  askSaveChanges(projectName: string): Promise<SaveChangesAnswer>;
  closeWindow(): Promise<void>;
  /** Пользователь закрывает окно, а в проекте есть несохранённое. */
  onCloseRequested(handler: () => void): void;
}

/** HostApi поверх настоящей оболочки. Имена методов совпадают с HostMethods.cs. */
export function createShellHostApi(channel: WebViewChannel): HostApi {
  const bridge = new ShellBridge(channel);
  return {
    getAppInfo: () => bridge.request("app.getInfo"),
    loadSettings: () => bridge.request("settings.load"),
    saveSettings: (settings) => bridge.request("settings.save", { settings }),
    showOpenProjectDialog: () => bridge.request("project.showOpenDialog"),
    readProjectFile: (path) => bridge.request("project.read", { path }),
    writeProjectFile: (path, projectText) => bridge.request("project.write", { path, projectText }),
    showSaveProjectDialog: (suggestedName, projectText) =>
      bridge.request("project.showSaveDialog", { suggestedName, projectText }),
    writeBackup: (projectId, projectName, projectText) =>
      bridge.request("backup.write", { projectId, projectName, projectText }),
    listBackups: () => bridge.request("backup.list"),
    setWindowState: (title, hasUnsavedChanges) =>
      bridge.request("window.setState", { title, hasUnsavedChanges }),
    askSaveChanges: (projectName) => bridge.request("dialog.askSaveChanges", { projectName }),
    closeWindow: () => bridge.request("window.close"),
    onCloseRequested: (handler) => bridge.on("closeRequested", handler),
  };
}

/**
 * Заглушка для запуска интерфейса в обычном браузере (npm run dev без оболочки):
 * всё, кроме работы с файлами, работает; файловые команды честно отказывают.
 */
export function createOfflineHostApi(): HostApi {
  const unavailable = () =>
    Promise.reject(new Error("Интерфейс открыт без оболочки MiliPlain: файлы недоступны."));
  let settings: AppSettings = { undoLimit: 100, autosaveIntervalMinutes: 0, autosaveKeepCount: 5 };
  return {
    getAppInfo: async () => ({ version: "dev", dataFolder: "—" }),
    loadSettings: async () => settings,
    saveSettings: async (next) => {
      settings = next;
      return settings;
    },
    showOpenProjectDialog: unavailable,
    readProjectFile: unavailable,
    writeProjectFile: unavailable,
    showSaveProjectDialog: unavailable,
    writeBackup: unavailable,
    listBackups: async () => [],
    setWindowState: async (title) => {
      document.title = title;
    },
    askSaveChanges: async () =>
      window.confirm("Есть несохранённые изменения. Выбросить их?") ? "discard" : "cancel",
    closeWindow: async () => window.close(),
    onCloseRequested: () => {},
  };
}
