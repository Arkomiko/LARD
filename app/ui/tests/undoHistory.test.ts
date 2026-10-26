// Тесты истории отмены.

import { describe, expect, it } from "vitest";
import { DEFAULT_UNDO_LIMIT, UndoHistory } from "../src/state/undoHistory";

describe("история отмены", () => {
  it("по умолчанию помнит 100 шагов, старые забываются", () => {
    const history = new UndoHistory<number>();
    for (let step = 0; step < 150; step++) history.record(`шаг ${step}`, step);
    expect(DEFAULT_UNDO_LIMIT).toBe(100);
    expect(history.undoCount).toBe(100);
    expect(history.nextUndoLabel).toBe("шаг 149");
  });

  it("отменить и повторить возвращают версии по очереди", () => {
    const history = new UndoHistory<string>();
    history.record("первое", "A");
    history.record("второе", "B");
    // Сейчас состояние "C". Отмена возвращает "B", потом "A".
    expect(history.undo("C")?.state).toBe("B");
    expect(history.undo("B")?.state).toBe("A");
    expect(history.canUndo).toBe(false);
    // Повтор идёт обратно: "B", потом "C".
    expect(history.redo("A")?.state).toBe("B");
    expect(history.nextRedoLabel).toBe("второе");
    expect(history.redo("B")?.state).toBe("C");
    expect(history.canRedo).toBe(false);
  });

  it("новая правка после отмены стирает «повторить»", () => {
    const history = new UndoHistory<string>();
    history.record("первое", "A");
    history.undo("B");
    expect(history.canRedo).toBe(true);
    history.record("другое", "A");
    expect(history.canRedo).toBe(false);
  });

  it("уменьшение лимита сразу забывает лишние старые шаги", () => {
    const history = new UndoHistory<number>(50);
    for (let step = 0; step < 50; step++) history.record("шаг", step);
    history.setLimit(10);
    expect(history.undoCount).toBe(10);
    expect(history.undo(50)?.state).toBe(49);
  });

  it("лимит не бывает меньше 1 и не принимает мусор", () => {
    const history = new UndoHistory<number>(0);
    history.record("a", 1);
    history.record("b", 2);
    expect(history.undoCount).toBe(1);
    history.setLimit(Number.NaN);
    for (let step = 0; step < 120; step++) history.record("шаг", step);
    expect(history.undoCount).toBe(100);
  });
});
