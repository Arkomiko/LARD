// Маленькие помощники для построения страницы без библиотек.

type Child = Node | string | null | undefined | false;
type Properties<K extends keyof HTMLElementTagNameMap> = Partial<HTMLElementTagNameMap[K]> & {
  /** Метка элемента, по которой после перерисовки возвращается фокус. */
  focusKey?: string;
};

/**
 * Создать элемент: element("button", { textContent: "OK", onclick }, …дети).
 * Свойства пишутся прямо в элемент, поэтому подходят любые поля DOM:
 * className, value, disabled, title, onclick, onchange и так далее.
 */
export function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  properties: Properties<K> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const { focusKey, ...domProperties } = properties;
  const node = document.createElement(tag);
  Object.assign(node, domProperties);
  if (focusKey) node.dataset.focusKey = focusKey;
  for (const child of children) if (child) node.append(child);
  return node;
}

/**
 * Заменить содержимое контейнера. Если фокус был на поле внутри, он
 * возвращается на поле с той же меткой focusKey — иначе после каждой
 * правки курсор «выпрыгивал» бы из поля ввода.
 */
export function renderInto(container: HTMLElement, ...nodes: Node[]): void {
  const active = document.activeElement;
  const focusKey =
    active instanceof HTMLElement && container.contains(active) ? active.dataset.focusKey : undefined;
  container.replaceChildren(...nodes);
  if (focusKey) container.querySelector<HTMLElement>(`[data-focus-key="${CSS.escape(focusKey)}"]`)?.focus();
}

/** Выпадающий список из пар «значение — подпись». */
export function select(
  options: readonly { value: string; label: string }[],
  selected: string,
  properties: Properties<"select"> = {},
): HTMLSelectElement {
  const node = element("select", properties);
  for (const option of options)
    node.add(new Option(option.label, option.value, false, option.value === selected));
  return node;
}

/** Число из поля ввода; пустое или не число — NaN (модель сама приведёт к границам). */
export function numberFrom(input: HTMLInputElement | HTMLSelectElement): number {
  return input.value.trim() === "" ? Number.NaN : Number(input.value);
}
