// Тесты project.json: сохранение и чтение, проверка испорченных файлов.

import { describe, expect, it } from "vitest";
import { parseProjectText, serializeProject } from "../src/files/projectFormat";
import { addChannel } from "../src/model/channelEdits";
import { createChannel, createNote, createProject } from "../src/model/create";
import { addNotes } from "../src/model/noteEdits";
import type { Project } from "../src/model/types";

function richProject(noteCount = 3): Project {
  let project = createProject({ project: "Тест «кавычки» и ё" });
  const bass = createChannel("Бас", 1);
  project = addChannel(project, bass);
  const patternId = project.patterns[0]?.id ?? "";
  const notes = Array.from({ length: noteCount }, (_, index) =>
    createNote({
      channelId: index % 2 === 0 ? (project.channels[0]?.id ?? "") : bass.id,
      key: 36 + (index % 60),
      start: index * 120,
      length: 240,
      velocity: 1 + (index % 127),
      muted: index % 5 === 0,
      colorGroup: index % 16,
    }),
  );
  return addNotes(project, patternId, notes);
}

/** Разобрать сохранённый текст, поправить его и собрать обратно — так имитируется испорченный файл. */
function corrupt(project: Project, change: (document: { project: Record<string, unknown> }) => void): string {
  const document = JSON.parse(serializeProject(project, "0.0.10a"));
  change(document);
  return JSON.stringify(document);
}

describe("project.json", () => {
  it("сохранённый проект читается обратно без потерь", () => {
    const project = richProject();
    const loaded = parseProjectText(serializeProject(project, "0.0.10a"));
    expect(loaded).toEqual({ ok: true, project, upgradedFromVersion: null });
  });

  it("в файле есть метка, версия формата и версия программы", () => {
    const document = JSON.parse(serializeProject(createProject(), "0.0.10a"));
    expect(document.format).toBe("miliplain-project");
    expect(document.formatVersion).toBe(1);
    expect(document.savedBy).toEqual({ app: "MiliPlain", version: "0.0.10a" });
  });

  it("5000 нот сохраняются и читаются быстрее секунды", () => {
    const project = richProject(5000);
    const started = performance.now();
    const loaded = parseProjectText(serializeProject(project, "0.0.10a"));
    expect(loaded.ok).toBe(true);
    expect(performance.now() - started).toBeLessThan(1000);
  });

  it("не JSON — понятная ошибка", () => {
    expect(parseProjectText("{ это не json")).toEqual({
      ok: false,
      errors: ["Файл повреждён: project.json не читается."],
    });
  });

  it("чужой JSON — «это не файл проекта»", () => {
    const result = parseProjectText(JSON.stringify({ hello: "world" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/не файл проекта MiliPlain/);
  });

  it("ошибки называют место в файле", () => {
    const text = corrupt(richProject(), (document) => {
      const patterns = document.project.patterns as { notes: { key: number; velocity: number }[] }[];
      const notes = patterns[0]?.notes ?? [];
      if (notes[1]) notes[1].key = 200;
      if (notes[2]) notes[2].velocity = 0;
      document.project.tempo = "быстро";
    });
    const result = parseProjectText(text);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("project.patterns[0].notes[1].key: нужно целое число от 0 до 127");
      expect(result.errors).toContain("project.patterns[0].notes[2].velocity: нужно целое число от 1 до 127");
      expect(result.errors).toContain("project.tempo: нужно число от 10 до 999");
    }
  });

  it("нота с несуществующим каналом не пропускается", () => {
    const text = corrupt(richProject(), (document) => {
      const patterns = document.project.patterns as { notes: { channelId: string }[] }[];
      const note = patterns[0]?.notes[0];
      if (note) note.channelId = "пропавший-канал";
    });
    const result = parseProjectText(text);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/notes\[0\]\.channelId: такого канала нет/);
  });

  it("повторяющиеся номера не пропускаются", () => {
    const text = corrupt(richProject(), (document) => {
      const patterns = document.project.patterns as { notes: { id: string }[] }[];
      const notes = patterns[0]?.notes ?? [];
      if (notes[0] && notes[1]) notes[1].id = notes[0].id;
    });
    const result = parseProjectText(text);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/уже встречался/);
  });

  it("лишние поля в файле не попадают в программу", () => {
    const text = corrupt(createProject(), (document) => {
      document.project.unknownField = "что-то из будущего";
    });
    const result = parseProjectText(text);
    expect(result.ok).toBe(true);
    if (result.ok) expect("unknownField" in result.project).toBe(false);
  });

  it("испорченный файл показывает не больше 20 ошибок", () => {
    const text = corrupt(richProject(100), (document) => {
      const patterns = document.project.patterns as { notes: { key: number }[] }[];
      for (const note of patterns[0]?.notes ?? []) note.key = -1;
    });
    const result = parseProjectText(text);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toHaveLength(20);
  });
});
