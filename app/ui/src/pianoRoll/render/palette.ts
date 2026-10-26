// Цвета пианоролла. Холст не умеет брать CSS-переменные сам, поэтому они
// читаются из styles.css один раз при запуске. Так тема (этап 7) меняет
// цвета, не трогая код рисования.

import { COLOR_GROUP_COUNT } from "../../model/types";

export interface Palette {
  background: string;
  blackKeyRow: string;
  octaveLine: string;
  stepLine: string;
  beatLine: string;
  barLine: string;
  rulerBackground: string;
  rulerText: string;
  keyWhite: string;
  keyBlack: string;
  keyText: string;
  noteOutline: string;
  noteSelected: string;
  noteText: string;
  selectionFill: string;
  selectionBorder: string;
  /** 16 цветов групп нот. */
  noteColors: string[];
}

export function readPalette(root: Element = document.documentElement): Palette {
  const style = getComputedStyle(root);
  const token = (name: string) => style.getPropertyValue(`--${name}`).trim() || "#ff00ff";
  return {
    background: token("roll-background"),
    blackKeyRow: token("roll-black-key-row"),
    octaveLine: token("roll-octave-line"),
    stepLine: token("roll-step-line"),
    beatLine: token("roll-beat-line"),
    barLine: token("roll-bar-line"),
    rulerBackground: token("roll-ruler-background"),
    rulerText: token("roll-ruler-text"),
    keyWhite: token("roll-key-white"),
    keyBlack: token("roll-key-black"),
    keyText: token("roll-key-text"),
    noteOutline: token("roll-note-outline"),
    noteSelected: token("roll-note-selected"),
    noteText: token("roll-note-text"),
    selectionFill: token("roll-selection-fill"),
    selectionBorder: token("roll-selection-border"),
    noteColors: Array.from({ length: COLOR_GROUP_COUNT }, (_, index) => token(`note-color-${index + 1}`)),
  };
}
