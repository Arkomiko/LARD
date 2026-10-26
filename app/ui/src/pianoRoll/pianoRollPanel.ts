// Панель пианоролла: строка инструментов сверху и холст под ней.

import "./pianoRoll.css";
import type { PianoRollControls } from "../app/commands";
import { strings } from "../app/strings";
import { SNAP_IDS, type SnapId } from "../model/timeGrid";
import { TOOL_NAMES } from "../state/editorPreferences";
import type { ProjectStore } from "../state/projectStore";
import { element, renderInto, select } from "../view/dom";
import { quantizeSelectedNotes } from "./noteCommands";
import { PianoRollCanvas } from "./pianoRollCanvas";
import { addTestNotes } from "./testNotes";

/** Клавиши инструментов для подсказок; сами клавиши задаёт таблица keymap.ts. */
const TOOL_KEYS = { draw: "P", paint: "B", delete: "D", select: "E" } as const;

export interface PianoRollPanel {
  element: HTMLElement;
  controls: PianoRollControls;
  canvas: PianoRollCanvas;
}

export function createPianoRollPanel(store: ProjectStore): PianoRollPanel {
  const canvas = new PianoRollCanvas(store);
  const toolbar = element("div", { className: "piano-roll-toolbar" });
  const help = element("div", { className: "piano-roll-help", textContent: strings.pianoRoll.help });
  const panel = element("section", { className: "piano-roll" }, toolbar, canvas.element, help);

  // Строку инструментов перерисовываем, только если в ней что-то поменялось:
  // при перетаскивании ноты хранилище оповещает десятки раз в секунду.
  let shown = "";
  const renderToolbar = () => {
    const signature = toolbarSignature(store);
    if (signature === shown) return;
    shown = signature;
    renderInto(toolbar, ...toolbarContent(store, canvas));
  };
  store.subscribe(renderToolbar);
  renderToolbar();

  return { element: panel, controls: canvas, canvas };
}

function toolbarContent(store: ProjectStore, canvas: PianoRollCanvas): HTMLElement[] {
  const text = strings.pianoRoll;
  const preferences = store.editorPreferences;

  const tools = TOOL_NAMES.map((tool) =>
    element("button", {
      textContent: `${text.tools[tool]} (${TOOL_KEYS[tool]})`,
      title: text.toolHints[tool],
      className: tool === preferences.tool ? "tool active" : "tool",
      onclick: () => store.setEditorPreferences({ tool }),
    }),
  );
  const snap = select(
    SNAP_IDS.map((id) => ({ value: id, label: text.snapNames[id] })),
    preferences.snapId,
    {
      title: text.snap,
      onchange: () => store.setEditorPreferences({ snapId: snap.value as SnapId }),
    },
  );

  return [
    element("div", { className: "tool-group" }, ...tools),
    element("label", { className: "tool-group" }, element("span", { textContent: text.snap }), snap),
    element("button", {
      textContent: `${text.quantize} (Ctrl+Q)`,
      onclick: () => quantizeSelectedNotes(store),
    }),
    element("button", { textContent: text.showAll, onclick: () => canvas.showAllNotes() }),
    element("button", {
      textContent: text.testNotes,
      title: text.testNotesHint,
      className: "test-button",
      onclick: () => {
        addTestNotes(store);
        canvas.showAllNotes();
      },
    }),
    element("span", {
      className: "status",
      textContent: text.status(
        store.selectedChannel.name,
        store.editableNotes.length,
        store.selectedNoteIds.size,
      ),
    }),
  ];
}

function toolbarSignature(store: ProjectStore): string {
  const preferences = store.editorPreferences;
  return [
    preferences.tool,
    preferences.snapId,
    store.selectedChannel.name,
    store.editableNotes.length,
    store.selectedNoteIds.size,
  ].join("|");
}
