// Какая нота под курсором и какие ноты попали в рамку или под ластик.

import type { Note } from "../model/types";
import type { Viewport } from "./viewport";

/** Где именно нажали на ноту: на тело (двигать) или у правого края (растягивать). */
export type NoteZone = "body" | "end";

export interface NoteHit {
  note: Note;
  zone: NoteZone;
}

/** Ширина «ручки» растягивания у правого края ноты. */
const EDGE_PIXELS = 6;
/** Совсем узкую ноту (при сильном отдалении) всё равно можно поймать мышью. */
const MIN_CLICKABLE_WIDTH = 4;

/** Нота под точкой. Если ноты перекрываются, берётся верхняя — нарисованная последней. */
export function noteAt(notes: readonly Note[], viewport: Viewport, x: number, y: number): NoteHit | null {
  if (!viewport.isInNoteArea(x, y)) return null;
  const key = viewport.keyAt(y);
  for (let index = notes.length - 1; index >= 0; index--) {
    const note = notes[index];
    if (!note || note.key !== key) continue;
    const left = viewport.xOf(note.start);
    const right = Math.max(viewport.xOf(note.start + note.length), left + MIN_CLICKABLE_WIDTH);
    if (x < left || x > right) continue;
    // У короткой ноты «ручка» меньше, иначе её нельзя было бы взять за тело.
    const edge = Math.min(EDGE_PIXELS, (right - left) / 3);
    return { note, zone: right - x <= edge ? "end" : "body" };
  }
  return null;
}

/** Ноты, задетые прямоугольником (в тиках и высотах; края можно передавать в любом порядке). */
export function notesInBox(
  notes: readonly Note[],
  tickA: number,
  tickB: number,
  keyA: number,
  keyB: number,
): Note[] {
  const [fromTick, toTick] = tickA <= tickB ? [tickA, tickB] : [tickB, tickA];
  const [lowKey, highKey] = keyA <= keyB ? [keyA, keyB] : [keyB, keyA];
  return notes.filter(
    (note) =>
      note.key >= lowKey && note.key <= highKey && note.start < toTick && note.start + note.length > fromTick,
  );
}

/**
 * Ноты, через которые прошёл курсор от точки from до точки to.
 * Путь проверяется с шагом в 2 пикселя: при быстром движении мыши события
 * приходят редко, и без этого ластик перепрыгивал бы через ноты.
 */
export function notesOnPath(
  notes: readonly Note[],
  viewport: Viewport,
  from: { x: number; y: number },
  to: { x: number; y: number },
): Note[] {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(1, Math.ceil(distance / 2));
  const found = new Map<string, Note>();
  for (let step = 0; step <= steps; step++) {
    const x = from.x + ((to.x - from.x) * step) / steps;
    const y = from.y + ((to.y - from.y) * step) / steps;
    const hit = noteAt(notes, viewport, x, y);
    if (hit) found.set(hit.note.id, hit.note);
  }
  return [...found.values()];
}
