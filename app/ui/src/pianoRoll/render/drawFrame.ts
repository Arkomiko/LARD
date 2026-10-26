// Клавиатура слева, линейка тактов сверху и рамка выделения поверх нот.

import { ticksPerBar, ticksPerBeat } from "../../model/timeGrid";
import type { Project } from "../../model/types";
import { noteName } from "../../view/musicText";
import type { SelectionBox } from "../tools/toolTypes";
import { KEYBOARD_WIDTH, RULER_HEIGHT, type Viewport } from "../viewport";
import { isBlackKey } from "./drawGrid";
import type { Palette } from "./palette";

/** Чёрная клавиша короче белой — как на настоящей клавиатуре. */
const BLACK_KEY_WIDTH = KEYBOARD_WIDTH * 0.62;
/** Номера тактов ближе этого (в пикселях) пишутся через один, через два… */
const MIN_BAR_LABEL_SPACING = 32;

export function drawKeyboard(graphics: CanvasRenderingContext2D, viewport: Viewport, palette: Palette): void {
  graphics.fillStyle = palette.keyWhite;
  graphics.fillRect(0, RULER_HEIGHT, KEYBOARD_WIDTH, viewport.noteAreaHeight);

  const [lowKey, highKey] = viewport.visibleKeys();
  graphics.fillStyle = palette.keyBlack;
  graphics.beginPath();
  for (let key = lowKey; key <= highKey; key++) {
    if (isBlackKey(key)) graphics.rect(0, viewport.yOf(key), BLACK_KEY_WIDTH, viewport.rowHeight);
  }
  graphics.fill();

  // Тонкие линии между белыми клавишами (под каждой белой, кроме тех, где рядом чёрная).
  graphics.strokeStyle = palette.keyBlack;
  graphics.beginPath();
  for (let key = lowKey; key <= highKey; key++) {
    if (isBlackKey(key) || isBlackKey(key - 1)) continue;
    const y = Math.round(viewport.yOf(key) + viewport.rowHeight) - 0.5;
    graphics.moveTo(0, y);
    graphics.lineTo(KEYBOARD_WIDTH, y);
  }
  graphics.stroke();

  if (viewport.rowHeight < 8) return;
  graphics.fillStyle = palette.keyText;
  graphics.font = `${Math.min(11, viewport.rowHeight - 2)}px Segoe UI, sans-serif`;
  graphics.textBaseline = "middle";
  graphics.textAlign = "right";
  for (let key = lowKey; key <= highKey; key++) {
    if (key % 12 === 0)
      graphics.fillText(noteName(key), KEYBOARD_WIDTH - 4, viewport.yOf(key) + viewport.rowHeight / 2);
  }
  graphics.textAlign = "left";
}

export function drawRuler(
  graphics: CanvasRenderingContext2D,
  viewport: Viewport,
  project: Project,
  palette: Palette,
): void {
  graphics.fillStyle = palette.rulerBackground;
  graphics.fillRect(0, 0, viewport.width, RULER_HEIGHT);

  const bar = ticksPerBar(project);
  const beat = ticksPerBeat(project);
  const barWidth = bar * viewport.pixelsPerTick;
  // Если такты мелкие, подписываем каждый 2-й, 4-й, 8-й… чтобы цифры не налезали.
  let labelEvery = 1;
  while (barWidth * labelEvery < MIN_BAR_LABEL_SPACING) labelEvery *= 2;

  const [fromTick, toTick] = viewport.visibleTicks();
  graphics.save();
  graphics.beginPath();
  graphics.rect(KEYBOARD_WIDTH, 0, viewport.noteAreaWidth, RULER_HEIGHT);
  graphics.clip();
  graphics.strokeStyle = palette.rulerText;
  graphics.fillStyle = palette.rulerText;
  graphics.font = "11px Segoe UI, sans-serif";
  graphics.textBaseline = "middle";
  graphics.beginPath();
  const showBeats = beat * viewport.pixelsPerTick >= 8;
  const firstTick = Math.floor(fromTick / beat) * beat;
  for (let tick = firstTick; tick <= toTick; tick += beat) {
    const x = Math.round(viewport.xOf(tick)) + 0.5;
    const isBar = tick % bar === 0;
    if (!isBar && !showBeats) continue;
    graphics.moveTo(x, isBar ? RULER_HEIGHT * 0.45 : RULER_HEIGHT * 0.75);
    graphics.lineTo(x, RULER_HEIGHT);
    const barNumber = tick / bar + 1;
    if (isBar && (barNumber - 1) % labelEvery === 0)
      graphics.fillText(String(barNumber), x + 4, RULER_HEIGHT * 0.4);
  }
  graphics.stroke();
  graphics.restore();
}

export function drawSelectionBox(
  graphics: CanvasRenderingContext2D,
  viewport: Viewport,
  box: SelectionBox,
  palette: Palette,
): void {
  const left = viewport.xOf(Math.min(box.fromTick, box.toTick));
  const right = viewport.xOf(Math.max(box.fromTick, box.toTick));
  const top = viewport.yOf(Math.max(box.fromKey, box.toKey));
  const bottom = viewport.yOf(Math.min(box.fromKey, box.toKey)) + viewport.rowHeight;
  graphics.fillStyle = palette.selectionFill;
  graphics.fillRect(left, top, right - left, bottom - top);
  graphics.strokeStyle = palette.selectionBorder;
  graphics.strokeRect(
    Math.round(left) + 0.5,
    Math.round(top) + 0.5,
    Math.round(right - left),
    Math.round(bottom - top),
  );
}
