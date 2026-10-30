import { player } from '../engine/player'
import { BINS, drive, signal } from '../engine/signal'
import { col, font, motion, paint, rgba, TAU, vis, type DrawFn } from './theme'

// 中央動態核心：五種可切換的圖形，依設定的頻段驅動大小、線條與動作

type Ctx = CanvasRenderingContext2D

interface P3 {
  x: number
  y: number
  z: number
}

function rot(p: P3, ax: number, ay: number): P3 {
  const cy = Math.cos(ay)
  const sy = Math.sin(ay)
  const x1 = p.x * cy + p.z * sy
  const z1 = -p.x * sy + p.z * cy
  const cx = Math.cos(ax)
  const sx = Math.sin(ax)
  return { x: x1, y: p.y * cx - z1 * sx, z: p.y * sx + z1 * cx }
}

// 二十面體頂點與邊
const PHI = (1 + Math.sqrt(5)) / 2
const ICO: P3[] = [
  [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
  [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
  [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1],
].map(([x, y, z]) => {
  const l = Math.hypot(x, y, z)
  return { x: x / l, y: y / l, z: z / l }
})
const ICO_EDGES: [number, number][] = []
for (let i = 0; i < ICO.length; i++)
  for (let j = i + 1; j < ICO.length; j++) {
    const d = Math.hypot(ICO[i].x - ICO[j].x, ICO[i].y - ICO[j].y, ICO[i].z - ICO[j].z)
    if (d < 1.1) ICO_EDGES.push([i, j])
  }

export function createCore(): DrawFn {
  let t = 0
  let pulse = 0
  const parts = Array.from({ length: 1500 }, () => ({
    r: 0.35 + Math.random() * 0.65,
    a: Math.random() * TAU,
    s: 0.4 + Math.random() * 0.8,
    inc: (Math.random() - 0.5) * 1.2,
  }))

  return (ctx, w, h, f) => {
    ctx.clearRect(0, 0, w, h)
    const v = vis()
    const c = col()
    const m = motion()
    const e = Math.min(1.5, drive(v.follow) * v.reactivity)
    t += f.dt * v.rotation * m * (0.4 + e * 0.8)
    pulse += (e - pulse) * Math.min(1, f.dt * 8)
    const cx = w / 2
    const cy = h / 2
    const R = Math.min(w, h) * 0.36 * v.size * (1 + pulse * 0.18 * m)
    const stroke = paint(ctx, c.core, c.core2, cx - R, cy - R, cx + R, cy + R)

    ctx.save()
    if (v.glow > 0 && f.quality > 0.5) {
      ctx.shadowColor = c.core
      ctx.shadowBlur = v.glow * 22 * f.quality
    }
    ctx.lineWidth = v.lineWidth
    ctx.strokeStyle = stroke
    ctx.fillStyle = stroke

    switch (v.coreShape) {
      case 'flowSphere':
        flowSphere(ctx, cx, cy, R, t, pulse * m, Math.round(Math.max(10, (v.particles / 25) * f.quality)), c.core)
        break
      case 'particleOrbit':
        particleOrbit(ctx, cx, cy, R, t, pulse * m, Math.round(v.particles * f.quality), parts, c.core)
        break
      case 'concentric':
        concentric(ctx, cx, cy, R, c.core)
        break
      case 'wireframe':
        wireframe(ctx, cx, cy, R, t, pulse * m)
        break
      case 'ringSpectrum':
        ringSpectrum(ctx, cx, cy, R, t)
        break
    }
    ctx.restore()

    if (!player.playing) {
      ctx.fillStyle = rgba(c.text, 0.6)
      ctx.font = font(10)
      ctx.textAlign = 'center'
      ctx.fillText('已暫停', cx, h - 10)
      ctx.textAlign = 'left'
    }
  }
}

function flowSphere(ctx: Ctx, cx: number, cy: number, R: number, t: number, e: number, lines: number, base: string) {
  const seg = 72
  for (let i = 0; i < lines; i++) {
    const lat = ((i + 0.5) / lines) * Math.PI - Math.PI / 2
    const band = signal.spectrum[Math.floor((i / lines) * BINS * 0.7)]
    ctx.beginPath()
    let depth = 0
    for (let s = 0; s <= seg; s++) {
      const th = (s / seg) * TAU
      const wob = 1 + (0.06 + e * 0.12) * Math.sin(3 * th + t * 2 + i * 0.5) + band * 0.12 * Math.sin(5 * th - t * 3)
      const p = rot({ x: Math.cos(lat) * Math.cos(th) * wob, y: Math.sin(lat) * wob, z: Math.cos(lat) * Math.sin(th) * wob }, 0.5 + Math.sin(t * 0.3) * 0.3, t * 0.6 + i * 0.04)
      depth += p.z
      const x = cx + p.x * R
      const y = cy + p.y * R
      if (s) ctx.lineTo(x, y)
      else ctx.moveTo(x, y)
    }
    ctx.globalAlpha = 0.25 + 0.6 * (0.5 + depth / seg / 2)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  ctx.fillStyle = base
  ctx.beginPath()
  ctx.arc(cx, cy, R * 0.06 * (1 + e), 0, TAU)
  ctx.fill()
}

function particleOrbit(ctx: Ctx, cx: number, cy: number, R: number, t: number, e: number, count: number, parts: { r: number; a: number; s: number; inc: number }[], base: string) {
  ctx.shadowBlur = 0
  for (let i = 0; i < Math.min(count, parts.length); i++) {
    const p = parts[i]
    const a = p.a + t * p.s
    const q = rot({ x: Math.cos(a) * p.r, y: 0, z: Math.sin(a) * p.r }, p.inc + 0.4, 0)
    const sz = (1 + (q.z + 1) * 0.8) * (1 + e * 0.8)
    ctx.globalAlpha = 0.35 + (q.z + 1) * 0.3
    ctx.fillRect(cx + q.x * R * (1 + e * 0.15) - sz / 2, cy + q.y * R - sz / 2, sz, sz)
  }
  ctx.globalAlpha = 1
  ctx.fillStyle = base
  ctx.beginPath()
  ctx.arc(cx, cy, R * 0.12 * (1 + e * 0.4), 0, TAU)
  ctx.fill()
}

function concentric(ctx: Ctx, cx: number, cy: number, R: number, base: string) {
  const n = 12
  for (let i = 1; i <= n; i++) {
    const v = signal.spectrum[Math.floor(((i - 1) / n) * BINS * 0.8)]
    const r = (R * i) / n + v * R * 0.12
    ctx.globalAlpha = 0.25 + v * 0.75
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, TAU)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  ctx.fillStyle = base
  ctx.beginPath()
  ctx.arc(cx, cy, R * 0.05 + signal.low * R * 0.1, 0, TAU)
  ctx.fill()
}

function wireframe(ctx: Ctx, cx: number, cy: number, R: number, t: number, e: number) {
  for (const [scale, dir] of [[1, 1], [0.55 + e * 0.15, -1.6]] as const) {
    const pts = ICO.map((p) => rot(p, t * 0.5 * dir, t * 0.8 * dir))
    ctx.beginPath()
    for (const [a, b] of ICO_EDGES) {
      ctx.moveTo(cx + pts[a].x * R * scale, cy + pts[a].y * R * scale)
      ctx.lineTo(cx + pts[b].x * R * scale, cy + pts[b].y * R * scale)
    }
    ctx.stroke()
    for (const p of pts) {
      ctx.beginPath()
      ctx.arc(cx + p.x * R * scale, cy + p.y * R * scale, 2 + e * 2, 0, TAU)
      ctx.fill()
    }
  }
}

function ringSpectrum(ctx: Ctx, cx: number, cy: number, R: number, t: number) {
  const N = 96
  const r0 = R * 0.55
  for (let i = 0; i < N; i++) {
    const k = i < N / 2 ? i : N - 1 - i
    const v = signal.spectrum[Math.floor((k / (N / 2)) * BINS * 0.85)]
    const a = (i / N) * TAU + t * 0.2
    const r1 = r0 + v * R * 0.6
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0)
    ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1)
    ctx.stroke()
  }
  ctx.globalAlpha = 0.5
  ctx.beginPath()
  ctx.arc(cx, cy, r0 * 0.92, 0, TAU)
  ctx.stroke()
  ctx.globalAlpha = 1
}
