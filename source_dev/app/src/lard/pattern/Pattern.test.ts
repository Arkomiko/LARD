import { NoteEvent, Track, TrackId } from "@signal-app/core"
import { describe, expect, it } from "vitest"
import {
  captureNotes,
  countNotes,
  createPattern,
  defaultPatternName,
  nextPatternId,
  noteCountLabel,
  Pattern,
} from "./Pattern"

/** Минимальная заглушка трека: captureNotes читает только id и events. */
function fakeTrack(id: number, events: unknown[]): Track {
  return { id: id as TrackId, events } as unknown as Track
}

function note(id: number, noteNumber: number): NoteEvent {
  return {
    id,
    type: "channel",
    subtype: "note",
    tick: 0,
    noteNumber,
    velocity: 100,
    duration: 120,
  } as NoteEvent
}

describe("captureNotes", () => {
  it("убирает id событий, чтобы трек выдал новые при вставке", () => {
    const captured = captureNotes([fakeTrack(1, [note(42, 60)])])

    expect(captured).toHaveLength(1)
    expect(captured[0].trackId).toBe(1)
    expect(captured[0].notes[0]).not.toHaveProperty("id")
    expect(captured[0].notes[0].noteNumber).toBe(60)
  })

  it("не трогает служебные события трека", () => {
    const programChange = { id: 7, type: "channel", subtype: "programChange" }
    const captured = captureNotes([
      fakeTrack(1, [note(1, 60), programChange, note(2, 64)]),
    ])

    expect(captured[0].notes).toHaveLength(2)
  })

  it("пропускает треки без нот", () => {
    const captured = captureNotes([
      fakeTrack(1, [note(1, 60)]),
      fakeTrack(2, []),
    ])

    expect(captured.map((e) => e.trackId)).toEqual([1])
  })
})

describe("nextPatternId", () => {
  it("выдаёт единицу для пустого списка", () => {
    expect(nextPatternId([])).toBe(1)
  })

  it("не переиспользует id после удаления из середины", () => {
    const patterns = [createPattern(1, "a"), createPattern(5, "b")]
    expect(nextPatternId(patterns)).toBe(6)
  })
})

describe("defaultPatternName", () => {
  it("нумерует по количеству паттернов", () => {
    expect(defaultPatternName([createPattern(1, "Pattern 1")])).toBe(
      "Pattern 2",
    )
  })

  it("обходит уже занятое имя", () => {
    const patterns = [
      createPattern(1, "Pattern 1"),
      createPattern(2, "Pattern 3"),
    ]
    // Кандидат «Pattern 3» занят, поэтому берётся следующий свободный.
    expect(defaultPatternName(patterns)).toBe("Pattern 4")
  })
})

describe("noteCountLabel", () => {
  it("склоняет по последней цифре", () => {
    expect(noteCountLabel(0)).toBe("0 нот")
    expect(noteCountLabel(1)).toBe("1 нота")
    expect(noteCountLabel(3)).toBe("3 ноты")
    expect(noteCountLabel(7)).toBe("7 нот")
    expect(noteCountLabel(21)).toBe("21 нота")
    expect(noteCountLabel(34)).toBe("34 ноты")
  })

  it("обрабатывает исключение 11-14", () => {
    expect(noteCountLabel(11)).toBe("11 нот")
    expect(noteCountLabel(12)).toBe("12 нот")
    expect(noteCountLabel(14)).toBe("14 нот")
    expect(noteCountLabel(114)).toBe("114 нот")
  })
})

describe("countNotes", () => {
  it("складывает ноты по всем трекам паттерна", () => {
    const pattern: Pattern = {
      id: 1,
      name: "p",
      notes: [
        { trackId: 1 as TrackId, notes: [note(1, 60), note(2, 62)] },
        { trackId: 2 as TrackId, notes: [note(3, 64)] },
      ],
    }

    expect(countNotes(pattern)).toBe(3)
  })
})
