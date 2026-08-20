/**
 * Общий разбор папки пресетов.
 *
 * Темы, языки и рабочие области устроены одинаково: папка, в ней файлы, имя
 * файла — имя пресета, содержимое — неполное описание, которое накладывается
 * на базовое. Разбор у всех трёх один и тот же, поэтому он лежит здесь: иначе
 * приложение и каждый из редакторов в `Tools` писали бы его заново, и рано или
 * поздно они разошлись бы в мелочах вроде того, откуда берётся подпись.
 *
 * Само чтение папки здесь намеренно не делается. В приложении папку
 * разворачивает сборщик (`import.meta.glob` у Vite), в редакторах — файловая
 * система Electron. Сюда передают уже готовый набор модулей, и ядро остаётся
 * независимым от того, кто и как их достал.
 */

/** Один прочитанный файл пресета. */
export interface PresetModule<TFile> {
  /** Содержимое файла. */
  default: TFile
  /**
   * Подпись для списка в настройках, если файл выносит её отдельным
   * экспортом (так сделано у языков — они лежат в `.ts`, а не в `.json`).
   */
  label?: string
}

/** Набор файлов пресетов: путь к файлу → его содержимое. */
export type PresetModules<TFile> = Record<string, PresetModule<TFile>>

/**
 * Имя пресета — это имя файла без расширения.
 *
 * Берём именно базовое имя, а не отрезаем фиксированный префикс: папки
 * пресетов лежат вне корня сборки, и Vite отдаёт ключи то относительным
 * путём, то в виде `/@fs/...`. Привязка к префиксу на этом ломалась бы.
 */
export const presetNameFromPath = (path: string): string =>
  path.replace(/^.*[/\\]/, "").replace(/\.[^.]+$/, "")

/** Разобранная папка пресетов. */
export interface PresetCollection<TValue> {
  /** Готовые значения по имени пресета. */
  values: Record<string, TValue>
  /** Подписи по имени пресета — для выпадающих списков. */
  labels: Record<string, string>
  /** Имена найденных пресетов в порядке появления в папке. */
  names: string[]
}

export interface CollectPresetsOptions<TFile, TValue> {
  /**
   * Как из содержимого файла получить готовое значение. Обычно — наложить
   * его на базовое, чтобы неполный файл не оставлял дырок.
   */
  build: (file: TFile, name: string) => TValue
  /**
   * Откуда взять подпись, если файл хранит её внутри себя (так у тем и
   * рабочих областей — это поле `label` в JSON).
   */
  label?: (file: TFile, name: string) => string | undefined
}

/**
 * Превращает набор файлов в готовую коллекцию пресетов.
 *
 * Файл без содержимого пропускается: испорченный или пустой пресет не должен
 * ронять всё приложение — остальные обязаны загрузиться.
 */
export const collectPresets = <TFile, TValue>(
  modules: PresetModules<TFile>,
  { build, label }: CollectPresetsOptions<TFile, TValue>,
): PresetCollection<TValue> => {
  const values: Record<string, TValue> = {}
  const labels: Record<string, string> = {}

  for (const [path, module] of Object.entries(modules)) {
    const file = module?.default
    if (file === undefined || file === null) {
      continue
    }

    const name = presetNameFromPath(path)
    values[name] = build(file, name)
    labels[name] = module.label ?? label?.(file, name) ?? name
  }

  return { values, labels, names: Object.keys(values) }
}

/**
 * Пресет по имени с откатом на запасной.
 *
 * Нужен всем трём видам: имя приходит из настроек, а файл к этому моменту
 * могли переименовать или удалить — интерфейс не должен на этом падать.
 */
export const pickPreset = <TValue>(
  values: Record<string, TValue>,
  name: string,
  fallbackName: string,
): TValue | undefined => values[name] ?? values[fallbackName]
