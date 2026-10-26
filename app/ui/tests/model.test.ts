// Тесты модели проекта: создание объектов и правки.

import { describe, expect, it } from "vitest";
import { addChannel, removeChannel, renameChannel, setChannelMidiChannel } from "../src/model/channelEdits";
import { copyPattern, createChannel, createNote, createPattern, createProject } from "../src/model/create";
import { addNotes, removeNotes, updateNotes } from "../src/model/noteEdits";
import { addPattern, removePattern, renamePattern } from "../src/model/patternEdits";
import { renameProject, setTempo, setTimeSignature } from "../src/model/projectEdits";
import type { Project } from "../src/model/types";

function firstChannelId(project: Project): string {
  const channel = project.channels[0];
  if (!channel) throw new Error("в проекте нет каналов");
  return channel.id;
}

function firstPatternId(project: Project): string {
  const pattern = project.patterns[0];
  if (!pattern) throw new Error("в проекте нет паттернов");
  return pattern.id;
}

describe("создание проекта", () => {
  it("новый проект: один канал, один пустой паттерн, 120 BPM, 4/4", () => {
    const project = createProject();
    expect(project.channels).toHaveLength(1);
    expect(project.patterns).toHaveLength(1);
    expect(project.patterns[0]?.notes).toHaveLength(0);
    expect(project.tempo).toBe(120);
    expect(project.timeSignature).toEqual({ numerator: 4, denominator: 4 });
    expect(project.ticksPerQuarter).toBe(960);
  });

  it("имена приходят от интерфейса на языке пользователя", () => {
    const project = createProject({ project: "Мой трек", channel: "Пианино", pattern: "Куплет" });
    expect(project.name).toBe("Мой трек");
    expect(project.channels[0]?.name).toBe("Пианино");
    expect(project.patterns[0]?.name).toBe("Куплет");
  });

  it("у каждого объекта свой номер", () => {
    const first = createProject();
    const second = createProject();
    expect(first.id).not.toBe(second.id);
    expect(first.channels[0]?.id).not.toBe(second.channels[0]?.id);
  });
});

describe("нота", () => {
  it("значения за границами приводятся к допустимым", () => {
    const note = createNote({ channelId: "c", key: 200, start: -5, length: 0, velocity: 0, colorGroup: 99 });
    expect(note).toMatchObject({ key: 127, start: 0, length: 1, velocity: 1, colorGroup: 15, muted: false });
  });

  it("дробные тики округляются, velocity по умолчанию 100", () => {
    const note = createNote({ channelId: "c", key: 60.4, start: 10.6, length: 479.5 });
    expect(note).toMatchObject({ key: 60, start: 11, length: 480, velocity: 100 });
  });
});

describe("правки проекта", () => {
  it("темп ограничен 10…999 и хранится до сотых", () => {
    const project = createProject();
    expect(setTempo(project, 5).tempo).toBe(10);
    expect(setTempo(project, 5000).tempo).toBe(999);
    expect(setTempo(project, 128.4567).tempo).toBe(128.46);
  });

  it("правка без изменений возвращает тот же объект", () => {
    const project = createProject();
    expect(setTempo(project, 120)).toBe(project);
    expect(renameProject(project, project.name)).toBe(project);
    expect(renameProject(project, "   ")).toBe(project);
  });

  it("размер: недопустимый знаменатель не принимается", () => {
    const project = createProject();
    expect(setTimeSignature(project, 7, 8).timeSignature).toEqual({ numerator: 7, denominator: 8 });
    expect(setTimeSignature(project, 3, 5)).toBe(project);
  });
});

describe("каналы", () => {
  it("добавление, переименование, MIDI-канал в границах 0…15", () => {
    let project = createProject();
    const channel = createChannel("Бас", 1);
    project = addChannel(project, channel);
    project = renameChannel(project, channel.id, "Синт-бас");
    project = setChannelMidiChannel(project, channel.id, 40);
    expect(project.channels[1]).toMatchObject({ name: "Синт-бас", midiChannel: 15 });
  });

  it("удаление канала убирает его ноты во всех паттернах", () => {
    let project = createProject();
    const bass = createChannel("Бас", 1);
    project = addChannel(project, bass);
    const second = createPattern("Второй");
    project = addPattern(project, second);
    const keep = createNote({ channelId: firstChannelId(project), key: 60, start: 0, length: 960 });
    project = addNotes(project, firstPatternId(project), [keep]);
    project = addNotes(project, firstPatternId(project), [
      createNote({ channelId: bass.id, key: 36, start: 0, length: 960 }),
    ]);
    project = addNotes(project, second.id, [
      createNote({ channelId: bass.id, key: 38, start: 0, length: 960 }),
    ]);

    project = removeChannel(project, bass.id);

    expect(project.channels).toHaveLength(1);
    expect(project.patterns[0]?.notes).toEqual([keep]);
    expect(project.patterns[1]?.notes).toHaveLength(0);
  });

  it("последний канал не удаляется", () => {
    const project = createProject();
    expect(removeChannel(project, firstChannelId(project))).toBe(project);
  });
});

describe("паттерны", () => {
  it("копия встаёт сразу после оригинала, у нот новые номера", () => {
    let project = createProject();
    const original = project.patterns[0];
    if (!original) throw new Error("нет паттерна");
    project = addPattern(project, createPattern("В конце"));
    project = addNotes(project, original.id, [
      createNote({ channelId: firstChannelId(project), key: 60, start: 0, length: 960 }),
    ]);
    const source = project.patterns[0];
    if (!source) throw new Error("нет паттерна");

    const copy = copyPattern(source, "Копия");
    project = addPattern(project, copy, source.id);

    expect(project.patterns.map((pattern) => pattern.name)).toEqual(["Pattern 1", "Копия", "В конце"]);
    expect(copy.notes[0]?.key).toBe(60);
    expect(copy.notes[0]?.id).not.toBe(source.notes[0]?.id);
  });

  it("переименование и запрет удалить последний паттерн", () => {
    let project = createProject();
    project = renamePattern(project, firstPatternId(project), "Припев");
    expect(project.patterns[0]?.name).toBe("Припев");
    expect(removePattern(project, firstPatternId(project))).toBe(project);
  });
});

describe("ноты", () => {
  function projectWithNotes(count: number): Project {
    const project = createProject();
    const notes = Array.from({ length: count }, (_, index) =>
      createNote({
        channelId: firstChannelId(project),
        key: 60 + (index % 12),
        start: index * 240,
        length: 240,
      }),
    );
    return addNotes(project, firstPatternId(project), notes);
  }

  it("изменение группы нот одним вызовом", () => {
    const project = projectWithNotes(3);
    const notes = project.patterns[0]?.notes ?? [];
    const changes = new Map(notes.map((note) => [note.id, { start: note.start + 960, velocity: 64 }]));
    const moved = updateNotes(project, firstPatternId(project), changes);
    expect(moved.patterns[0]?.notes.map((note) => note.start)).toEqual([960, 1200, 1440]);
    expect(moved.patterns[0]?.notes.every((note) => note.velocity === 64)).toBe(true);
  });

  it("изменение без разницы возвращает тот же проект", () => {
    const project = projectWithNotes(2);
    const note = project.patterns[0]?.notes[0];
    if (!note) throw new Error("нет ноты");
    expect(updateNotes(project, firstPatternId(project), new Map([[note.id, { key: note.key }]]))).toBe(
      project,
    );
    expect(removeNotes(project, firstPatternId(project), ["нет-такой-ноты"])).toBe(project);
  });

  it("нетронутые паттерны остаются теми же объектами", () => {
    let project = projectWithNotes(2);
    project = addPattern(project, createPattern("Другой"));
    const other = project.patterns[1];
    const note = project.patterns[0]?.notes[0];
    if (!note) throw new Error("нет ноты");
    const changed = removeNotes(project, firstPatternId(project), [note.id]);
    expect(changed.patterns[1]).toBe(other);
    expect(changed.channels).toBe(project.channels);
  });

  it("нота с несуществующим каналом — ошибка", () => {
    const project = createProject();
    const orphan = createNote({ channelId: "нет-такого-канала", key: 60, start: 0, length: 1 });
    expect(() => addNotes(project, firstPatternId(project), [orphan])).toThrow(/несуществующий канал/);
  });

  it("5000 нот добавляются и удаляются быстро", () => {
    const started = performance.now();
    const project = projectWithNotes(5000);
    const ids = project.patterns[0]?.notes.map((note) => note.id) ?? [];
    const emptied = removeNotes(project, firstPatternId(project), ids);
    expect(emptied.patterns[0]?.notes).toHaveLength(0);
    expect(performance.now() - started).toBeLessThan(500);
  });
});
