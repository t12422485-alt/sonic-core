import { BINS, signal, WAVE_N } from '../engine/signal'
import { col, dimText, font, gridCol, paint, rgba, TAU, ts, vis, type DrawFn } from './theme'

function grid(ctx: CanvasRenderingContext2D, w: number, h: number, cols: number, rows: number) {
  ctx.fillStyle = gridCol(0.5)
  for (let i = 1; i < cols; i++) ctx.fillRect(Math.round((w * i) / cols), 0, 1, h)
  for (let i = 1; i < rows; i++) ctx.fillRect(0, Math.round((h * i) / rows), w, 1)
}

// 波形：音量歷史長條 + 即時波形線
export function createWaveform(): DrawFn {
  const hist = new Float32Array(80)
  let head = 0
  let acc = 0
  return (ctx, w, h, f) => {
    ctx.clearRect(0, 0, w, h)
    const c = col()
    acc += f.dt
    if (acc > 1 / 20) {
      acc = 0
      hist[head] = signal.level
      head = (head + 1) % hist.length
    }
    const n = hist.length
    const bw = w / n
    ctx.fillStyle = rgba(c.text, 0.22)
    for (let i = 0; i < n; i++) {
      const bh = Math.max(1, hist[(head + i) % n] * h * 0.8)
      ctx.fillRect(i * bw, (h - bh) / 2, Math.max(1, bw - 1), bh)
    }
    ctx.strokeStyle = paint(ctx, c.wave, c.secondary, 0, 0, w, 0)
    ctx.lineWidth = vis().lineWidth
    ctx.beginPath()
    for (let i = 0; i < 512; i++) {
      const x = (i / 511) * w
      const y = h / 2 - Math.max(-1, Math.min(1, signal.wave[i] * 1.5)) * h * 0.42
      if (i) ctx.lineTo(x, y)
      else ctx.moveTo(x, y)
    }
    ctx.stroke()
  }
}

// 示波：觸發穩定的時域波形，灰線為低頻通道
export function createScope(): DrawFn {
  return (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    const c = col()
    grid(ctx, w, h, 8, 4)
    let start = 0
    for (let i = 1; i < WAVE_N / 2; i++) {
      if (signal.wave[i - 1] < 0 && signal.wave[i] >= 0) { start = i; break }
    }
    for (const [buf, color, lw] of [[signal.waveBass, rgba(c.text, 0.4), 1], [signal.wave, c.wave, vis().lineWidth]] as const) {
      ctx.strokeStyle = color
      ctx.lineWidth = lw
      ctx.beginPath()
      for (let i = 0; i < 400; i++) {
        const x = (i / 399) * w
        const y = h / 2 - Math.max(-1, Math.min(1, buf[(start + i) % WAVE_N] * 1.8)) * h * 0.42
        if (i) ctx.lineTo(x, y)
        else ctx.moveTo(x, y)
      }
      ctx.stroke()
    }
  }
}

// 頻譜：長條／折線／環形三種樣式，虛線為峰值保持
export function createSpectrum(): DrawFn {
  const BARS = 40
  const per = BINS / BARS
  const band = (src: Float32Array, i: number) => {
    let v = 0
    for (let k = 0; k < per; k++) v = Math.max(v, src[Math.floor(i * per + k)])
    return v
  }
  return (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    const c = col()
    const style = vis().spectrumStyle
    const fill = paint(ctx, c.spectrum, c.secondary, 0, h, 0, 0)
    if (style === 'ring') {
      const cx = w / 2
      const cy = h / 2
      const r0 = Math.min(w, h) * 0.18
      const r1 = Math.min(w, h) * 0.48
      ctx.strokeStyle = fill
      ctx.lineWidth = Math.max(1, ((TAU * r0) / BARS) * 0.6)
      ctx.beginPath()
      for (let i = 0; i < BARS; i++) {
        const a = (i / BARS) * TAU - Math.PI / 2
        const r = r0 + band(signal.spectrum, i) * (r1 - r0)
        ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0)
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
      }
      ctx.stroke()
      return
    }
    grid(ctx, w, h, 8, 4)
    const bw = w / BARS
    if (style === 'bars') {
      ctx.fillStyle = fill
      for (let i = 0; i < BARS; i++) {
        const bh = band(signal.spectrum, i) * (h - 4)
        ctx.fillRect(i * bw + 0.5, h - bh, Math.max(1, bw - 1.5), bh)
      }
    } else {
      ctx.strokeStyle = fill
      ctx.lineWidth = vis().lineWidth * 1.3
      ctx.beginPath()
      for (let i = 0; i < BARS; i++) {
        const x = i * bw + bw / 2
        const y = h - band(signal.spectrum, i) * (h - 4)
        if (i) ctx.lineTo(x, y)
        else ctx.moveTo(x, y)
      }
      ctx.stroke()
    }
    ctx.strokeStyle = c.primary
    ctx.lineWidth = 1
    ctx.setLineDash([2, 2])
    ctx.beginPath()
    for (let i = 0; i < BARS; i++) {
      const x = i * bw + bw / 2
      const y = h - band(signal.peaks, i) * (h - 4) - 1
      if (i) ctx.lineTo(x, y)
      else ctx.moveTo(x, y)
    }
    ctx.stroke()
    ctx.setLineDash([])
  }
}

// 向量圖：左右聲道相位（Mid 為垂直、Side 為水平）
export function createVector(): DrawFn {
  return (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    const c = col()
    const cx = w / 2
    const cy = h / 2
    const r = Math.min(w, h) * 0.44
    ctx.strokeStyle = gridCol(1)
    ctx.lineWidth = 0.8
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, TAU)
    const d = r * Math.SQRT1_2
    ctx.moveTo(cx - d, cy - d)
    ctx.lineTo(cx + d, cy + d)
    ctx.moveTo(cx + d, cy - d)
    ctx.lineTo(cx - d, cy + d)
    ctx.stroke()
    ctx.fillStyle = rgba(c.primary, 0.55)
    for (let i = 0; i < WAVE_N; i += 3) {
      const l = signal.waveL[i]
      const rr = signal.waveR[i]
      ctx.fillRect(cx + (rr - l) * r * 0.9, cy - (l + rr) * r * 0.9, 1.3, 1.3)
    }
  }
}

// 頻段能量：低／中／高頻與整體音量，含名稱與數值
export function createBands(): DrawFn {
  const items = [
    ['低頻', 'low'],
    ['中頻', 'mid'],
    ['高頻', 'high'],
    ['音量', 'level'],
  ] as const
  return (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    const c = col()
    const rowH = h / items.length
    const labelW = 34 * ts()
    const valW = 30 * ts()
    items.forEach(([name, key], i) => {
      const y = i * rowH + rowH / 2
      const v = signal[key]
      ctx.font = font(10)
      ctx.fillStyle = c.text
      ctx.textBaseline = 'middle'
      ctx.fillText(name, 0, y)
      const bw = w - labelW - valW
      ctx.fillStyle = gridCol(0.6)
      ctx.fillRect(labelW, y - 3, bw, 6)
      ctx.fillStyle = paint(ctx, c.primary, c.secondary, labelW, 0, labelW + bw, 0)
      ctx.fillRect(labelW, y - 3, bw * v, 6)
      ctx.fillStyle = dimText()
      ctx.textAlign = 'right'
      ctx.fillText(String(Math.round(v * 100)).padStart(3, ' '), w, y)
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
    })
  }
}
