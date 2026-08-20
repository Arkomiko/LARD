import { NoteEvent, NoteNumber } from "@signal-app/core"
import { useCallback } from "react"
import { Point } from "../../entities/geometry/Point"
import { MouseGesture } from "../../gesture/MouseGesture"
import { observeDrag2 } from "../../helpers/observeDrag"
import { useHistory } from "../../hooks/useHistory"
import { usePianoRoll } from "../../hooks/usePianoRoll"
import { useQuantizer } from "../../hooks/useQuantizer"
import { useSong } from "../../hooks/useSong"
import { useTrack } from "../../hooks/useTrack"

/**
 * Кисть (Paint, клавиша B) — инструмент FL Studio.
 *
 * В отличие от карандаша, который ставит одну ноту и потом её тащит, кисть
 * сыплет ноты по всему пути курсора. Это основной способ набивать хэты
 * и роллы: провёл — получил ряд.
 */
export const usePaintNoteGesture = (): MouseGesture => {
  const {
    transform,
    selectedTrackId,
    newNoteVelocity,
    lastNoteDuration,
    getLocal,
  } = usePianoRoll()
  const { quantizeRound, quantizeFloor, quantizeUnit } = useQuantizer()
  const { channel, isRhythmTrack, addEvent } = useTrack(selectedTrackId)
  const { timebase } = useSong()
  const { pushHistory } = useHistory()

  return {
    onMouseDown: useCallback(
      (e) => {
        if (channel === undefined) {
          return
        }

        const startPos = getLocal(e)

        // История пишется один раз на всю протяжку: иначе отмена снимала бы
        // ноты по одной, хотя для пользователя это был один мазок.
        pushHistory()

        const duration = isRhythmTrack
          ? timebase / 8 // 1/32 на ритм-дорожке, как в карандаше
          : (lastNoteDuration ?? quantizeUnit)

        // Клетки, где нота уже поставлена. Без этого дрожание курсора внутри
        // одной клетки складывало бы десятки нот друг на друга.
        const painted = new Set<string>()

        const paintAt = (local: Point) => {
          const { tick, noteNumber } = transform.getNotePoint(local)

          if (!NoteNumber.isValid(noteNumber)) {
            return
          }

          const quantizedTick = isRhythmTrack
            ? quantizeRound(tick)
            : quantizeFloor(tick)

          if (quantizedTick < 0) {
            return
          }

          const cell = `${quantizedTick}:${noteNumber}`

          if (painted.has(cell)) {
            return
          }

          painted.add(cell)

          addEvent({
            type: "channel",
            subtype: "note",
            noteNumber,
            tick: quantizedTick,
            velocity: newNoteVelocity,
            duration,
          } as NoteEvent)
        }

        paintAt(startPos)

        observeDrag2(e, {
          onMouseMove: (_e, delta) => paintAt(Point.add(startPos, delta)),
        })
      },
      [
        transform,
        getLocal,
        channel,
        isRhythmTrack,
        quantizeRound,
        quantizeFloor,
        quantizeUnit,
        timebase,
        newNoteVelocity,
        lastNoteDuration,
        addEvent,
        pushHistory,
      ],
    ),
  }
}
