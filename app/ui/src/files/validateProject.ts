// Проверка проекта, прочитанного из файла.
//
// Файл мог испортиться или его могли поправить руками в архиваторе, поэтому
// каждое поле проверяется: тип, границы, ссылки нот на каналы, уникальность
// номеров. Если что-то не так, проект не открывается, а пользователь видит
// понятный список ошибок с указанием места, например
// «patterns[0].notes[12].key: нужно целое число от 0 до 127».
// Из файла берутся только известные поля: лишнее не попадает в программу.

import {
  type Channel,
  COLOR_GROUP_COUNT,
  KEY_COUNT,
  MAX_TEMPO,
  MAX_TIME_SIGNATURE_NUMERATOR,
  MAX_VELOCITY,
  MIDI_CHANNEL_COUNT,
  MIN_TEMPO,
  MIN_VELOCITY,
  type Note,
  type Pattern,
  type Project,
  TIME_SIGNATURE_DENOMINATORS,
} from "../model/types";
import { isJsonObject, type JsonObject } from "./formatVersions";

export type ValidationResult = { ok: true; project: Project } | { ok: false; errors: string[] };

/** Больше ошибок показывать бессмысленно: файл и так явно испорчен. */
const MAX_REPORTED_ERRORS = 20;
const MAX_TICK = Number.MAX_SAFE_INTEGER;

export function validateProject(value: unknown): ValidationResult {
  const reader = new FieldReader();
  const project = reader.project(value);
  return reader.errors.length > 0 || !project ? { ok: false, errors: reader.errors } : { ok: true, project };
}

// Читает поля по одному и копит ошибки. Каждый метод возвращает прочитанное
// значение или запасное, чтобы проверка шла дальше и нашла все ошибки разом.
class FieldReader {
  readonly errors: string[] = [];
  private readonly usedIds = new Set<string>();

  project(value: unknown): Project | undefined {
    if (!isJsonObject(value)) return this.fail("project", "нет данных проекта");
    const channels = this.list(value, "channels", "project", (item, path) => this.channel(item, path));
    const channelIds = new Set(channels.map((channel) => channel.id));
    const patterns = this.list(value, "patterns", "project", (item, path) =>
      this.pattern(item, path, channelIds),
    );
    if (channels.length === 0) this.fail("project.channels", "нужен хотя бы один канал");
    if (patterns.length === 0) this.fail("project.patterns", "нужен хотя бы один паттерн");
    return {
      id: this.id(value, "project"),
      name: this.text(value, "name", "project"),
      tempo: this.number(value, "tempo", "project", MIN_TEMPO, MAX_TEMPO),
      timeSignature: this.timeSignature(value.timeSignature, "project.timeSignature"),
      ticksPerQuarter: this.integer(value, "ticksPerQuarter", "project", 1, 96_000),
      channels,
      patterns,
    };
  }

  private channel(value: JsonObject, path: string): Channel {
    return {
      id: this.id(value, path),
      name: this.text(value, "name", path),
      midiChannel: this.integer(value, "midiChannel", path, 0, MIDI_CHANNEL_COUNT - 1),
    };
  }

  private pattern(value: JsonObject, path: string, channelIds: ReadonlySet<string>): Pattern {
    return {
      id: this.id(value, path),
      name: this.text(value, "name", path),
      notes: this.list(value, "notes", path, (item, notePath) => this.note(item, notePath, channelIds)),
    };
  }

  private note(value: JsonObject, path: string, channelIds: ReadonlySet<string>): Note {
    const channelId = this.text(value, "channelId", path);
    if (channelId && !channelIds.has(channelId))
      this.fail(`${path}.channelId`, "такого канала нет в проекте");
    return {
      id: this.id(value, path),
      channelId,
      key: this.integer(value, "key", path, 0, KEY_COUNT - 1),
      start: this.integer(value, "start", path, 0, MAX_TICK),
      length: this.integer(value, "length", path, 1, MAX_TICK),
      velocity: this.integer(value, "velocity", path, MIN_VELOCITY, MAX_VELOCITY),
      muted: this.boolean(value, "muted", path),
      colorGroup: this.integer(value, "colorGroup", path, 0, COLOR_GROUP_COUNT - 1),
    };
  }

  private timeSignature(value: unknown, path: string): Project["timeSignature"] {
    if (!isJsonObject(value)) {
      this.fail(path, "нет размера");
      return { numerator: 4, denominator: 4 };
    }
    const numerator = this.integer(value, "numerator", path, 1, MAX_TIME_SIGNATURE_NUMERATOR);
    const denominator = value.denominator;
    const allowed: readonly number[] = TIME_SIGNATURE_DENOMINATORS;
    if (typeof denominator !== "number" || !allowed.includes(denominator)) {
      this.fail(`${path}.denominator`, `нужно одно из чисел ${allowed.join(", ")}`);
      return { numerator, denominator: 4 };
    }
    return { numerator, denominator };
  }

  private list<T>(
    owner: JsonObject,
    field: string,
    path: string,
    read: (item: JsonObject, path: string) => T,
  ): T[] {
    const value = owner[field];
    if (!Array.isArray(value)) {
      this.fail(`${path}.${field}`, "нужен список");
      return [];
    }
    const result: T[] = [];
    value.forEach((item: unknown, index) => {
      const itemPath = `${path}.${field}[${index}]`;
      if (isJsonObject(item)) result.push(read(item, itemPath));
      else this.fail(itemPath, "нужен объект");
    });
    return result;
  }

  // Номера (id) уникальны во всём проекте: так ноту, канал или паттерн
  // можно найти без уточнения, где он лежит.
  private id(owner: JsonObject, path: string): string {
    const id = this.text(owner, "id", path);
    if (id && this.usedIds.has(id)) this.fail(`${path}.id`, `номер «${id}» уже встречался в проекте`);
    this.usedIds.add(id);
    return id;
  }

  private text(owner: JsonObject, field: string, path: string): string {
    const value = owner[field];
    if (typeof value === "string" && value.trim().length > 0) return value;
    this.fail(`${path}.${field}`, "нужна непустая строка");
    return "";
  }

  private integer(owner: JsonObject, field: string, path: string, min: number, max: number): number {
    const value = owner[field];
    if (typeof value === "number" && Number.isInteger(value) && value >= min && value <= max) return value;
    this.fail(`${path}.${field}`, `нужно целое число от ${min} до ${max}`);
    return min;
  }

  private number(owner: JsonObject, field: string, path: string, min: number, max: number): number {
    const value = owner[field];
    if (typeof value === "number" && Number.isFinite(value) && value >= min && value <= max) return value;
    this.fail(`${path}.${field}`, `нужно число от ${min} до ${max}`);
    return min;
  }

  private boolean(owner: JsonObject, field: string, path: string): boolean {
    const value = owner[field];
    if (typeof value === "boolean") return value;
    this.fail(`${path}.${field}`, "нужно true или false");
    return false;
  }

  private fail(path: string, message: string): undefined {
    if (this.errors.length < MAX_REPORTED_ERRORS) this.errors.push(`${path}: ${message}`);
    return undefined;
  }
}
