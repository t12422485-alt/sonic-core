import { useEffect, useRef, useState } from 'react'
import { player } from './engine/player'
import { media } from './settings/media'
import { settings } from './settings/store'
import { useStore } from './ui/hooks'
import { Dashboard } from './ui/Dashboard'
import { lastAudioName } from './settings/recent'
import { PlayerBar } from './ui/PlayerBar'
import { SettingsPanel } from './ui/SettingsPanel'

const PRESENT_BAR_SPACE = 60

// 整體背景：使用者匯入的圖片／影片 + 遮罩
function Backdrop() {
  const m = useStore(media)
  const target = useStore(settings).s.background.mediaTarget
  const host = useRef<HTMLDivElement>(null)
  const show = !!m.element && target !== 'preview'
  useEffect(() => {
    const el = media.element
    const box = host.current
    if (!box || !el || !show) return
    box.appendChild(el)
    if (el instanceof HTMLVideoElement) void el.play().catch(() => undefined)
    return () => {
      if (el.parentNode === box) box.removeChild(el)
    }
  }, [show, m.version])
  return (
    <div className="backdrop" aria-hidden>
      <div className="bd-media" ref={host} />
      {show && <div className="bd-mask" />}
    </div>
  )
}

function Notices() {
  const p = useStore(player)
  return (
    <div className="notices" role="status" aria-live="polite">
      {p.notices.map((n) => (
        <div key={n.id} className={`notice ${n.kind}`}>
          <span>{n.text}</span>
          <button type="button" onClick={() => player.dismiss(n.id)} aria-label="關閉提示">✕</button>
        </div>
      ))}
    </div>
  )
}

function StartCard() {
  const p = useStore(player)
  const [closed, setClosed] = useState(false)
  if (p.started || closed) return null
  return (
    <div className="start">
      <div className="start-card">
        <strong>SONIC CORE · 示範模式</strong>
        <p>按下開始，播放內建示範曲（由程式產生的音符，以瀏覽器合成器發聲），所有圖表會即時分析這段聲音。</p>
        <p className="dimtext">也可以直接在下方播放列「匯入音訊」或「匯入 MIDI」。</p>
        <div className="start-actions">
          <button type="button" className="pbtn main" onClick={() => void player.play()}>▶ 開始示範</button>
          <button type="button" className="pbtn" onClick={() => setClosed(true)}>先不播放</button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  useStore(player)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [present, setPresent] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(false)
  const hideTimer = useRef<number | null>(null)

  // 上次使用的本機素材不會儲存，提示重新選取
  useEffect(() => {
    const a = lastAudioName()
    if (a) player.notify('info', `上次播放的「${a}」是本機檔案，未被儲存；如需繼續請重新匯入。`, 15000)
    const m = settings.s.background.mediaName
    if (m) player.notify('warn', `背景素材「${m}」需要重新選取（外觀與個人化 → 背景與影像）。`, 15000)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return
      if (e.code === 'Space') {
        e.preventDefault()
        if (!e.repeat) player.toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // 展示模式：全螢幕、隱藏設定；滑鼠移動或點擊時短暫叫出控制
  useEffect(() => {
    const onFs = () => {
      if (!document.fullscreenElement) setPresent(false)
    }
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  useEffect(() => {
    if (!present) return
    const wake = () => {
      setControlsVisible(true)
      if (hideTimer.current) window.clearTimeout(hideTimer.current)
      hideTimer.current = window.setTimeout(() => setControlsVisible(false), 2500)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setPresent(false)
      if (document.fullscreenElement) void document.exitFullscreen()
    }
    window.addEventListener('pointermove', wake)
    window.addEventListener('pointerdown', wake)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointermove', wake)
      window.removeEventListener('pointerdown', wake)
      window.removeEventListener('keydown', onKey)
    }
  }, [present])

  // 展示模式：依螢幕高度等比例放大模組高度，讓畫面填滿
  useEffect(() => {
    const dash = document.querySelector<HTMLElement>('.dash')
    if (!dash) return
    if (!present) {
      dash.style.removeProperty('--vscale')
      return
    }
    const fit = () => {
      // 上方留 12px，下方保留控制列的高度，控制列不會蓋住模組
      const avail = window.innerHeight - 12 - PRESENT_BAR_SPACE
      dash.style.setProperty('--vscale', '1')
      let s = 1
      for (let i = 0; i < 3; i++) {
        const h = dash.offsetHeight
        if (!h) return
        s *= avail / h
        dash.style.setProperty('--vscale', String(s))
      }
    }
    const raf = requestAnimationFrame(fit)
    window.addEventListener('resize', fit)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', fit)
    }
  }, [present])

  const enterPresent = () => {
    setSettingsOpen(false)
    setEditing(false)
    setPresent(true)
    setControlsVisible(true)
    hideTimer.current = window.setTimeout(() => setControlsVisible(false), 2500)
    void document.documentElement.requestFullscreen?.().catch(() => undefined)
  }
  const exitPresent = () => {
    setPresent(false)
    if (document.fullscreenElement) void document.exitFullscreen()
  }

  return (
    <div className={`shell ${present ? 'present' : ''} ${settingsOpen ? 'with-settings' : ''}`}>
      <Backdrop />
      <main className="app">
        {!present && (
          <header className="top">
            <div className="brand">
              <span className="mark">SC</span>
              <div>
                <div className="name">音軌核心｜SONIC CORE</div>
                <div className="tagline">即時聲音分析 · 音符軌道 · 動態視覺</div>
              </div>
            </div>
          </header>
        )}
        <Dashboard editing={editing && !present} />
        {!present && (
          <PlayerBar
            editing={editing}
            onEdit={() => setEditing((x) => !x)}
            onSettings={() => setSettingsOpen((x) => !x)}
            onPresent={enterPresent}
          />
        )}
      </main>
      {present && (
        <div className={`present-bar ${controlsVisible ? 'show' : ''}`}>
          <button type="button" className="pbtn main" onClick={() => player.toggle()}>{player.playing ? '❚❚ 暫停' : '▶ 播放'}</button>
          <span className="dimtext">{player.title}</span>
          <button type="button" className="pbtn" onClick={exitPresent}>✕ 退出展示模式（Esc）</button>
        </div>
      )}
      {!present && <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />}
      <Notices />
      {!present && <StartCard />}
    </div>
  )
}
