// 音符資料型別，以及內建示範曲（程序產生的 A 小調樂句）

export interface Note {
  pitch: number
  start: number
  end: number
  vel: number
  track: number
}

export interface SongTrack {
  name: string
  /** 0 = 主色（PIANO 類），1 = 次要色（LEAD 類） */
  colorSlot: 0 | 1
}

export interface Song {
  title: string
  bpm: number
  bpmSource: 'demo' | 'midi'
  duration: number
  notes: Note[]
  tracks: SongTrack[]
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Am - F - C - G
const PROGRESSION: [number, number[]][] = [
  [45, [57, 60, 64]],
  [41, [57, 60, 65]],
  [48, [55, 60, 64]],
  [43, [55, 59, 62]],
]

const PENTA = [0, 2, 4, 7, 9] // A 小調五聲

export function createDemoSong(): Song {
  const bpm = 120
  const B = 60 / bpm
  const bars = 24
  const rand = mulberry32(7)
  const notes: Note[] = []

  const leadPitches: number[] = []
  for (let p = 64; p <= 86; p++) if (PENTA.includes(p % 12)) leadPitches.push(p)
  let li = 4

  for (let bar = 0; bar < bars; bar++) {
    const t0 = bar * 4 * B
    const [root, chord] = PROGRESSION[bar % 4]

    for (const [beat, len, oct] of [[0, 1.2, -12], [1.5, 0.4, -12], [2, 0.9, 0], [3, 0.4, -12], [3.5, 0.4, -12]]) {
      notes.push({ pitch: root + oct, start: t0 + beat * B, end: t0 + (beat + len) * B, vel: 0.9, track: 2 })
    }
    for (const beat of [0, 2]) {
      for (const p of chord) notes.push({ pitch: p, start: t0 + beat * B, end: t0 + (beat + 1.85) * B, vel: 0.6, track: 1 })
    }

    if (bar < 4) continue
    let beat = 0
    while (beat < 4) {
      const step = rand() < 0.3 ? 0.25 : 0.5
      if (rand() < 0.22) { beat += step; continue }
      const mid = leadPitches.length / 2
      li = Math.max(0, Math.min(leadPitches.length - 1, li + Math.round((rand() - 0.5) * 4 + (mid - li) * 0.2)))
      const len = Math.min(4 - beat, step * (rand() < 0.2 ? 3 : 1))
      notes.push({ pitch: leadPitches[li], start: t0 + beat * B, end: t0 + (beat + len * 0.9) * B, vel: 0.7 + rand() * 0.3, track: 0 })
      beat += len
    }
  }

  notes.sort((a, b) => a.start - b.start)
  return {
    title: '內建示範曲 · A 小調',
    bpm,
    bpmSource: 'demo',
    duration: bars * 4 * B,
    notes,
    tracks: [
      { name: 'Lead', colorSlot: 1 },
      { name: 'Chord', colorSlot: 0 },
      { name: 'Bass', colorSlot: 0 },
    ],
  }
}
