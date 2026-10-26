// Правки списка паттернов. Дублирование: copyPattern (create.ts) делает копию,
// addPattern ставит её сразу после оригинала.

import { cleanName } from "./limits";
import { findById, replaceById } from "./listHelpers";
import type { Pattern, Project } from "./types";

/** Добавляет готовый паттерн в конец списка или сразу после указанного. */
export function addPattern(project: Project, pattern: Pattern, afterPatternId?: string): Project {
  if (findById(project.patterns, pattern.id)) return project;
  const patterns = project.patterns.slice();
  const afterIndex =
    afterPatternId === undefined ? -1 : patterns.findIndex((item) => item.id === afterPatternId);
  if (afterIndex < 0) patterns.push(pattern);
  else patterns.splice(afterIndex + 1, 0, pattern);
  return { ...project, patterns };
}

export function renamePattern(project: Project, patternId: string, name: string): Project {
  const patterns = replaceById(project.patterns, patternId, (pattern) => {
    const cleaned = cleanName(name, pattern.name);
    return cleaned === pattern.name ? pattern : { ...pattern, name: cleaned };
  });
  return patterns === project.patterns ? project : { ...project, patterns };
}

/** Удаляет паттерн. Последний паттерн не удаляется: проекту нужен хотя бы один. */
export function removePattern(project: Project, patternId: string): Project {
  if (project.patterns.length <= 1 || !findById(project.patterns, patternId)) return project;
  return { ...project, patterns: project.patterns.filter((pattern) => pattern.id !== patternId) };
}
