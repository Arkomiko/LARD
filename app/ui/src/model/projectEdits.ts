// Правки свойств самого проекта: имя, темп, размер.
// Каждая функция возвращает новый проект или тот же, если ничего не изменилось.

import { clampInteger, clampNumber, cleanName } from "./limits";
import {
  MAX_TEMPO,
  MAX_TIME_SIGNATURE_NUMERATOR,
  MIN_TEMPO,
  type Project,
  TIME_SIGNATURE_DENOMINATORS,
} from "./types";

export function renameProject(project: Project, name: string): Project {
  const cleaned = cleanName(name, project.name);
  return cleaned === project.name ? project : { ...project, name: cleaned };
}

/** Темп хранится с точностью до сотых: 128.5 BPM — можно, 128.4567 округлится. */
export function setTempo(project: Project, tempo: number): Project {
  const value = Math.round(clampNumber(tempo, MIN_TEMPO, MAX_TEMPO) * 100) / 100;
  return value === project.tempo ? project : { ...project, tempo: value };
}

/** Размер вроде 3/4 или 7/8. Недопустимый знаменатель (например, 5) не принимается. */
export function setTimeSignature(project: Project, numerator: number, denominator: number): Project {
  const allowedDenominators: readonly number[] = TIME_SIGNATURE_DENOMINATORS;
  if (!allowedDenominators.includes(denominator)) return project;
  const top = clampInteger(numerator, 1, MAX_TIME_SIGNATURE_NUMERATOR);
  const current = project.timeSignature;
  if (current.numerator === top && current.denominator === denominator) return project;
  return { ...project, timeSignature: { numerator: top, denominator } };
}
