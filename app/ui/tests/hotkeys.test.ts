// Тесты горячих клавиш: сочетания, таблица по умолчанию, диспетчер.

import { describe, expect, it } from "vitest";
import { COMMAND_IDS, type CommandId, type Commands } from "../src/app/commands";
import { bindHotkeys, type KeyboardEventLike, type KeyEventSource } from "../src/app/hotkeys";
import { comboFromEvent, DEFAULT_KEYMAP } from "../src/app/keymap";

function key(code: string, modifiers: Partial<KeyboardEventLike> = {}, target: unknown = null) {
  let prevented = false;
  const event: KeyboardEventLike = {
    code,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    target: target as EventTarget | null,
    preventDefault: () => {
      prevented = true;
    },
    ...modifiers,
  };
  return { event, wasPrevented: () => prevented };
}

describe("сочетания клавиш", () => {
  it("буква берётся по месту клавиши: в русской раскладке P — всё равно P", () => {
    // В русской раскладке event.key был бы «з», но event.code — «KeyP».
    expect(comboFromEvent(key("KeyP").event)).toBe("P");
  });

  it("модификаторы в порядке Ctrl, Alt, Shift; Cmd считается как Ctrl", () => {
    expect(comboFromEvent(key("KeyS", { shiftKey: true, ctrlKey: true }).event)).toBe("Ctrl+Shift+S");
    expect(comboFromEvent(key("KeyZ", { metaKey: true }).event)).toBe("Ctrl+Z");
    expect(comboFromEvent(key("ArrowUp", { ctrlKey: true }).event)).toBe("Ctrl+ArrowUp");
    expect(comboFromEvent(key("Digit1", { altKey: true }).event)).toBe("Alt+1");
  });

  it("нажатие одного модификатора — не сочетание", () => {
    expect(comboFromEvent(key("ControlLeft", { ctrlKey: true }).event)).toBeNull();
  });

  it("в таблице по умолчанию нет двух команд на одно сочетание", () => {
    const seen = new Map<string, CommandId>();
    for (const id of COMMAND_IDS) {
      for (const combo of DEFAULT_KEYMAP[id]) {
        expect(seen.get(combo), `${combo}: ${seen.get(combo)} и ${id}`).toBeUndefined();
        seen.set(combo, id);
      }
    }
  });

  it("инструменты — как в FL Studio", () => {
    expect(DEFAULT_KEYMAP["tool.draw"]).toEqual(["P"]);
    expect(DEFAULT_KEYMAP["tool.paint"]).toEqual(["B"]);
    expect(DEFAULT_KEYMAP["tool.delete"]).toEqual(["D"]);
    expect(DEFAULT_KEYMAP["tool.select"]).toEqual(["E"]);
  });
});

describe("диспетчер", () => {
  function setup() {
    const ran: CommandId[] = [];
    const commands = Object.fromEntries(
      COMMAND_IDS.map((id) => [id, { run: () => ran.push(id), whileTyping: id.startsWith("file.") }]),
    ) as unknown as Commands;
    let listener: ((event: KeyboardEventLike) => void) | null = null;
    const source: KeyEventSource = {
      addEventListener: (_type, handler) => {
        listener = handler;
      },
      removeEventListener: () => {
        listener = null;
      },
    };
    const unbind = bindHotkeys(source, DEFAULT_KEYMAP, commands);
    const press = (pressed: ReturnType<typeof key>) => listener?.(pressed.event);
    return { ran, press, unbind, isBound: () => listener !== null };
  }

  it("нажатие запускает команду и гасит действие браузера по умолчанию", () => {
    const { ran, press } = setup();
    const pressed = key("KeyB");
    press(pressed);
    expect(ran).toEqual(["tool.paint"]);
    expect(pressed.wasPrevented()).toBe(true);
  });

  it("в поле ввода работают только команды файла", () => {
    const { ran, press } = setup();
    const input = { tagName: "INPUT", type: "text" };
    press(key("Delete", {}, input));
    press(key("KeyZ", { ctrlKey: true }, input));
    press(key("KeyS", { ctrlKey: true }, input));
    expect(ran).toEqual(["file.save"]);
  });

  it("флажок — не поле ввода", () => {
    const { ran, press } = setup();
    press(key("Delete", {}, { tagName: "INPUT", type: "checkbox" }));
    expect(ran).toEqual(["notes.delete"]);
  });

  it("неизвестное сочетание ничего не делает и не мешает браузеру", () => {
    const { ran, press } = setup();
    const pressed = key("KeyK", { ctrlKey: true, altKey: true });
    press(pressed);
    expect(ran).toEqual([]);
    expect(pressed.wasPrevented()).toBe(false);
  });

  it("отключение снимает обработчик", () => {
    const { unbind, isBound } = setup();
    unbind();
    expect(isBound()).toBe(false);
  });
});
