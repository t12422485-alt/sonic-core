import { player } from '../engine/player'
import { signal } from '../engine/signal'
import { col, dimText, font, gridCol, rgba, ts, type DrawFn } from './theme'

const LOW = 33 // A1
const HIGH = 88 // E6
const PAGE_BARS = 4
const HIST = 220

// Piano roll：有音符時每頁四小節翻頁；只有音訊時改畫「音高能量瀑布」（由頻譜換算，不是音符）
export function createPianoRoll(): DrawFn {
  const rows = HIGH - LOW + 1
  const hist = Array.from({ length: HIST }, () => new Float32Array(rows))
  let head = 0
  let acc = 0

  return (ctx, w, h, f) => {
    ctx.clearRect(0, 0, w, h)
    const c = col()
    const LABEL_W = Math.round(34 * ts())
    const RULER = Math.round(16 * ts())
    const gx = LABEL_W
    const gw = w - LABEL_W
    const kh = (h - RULER - 4) / rows
    const yOf = (p: number) => RULER + (HIGH - p) * kh

    for (let p = LOW; p <= HIGH; p++) {
      const y = yOf(p)
      if (p % 2 === 0) {
        ctx.fillStyle = rgba(c.text, 0.035)
        ctx.fillRect(gx, y, gw, kh)
      }
      ctx.fillStyle = p % 12 === 0 ? gridCol(0.9) : gridCol(0.3)
      ctx.fillRect(gx, y + kh - 0.5, gw, 0.5)
      if (p % 12 === 0) {
        ctx.font = font(9)
        ctx.fillStyle = dimText()
        ctx.fillText(`C${p / 12 - 1}`, 6, y + kh + 1)
      }
    }
    ctx.fillStyle = c.border
    ctx.fillRect(gx, 0, 1, h)

    const song = player.notesSong
    if (!song) {
      // 音高能量瀑布：每列對應一個半音，亮度 = 該頻率的 FFT 能量
      acc += f.dt
      if (player.playing && acc > 1 / 30) {
        acc = 0
        const col0 = hist[head]
        const hz = signal.sampleRate / 2 / signal.linear.length
        for (let p = LOW; p <= HIGH; p++) {
          const fr = 440 * Math.pow(2, (p - 69) / 12)
          const i = Math.round(fr / hz)
          const v = Math.max(signal.linear[i] ?? 0, signal.linear[i + 1] ?? 0)
          col0[p - LOW] = Math.max(0, (v - 0.5) / 0.5)
        }
        head = (head + 1) % HIST
      }
      const cw = gw / HIST
      ctx.fillStyle = c.primary
      for (let k = 0; k < HIST; k++) {
        const colv = hist[(head + k) % HIST]
        for (let r = 0; r < rows; r++) {
          const v = colv[r]
          if (v < 0.05) continue
          ctx.globalAlpha = Math.min(1, v * 1.2)
          ctx.fillRect(gx + k * cw, yOf(LOW + r) + 0.5, cw + 0.5, kh - 1)
        }
      }
      ctx.globalAlpha = 1
      ctx.fillStyle = c.text
      ctx.fillRect(w - 2, 0, 1.2, h)
      ctx.font = font(10)
      ctx.fillStyle = dimText()
      ctx.fillText('未匯入 MIDI：顯示由頻譜換算的音高能量（不是音符）', gx + 8, RULER - 4)
      return
    }

    const t = player.noteTime
    const barLen = (60 / song.bpm) * 4
    const pageLen = barLen * PAGE_BARS
    const page = Math.floor(Math.max(0, t) / pageLen)
    const p0 = page * pageLen
    const xOf = (time: number) => gx + ((time - p0) / pageLen) * gw

    for (let b = 0; b <= PAGE_BARS * 4; b++) {
      const x = Math.round(xOf(p0 + (b * barLen) / 4))
      const isBar = b % 4 === 0
      ctx.fillStyle = isBar ? gridCol(0.9) : gridCol(0.4)
      ctx.fillRect(x, isBar ? 0 : RULER, 1, h)
      if (isBar && b < PAGE_BARS * 4) {
        ctx.font = font(9)
        ctx.fillStyle = c.text
        ctx.fillText(String(page * PAGE_BARS + b / 4 + 1), x + 4, RULER - 4)
      }
    }

    const nh = Math.max(1.5, Math.min(4, kh * 0.6))
    for (const n of song.notes) {
      const x0 = xOf(n.start)
      const x1 = xOf(n.end)
      if (x0 > w) break
      if (x1 < gx || n.pitch < LOW || n.pitch > HIGH) continue
      const y = yOf(n.pitch) + (kh - nh) / 2
      const on = t >= n.start && t <= n.end
      ctx.globalAlpha = on ? 1 : n.end < t ? 0.45 : 0.85
      ctx.fillStyle = song.tracks[n.track]?.colorSlot === 1 ? c.noteB : c.noteA
      ctx.fillRect(Math.max(gx, x0), on ? y - 0.5 : y, Math.max(2, x1 - Math.max(gx, x0) - 1), on ? nh + 1 : nh)
    }
    ctx.globalAlpha = 1

    ctx.fillStyle = c.text
    ctx.fillRect(Math.round(xOf(t)), 0, 1.2, h)

    ctx.font = font(10)
    ctx.textAlign = 'right'
    ctx.fillStyle = dimText()
    ctx.fillText(player.midi ? `MIDI · ${song.tracks.length} 音軌` : '示範音符（程式產生）', w - 8, h - 6)
    ctx.textAlign = 'left'
  }
}
