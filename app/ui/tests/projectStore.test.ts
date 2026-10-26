// Тесты хранилища состояния: правки, история, жесты, «несохранённое», выбор паттерна.

import { describe, expect, it } from "vitest";
import { addChannel, removeChannel } from "../src/model/channelEdits";
import { copyPattern, createChannel, createNote, createProject } from "../src/model/create";
import { addNotes, updateNotes } from "../src/model/noteEdits";
import { addPattern } from "../src/model/patternEdits";
import { setTempo } from "../src/model/projectEdits";
import { ProjectStore } from "../src/state/projectStore";

function newStore(): ProjectStore {
  return new ProjectStore(createProject());
}

function addOneNote(store: ProjectStore, key = 60): string {
  const note = createNote({ channelId: store.project.channels[0]?.id ?? "", key, start: 0, length: 960 });
  store.edit("Добавить ноту", (project) => addNotes(project, store.selectedPatternId, [note]));
  return note.id;
}

describe("хранилище проекта", () => {
  it("правка пишется в историю и отменяется", () => {
    const store = newStore();
    store.edit("Темп", (project) => setTempo(project, 140));
    expect(store.project.tempo).toBe(140);
    expect(store.nextUndoLabel).toBe("Темп");
    store.undo();
    expect(store.project.tempo).toBe(120);
    store.redo();
    expect(store.project.tempo).toBe(140);
  });

  it("правка без изменений не создаёт шаг и не оповещает", () => {
    const store = newStore();
    let notifications = 0;
    store.subscribe(() => notifications++);
    store.edit("Темп", (project) => setTempo(project, 120));
    expect(store.canUndo).toBe(false);
    expect(notifications).toBe(0);
  });

  it("одна правка — одно оповещение подписчиков", () => {
    const store = newStore();
    let notifications = 0;
    store.subscribe(() => notifications++);
    addOneNote(store);
    expect(notifications).toBe(1);
  });

  it("жест (перетаскивание) — много правок, один шаг истории", () => {
    const store = newStore();
    const noteId = addOneNote(store);
    store.beginGesture("Переместить ноту");
    for (let step = 1; step <= 10; step++) {
      store.edit("ход", (project) =>
        updateNotes(project, store.selectedPatternId, new Map([[noteId, { start: step * 96 }]])),
      );
    }
    store.endGesture();
    expect(store.selectedPattern.notes[0]?.start).toBe(960);
    expect(store.nextUndoLabel).toBe("Переместить ноту");
    store.undo();
    expect(store.selectedPattern.notes[0]?.start).toBe(0);
    expect(store.nextUndoLabel).toBe("Добавить ноту");
  });

  it("отмена жеста возвращает всё как было и не пишет историю", () => {
    const store = newStore();
    const noteId = addOneNote(store);
    store.beginGesture("Переместить ноту");
    store.edit("ход", (project) =>
      updateNotes(project, store.selectedPatternId, new Map([[noteId, { key: 72 }]])),
    );
    store.cancelGesture();
    expect(store.selectedPattern.notes[0]?.key).toBe(60);
    expect(store.nextUndoLabel).toBe("Добавить ноту");
  });

  it("«несохранённое» знает, что отмена вернула проект к сохранённому", () => {
    const store = newStore();
    expect(store.isDirty).toBe(false);
    addOneNote(store);
    expect(store.isDirty).toBe(true);
    store.markSaved("C:/Музыка/трек.mpj");
    expect(store.isDirty).toBe(false);
    expect(store.filePath).toBe("C:/Музыка/трек.mpj");
    addOneNote(store, 62);
    store.undo();
    expect(store.isDirty).toBe(false);
  });

  it("если выбранный паттерн исчез после отмены — выбирается первый", () => {
    const store = newStore();
    const firstId = store.selectedPatternId;
    const copy = copyPattern(store.selectedPattern, "Копия");
    store.edit("Дублировать паттерн", (project) => addPattern(project, copy, firstId));
    store.selectPattern(copy.id);
    expect(store.selectedPatternId).toBe(copy.id);
    store.undo();
    expect(store.selectedPatternId).toBe(firstId);
  });

  it("удалили выбранный канал — выбирается первый", () => {
    const store = newStore();
    const bass = createChannel("Бас", 1);
    store.edit("Добавить канал", (project) => addChannel(project, bass));
    store.selectChannel(bass.id);
    expect(store.selectedChannel.name).toBe("Бас");
    store.edit("Удалить канал", (project) => removeChannel(project, bass.id));
    expect(store.selectedChannelId).toBe(store.project.channels[0]?.id);
  });

  it("правка и выбор нового паттерна — одно оповещение (урок LARD про мигание)", () => {
    const store = newStore();
    let notifications = 0;
    store.subscribe(() => notifications++);
    const copy = copyPattern(store.selectedPattern, "Копия");
    store.edit("Дублировать паттерн", (project) => addPattern(project, copy), { patternId: copy.id });
    expect(store.selectedPatternId).toBe(copy.id);
    expect(notifications).toBe(1);
  });

  it("выделение нот: только ноты выбранного канала, снимается при смене паттерна", () => {
    const store = newStore();
    const first = addOneNote(store, 60);
    const second = addOneNote(store, 62);
    store.selectNotes([first, second, "нет-такой"]);
    expect([...store.selectedNoteIds].sort()).toEqual([first, second].sort());
    const copy = copyPattern(store.selectedPattern, "Копия");
    store.edit("Дублировать паттерн", (project) => addPattern(project, copy), { patternId: copy.id });
    expect(store.selectedNoteIds.size).toBe(0);
  });

  it("удалённые ноты сами выпадают из выделения, отмена не возвращает выделение", () => {
    const store = newStore();
    const noteId = addOneNote(store);
    store.selectNotes([noteId]);
    store.undo();
    expect(store.selectedNoteIds.size).toBe(0);
    expect(store.canUndo).toBe(false);
  });

  it("ноты другого канала не видны пианороллу и не выделяются", () => {
    const store = newStore();
    addOneNote(store, 60);
    const bass = createChannel("Бас", 1);
    store.edit("Добавить канал", (project) => addChannel(project, bass), { channelId: bass.id });
    expect(store.editableNotes).toHaveLength(0);
    store.selectNotes(store.selectedPattern.notes.map((note) => note.id));
    expect(store.selectedNoteIds.size).toBe(0);
  });

  it("настройки редактора меняются без истории; без изменений — без оповещения", () => {
    const store = newStore();
    let notifications = 0;
    store.subscribe(() => notifications++);
    store.setEditorPreferences({ tool: "select", snapId: "beat" });
    store.setEditorPreferences({ tool: "select" });
    expect(store.editorPreferences.tool).toBe("select");
    expect(notifications).toBe(1);
    expect(store.canUndo).toBe(false);
  });

  it("выбор паттерна не попадает в историю", () => {
    const store = newStore();
    const copy = copyPattern(store.selectedPattern, "Копия");
    store.edit("Дублировать паттерн", (project) => addPattern(project, copy));
    store.selectPattern(copy.id);
    store.undo();
    expect(store.canUndo).toBe(false);
  });

  it("открытие проекта очищает историю и считает его сохранённым", () => {
    const store = newStore();
    addOneNote(store);
    const opened = createProject({ project: "Открытый" });
    store.loadProject(opened, "D:/проект.mpj");
    expect(store.project).toBe(opened);
    expect(store.canUndo).toBe(false);
    expect(store.isDirty).toBe(false);
    expect(store.selectedPatternId).toBe(opened.patterns[0]?.id);
  });

  it("лимит истории из настроек применяется сразу", () => {
    const store = newStore();
    for (let tempo = 121; tempo <= 140; tempo++) store.edit("Темп", (project) => setTempo(project, tempo));
    store.setUndoLimit(5);
    for (let step = 0; step < 10; step++) store.undo();
    expect(store.project.tempo).toBe(135);
  });
});
