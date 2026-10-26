// Создание новых объектов модели: проекта, канала, паттерна, ноты.
// Имена по умолчанию — английские (английский — основной язык программы);
// интерфейс передаёт имена на языке пользователя.

import { clampInteger, cleanName } from "./limits";
import {
  type Channel,
  COLOR_GROUP_COUNT,
  DEFAULT_TEMPO,
  DEFAULT_VELOCITY,
  KEY_COUNT,
  MAX_VELOCITY,
  MIDI_CHANNEL_COUNT,
  MIN_VELOCITY,
  type Note,
  type Pattern,
  type Project,
  TICKS_PER_QUARTER,
} from "./types";

/** Новый уникальный номер. crypto.randomUUID есть и в WebView2, и в Node, где идут тесты. */
export function createId(): string {
  return crypto.randomUUID();
}

export interface NewProjectNames {
  project?: string;
  channel?: string;
  pattern?: string;
}

/** Пустой проект: один канал, один паттерн без нот, 120 BPM, 4/4. */
export function createProject(names: NewProjectNames = {}): Project {
  return {
    id: createId(),
    name: cleanName(names.project ?? "", "New project"),
    tempo: DEFAULT_TEMPO,
    timeSignature: { numerator: 4, denominator: 4 },
    ticksPerQuarter: TICKS_PER_QUARTER,
    channels: [createChannel(names.channel ?? "Channel 1", 0)],
    patterns: [createPattern(names.pattern ?? "Pattern 1")],
  };
}

export function createChannel(name: string, midiChannel: number): Channel {
  return {
    id: createId(),
    name: cleanName(name, "Channel"),
    midiChannel: clampInteger(midiChannel, 0, MIDI_CHANNEL_COUNT - 1),
  };
}

export function createPattern(name: string, notes: readonly Note[] = []): Pattern {
  return { id: createId(), name: cleanName(name, "Pattern"), notes };
}

/** Копия паттерна под новым именем. У нот новые номера, чтобы паттерны не путались. */
export function copyPattern(pattern: Pattern, name: string): Pattern {
  return createPattern(
    name,
    pattern.notes.map((note) => ({ ...note, id: createId() })),
  );
}

/** Что нужно указать, чтобы создать ноту. Остальное берётся по умолчанию. */
export interface NoteDraft {
  channelId: string;
  key: number;
  start: number;
  length: number;
  velocity?: number;
  muted?: boolean;
  colorGroup?: number;
}

export function createNote(draft: NoteDraft): Note {
  return normalizeNote({
    id: createId(),
    channelId: draft.channelId,
    key: draft.key,
    start: draft.start,
    length: draft.length,
    velocity: draft.velocity ?? DEFAULT_VELOCITY,
    muted: draft.muted ?? false,
    colorGroup: draft.colorGroup ?? 0,
  });
}

/**
 * Приводит поля ноты к допустимым значениям: высота 0…127, начало не меньше 0,
 * длина не меньше 1 тика, velocity 1…127, цвет 0…15.
 */
export function normalizeNote(note: Note): Note {
  const normalized: Note = {
    id: note.id,
    channelId: note.channelId,
    key: clampInteger(note.key, 0, KEY_COUNT - 1),
    start: clampInteger(note.start, 0, Number.MAX_SAFE_INTEGER),
    length: clampInteger(note.length, 1, Number.MAX_SAFE_INTEGER),
    velocity: clampInteger(note.velocity, MIN_VELOCITY, MAX_VELOCITY),
    muted: note.muted === true,
    colorGroup: clampInteger(note.colorGroup, 0, COLOR_GROUP_COUNT - 1),
  };
  return notesEqual(normalized, note) ? note : normalized;
}

/** Совпадают ли все поля двух нот. */
export function notesEqual(first: Note, second: Note): boolean {
  return (
    first.id === second.id &&
    first.channelId === second.channelId &&
    first.key === second.key &&
    first.start === second.start &&
    first.length === second.length &&
    first.velocity === second.velocity &&
    first.muted === second.muted &&
    first.colorGroup === second.colorGroup
  );
}
