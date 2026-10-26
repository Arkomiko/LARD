// Верхняя панель: файл, отмена/повтор, резервные копии, настройки, состояние.

import { strings } from "../app/strings";
import { openBackupsDialog } from "./backupsDialog";
import { element } from "./dom";
import { openSettingsDialog } from "./settingsDialog";
import type { ViewContext } from "./viewContext";

export function renderToolbar(context: ViewContext): HTMLElement {
  const { store, actions } = context;
  const text = strings.toolbar;
  const statusText = store.isDirty ? text.unsaved : (store.filePath ?? text.notSavedYet);

  return element(
    "header",
    { className: "toolbar" },
    button(text.newProject, "Ctrl+N", () => actions.newProject()),
    button(text.open, "Ctrl+O", () => actions.openProject()),
    button(text.save, "Ctrl+S", () => actions.save()),
    button(text.saveAs, "Ctrl+Shift+S", () => actions.saveAs()),
    separator(),
    element("button", {
      textContent: text.undo,
      title: `${strings.undo(store.nextUndoLabel)} (Ctrl+Z)`,
      disabled: !store.canUndo,
      onclick: () => store.undo(),
    }),
    element("button", {
      textContent: text.redo,
      title: `${strings.redo(store.nextRedoLabel)} (Ctrl+Y)`,
      disabled: !store.canRedo,
      onclick: () => store.redo(),
    }),
    separator(),
    button(text.backups, "", () => openBackupsDialog(context)),
    button(text.settings, "", () => openSettingsDialog(context)),
    element("span", { className: store.isDirty ? "status unsaved" : "status", textContent: statusText }),
  );
}

function button(label: string, shortcut: string, action: () => unknown): HTMLButtonElement {
  return element("button", {
    textContent: label,
    title: shortcut,
    onclick: () => void action(),
  });
}

function separator(): HTMLElement {
  return element("span", { className: "separator" });
}
