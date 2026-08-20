import { isNoteEvent, Track } from "@signal-app/core"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { transaction } from "mobx"
import { useCallback } from "react"
import { useSong } from "../../hooks/useSong"
import { usePanel } from "../../workspace/useWorkspace"
import {
  captureNotes,
  countNotes,
  createPattern,
  defaultPatternName,
  nextPatternId,
  Pattern,
  PatternId,
} from "./Pattern"

/**
 * Список паттернов и переключение между ними.
 *
 * Ноты активного паттерна физически лежат в треках песни, остальные —
 * в этом сторе. Переключение = выгрузить ноты трека в покидаемый паттерн
 * и загрузить на их место ноты выбранного. Подробнее — в Pattern.ts.
 */
export function usePatternList() {
  const { getSong } = useSong()
  // Видимость и ширина панели заданы рабочей областью — как у остальных панелей.
  const panel = usePanel("patternList")
  const patterns = useAtomValue(patternsAtom)
  const selectedPatternId = useAtomValue(selectedPatternIdAtom)
  const setPatterns = useSetAtom(patternsAtom)
  const setSelectedPatternId = useSetAtom(selectedPatternIdAtom)

  /** Треки, в которых вообще могут быть ноты. */
  const getNoteTracks = useCallback(
    (): Track[] => getSong().tracks.filter((t) => !t.isConductorTrack),
    [getSong],
  )

  /**
   * Записывает текущие ноты треков в паттерн с указанным id.
   * Возвращает обновлённый список — чтобы вызывающий мог сразу его использовать,
   * не дожидаясь перерисовки.
   */
  const storeCurrentNotes = useCallback(
    (into: PatternId, list: readonly Pattern[]): Pattern[] => {
      const notes = captureNotes(getNoteTracks())
      return list.map((p) => (p.id === into ? { ...p, notes } : p))
    },
    [getNoteTracks],
  )

  /**
   * Заменяет ноты треков нотами паттерна. Служебные события не трогает.
   *
   * Всё в одной транзакции: иначе на каждый трек приходится два действия MobX,
   * и пианоролл успевает отрисовать промежуточное состояние, где ноты уже
   * удалены, а новые ещё не вставлены — это видно как мигание при переключении.
   */
  const loadNotes = useCallback(
    (pattern: Pattern) => {
      transaction(() => {
        for (const track of getNoteTracks()) {
          const noteIds = track.events.filter(isNoteEvent).map((e) => e.id)
          if (noteIds.length > 0) {
            track.removeEvents(noteIds)
          }
          const entry = pattern.notes.find((n) => n.trackId === track.id)
          if (entry !== undefined && entry.notes.length > 0) {
            track.addEvents(entry.notes)
          }
        }
      })
    },
    [getNoteTracks],
  )

  const selectPattern = useCallback(
    (id: PatternId) => {
      if (id === selectedPatternId) {
        return
      }
      const target = patterns.find((p) => p.id === id)
      if (target === undefined) {
        return
      }
      // Порядок важен: сначала сохранить уходящий паттерн, потом грузить новый.
      const saved = storeCurrentNotes(selectedPatternId, patterns)
      setPatterns(saved)
      loadNotes(target)
      setSelectedPatternId(id)
    },
    [
      patterns,
      selectedPatternId,
      storeCurrentNotes,
      loadNotes,
      setPatterns,
      setSelectedPatternId,
    ],
  )

  const addPattern = useCallback(() => {
    const saved = storeCurrentNotes(selectedPatternId, patterns)
    const created = createPattern(
      nextPatternId(saved),
      defaultPatternName(saved),
    )
    setPatterns([...saved, created])
    loadNotes(created) // новый паттерн пустой — треки очищаются
    setSelectedPatternId(created.id)
  }, [
    patterns,
    selectedPatternId,
    storeCurrentNotes,
    loadNotes,
    setPatterns,
    setSelectedPatternId,
  ])

  const duplicatePattern = useCallback(
    (id: PatternId) => {
      const saved = storeCurrentNotes(selectedPatternId, patterns)
      const source = saved.find((p) => p.id === id)
      if (source === undefined) {
        return
      }
      const copy: Pattern = {
        id: nextPatternId(saved),
        name: `${source.name} copy`,
        notes: source.notes.map((entry) => ({
          trackId: entry.trackId,
          notes: entry.notes.map((n) => ({ ...n })),
        })),
      }
      setPatterns([...saved, copy])
      loadNotes(copy)
      setSelectedPatternId(copy.id)
    },
    [
      patterns,
      selectedPatternId,
      storeCurrentNotes,
      loadNotes,
      setPatterns,
      setSelectedPatternId,
    ],
  )

  const removePattern = useCallback(
    (id: PatternId) => {
      // Последний паттерн не удаляем: редактору всегда нужен активный.
      if (patterns.length <= 1) {
        return
      }
      const rest = patterns.filter((p) => p.id !== id)
      setPatterns(rest)
      // Удалили активный — переходим на соседний и подгружаем его ноты.
      if (id === selectedPatternId) {
        const next = rest[0]
        loadNotes(next)
        setSelectedPatternId(next.id)
      }
    },
    [patterns, selectedPatternId, loadNotes, setPatterns, setSelectedPatternId],
  )

  const renamePattern = useCallback(
    (id: PatternId, name: string) => {
      const trimmed = name.trim()
      if (trimmed.length === 0) {
        return
      }
      setPatterns(
        patterns.map((p) => (p.id === id ? { ...p, name: trimmed } : p)),
      )
    },
    [patterns, setPatterns],
  )

  /**
   * Количество нот в паттерне для подписи в списке.
   * У активного паттерна ноты лежат в треках, а не в сторе, поэтому его
   * считаем напрямую по трекам — иначе в списке всегда был бы ноль.
   */
  const getNoteCount = useCallback(
    (id: PatternId): number => {
      if (id === selectedPatternId) {
        return getNoteTracks().reduce(
          (sum, t) => sum + t.events.filter(isNoteEvent).length,
          0,
        )
      }
      const pattern = patterns.find((p) => p.id === id)
      return pattern === undefined ? 0 : countNotes(pattern)
    },
    [patterns, selectedPatternId, getNoteTracks],
  )

  return {
    get isOpen() {
      return panel.isOpen
    },
    setOpen: panel.setOpen,
    patterns,
    selectedPatternId,
    selectPattern,
    addPattern,
    duplicatePattern,
    removePattern,
    renamePattern,
    getNoteCount,
  }
}

// atoms

const FIRST_PATTERN_ID: PatternId = 1

const patternsAtom = atom<Pattern[]>([
  createPattern(FIRST_PATTERN_ID, "Pattern 1"),
])

const selectedPatternIdAtom = atom<PatternId>(FIRST_PATTERN_ID)
