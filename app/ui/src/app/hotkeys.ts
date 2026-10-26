// Диспетчер горячих клавиш: нажатие → сочетание → команда по активной таблице.
// Три слоя из ТЗ (п. 7): команды (commands.ts), таблица (keymap.ts), диспетчер (здесь).

import type { Commands } from "./commands";
import { comboFromEvent, createKeyLookup, type KeyEventLike, type Keymap } from "./keymap";

/** То, что умеет принимать события клавиатуры (окно браузера; в тестах — подделка). */
export interface KeyEventSource {
  addEventListener(type: "keydown", listener: (event: KeyboardEventLike) => void): void;
  removeEventListener(type: "keydown", listener: (event: KeyboardEventLike) => void): void;
}

export type KeyboardEventLike = KeyEventLike & {
  readonly target: EventTarget | null;
  preventDefault(): void;
};

/** Подключить горячие клавиши. Возвращает функцию, которая их отключает. */
export function bindHotkeys(source: KeyEventSource, keymap: Keymap, commands: Commands): () => void {
  const lookup = createKeyLookup(keymap);
  const listener = (event: KeyboardEventLike) => {
    const combo = comboFromEvent(event);
    const commandId = combo === null ? undefined : lookup.get(combo);
    if (commandId === undefined) return;
    const command = commands[commandId];
    // В поле ввода стрелки, Delete и Ctrl+Z работают с текстом — не перехватываем.
    if (isTypingInto(event.target) && !command.whileTyping) return;
    event.preventDefault();
    void command.run();
  };
  source.addEventListener("keydown", listener);
  return () => source.removeEventListener("keydown", listener);
}

/** Курсор стоит в поле, куда набирают текст или числа? */
export function isTypingInto(target: EventTarget | null): boolean {
  const element = target as { tagName?: string; type?: string; isContentEditable?: boolean } | null;
  if (!element?.tagName) return false;
  if (element.isContentEditable) return true;
  const tag = element.tagName.toUpperCase();
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  return tag === "INPUT" && !["checkbox", "radio", "button"].includes(element.type ?? "text");
}
