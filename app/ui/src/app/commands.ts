// Команды программы. У каждой есть имя (например, "tool.draw") и действие.
// Горячие клавиши (keymap.ts) ссылаются на команды по имени, поэтому клавишу
// можно переназначить, не трогая код команды (ТЗ, п. 7). Моды на этапе 8
// будут вызывать те же команды.

import {
  clearNoteSelection,
  copySelectedNotes,
  cutSelectedNotes,
  deleteSelectedNotes,
  duplicateSelectedNotes,
  type NoteClipboard,
  nudgeSelectedNotes,
  pasteNotes,
  quantizeSelectedNotes,
  selectAllNotes,
  transposeSelectedNotes,
} from "../pianoRoll/noteCommands";
import type { ToolName } from "../state/editorPreferences";
import type { ProjectStore } from "../state/projectStore";
import type { ProjectActions } from "./projectActions";

export const COMMAND_IDS = [
  "file.new",
  "file.open",
  "file.save",
  "file.saveAs",
  "edit.undo",
  "edit.redo",
  "tool.draw",
  "tool.paint",
  "tool.delete",
  "tool.select",
  "notes.delete",
  "notes.selectAll",
  "notes.deselect",
  "notes.copy",
  "notes.cut",
  "notes.paste",
  "notes.duplicate",
  "notes.quantize",
  "notes.transposeUp",
  "notes.transposeDown",
  "notes.octaveUp",
  "notes.octaveDown",
  "notes.nudgeLeft",
  "notes.nudgeRight",
  "view.showAllNotes",
] as const;

export type CommandId = (typeof COMMAND_IDS)[number];

export interface Command {
  readonly run: () => unknown;
  /** Работает и тогда, когда курсор стоит в поле ввода (команды файла). */
  readonly whileTyping?: boolean;
}

export type Commands = Readonly<Record<CommandId, Command>>;

/** Что пианоролл умеет сделать по команде. */
export interface PianoRollControls {
  /** Прервать текущий жест мыши. true — жест был и прерван. */
  cancelGesture(): boolean;
  showAllNotes(): void;
}

export interface CommandDependencies {
  store: ProjectStore;
  actions: ProjectActions;
  clipboard: NoteClipboard;
  pianoRoll: PianoRollControls;
}

export function createCommands({ store, actions, clipboard, pianoRoll }: CommandDependencies): Commands {
  const tool = (name: ToolName): Command => ({ run: () => store.setEditorPreferences({ tool: name }) });
  return {
    "file.new": { run: () => actions.newProject(), whileTyping: true },
    "file.open": { run: () => actions.openProject(), whileTyping: true },
    "file.save": { run: () => actions.save(), whileTyping: true },
    "file.saveAs": { run: () => actions.saveAs(), whileTyping: true },
    "edit.undo": { run: () => store.undo() },
    "edit.redo": { run: () => store.redo() },
    "tool.draw": tool("draw"),
    "tool.paint": tool("paint"),
    "tool.delete": tool("delete"),
    "tool.select": tool("select"),
    "notes.delete": { run: () => deleteSelectedNotes(store) },
    "notes.selectAll": { run: () => selectAllNotes(store) },
    // Esc сначала прерывает перетаскивание, а если его нет — снимает выделение.
    "notes.deselect": { run: () => pianoRoll.cancelGesture() || clearNoteSelection(store) },
    "notes.copy": { run: () => copySelectedNotes(store, clipboard) },
    "notes.cut": { run: () => cutSelectedNotes(store, clipboard) },
    "notes.paste": { run: () => pasteNotes(store, clipboard) },
    "notes.duplicate": { run: () => duplicateSelectedNotes(store) },
    "notes.quantize": { run: () => quantizeSelectedNotes(store) },
    "notes.transposeUp": { run: () => transposeSelectedNotes(store, 1) },
    "notes.transposeDown": { run: () => transposeSelectedNotes(store, -1) },
    "notes.octaveUp": { run: () => transposeSelectedNotes(store, 12) },
    "notes.octaveDown": { run: () => transposeSelectedNotes(store, -12) },
    "notes.nudgeLeft": { run: () => nudgeSelectedNotes(store, -1) },
    "notes.nudgeRight": { run: () => nudgeSelectedNotes(store, 1) },
    "view.showAllNotes": { run: () => pianoRoll.showAllNotes() },
  };
}
