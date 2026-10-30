import { useRef, useState, type ReactNode } from 'react'
import { LANE_COUNT, lanePitches } from '../engine/lanes'
import { player } from '../engine/player'
import { HEIGHT_RANGE, MODULES, SPANS, type ModuleId } from '../settings/schema'
import { settings } from '../settings/store'
import { createBands, createScope, createSpectrum, createVector, createWaveform } from '../viz/analysis'
import { createBeatMeter } from '../viz/beat'
import { createCore } from '../viz/core'
import { createPianoRoll } from '../viz/pianoRoll'
import { bandLabel, createRhythm, laneFlash } from '../viz/rhythm'
import { noteName } from '../viz/theme'
import { createOrbit, createOscilloscope, createVideo } from '../viz/top'
import { Canvas } from './Canvas'
import { useStore, useTick } from './hooks'

const NAME = Object.fromEntries(MODULES.map((m) => [m.id, m.name])) as Record<ModuleId, string>

function Sub({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={`sub ${className}`}>
      <span className="sublbl">{title}</span>
      {children}
    </div>
  )
}

// 16 個音符鍵：與音遊軌道一一對應；只有音訊時顯示頻段
function NoteKeys() {
  useStore(player)
  const song = player.notesSong
  const pitches = song ? lanePitches(song) : []
  const labels = Array.from({ length: LANE_COUNT }, (_, i) => (song ? (pitches[i] != null ? noteName(pitches[i]) : '—') : bandLabel(i)))
  const refs = useRef<(HTMLDivElement | null)[]>([])
  useTick(() => {
    for (let i = 0; i < LANE_COUNT; i++) refs.current[i]?.classList.toggle('on', laneFlash[i] > 0.6)
  })
  return (
    <div className="keys" aria-label={song ? '音符按鍵' : '頻段'}>
      {labels.map((l, i) => (
        <div key={i} ref={(el) => { refs.current[i] = el }} className="key">
          {l}
        </div>
      ))}
    </div>
  )
}

function moduleBody(id: ModuleId) {
  switch (id) {
    case 'orbit':
      return <Canvas setup={createOrbit} />
    case 'oscilloscope':
      return <Canvas setup={createOscilloscope} />
    case 'video':
      return <Canvas setup={createVideo} />
    case 'pianoRoll':
      return <Canvas setup={createPianoRoll} />
    case 'core':
      return <Canvas setup={createCore} />
    case 'beat':
      return <Canvas setup={createBeatMeter} />
    case 'analysis':
      return (
        <div className="analysis">
          <Sub title="波形 WAVEFORM"><Canvas setup={createWaveform} /></Sub>
          <Sub title="頻譜 SPECTRUM"><Canvas setup={createSpectrum} /></Sub>
          <Sub title="示波 SCOPE"><Canvas setup={createScope} /></Sub>
          <Sub title="向量 VECTOR · L/R"><Canvas setup={createVector} /></Sub>
          <Sub title="頻段能量" className="wide"><Canvas setup={createBands} /></Sub>
        </div>
      )
    case 'rhythm':
      return (
        <div className="rhythm-wrap">
          <div className="rhythm-canvas"><Canvas setup={createRhythm} /></div>
          <NoteKeys />
        </div>
      )
  }
}

const TITLE: Record<ModuleId, string> = {
  orbit: '軌道 ORBIT',
  oscilloscope: '示波器 CH1 低頻／CH2 混音',
  video: '影像預覽',
  pianoRoll: 'PIANO ROLL',
  core: '動態核心',
  analysis: '聲音儀表',
  beat: '節拍盤',
  rhythm: '音符軌道',
}

export function Dashboard({ editing }: { editing: boolean }) {
  const s = useStore(settings).s
  const [dragId, setDragId] = useState<ModuleId | null>(null)
  const [overId, setOverId] = useState<ModuleId | null>(null)

  const visible = s.layout.order.filter((id) => !s.layout.hidden.includes(id))

  const move = (from: ModuleId, to: ModuleId) => {
    if (from === to) return
    settings.update((d) => {
      const order = d.layout.order.filter((x) => x !== from)
      order.splice(order.indexOf(to), 0, from)
      d.layout.order = order
    })
  }
  const resize = (id: ModuleId, dir: 1 | -1) =>
    settings.update((d) => {
      const i = SPANS.indexOf(d.layout.span[id])
      d.layout.span[id] = SPANS[Math.max(0, Math.min(SPANS.length - 1, i + dir))]
    })
  const grow = (id: ModuleId, dir: 1 | -1) =>
    settings.update((d) => {
      d.layout.height[id] = Math.round(Math.max(HEIGHT_RANGE[0], Math.min(HEIGHT_RANGE[1], d.layout.height[id] + dir * 0.2)) * 10) / 10
    })

  return (
    <div className={`dash ${editing ? 'editing' : ''}`}>
      {visible.map((id) => (
        <section
          key={id}
          className={`mod mod-${id} ${overId === id && dragId !== id ? 'over' : ''}`}
          style={{ ['--span' as string]: s.layout.span[id], ['--hs' as string]: s.layout.height[id] }}
          onDragOver={(e) => {
            if (!dragId) return
            e.preventDefault()
            setOverId(id)
          }}
          onDrop={(e) => {
            e.preventDefault()
            if (dragId) move(dragId, id)
            setDragId(null)
            setOverId(null)
          }}
        >
          <header className="mh">
            <span className="mt">{TITLE[id]}</span>
            {editing && (
              <span className="mtools">
                <span
                  className="grip"
                  draggable
                  title="拖曳調整順序"
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', id)
                    setDragId(id)
                  }}
                  onDragEnd={() => {
                    setDragId(null)
                    setOverId(null)
                  }}
                >
                  ⠿ 拖曳
                </span>
                <button type="button" onClick={() => resize(id, -1)} title="變窄">窄</button>
                <button type="button" onClick={() => resize(id, 1)} title="變寬">寬</button>
                <button type="button" onClick={() => grow(id, -1)} title="變矮">矮</button>
                <button type="button" onClick={() => grow(id, 1)} title="變高">高</button>
                <button
                  type="button"
                  title={`隱藏${NAME[id]}`}
                  onClick={() => settings.update((d) => void d.layout.hidden.push(id))}
                >
                  隱藏
                </button>
              </span>
            )}
          </header>
          <div className="mb">{moduleBody(id)}</div>
        </section>
      ))}
      {!visible.length && <p className="empty">所有模組都已隱藏。請在「外觀與個人化 → 版面」重新開啟。</p>}
    </div>
  )
}
