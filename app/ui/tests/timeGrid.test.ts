// Тесты музыкальной сетки и групповых правок нот.

import { describe, expect, it } from "vitest";
import { createNote, createProject } from "../src/model/create";
import { addNotes } from "../src/model/noteEdits";
import { quantizeNotes, resizeNotes, shiftNotes } from "../src/model/noteGroupEdits";
import { setTimeSignature } from "../src/model/projectEdits";
import { snapDown, snapNearest, snapStep, snapUp, ticksPerBar, ticksPerBeat } from "../src/model/timeGrid";
import type { Note, Project } from "../src/model/types";

describe("сетка", () => {
  it("в 4/4 доля — четверть, такт — 4 доли", () => {
    const project = createProject();
    expect(ticksPerBeat(project)).toBe(960);
    expect(ticksPerBar(project)).toBe(3840);
  });

  it("в 6/8 доля — восьмая, такт — 6 восьмых", () => {
    const project = setTimeSignature(createProject(), 6, 8);
    expect(ticksPerBeat(project)).toBe(480);
    expect(ticksPerBar(project)).toBe(2880);
  });

  it("шаги привязки: такт, доля, шаг FL, триоли, без привязки", () => {
    const project = createProject();
    expect(snapStep(project, "bar")).toBe(3840);
    expect(snapStep(project, "beat")).toBe(960);
    expect(snapStep(project, "quarter-beat")).toBe(240);
    expect(snapStep(project, "third-beat")).toBe(320);
    expect(snapStep(project, "none")).toBeNull();
  });

  it("привязка вниз, к ближайшей и вверх", () => {
    expect(snapDown(479, 240)).toBe(240);
    expect(snapNearest(479, 240)).toBe(480);
    expect(snapNearest(359, 240)).toBe(240);
    expect(snapUp(241, 240)).toBe(480);
    expect(snapDown(479.6, null)).toBe(480);
  });
});

function projectWith(notes: { key: number; start: number; length: number }[]): {
  project: Project;
  notes: Note[];
} {
  let project = createProject();
  const channelId = project.channels[0]?.id ?? "";
  const created = notes.map((note) => createNote({ channelId, ...note }));
  project = addNotes(project, project.patterns[0]?.id ?? "", created);
  return { project, notes: created };
}

function patternNotes(project: Project): readonly Note[] {
  return project.patterns[0]?.notes ?? [];
}

describe("правки группы нот", () => {
  it("сдвиг группы во времени и по высоте", () => {
    const { project, notes } = projectWith([
      { key: 60, start: 960, length: 240 },
      { key: 64, start: 1200, length: 240 },
    ]);
    const shifted = shiftNotes(project, project.patterns[0]?.id ?? "", notes, 480, 2);
    expect(patternNotes(shifted).map((note) => [note.start, note.key])).toEqual([
      [1440, 62],
      [1680, 66],
    ]);
  });

  it("группа упирается в начало паттерна целиком", () => {
    const { project, notes } = projectWith([
      { key: 60, start: 100, length: 240 },
      { key: 64, start: 500, length: 240 },
    ]);
    const shifted = shiftNotes(project, project.patterns[0]?.id ?? "", notes, -1000, 0);
    expect(patternNotes(shifted).map((note) => note.start)).toEqual([0, 400]);
  });

  it("аккорд не сплющивается о край клавиатуры", () => {
    const { project, notes } = projectWith([
      { key: 120, start: 0, length: 240 },
      { key: 125, start: 0, length: 240 },
    ]);
    const shifted = shiftNotes(project, project.patterns[0]?.id ?? "", notes, 0, 10);
    expect(patternNotes(shifted).map((note) => note.key)).toEqual([122, 127]);
  });

  it("растяжение группы, но не короче минимума", () => {
    const { project, notes } = projectWith([
      { key: 60, start: 0, length: 960 },
      { key: 62, start: 0, length: 300 },
    ]);
    const resized = resizeNotes(project, project.patterns[0]?.id ?? "", notes, -480, 240);
    expect(patternNotes(resized).map((note) => note.length)).toEqual([480, 240]);
  });

  it("квантизация двигает начала к ближайшей линии, длину не трогает", () => {
    const { project, notes } = projectWith([
      { key: 60, start: 230, length: 100 },
      { key: 62, start: 370, length: 100 },
      { key: 64, start: 480, length: 100 },
    ]);
    const quantized = quantizeNotes(project, project.patterns[0]?.id ?? "", notes, 240);
    expect(patternNotes(quantized).map((note) => [note.start, note.length])).toEqual([
      [240, 100],
      [480, 100],
      [480, 100],
    ]);
  });

  it("квантизация уже ровных нот ничего не меняет", () => {
    const { project, notes } = projectWith([{ key: 60, start: 480, length: 100 }]);
    expect(quantizeNotes(project, project.patterns[0]?.id ?? "", notes, 240)).toBe(project);
  });
});
