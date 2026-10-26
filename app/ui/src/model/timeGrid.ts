// Музыкальная сетка: сколько тиков в доле и такте, и привязка к сетке (snap).
//
// Доля зависит от знаменателя размера: в 4/4 доля — четверть (960 тиков),
// в 6/8 — восьмая (480 тиков). Такт — столько долей, сколько в числителе.

import type { Project } from "./types";

/** Варианты привязки. «quarter-beat» — четверть доли, в FL Studio это «шаг» (step). */
export const SNAP_IDS = [
  "none",
  "bar",
  "beat",
  "half-beat",
  "third-beat",
  "quarter-beat",
  "sixth-beat",
  "eighth-beat",
] as const;

export type SnapId = (typeof SNAP_IDS)[number];

/** На сколько частей делится доля для каждой привязки. Такт и «без привязки» считаются отдельно. */
const BEAT_DIVISIONS: Record<Exclude<SnapId, "none" | "bar">, number> = {
  beat: 1,
  "half-beat": 2,
  "third-beat": 3,
  "quarter-beat": 4,
  "sixth-beat": 6,
  "eighth-beat": 8,
};

export function ticksPerBeat(project: Project): number {
  return (project.ticksPerQuarter * 4) / project.timeSignature.denominator;
}

export function ticksPerBar(project: Project): number {
  return ticksPerBeat(project) * project.timeSignature.numerator;
}

/** Шаг сетки в тиках или null, если привязка выключена. */
export function snapStep(project: Project, snapId: SnapId): number | null {
  if (snapId === "none") return null;
  if (snapId === "bar") return ticksPerBar(project);
  return ticksPerBeat(project) / BEAT_DIVISIONS[snapId];
}

/** Ближайшая линия сетки слева (или сама точка, если она на линии). */
export function snapDown(tick: number, step: number | null): number {
  if (step === null) return Math.round(tick);
  return Math.floor(tick / step) * step;
}

/** Ближайшая линия сетки в любую сторону. */
export function snapNearest(tick: number, step: number | null): number {
  if (step === null) return Math.round(tick);
  return Math.round(tick / step) * step;
}

/** Ближайшая линия сетки справа (или сама точка, если она на линии). */
export function snapUp(tick: number, step: number | null): number {
  if (step === null) return Math.round(tick);
  return Math.ceil(tick / step) * step;
}
