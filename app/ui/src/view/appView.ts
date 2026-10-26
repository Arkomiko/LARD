// Раскладка окна: панель команд сверху, слева проект (каналы и паттерны),
// справа пианоролл. Раскладка «паттерны — каналы — пианоролл» из ТЗ — этап 3.
//
// Хранилище оповещает при каждой правке, а при перетаскивании ноты — десятки
// раз в секунду. Поэтому панели перерисовываются, только если изменилось то,
// что они показывают («подпись» панели). Пианоролл рисует себя сам.

import type { ProjectStore } from "../state/projectStore";
import { element, renderInto } from "./dom";
import { renderProjectPanel } from "./projectPanel";
import { renderToolbar } from "./toolbar";
import type { ViewContext } from "./viewContext";

export function mountAppView(
  root: HTMLElement,
  context: ViewContext,
  pianoRoll: HTMLElement,
  notices: HTMLElement,
): void {
  const toolbar = element("div");
  const side = element("aside", { className: "side-panel" });
  const main = element("main", { className: "main-panel" }, pianoRoll);
  root.replaceChildren(toolbar, element("div", { className: "workspace" }, side, main), notices);

  let toolbarShown = "";
  let sideShown = "";
  const render = () => {
    const toolbarState = toolbarSignature(context.store);
    if (toolbarState !== toolbarShown) {
      toolbarShown = toolbarState;
      renderInto(toolbar, renderToolbar(context));
    }
    const sideState = sidePanelSignature(context.store);
    if (sideState !== sideShown) {
      sideShown = sideState;
      renderInto(side, renderProjectPanel(context));
    }
  };
  context.store.subscribe(render);
  render();
}

function toolbarSignature(store: ProjectStore): string {
  return [
    store.isDirty,
    store.filePath,
    store.canUndo,
    store.canRedo,
    store.nextUndoLabel,
    store.nextRedoLabel,
  ].join("|");
}

/** Всё, что видно в левой панели: свойства проекта, каналы, паттерны и что из них выбрано. */
function sidePanelSignature(store: ProjectStore): string {
  const project = store.project;
  return JSON.stringify([
    project.name,
    project.tempo,
    project.timeSignature,
    project.channels,
    project.patterns.map((pattern) => [pattern.id, pattern.name]),
    store.selectedPatternId,
    store.selectedChannelId,
  ]);
}
