// Правки нот внутри паттерна: добавить, удалить, изменить.
// Работают сразу с группой нот — так перетаскивание выделения остаётся одним шагом.

import { normalizeNote, notesEqual } from "./create";
import { findById, replaceById } from "./listHelpers";
import type { Note, Pattern, Project } from "./types";

/** Какие поля ноты меняются. Номер ноты (id) менять нельзя. */
export type NoteChanges = Partial<Omit<Note, "id">>;

export function addNotes(project: Project, patternId: string, notes: readonly Note[]): Project {
  if (notes.length === 0) return project;
  requireChannels(project, notes);
  return changeNotes(project, patternId, (current) => [...current, ...notes.map(normalizeNote)]);
}

export function removeNotes(project: Project, patternId: string, noteIds: Iterable<string>): Project {
  const toRemove = new Set(noteIds);
  if (toRemove.size === 0) return project;
  return changeNotes(project, patternId, (current) => {
    const kept = current.filter((note) => !toRemove.has(note.id));
    return kept.length === current.length ? current : kept;
  });
}

/** Меняет поля у нескольких нот сразу. Ключ словаря — номер ноты. */
export function updateNotes(
  project: Project,
  patternId: string,
  changes: ReadonlyMap<string, NoteChanges>,
): Project {
  if (changes.size === 0) return project;
  return changeNotes(project, patternId, (current) => {
    let changedAny = false;
    const updated = current.map((note) => {
      const noteChanges = changes.get(note.id);
      if (!noteChanges) return note;
      const next = normalizeNote({ ...note, ...noteChanges, id: note.id });
      if (notesEqual(next, note)) return note;
      changedAny = true;
      return next;
    });
    if (!changedAny) return current;
    requireChannels(project, updated);
    return updated;
  });
}

export function findPattern(project: Project, patternId: string): Pattern | undefined {
  return findById(project.patterns, patternId);
}

/** Применяет изменение к нотам одного паттерна. Тот же список нот — тот же проект. */
function changeNotes(
  project: Project,
  patternId: string,
  change: (notes: readonly Note[]) => readonly Note[],
): Project {
  const patterns = replaceById(project.patterns, patternId, (pattern) => {
    const notes = change(pattern.notes);
    return notes === pattern.notes ? pattern : { ...pattern, notes };
  });
  return patterns === project.patterns ? project : { ...project, patterns };
}

// Нота с несуществующим каналом — ошибка в коде программы или мода, а не
// у пользователя. Лучше сразу остановиться, чем сохранить такой проект.
function requireChannels(project: Project, notes: readonly Note[]): void {
  const channelIds = new Set(project.channels.map((channel) => channel.id));
  const orphan = notes.find((note) => !channelIds.has(note.channelId));
  if (orphan) throw new Error(`Нота ${orphan.id} ссылается на несуществующий канал ${orphan.channelId}`);
}
