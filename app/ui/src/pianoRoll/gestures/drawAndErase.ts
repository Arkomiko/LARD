// Жесты метода LARD и кисти: поставить ноту и сразу тянуть, стереть
// протяжкой, нарисовать ряд нот.

import { strings } from "../../app/strings";
import { createNote } from "../../model/create";
import { addNotes, removeNotes } from "../../model/noteEdits";
import { snapDown } from "../../model/timeGrid";
import type { Note } from "../../model/types";
import { NO_NOTES } from "../../state/editorSelection";
import { notesOnPath } from "../hitTest";
import { type Gesture, type PointerInput, snapStepFor, type ToolContext } from "../tools/toolTypes";
import { startMoveGesture } from "./moveAndResize";

/**
 * Метод LARD, левая кнопка: нота ставится в клетку сетки под курсором и, пока
 * кнопка зажата, тянется за мышью. Создание и перетаскивание — один шаг истории.
 */
export function startCreateAndMoveGesture(context: ToolContext, pointer: PointerInput): Gesture {
  const { store, viewport } = context;
  const label = strings.step.addNote;
  store.beginGesture(label);
  const start = Math.max(0, snapDown(viewport.tickAt(pointer.x), snapStepFor(pointer, context)));
  const note = newNote(context, viewport.keyAt(pointer.y), start);
  store.edit(label, (project) => addNotes(project, store.selectedPatternId, [note]), { noteIds: NO_NOTES });
  return startMoveGesture(context, note, [note], pointer, label, true);
}

/**
 * Метод LARD, правая кнопка: нажатие удаляет ноту под курсором, а если кнопку
 * держать — стирает все ноты, по которым проходит курсор. Всё стёртое — один шаг.
 */
export function startEraseGesture(context: ToolContext, pointer: PointerInput): Gesture {
  const { store, viewport } = context;
  const label = strings.step.removeNotes;
  store.beginGesture(label);
  const patternId = store.selectedPatternId;
  let previous = { x: pointer.x, y: pointer.y };

  const eraseAlong = (to: { x: number; y: number }) => {
    const hits = notesOnPath(store.editableNotes, viewport, previous, to);
    previous = { x: to.x, y: to.y };
    if (hits.length === 0) return;
    store.edit(label, (project) =>
      removeNotes(
        project,
        patternId,
        hits.map((note) => note.id),
      ),
    );
  };
  eraseAlong(previous);

  return {
    move: eraseAlong,
    end() {
      store.endGesture();
    },
    cancel() {
      store.cancelGesture();
    },
  };
}

/**
 * Кисть (Paint): ряд нот одна за другой, пока ведёшь мышью вправо.
 * Высота каждой ноты — та, над которой сейчас курсор.
 */
export function startPaintGesture(context: ToolContext, pointer: PointerInput): Gesture {
  const { store, viewport } = context;
  const label = strings.step.paintNotes;
  store.beginGesture(label);
  const patternId = store.selectedPatternId;
  const length = store.editorPreferences.newNoteLength;
  let nextStart = Math.max(0, snapDown(viewport.tickAt(pointer.x), snapStepFor(pointer, context)));

  // Ставим ноты, пока курсор дальше начала следующей. При быстром движении
  // мыши так не остаётся пропусков: ряд всегда сплошной.
  const paintUpTo = (current: PointerInput) => {
    const cursorTick = viewport.tickAt(current.x);
    const notes: Note[] = [];
    do {
      notes.push(newNote(context, viewport.keyAt(current.y), nextStart));
      nextStart += length;
    } while (nextStart <= cursorTick);
    store.edit(label, (project) => addNotes(project, patternId, notes));
  };
  paintUpTo(pointer);

  return {
    move(current) {
      if (viewport.tickAt(current.x) >= nextStart) paintUpTo(current);
    },
    end() {
      store.endGesture();
    },
    cancel() {
      store.cancelGesture();
    },
  };
}

/** Новая нота по настройкам редактора: длина, сила нажатия, цвет. */
function newNote(context: ToolContext, key: number, start: number): Note {
  const { store } = context;
  const preferences = store.editorPreferences;
  return createNote({
    channelId: store.selectedChannelId,
    key,
    start,
    length: preferences.newNoteLength,
    velocity: preferences.newNoteVelocity,
    colorGroup: preferences.newNoteColorGroup,
  });
}
