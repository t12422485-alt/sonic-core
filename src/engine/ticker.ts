import { settings } from '../settings/store'
import { player } from './player'
import { updateSignal } from './signal'

export interface Frame {
  dt: number
  now: number
  /** 0.4～1：效能不足時自動降低，粒子數與繪製精細度依此縮減 */
  quality: number
}

type Drawer = (f: Frame) => void

const drawers = new Set<Drawer>()
let running = false
let last = 0
let slowFor = 0
let fastFor = 0
export const stats = { fps: 60, quality: 1 }

function loop(nowMs: number) {
  const dt = last ? Math.min(0.1, (nowMs - last) / 1000) : 0
  last = nowMs
  if (dt > 0) {
    stats.fps += (1 / dt - stats.fps) * 0.05
    // 自動畫質：持續低於 40fps 就降級，持續高於 55fps 再慢慢回升
    if (stats.fps < 40) { slowFor += dt; fastFor = 0 } else if (stats.fps > 55) { fastFor += dt; slowFor = 0 }
    if (slowFor > 2) { stats.quality = Math.max(0.4, stats.quality - 0.2); slowFor = 0 }
    if (fastFor > 6) { stats.quality = Math.min(1, stats.quality + 0.1); fastFor = 0 }
  }
  player.tick()
  updateSignal(dt, settings.s.visual.smoothing)
  const f = { dt, now: nowMs / 1000, quality: stats.quality }
  for (const d of drawers) d(f)
  requestAnimationFrame(loop)
}

export function addDrawer(d: Drawer) {
  drawers.add(d)
  if (!running) {
    running = true
    requestAnimationFrame(loop)
  }
  return () => {
    drawers.delete(d)
  }
}
