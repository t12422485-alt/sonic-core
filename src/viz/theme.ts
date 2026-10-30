import type { Frame } from '../engine/ticker'
import { mix, rgba } from '../settings/schema'
import { settings } from '../settings/store'

export type DrawFn = (ctx: CanvasRenderingContext2D, w: number, h: number, f: Frame) => void

export const TAU = Math.PI * 2

/** 目前主題顏色（每幀讀取，改設定立即生效） */
export const col = () => settings.s.colors
export const vis = () => settings.s.visual
export { rgba, mix }

/** 依「單色／漸層」設定回傳填色 */
export function paint(ctx: CanvasRenderingContext2D, c1: string, c2: string, x0: number, y0: number, x1: number, y1: number) {
  if (!settings.s.gradient) return c1
  const g = ctx.createLinearGradient(x0, y0, x1, y1)
  g.addColorStop(0, c1)
  g.addColorStop(1, c2)
  return g
}

/** 文字大小倍率 */
export const ts = () => settings.s.visual.textScale

export const dimText = () => mix(col().text, col().bg, 0.38)
export const gridCol = (a = 1) => rgba(col().grid, Math.min(1, a))

export const FONT = "'JetBrains Mono', 'Noto Sans TC', 'Microsoft JhengHei', Consolas, monospace"

export function font(px: number, weight = 400) {
  return `${weight} ${Math.round(px * settings.s.visual.textScale * 10) / 10}px ${FONT}`
}

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
export const noteName = (p: number) => `${NAMES[p % 12]}${Math.floor(p / 12) - 1}`

export const fmtClock = (s: number) => {
  const v = Math.max(0, s)
  const m = Math.floor(v / 60)
  return `${m}:${String(Math.floor(v - m * 60)).padStart(2, '0')}`
}

/** 動畫幅度：減少動態效果時縮小位移與閃動 */
export const motion = () => (vis().reducedMotion ? 0.3 : 1)

/** 畫布上的置中提示文字 */
export function hint(ctx: CanvasRenderingContext2D, w: number, h: number, text: string) {
  ctx.font = font(11)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = dimText()
  ctx.fillText(text, w / 2, h / 2)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}
