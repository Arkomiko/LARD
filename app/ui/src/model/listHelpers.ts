// Помощники для неизменяемых списков: заменить элемент по номеру, не трогая
// остальные. Если на деле ничего не изменилось, возвращается тот же список —
// так правка без изменений не попадает в историю отмены.

interface WithId {
  readonly id: string;
}

export function replaceById<T extends WithId>(
  items: readonly T[],
  id: string,
  change: (item: T) => T,
): readonly T[] {
  const index = items.findIndex((item) => item.id === id);
  const item = items[index];
  if (item === undefined) return items;
  const changed = change(item);
  if (changed === item) return items;
  const copy = items.slice();
  copy[index] = changed;
  return copy;
}

export function findById<T extends WithId>(items: readonly T[], id: string): T | undefined {
  return items.find((item) => item.id === id);
}
