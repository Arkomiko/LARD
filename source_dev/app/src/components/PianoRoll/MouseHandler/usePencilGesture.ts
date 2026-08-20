import { MouseGesture } from "../../../gesture/MouseGesture"
import { useCreateNoteGesture } from "./gestures/useCreateNoteGesture"
import { useSelectNoteGesture } from "./gestures/useSelectNoteGesture"

export const usePencilGesture = (): MouseGesture => {
  const createNoteGesture = useCreateNoteGesture()
  const selectNoteGesture = useSelectNoteGesture()

  return {
    onMouseDown(e: MouseEvent) {
      switch (e.button) {
        case 0: {
          // LARD: добавлен ctrlKey. Апстрим проверял только metaKey (Cmd на macOS),
          // поэтому на Windows выделение области по Ctrl+протяжке не работало вовсе.
          if (e.shiftKey || e.metaKey || e.ctrlKey) {
            return selectNoteGesture.onMouseDown(e)
          } else {
            return createNoteGesture.onMouseDown(e)
          }
        }
        default:
          return null
      }
    },
  }
}
