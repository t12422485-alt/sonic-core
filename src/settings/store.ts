import { contrast, defaultSettings, isDark, mix, rgba, validateSettings, type Settings } from './schema'

// 設定儲存：目前設定 + 多組命名設定，皆存在 localStorage。
// 畫布每幀直接讀 settings.s，不觸發 React 重新渲染；面板 UI 透過 subscribe 更新。

const KEY_CURRENT = 'sonic-core:settings'
const KEY_PROFILES = 'sonic-core:profiles'

export interface Profile {
  id: string
  name: string
  settings: Settings
}

type Listener = () => void

function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 私密瀏覽或空間不足時略過
  }
}

class SettingsStore {
  s: Settings
  profiles: Profile[]
  version = 0
  private listeners = new Set<Listener>()
  private saveTimer: number | null = null

  constructor() {
    const stored = load<unknown>(KEY_CURRENT)
    this.s = stored ? validateSettings(stored).settings : defaultSettings()
    const profiles = load<Profile[]>(KEY_PROFILES)
    this.profiles = Array.isArray(profiles)
      ? profiles
          .filter((p) => p && typeof p.name === 'string')
          .map((p) => ({ id: String(p.id), name: p.name, settings: validateSettings(p.settings).settings }))
      : []
    this.applyCss()
  }

  subscribe = (fn: Listener) => {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }

  private changed() {
    this.version++
    this.applyCss()
    for (const fn of this.listeners) fn()
    if (this.saveTimer) window.clearTimeout(this.saveTimer)
    this.saveTimer = window.setTimeout(() => save(KEY_CURRENT, this.s), 250)
  }

  /** 以不可變方式更新設定：fn 修改複本 */
  update(fn: (draft: Settings) => void) {
    const draft = structuredClone(this.s)
    fn(draft)
    this.s = draft
    this.changed()
  }

  replace(next: Settings) {
    this.s = structuredClone(next)
    this.changed()
  }

  reset() {
    this.replace(defaultSettings())
  }

  // ── 設定組合 ─────────────────────────────────────

  private saveProfiles() {
    save(KEY_PROFILES, this.profiles)
    this.version++
    for (const fn of this.listeners) fn()
  }

  addProfile(name: string) {
    const p = { id: crypto.randomUUID(), name: name.trim() || '未命名設定', settings: structuredClone(this.s) }
    this.profiles = [...this.profiles, p]
    this.saveProfiles()
    return p
  }

  overwriteProfile(id: string) {
    this.profiles = this.profiles.map((p) => (p.id === id ? { ...p, settings: structuredClone(this.s) } : p))
    this.saveProfiles()
  }

  renameProfile(id: string, name: string) {
    this.profiles = this.profiles.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p))
    this.saveProfiles()
  }

  deleteProfile(id: string) {
    this.profiles = this.profiles.filter((p) => p.id !== id)
    this.saveProfiles()
  }

  applyProfile(id: string) {
    const p = this.profiles.find((x) => x.id === id)
    if (p) this.replace(p.settings)
  }

  // ── JSON ─────────────────────────────────────────

  exportJson(name: string) {
    return JSON.stringify({ app: 'SONIC CORE', type: 'settings', name, settings: this.s }, null, 2)
  }

  /** 回傳錯誤訊息清單；有可用內容時會套用 */
  importJson(text: string): { ok: boolean; name: string | null; errors: string[] } {
    let data: unknown
    try {
      data = JSON.parse(text)
    } catch {
      return { ok: false, name: null, errors: ['這不是有效的 JSON 檔案，請確認是從 SONIC CORE 匯出的設定。'] }
    }
    const wrapper = data as { settings?: unknown; name?: unknown }
    const body = wrapper && typeof wrapper === 'object' && 'settings' in wrapper ? wrapper.settings : data
    const { settings, errors } = validateSettings(body)
    if (errors.length === 1 && errors[0] === '檔案內容不是設定物件。') return { ok: false, name: null, errors }
    this.replace(settings)
    return { ok: true, name: typeof wrapper.name === 'string' ? wrapper.name : null, errors }
  }

  // ── CSS 變數 ─────────────────────────────────────

  applyCss() {
    const c = this.s.colors
    const b = this.s.background
    const dark = isDark(c.bg)
    const r = document.documentElement.style
    r.setProperty('--bg', c.bg)
    r.setProperty('--bg2', b.mode === 'gradient' ? c.bg2 : c.bg)
    r.setProperty('--panel', dark ? mix(c.bg, '#ffffff', 0.05) : mix(c.bg, '#ffffff', 0.35))
    r.setProperty('--panel-solid', dark ? mix(c.bg, '#ffffff', 0.08) : mix(c.bg, '#ffffff', 0.6))
    r.setProperty('--fs', String(this.s.visual.textScale))
    r.setProperty('--ink', c.text)
    r.setProperty('--dim', mix(c.text, c.bg, 0.38))
    r.setProperty('--line', c.border)
    r.setProperty('--grid-line', rgba(c.grid, b.grid ? b.gridOpacity : 0))
    r.setProperty('--primary', c.primary)
    r.setProperty('--secondary', c.secondary)
    r.setProperty('--note-a', c.noteA)
    r.setProperty('--note-b', c.noteB)
    r.setProperty('--on-primary', isDark(c.primary) ? '#ffffff' : '#0b0f17')
    r.setProperty('--media-opacity', String(b.mediaOpacity))
    r.setProperty('--media-blur', `${b.blur}px`)
    r.setProperty('--media-mask', String(b.mask))
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
  }

  get lowContrast() {
    return contrast(this.s.colors.text, this.s.colors.bg) < 4.5
  }
}

export const settings = new SettingsStore()
