// Что выбрано в редакторе: открытый паттерн, канал и выделенные ноты.
//
// Пианоролл, как в FL Studio, показывает и правит ноты одного канала —
// выбранного. Ноты других каналов того же паттерна станут ghost-нотами
// на этапе 6. Поэтому выделить можно только ноты выбранного канала
// в открытом паттерне.

import { findById } from "../model/listHelpers";
import type { Note, Pattern, Project } from "../model/types";

export interface EditorSelection {
  readonly patternId: string;
  readonly channelId: string;
  readonly noteIds: ReadonlySet<string>;
}

/** Пустое выделение. Один общий объект: «ничего не выделено» не плодит новых множеств. */
export const NO_NOTES: ReadonlySet<string> = new Set<string>();

// Ноты канала из списка нот паттерна. Список нот неизменяемый, поэтому
// результат можно запомнить: пока список тот же, ответ тот же. Без этого
// пианоролл перебирал бы 5000 нот на каждое движение мыши.
const notesByChannelCache = new WeakMap<readonly Note[], Map<string, readonly Note[]>>();

/** Ноты канала в паттерне — то, что видно и правится в пианоролле. */
export function channelNotes(pattern: Pattern, channelId: string): readonly Note[] {
  let byChannel = notesByChannelCache.get(pattern.notes);
  if (!byChannel) {
    byChannel = new Map();
    notesByChannelCache.set(pattern.notes, byChannel);
  }
  let notes = byChannel.get(channelId);
  if (!notes) {
    notes = pattern.notes.filter((note) => note.channelId === channelId);
    byChannel.set(channelId, notes);
  }
  return notes;
}

/**
 * Выбор, который существует в проекте. Если выбранный паттерн или канал исчез
 * (удалили или отменили его создание), выбирается первый. Из выделения нот
 * убираются ноты, которых больше нет в открытом паттерне у выбранного канала.
 */
export function validSelection(project: Project, selection: EditorSelection): EditorSelection {
  const pattern =
    findById(project.patterns, selection.patternId) ?? requireItem(project.patterns[0], "паттерна");
  const channel =
    findById(project.channels, selection.channelId) ?? requireItem(project.channels[0], "канала");
  const noteIds = keepExistingNotes(selection.noteIds, channelNotes(pattern, channel.id));
  const unchanged =
    pattern.id === selection.patternId && channel.id === selection.channelId && noteIds === selection.noteIds;
  return unchanged ? selection : { patternId: pattern.id, channelId: channel.id, noteIds };
}

function keepExistingNotes(noteIds: ReadonlySet<string>, notes: readonly Note[]): ReadonlySet<string> {
  if (noteIds.size === 0) return noteIds;
  const existing = new Set(notes.map((note) => note.id));
  const kept = [...noteIds].filter((id) => existing.has(id));
  if (kept.length === noteIds.size) return noteIds;
  return kept.length === 0 ? NO_NOTES : new Set(kept);
}

export function requireItem<T>(item: T | undefined, what: string): T {
  if (item === undefined) throw new Error(`В проекте нет ни одного ${what}`);
  return item;
}
