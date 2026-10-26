// Настройки редактора: инструмент, привязка к сетке, какими получаются
// новые ноты. Это не часть проекта — в файл и в историю отмены не попадают.

import type { SnapId } from "../model/timeGrid";
import { DEFAULT_VELOCITY } from "../model/types";

/** Инструменты пианоролла этапа 2. Mute, Slice, Zoom и другие — этап 6. */
export const TOOL_NAMES = ["draw", "paint", "delete", "select"] as const;
export type ToolName = (typeof TOOL_NAMES)[number];

export interface EditorPreferences {
  readonly tool: ToolName;
  readonly snapId: SnapId;
  /** Длина новой ноты в тиках. Как в FL Studio: равна длине последней тронутой ноты. */
  readonly newNoteLength: number;
  readonly newNoteVelocity: number;
  readonly newNoteColorGroup: number;
}

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  tool: "draw",
  // Четверть доли — «шаг» FL Studio, самая ходовая привязка.
  snapId: "quarter-beat",
  newNoteLength: 960,
  newNoteVelocity: DEFAULT_VELOCITY,
  newNoteColorGroup: 0,
};
