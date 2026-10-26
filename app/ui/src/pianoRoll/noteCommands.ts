// Команды над выделенными нотами: удалить, выделить всё, копировать,
// вырезать, вставить, дублировать, транспонировать, сдвинуть, квантизовать.
// Их вызывают горячие клавиши и кнопки; мышь сюда не заходит.

import { strings } from "../app/strings";
import { createNote } from "../model/create";
import { addNotes, removeNotes } from "../model/noteEdits";
import { quantizeNotes, shiftNotes } from "../model/noteGroupEdits";
import { snapStep, snapUp, ticksPerBeat } from "../model/timeGrid";
import type { Note } from "../model/types";
import type { ProjectStore } from "../state/projectStore";

/**
 * Буфер обмена нот внутри программы. Хранит копии нот без номеров:
 * при вставке каждая получает новый номер.
 */
export class NoteClipboard {
  private copied: readonly Note[] = [];

  get isEmpty(): boolean {
    return this.copied.length === 0;
  }

  put(notes: readonly Note[]): void {
    this.copied = notes;
  }

  get notes(): readonly Note[] {
    return this.copied;
  }
}

/** Выделенные ноты в том порядке, в каком они лежат в паттерне. */
export function selectedNotes(store: ProjectStore): Note[] {
  const ids = store.selectedNoteIds;
  return ids.size === 0 ? [] : store.editableNotes.filter((note) => ids.has(note.id));
}

export function deleteSelectedNotes(store: ProjectStore): void {
  if (store.selectedNoteIds.size === 0) return;
  store.edit(strings.step.removeNotes, (project) =>
    removeNotes(project, store.selectedPatternId, store.selectedNoteIds),
  );
}

export function selectAllNotes(store: ProjectStore): void {
  store.selectNotes(store.editableNotes.map((note) => note.id));
}

export function clearNoteSelection(store: ProjectStore): void {
  store.selectNotes([]);
}

export function copySelectedNotes(store: ProjectStore, clipboard: NoteClipboard): void {
  const notes = selectedNotes(store);
  if (notes.length > 0) clipboard.put(notes);
}

export function cutSelectedNotes(store: ProjectStore, clipboard: NoteClipboard): void {
  const notes = selectedNotes(store);
  if (notes.length === 0) return;
  clipboard.put(notes);
  store.edit(strings.step.cutNotes, (project) =>
    removeNotes(
      project,
      store.selectedPatternId,
      notes.map((note) => note.id),
    ),
  );
}

/**
 * Вставка на те же места по времени, откуда скопировано (как в FL Studio),
 * в выбранный канал. Вставленные ноты выделяются — их сразу можно перетащить.
 */
export function pasteNotes(store: ProjectStore, clipboard: NoteClipboard): void {
  if (clipboard.isEmpty) return;
  addCopies(store, clipboard.notes, 0, strings.step.pasteNotes);
}

/** Копия выделения сразу справа от него. Сдвиг округляется вверх до шага сетки. */
export function duplicateSelectedNotes(store: ProjectStore): void {
  const notes = selectedNotes(store);
  if (notes.length === 0) return;
  const start = Math.min(...notes.map((note) => note.start));
  const end = Math.max(...notes.map((note) => note.start + note.length));
  const step = snapStep(store.project, store.editorPreferences.snapId);
  addCopies(store, notes, snapUp(end - start, step), strings.step.duplicateNotes);
}

/** Транспонировать выделение на semitones полутонов (12 — октава). */
export function transposeSelectedNotes(store: ProjectStore, semitones: number): void {
  const notes = selectedNotes(store);
  if (notes.length === 0) return;
  store.edit(strings.step.transposeNotes, (project) =>
    shiftNotes(project, store.selectedPatternId, notes, 0, semitones),
  );
}

/** Сдвинуть выделение на один шаг сетки влево (-1) или вправо (+1). */
export function nudgeSelectedNotes(store: ProjectStore, direction: -1 | 1): void {
  const notes = selectedNotes(store);
  if (notes.length === 0) return;
  const step = snapStep(store.project, store.editorPreferences.snapId) ?? ticksPerBeat(store.project) / 4;
  store.edit(strings.step.nudgeNotes, (project) =>
    shiftNotes(project, store.selectedPatternId, notes, direction * step, 0),
  );
}

/** Квантизовать выделение, а если ничего не выделено — все ноты канала. Без привязки — нечего делать. */
export function quantizeSelectedNotes(store: ProjectStore): void {
  const step = snapStep(store.project, store.editorPreferences.snapId);
  if (step === null) return;
  const selected = selectedNotes(store);
  const notes = selected.length > 0 ? selected : store.editableNotes;
  store.edit(strings.step.quantizeNotes, (project) =>
    quantizeNotes(project, store.selectedPatternId, notes, step),
  );
}

function addCopies(store: ProjectStore, notes: readonly Note[], offset: number, label: string): void {
  const copies = notes.map((note) =>
    createNote({ ...note, channelId: store.selectedChannelId, start: note.start + offset }),
  );
  store.edit(label, (project) => addNotes(project, store.selectedPatternId, copies), {
    noteIds: new Set(copies.map((note) => note.id)),
  });
}
