import { isEqual } from "lodash"
import { toJS } from "mobx"
import { usePanel } from "../workspace/useWorkspace"
import { useMobxSelector } from "./useMobxSelector"
import { usePianoRoll } from "./usePianoRoll"
import { useTrack } from "./useTrack"

export function useEventList() {
  // Видимость списка событий — часть рабочей области, как и у других панелей.
  const panel = usePanel("eventList")

  return {
    get events() {
      const { selectedTrackId, selectedNoteIds } = usePianoRoll()
      const { events: trackEvents } = useTrack(selectedTrackId)
      return useMobxSelector(
        () => {
          if (selectedNoteIds.length > 0) {
            return trackEvents.filter(
              (event) => selectedNoteIds.indexOf(event.id) >= 0,
            )
          }
          return toJS(trackEvents)
        },
        [trackEvents, selectedNoteIds],
        isEqual,
      )
    },
    get isOpen() {
      return panel.isOpen
    },
    setOpen: panel.setOpen,
  }
}
