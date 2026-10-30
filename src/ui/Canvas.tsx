import { useEffect, useRef } from 'react'
import { addDrawer } from '../engine/ticker'
import type { DrawFn } from '../viz/theme'

// 畫布：處理 DPR 與尺寸變化，並把繪圖函式掛到共用的 rAF 迴圈
export function Canvas({ setup, className }: { setup: () => DrawFn; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current!
    const ctx = c.getContext('2d')!
    let w = 0
    let h = 0
    let dpr = 1
    const resize = (q: number) => {
      dpr = Math.min(2, window.devicePixelRatio || 1) * (q < 0.7 ? 0.75 : 1)
      w = c.clientWidth
      h = c.clientHeight
      c.width = Math.round(w * dpr)
      c.height = Math.round(h * dpr)
    }
    let lastQ = 1
    const ro = new ResizeObserver(() => resize(lastQ))
    ro.observe(c)
    const draw = setup()
    const off = addDrawer((f) => {
      if (f.quality !== lastQ) {
        lastQ = f.quality
        resize(lastQ)
      }
      if (!w || !h || c.offsetParent === null) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      draw(ctx, w, h, f)
    })
    return () => {
      ro.disconnect()
      off()
    }
  }, [setup])
  return <canvas ref={ref} className={className} />
}
