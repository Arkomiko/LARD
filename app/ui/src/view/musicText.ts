// Музыкальные величины в виде, привычном человеку.

import type { Project } from "../model/types";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** Имя ноты по номеру MIDI: 60 → «C4», 61 → «C#4». Как в FL Studio и большинстве DAW. */
export function noteName(key: number): string {
  const octave = Math.floor(key / 12) - 1;
  return `${NOTE_NAMES[key % 12] ?? "?"}${octave}`;
}

/**
 * Позиция в тиках как «такт.доля.тик» с единицы: 0 → «1.1.0».
 * Доля — по знаменателю размера: в 6/8 это восьмая.
 */
export function position(ticks: number, project: Project): string {
  const ticksPerBeat = (project.ticksPerQuarter * 4) / project.timeSignature.denominator;
  const ticksPerBar = ticksPerBeat * project.timeSignature.numerator;
  const bar = Math.floor(ticks / ticksPerBar) + 1;
  const beat = Math.floor((ticks % ticksPerBar) / ticksPerBeat) + 1;
  const tick = Math.round(ticks % ticksPerBeat);
  return `${bar}.${beat}.${tick}`;
}
