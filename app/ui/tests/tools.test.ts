// Тесты инструментов пианоролла: нажатия и протяжки мышью → изменения проекта.
// Окно просмотра настоящее, только без экрана: 0.1 пикселя на тик, строка 10 пикселей.

import { beforeEach, describe, expect, it } from "vitest";
import { addChannel } from "../src/model/channelEdits";
import { createChannel, createNote, createProject } from "../src/model/create";
import { addNotes } from "../src/model/noteEdits";
import { TOOLS } from "../src/pianoRoll/tools/tools";
import type { PointerInput, Tool, ToolContext } from "../src/pianoRoll/tools/toolTypes";
import { KEYBOARD_WIDTH, RULER_HEIGHT, Viewport } from "../src/pianoRoll/viewport";
import type { ToolName } from "../src/state/editorPreferences";
import { ProjectStore } from "../src/state/projectStore";

let store: ProjectStore;
let context: ToolContext;

beforeEach(() => {
  store = new ProjectStore(createProject());
  const viewport = new Viewport();
  viewport.pixelsPerTick = 0.1;
  viewport.rowHeight = 10;
  viewport.resize(KEYBOARD_WIDTH + 1000, RULER_HEIGHT + 600);
  viewport.centerKey(60);
  context = { store, viewport };
});

type PointerOptions = Partial<Omit<PointerInput, "x" | "y">>;

/** Точка в середине строки key, на тике tick. */
function at(tick: number, key: number, options: PointerOptions = {}): PointerInput {
  return {
    x: context.viewport.xOf(tick) + 0.5,
    y: context.viewport.yOf(key) + 5,
    button: 0,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    ...options,
  };
}

/** Нажать в from, провести в to за несколько движений, отпустить. */
function drag(toolName: ToolName, from: PointerInput, to: PointerInput = from, steps = 5): void {
  const tool: Tool = TOOLS[toolName];
  const gesture = tool.press(from, context);
  for (let step = 1; step <= steps && to !== from; step++) {
    gesture?.move({
      ...to,
      x: from.x + ((to.x - from.x) * step) / steps,
      y: from.y + ((to.y - from.y) * step) / steps,
    });
  }
  gesture?.end(to);
}

function addNote(key: number, start: number, length = 960): string {
  const note = createNote({ channelId: store.selectedChannelId, key, start, length });
  store.edit("подготовка", (project) => addNotes(project, store.selectedPatternId, [note]));
  return note.id;
}

const notes = () =>
  store.editableNotes.map((note) => ({ key: note.key, start: note.start, length: note.length }));

describe("Draw и метод LARD", () => {
  it("щелчок по пустому месту ставит ноту в клетку сетки; длина — по умолчанию", () => {
    drag("draw", at(1000, 60));
    expect(notes()).toEqual([{ key: 60, start: 960, length: 960 }]);
    expect(store.nextUndoLabel).toBe("Добавить ноту");
  });

  it("поставить и сразу тянуть — один шаг истории", () => {
    drag("draw", at(1000, 60), at(2000, 64));
    expect(notes()).toEqual([{ key: 64, start: 1920, length: 960 }]);
    store.undo();
    expect(notes()).toEqual([]);
  });

  it("перетаскивание ноты прижимает её начало к сетке; Alt отключает привязку", () => {
    addNote(60, 0);
    drag("draw", at(100, 60), at(611, 60));
    expect(notes()[0]?.start).toBe(480);
    drag("draw", at(500, 60), at(637, 60, { altKey: true }));
    expect(notes()[0]?.start).toBe(617);
  });

  it("растягивание за правый край; новая нота берёт эту длину", () => {
    addNote(60, 0, 960);
    drag("draw", at(950, 60), at(1890, 60));
    expect(notes()[0]?.length).toBe(1920);
    drag("draw", at(5000, 62));
    expect(notes()[1]).toEqual({ key: 62, start: 4800, length: 1920 });
  });

  it("правая кнопка удаляет ноту, протяжка стирает несколько — одним шагом", () => {
    addNote(60, 0);
    addNote(60, 1920);
    addNote(60, 3840);
    addNote(64, 0);
    drag("draw", at(100, 60, { button: 2 }), at(4000, 60, { button: 2 }), 20);
    expect(notes()).toEqual([{ key: 64, start: 0, length: 960 }]);
    store.undo();
    expect(notes()).toHaveLength(4);
  });

  it("Ctrl + протяжка в Draw — выделение рамкой, ноты не двигаются", () => {
    addNote(60, 0);
    addNote(62, 960);
    addNote(70, 960);
    drag("draw", at(0, 63, { ctrlKey: true }), at(2000, 59, { ctrlKey: true }));
    expect(store.selectedNoteIds.size).toBe(2);
    expect(notes().map((note) => note.start)).toEqual([0, 960, 960]);
  });

  it("выделенная нота тянет за собой всё выделение", () => {
    const first = addNote(60, 0);
    const second = addNote(64, 960);
    store.selectNotes([first, second]);
    drag("draw", at(100, 60), at(1060, 62));
    expect(notes()).toEqual([
      { key: 62, start: 960, length: 960 },
      { key: 66, start: 1920, length: 960 },
    ]);
  });

  it("ноты другого канала не задеваются", () => {
    addNote(60, 0);
    const bass = createChannel("Бас", 1);
    store.edit("канал", (project) => addChannel(project, bass), { channelId: bass.id });
    drag("draw", at(100, 60, { button: 2 }));
    expect(store.selectedPattern.notes).toHaveLength(1);
  });
});

describe("Paint, Delete, Select", () => {
  it("кисть рисует сплошной ряд нот по протяжке", () => {
    store.setEditorPreferences({ newNoteLength: 480 });
    drag("paint", at(0, 60), at(2000, 60), 2);
    expect(notes().map((note) => note.start)).toEqual([0, 480, 960, 1440, 1920]);
    expect(store.nextUndoLabel).toBe("Нарисовать ноты");
  });

  it("кисть по существующей ноте двигает её, а не рисует", () => {
    addNote(60, 0);
    drag("paint", at(100, 60), at(1060, 60));
    expect(notes()).toEqual([{ key: 60, start: 960, length: 960 }]);
  });

  it("Delete стирает и левой кнопкой", () => {
    addNote(60, 0);
    drag("delete", at(100, 60));
    expect(notes()).toEqual([]);
  });

  it("Select: рамка, Shift добавляет, щелчок по пустому снимает выделение", () => {
    const first = addNote(60, 0);
    const second = addNote(72, 3840);
    drag("select", at(0, 61), at(1000, 59));
    expect([...store.selectedNoteIds]).toEqual([first]);
    drag("select", at(3800, 73, { shiftKey: true }), at(5000, 71, { shiftKey: true }));
    expect(new Set(store.selectedNoteIds)).toEqual(new Set([first, second]));
    drag("select", at(9000, 55));
    expect(store.selectedNoteIds.size).toBe(0);
  });

  it("Select: Ctrl + щелчок по ноте переключает её выделение", () => {
    const first = addNote(60, 0);
    drag("select", at(100, 60, { ctrlKey: true }));
    expect([...store.selectedNoteIds]).toEqual([first]);
    drag("select", at(100, 60, { ctrlKey: true }));
    expect(store.selectedNoteIds.size).toBe(0);
  });

  it("Select: перетаскивание ноты выделяет её и двигает", () => {
    const first = addNote(60, 0);
    drag("select", at(100, 60), at(1060, 60));
    expect([...store.selectedNoteIds]).toEqual([first]);
    expect(notes()[0]?.start).toBe(960);
  });

  it("отмена жеста возвращает всё как было", () => {
    addNote(60, 0);
    const gesture = TOOLS.draw.press(at(100, 60), context);
    gesture?.move(at(3000, 70));
    gesture?.cancel();
    expect(notes()).toEqual([{ key: 60, start: 0, length: 960 }]);
    expect(store.nextUndoLabel).toBe("подготовка");
  });

  it("нажатие на клавиатуру слева или линейку сверху ничего не делает", () => {
    expect(TOOLS.draw.press({ ...at(0, 60), x: 10 }, context)).toBeNull();
    expect(TOOLS.draw.press({ ...at(1000, 60), y: 5 }, context)).toBeNull();
  });
});
