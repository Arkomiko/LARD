// Холст пианоролла: рисует сетку, ноты, клавиатуру и линейку и передаёт
// нажатия мыши текущему инструменту.
//
// Рисуется не сразу при изменении, а в ближайшем кадре экрана
// (requestAnimationFrame): сколько бы правок ни пришло за кадр, кадр
// рисуется один раз.

import type { PianoRollControls } from "../app/commands";
import { snapStep } from "../model/timeGrid";
import type { ProjectStore } from "../state/projectStore";
import { drawKeyboard, drawRuler, drawSelectionBox } from "./render/drawFrame";
import { drawGrid } from "./render/drawGrid";
import { drawNotes } from "./render/drawNotes";
import { type Palette, readPalette } from "./render/palette";
import { TOOLS } from "./tools/tools";
import type { Gesture, PointerInput, ToolContext } from "./tools/toolTypes";
import { Viewport } from "./viewport";

const MIDDLE_BUTTON = 1;
/** Во сколько раз меняется масштаб за один щелчок колеса. */
const ZOOM_STEP = 1.15;
/** Нота, которая видна посередине при запуске: между C4 и C6. */
const START_KEY = 66;

export class PianoRollCanvas implements PianoRollControls {
  readonly element: HTMLCanvasElement;
  readonly viewport = new Viewport();
  /** Сколько миллисекунд занял последний кадр (для замеров скорости). */
  lastDrawMs = 0;
  private readonly graphics: CanvasRenderingContext2D;
  private readonly palette: Palette = readPalette();
  private readonly context: ToolContext;
  private gesture: Gesture | null = null;
  private panFrom: { x: number; y: number } | null = null;
  private frameRequested = false;

  constructor(private readonly store: ProjectStore) {
    this.element = document.createElement("canvas");
    this.element.className = "piano-roll-canvas";
    const graphics = this.element.getContext("2d", { alpha: false });
    if (!graphics) throw new Error("Холст не поддерживает рисование 2D");
    this.graphics = graphics;
    this.context = { store, viewport: this.viewport };

    new ResizeObserver(() => this.resize()).observe(this.element);
    this.element.addEventListener("pointerdown", (event) => this.onPointerDown(event));
    this.element.addEventListener("pointermove", (event) => this.onPointerMove(event));
    this.element.addEventListener("pointerup", (event) => this.onPointerUp(event));
    this.element.addEventListener("lostpointercapture", (event) => this.onPointerUp(event));
    // Правая кнопка стирает ноты — меню браузера тут не нужно.
    this.element.addEventListener("contextmenu", (event) => event.preventDefault());
    this.element.addEventListener("wheel", (event) => this.onWheel(event), { passive: false });
    store.subscribe(() => this.requestFrame());
  }

  /** Прервать жест (Esc). true — жест был и прерван. */
  cancelGesture(): boolean {
    if (!this.gesture) return false;
    this.gesture.cancel();
    this.gesture = null;
    this.requestFrame();
    return true;
  }

  /** Показать все ноты канала; если нот нет — начало паттерна вокруг START_KEY. */
  showAllNotes(): void {
    const notes = this.store.editableNotes;
    if (notes.length === 0) {
      this.viewport.scrollTick = 0;
      this.viewport.centerKey(START_KEY);
    } else {
      const start = Math.min(...notes.map((note) => note.start));
      const end = Math.max(...notes.map((note) => note.start + note.length));
      const low = Math.min(...notes.map((note) => note.key));
      const high = Math.max(...notes.map((note) => note.key));
      this.viewport.showRange(start, end, low, high);
    }
    this.requestFrame();
  }

  requestFrame(): void {
    if (this.frameRequested) return;
    this.frameRequested = true;
    requestAnimationFrame(() => {
      this.frameRequested = false;
      this.draw();
    });
  }

  private draw(): void {
    const started = performance.now();
    const { graphics, viewport, store, palette } = this;
    const project = store.project;
    drawGrid(graphics, viewport, project, snapStep(project, store.editorPreferences.snapId), palette);
    drawNotes(graphics, viewport, store.editableNotes, store.selectedNoteIds, palette);
    const box = this.gesture?.selectionBox?.();
    if (box) drawSelectionBox(graphics, viewport, box, palette);
    drawKeyboard(graphics, viewport, palette);
    drawRuler(graphics, viewport, project, palette);
    this.lastDrawMs = performance.now() - started;
  }

  // Холст хранит пиксели экрана, а не CSS-пиксели: на мониторе с масштабом 150 %
  // их в полтора раза больше. Иначе на HiDPI всё было бы мыльным.
  private resize(): void {
    const ratio = window.devicePixelRatio || 1;
    const width = this.element.clientWidth;
    const height = this.element.clientHeight;
    const firstLayout = this.viewport.width === 0;
    this.element.width = Math.round(width * ratio);
    this.element.height = Math.round(height * ratio);
    this.graphics.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.viewport.resize(width, height);
    if (firstLayout) this.viewport.centerKey(START_KEY);
    this.draw();
  }

  private onPointerDown(event: PointerEvent): void {
    if (this.gesture) return;
    this.element.setPointerCapture(event.pointerId);
    const pointer = pointerFrom(event);
    if (event.button === MIDDLE_BUTTON) {
      // Средняя кнопка — тянуть вид рукой.
      this.panFrom = { x: pointer.x, y: pointer.y };
      this.element.style.cursor = "grabbing";
      return;
    }
    this.gesture = TOOLS[this.store.editorPreferences.tool].press(pointer, this.context);
    this.requestFrame();
  }

  private onPointerMove(event: PointerEvent): void {
    const pointer = pointerFrom(event);
    if (this.panFrom) {
      this.viewport.scrollBy(this.panFrom.x - pointer.x, this.panFrom.y - pointer.y);
      this.panFrom = { x: pointer.x, y: pointer.y };
      this.requestFrame();
    } else if (this.gesture) {
      this.gesture.move(pointer);
      this.requestFrame();
    } else {
      this.element.style.cursor = TOOLS[this.store.editorPreferences.tool].cursor(pointer, this.context);
    }
  }

  private onPointerUp(event: PointerEvent): void {
    if (this.panFrom) {
      this.panFrom = null;
      this.element.style.cursor = "";
      return;
    }
    const gesture = this.gesture;
    if (!gesture) return;
    this.gesture = null;
    gesture.end(pointerFrom(event));
    this.requestFrame();
  }

  // Колесо — вверх/вниз, Shift + колесо — вбок, Ctrl + колесо — масштаб
  // по времени, Alt + колесо — высота строк.
  private onWheel(event: WheelEvent): void {
    event.preventDefault();
    const pointer = pointerFrom(event);
    const factor = event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
    if (event.ctrlKey) this.viewport.zoomHorizontally(factor, pointer.x);
    else if (event.altKey) this.viewport.zoomVertically(factor, pointer.y);
    else if (event.shiftKey) this.viewport.scrollBy(event.deltaY, 0);
    else this.viewport.scrollBy(event.deltaX, event.deltaY);
    this.requestFrame();
  }
}

function pointerFrom(event: MouseEvent): PointerInput {
  return {
    x: event.offsetX,
    y: event.offsetY,
    button: event.button,
    ctrlKey: event.ctrlKey || event.metaKey,
    shiftKey: event.shiftKey,
    altKey: event.altKey,
  };
}
