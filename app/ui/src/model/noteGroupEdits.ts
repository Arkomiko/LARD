// Правки группы нот как целого: сдвиг, растяжение, квантизация.
//
// Сдвиг и растяжение считаются от исходных нот (originals), а не от текущих:
// при перетаскивании мышью каждое движение заново применяет полное смещение
// к исходному положению. Так ноты не «уплывают» от накопления округлений.

import { type NoteChanges, updateNotes } from "./noteEdits";
import { snapNearest } from "./timeGrid";
import { KEY_COUNT, type Note, type Project } from "./types";

/**
 * Сдвинуть ноты во времени и по высоте. Группа сдвигается целиком: если
 * какая-то нота упёрлась в начало паттерна или в край клавиатуры, вся группа
 * останавливается — аккорд не «сплющивается».
 */
export function shiftNotes(
  project: Project,
  patternId: string,
  originals: readonly Note[],
  deltaTicks: number,
  deltaKeys: number,
): Project {
  if (originals.length === 0) return project;
  const earliestStart = Math.min(...originals.map((note) => note.start));
  const lowestKey = Math.min(...originals.map((note) => note.key));
  const highestKey = Math.max(...originals.map((note) => note.key));
  const ticks = Math.max(Math.round(deltaTicks), -earliestStart);
  const keys = Math.min(Math.max(Math.round(deltaKeys), -lowestKey), KEY_COUNT - 1 - highestKey);
  return updateNotes(
    project,
    patternId,
    new Map(originals.map((note) => [note.id, { start: note.start + ticks, key: note.key + keys }])),
  );
}

/** Изменить длину всех нот группы на одно и то же число тиков, но не короче minimumLength. */
export function resizeNotes(
  project: Project,
  patternId: string,
  originals: readonly Note[],
  deltaLength: number,
  minimumLength: number,
): Project {
  const minimum = Math.max(1, Math.round(minimumLength));
  return updateNotes(
    project,
    patternId,
    new Map(
      originals.map((note) => [
        note.id,
        { length: Math.max(minimum, note.length + Math.round(deltaLength)) },
      ]),
    ),
  );
}

/**
 * Квантизация: начало каждой ноты прижимается к ближайшей линии сетки,
 * длительность не меняется (как «быстрая квантизация» в FL Studio).
 */
export function quantizeNotes(
  project: Project,
  patternId: string,
  notes: readonly Note[],
  step: number,
): Project {
  if (step <= 0) return project;
  const changes = new Map<string, NoteChanges>();
  for (const note of notes) {
    const start = snapNearest(note.start, step);
    if (start !== note.start) changes.set(note.id, { start });
  }
  return updateNotes(project, patternId, changes);
}
