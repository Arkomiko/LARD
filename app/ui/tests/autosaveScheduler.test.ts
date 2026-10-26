// Тесты автосохранения. Время подделано (vi.useFakeTimers), чтобы не ждать
// настоящие пять минут.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AutosaveScheduler } from "../src/files/autosaveScheduler";
import { createProject } from "../src/model/create";
import { setTempo } from "../src/model/projectEdits";
import type { Project } from "../src/model/types";

let project: Project;
let written: Project[];
let errors: unknown[];
let scheduler: AutosaveScheduler;

beforeEach(() => {
  vi.useFakeTimers();
  project = createProject();
  written = [];
  errors = [];
  scheduler = new AutosaveScheduler({
    currentProject: () => project,
    writeBackup: async (version) => {
      written.push(version);
    },
    reportError: (error) => errors.push(error),
  });
  scheduler.markBackedUp(project);
});

afterEach(() => {
  scheduler.stop();
  vi.useRealTimers();
});

describe("автосохранение", () => {
  it("раз в 5 минут, только если проект изменился", async () => {
    scheduler.start(5);
    await vi.advanceTimersByTimeAsync(5 * 60_000);
    expect(written).toHaveLength(0);

    project = setTempo(project, 140);
    await vi.advanceTimersByTimeAsync(4 * 60_000);
    expect(written).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(written).toEqual([project]);

    await vi.advanceTimersByTimeAsync(5 * 60_000);
    expect(written).toHaveLength(1);
  });

  it("интервал 0 выключает автосохранение", async () => {
    scheduler.start(0);
    project = setTempo(project, 140);
    await vi.advanceTimersByTimeAsync(60 * 60_000);
    expect(written).toHaveLength(0);
  });

  it("смена интервала в настройках применяется сразу", async () => {
    scheduler.start(5);
    scheduler.start(1);
    project = setTempo(project, 140);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(written).toHaveLength(1);
  });

  it("ошибка записи сообщается, а следующая попытка будет", async () => {
    const failing = new AutosaveScheduler({
      currentProject: () => project,
      writeBackup: async () => {
        throw new Error("нет места");
      },
      reportError: (error) => errors.push(error),
    });
    project = setTempo(project, 140);
    expect(await failing.backupNow()).toBe(false);
    expect(errors).toHaveLength(1);
    expect(await failing.backupNow()).toBe(false);
    expect(errors).toHaveLength(2);
  });

  it("сохранённую или открытую версию повторно не копирует", async () => {
    project = setTempo(project, 140);
    scheduler.markBackedUp(project);
    expect(await scheduler.backupNow()).toBe(false);
  });
});
