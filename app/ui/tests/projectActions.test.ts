// Тесты сохранения и открытия проекта: порядок шагов, вопросы про
// несохранённое, ошибки диска. Оболочка поддельная (fakeHost.ts).

import { beforeEach, describe, expect, it } from "vitest";
import { type Notice, ProjectActions } from "../src/app/projectActions";
import { AutosaveScheduler } from "../src/files/autosaveScheduler";
import { serializeProject } from "../src/files/projectFormat";
import { createProject } from "../src/model/create";
import { setTempo } from "../src/model/projectEdits";
import { ProjectStore } from "../src/state/projectStore";
import { FakeHost } from "./fakeHost";

let host: FakeHost;
let store: ProjectStore;
let notices: Notice[];
let actions: ProjectActions;

beforeEach(() => {
  host = new FakeHost();
  store = new ProjectStore(createProject({ project: "Трек" }));
  notices = [];
  const autosave = new AutosaveScheduler({
    currentProject: () => store.project,
    writeBackup: (project) => actions.writeBackup(project),
    reportError: () => {},
  });
  actions = new ProjectActions({
    store,
    host,
    autosave,
    appVersion: "0.0.10a",
    notify: (notice) => notices.push(notice),
  });
});

function changeTempo(tempo: number): void {
  store.edit("Темп", (project) => setTempo(project, tempo));
}

describe("сохранение", () => {
  it("первое сохранение спрашивает путь, следующее — нет", async () => {
    changeTempo(140);
    host.nextSavePath = "C:/Музыка/Трек.mpj";
    expect(await actions.save()).toBe(true);
    expect(store.isDirty).toBe(false);
    expect(store.filePath).toBe("C:/Музыка/Трек.mpj");

    changeTempo(150);
    expect(await actions.save()).toBe(true);
    expect(host.calls.filter((call) => call === "showSaveProjectDialog")).toHaveLength(1);
    expect(host.files.get("C:/Музыка/Трек.mpj")).toContain('"tempo": 150');
  });

  it("«Отмена» в окне сохранения — проект остаётся несохранённым", async () => {
    changeTempo(140);
    host.nextSavePath = null;
    expect(await actions.save()).toBe(false);
    expect(store.isDirty).toBe(true);
  });

  it("ошибка диска показывается, программа продолжает работать", async () => {
    host.nextSavePath = "C:/Трек.mpj";
    await actions.save();
    changeTempo(140);
    host.failNextWrite = "Диск переполнен";
    expect(await actions.save()).toBe(false);
    expect(store.isDirty).toBe(true);
    expect(notices.at(-1)).toMatchObject({ kind: "error", details: ["Диск переполнен"] });
  });
});

describe("открытие", () => {
  it("открытый проект заменяет текущий, история очищается", async () => {
    const other = createProject({ project: "Другой" });
    host.files.set("D:/Другой.mpj", serializeProject(other, "0.0.10a"));
    host.nextOpenPath = "D:/Другой.mpj";
    await actions.openProject();
    expect(store.project).toEqual(other);
    expect(store.filePath).toBe("D:/Другой.mpj");
    expect(store.canUndo).toBe(false);
  });

  it("испорченный файл не открывается, текущий проект не тронут", async () => {
    const current = store.project;
    host.files.set("D:/битый.mpj", "{ мусор");
    host.nextOpenPath = "D:/битый.mpj";
    await actions.openProject();
    expect(store.project).toBe(current);
    expect(notices.at(-1)?.kind).toBe("error");
  });

  it("при несохранённом сначала спрашивает; «Отмена» — ничего не открывается", async () => {
    changeTempo(140);
    host.saveChangesAnswer = "cancel";
    await actions.openProject();
    expect(host.calls).toEqual(["askSaveChanges"]);
    expect(store.project.tempo).toBe(140);
  });

  it("«Сохранить» в вопросе — сначала сохраняет, потом открывает", async () => {
    changeTempo(140);
    host.saveChangesAnswer = "save";
    host.nextSavePath = "C:/Трек.mpj";
    host.files.set("D:/Другой.mpj", serializeProject(createProject({ project: "Другой" }), "0.0.10a"));
    host.nextOpenPath = "D:/Другой.mpj";
    await actions.openProject();
    expect(host.files.get("C:/Трек.mpj")).toContain('"tempo": 140');
    expect(store.project.name).toBe("Другой");
  });
});

describe("резервные копии и закрытие", () => {
  it("резервная копия открывается как несохранённый новый проект", async () => {
    changeTempo(133);
    await actions.writeBackup(store.project);
    const backup = host.backups[0];
    if (!backup) throw new Error("копия не записана");
    changeTempo(90);
    host.saveChangesAnswer = "discard";
    await actions.openBackup(backup);
    expect(store.project.tempo).toBe(133);
    expect(store.filePath).toBeNull();
  });

  it("крестик при несохранённом: «Выбросить» — окно закрывается", async () => {
    changeTempo(140);
    host.saveChangesAnswer = "discard";
    await actions.handleCloseRequest();
    expect(host.closed).toBe(true);
  });

  it("крестик при несохранённом: «Отмена» — окно остаётся", async () => {
    changeTempo(140);
    host.saveChangesAnswer = "cancel";
    await actions.handleCloseRequest();
    expect(host.closed).toBe(false);
  });
});
