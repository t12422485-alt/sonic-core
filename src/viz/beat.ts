import { player } from '../engine/player'
import { BINS, signal } from '../engine/signal'
import { col, dimText, font, motion, rgba, TAU, ts, type DrawFn } from './theme'

const BPM_SOURCE = { demo: '示範設定', midi: 'MIDI 檔', manual: '手動輸入', none: '' } as const

// 圓形節拍盤：拍點、小節、播放狀態；BPM 一律標示來源
export function createBeatMeter(): DrawFn {
  return (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    const c = col()
    const cx = w / 2
    const cy = h / 2 + 4
    const R = Math.min(w, h) * 0.33
    const top = -Math.PI / 2
    const { value: bpm, source } = player.bpm
    const beat = signal.beat
    const barPos = beat % 4
    const cur = Math.floor(barPos)
    const pulse = player.playing && bpm ? Math.exp(-(beat % 1) * 5) * motion() : 0

    ctx.strokeStyle = rgba(c.text, 0.35)
    ctx.lineWidth = 0.8
    for (const k of [1, 0.58]) {
      ctx.beginPath()
      ctx.arc(cx, cy, R * k, 0, TAU)
      ctx.stroke()
    }
    for (let i = 0; i < 24; i++) {
      const a = top + (i / 24) * TAU
      const r0 = R * (i % 6 === 0 ? 1.1 : 1.05)
      ctx.lineWidth = i % 6 === 0 ? 1.4 : 0.8
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0)
      ctx.lineTo(cx + Math.cos(a) * R * 1.16, cy + Math.sin(a) * R * 1.16)
      ctx.stroke()
    }

    ctx.lineCap = 'round'
    for (let i = 0; i < 16; i++) {
      const a0 = top + (i / 16) * TAU + 0.05
      const v = signal.spectrum[Math.floor((i / 16) * BINS * 0.7)]
      const lit = bpm != null && Math.floor(i / 4) === cur && (i % 4) <= (barPos % 1) * 4
      ctx.strokeStyle = lit ? rgba(c.beat, 0.55 + pulse * 0.45) : rgba(c.beat, 0.1 + v * 0.35)
      ctx.lineWidth = lit ? 6 : 4
      ctx.beginPath()
      ctx.arc(cx, cy, R * 0.8, a0, a0 + TAU / 16 - 0.1)
      ctx.stroke()
    }
    ctx.lineCap = 'butt'

    ctx.font = font(11, 600)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (let b = 0; b < 4; b++) {
      const a = top + (b / 4) * TAU
      ctx.fillStyle = bpm != null && b === cur ? c.beat : c.text
      ctx.fillText(String(b + 1), cx + Math.cos(a) * R * 1.3, cy + Math.sin(a) * R * 1.3)
    }

    if (bpm != null) {
      const a = top + (barPos / 4) * TAU
      ctx.strokeStyle = c.text
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(a) * R * 0.25, cy + Math.sin(a) * R * 0.25)
      ctx.lineTo(cx + Math.cos(a) * R * 1.1, cy + Math.sin(a) * R * 1.1)
      ctx.stroke()
    }

    ctx.fillStyle = dimText()
    ctx.font = font(10)
    ctx.fillText(bpm != null ? '小節' : 'BPM 未設定', cx, cy - R * 0.2)
    ctx.fillStyle = c.text
    ctx.font = font(Math.max(16, R * 0.24), 600)
    ctx.fillText(bpm != null ? String(Math.floor(beat / 4) + 1) : '—', cx, cy + R * 0.04)

    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    const lh = 14 * ts()
    ctx.font = font(11, 600)
    ctx.fillStyle = c.text
    ctx.fillText(bpm != null ? `${bpm} BPM` : 'BPM —', 8, lh + 2)
    ctx.font = font(10)
    ctx.fillStyle = dimText()
    ctx.fillText(bpm != null ? `來源：${BPM_SOURCE[source]}` : '可在播放列手動輸入', 8, lh * 2 + 2)
    if (bpm != null) ctx.fillText(`第 ${cur + 1} 拍`, 8, lh * 3 + 2)
    ctx.fillStyle = player.playing ? c.beat : dimText()
    ctx.fillText(player.playing ? '● 播放中' : player.ended ? '■ 已結束' : '❚❚ 暫停', 8, (bpm != null ? lh * 4 : lh * 3) + 2)
  }
}
