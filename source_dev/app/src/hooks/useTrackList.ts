import { TrackId } from "@signal-app/core"
import { useCallback } from "react"
import { usePanel } from "../workspace/useWorkspace"
import { useSong } from "./useSong"

export function useTrackList() {
  const { tracks, getTrack, moveTrack } = useSong()
  // Видимость и ширина стойки заданы рабочей областью: это часть раскладки,
  // а не отдельная настройка. Переключатель в тулбаре меняет ту же раскладку.
  const panel = usePanel("trackList")
  const trackIds = tracks
    .filter((track) => !track.isConductorTrack)
    .map((track) => track.id)

  return {
    get isOpen() {
      return panel.isOpen
    },
    setOpen: panel.setOpen,
    trackIds,
    moveTrack: useCallback(
      (id: TrackId, overId: TrackId) => {
        const track = getTrack(id)
        const overTrack = getTrack(overId)
        if (track === undefined || overTrack === undefined) {
          return
        }
        const fromIndex = tracks.indexOf(track)
        const toIndex = tracks.indexOf(overTrack)
        moveTrack(fromIndex, toIndex)
      },
      [tracks, getTrack, moveTrack],
    ),
  }
}
