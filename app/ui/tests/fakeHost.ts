// Поддельная оболочка для тестов: «диск» — это словарь путь → текст,
// а ответы диалогов задаются заранее.

import type { AppSettings, BackupEntry, HostApi, ProjectFile, SaveChangesAnswer } from "../src/host/hostApi";

export class FakeHost implements HostApi {
  readonly files = new Map<string, string>();
  readonly backups: (BackupEntry & { projectText: string })[] = [];
  /** Что «выберет» пользователь в окне «Открыть» (null — нажмёт «Отмена»). */
  nextOpenPath: string | null = null;
  /** Что «выберет» пользователь в окне «Сохранить как». */
  nextSavePath: string | null = null;
  saveChangesAnswer: SaveChangesAnswer = "cancel";
  /** Сделать следующую запись на «диск» неудачной. */
  failNextWrite: string | null = null;
  readonly calls: string[] = [];
  windowState = { title: "", hasUnsavedChanges: false };
  closed = false;
  private closeHandler: (() => void) | null = null;
  settings: AppSettings = { undoLimit: 100, autosaveIntervalMinutes: 5, autosaveKeepCount: 5 };

  async getAppInfo() {
    return { version: "0.0.10a", dataFolder: "C:/fake" };
  }

  async loadSettings() {
    return this.settings;
  }

  async saveSettings(settings: AppSettings) {
    this.settings = settings;
    return settings;
  }

  async showOpenProjectDialog(): Promise<ProjectFile | null> {
    this.calls.push("showOpenProjectDialog");
    if (this.nextOpenPath === null) return null;
    return this.readProjectFile(this.nextOpenPath);
  }

  async readProjectFile(path: string): Promise<ProjectFile> {
    const projectText = this.files.get(path);
    if (projectText === undefined) throw new Error(`Файл не найден: ${path}`);
    return { path, projectText };
  }

  async writeProjectFile(path: string, projectText: string): Promise<void> {
    this.calls.push(`write ${path}`);
    if (this.failNextWrite) {
      const message = this.failNextWrite;
      this.failNextWrite = null;
      throw new Error(message);
    }
    this.files.set(path, projectText);
  }

  async showSaveProjectDialog(_suggestedName: string, projectText: string): Promise<string | null> {
    this.calls.push("showSaveProjectDialog");
    if (this.nextSavePath === null) return null;
    await this.writeProjectFile(this.nextSavePath, projectText);
    return this.nextSavePath;
  }

  async writeBackup(projectId: string, projectName: string, projectText: string): Promise<void> {
    const path = `backup/${projectId}/${this.backups.length}.mpj`;
    this.files.set(path, projectText);
    this.backups.push({ path, projectId, projectName, savedAt: new Date(0).toISOString(), projectText });
  }

  async listBackups(): Promise<BackupEntry[]> {
    return this.backups;
  }

  async setWindowState(title: string, hasUnsavedChanges: boolean): Promise<void> {
    this.windowState = { title, hasUnsavedChanges };
  }

  async askSaveChanges(): Promise<SaveChangesAnswer> {
    this.calls.push("askSaveChanges");
    return this.saveChangesAnswer;
  }

  async closeWindow(): Promise<void> {
    this.closed = true;
  }

  onCloseRequested(handler: () => void): void {
    this.closeHandler = handler;
  }

  /** Имитировать нажатие крестика окна. */
  requestClose(): void {
    this.closeHandler?.();
  }
}
