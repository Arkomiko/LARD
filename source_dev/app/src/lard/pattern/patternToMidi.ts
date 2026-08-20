import { isNoteEvent, Song, songToMidi } from "@signal-app/core"
import { runInAction } from "mobx"
import { PatternTrackNotes } from "./Pattern"

/**
 * Собирает MIDI-файл из нот паттерна.
 *
 * Берём структуру исходной песни и подменяем в ней ноты нотами паттерна.
 * Что и почему сохраняется:
 *
 * - **Дирижёрский трек целиком.** Без темпа и размера Ableton подставит свои,
 *   и ноты разъедутся по времени.
 * - **Служебные события треков** (инструмент, громкость, панорама, имя).
 *   Они принадлежат треку, а не паттерну, и нужны, чтобы клип звучал так же.
 * - **Ноты — только переданные.** Те, что лежат в треках, отбрасываются:
 *   у неактивного паттерна ноты хранятся в сторе, а не в песне.
 *
 * Разбиение по трекам сохраняется — Ableton раскладывает многотрековый MIDI
 * по отдельным клипам.
 */
export function patternToMidi(
  source: Song,
  patternNotes: readonly PatternTrackNotes[],
): Uint8Array {
  // Song и Track — observable-объекты MobX, поэтому собираем внутри action.
  return runInAction(() => {
    const out = new Song()
    out.timebase = source.timebase

    for (const sourceTrack of source.tracks) {
      // clone копирует канал и все события; id выдаются заново при вставке.
      const track = sourceTrack.clone()

      if (!sourceTrack.isConductorTrack) {
        const noteIds = track.events.filter(isNoteEvent).map((e) => e.id)
        if (noteIds.length > 0) {
          track.removeEvents(noteIds)
        }
        const notes = patternNotes.find(
          (entry) => entry.trackId === sourceTrack.id,
        )?.notes
        if (notes !== undefined && notes.length > 0) {
          track.addEvents(notes)
        }
      }

      out.addTrack(track)
    }

    return songToMidi(out)
  })
}

/**
 * Имя файла для перетаскивания.
 * Символы, недопустимые в путях Windows, заменяются подчёркиванием.
 */
export function patternFileName(patternName: string): string {
  const safe = patternName.replace(/[\\/:*?"<>|]/g, "_").trim()
  return `${safe.length > 0 ? safe : "pattern"}.mid`
}
