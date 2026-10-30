import { useRef, useState } from 'react'
import { media } from '../settings/media'
import {
  COLOR_FIELDS, CORE_SHAPES, defaultSettings, FOLLOWS, LAYOUT_PRESETS, MODULES, RANGES, SPECTRUM_STYLES, THEMES,
  type Colors, type ModuleId, type Settings,
} from '../settings/schema'
import { settings } from '../settings/store'
import { useStore } from './hooks'

const HEX = /^#[0-9a-f]{6}$/i
type Tab = 'color' | 'visual' | 'bg' | 'layout' | 'profiles'
const TABS: { id: Tab; name: string }[] = [
  { id: 'color', name: '顏色' },
  { id: 'visual', name: '圖形與動畫' },
  { id: 'bg', name: '背景與影像' },
  { id: 'layout', name: '版面' },
  { id: 'profiles', name: '設定組合' },
]

function ColorRow({ k, name, value }: { k: keyof Colors; name: string; value: string }) {
  const [text, setText] = useState(value)
  const [prev, setPrev] = useState(value)
  if (prev !== value) {
    setPrev(value)
    setText(value)
  }
  const set = (v: string) => settings.update((d) => void (d.colors[k] = v.toLowerCase()))
  return (
    <label className="crow">
      <span>{name}</span>
      <input type="color" value={value} onChange={(e) => set(e.target.value)} aria-label={`${name}選色器`} />
      <input
        className={`hex ${HEX.test(text) ? '' : 'bad'}`}
        value={text}
        maxLength={7}
        spellCheck={false}
        aria-label={`${name} HEX`}
        onChange={(e) => {
          const v = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`
          setText(v)
          if (HEX.test(v)) set(v)
        }}
      />
    </label>
  )
}

function Slider({ label, k, group, fmt }: { label: string; k: keyof typeof RANGES; group: 'visual' | 'background'; fmt?: (v: number) => string }) {
  const s = settings.s
  const value = (s[group] as unknown as Record<string, number>)[k]
  const [lo, hi, step] = RANGES[k]
  return (
    <label className="srow">
      <span>{label}</span>
      <input
        type="range"
        min={lo}
        max={hi}
        step={step}
        value={value}
        onChange={(e) => settings.update((d) => void ((d[group] as unknown as Record<string, number>)[k] = Number(e.target.value)))}
      />
      <output>{fmt ? fmt(value) : value}</output>
    </label>
  )
}

function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly { id: T; name: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="chrow">
      <span>{label}</span>
      <div className="seg">
        {options.map((o) => (
          <button key={o.id} type="button" className={o.id === value ? 'on' : ''} onClick={() => onChange(o.id)}>
            {o.name}
          </button>
        ))}
      </div>
    </div>
  )
}

function ColorTab({ s }: { s: Settings }) {
  return (
    <>
      <h4>預設主題</h4>
      <div className="themes">
        {THEMES.map((t) => (
          <button key={t.id} type="button" className="theme" onClick={() => settings.update((d) => void (d.colors = { ...t.colors }))}>
            <span className="sw3">
              <i style={{ background: t.colors.bg }} />
              <i style={{ background: t.colors.primary }} />
              <i style={{ background: t.colors.secondary }} />
            </span>
            {t.name}
          </button>
        ))}
      </div>
      <Choice
        label="填色效果"
        value={s.gradient ? 'grad' : 'solid'}
        options={[{ id: 'solid', name: '單色' }, { id: 'grad', name: '漸層' }] as const}
        onChange={(v) => settings.update((d) => void (d.gradient = v === 'grad'))}
      />
      <h4>自訂顏色（選色器或輸入 HEX）</h4>
      <div className="colors">
        {COLOR_FIELDS.map((f) => (
          <ColorRow key={f.key} k={f.key} name={f.name} value={s.colors[f.key]} />
        ))}
      </div>
      <button type="button" className="pbtn" onClick={() => settings.update((d) => void (d.colors = { ...defaultSettings().colors }))}>
        恢復預設顏色
      </button>
    </>
  )
}

function VisualTab({ s }: { s: Settings }) {
  const v = s.visual
  return (
    <>
      <Slider label="文字大小" k="textScale" group="visual" fmt={(x) => `${Math.round(x * 100)}%`} />
      <Choice label="中央核心圖形" value={v.coreShape} options={CORE_SHAPES} onChange={(x) => settings.update((d) => void (d.visual.coreShape = x))} />
      <Choice label="圖形跟隨" value={v.follow} options={FOLLOWS} onChange={(x) => settings.update((d) => void (d.visual.follow = x))} />
      <Choice label="頻譜樣式" value={v.spectrumStyle} options={SPECTRUM_STYLES} onChange={(x) => settings.update((d) => void (d.visual.spectrumStyle = x))} />
      <Slider label="圖形大小" k="size" group="visual" fmt={(x) => `${Math.round(x * 100)}%`} />
      <Slider label="線條粗細" k="lineWidth" group="visual" fmt={(x) => x.toFixed(1)} />
      <Slider label="粒子數量" k="particles" group="visual" />
      <Slider label="旋轉速度" k="rotation" group="visual" fmt={(x) => x.toFixed(1)} />
      <Slider label="發光強度" k="glow" group="visual" fmt={(x) => `${Math.round(x * 100)}%`} />
      <Slider label="動畫反應程度" k="reactivity" group="visual" fmt={(x) => `${Math.round(x * 100)}%`} />
      <Slider label="平滑程度" k="smoothing" group="visual" fmt={(x) => `${Math.round(x * 100)}%`} />
      <label className="srow check">
        <input type="checkbox" checked={v.reducedMotion} onChange={(e) => settings.update((d) => void (d.visual.reducedMotion = e.target.checked))} />
        <span>減少動態效果（降低閃動與大幅位移）</span>
      </label>
      <button type="button" className="pbtn" onClick={() => settings.update((d) => void (d.visual = { ...defaultSettings().visual }))}>
        恢復預設圖形設定
      </button>
    </>
  )
}

function BgTab({ s }: { s: Settings }) {
  const m = useStore(media).current
  const input = useRef<HTMLInputElement>(null)
  const b = s.background
  return (
    <>
      <Choice
        label="背景類型"
        value={b.mode}
        options={[{ id: 'solid', name: '純色' }, { id: 'gradient', name: '漸層' }] as const}
        onChange={(x) => settings.update((d) => void (d.background.mode = x))}
      />
      <label className="srow check">
        <input type="checkbox" checked={b.grid} onChange={(e) => settings.update((d) => void (d.background.grid = e.target.checked))} />
        <span>顯示格線</span>
      </label>
      <Slider label="格線透明度" k="gridOpacity" group="background" fmt={(x) => `${Math.round(x * 100)}%`} />

      <h4>本機圖片／影片</h4>
      <div className="mediarow">
        <button type="button" className="pbtn" onClick={() => input.current?.click()}>選擇圖片或影片</button>
        {m && <button type="button" className="pbtn ghost" onClick={() => media.clear()}>移除素材</button>}
        <span className="dimtext">{m ? `目前：${m.name}${m.kind === 'video' ? '（靜音）' : ''}` : b.mediaName ? `上次使用「${b.mediaName}」，需重新選取` : '尚未選擇'}</span>
        <input
          ref={input}
          type="file"
          accept="image/*,video/*"
          hidden
          onChange={(e) => {
            const f = e.currentTarget.files?.[0]
            e.currentTarget.value = ''
            if (f) media.set(f)
          }}
        />
      </div>
      <Choice
        label="素材顯示位置"
        value={b.mediaTarget}
        options={[{ id: 'preview', name: '影像預覽區' }, { id: 'background', name: '整體背景' }, { id: 'both', name: '兩者' }] as const}
        onChange={(x) => settings.update((d) => void (d.background.mediaTarget = x))}
      />
      <Slider label="背景透明度" k="mediaOpacity" group="background" fmt={(x) => `${Math.round(x * 100)}%`} />
      <Slider label="模糊程度" k="blur" group="background" fmt={(x) => `${x}px`} />
      <Slider label="遮罩深淺" k="mask" group="background" fmt={(x) => `${Math.round(x * 100)}%`} />
      <button
        type="button"
        className="pbtn"
        onClick={() => {
          media.clear()
          settings.update((d) => void (d.background = { ...defaultSettings().background }))
        }}
      >
        移除背景並恢復預設
      </button>
    </>
  )
}

function LayoutTab({ s }: { s: Settings }) {
  const order = s.layout.order
  const nameOf = (id: ModuleId) => MODULES.find((m) => m.id === id)!.name
  const moveBy = (id: ModuleId, dir: -1 | 1) =>
    settings.update((d) => {
      const i = d.layout.order.indexOf(id)
      const j = i + dir
      if (j < 0 || j >= d.layout.order.length) return
      ;[d.layout.order[i], d.layout.order[j]] = [d.layout.order[j], d.layout.order[i]]
    })
  return (
    <>
      <h4>版面預設</h4>
      <div className="seg wrap">
        {LAYOUT_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => settings.update((d) => void (d.layout = structuredClone({ ...p.layout, order: [...p.layout.order], hidden: [...p.layout.hidden] })))}
          >
            {p.name}
          </button>
        ))}
      </div>
      <h4>模組順序與顯示</h4>
      <p className="dimtext">桌機可按播放列的「編輯版面」直接拖曳模組、調整寬高；這裡可用按鈕上下移動（手機適用）。</p>
      <ul className="modlist">
        {order.map((id, i) => {
          const hidden = s.layout.hidden.includes(id)
          return (
            <li key={id} className={hidden ? 'off' : ''}>
              <label>
                <input
                  type="checkbox"
                  checked={!hidden}
                  onChange={(e) =>
                    settings.update((d) => {
                      d.layout.hidden = e.target.checked ? d.layout.hidden.filter((x) => x !== id) : [...d.layout.hidden, id]
                    })
                  }
                />
                {nameOf(id)}
              </label>
              <span className="arrows">
                <button type="button" disabled={i === 0} onClick={() => moveBy(id, -1)} aria-label={`上移${nameOf(id)}`}>▲</button>
                <button type="button" disabled={i === order.length - 1} onClick={() => moveBy(id, 1)} aria-label={`下移${nameOf(id)}`}>▼</button>
              </span>
            </li>
          )
        })}
      </ul>
      <button type="button" className="pbtn" onClick={() => settings.update((d) => void (d.layout = defaultSettings().layout))}>
        恢復預設版面
      </button>
    </>
  )
}

function ProfilesTab() {
  const store = useStore(settings)
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; lines: string[] } | null>(null)
  const fileIn = useRef<HTMLInputElement>(null)

  const download = () => {
    const label = name.trim() || '我的 SONIC CORE 設定'
    const blob = new Blob([settings.exportJson(label)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${label}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    setMsg({ kind: 'ok', lines: [`已匯出「${a.download}」。本機歌曲、圖片與影片不會包含在檔案中。`] })
  }

  return (
    <>
      <h4>儲存目前外觀</h4>
      <div className="mediarow">
        <input className="text" placeholder="例如：我的藍色主題" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
        <button
          type="button"
          className="pbtn"
          onClick={() => {
            const p = settings.addProfile(name)
            setName('')
            setMsg({ kind: 'ok', lines: [`已儲存「${p.name}」。`] })
          }}
        >
          新增設定組合
        </button>
      </div>
      <ul className="modlist profiles">
        {store.profiles.length === 0 && <li className="dimtext">尚未儲存任何設定組合。</li>}
        {store.profiles.map((p) => (
          <li key={p.id}>
            {editing === p.id ? (
              <input
                className="text"
                value={editName}
                autoFocus
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => {
                  settings.renameProfile(p.id, editName)
                  setEditing(null)
                }}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              />
            ) : (
              <span className="pn">{p.name}</span>
            )}
            <span className="arrows">
              <button type="button" onClick={() => settings.applyProfile(p.id)}>套用</button>
              <button type="button" onClick={() => settings.overwriteProfile(p.id)} title="以目前外觀覆蓋">更新</button>
              <button type="button" onClick={() => { setEditing(p.id); setEditName(p.name) }}>重新命名</button>
              <button type="button" onClick={() => window.confirm(`確定刪除「${p.name}」？`) && settings.deleteProfile(p.id)}>刪除</button>
            </span>
          </li>
        ))}
      </ul>

      <h4>JSON 匯入／匯出</h4>
      <div className="mediarow">
        <button type="button" className="pbtn" onClick={download}>匯出目前設定</button>
        <button type="button" className="pbtn" onClick={() => fileIn.current?.click()}>匯入設定 JSON</button>
        <input
          ref={fileIn}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={async (e) => {
            const f = e.currentTarget.files?.[0]
            e.currentTarget.value = ''
            if (!f) return
            if (f.size > 512 * 1024) {
              setMsg({ kind: 'err', lines: ['檔案太大，不像是 SONIC CORE 的設定檔。'] })
              return
            }
            const r = settings.importJson(await f.text())
            if (!r.ok) setMsg({ kind: 'err', lines: r.errors })
            else setMsg({ kind: r.errors.length ? 'err' : 'ok', lines: [`已套用${r.name ? `「${r.name}」` : '匯入的設定'}。`, ...r.errors.map((x) => `已改用預設值：${x}`)] })
          }}
        />
      </div>
      {msg && (
        <div className={`msg ${msg.kind}`} role="status">
          {msg.lines.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      )}
      <h4>全部重設</h4>
      <button type="button" className="pbtn ghost" onClick={() => window.confirm('恢復所有外觀、圖形與版面為預設？已儲存的設定組合不受影響。') && settings.reset()}>
        恢復全部預設
      </button>
    </>
  )
}

export function SettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const store = useStore(settings)
  const [tab, setTab] = useState<Tab>('color')
  const s = store.s
  return (
    <aside className={`settings ${open ? 'open' : ''}`} aria-hidden={!open} aria-label="外觀與個人化">
      <header className="sh">
        <strong>外觀與個人化</strong>
        <span className="dimtext">所有調整即時預覽，並自動存在本機</span>
        <button type="button" className="close" onClick={onClose} aria-label="關閉設定">✕</button>
      </header>
      {store.lowContrast && <div className="msg warn">提醒：文字與背景對比偏低，可能不易閱讀。</div>}
      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} type="button" className={t.id === tab ? 'on' : ''} onClick={() => setTab(t.id)}>
            {t.name}
          </button>
        ))}
      </nav>
      <div className="sbody">
        {tab === 'color' && <ColorTab s={s} />}
        {tab === 'visual' && <VisualTab s={s} />}
        {tab === 'bg' && <BgTab s={s} />}
        {tab === 'layout' && <LayoutTab s={s} />}
        {tab === 'profiles' && <ProfilesTab />}
      </div>
    </aside>
  )
}
