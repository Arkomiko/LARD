import { isNoteEvent, NoteEvent, Track, TrackId } from "@signal-app/core"

/** Идентификатор паттерна. Уникален в пределах проекта. */
export type PatternId = number

/**
 * Нота внутри паттерна — без поля id.
 *
 * Идентификаторы событий выдаёт сам трек при вставке, поэтому хранить их
 * в паттерне нельзя: после первой же перезагрузки паттерна они разойдутся
 * с реальными событиями трека.
 */
export type PatternNote = Omit<NoteEvent, "id">

/** Ноты паттерна, относящиеся к одному треку. */
export interface PatternTrackNotes {
  trackId: TrackId
  notes: PatternNote[]
}

/**
 * Паттерн — именованный набор нот, как в FL Studio.
 *
 * Хранит ноты по трекам. Модель обмена: в любой момент в треках песни лежат
 * ноты только активного паттерна, а остальные ждут своей очереди здесь.
 * При переключении ноты трека выгружаются в покидаемый паттерн, а на их место
 * загружаются ноты выбранного.
 *
 * Такой подход позволяет не трогать пианоролл вообще: он продолжает
 * редактировать обычные треки и ничего не знает о паттернах.
 */
export interface Pattern {
  id: PatternId
  name: string
  notes: PatternTrackNotes[]
}

/** Создаёт пустой паттерн. */
export function createPattern(id: PatternId, name: string): Pattern {
  return { id, name, notes: [] }
}

/** Следующий свободный идентификатор. */
export function nextPatternId(patterns: readonly Pattern[]): PatternId {
  return patterns.reduce((max, p) => Math.max(max, p.id), 0) + 1
}

/**
 * Имя для нового паттерна: «Pattern N», где N — первый незанятый номер.
 * Считаем по количеству, а не по максимуму id, чтобы имена не убегали
 * в большие числа после удалений.
 */
export function defaultPatternName(patterns: readonly Pattern[]): string {
  let n = patterns.length + 1
  const names = new Set(patterns.map((p) => p.name))
  while (names.has(`Pattern ${n}`)) {
    n++
  }
  return `Pattern ${n}`
}

/**
 * Снимает ноты со всех треков.
 *
 * Служебные события (смена инструмента, контроллеры, темп) не трогаем —
 * они принадлежат треку, а не паттерну, и при переключении остаются на месте.
 */
export function captureNotes(tracks: readonly Track[]): PatternTrackNotes[] {
  return tracks
    .map((track) => ({
      trackId: track.id,
      notes: track.events.filter(isNoteEvent).map(stripId),
    }))
    .filter((entry) => entry.notes.length > 0)
}

/** Убирает id события: при вставке в трек он будет выдан заново. */
function stripId(event: NoteEvent): PatternNote {
  const { id: _id, ...rest } = event
  return rest
}

/** Общее число нот в паттерне — для подписи в списке. */
export function countNotes(pattern: Pattern): number {
  return pattern.notes.reduce((sum, entry) => sum + entry.notes.length, 0)
}

/** Подпись с русским склонением: 1 нота, 2 ноты, 5 нот, 11 нот. */
export function noteCountLabel(count: number): string {
  const mod100 = count % 100
  const mod10 = count % 10
  // 11–14 — исключение: «одиннадцать нот», а не «нота».
  if (mod100 >= 11 && mod100 <= 14) {
    return `${count} нот`
  }
  if (mod10 === 1) {
    return `${count} нота`
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return `${count} ноты`
  }
  return `${count} нот`
}
