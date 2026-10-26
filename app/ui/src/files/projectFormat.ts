// Превращение проекта в текст project.json и обратно.
//
// Файл .mpj — это ZIP-архив, внутри которого лежит project.json. Архив
// собирает и разбирает движок (C#); здесь — только содержимое project.json:
//
//   {
//     "format": "miliplain-project",   ← метка: это проект MiliPlain
//     "formatVersion": 1,              ← версия формата (см. formatVersions.ts)
//     "savedBy": { "app": "MiliPlain", "version": "0.0.10a" },
//     "project": { …каналы, паттерны, ноты… }
//   }

import type { Project } from "../model/types";
import {
  CURRENT_PROJECT_FORMAT_VERSION,
  type Migration,
  migrateProjectDocument,
  PROJECT_FILE_FORMAT,
  projectMigrations,
} from "./formatVersions";
import { validateProject } from "./validateProject";

export type ProjectLoadResult =
  | { ok: true; project: Project; upgradedFromVersion: number | null }
  | { ok: false; errors: string[] };

/** Текст project.json для сохранения. С отступами: файл можно прочитать глазами. */
export function serializeProject(project: Project, appVersion: string): string {
  const document = {
    format: PROJECT_FILE_FORMAT,
    formatVersion: CURRENT_PROJECT_FORMAT_VERSION,
    savedBy: { app: "MiliPlain", version: appVersion },
    project,
  };
  return JSON.stringify(document, null, 2);
}

/** Чем можно подменить миграции и текущую версию — нужно только тестам. */
export interface ParseOptions {
  migrations?: Readonly<Record<number, Migration>>;
  currentVersion?: number;
}

/** Читает project.json: разбирает JSON, поднимает старую версию, проверяет каждое поле. */
export function parseProjectText(text: string, options: ParseOptions = {}): ProjectLoadResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, errors: ["Файл повреждён: project.json не читается."] };
  }

  const migrated = migrateProjectDocument(
    parsed,
    options.migrations ?? projectMigrations,
    options.currentVersion ?? CURRENT_PROJECT_FORMAT_VERSION,
  );
  if (!migrated.ok) return migrated;

  const validated = validateProject(migrated.document.project);
  if (!validated.ok) return validated;
  return { ok: true, project: validated.project, upgradedFromVersion: migrated.upgradedFromVersion };
}
