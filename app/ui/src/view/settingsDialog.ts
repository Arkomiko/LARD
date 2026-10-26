// Окно настроек: глубина отмены и автосохранение (ТЗ, п. 6.9).

import { strings } from "../app/strings";
import { element, numberFrom } from "./dom";
import type { ViewContext } from "./viewContext";

export function openSettingsDialog(context: ViewContext): void {
  const text = strings.settings;
  const settings = context.getSettings();
  const numberField = (value: number) => element("input", { type: "number", value: String(value) });
  const undoLimit = numberField(settings.undoLimit);
  const interval = numberField(settings.autosaveIntervalMinutes);
  const keep = numberField(settings.autosaveKeepCount);

  const dialog = element(
    "dialog",
    {},
    element("h2", { textContent: text.title }),
    field(text.undoLimit, undoLimit),
    field(text.autosaveInterval, interval),
    field(text.autosaveKeep, keep),
    element("p", { className: "muted-text", textContent: text.dataFolder(context.appInfo.dataFolder) }),
    element(
      "div",
      { className: "buttons" },
      element("button", {
        textContent: text.save,
        onclick: async () => {
          // Числа проверяет и обрезает до границ движок; здесь просто передаём.
          await context.applySettings({
            undoLimit: numberFrom(undoLimit),
            autosaveIntervalMinutes: numberFrom(interval),
            autosaveKeepCount: numberFrom(keep),
          });
          dialog.close();
        },
      }),
      element("button", { textContent: text.cancel, onclick: () => dialog.close() }),
    ),
  );
  dialog.addEventListener("close", () => dialog.remove());
  document.body.append(dialog);
  dialog.showModal();
}

function field(label: string, input: HTMLInputElement): HTMLElement {
  return element("div", { className: "field-row" }, element("label", { textContent: label }), input);
}
