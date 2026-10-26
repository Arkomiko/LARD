// Тесты окна просмотра и поиска нот под курсором.

import { describe, expect, it } from "vitest";
import { createNote } from "../src/model/create";
import { noteAt, notesInBox, notesOnPath } from "../src/pianoRoll/hitTest";
import { KEYBOARD_WIDTH, RULER_HEIGHT, Viewport } from "../src/pianoRoll/viewport";

/** Окно 1064×624: нотная область 1000×600, 0.1 пикселя на тик, строка 10 пикселей, сверху нота 127. */
function testViewport(): Viewport {
  const viewport = new Viewport();
  viewport.pixelsPerTick = 0.1;
  viewport.rowHeight = 10;
  viewport.resize(KEYBOARD_WIDTH + 1000, RULER_HEIGHT + 600);
  return viewport;
}

describe("окно просмотра", () => {
  it("пиксели ↔ тики и высоты нот", () => {
    const viewport = testViewport();
    expect(viewport.tickAt(KEYBOARD_WIDTH + 96)).toBe(960);
    expect(viewport.xOf(960)).toBe(KEYBOARD_WIDTH + 96);
    expect(viewport.keyAt(RULER_HEIGHT + 5)).toBe(127);
    expect(viewport.keyAt(RULER_HEIGHT + 15)).toBe(126);
    expect(viewport.yOf(126)).toBe(RULER_HEIGHT + 10);
  });

  it("масштаб оставляет тик под курсором на месте", () => {
    const viewport = testViewport();
    viewport.scrollBy(300, 0);
    const anchorX = KEYBOARD_WIDTH + 400;
    const before = viewport.tickAt(anchorX);
    viewport.zoomHorizontally(2, anchorX);
    expect(viewport.pixelsPerTick).toBe(0.2);
    expect(viewport.tickAt(anchorX)).toBeCloseTo(before, 6);
  });

  it("нельзя уйти левее начала и за края клавиатуры", () => {
    const viewport = testViewport();
    viewport.scrollBy(-500, -500);
    expect(viewport.scrollTick).toBe(0);
    expect(viewport.scrollY).toBe(0);
    viewport.scrollBy(0, 100_000);
    // 128 строк по 10 пикселей = 1280; видно 600 → максимум 680.
    expect(viewport.scrollY).toBe(680);
    expect(viewport.visibleKeys()[0]).toBe(0);
  });

  it("показать диапазон: все ноты влезают", () => {
    const viewport = testViewport();
    viewport.showRange(0, 3840 * 16, 36, 96);
    const [fromTick, toTick] = viewport.visibleTicks();
    const [lowKey, highKey] = viewport.visibleKeys();
    expect(fromTick).toBeLessThanOrEqual(0);
    expect(toTick).toBeGreaterThanOrEqual(3840 * 16);
    expect(lowKey).toBeLessThanOrEqual(36);
    expect(highKey).toBeGreaterThanOrEqual(96);
  });
});

describe("поиск нот", () => {
  const viewport = testViewport();
  // Строка C4 (60) — посередине по высоте, чтобы попасть в видимую область.
  viewport.centerKey(60);
  // Нота C4 с 960 по 1920 тик: по x от 160 до 256 пикселей нотной области.
  const note = createNote({ channelId: "c", key: 60, start: 960, length: 960 });
  const y = viewport.yOf(60) + 5;

  it("тело и правый край ноты", () => {
    expect(noteAt([note], viewport, viewport.xOf(1200), y)).toEqual({ note, zone: "body" });
    expect(noteAt([note], viewport, viewport.xOf(1920) - 2, y)).toEqual({ note, zone: "end" });
    expect(noteAt([note], viewport, viewport.xOf(1200), y + 10)).toBeNull();
    expect(noteAt([note], viewport, viewport.xOf(100), y)).toBeNull();
  });

  it("клавиатура и линейка — не нотная область", () => {
    expect(noteAt([note], viewport, 10, y)).toBeNull();
    expect(noteAt([note], viewport, viewport.xOf(1200), 5)).toBeNull();
  });

  it("из перекрытых нот берётся верхняя", () => {
    const top = createNote({ channelId: "c", key: 60, start: 1000, length: 480 });
    expect(noteAt([note, top], viewport, viewport.xOf(1100), y)?.note).toBe(top);
  });

  it("рамка задевает ноты по времени и высоте", () => {
    const other = createNote({ channelId: "c", key: 72, start: 0, length: 480 });
    expect(notesInBox([note, other], 1900, 1800, 59, 61)).toEqual([note]);
    expect(notesInBox([note, other], 0, 5000, 0, 127)).toEqual([note, other]);
    expect(notesInBox([note, other], 1920, 3000, 0, 127)).toEqual([]);
  });

  it("быстрый росчерк ластиком не перепрыгивает ноты", () => {
    const notes = [0, 1, 2, 3].map((index) =>
      createNote({ channelId: "c", key: 60, start: 3000 + index * 200, length: 100 }),
    );
    const found = notesOnPath(notes, viewport, { x: viewport.xOf(2900), y }, { x: viewport.xOf(4000), y });
    expect(found).toHaveLength(4);
  });
});
