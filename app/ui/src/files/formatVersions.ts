// Версия формата project.json и переходы (миграции) от старых версий к новой.
//
// Зачем: проект, сохранённый старой MiliPlain, должен открываться новой.
// Когда формат меняется:
//   1) увеличить CURRENT_PROJECT_FORMAT_VERSION на 1;
//   2) добавить в projectMigrations функцию, которая переводит предыдущую
//      версию в новую (ключ — версия, ИЗ которой она переводит);
//   3) добавить тест со старым файлом в tests/formatVersions.test.ts.
// Старые миграции никогда не удаляются и не меняются.

/** Метка в файле: «это проект MiliPlain». */
export const PROJECT_FILE_FORMAT = "miliplain-project";

/** Версия формата, которую пишет эта версия программы. */
export const CURRENT_PROJECT_FORMAT_VERSION = 1;

export type JsonObject = Record<string, unknown>;

/** Переводит документ из версии N в версию N + 1. */
export type Migration = (document: JsonObject) => JsonObject;

/** Пока формат один, переходов нет. Пример будущей записи: 1: (document) => ({ ...document, … }). */
export const projectMigrations: Readonly<Record<number, Migration>> = {};

export type MigrationResult =
  | { ok: true; document: JsonObject; upgradedFromVersion: number | null }
  | { ok: false; errors: string[] };

/** Проверяет метку и версию файла и поднимает старый документ до текущей версии. */
export function migrateProjectDocument(
  value: unknown,
  migrations: Readonly<Record<number, Migration>> = projectMigrations,
  currentVersion: number = CURRENT_PROJECT_FORMAT_VERSION,
): MigrationResult {
  if (!isJsonObject(value) || value.format !== PROJECT_FILE_FORMAT) {
    return failed("Это не файл проекта MiliPlain.");
  }
  const version = value.formatVersion;
  if (typeof version !== "number" || !Number.isInteger(version) || version < 1) {
    return failed("В файле нет правильного номера версии формата.");
  }
  if (version > currentVersion) {
    return failed(
      `Проект сохранён более новой версией MiliPlain (формат ${version}). ` +
        `Эта версия понимает форматы до ${currentVersion} — обновите программу.`,
    );
  }

  let document: JsonObject = value;
  for (let from = version; from < currentVersion; from++) {
    const migration = migrations[from];
    if (!migration) return failed(`Программа не умеет переводить формат ${from} в ${from + 1}.`);
    try {
      document = { ...migration(document), formatVersion: from + 1 };
    } catch (error) {
      return failed(`Не удалось перевести формат ${from} в ${from + 1}: ${String(error)}`);
    }
  }
  return { ok: true, document, upgradedFromVersion: version < currentVersion ? version : null };
}

export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function failed(message: string): MigrationResult {
  return { ok: false, errors: [message] };
}
