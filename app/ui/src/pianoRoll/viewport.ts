// Окно просмотра пианоролла: какой кусок сетки сейчас виден и как переводить
// пиксели экрана в тики и высоты нот и обратно.
//
// Раскладка области пианоролла (в CSS-пикселях):
//
//   ┌──────────┬──────────────────────────────┐  ← RULER_HEIGHT: линейка тактов
//   │          │  1        2        3         │
//   ├──────────┼──────────────────────────────┤
//   │ клавиши  │  ноты                        │
//   │          │                              │
//   └──────────┴──────────────────────────────┘
//    KEYBOARD_WIDTH

import { KEY_COUNT } from "../model/types";

export const KEYBOARD_WIDTH = 64;
export const RULER_HEIGHT = 24;
const HIGHEST_KEY = KEY_COUNT - 1;

const MIN_PIXELS_PER_TICK = 0.002;
const MAX_PIXELS_PER_TICK = 1;
const MIN_ROW_HEIGHT = 4;
const MAX_ROW_HEIGHT = 40;

export class Viewport {
  /** Размер всей области пианоролла. */
  width = 0;
  height = 0;
  /** Какой тик у левого края нотной области (может быть дробным). */
  scrollTick = 0;
  /** На сколько пикселей прокручено вниз от верхней ноты (127). */
  scrollY = 0;
  /** Масштаб по времени: 0.05 — доля в 960 тиков занимает 48 пикселей. */
  pixelsPerTick = 0.05;
  /** Высота строки одной ноты. */
  rowHeight = 14;

  get noteAreaWidth(): number {
    return Math.max(0, this.width - KEYBOARD_WIDTH);
  }

  get noteAreaHeight(): number {
    return Math.max(0, this.height - RULER_HEIGHT);
  }

  xOf(tick: number): number {
    return KEYBOARD_WIDTH + (tick - this.scrollTick) * this.pixelsPerTick;
  }

  tickAt(x: number): number {
    return this.scrollTick + (x - KEYBOARD_WIDTH) / this.pixelsPerTick;
  }

  /** Верхний край строки ноты key. */
  yOf(key: number): number {
    return RULER_HEIGHT + (HIGHEST_KEY - key) * this.rowHeight - this.scrollY;
  }

  /** Высота ноты в строке под точкой y (0…127). */
  keyAt(y: number): number {
    const row = Math.floor((y - RULER_HEIGHT + this.scrollY) / this.rowHeight);
    return Math.min(HIGHEST_KEY, Math.max(0, HIGHEST_KEY - row));
  }

  isInNoteArea(x: number, y: number): boolean {
    return x >= KEYBOARD_WIDTH && x < this.width && y >= RULER_HEIGHT && y < this.height;
  }

  /** Видимый отрезок времени [от, до) в тиках. */
  visibleTicks(): [number, number] {
    return [this.scrollTick, this.tickAt(this.width)];
  }

  /** Видимые высоты нот [нижняя, верхняя]. */
  visibleKeys(): [number, number] {
    return [this.keyAt(this.height - 1), this.keyAt(RULER_HEIGHT)];
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.clamp();
  }

  /** Прокрутить на столько пикселей по горизонтали и вертикали. */
  scrollBy(deltaX: number, deltaY: number): void {
    this.scrollTick += deltaX / this.pixelsPerTick;
    this.scrollY += deltaY;
    this.clamp();
  }

  /** Масштаб по времени; тик под точкой anchorX остаётся на месте. */
  zoomHorizontally(factor: number, anchorX: number): void {
    const anchorTick = this.tickAt(anchorX);
    this.pixelsPerTick = clamp(this.pixelsPerTick * factor, MIN_PIXELS_PER_TICK, MAX_PIXELS_PER_TICK);
    this.scrollTick = anchorTick - (anchorX - KEYBOARD_WIDTH) / this.pixelsPerTick;
    this.clamp();
  }

  /** Масштаб по высоте; нота под точкой anchorY остаётся на месте. */
  zoomVertically(factor: number, anchorY: number): void {
    const anchorRow = (anchorY - RULER_HEIGHT + this.scrollY) / this.rowHeight;
    this.rowHeight = clamp(Math.round(this.rowHeight * factor), MIN_ROW_HEIGHT, MAX_ROW_HEIGHT);
    this.scrollY = anchorRow * this.rowHeight - (anchorY - RULER_HEIGHT);
    this.clamp();
  }

  /** Поставить ноту key в середину по высоте. */
  centerKey(key: number): void {
    this.scrollY = (HIGHEST_KEY - key + 0.5) * this.rowHeight - this.noteAreaHeight / 2;
    this.clamp();
  }

  /** Показать отрезок времени и диапазон высот целиком, с небольшим запасом. */
  showRange(startTick: number, endTick: number, lowKey: number, highKey: number): void {
    const span = Math.max(1, endTick - startTick);
    this.pixelsPerTick = clamp((this.noteAreaWidth * 0.95) / span, MIN_PIXELS_PER_TICK, MAX_PIXELS_PER_TICK);
    this.scrollTick = Math.max(0, startTick - span * 0.025);
    const rows = highKey - lowKey + 3;
    this.rowHeight = clamp(Math.floor(this.noteAreaHeight / rows), MIN_ROW_HEIGHT, MAX_ROW_HEIGHT);
    this.centerKey((lowKey + highKey) / 2);
  }

  // Нельзя уйти левее начала паттерна и выше/ниже клавиатуры.
  private clamp(): void {
    this.scrollTick = Math.max(0, this.scrollTick);
    const contentHeight = KEY_COUNT * this.rowHeight;
    this.scrollY = clamp(this.scrollY, 0, Math.max(0, contentHeight - this.noteAreaHeight));
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
