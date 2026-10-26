# app/ui/src/files/ — формат проекта и автосохранение

**Что здесь.**

| Файл | Что внутри |
| --- | --- |
| `projectFormat.ts` | проект → текст project.json и обратно |
| `formatVersions.ts` | метка и версия формата, миграции старых версий в новую |
| `validateProject.ts` | проверка каждого поля прочитанного проекта с понятными ошибками |
| `autosaveScheduler.ts` | таймер автосохранения: копия раз в N минут, если проект изменился |

**Как устроен файл .mpj.** Это ZIP-архив, внутри которого лежит project.json.
Архив собирает и разбирает движок (`app/engine/ProjectArchive.cs`), а
содержимое project.json — забота этой папки:

```json
{
  "format": "miliplain-project",
  "formatVersion": 1,
  "savedBy": { "app": "MiliPlain", "version": "0.0.10a" },
  "project": { "name": "…", "tempo": 120, "channels": [], "patterns": [] }
}
```

**Как поменять формат** — написано в начале `formatVersions.ts`: поднять
версию, добавить миграцию, добавить тест со старым файлом.

**С чем связано.** Пользуется `model/`. Тексты файлов передаются оболочке
через `host/`, а записывает их движок.

**Тесты:** `tests/projectFormat.test.ts`, `tests/formatVersions.test.ts`,
`tests/autosaveScheduler.test.ts`.
