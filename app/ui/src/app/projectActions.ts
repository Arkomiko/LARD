// Действия с проектом как с файлом: новый, открыть, сохранить, сохранить как,
// восстановить из резервной копии, закрыть окно.
//
// Здесь нет ни окон, ни кнопок — только порядок шагов. Поэтому всё это
// проверяется тестами с поддельной оболочкой (tests/projectActions.test.ts).

import type { AutosaveScheduler } from "../files/autosaveScheduler";
import { parseProjectText, serializeProject } from "../files/projectFormat";
import type { BackupEntry, HostApi } from "../host/hostApi";
import { createProject } from "../model/create";
import type { Project } from "../model/types";
import type { ProjectStore } from "../state/projectStore";
import { strings } from "./strings";

export interface Notice {
  kind: "info" | "error";
  text: string;
  details?: readonly string[];
}

export interface ProjectActionsContext {
  store: ProjectStore;
  host: HostApi;
  autosave: AutosaveScheduler;
  appVersion: string;
  notify(notice: Notice): void;
}

export class ProjectActions {
  constructor(private readonly context: ProjectActionsContext) {}

  async newProject(): Promise<void> {
    if (!(await this.confirmDiscardChanges())) return;
    const project = createProject({
      project: strings.newProjectName,
      channel: strings.channelName(1),
      pattern: strings.patternName(1),
    });
    this.load(project, null);
  }

  async openProject(): Promise<void> {
    if (!(await this.confirmDiscardChanges())) return;
    await this.guard(strings.openFailed, async () => {
      const file = await this.context.host.showOpenProjectDialog();
      if (file) this.loadText(file.projectText, file.path);
    });
  }

  /**
   * Открыть резервную копию. Она открывается как новый, ещё не сохранённый
   * проект: «Сохранить» спросит, куда, и не затрёт исходный файл молча.
   */
  async openBackup(backup: BackupEntry): Promise<void> {
    if (!(await this.confirmDiscardChanges())) return;
    await this.guard(strings.openFailed, async () => {
      const file = await this.context.host.readProjectFile(backup.path);
      if (this.loadText(file.projectText, null)) {
        this.context.notify({ kind: "info", text: `${backup.projectName}: ${strings.restoredFromBackup}` });
      }
    });
  }

  /** Сохранить в текущий файл; если файла ещё нет — спросить, куда. true — сохранено. */
  async save(): Promise<boolean> {
    const path = this.context.store.filePath;
    if (path === null) return this.saveAs();
    return this.guard(strings.saveFailed, async () => {
      const project = this.context.store.project;
      await this.context.host.writeProjectFile(path, this.serialize(project));
      this.afterSave(path, project);
      return true;
    });
  }

  async saveAs(): Promise<boolean> {
    return this.guard(strings.saveFailed, async () => {
      const project = this.context.store.project;
      const path = await this.context.host.showSaveProjectDialog(project.name, this.serialize(project));
      if (path === null) return false;
      this.afterSave(path, project);
      return true;
    });
  }

  /** Записать резервную копию (вызывает планировщик автосохранения). */
  async writeBackup(project: Project): Promise<void> {
    await this.context.host.writeBackup(project.id, project.name, this.serialize(project));
  }

  /** Окно закрывается, а в проекте есть несохранённое. */
  async handleCloseRequest(): Promise<void> {
    if (await this.confirmDiscardChanges()) await this.context.host.closeWindow();
  }

  /** Спросить про несохранённое. true — можно продолжать (сохранили или выбросили). */
  async confirmDiscardChanges(): Promise<boolean> {
    const { store, host } = this.context;
    if (!store.isDirty) return true;
    const answer = await host.askSaveChanges(store.project.name);
    if (answer === "cancel") return false;
    if (answer === "discard") return true;
    return this.save();
  }

  private loadText(projectText: string, path: string | null): boolean {
    const result = parseProjectText(projectText);
    if (!result.ok) {
      this.context.notify({ kind: "error", text: strings.openFailed, details: result.errors });
      return false;
    }
    this.load(result.project, path);
    if (path !== null) this.context.notify({ kind: "info", text: strings.opened(path) });
    if (result.upgradedFromVersion !== null) {
      this.context.notify({ kind: "info", text: strings.upgraded(result.upgradedFromVersion) });
    }
    return true;
  }

  private load(project: Project, path: string | null): void {
    this.context.store.loadProject(project, path);
    this.context.autosave.markBackedUp(project);
  }

  private afterSave(path: string, project: Project): void {
    this.context.store.markSaved(path, project);
    this.context.autosave.markBackedUp(project);
    this.context.notify({ kind: "info", text: strings.saved(path) });
  }

  private serialize(project: Project): string {
    return serializeProject(project, this.context.appVersion);
  }

  // Ошибка оболочки (диск переполнен, файл занят другой программой) не должна
  // ронять интерфейс: показываем её и продолжаем работу.
  private async guard<T>(title: string, action: () => Promise<T>): Promise<T | false> {
    try {
      return await action();
    } catch (error) {
      this.context.notify({ kind: "error", text: title, details: [errorText(error)] });
      return false;
    }
  }
}

export function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
