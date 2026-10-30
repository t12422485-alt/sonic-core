import { LANE_COUNT, lanePitches } from '../engine/lanes'
import { player } from '../engine/player'
import { binToFreq, BINS, signal } from '../engine/signal'
import { col, dimText, font, motion, rgba, TAU, type DrawFn } from './theme'

const LOOKAHEAD = 2.4

export const laneFlash = new Float32Array(LANE_COUNT)

/** 只有音訊時，16 條軌道代表 16 個頻段 */
export const bandRanges = Array.from({ length: LANE_COUNT }, (_, i) => {
  const b0 = Math.floor((i / LANE_COUNT) * BINS * 0.9)
  const b1 = Math.floor(((i + 1) / LANE_COUNT) * BINS * 0.9)
  return [b0, b1] as const
})
export const bandLabel = (i: number) => {
  const f = binToFreq(bandRanges[i][0])
  return f >= 1000 ? `${(f / 1000).toFixed(1)}k` : `${Math.round(f)}Hz`
}

// 透視音遊軌道：音符到達判定線時亮起。目前沒有玩家輸入判定，分數只在示範模式出現
export function createRhythm(): DrawFn {
  let prevT = 0
  let score = 0
  let combo = 0

  return (ctx, w, h, f) => {
    ctx.clearRect(0, 0, w, h)
    const c = col()
    const song = player.notesSong
    const t = player.noteTime
    const pitches = song ? lanePitches(song) : []
    const laneOf = new Map(pitches.map((p, i) => [p, i]))

    if (song) {
      if (t < prevT - 0.05) combo = 0
      else if (player.playing)
        for (const n of song.notes) {
          if (n.start > t) break
          if (n.start > prevT) {
            const lane = laneOf.get(n.pitch)
            if (lane === undefined) continue
            laneFlash[lane] = 1
            combo++
            score += 10 * (1 + Math.floor(combo / 50))
          }
        }
      for (let i = 0; i < LANE_COUNT; i++) laneFlash[i] = Math.max(0, laneFlash[i] - f.dt * 3)
    } else {
      for (let i = 0; i < LANE_COUNT; i++) {
        const [b0, b1] = bandRanges[i]
        let v = 0
        for (let b = b0; b < b1; b++) v = Math.max(v, signal.spectrum[b])
        laneFlash[i] = Math.max(0, (v - 0.25) / 0.6)
      }
    }
    prevT = t

    const cx = w / 2 - 6
    const yTop = h * 0.2
    const yHit = h * 0.8
    const wTop = w * 0.42
    const wHit = w * 0.9
    const proj = (z: number) => {
      const p = 1 / (1 + z * 2)
      const k = (p - 1 / 3) / (2 / 3)
      return { y: yTop + (yHit - yTop) * k, half: (wTop + (wHit - wTop) * k) / 2 }
    }
    const xAt = (u: number, half: number) => cx + (u * 2 - 1) * half
    const far = proj(1)
    const near = proj(0)

    ctx.strokeStyle = rgba(c.secondary, 0.6)
    ctx.lineWidth = 0.8
    ctx.beginPath()
    for (const u of [0, 1]) {
      ctx.moveTo(xAt(u, far.half), far.y)
      ctx.lineTo(xAt(u, near.half), near.y)
    }
    ctx.moveTo(xAt(0, far.half), far.y)
    ctx.lineTo(xAt(1, far.half), far.y)
    ctx.stroke()
    ctx.strokeStyle = rgba(c.secondary, 0.2)
    ctx.beginPath()
    for (let i = 1; i < LANE_COUNT; i++) {
      const u = i / LANE_COUNT
      ctx.moveTo(xAt(u, far.half), far.y)
      ctx.lineTo(xAt(u, near.half), near.y)
    }
    ctx.stroke()

    if (song) {
      for (const n of song.notes) {
        if (n.start > t + LOOKAHEAD) break
        if (n.start < t) continue
        const lane = laneOf.get(n.pitch)
        if (lane === undefined) continue
        const p = proj((n.start - t) / LOOKAHEAD)
        const u = (lane + 0.5) / LANE_COUNT
        const nw = ((p.half * 2) / LANE_COUNT) * 0.55
        const nh = 2 + 3 * ((p.y - yTop) / (yHit - yTop))
        ctx.fillStyle = song.tracks[n.track]?.colorSlot === 1 ? c.noteB : c.noteA
        ctx.fillRect(xAt(u, p.half) - nw / 2, p.y - nh / 2, nw, nh)
      }
    } else {
      // 頻段模式：每條軌道上升的能量柱
      for (let i = 0; i < LANE_COUNT; i++) {
        const v = laneFlash[i]
        if (v <= 0) continue
        const z = 1 - Math.min(1, v)
        const p = proj(z)
        const u0 = i / LANE_COUNT + 0.012
        const u1 = (i + 1) / LANE_COUNT - 0.012
        ctx.fillStyle = rgba(c.secondary, 0.35)
        ctx.beginPath()
        ctx.moveTo(xAt(u0, p.half), p.y)
        ctx.lineTo(xAt(u1, p.half), p.y)
        ctx.lineTo(xAt(u1, near.half), near.y)
        ctx.lineTo(xAt(u0, near.half), near.y)
        ctx.fill()
      }
    }

    ctx.fillStyle = rgba(c.secondary, 0.6)
    ctx.fillRect(xAt(0, near.half), yHit, near.half * 2, 1)
    const r = Math.min(7, (near.half * 2) / LANE_COUNT / 2 - 1.5)
    for (let i = 0; i < LANE_COUNT; i++) {
      const x = xAt((i + 0.5) / LANE_COUNT, near.half)
      const fl = laneFlash[i] * motion() + (laneFlash[i] > 0.6 ? 0.4 : 0) * (1 - motion())
      if (fl > 0) {
        ctx.fillStyle = rgba(c.secondary, 0.3 * Math.min(1, fl))
        ctx.beginPath()
        ctx.arc(x, yHit, r + 5 * Math.min(1, fl), 0, TAU)
        ctx.fill()
      }
      const lit = laneFlash[i] > 0.6
      ctx.fillStyle = lit ? c.secondary : c.bg
      ctx.strokeStyle = lit ? c.secondary : rgba(c.text, 0.55)
      ctx.lineWidth = 0.9
      ctx.beginPath()
      ctx.arc(x, yHit, r, 0, TAU)
      ctx.fill()
      ctx.stroke()
    }

    const mx = w - 10
    ctx.fillStyle = rgba(c.text, 0.15)
    ctx.fillRect(mx, h * 0.22, 4, h * 0.5)
    ctx.fillStyle = c.text
    ctx.fillRect(mx, h * 0.72 - signal.level * h * 0.5, 4, signal.level * h * 0.5)

    ctx.font = font(10)
    ctx.fillStyle = dimText()
    if (player.isDemo) {
      ctx.font = font(11, 600)
      ctx.fillStyle = c.text
      ctx.fillText(`SCORE ${String(score % 1e7).padStart(7, '0')}`, 12, 18)
      ctx.textAlign = 'right'
      ctx.font = font(10, 600)
      ctx.fillStyle = c.secondary
      ctx.fillText(`${combo} COMBO ×${1 + Math.floor(combo / 50)}`, w - 20, 18)
      ctx.textAlign = 'left'
      ctx.font = font(10)
      ctx.fillStyle = dimText()
      ctx.fillText('展示模式 · 自動演奏', 12, h - 8)
    } else if (song) {
      ctx.fillText('MIDI 音符 · 到達判定線時亮起', 12, h - 8)
    } else {
      ctx.fillText('音訊頻段模式 · 16 條軌道 = 16 個頻段', 12, h - 8)
    }
  }
}
