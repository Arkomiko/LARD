// Инструменты разработчика для замера скорости пианоролла (ТЗ, п. 4).
// Подключаются только в режиме разработки: window.miliplainDev в консоли
// WebView2 (F12) или из автотеста.
//
//   await miliplainDev.fillNotes(5000)   — добавить 5000 нот
//   await miliplainDev.benchmark()       — замер; вернёт время кадров по режимам

import type { ProjectStore } from "../state/projectStore";
import { selectedNotes } from "./noteCommands";
import type { PianoRollCanvas } from "./pianoRollCanvas";
import { addTestNotes } from "./testNotes";
import { TOOLS } from "./tools/tools";
import type { PointerInput } from "./tools/toolTypes";

const PHASE_MS = 3000;

interface FrameStats {
  frames: number;
  fps: number;
  drawMs: { average: number; p95: number; max: number };
  frameMs: { average: number; p95: number; max: number };
  /** Доля кадров дольше 20 мс (заметные подтормаживания при 60 Гц). */
  longFramesPercent: number;
  /** Сколько нот тащили (только для замеров перетаскивания). */
  notesMoved?: number;
}

declare global {
  interface Window {
    miliplainDev?: {
      fillNotes(count?: number): void;
      benchmark(): Promise<Record<string, FrameStats>>;
      /** Ноты пианоролла и выделение — чтобы автотест проверял результат, а не картинку. */
      notes(): { key: number; start: number; length: number; selected: boolean }[];
      tool(): string;
    };
  }
}

export function installDeveloperTools(store: ProjectStore, canvas: PianoRollCanvas): void {
  window.miliplainDev = {
    fillNotes(count = 5000) {
      addTestNotes(store, count);
      canvas.showAllNotes();
    },
    benchmark: () => runBenchmark(store, canvas),
    notes: () =>
      store.editableNotes.map((note) => ({
        key: note.key,
        start: note.start,
        length: note.length,
        selected: store.selectedNoteIds.has(note.id),
      })),
    tool: () => store.editorPreferences.tool,
  };
}

async function runBenchmark(
  store: ProjectStore,
  canvas: PianoRollCanvas,
): Promise<Record<string, FrameStats>> {
  const viewport = canvas.viewport;
  const results: Record<string, FrameStats> = {};

  canvas.showAllNotes();
  viewport.zoomHorizontally(16, viewport.width / 2);
  results.scrollNormalZoom = await measure(canvas, (frame) => {
    viewport.scrollBy(frame % 200 < 100 ? 6 : -6, 0);
  });

  canvas.showAllNotes();
  results.allNotesVisible = await measure(canvas, (frame) => {
    viewport.scrollBy(0, frame % 2 === 0 ? 1 : -1);
  });

  canvas.showAllNotes();
  viewport.zoomHorizontally(16, viewport.width / 2);
  results.dragOneNote = await measureDrag(store, canvas, false);
  results.dragFiveHundredNotes = await measureDrag(store, canvas, true);
  return results;
}

/** Перетаскивание через настоящий инструмент Draw: правка проекта + перерисовка каждый кадр. */
async function measureDrag(store: ProjectStore, canvas: PianoRollCanvas, many: boolean): Promise<FrameStats> {
  const viewport = canvas.viewport;
  const [fromTick, toTick] = viewport.visibleTicks();
  const [lowKey, highKey] = viewport.visibleKeys();
  const visible = store.editableNotes.filter(
    (note) => note.start >= fromTick && note.start < toTick && note.key >= lowKey && note.key <= highKey,
  );
  const anchor = visible[0];
  if (!anchor) return emptyStats();
  store.selectNotes(
    many
      ? store.editableNotes
          .slice(0, 500)
          .map((note) => note.id)
          .concat(anchor.id)
      : [],
  );
  const pointer = (x: number, y: number): PointerInput => ({
    x,
    y,
    button: 0,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
  });
  const startX = viewport.xOf(anchor.start) + 2;
  const startY = viewport.yOf(anchor.key) + viewport.rowHeight / 2;
  const gesture = TOOLS.draw.press(pointer(startX, startY), { store, viewport });
  const moved = many ? selectedNotes(store).length : 1;
  const stats = await measure(canvas, (frame) => {
    gesture?.move(
      pointer(startX + (frame % 120) * 2, startY + ((frame % 24) - 12) * viewport.rowHeight * 0.2),
    );
  });
  gesture?.cancel();
  store.selectNotes([]);
  return { ...stats, notesMoved: moved };
}

function measure(canvas: PianoRollCanvas, change: (frame: number) => void): Promise<FrameStats> {
  return new Promise((resolve) => {
    const drawTimes: number[] = [];
    const frameTimes: number[] = [];
    let previous = 0;
    let frame = 0;
    const deadline = performance.now() + PHASE_MS;
    const step = (timestamp: number) => {
      if (previous) {
        frameTimes.push(timestamp - previous);
        drawTimes.push(canvas.lastDrawMs);
      }
      previous = timestamp;
      if (performance.now() >= deadline) {
        resolve(summarize(drawTimes, frameTimes));
        return;
      }
      change(frame++);
      canvas.requestFrame();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

function summarize(drawTimes: number[], frameTimes: number[]): FrameStats {
  const describe = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    const average = sorted.reduce((sum, value) => sum + value, 0) / Math.max(1, sorted.length);
    return {
      average: round(average),
      p95: round(sorted[Math.floor(0.95 * (sorted.length - 1))] ?? 0),
      max: round(sorted.at(-1) ?? 0),
    };
  };
  const frameMs = describe(frameTimes);
  return {
    frames: frameTimes.length,
    fps: round(1000 / Math.max(1, frameMs.average)),
    drawMs: describe(drawTimes),
    frameMs,
    longFramesPercent: round(
      (100 * frameTimes.filter((time) => time > 20).length) / Math.max(1, frameTimes.length),
    ),
  };
}

function emptyStats(): FrameStats {
  return summarize([], []);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
