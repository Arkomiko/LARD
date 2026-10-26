// История отмены: стопка прошлых версий и стопка «отменённых» для повтора.
//
// Хранятся целые версии проекта, а не описания действий «как откатить».
// Это возможно потому, что модель неизменяемая: соседние версии делят между
// собой всё, что не менялось, и копия обходится дёшево. А ошибиться в откате
// невозможно — версия просто возвращается как была.

export const DEFAULT_UNDO_LIMIT = 100;
export const MAX_UNDO_LIMIT = 10_000;

export interface HistoryStep<T> {
  /** Что за действие, например «Добавить ноту». Показывается в меню «Отменить: …». */
  readonly label: string;
  readonly state: T;
}

export class UndoHistory<T> {
  private undoSteps: HistoryStep<T>[] = [];
  private redoSteps: HistoryStep<T>[] = [];
  private limit: number;

  constructor(limit: number = DEFAULT_UNDO_LIMIT) {
    this.limit = normalizeLimit(limit);
  }

  /** Запомнить версию ДО правки. Новая правка стирает возможность «повторить». */
  record(label: string, stateBefore: T): void {
    this.undoSteps.push({ label, state: stateBefore });
    this.redoSteps = [];
    this.trimToLimit();
  }

  /** Вернуть прошлую версию; текущая уходит в стопку для «повторить». */
  undo(current: T): HistoryStep<T> | undefined {
    const step = this.undoSteps.pop();
    if (step) this.redoSteps.push({ label: step.label, state: current });
    return step;
  }

  /** Вернуть отменённую версию; текущая снова уходит в стопку для «отменить». */
  redo(current: T): HistoryStep<T> | undefined {
    const step = this.redoSteps.pop();
    if (step) this.undoSteps.push({ label: step.label, state: current });
    return step;
  }

  clear(): void {
    this.undoSteps = [];
    this.redoSteps = [];
  }

  /** Сколько шагов помнить (настройка пользователя). Лишние старые шаги забываются. */
  setLimit(limit: number): void {
    this.limit = normalizeLimit(limit);
    this.trimToLimit();
  }

  get canUndo(): boolean {
    return this.undoSteps.length > 0;
  }

  get canRedo(): boolean {
    return this.redoSteps.length > 0;
  }

  get undoCount(): number {
    return this.undoSteps.length;
  }

  get nextUndoLabel(): string | undefined {
    return this.undoSteps.at(-1)?.label;
  }

  get nextRedoLabel(): string | undefined {
    return this.redoSteps.at(-1)?.label;
  }

  private trimToLimit(): void {
    const extra = this.undoSteps.length - this.limit;
    if (extra > 0) this.undoSteps.splice(0, extra);
  }
}

function normalizeLimit(limit: number): number {
  if (!Number.isFinite(limit)) return DEFAULT_UNDO_LIMIT;
  return Math.min(MAX_UNDO_LIMIT, Math.max(1, Math.round(limit)));
}
