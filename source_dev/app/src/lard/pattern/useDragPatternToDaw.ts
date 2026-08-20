import { useCallback } from "react"
import { isRunningInElectron } from "../../helpers/platform"
import { useSong } from "../../hooks/useSong"
import { captureNotes, PatternId } from "./Pattern"
import { patternFileName, patternToMidi } from "./patternToMidi"
import { usePatternList } from "./usePatternList"

/**
 * Перетаскивание паттерна из списка в Ableton (и любой другой хост).
 *
 * Работает только в окне программы. В браузере такое невозможно
 * принципиально: вкладке запрещено отдавать файлы другому приложению —
 * перенос выполняет главный процесс Electron через startDrag.
 */
export function useDragPatternToDaw() {
  const { getSong } = useSong()
  const { patterns, selectedPatternId } = usePatternList()

  const startDrag = useCallback(
    async (patternId: PatternId) => {
      const pattern = patterns.find((p) => p.id === patternId)
      if (pattern === undefined) {
        return
      }

      const song = getSong()

      // У активного паттерна ноты лежат в треках песни, а не в сторе,
      // поэтому его снимаем прямо с треков — иначе уедет пустой файл.
      const notes =
        patternId === selectedPatternId
          ? captureNotes(song.tracks.filter((t) => !t.isConductorTrack))
          : pattern.notes

      const bytes = patternToMidi(song, notes)

      // Отдаём ровно занятый отрезок буфера: у Uint8Array он может быть
      // частью более крупного ArrayBuffer, и тогда в файл попадёт мусор.
      const data = (bytes.buffer as ArrayBuffer).slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      )

      await window.electronAPI.startPatternDrag(
        patternFileName(pattern.name),
        data,
      )
    },
    [patterns, selectedPatternId, getSong],
  )

  return {
    /** В браузере перетаскивание недоступно — кнопку тянуть бессмысленно. */
    canDrag: isRunningInElectron(),
    startDrag,
  }
}
