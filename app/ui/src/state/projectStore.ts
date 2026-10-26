// Хранилище состояния — единственное место, где живёт открытый проект.
//
// Интерфейс не меняет проект напрямую: он вызывает store.edit("Название шага",
// правка). Хранилище применяет правку, пишет шаг в историю и один раз сообщает
// подписчикам, что состояние изменилось. Одно сообщение на одно действие —
// урок LARD: иначе интерфейс успевает показать промежуточное состояние (мигание).
//
// Кроме проекта здесь хранятся выбор (паттерн, канал, выделенные ноты) и
// настройки редактора (инструмент, привязка). Это не правки проекта,
// поэтому в историю отмены они не попадают.

import { findById } from "../model/listHelpers";
import type { Channel, Note, Pattern, Project } from "../model/types";
import { DEFAULT_EDITOR_PREFERENCES, type EditorPreferences } from "./editorPreferences";
import { channelNotes, type EditorSelection, NO_NOTES, requireItem, validSelection } from "./editorSelection";
import { DEFAULT_UNDO_LIMIT, UndoHistory } from "./undoHistory";

export type ProjectChange = (project: Project) => Project;
type Listener = () => void;

export class ProjectStore {
  private currentProject: Project;
  /** Версия, совпадающая с файлом на диске. Отличается от текущей — есть несохранённое. */
  private savedProject: Project;
  private currentFilePath: string | null;
  private selection: EditorSelection;
  private preferences: EditorPreferences = DEFAULT_EDITOR_PREFERENCES;
  /** Идёт ли жест (например, перетаскивание ноты): много правок — один шаг истории. */
  private gesture: { label: string; projectBefore: Project } | null = null;
  private readonly history: UndoHistory<Project>;
  private readonly listeners = new Set<Listener>();

  constructor(project: Project, options: { filePath?: string | null; undoLimit?: number } = {}) {
    this.currentProject = project;
    this.savedProject = project;
    this.currentFilePath = options.filePath ?? null;
    this.selection = validSelection(project, { patternId: "", channelId: "", noteIds: NO_NOTES });
    this.history = new UndoHistory<Project>(options.undoLimit ?? DEFAULT_UNDO_LIMIT);
  }

  get project(): Project {
    return this.currentProject;
  }

  /** Путь к файлу проекта или null, если проект ещё ни разу не сохранялся. */
  get filePath(): string | null {
    return this.currentFilePath;
  }

  /** Паттерн, открытый в пианоролле. */
  get selectedPatternId(): string {
    return this.selection.patternId;
  }

  get selectedPattern(): Pattern {
    return requireItem(findById(this.currentProject.patterns, this.selection.patternId), "паттерна");
  }

  /** Канал, ноты которого видны и правятся в пианоролле (как выбранный канал в FL Studio). */
  get selectedChannelId(): string {
    return this.selection.channelId;
  }

  get selectedChannel(): Channel {
    return requireItem(findById(this.currentProject.channels, this.selection.channelId), "канала");
  }

  /** Ноты выбранного канала в открытом паттерне — всё, что видит пианоролл. */
  get editableNotes(): readonly Note[] {
    return channelNotes(this.selectedPattern, this.selection.channelId);
  }

  get selectedNoteIds(): ReadonlySet<string> {
    return this.selection.noteIds;
  }

  get editorPreferences(): EditorPreferences {
    return this.preferences;
  }

  /** Есть ли изменения, которых нет в файле. Неизменяемость позволяет сравнить ссылки. */
  get isDirty(): boolean {
    return this.currentProject !== this.savedProject;
  }

  /** Идёт ли сейчас жест (перетаскивание, рисование кистью…). */
  get isInGesture(): boolean {
    return this.gesture !== null;
  }

  get canUndo(): boolean {
    return this.gesture === null && this.history.canUndo;
  }

  get canRedo(): boolean {
    return this.gesture === null && this.history.canRedo;
  }

  get nextUndoLabel(): string | undefined {
    return this.history.nextUndoLabel;
  }

  get nextRedoLabel(): string | undefined {
    return this.history.nextRedoLabel;
  }

  /**
   * Применить правку. label — название шага для меню «Отменить».
   * Правка, которая ничего не меняет, в историю не попадает.
   * selectAfter — что выбрать вместе с правкой (например, только что созданный
   * паттерн или вставленные ноты): правка и выбор применяются одной
   * транзакцией, без мигания.
   */
  edit(label: string, change: ProjectChange, selectAfter: Partial<EditorSelection> = {}): void {
    const before = this.currentProject;
    const after = change(before);
    if (after === before) return;
    if (this.gesture === null) this.history.record(label, before);
    this.setState(after, { ...this.selection, ...selectAfter });
  }

  /** Начать жест: все правки до endGesture станут одним шагом истории. */
  beginGesture(label: string): void {
    if (this.gesture !== null) this.endGesture();
    this.gesture = { label, projectBefore: this.currentProject };
  }

  endGesture(): void {
    const gesture = this.gesture;
    if (gesture === null) return;
    this.gesture = null;
    if (this.currentProject !== gesture.projectBefore)
      this.history.record(gesture.label, gesture.projectBefore);
    this.notify();
  }

  /** Отменить жест целиком (например, нажали Esc во время перетаскивания). */
  cancelGesture(): void {
    const gesture = this.gesture;
    if (gesture === null) return;
    this.gesture = null;
    this.setState(gesture.projectBefore, this.selection);
  }

  undo(): void {
    if (!this.canUndo) return;
    const step = this.history.undo(this.currentProject);
    if (step) this.setState(step.state, this.selection);
  }

  redo(): void {
    if (!this.canRedo) return;
    const step = this.history.redo(this.currentProject);
    if (step) this.setState(step.state, this.selection);
  }

  /** Открыть другой паттерн. Выделение нот при этом снимается. */
  selectPattern(patternId: string): void {
    if (patternId === this.selection.patternId || !findById(this.currentProject.patterns, patternId)) return;
    this.setState(this.currentProject, { ...this.selection, patternId, noteIds: NO_NOTES });
  }

  /** Выбрать канал. Выделение нот при этом снимается. */
  selectChannel(channelId: string): void {
    if (channelId === this.selection.channelId || !findById(this.currentProject.channels, channelId)) return;
    this.setState(this.currentProject, { ...this.selection, channelId, noteIds: NO_NOTES });
  }

  /** Выделить ноты (заменяет прежнее выделение). Пустой список снимает выделение. */
  selectNotes(noteIds: Iterable<string>): void {
    const ids = new Set(noteIds);
    if (ids.size === 0 && this.selection.noteIds.size === 0) return;
    this.setState(this.currentProject, { ...this.selection, noteIds: ids.size === 0 ? NO_NOTES : ids });
  }

  setEditorPreferences(changes: Partial<EditorPreferences>): void {
    const next = { ...this.preferences, ...changes };
    const changed = (Object.keys(changes) as (keyof EditorPreferences)[]).some(
      (key) => next[key] !== this.preferences[key],
    );
    if (!changed) return;
    this.preferences = next;
    this.notify();
  }

  /** Новый или открытый проект: история очищается, проект считается сохранённым. */
  loadProject(project: Project, filePath: string | null): void {
    this.gesture = null;
    this.history.clear();
    this.savedProject = project;
    this.currentFilePath = filePath;
    this.setState(project, { patternId: "", channelId: "", noteIds: NO_NOTES });
  }

  /**
   * Проект записан в файл. savedVersion — именно та версия, которая записана:
   * если пока шла запись проект успел измениться, он останется «несохранённым».
   */
  markSaved(filePath: string, savedVersion: Project = this.currentProject): void {
    this.savedProject = savedVersion;
    this.currentFilePath = filePath;
    this.notify();
  }

  setUndoLimit(limit: number): void {
    this.history.setLimit(limit);
    this.notify();
  }

  /** Подписаться на изменения. Возвращает функцию, которая отписывает. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Одна точка смены состояния: проект и выбор меняются вместе, подписчики
  // узнают об этом один раз.
  private setState(project: Project, selection: EditorSelection): void {
    this.currentProject = project;
    this.selection = validSelection(project, selection);
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}
