// 5000 случайных нот для проверки скорости (ТЗ, п. 4: «пианоролл держит
// плавную прокрутку и правку при 5 000 нот»). Временная функция этапа 2.

import { strings } from "../app/strings";
import { createNote } from "../model/create";
import { addNotes } from "../model/noteEdits";
import { ticksPerBar } from "../model/timeGrid";
import { COLOR_GROUP_COUNT } from "../model/types";
import type { ProjectStore } from "../state/projectStore";

export function addTestNotes(store: ProjectStore, count = 5000): void {
  const project = store.project;
  const stepTicks = ticksPerBar(project) / 16;
  // Своя «случайность» с постоянным началом: каждый запуск даёт те же ноты,
  // поэтому замеры скорости можно сравнивать между собой.
  let seed = 12345;
  const random = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const notes = Array.from({ length: count }, () =>
    createNote({
      channelId: store.selectedChannelId,
      key: 36 + Math.floor(random() * 60),
      start: Math.floor(random() * 64 * 16) * stepTicks,
      length: stepTicks * (1 + Math.floor(random() * 8)),
      velocity: 40 + Math.floor(random() * 87),
      colorGroup: Math.floor(random() * COLOR_GROUP_COUNT),
    }),
  );
  store.edit(strings.step.addNotes, (current) => addNotes(current, store.selectedPatternId, notes));
}
