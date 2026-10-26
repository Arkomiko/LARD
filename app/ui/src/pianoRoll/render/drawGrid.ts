// Фон нотной области: полосы чёрных клавиш и вертикальные линии сетки
// (шаги привязки, доли, такты).

import { ticksPerBar, ticksPerBeat } from "../../model/timeGrid";
import type { Project } from "../../model/types";
import { KEYBOARD_WIDTH, RULER_HEIGHT, type Viewport } from "../viewport";
import type { Palette } from "./palette";

/** Чёрные клавиши внутри октавы: до-диез, ре-диез, фа-диез, соль-диез, ля-диез. */
const BLACK_KEYS = new Set([1, 3, 6, 8, 10]);

/** Линии сетки ближе этого (в пикселях) не рисуются — сливаются в серое пятно. */
const MIN_LINE_SPACING = 6;

export function isBlackKey(key: number): boolean {
  return BLACK_KEYS.has(key % 12);
}

export function drawGrid(
  graphics: CanvasRenderingContext2D,
  viewport: Viewport,
  project: Project,
  snapStep: number | null,
  palette: Palette,
): void {
  const left = KEYBOARD_WIDTH;
  const top = RULER_HEIGHT;
  const width = viewport.noteAreaWidth;
  const height = viewport.noteAreaHeight;
  graphics.fillStyle = palette.background;
  graphics.fillRect(left, top, width, height);

  // Все полосы чёрных клавиш — одним путём: один вызов fill() вместо десятков.
  const [lowKey, highKey] = viewport.visibleKeys();
  graphics.fillStyle = palette.blackKeyRow;
  graphics.beginPath();
  for (let key = lowKey; key <= highKey; key++) {
    if (isBlackKey(key)) graphics.rect(left, viewport.yOf(key), width, viewport.rowHeight);
  }
  graphics.fill();

  // Граница октав — под каждой нотой «до».
  graphics.strokeStyle = palette.octaveLine;
  graphics.beginPath();
  for (let key = lowKey; key <= highKey; key++) {
    if (key % 12 !== 0) continue;
    const y = Math.round(viewport.yOf(key) + viewport.rowHeight) - 0.5;
    graphics.moveTo(left, y);
    graphics.lineTo(left + width, y);
  }
  graphics.stroke();

  const beat = ticksPerBeat(project);
  const bar = ticksPerBar(project);
  if (snapStep !== null && snapStep < beat) drawVerticalLines(graphics, viewport, snapStep, palette.stepLine);
  drawVerticalLines(graphics, viewport, beat, palette.beatLine);
  drawVerticalLines(graphics, viewport, bar, palette.barLine);
}

function drawVerticalLines(
  graphics: CanvasRenderingContext2D,
  viewport: Viewport,
  stepTicks: number,
  color: string,
): void {
  if (stepTicks * viewport.pixelsPerTick < MIN_LINE_SPACING) return;
  const [fromTick, toTick] = viewport.visibleTicks();
  graphics.strokeStyle = color;
  graphics.beginPath();
  for (let tick = Math.ceil(fromTick / stepTicks) * stepTicks; tick <= toTick; tick += stepTicks) {
    // +0.5 — чтобы линия в 1 пиксель была чёткой, а не размазанной на два.
    const x = Math.round(viewport.xOf(tick)) + 0.5;
    graphics.moveTo(x, RULER_HEIGHT);
    graphics.lineTo(x, viewport.height);
  }
  graphics.stroke();
}
