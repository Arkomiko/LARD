// Выделение рамкой: тянешь мышью — выделяются ноты, которых касается рамка.
// В историю не пишется: выделение — не правка проекта.

import { notesInBox } from "../hitTest";
import type { Gesture, PointerInput, SelectionBox, ToolContext } from "../tools/toolTypes";

/** additive — добавить к уже выделенному, а не заменить (Shift или Ctrl в инструменте Select). */
export function startBoxSelectGesture(
  context: ToolContext,
  pointer: PointerInput,
  additive: boolean,
): Gesture {
  const { store, viewport } = context;
  const selectionBefore = store.selectedNoteIds;
  const kept = additive ? [...selectionBefore] : [];
  const fromTick = viewport.tickAt(pointer.x);
  const fromKey = viewport.keyAt(pointer.y);
  let box: SelectionBox | null = { fromTick, toTick: fromTick, fromKey, toKey: fromKey };
  if (!additive) store.selectNotes([]);

  return {
    move(current) {
      box = { fromTick, toTick: viewport.tickAt(current.x), fromKey, toKey: viewport.keyAt(current.y) };
      const touched = notesInBox(store.editableNotes, box.fromTick, box.toTick, box.fromKey, box.toKey);
      store.selectNotes([...kept, ...touched.map((note) => note.id)]);
    },
    end() {
      box = null;
    },
    cancel() {
      box = null;
      store.selectNotes(selectionBefore);
    },
    selectionBox: () => box,
  };
}
