// Ноты. Главная забота — скорость на 5000 нот (ТЗ, п. 4):
// - рисуются только видимые ноты;
// - за один проход по нотам прямоугольники сразу складываются в 16 путей
//   (по одному на цвет), и каждый путь заливается одним вызовом fill();
//   промежуточных объектов на каждую ноту не создаётся — при 5000 нот это
//   заметная экономия на слабом процессоре (замер этапа 2);
// - обводка и подписи — только в крупном масштабе: на мелких нотах их всё
//   равно не видно, а без видеокарты обводка 5000 нот — самое медленное
//   место (замер этапа 0).

import type { Note } from "../../model/types";
import { noteName } from "../../view/musicText";
import type { Viewport } from "../viewport";
import type { Palette } from "./palette";

const OUTLINE_MIN_ROW_HEIGHT = 8;
const OUTLINE_MAX_NOTES = 3000;
const LABEL_MIN_ROW_HEIGHT = 12;
const LABEL_MIN_WIDTH = 28;
const LABEL_MAX_NOTES = 400;
const MUTED_ALPHA = 0.35;

export function drawNotes(
  graphics: CanvasRenderingContext2D,
  viewport: Viewport,
  notes: readonly Note[],
  selectedIds: ReadonlySet<string>,
  palette: Palette,
): void {
  const [fromTick, toTick] = viewport.visibleTicks();
  const [lowKey, highKey] = viewport.visibleKeys();
  // Между нотами соседних строк — щель в пиксель, если строки не совсем мелкие.
  const gap = viewport.rowHeight > 5 ? 1 : 0;
  const rectOf = (note: Note) => ({
    x: viewport.xOf(note.start),
    y: viewport.yOf(note.key) + gap,
    width: Math.max(1, note.length * viewport.pixelsPerTick - gap),
    height: viewport.rowHeight - gap,
  });

  // Заглушённые ноты — в отдельных путях: они рисуются полупрозрачными.
  const fills: (Path2D | undefined)[] = [];
  const mutedFills: (Path2D | undefined)[] = [];
  const visible: Note[] = [];
  for (const note of notes) {
    if (note.key < lowKey || note.key > highKey) continue;
    if (note.start > toTick || note.start + note.length < fromTick) continue;
    visible.push(note);
    const paths = note.muted ? mutedFills : fills;
    let path = paths[note.colorGroup];
    if (!path) {
      path = new Path2D();
      paths[note.colorGroup] = path;
    }
    path.rect(
      viewport.xOf(note.start),
      viewport.yOf(note.key) + gap,
      Math.max(1, note.length * viewport.pixelsPerTick - gap),
      viewport.rowHeight - gap,
    );
  }

  fillPaths(graphics, fills, palette);
  graphics.globalAlpha = MUTED_ALPHA;
  fillPaths(graphics, mutedFills, palette);
  graphics.globalAlpha = 1;

  if (viewport.rowHeight >= OUTLINE_MIN_ROW_HEIGHT && visible.length <= OUTLINE_MAX_NOTES) {
    strokeNotes(graphics, visible, rectOf, palette.noteOutline, 1);
  }
  if (selectedIds.size > 0) {
    const selected = visible.filter((note) => selectedIds.has(note.id));
    strokeNotes(graphics, selected, rectOf, palette.noteSelected, 2);
  }
  if (viewport.rowHeight >= LABEL_MIN_ROW_HEIGHT && visible.length <= LABEL_MAX_NOTES) {
    drawLabels(graphics, visible, rectOf, palette.noteText);
  }
}

type RectOf = (note: Note) => { x: number; y: number; width: number; height: number };

function fillPaths(
  graphics: CanvasRenderingContext2D,
  paths: (Path2D | undefined)[],
  palette: Palette,
): void {
  paths.forEach((path, group) => {
    if (!path) return;
    graphics.fillStyle = palette.noteColors[group] ?? "#888";
    graphics.fill(path);
  });
}

function strokeNotes(
  graphics: CanvasRenderingContext2D,
  notes: readonly Note[],
  rectOf: RectOf,
  color: string,
  lineWidth: number,
): void {
  if (notes.length === 0) return;
  graphics.strokeStyle = color;
  graphics.lineWidth = lineWidth;
  graphics.beginPath();
  const inset = lineWidth / 2;
  for (const note of notes) {
    const rect = rectOf(note);
    graphics.rect(rect.x + inset, rect.y + inset, rect.width - lineWidth, rect.height - lineWidth);
  }
  graphics.stroke();
  graphics.lineWidth = 1;
}

function drawLabels(
  graphics: CanvasRenderingContext2D,
  notes: readonly Note[],
  rectOf: RectOf,
  color: string,
): void {
  graphics.fillStyle = color;
  graphics.font = "10px Segoe UI, sans-serif";
  graphics.textBaseline = "middle";
  for (const note of notes) {
    const rect = rectOf(note);
    if (rect.width < LABEL_MIN_WIDTH) continue;
    graphics.fillText(noteName(note.key), rect.x + 4, rect.y + rect.height / 2, rect.width - 6);
  }
}
