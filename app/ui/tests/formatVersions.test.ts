// Тесты миграций формата: старые файлы должны открываться новыми версиями программы.
//
// Настоящих миграций пока нет (формат один), поэтому механизм проверяется
// на учебных переходах 1 → 2 → 3. Когда появится настоящая миграция,
// сюда добавляется тест с файлом старой версии.

import { describe, expect, it } from "vitest";
import {
  CURRENT_PROJECT_FORMAT_VERSION,
  type Migration,
  migrateProjectDocument,
  projectMigrations,
} from "../src/files/formatVersions";
import { parseProjectText, serializeProject } from "../src/files/projectFormat";
import { createProject } from "../src/model/create";

function documentOfVersion(version: number, project: Record<string, unknown> = {}) {
  return { format: "miliplain-project", formatVersion: version, project };
}

// Учебные переходы: в «версии 2» темп переименован в bpm, в «версии 3» — обратно.
const exampleMigrations: Record<number, Migration> = {
  1: (document) => ({ ...document, renamed: "tempo → bpm" }),
  2: (document) => ({ ...document, renamedBack: "bpm → tempo" }),
};

describe("миграции формата", () => {
  it("текущая версия проходит без изменений", () => {
    const result = migrateProjectDocument(documentOfVersion(CURRENT_PROJECT_FORMAT_VERSION));
    expect(result).toMatchObject({ ok: true, upgradedFromVersion: null });
  });

  it("старая версия поднимается по цепочке до текущей", () => {
    const result = migrateProjectDocument(documentOfVersion(1), exampleMigrations, 3);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.document.formatVersion).toBe(3);
      expect(result.document.renamed).toBe("tempo → bpm");
      expect(result.document.renamedBack).toBe("bpm → tempo");
      expect(result.upgradedFromVersion).toBe(1);
    }
  });

  it("файл новее программы — просьба обновить программу", () => {
    const result = migrateProjectDocument(documentOfVersion(CURRENT_PROJECT_FORMAT_VERSION + 1));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/более новой версией MiliPlain.*обновите программу/);
  });

  it("пропущенная миграция — понятная ошибка, а не тихая порча", () => {
    const result = migrateProjectDocument(documentOfVersion(1), { 1: exampleMigrations[1] as Migration }, 3);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/не умеет переводить формат 2 в 3/);
  });

  it("сломанная миграция не роняет программу", () => {
    const broken: Record<number, Migration> = {
      1: () => {
        throw new Error("упс");
      },
    };
    const result = migrateProjectDocument(documentOfVersion(1), broken, 2);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/упс/);
  });

  it("неправильная версия формата отклоняется", () => {
    for (const version of [0, -1, 1.5, "1", null]) {
      const result = migrateProjectDocument({ format: "miliplain-project", formatVersion: version });
      expect(result.ok).toBe(false);
    }
  });

  it("у каждой старой версии есть переход к следующей", () => {
    for (let version = 1; version < CURRENT_PROJECT_FORMAT_VERSION; version++) {
      expect(projectMigrations[version], `нет миграции ${version} → ${version + 1}`).toBeDefined();
    }
  });

  it("программа версии 2 открывает файл версии 1 и сообщает об этом", () => {
    const project = createProject({ project: "Старый трек" });
    const fileOfVersion1 = serializeProject(project, "0.0.10a");
    const result = parseProjectText(fileOfVersion1, {
      migrations: { 1: (document) => ({ ...document, addedInVersion2: true }) },
      currentVersion: 2,
    });
    expect(result).toEqual({ ok: true, project, upgradedFromVersion: 1 });
  });
});
