import { useRef, useState } from 'react'
import { player } from '../engine/player'
import { fmtClock } from '../viz/theme'
import { rememberAudio } from '../settings/recent'
import { useStore, useTick } from './hooks'

// 播放中心：播放／暫停／重新播放、進度拖曳、音量、匯入音訊與 MIDI、BPM 與同步偏移
export function PlayerBar({ onSettings, onPresent, onEdit, editing }: { onSettings: () => void; onPresent: () => void; onEdit: () => void; editing: boolean }) {
  const p = useStore(player)
  const fill = useRef<HTMLDivElement>(null)
  const knob = useRef<HTMLDivElement>(null)
  const time = useRef<HTMLSpanElement>(null)
  const audioIn = useRef<HTMLInputElement>(null)
  const midiIn = useRef<HTMLInputElement>(null)
  const [bpmText, setBpmText] = useState('')
  const lastVol = useRef(0.8)

  useTick(() => {
    const d = player.duration || 1
    const pct = `${(player.time / d) * 100}%`
    if (fill.current) fill.current.style.width = pct
    if (knob.current) knob.current.style.left = pct
    if (time.current) time.current.textContent = `${fmtClock(player.time)} / ${fmtClock(player.duration)}`
  })

  const seek = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.type === 'pointerdown') {
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        // 合成事件沒有有效的 pointer，仍照常跳轉
      }
    } else if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    const r = e.currentTarget.getBoundingClientRect()
    player.seek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * player.duration)
  }

  const pick = async (input: HTMLInputElement, kind: 'audio' | 'midi') => {
    const f = input.files?.[0]
    input.value = ''
    if (!f) return
    if (kind === 'audio') {
      await player.loadAudio(f)
      if (player.audio?.name === f.name) rememberAudio(f.name)
    } else await player.loadMidi(f)
  }

  const muted = p.volume === 0
  const bothLoaded = !!(p.audio && p.midi)

  return (
    <section className="player">
      <div className="prow">
        <button className="pbtn main" type="button" onClick={() => player.toggle()} aria-label={p.playing ? '暫停' : '播放'}>
          {p.playing ? '❚❚ 暫停' : '▶ 播放'}
        </button>
        <button className="pbtn" type="button" onClick={() => player.restart()} title="從頭播放">
          ↺ 重新播放
        </button>
        <div className="prog" onPointerDown={seek} onPointerMove={seek} role="slider" aria-label="播放進度" aria-valuemin={0} aria-valuemax={Math.round(p.duration)} aria-valuenow={Math.round(p.time)}>
          <div className="prog-fill" ref={fill} />
          <div className="prog-knob" ref={knob} />
        </div>
        <span className="ptime" ref={time}>0:00 / 0:00</span>
        <button
          className="vknob"
          type="button"
          onClick={() => {
            if (muted) player.setVolume(lastVol.current || 0.8)
            else {
              lastVol.current = p.volume
              player.setVolume(0)
            }
          }}
          aria-label={muted ? '取消靜音' : '靜音'}
          title={muted ? '取消靜音' : '靜音'}
        >
          <svg viewBox="0 0 16 16" aria-hidden>
            <path d="M2 6h3l4-3v10l-4-3H2z" />
            {muted ? <path d="M11 6l4 4M15 6l-4 4" fill="none" stroke="currentColor" strokeWidth="1.4" /> : <path d="M11 5.5a3.5 3.5 0 0 1 0 5M12.5 3.5a6 6 0 0 1 0 9" fill="none" stroke="currentColor" strokeWidth="1.2" />}
          </svg>
        </button>
        <input className="vol" type="range" min={0} max={1} step={0.01} value={p.volume} onChange={(e) => player.setVolume(Number(e.target.value))} aria-label="音量" />
      </div>

      <div className="prow info">
        <span className={`badge ${p.isDemo ? 'demo' : 'live'}`}>{p.modeLabel}</span>
        <span className="pname" title={p.title}>{p.title}</span>
        <button className="pbtn" type="button" onClick={() => audioIn.current?.click()}>匯入音訊</button>
        <button className="pbtn" type="button" onClick={() => midiIn.current?.click()}>匯入 MIDI</button>
        {p.audio && <button className="pbtn ghost" type="button" onClick={() => player.clearAudio()}>移除音訊</button>}
        {p.midi && <button className="pbtn ghost" type="button" onClick={() => player.clearMidi()}>移除 MIDI</button>}
        <input ref={audioIn} type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac" hidden onChange={(e) => void pick(e.currentTarget, 'audio')} />
        <input ref={midiIn} type="file" accept=".mid,.midi,audio/midi" hidden onChange={(e) => void pick(e.currentTarget, 'midi')} />
      </div>

      {(p.audio || bothLoaded) && (
        <div className="prow info">
          {p.audio && !p.midi && (
            <label className="field">
              BPM（手動）
              <input
                type="number"
                min={30}
                max={300}
                placeholder="未設定"
                value={bpmText}
                onChange={(e) => {
                  setBpmText(e.target.value)
                  player.setManualBpm(e.target.value ? Number(e.target.value) : null)
                }}
              />
            </label>
          )}
          {bothLoaded && (
            <>
              <label className="field">
                MIDI 偏移
                <input type="range" min={-5} max={5} step={0.01} value={p.midiOffset} onChange={(e) => player.setMidiOffset(Number(e.target.value))} />
                <output>{p.midiOffset >= 0 ? '+' : ''}{p.midiOffset.toFixed(2)} 秒</output>
              </label>
              <button className="pbtn ghost" type="button" onClick={() => player.setMidiOffset(0)}>歸零</button>
              <label className="field check">
                <input type="checkbox" checked={p.midiSynthWithAudio} onChange={(e) => player.setMidiSynthWithAudio(e.target.checked)} />
                同時播放 MIDI 合成音
              </label>
            </>
          )}
        </div>
      )}

      <div className="prow tools">
        <button className="pbtn" type="button" onClick={onSettings}>⚙ 外觀與個人化</button>
        <button className={`pbtn ${editing ? 'active' : ''}`} type="button" onClick={onEdit}>{editing ? '✓ 完成版面編輯' : '▦ 編輯版面'}</button>
        <button className="pbtn" type="button" onClick={onPresent}>⛶ 展示模式</button>
        <span className="hint">空白鍵：播放／暫停</span>
      </div>
    </section>
  )
}
