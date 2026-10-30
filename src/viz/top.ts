import { player } from '../engine/player'
import { drive, signal, WAVE_N } from '../engine/signal'
import { media } from '../settings/media'
import { settings } from '../settings/store'
import { col, font, gridCol, motion, rgba, TAU, vis, type DrawFn } from './theme'

// 軌道動畫：中心黑點，周圍以噪聲擾動的手繪感線圈
export function createOrbit(): DrawFn {
  const LOOPS = 16
  const loops = Array.from({ length: LOOPS }, (_, i) => ({
    r: 0.3 + Math.random() * 0.5,
    squash: 0.45 + Math.random() * 0.5,
    tilt: Math.random() * Math.PI,
    spin: (Math.random() < 0.5 ? -1 : 1) * (0.1 + Math.random() * 0.3),
    k1: 2 + (i % 3),
    k2: 5 + (i % 4),
    ph: Math.random() * TAU,
    strong: i % 4 === 0,
  }))
  let t = 0

  return (ctx, w, h, f) => {
    ctx.clearRect(0, 0, w, h)
    const c = col()
    const v = vis()
    const cx = w / 2
    const cy = h / 2
    const R = Math.min(w, h) * 0.46
    const e = drive(v.follow) * v.reactivity * motion()
    t += f.dt * (0.3 + e * 1.5) * v.rotation * motion()

    ctx.lineWidth = v.lineWidth * 0.75
    const steps = Math.round(48 + 48 * f.quality)
    for (const l of loops) {
      const tilt = l.tilt + t * l.spin
      const ct = Math.cos(tilt)
      const st = Math.sin(tilt)
      const wob = 0.12 + e * 0.25
      ctx.strokeStyle = rgba(l.strong ? c.primary : c.secondary, l.strong ? 0.85 : 0.45)
      ctx.beginPath()
      for (let s = 0; s <= steps; s++) {
        const a = (s / steps) * TAU
        const rr = R * l.r * (1 + wob * Math.sin(l.k1 * a + l.ph + t) + wob * 0.5 * Math.sin(l.k2 * a - t * 1.3))
        const ex = Math.cos(a) * rr
        const ey = Math.sin(a) * rr * l.squash
        const x = cx + ex * ct - ey * st
        const y = cy + ex * st + ey * ct
        if (s) ctx.lineTo(x, y)
        else ctx.moveTo(x, y)
      }
      ctx.stroke()
    }
    ctx.fillStyle = c.text
    ctx.beginPath()
    ctx.arc(cx, cy, R * (0.13 + signal.low * 0.05 * motion()), 0, TAU)
    ctx.fill()
  }
}

// 雙通道示波器：CH1 低頻（低通濾波後）、CH2 全頻混音
export function createOscilloscope(): DrawFn {
  return (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    const c = col()
    const div = 8
    for (let i = 1; i < div; i++) {
      ctx.fillStyle = gridCol(i === div / 2 ? 0.9 : 0.5)
      ctx.fillRect(Math.round((w * i) / div), 0, 1, h)
      ctx.fillRect(0, Math.round((h * i) / div), w, 1)
    }
    let start = 0
    for (let i = 1; i < WAVE_N / 2; i++) {
      if (signal.waveBass[i - 1] < 0 && signal.waveBass[i] >= 0) { start = i; break }
    }
    const n = 480
    const trace = (buf: Float32Array, color: string, lw: number, gain: number) => {
      ctx.strokeStyle = color
      ctx.lineWidth = lw
      ctx.beginPath()
      for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * w
        const y = h / 2 - Math.max(-1, Math.min(1, buf[(start + i) % WAVE_N] * gain)) * h * 0.42
        if (i) ctx.lineTo(x, y)
        else ctx.moveTo(x, y)
      }
      ctx.stroke()
    }
    trace(signal.wave, rgba(c.text, 0.5), 1, 1.6)
    trace(signal.waveBass, c.secondary, vis().lineWidth * 1.6, 2.2)
  }
}

// 影像預覽：使用者匯入的圖片／影片；未匯入時顯示標示清楚的示範天空
export function createVideo(): DrawFn {
  const clouds = Array.from({ length: 12 }, () => ({
    x: Math.random() * 1.4 - 0.2,
    y: 0.15 + Math.random() * 0.75,
    r: 0.08 + Math.random() * 0.16,
    s: 0.01 + Math.random() * 0.02,
    puffs: Array.from({ length: 5 }, () => [Math.random() * 1.6 - 0.8, Math.random() * 0.5 - 0.25, 0.5 + Math.random() * 0.6]),
  }))

  return (ctx, w, h, f) => {
    ctx.clearRect(0, 0, w, h)
    const el = media.element
    const target = settings.s.background.mediaTarget
    if (el && target !== 'background') {
      const iw = el instanceof HTMLVideoElement ? el.videoWidth : el.naturalWidth
      const ih = el instanceof HTMLVideoElement ? el.videoHeight : el.naturalHeight
      if (iw && ih) {
        const s = Math.max(w / iw, h / ih)
        ctx.drawImage(el, (w - iw * s) / 2, (h - ih * s) / 2, iw * s, ih * s)
      }
      return
    }

    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#2f7fcf')
    g.addColorStop(0.6, '#77b3e6')
    g.addColorStop(1, '#cfe3f3')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    const drift = (player.playing ? 1 + signal.level * 2 : 0.15) * motion()
    for (const c of clouds) {
      c.x += c.s * f.dt * drift
      if (c.x > 1.4) c.x = -0.4
      for (const [dx, dy, k] of c.puffs) {
        const px = (c.x + dx * c.r) * w
        const py = (c.y + dy * c.r) * h
        const pr = c.r * k * w
        const rg = ctx.createRadialGradient(px, py, 0, px, py, pr)
        rg.addColorStop(0, 'rgba(255,255,255,0.55)')
        rg.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = rg
        ctx.fillRect(px - pr, py - pr, pr * 2, pr * 2)
      }
    }
    if (el && target === 'background') {
      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      ctx.fillRect(0, 0, w, h)
    }
    ctx.font = font(10)
    ctx.fillStyle = 'rgba(255,255,255,0.95)'
    ctx.fillText(el ? '素材目前設為整體背景' : '示範影像 · 可在設定匯入圖片或影片', 10, h - 10)
  }
}
