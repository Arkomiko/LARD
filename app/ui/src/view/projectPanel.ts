// Левая панель: свойства проекта, стойка каналов, список паттернов.
// Каждое изменение идёт через store.edit — так оно попадает в историю отмены.

import { strings } from "../app/strings";
import { addChannel, removeChannel, renameChannel, setChannelMidiChannel } from "../model/channelEdits";
import { copyPattern, createChannel, createPattern } from "../model/create";
import { addPattern, removePattern, renamePattern } from "../model/patternEdits";
import { renameProject, setTempo, setTimeSignature } from "../model/projectEdits";
import { MIDI_CHANNEL_COUNT, TIME_SIGNATURE_DENOMINATORS } from "../model/types";
import { element, numberFrom, select } from "./dom";
import type { ViewContext } from "./viewContext";

export function renderProjectPanel(context: ViewContext): HTMLElement {
  return element(
    "div",
    {},
    ...renderProjectFields(context),
    ...renderChannels(context),
    ...renderPatterns(context),
  );
}

function renderProjectFields({ store }: ViewContext): HTMLElement[] {
  const project = store.project;
  const text = strings.panel;
  const name = element("input", {
    type: "text",
    value: project.name,
    focusKey: "project-name",
    onchange: () => store.edit(strings.step.renameProject, (current) => renameProject(current, name.value)),
  });
  const tempo = element("input", {
    type: "number",
    step: "0.01",
    value: String(project.tempo),
    focusKey: "project-tempo",
    onchange: () => store.edit(strings.step.tempo, (current) => setTempo(current, numberFrom(tempo))),
  });
  const numerator = element("input", {
    type: "number",
    min: "1",
    max: "32",
    value: String(project.timeSignature.numerator),
    focusKey: "project-numerator",
    onchange: () => changeSignature(),
  });
  const denominator = select(
    TIME_SIGNATURE_DENOMINATORS.map((value) => ({ value: String(value), label: String(value) })),
    String(project.timeSignature.denominator),
    { focusKey: "project-denominator", onchange: () => changeSignature() },
  );
  const changeSignature = () =>
    store.edit(strings.step.timeSignature, (current) =>
      setTimeSignature(current, numberFrom(numerator), numberFrom(denominator)),
    );

  return [
    element("h2", { textContent: text.project }),
    row(text.name, name),
    row(text.tempo, tempo, element("span", { className: "muted-text", textContent: "BPM" })),
    row(text.timeSignature, numerator, element("span", { textContent: "/" }), denominator),
  ];
}

function renderChannels({ store }: ViewContext): HTMLElement[] {
  const project = store.project;
  const text = strings.panel;
  const midiOptions = Array.from({ length: MIDI_CHANNEL_COUNT }, (_, index) => ({
    value: String(index),
    label: `${text.midiChannel} ${index + 1}`,
  }));

  const rows = project.channels.map((channel) => {
    const name = element("input", {
      type: "text",
      value: channel.name,
      focusKey: `channel-name-${channel.id}`,
      onfocus: () => store.selectChannel(channel.id),
      onchange: () =>
        store.edit(strings.step.renameChannel, (current) => renameChannel(current, channel.id, name.value)),
    });
    const midi = select(midiOptions, String(channel.midiChannel), {
      focusKey: `channel-midi-${channel.id}`,
      onchange: () =>
        store.edit(strings.step.midiChannel, (current) =>
          setChannelMidiChannel(current, channel.id, numberFrom(midi)),
        ),
    });
    return element(
      "div",
      {
        className: channel.id === store.selectedChannelId ? "list-row selected" : "list-row",
        title: text.selectedChannelHint,
        onclick: () => store.selectChannel(channel.id),
      },
      name,
      midi,
      rowButton(text.remove, project.channels.length <= 1, () =>
        store.edit(strings.step.removeChannel, (current) => removeChannel(current, channel.id)),
      ),
    );
  });

  const addButton = element("button", {
    textContent: text.addChannel,
    onclick: () => {
      const number = project.channels.length + 1;
      const channel = createChannel(strings.channelName(number), (number - 1) % MIDI_CHANNEL_COUNT);
      store.edit(strings.step.addChannel, (current) => addChannel(current, channel), {
        channelId: channel.id,
      });
    },
  });

  return [
    element("h2", { textContent: text.channels }),
    ...rows,
    element("div", { className: "buttons" }, addButton),
  ];
}

function renderPatterns({ store }: ViewContext): HTMLElement[] {
  const project = store.project;
  const text = strings.panel;

  const rows = project.patterns.map((pattern) => {
    const name = element("input", {
      type: "text",
      value: pattern.name,
      focusKey: `pattern-name-${pattern.id}`,
      onfocus: () => store.selectPattern(pattern.id),
      onchange: () =>
        store.edit(strings.step.renamePattern, (current) => renamePattern(current, pattern.id, name.value)),
    });
    return element(
      "div",
      {
        className: pattern.id === store.selectedPatternId ? "list-row selected" : "list-row",
        onclick: () => store.selectPattern(pattern.id),
      },
      name,
      rowButton(text.duplicate, false, () => {
        const copy = copyPattern(pattern, strings.copyName(pattern.name));
        store.edit(strings.step.duplicatePattern, (current) => addPattern(current, copy, pattern.id), {
          patternId: copy.id,
        });
      }),
      rowButton(text.remove, project.patterns.length <= 1, () =>
        store.edit(strings.step.removePattern, (current) => removePattern(current, pattern.id)),
      ),
    );
  });

  const addButton = element("button", {
    textContent: text.addPattern,
    onclick: () => {
      const pattern = createPattern(strings.patternName(project.patterns.length + 1));
      store.edit(strings.step.addPattern, (current) => addPattern(current, pattern), {
        patternId: pattern.id,
      });
    },
  });

  return [
    element("h2", { textContent: text.patterns }),
    ...rows,
    element("div", { className: "buttons" }, addButton),
  ];
}

/**
 * Кнопка внутри строки списка. Щелчок по ней не должен «всплыть» до строки:
 * строка по щелчку выбирает свой паттерн и перебила бы выбор, сделанный
 * кнопкой (например, «Копия» выбирает новую копию).
 */
function rowButton(label: string, disabled: boolean, action: () => void): HTMLButtonElement {
  return element("button", {
    textContent: label,
    disabled,
    onclick: (event: MouseEvent) => {
      event.stopPropagation();
      action();
    },
  });
}

function row(label: string, ...fields: HTMLElement[]): HTMLElement {
  return element("div", { className: "field-row" }, element("label", { textContent: label }), ...fields);
}
