// Четыре инструмента пианоролла этапа 2. Во всех правая кнопка мыши стирает
// (метод LARD), а Ctrl + левая кнопка рисует рамку выделения.
//
//   Draw   (P) — левая кнопка ставит ноту и сразу тянет её; по ноте — двигает,
//                за правый край — растягивает.
//   Paint  (B) — как Draw, но протяжка по пустому месту рисует ряд нот.
//   Delete (D) — левая кнопка тоже стирает.
//   Select (E) — левая кнопка по пустому месту рисует рамку, по ноте —
//                выделяет её и двигает; Shift/Ctrl добавляют к выделению.

import type { ToolName } from "../../state/editorPreferences";
import { startBoxSelectGesture } from "../gestures/boxSelect";
import { startCreateAndMoveGesture, startEraseGesture, startPaintGesture } from "../gestures/drawAndErase";
import { pressOnNote } from "../gestures/moveAndResize";
import { noteAt } from "../hitTest";
import type { Gesture, PointerInput, Tool, ToolContext } from "./toolTypes";

const LEFT_BUTTON = 0;
const RIGHT_BUTTON = 2;

const drawTool: Tool = {
  name: "draw",
  press: (pointer, context) =>
    pressCommon(pointer, context) ?? pressNoteOrEmpty(pointer, context, false, startCreateAndMoveGesture),
  cursor: (pointer, context) => cursorOverNote(pointer, context) ?? "crosshair",
};

const paintTool: Tool = {
  name: "paint",
  press: (pointer, context) =>
    pressCommon(pointer, context) ?? pressNoteOrEmpty(pointer, context, false, startPaintGesture),
  cursor: (pointer, context) => cursorOverNote(pointer, context) ?? "crosshair",
};

const deleteTool: Tool = {
  name: "delete",
  press(pointer, context) {
    const common = pressCommon(pointer, context);
    if (common) return common;
    return pointer.button === LEFT_BUTTON && context.viewport.isInNoteArea(pointer.x, pointer.y)
      ? startEraseGesture(context, pointer)
      : null;
  },
  cursor: (pointer, context) =>
    noteAt(context.store.editableNotes, context.viewport, pointer.x, pointer.y) ? "pointer" : "crosshair",
};

const selectTool: Tool = {
  name: "select",
  press(pointer, context) {
    if (pointer.button === RIGHT_BUTTON) return startEraseGesture(context, pointer);
    if (pointer.button !== LEFT_BUTTON || !context.viewport.isInNoteArea(pointer.x, pointer.y)) return null;
    const additive = pointer.ctrlKey || pointer.shiftKey;
    const hit = noteAt(context.store.editableNotes, context.viewport, pointer.x, pointer.y);
    if (!hit) return startBoxSelectGesture(context, pointer, additive);
    if (additive) {
      toggleSelection(context, hit.note.id);
      return null;
    }
    return pressOnNote(hit, pointer, context, true);
  },
  cursor: (pointer, context) => cursorOverNote(pointer, context) ?? "default",
};

export const TOOLS: Readonly<Record<ToolName, Tool>> = {
  draw: drawTool,
  paint: paintTool,
  delete: deleteTool,
  select: selectTool,
};

/** Общее для Draw, Paint и Delete: правая кнопка стирает, Ctrl + левая — рамка. */
function pressCommon(pointer: PointerInput, context: ToolContext): Gesture | null {
  if (!context.viewport.isInNoteArea(pointer.x, pointer.y)) return null;
  if (pointer.button === RIGHT_BUTTON) return startEraseGesture(context, pointer);
  if (pointer.button === LEFT_BUTTON && pointer.ctrlKey) {
    return startBoxSelectGesture(context, pointer, pointer.shiftKey);
  }
  return null;
}

/** По ноте — двигать или растягивать; по пустому месту — то, что умеет инструмент. */
function pressNoteOrEmpty(
  pointer: PointerInput,
  context: ToolContext,
  selectPressedNote: boolean,
  onEmpty: (context: ToolContext, pointer: PointerInput) => Gesture,
): Gesture | null {
  if (pointer.button !== LEFT_BUTTON || !context.viewport.isInNoteArea(pointer.x, pointer.y)) return null;
  const hit = noteAt(context.store.editableNotes, context.viewport, pointer.x, pointer.y);
  if (hit) return pressOnNote(hit, pointer, context, selectPressedNote);
  context.store.selectNotes([]);
  return onEmpty(context, pointer);
}

function cursorOverNote(pointer: PointerInput, context: ToolContext): string | null {
  const hit = noteAt(context.store.editableNotes, context.viewport, pointer.x, pointer.y);
  if (!hit) return null;
  return hit.zone === "end" ? "ew-resize" : "move";
}

function toggleSelection(context: ToolContext, noteId: string): void {
  const ids = new Set(context.store.selectedNoteIds);
  if (ids.has(noteId)) ids.delete(noteId);
  else ids.add(noteId);
  context.store.selectNotes(ids);
}
