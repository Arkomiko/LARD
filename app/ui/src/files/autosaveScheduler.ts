// Автосохранение: раз в N минут копия проекта уходит в резервные копии
// (их хранит движок в %APPDATA%\MiliPlain\autosave\). Копия пишется, только если
// проект изменился с прошлого раза, — иначе одинаковые копии вытеснили бы полезные.

import type { Project } from "../model/types";

export const DEFAULT_AUTOSAVE_MINUTES = 5;

export interface AutosaveTarget {
  /** Текущая версия проекта. */
  currentProject(): Project;
  /** Записать резервную копию. */
  writeBackup(project: Project): Promise<void>;
  /** Сообщить об ошибке записи (программа при этом продолжает работать). */
  reportError(error: unknown): void;
}

export class AutosaveScheduler {
  private timer: ReturnType<typeof setInterval> | null = null;
  /** Версия, которая уже лежит в резервной копии или в файле проекта. */
  private lastBackedUp: Project | null = null;
  private writing = false;

  constructor(private readonly target: AutosaveTarget) {}

  /** Запустить с интервалом в минутах. 0 — автосохранение выключено. */
  start(intervalMinutes: number): void {
    this.stop();
    if (!Number.isFinite(intervalMinutes) || intervalMinutes <= 0) return;
    this.timer = setInterval(() => void this.backupNow(), intervalMinutes * 60_000);
  }

  stop(): void {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
  }

  /** Проект только что открыт или сохранён: эту версию копировать незачем. */
  markBackedUp(project: Project): void {
    this.lastBackedUp = project;
  }

  /** Сделать копию сейчас. Возвращает true, если копия записана. */
  async backupNow(): Promise<boolean> {
    const project = this.target.currentProject();
    // Пока пишется прошлая копия, новую не начинаем: медленный диск
    // не должен копить очередь из одинаковых записей.
    if (project === this.lastBackedUp || this.writing) return false;
    this.writing = true;
    try {
      await this.target.writeBackup(project);
      this.lastBackedUp = project;
      return true;
    } catch (error) {
      this.target.reportError(error);
      return false;
    } finally {
      this.writing = false;
    }
  }
}
