// Тесты команд над выделенными нотами.

import { beforeEach, describe, expect, it } from "vitest";
import { addChannel } from "../src/model/channelEdits";
import { createChannel, createNote, createProject } from "../src/model/create";
import { addNotes } from "../src/model/noteEdits";
import {
  copySelectedNotes,
  cutSelectedNotes,
  deleteSelectedNotes,
  duplicateSelectedNotes,
  NoteClipboard,
  nudgeSelectedNotes,
  pasteNotes,
  quantizeSelectedNotes,
  selectAllNotes,
  transposeSelectedNotes,
} from "../src/pianoRoll/noteCommands";
import { ProjectStore } from "../src/state/projectStore";

let store: ProjectStore;
let clipboard: NoteClipboard;

beforeEach(() => {
  store = new ProjectStore(createProject());
  clipboard = new NoteClipboard();
  const notes = [
    { key: 60, start: 0, length: 960 },
    { key: 64, start: 960, length: 480 },
    { key: 67, start: 1440, length: 470 },
  ].map((note) => createNote({ channelId: store.selectedChannelId, ...note }));
  store.edit("подготовка", (project) => addNotes(project, store.selectedPatternId, notes));
});

const keys = () => store.editableNotes.map((note) => note.key);
const starts = () => store.editableNotes.map((note) => note.start);

describe("команды над нотами", () => {
  it("выделить всё и удалить выделенное — одним шагом", () => {
    selectAllNotes(store);
    expect(store.selectedNoteIds.size).toBe(3);
    deleteSelectedNotes(store);
    expect(store.editableNotes).toHaveLength(0);
    store.undo();
    expect(store.editableNotes).toHaveLength(3);
  });

  it("копировать и вставить: на те же места, новые номера, вставленное выделено", () => {
    selectAllNotes(store);
    const originalIds = [...store.selectedNoteIds];
    copySelectedNotes(store, clipboard);
    pasteNotes(store, clipboard);
    expect(store.editableNotes).toHaveLength(6);
    expect(starts().slice(3)).toEqual([0, 960, 1440]);
    expect([...store.selectedNoteIds].some((id) => originalIds.includes(id))).toBe(false);
    expect(store.selectedNoteIds.size).toBe(3);
  });

  it("вставка идёт в выбранный канал", () => {
    selectAllNotes(store);
    copySelectedNotes(store, clipboard);
    const bass = createChannel("Бас", 1);
    store.edit("канал", (project) => addChannel(project, bass), { channelId: bass.id });
    pasteNotes(store, clipboard);
    expect(store.editableNotes.map((note) => note.channelId)).toEqual([bass.id, bass.id, bass.id]);
  });

  it("вырезать — скопировать и удалить", () => {
    selectAllNotes(store);
    cutSelectedNotes(store, clipboard);
    expect(store.editableNotes).toHaveLength(0);
    pasteNotes(store, clipboard);
    expect(keys()).toEqual([60, 64, 67]);
  });

  it("дублировать — копия сразу справа, сдвиг округлён до шага сетки", () => {
    selectAllNotes(store);
    duplicateSelectedNotes(store);
    // Выделение от 0 до 1910 тиков, шаг сетки 240 → сдвиг 1920.
    expect(starts().slice(3)).toEqual([1920, 2880, 3360]);
  });

  it("транспонирование на октаву; группа не вылезает за 127", () => {
    selectAllNotes(store);
    transposeSelectedNotes(store, 12);
    expect(keys()).toEqual([72, 76, 79]);
    transposeSelectedNotes(store, 100);
    expect(keys()).toEqual([120, 124, 127]);
  });

  it("сдвиг стрелками — на шаг сетки", () => {
    selectAllNotes(store);
    nudgeSelectedNotes(store, 1);
    expect(starts()).toEqual([240, 1200, 1680]);
    nudgeSelectedNotes(store, -1);
    nudgeSelectedNotes(store, -1);
    expect(starts()).toEqual([0, 960, 1440]);
  });

  it("квантизация без выделения — все ноты канала", () => {
    store.edit("сбить", (project) =>
      addNotes(project, store.selectedPatternId, [
        createNote({ channelId: store.selectedChannelId, key: 70, start: 1000, length: 100 }),
      ]),
    );
    store.setEditorPreferences({ snapId: "beat" });
    quantizeSelectedNotes(store);
    expect(starts()).toEqual([0, 960, 1920, 960]);
  });

  it("квантизация без привязки к сетке ничего не делает", () => {
    store.setEditorPreferences({ snapId: "none" });
    const before = store.project;
    quantizeSelectedNotes(store);
    expect(store.project).toBe(before);
  });

  it("команды без выделения ничего не делают и не пишут историю", () => {
    const before = store.project;
    deleteSelectedNotes(store);
    transposeSelectedNotes(store, 1);
    duplicateSelectedNotes(store);
    expect(store.project).toBe(before);
    expect(store.nextUndoLabel).toBe("подготовка");
  });
});
