import type { Song } from './demoSong'

// 音遊軌道與音符鍵共用：曲中最常出現的 16 個音高，由低到高
export const LANE_COUNT = 16

const cache = new WeakMap<Song, number[]>()

export function lanePitches(song: Song) {
  let p = cache.get(song)
  if (!p) {
    const count = new Map<number, number>()
    for (const n of song.notes) count.set(n.pitch, (count.get(n.pitch) ?? 0) + 1)
    p = [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, LANE_COUNT).map(([k]) => k).sort((a, b) => a - b)
    cache.set(song, p)
  }
  return p
}
