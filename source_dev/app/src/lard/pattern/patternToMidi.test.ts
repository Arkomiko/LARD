import { emptySong, NoteEvent } from "@signal-app/core"
import { AnyEvent, read } from "midifile-ts"
import { runInAction } from "mobx"
import { describe, expect, it } from "vitest"
import { PatternNote } from "./Pattern"
import { patternFileName, patternToMidi } from "./patternToMidi"

function note(noteNumber: number, tick = 0): PatternNote {
  return {
    type: "channel",
    subtype: "note",
    tick,
    noteNumber,
    velocity: 100,
    duration: 120,
  } as PatternNote
}

/** Все noteOn из готового файла, с ненулевой громкостью. */
function noteOnNumbers(bytes: Uint8Array): number[] {
  const midi = read(bytes)
  const result: number[] = []
  for (const track of midi.tracks) {
    for (const e of track as AnyEvent[]) {
      if (e.type === "channel" && e.subtype === "noteOn" && e.velocity > 0) {
        result.push(e.noteNumber)
      }
    }
  }
  return result.sort((a, b) => a - b)
}

describe("patternToMidi", () => {
  it("складывает ноты паттерна в читаемый MIDI-файл", () => {
    const song = emptySong()
    const track = song.tracks[1]

    const bytes = patternToMidi(song, [
      { trackId: track.id, notes: [note(60), note(64), note(67)] },
    ])

    expect(noteOnNumbers(bytes)).toEqual([60, 64, 67])
  })

  it("берёт ноты из паттерна, а не из треков песни", () => {
    const song = emptySong()
    const track = song.tracks[1]
    // Ноты, лежащие в треке, принадлежат другому — активному — паттерну.
    track.addEvents([note(36) as Omit<NoteEvent, "id">])

    const bytes = patternToMidi(song, [
      { trackId: track.id, notes: [note(72)] },
    ])

    // 36 попасть в файл не должна, иначе перетаскивание неактивного паттерна
    // тащило бы чужие ноты.
    expect(noteOnNumbers(bytes)).toEqual([72])
  })

  it("сохраняет темп песни", () => {
    const song = emptySong()
    // setTempo меняет observable-массив, поэтому только внутри action.
    runInAction(() => song.tracks[0].setTempo(140, 0))

    const midi = read(patternToMidi(song, []))
    const tempoEvents = midi.tracks
      .flat()
      .filter((e) => e.type === "meta" && e.subtype === "setTempo")

    expect(tempoEvents.length).toBeGreaterThan(0)
    // 140 BPM = 428571 микросекунд на четверть.
    // Индекс, а не .at(-1): цель компиляции приложения его не поддерживает.
    const last = tempoEvents[tempoEvents.length - 1] as {
      microsecondsPerBeat: number
    }
    expect(Math.round(60000000 / last.microsecondsPerBeat)).toBe(140)
  })

  it("не портит исходную песню", () => {
    const song = emptySong()
    const track = song.tracks[1]
    track.addEvents([note(36) as Omit<NoteEvent, "id">])
    const before = track.events.length

    patternToMidi(song, [{ trackId: track.id, notes: [note(72)] }])

    expect(track.events.length).toBe(before)
  })
})

describe("patternFileName", () => {
  it("добавляет расширение", () => {
    expect(patternFileName("Pattern 1")).toBe("Pattern 1.mid")
  })

  it("заменяет недопустимые в путях символы", () => {
    expect(patternFileName('bass: "wob"/2')).toBe("bass_ _wob__2.mid")
  })

  it("подставляет имя по умолчанию для пустого", () => {
    expect(patternFileName("   ")).toBe("pattern.mid")
  })
})
