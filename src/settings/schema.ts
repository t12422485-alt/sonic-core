// 外觀與個人化設定的型別、預設值、主題、版面預設與匯入驗證

export type CoreShape = 'flowSphere' | 'particleOrbit' | 'concentric' | 'wireframe' | 'ringSpectrum'
export type SpectrumStyle = 'bars' | 'line' | 'ring'
export type Follow = 'level' | 'low' | 'mid' | 'high'
export type ModuleId = 'orbit' | 'oscilloscope' | 'video' | 'pianoRoll' | 'core' | 'analysis' | 'beat' | 'rhythm'
export type BgMode = 'solid' | 'gradient'
export type MediaTarget = 'preview' | 'background' | 'both'

export interface Colors {
  bg: string
  bg2: string
  primary: string
  secondary: string
  text: string
  border: string
  grid: string
  wave: string
  spectrum: string
  noteA: string
  noteB: string
  beat: string
  core: string
  core2: string
}

export interface Settings {
  version: 1
  colors: Colors
  gradient: boolean
  visual: {
    coreShape: CoreShape
    size: number
    lineWidth: number
    particles: number
    rotation: number
    glow: number
    reactivity: number
    smoothing: number
    spectrumStyle: SpectrumStyle
    follow: Follow
    reducedMotion: boolean
    textScale: number
  }
  background: {
    mode: BgMode
    grid: boolean
    gridOpacity: number
    mediaTarget: MediaTarget
    mediaOpacity: number
    blur: number
    mask: number
    /** 只記錄上次使用的素材名稱，用來提示重新選取；檔案本身不儲存 */
    mediaName: string | null
  }
  layout: {
    order: ModuleId[]
    hidden: ModuleId[]
    span: Record<ModuleId, number>
    height: Record<ModuleId, number>
  }
}

export const MODULES: { id: ModuleId; name: string }[] = [
  { id: 'orbit', name: '軌道動畫' },
  { id: 'oscilloscope', name: '示波器' },
  { id: 'video', name: '影像預覽' },
  { id: 'pianoRoll', name: 'Piano Roll 音符軌道' },
  { id: 'core', name: '動態核心' },
  { id: 'analysis', name: '聲音儀表（波形／頻譜／向量）' },
  { id: 'beat', name: '節拍盤' },
  { id: 'rhythm', name: '透視音遊軌道' },
]
export const MODULE_IDS = MODULES.map((m) => m.id)

export const CORE_SHAPES: { id: CoreShape; name: string }[] = [
  { id: 'flowSphere', name: '流動線條球' },
  { id: 'particleOrbit', name: '粒子軌道' },
  { id: 'concentric', name: '同心圓' },
  { id: 'wireframe', name: '幾何線框' },
  { id: 'ringSpectrum', name: '環形頻譜' },
]

export const SPECTRUM_STYLES: { id: SpectrumStyle; name: string }[] = [
  { id: 'bars', name: '長條' },
  { id: 'line', name: '折線' },
  { id: 'ring', name: '環形' },
]

export const FOLLOWS: { id: Follow; name: string }[] = [
  { id: 'level', name: '整體音量' },
  { id: 'low', name: '低頻' },
  { id: 'mid', name: '中頻' },
  { id: 'high', name: '高頻' },
]

export const COLOR_FIELDS: { key: keyof Colors; name: string }[] = [
  { key: 'bg', name: '背景色' },
  { key: 'bg2', name: '背景漸層終點' },
  { key: 'primary', name: '主要色' },
  { key: 'secondary', name: '次要色' },
  { key: 'text', name: '文字色' },
  { key: 'border', name: '框線' },
  { key: 'grid', name: '格線' },
  { key: 'wave', name: '波形' },
  { key: 'spectrum', name: '頻譜' },
  { key: 'noteA', name: '音符 A（PIANO）' },
  { key: 'noteB', name: '音符 B（LEAD）' },
  { key: 'beat', name: '節拍盤' },
  { key: 'core', name: '中央核心' },
  { key: 'core2', name: '核心漸層色' },
]

export const THEMES: { id: string; name: string; colors: Colors }[] = [
  {
    id: 'classic',
    name: '經典灰白青藍',
    colors: {
      bg: '#e9ebec', bg2: '#dfe4e8', primary: '#2a6fd6', secondary: '#1aa3b8', text: '#1b2024', border: '#b6bdc2', grid: '#c9cfd3',
      wave: '#2a6fd6', spectrum: '#1f2a33', noteA: '#2a6fd6', noteB: '#1aa3b8', beat: '#2a6fd6', core: '#2a6fd6', core2: '#1aa3b8',
    },
  },
  {
    id: 'neon',
    name: '深色霓虹',
    colors: {
      bg: '#0b0f17', bg2: '#141b2b', primary: '#22e4ff', secondary: '#ff3fd2', text: '#e6f3ff', border: '#2a3550', grid: '#1b2438',
      wave: '#22e4ff', spectrum: '#7cf7ff', noteA: '#22e4ff', noteB: '#ff3fd2', beat: '#22e4ff', core: '#22e4ff', core2: '#ff3fd2',
    },
  },
  {
    id: 'purple',
    name: '紫色科技',
    colors: {
      bg: '#16112a', bg2: '#251a45', primary: '#a37bff', secondary: '#4fd1ff', text: '#eee8ff', border: '#3b2f63', grid: '#2a2148',
      wave: '#a37bff', spectrum: '#c7b2ff', noteA: '#a37bff', noteB: '#4fd1ff', beat: '#a37bff', core: '#a37bff', core2: '#4fd1ff',
    },
  },
  {
    id: 'retro',
    name: '暖色復古',
    colors: {
      bg: '#f1e6d2', bg2: '#e6d3b3', primary: '#c4572a', secondary: '#2f7d6d', text: '#2e2118', border: '#c2a882', grid: '#d8c4a2',
      wave: '#c4572a', spectrum: '#5a3a26', noteA: '#c4572a', noteB: '#2f7d6d', beat: '#c4572a', core: '#c4572a', core2: '#e0a33a',
    },
  },
  {
    id: 'mono',
    name: '極簡黑白',
    colors: {
      bg: '#f6f6f6', bg2: '#e9e9e9', primary: '#111111', secondary: '#777777', text: '#111111', border: '#bdbdbd', grid: '#d6d6d6',
      wave: '#111111', spectrum: '#111111', noteA: '#111111', noteB: '#777777', beat: '#111111', core: '#111111', core2: '#777777',
    },
  },
]

type LayoutPreset = Pick<Settings['layout'], 'span' | 'height'> & { order: ModuleId[]; hidden: ModuleId[] }

export const LAYOUT_PRESETS: { id: string; name: string; layout: LayoutPreset }[] = [
  {
    id: 'full',
    name: '完整儀表板',
    layout: {
      order: ['orbit', 'oscilloscope', 'video', 'pianoRoll', 'core', 'analysis', 'beat', 'rhythm'],
      hidden: [],
      span: { orbit: 3, oscilloscope: 3, video: 6, pianoRoll: 8, core: 4, analysis: 4, beat: 3, rhythm: 5 },
      height: { orbit: 1, oscilloscope: 1, video: 1, pianoRoll: 1, core: 1, analysis: 1, beat: 1, rhythm: 1 },
    },
  },
  {
    id: 'focus',
    name: '專注視覺',
    layout: {
      order: ['core', 'beat', 'orbit', 'rhythm', 'video', 'oscilloscope', 'pianoRoll', 'analysis'],
      hidden: ['video', 'oscilloscope', 'pianoRoll', 'analysis'],
      span: { orbit: 4, oscilloscope: 3, video: 6, pianoRoll: 8, core: 8, analysis: 4, beat: 4, rhythm: 8 },
      height: { orbit: 1.2, oscilloscope: 1, video: 1, pianoRoll: 1, core: 1.6, analysis: 1, beat: 1.2, rhythm: 1 },
    },
  },
  {
    id: 'notes',
    name: '音符分析',
    layout: {
      order: ['pianoRoll', 'analysis', 'beat', 'rhythm', 'oscilloscope', 'orbit', 'video', 'core'],
      hidden: ['orbit', 'video', 'core'],
      span: { orbit: 3, oscilloscope: 4, video: 6, pianoRoll: 12, core: 4, analysis: 4, beat: 4, rhythm: 8 },
      height: { orbit: 1, oscilloscope: 1, video: 1, pianoRoll: 1.3, core: 1, analysis: 1, beat: 1, rhythm: 1 },
    },
  },
]

export const SPANS = [3, 4, 5, 6, 8, 12]
export const HEIGHT_RANGE = [0.6, 1.8] as const

export function defaultSettings(): Settings {
  const full = LAYOUT_PRESETS[0].layout
  return {
    version: 1,
    colors: { ...THEMES[0].colors },
    gradient: true,
    visual: {
      coreShape: 'flowSphere',
      size: 1,
      lineWidth: 1.2,
      particles: 400,
      rotation: 1,
      glow: 0.3,
      reactivity: 1,
      smoothing: 0.5,
      spectrumStyle: 'bars',
      follow: 'level',
      reducedMotion: false,
      textScale: 1.2,
    },
    background: {
      mode: 'solid',
      grid: true,
      gridOpacity: 0.35,
      mediaTarget: 'preview',
      mediaOpacity: 0.5,
      blur: 8,
      mask: 0.5,
      mediaName: null,
    },
    layout: { order: [...full.order], hidden: [...full.hidden], span: { ...full.span }, height: { ...full.height } },
  }
}

// 數值範圍：匯入驗證與滑桿共用
export const RANGES = {
  size: [0.5, 1.6, 0.05],
  lineWidth: [0.5, 4, 0.1],
  particles: [50, 1500, 50],
  rotation: [0, 3, 0.1],
  glow: [0, 1, 0.05],
  reactivity: [0, 2, 0.05],
  smoothing: [0, 1, 0.05],
  textScale: [0.8, 1.6, 0.05],
  gridOpacity: [0, 1, 0.05],
  mediaOpacity: [0, 1, 0.05],
  blur: [0, 30, 1],
  mask: [0, 1, 0.05],
} as const

const HEX = /^#[0-9a-f]{6}$/i

/** 驗證任意 JSON；缺少或錯誤的欄位以預設值補上並回報 */
export function validateSettings(raw: unknown): { settings: Settings; errors: string[] } {
  const d = defaultSettings()
  const errors: string[] = []
  const obj = (v: unknown): Record<string, unknown> | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null)
  const root = obj(raw)
  if (!root) return { settings: d, errors: ['檔案內容不是設定物件。'] }

  const colors = obj(root.colors)
  if (!colors) errors.push('缺少「colors」顏色設定，已使用預設顏色。')
  else
    for (const { key, name } of COLOR_FIELDS) {
      const v = colors[key]
      if (typeof v === 'string' && HEX.test(v)) d.colors[key] = v.toLowerCase()
      else if (v !== undefined) errors.push(`顏色「${name}」的值「${String(v)}」不是 #RRGGBB 格式。`)
    }
  if (typeof root.gradient === 'boolean') d.gradient = root.gradient

  const num = (src: Record<string, unknown> | null, key: keyof typeof RANGES, label: string, target: Record<string, unknown>) => {
    const v = src?.[key]
    if (v === undefined) return
    const [lo, hi] = RANGES[key]
    if (typeof v !== 'number' || !Number.isFinite(v) || v < lo || v > hi) errors.push(`「${label}」必須是 ${lo} 到 ${hi} 之間的數字（目前是 ${String(v)}）。`)
    else target[key] = v
  }
  const pick = <T extends string>(v: unknown, list: readonly { id: T }[], label: string): T | undefined => {
    if (v === undefined) return undefined
    if (list.some((x) => x.id === v)) return v as T
    errors.push(`「${label}」的值「${String(v)}」無法辨識。`)
    return undefined
  }

  const vis = obj(root.visual)
  if (vis) {
    const t = d.visual as unknown as Record<string, unknown>
    num(vis, 'size', '圖形大小', t)
    num(vis, 'lineWidth', '線條粗細', t)
    num(vis, 'particles', '粒子數量', t)
    num(vis, 'rotation', '旋轉速度', t)
    num(vis, 'glow', '發光強度', t)
    num(vis, 'reactivity', '動畫反應程度', t)
    num(vis, 'smoothing', '平滑程度', t)
    num(vis, 'textScale', '文字大小', t)
    d.visual.coreShape = pick(vis.coreShape, CORE_SHAPES, '核心圖形') ?? d.visual.coreShape
    d.visual.spectrumStyle = pick(vis.spectrumStyle, SPECTRUM_STYLES, '頻譜樣式') ?? d.visual.spectrumStyle
    d.visual.follow = pick(vis.follow, FOLLOWS, '跟隨頻段') ?? d.visual.follow
    if (typeof vis.reducedMotion === 'boolean') d.visual.reducedMotion = vis.reducedMotion
  }

  const bg = obj(root.background)
  if (bg) {
    const t = d.background as unknown as Record<string, unknown>
    num(bg, 'gridOpacity', '格線透明度', t)
    num(bg, 'mediaOpacity', '背景透明度', t)
    num(bg, 'blur', '模糊程度', t)
    num(bg, 'mask', '遮罩深淺', t)
    d.background.mode = pick(bg.mode, [{ id: 'solid' }, { id: 'gradient' }] as const, '背景模式') ?? d.background.mode
    d.background.mediaTarget = pick(bg.mediaTarget, [{ id: 'preview' }, { id: 'background' }, { id: 'both' }] as const, '影像位置') ?? d.background.mediaTarget
    if (typeof bg.grid === 'boolean') d.background.grid = bg.grid
    if (typeof bg.mediaName === 'string') d.background.mediaName = bg.mediaName.slice(0, 200)
  }

  const lay = obj(root.layout)
  if (lay) {
    if (Array.isArray(lay.order)) {
      const valid = lay.order.filter((x): x is ModuleId => MODULE_IDS.includes(x as ModuleId))
      if (valid.length !== lay.order.length) errors.push('版面順序裡有無法辨識的模組，已略過。')
      d.layout.order = [...new Set([...valid, ...MODULE_IDS])]
    }
    if (Array.isArray(lay.hidden)) d.layout.hidden = lay.hidden.filter((x): x is ModuleId => MODULE_IDS.includes(x as ModuleId))
    const span = obj(lay.span)
    const height = obj(lay.height)
    for (const id of MODULE_IDS) {
      const s = span?.[id]
      if (s !== undefined) {
        if (typeof s === 'number' && SPANS.includes(s)) d.layout.span[id] = s
        else errors.push(`模組寬度「${id}」必須是 ${SPANS.join('、')} 其中之一。`)
      }
      const h = height?.[id]
      if (h !== undefined) {
        if (typeof h === 'number' && h >= HEIGHT_RANGE[0] && h <= HEIGHT_RANGE[1]) d.layout.height[id] = h
        else errors.push(`模組高度「${id}」必須介於 ${HEIGHT_RANGE[0]} 到 ${HEIGHT_RANGE[1]}。`)
      }
    }
  }
  return { settings: d, errors }
}

// ── 顏色工具 ──────────────────────────────────────

export function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function rgba(hex: string, a: number) {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r},${g},${b},${a})`
}

export function mix(a: string, b: string, t: number) {
  const x = hexToRgb(a)
  const y = hexToRgb(b)
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')
}

function lum(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a: string, b: string) {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

export const isDark = (hex: string) => lum(hex) < 0.2
