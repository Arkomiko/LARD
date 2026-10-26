// Из чего состоит проект MiliPlain.
//
// Все объекты модели неизменяемые (readonly): правка не меняет старый объект,
// а создаёт новый. Поэтому история отмены — это просто список прошлых версий
// проекта, а «изменилось ли что-то» проверяется сравнением ссылок (===).

/** Сколько тиков (самых мелких долей времени) в одной четверти. Как в большинстве DAW. */
export const TICKS_PER_QUARTER = 960;

/** Высоты нот MIDI: от 0 до 127. 60 — до первой октавы (C4). */
export const KEY_COUNT = 128;

/** MIDI-каналов 16. В программе хранятся как 0…15, на экране показываются как 1…16. */
export const MIDI_CHANNEL_COUNT = 16;

/** Цветовых групп нот 16 (ТЗ, п. 6.1). */
export const COLOR_GROUP_COUNT = 16;

export const MIN_VELOCITY = 1;
export const MAX_VELOCITY = 127;
export const DEFAULT_VELOCITY = 100;

export const MIN_TEMPO = 10;
export const MAX_TEMPO = 999;
export const DEFAULT_TEMPO = 120;

/** Допустимые знаменатели размера: 4/4, 6/8, 7/16 и так далее. */
export const TIME_SIGNATURE_DENOMINATORS = [1, 2, 4, 8, 16, 32] as const;
export const MAX_TIME_SIGNATURE_NUMERATOR = 32;

/** Нота в паттерне. */
export interface Note {
  readonly id: string;
  /** Какому каналу (инструменту) принадлежит нота. */
  readonly channelId: string;
  /** Высота: 0…127. */
  readonly key: number;
  /** Начало в тиках от начала паттерна. */
  readonly start: number;
  /** Длительность в тиках, не меньше 1. */
  readonly length: number;
  /** Сила нажатия: 1…127. */
  readonly velocity: number;
  /** Заглушена: остаётся на месте, но не звучит. */
  readonly muted: boolean;
  /** Цветовая группа: 0…15. */
  readonly colorGroup: number;
}

/**
 * Паттерн хранит ноты сразу нескольких каналов, как в FL Studio.
 * Паттерны — часть проекта с первого дня (урок LARD: вне модели они
 * не сохранялись и не попадали в историю).
 */
export interface Pattern {
  readonly id: string;
  readonly name: string;
  readonly notes: readonly Note[];
}

/** Канал — инструмент в стойке каналов. */
export interface Channel {
  readonly id: string;
  readonly name: string;
  /** На какой MIDI-канал (0…15) мост отправляет ноты этого канала в DAW. */
  readonly midiChannel: number;
}

export interface TimeSignature {
  readonly numerator: number;
  readonly denominator: number;
}

export interface Project {
  readonly id: string;
  readonly name: string;
  /** Темп в ударах в минуту. */
  readonly tempo: number;
  readonly timeSignature: TimeSignature;
  readonly ticksPerQuarter: number;
  /** В проекте всегда есть хотя бы один канал. */
  readonly channels: readonly Channel[];
  /** В проекте всегда есть хотя бы один паттерн. */
  readonly patterns: readonly Pattern[];
}
