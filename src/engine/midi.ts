import { Midi } from '@tonejs/midi'
import type { Note, Song } from './demoSong'

// 解析 MIDI 檔為 Song；沒有音符時丟出易懂的錯誤
export async function parseMidiFile(file: File): Promise<Song> {
  let midi: Midi
  try {
    midi = new Midi(await file.arrayBuffer())
  } catch {
    throw new Error(`「${file.name}」不是有效的 MIDI 檔（.mid / .midi）。`)
  }
  const notes: Note[] = []
  const tracks: Song['tracks'] = []
  for (const tr of midi.tracks) {
    if (!tr.notes.length) continue
    const idx = tracks.length
    tracks.push({ name: tr.name || tr.instrument.name || `Track ${idx + 1}`, colorSlot: idx % 2 === 0 ? 0 : 1 })
    for (const n of tr.notes) {
      notes.push({ pitch: n.midi, start: n.time, end: n.time + Math.max(0.03, n.duration), vel: n.velocity, track: idx })
    }
  }
  if (!notes.length) throw new Error(`「${file.name}」裡沒有任何音符。`)
  notes.sort((a, b) => a.start - b.start)
  const bpm = Math.round(midi.header.tempos[0]?.bpm ?? 120)
  return {
    title: file.name,
    bpm,
    bpmSource: 'midi',
    duration: Math.max(...notes.map((n) => n.end)) + 0.5,
    notes,
    tracks,
  }
}
