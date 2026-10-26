// Общие типы инструментов пианоролла.
//
// Инструмент решает, что делать при нажатии мыши, и запускает «жест» —
// действие, которое длится до отпускания кнопки (перетащить ноту, нарисовать
// рамку, стереть протяжкой). Жест получает движения мыши и в конце пишет
// в историю один шаг.

import { snapStep } from "../../model/timeGrid";
import type { ToolName } from "../../state/editorPreferences";
import type { ProjectStore } from "../../state/projectStore";
import type { Viewport } from "../viewport";

/** Положение мыши в области пианоролла (CSS-пиксели) и зажатые кнопки. */
export interface PointerInput {
  readonly x: number;
  readonly y: number;
  /** 0 — левая кнопка, 1 — средняя, 2 — правая. */
  readonly button: number;
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
}

export interface ToolContext {
  readonly store: ProjectStore;
  readonly viewport: Viewport;
}

/** Рамка выделения в тиках и высотах нот — чтобы её нарисовать. */
export interface SelectionBox {
  readonly fromTick: number;
  readonly toTick: number;
  readonly fromKey: number;
  readonly toKey: number;
}

/** Действие от нажатия кнопки мыши до её отпускания. */
export interface Gesture {
  move(pointer: PointerInput): void;
  end(pointer: PointerInput): void;
  /** Отменить всё, что сделал жест (Esc во время перетаскивания). */
  cancel(): void;
  /** Текущая рамка выделения, если это жест рамки. */
  selectionBox?(): SelectionBox | null;
}

export interface Tool {
  readonly name: ToolName;
  /** Что начать по нажатию. null — ничего (например, нажали на клавиатуру). */
  press(pointer: PointerInput, context: ToolContext): Gesture | null;
  /** Курсор мыши над этой точкой, когда кнопки не нажаты. */
  cursor(pointer: PointerInput, context: ToolContext): string;
}

/** Шаг привязки к сетке. Зажатый Alt временно отключает привязку — как в FL Studio. */
export function snapStepFor(pointer: PointerInput, context: ToolContext): number | null {
  if (pointer.altKey) return null;
  return snapStep(context.store.project, context.store.editorPreferences.snapId);
}
