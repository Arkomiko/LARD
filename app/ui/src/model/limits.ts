// Приведение чисел к допустимым границам. Используется везде, где значение
// приходит снаружи: из интерфейса, из мода, из файла.

/** Целое число в границах [min, max]. Не число (NaN, бесконечность) превращается в min. */
export function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** Дробное число в границах [min, max]. Не число превращается в min. */
export function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** Имя без пробелов по краям; пустое имя заменяется запасным. */
export function cleanName(name: string, fallback: string): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}
