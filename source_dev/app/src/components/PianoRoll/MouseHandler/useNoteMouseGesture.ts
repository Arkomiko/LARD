import { useCallback, useMemo } from "react"
import { MouseGesture } from "../../../gesture/MouseGesture"
import { usePianoRoll } from "../../../hooks/usePianoRoll"
import { usePaintNoteGesture } from "../../../lard/tools/usePaintNoteGesture"
import { useChangeToolGesture } from "./gestures/useChangeToolGesture"
import { useDragScrollGesture } from "./gestures/useDragScrollGesture"
import { usePencilGesture } from "./usePencilGesture"
import { useSelectionGesture } from "./useSelectionGesture"

/**
 * Ластик по пустому месту не делает ничего: удаление живёт на самих нотах
 * (см. NoteHitAreas), а клик мимо ноты в FL просто ничего не стирает.
 * Объект вынесен из хука, чтобы ссылка была стабильной.
 */
const noopGesture: MouseGesture = { onMouseDown: () => {} }

export const useNoteMouseGesture = (): MouseGesture<[], React.MouseEvent> => {
  const { mouseMode } = usePianoRoll()
  const pencilGesture = usePencilGesture()
  const paintGesture = usePaintNoteGesture()
  const selectionGesture = useSelectionGesture()
  const currentGesture = useMemo(() => {
    switch (mouseMode) {
      case "pencil":
        return pencilGesture
      case "paint":
        return paintGesture
      case "delete":
        return noopGesture
      case "selection":
        return selectionGesture
    }
  }, [mouseMode, pencilGesture, paintGesture, selectionGesture])
  const dragScrollAction = useDragScrollGesture()
  const changeToolAction = useChangeToolGesture()

  const getGestureForMouseDown = useCallback(
    (e: MouseEvent) => {
      // Common Action

      // wheel drag to start scrolling
      if (e.button === 1) {
        return dragScrollAction
      }

      // Right Double-click
      if (e.button === 2 && e.detail % 2 === 0) {
        return changeToolAction
      }

      return currentGesture
    },
    [changeToolAction, currentGesture, dragScrollAction],
  )

  return {
    onMouseDown: useCallback(
      (ev) => {
        const e = ev.nativeEvent
        getGestureForMouseDown(e).onMouseDown(e)
      },
      [getGestureForMouseDown],
    ),
  }
}
