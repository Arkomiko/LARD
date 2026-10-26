// Таблица «команда — сочетание клавиш» и перевод нажатия в сочетание.
// На этапе 7 таблица будет загружаться из пресетов (presets/keymaps/),
// а пока здесь лежит раскладка по умолчанию — как в FL Studio.

import type { CommandId } from "./commands";

/** Для каждой команды — список сочетаний. Пустой список — команда без клавиши. */
export type Keymap = Readonly<Record<CommandId, readonly string[]>>;

export const DEFAULT_KEYMAP: Keymap = {
  "file.new": ["Ctrl+N"],
  "file.open": ["Ctrl+O"],
  "file.save": ["Ctrl+S"],
  "file.saveAs": ["Ctrl+Shift+S"],
  "edit.undo": ["Ctrl+Z"],
  "edit.redo": ["Ctrl+Y", "Ctrl+Shift+Z"],
  "tool.draw": ["P"],
  "tool.paint": ["B"],
  "tool.delete": ["D"],
  "tool.select": ["E"],
  "notes.delete": ["Delete"],
  "notes.selectAll": ["Ctrl+A"],
  "notes.deselect": ["Escape"],
  "notes.copy": ["Ctrl+C"],
  "notes.cut": ["Ctrl+X"],
  "notes.paste": ["Ctrl+V"],
  "notes.duplicate": ["Ctrl+B"],
  "notes.quantize": ["Ctrl+Q"],
  "notes.transposeUp": ["ArrowUp"],
  "notes.transposeDown": ["ArrowDown"],
  "notes.octaveUp": ["Ctrl+ArrowUp"],
  "notes.octaveDown": ["Ctrl+ArrowDown"],
  "notes.nudgeLeft": ["ArrowLeft"],
  "notes.nudgeRight": ["ArrowRight"],
  "view.showAllNotes": [],
};

/** Поля события клавиатуры, которые нужны для сочетания. */
export type KeyEventLike = Pick<KeyboardEvent, "code" | "ctrlKey" | "metaKey" | "altKey" | "shiftKey">;

/**
 * Сочетание из нажатия: «Ctrl+Shift+S», «Delete», «P». Модификаторы всегда
 * в порядке Ctrl, Alt, Shift.
 *
 * Клавиша берётся по её месту на клавиатуре (event.code), а не по букве
 * (event.key): иначе в русской раскладке P пришла бы как «з» и инструменты
 * переключались бы только в английской.
 * Ctrl — это и ctrlKey, и metaKey (урок LARD: на Windows проверять Ctrl, а не
 * только Cmd; Cmd на macOS пусть работает так же).
 */
export function comboFromEvent(event: KeyEventLike): string | null {
  const key = keyName(event.code);
  if (key === null) return null;
  const parts: string[] = [];
  if (event.ctrlKey || event.metaKey) parts.push("Ctrl");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");
  parts.push(key);
  return parts.join("+");
}

/** Обратный поиск: сочетание → команда. */
export function createKeyLookup(keymap: Keymap): Map<string, CommandId> {
  const lookup = new Map<string, CommandId>();
  for (const [command, combos] of Object.entries(keymap) as [CommandId, readonly string[]][]) {
    for (const combo of combos) lookup.set(combo, command);
  }
  return lookup;
}

const MODIFIER_CODES = new Set([
  "ShiftLeft",
  "ShiftRight",
  "ControlLeft",
  "ControlRight",
  "AltLeft",
  "AltRight",
  "MetaLeft",
  "MetaRight",
]);

/** «KeyP» → «P», «Digit1» → «1», остальное как есть («Delete», «ArrowUp», «F5»). */
function keyName(code: string): string | null {
  if (code === "" || MODIFIER_CODES.has(code)) return null;
  const letter = /^Key([A-Z])$/.exec(code);
  if (letter?.[1]) return letter[1];
  const digit = /^Digit([0-9])$/.exec(code);
  if (digit?.[1]) return digit[1];
  return code;
}
