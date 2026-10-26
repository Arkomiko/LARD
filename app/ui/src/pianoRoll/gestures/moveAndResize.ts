// Жесты над существующими нотами: перетащить и растянуть за правый край.
// Работают с группой нот: если нажата выделенная нота, вся выделенная
// группа едет и тянется вместе с ней.

import { strings } from "../../app/strings";
import { resizeNotes, shiftNotes } from "../../model/noteGroupEdits";
import { snapNearest } from "../../model/timeGrid";
import type { Note } from "../../model/types";
import type { NoteHit } from "../hitTest";
import { selectedNotes } from "../noteCommands";
import { type Gesture, type PointerInput, snapStepFor, type ToolContext } from "../tools/toolTypes";

/**
 * Нажатие на ноту: у правого края — растянуть, по телу — перетащить.
 * selectPressedNote: инструмент Select делает нажатую ноту выделенной,
 * инструмент Draw — просто снимает чужое выделение (как в FL Studio).
 */
export function pressOnNote(
  hit: NoteHit,
  pointer: PointerInput,
  context: ToolContext,
  selectPressedNote: boolean,
): Gesture {
  const { store } = context;
  const inSelection = store.selectedNoteIds.has(hit.note.id);
  if (!inSelection) store.selectNotes(selectPressedNote ? [hit.note.id] : []);
  const group = inSelection ? selectedNotes(store) : [hit.note];
  return hit.zone === "end"
    ? startResizeGesture(context, hit.note, group, pointer)
    : startMoveGesture(context, hit.note, group, pointer, strings.step.moveNotes);
}

/**
 * Перетаскивание группы нот. anchor — нота, за которую взялись: к сетке
 * прижимается именно её начало, остальные сохраняют расстояние до неё.
 * gestureAlreadyStarted — жест уже начат (нота только что создана, и
 * «создать и сдвинуть» должно остаться одним шагом истории).
 */
export function startMoveGesture(
  context: ToolContext,
  anchor: Note,
  notes: readonly Note[],
  pointer: PointerInput,
  label: string,
  gestureAlreadyStarted = false,
): Gesture {
  const { store, viewport } = context;
  if (!gestureAlreadyStarted) store.beginGesture(label);
  const patternId = store.selectedPatternId;
  const originTick = viewport.tickAt(pointer.x);
  const originKey = viewport.keyAt(pointer.y);

  return {
    move(current) {
      const rawTicks = viewport.tickAt(current.x) - originTick;
      const deltaTicks = snapNearest(anchor.start + rawTicks, snapStepFor(current, context)) - anchor.start;
      const deltaKeys = viewport.keyAt(current.y) - originKey;
      store.edit(label, (project) => shiftNotes(project, patternId, notes, deltaTicks, deltaKeys));
    },
    end() {
      store.endGesture();
      // Как в FL Studio: следующая новая нота будет той же длины, что тронутая.
      store.setEditorPreferences({ newNoteLength: anchor.length });
    },
    cancel() {
      store.cancelGesture();
    },
  };
}

/** Растягивание группы нот за правый край. Конец ноты-якоря прижимается к сетке. */
export function startResizeGesture(
  context: ToolContext,
  anchor: Note,
  notes: readonly Note[],
  pointer: PointerInput,
): Gesture {
  const { store, viewport } = context;
  const label = strings.step.resizeNotes;
  store.beginGesture(label);
  const patternId = store.selectedPatternId;
  const originTick = viewport.tickAt(pointer.x);
  let anchorLength = anchor.length;

  return {
    move(current) {
      const step = snapStepFor(current, context);
      const minimumLength = step ?? 1;
      const rawEnd = anchor.start + anchor.length + (viewport.tickAt(current.x) - originTick);
      anchorLength = Math.max(minimumLength, snapNearest(rawEnd, step) - anchor.start);
      store.edit(label, (project) =>
        resizeNotes(project, patternId, notes, anchorLength - anchor.length, minimumLength),
      );
    },
    end() {
      store.endGesture();
      store.setEditorPreferences({ newNoteLength: anchorLength });
    },
    cancel() {
      store.cancelGesture();
    },
  };
}
