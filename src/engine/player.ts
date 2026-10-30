import { createDemoSong, type Note, type Song } from './demoSong'
import { parseMidiFile } from './midi'

// 播放中心：唯一的 AudioContext、分析節點、音訊檔播放與 MIDI 合成。
// 所有視覺都從 player.time / player.noteTime 取得時間，確保同一個時間基準。

type Listener = () => void

export interface Notice {
  id: number
  kind: 'info' | 'warn' | 'error'
  text: string
}

export type BpmSource = 'demo' | 'midi' | 'manual' | 'none'

interface Voice {
  oscs: OscillatorNode[]
  gain: GainNode
}

const AUDIO_EXT = /\.(mp3|wav|ogg|oga|m4a|aac|flac|webm|opus)$/i
const MIDI_EXT = /\.(mid|midi)$/i
const LOOKAHEAD = 0.15
const MAX_VOICES = 48

function firstNoteAtOrAfter(notes: Note[], t: number) {
  let lo = 0
  let hi = notes.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (notes[mid].start < t) lo = mid + 1
    else hi = mid
  }
  return lo
}

class Player {
  ctx: AudioContext | null = null
  analyser: AnalyserNode | null = null
  analyserL: AnalyserNode | null = null
  analyserR: AnalyserNode | null = null
  analyserBass: AnalyserNode | null = null
  private master: GainNode | null = null
  /** 音量之前的匯流排：分析節點接在這裡，靜音或調小音量時圖表照常反應 */
  private bus: GainNode | null = null
  private synthBus: GainNode | null = null

  readonly demo = createDemoSong()
  audio: { name: string; buffer: AudioBuffer } | null = null
  midi: Song | null = null
  /** 秒；正值代表 MIDI 音符比音訊晚出現 */
  midiOffset = 0
  midiSynthWithAudio = false
  manualBpm: number | null = null
  volume = 0.8
  playing = false
  ended = false
  notices: Notice[] = []
  version = 0

  private source: AudioBufferSourceNode | null = null
  private anchor = 0
  private pausedAt = 0
  private scheduledUntil = 0
  private voices = new Set<Voice>()
  private listeners = new Set<Listener>()
  private noticeId = 0

  subscribe = (fn: Listener) => {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }

  private emit() {
    this.version++
    for (const fn of this.listeners) fn()
  }

  notify(kind: Notice['kind'], text: string, ms?: number) {
    if (this.notices.some((n) => n.text === text)) return
    const id = ++this.noticeId
    this.notices = [...this.notices.slice(-3), { id, kind, text }]
    this.emit()
    window.setTimeout(() => this.dismiss(id), ms ?? (kind === 'error' ? 9000 : 6000))
  }

  dismiss(id: number) {
    if (!this.notices.some((n) => n.id === id)) return
    this.notices = this.notices.filter((n) => n.id !== id)
    this.emit()
  }

  // ── 狀態 ──────────────────────────────────────────

  /** 目前用來顯示與合成的音符來源；只有音訊時為 null（不捏造音符） */
  get notesSong(): Song | null {
    return this.midi ?? (this.audio ? null : this.demo)
  }

  get isDemo() {
    return !this.audio && !this.midi
  }

  get modeLabel() {
    if (this.audio && this.midi) return '音訊 + MIDI'
    if (this.audio) return '音訊'
    if (this.midi) return 'MIDI'
    return '示範模式'
  }

  get title() {
    if (this.audio && this.midi) return `${this.audio.name} ＋ ${this.midi.title}`
    return this.audio?.name ?? this.midi?.title ?? this.demo.title
  }

  get duration() {
    return this.audio?.buffer.duration ?? this.notesSong?.duration ?? 0
  }

  get time() {
    if (!this.ctx || !this.playing) return this.pausedAt
    return Math.min(this.duration, this.ctx.currentTime - this.anchor)
  }

  /** 音符時間軸：同時有音訊與 MIDI 時套用偏移 */
  get noteTime() {
    return this.audio && this.midi ? this.time - this.midiOffset : this.time
  }

  get bpm(): { value: number | null; source: BpmSource } {
    if (this.midi) return { value: this.midi.bpm, source: 'midi' }
    if (this.audio) return this.manualBpm ? { value: this.manualBpm, source: 'manual' } : { value: null, source: 'none' }
    return { value: this.demo.bpm, source: 'demo' }
  }

  get synthActive() {
    return !!this.notesSong && (!this.audio || this.midiSynthWithAudio)
  }

  get started() {
    return !!this.ctx
  }

  // ── 音訊圖 ────────────────────────────────────────

  private ensureContext() {
    if (this.ctx) return this.ctx
    const ctx = new AudioContext()
    const master = ctx.createGain()
    master.gain.value = this.volume
    master.connect(ctx.destination)
    const bus = ctx.createGain()
    bus.connect(master)

    const mk = () => {
      const a = ctx.createAnalyser()
      a.fftSize = 2048
      a.smoothingTimeConstant = 0.7
      return a
    }
    this.analyser = mk()
    bus.connect(this.analyser)
    const split = ctx.createChannelSplitter(2)
    bus.connect(split)
    this.analyserL = mk()
    this.analyserR = mk()
    split.connect(this.analyserL, 0)
    split.connect(this.analyserR, 1)
    const low = ctx.createBiquadFilter()
    low.type = 'lowpass'
    low.frequency.value = 220
    bus.connect(low)
    this.analyserBass = mk()
    low.connect(this.analyserBass)

    const synthBus = ctx.createGain()
    synthBus.gain.value = 1
    const comp = ctx.createDynamicsCompressor()
    synthBus.connect(comp).connect(bus)

    this.ctx = ctx
    this.master = master
    this.bus = bus
    this.synthBus = synthBus
    window.setInterval(() => this.schedule(), 25)
    return ctx
  }

  // ── 播放控制 ──────────────────────────────────────

  async play() {
    const ctx = this.ensureContext()
    if (ctx.state !== 'running') await ctx.resume()
    if (this.playing) return
    if (this.pausedAt >= this.duration - 0.05) this.pausedAt = 0
    this.ended = false
    this.anchor = ctx.currentTime - this.pausedAt
    if (this.audio) {
      const src = ctx.createBufferSource()
      src.buffer = this.audio.buffer
      src.connect(this.bus!)
      src.start(0, this.pausedAt)
      this.source = src
    }
    this.playing = true
    this.scheduledUntil = this.noteTime
    this.emit()
  }

  pause() {
    if (!this.playing) return
    this.pausedAt = this.time
    this.playing = false
    this.stopSource()
    this.stopVoices()
    this.emit()
  }

  toggle() {
    if (this.playing) this.pause()
    else void this.play()
  }

  seek(t: number) {
    const target = Math.max(0, Math.min(this.duration, t))
    const wasPlaying = this.playing
    if (wasPlaying) {
      this.playing = false
      this.stopSource()
      this.stopVoices()
    }
    this.pausedAt = target
    this.ended = false
    if (wasPlaying) void this.play()
    else this.emit()
  }

  restart() {
    this.seek(0)
    if (!this.playing) void this.play()
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v))
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.02)
    this.emit()
  }

  setMidiOffset(sec: number) {
    this.midiOffset = Math.max(-30, Math.min(30, sec))
    this.stopVoices()
    this.scheduledUntil = this.noteTime
    this.emit()
  }

  setMidiSynthWithAudio(on: boolean) {
    this.midiSynthWithAudio = on
    if (!on) this.stopVoices()
    this.scheduledUntil = this.noteTime
    this.emit()
  }

  setManualBpm(bpm: number | null) {
    this.manualBpm = bpm && bpm >= 30 && bpm <= 300 ? bpm : null
    this.emit()
  }

  /** 每幀由 ticker 呼叫：處理曲終與示範循環 */
  tick() {
    if (!this.playing || this.time < this.duration - 0.01) return
    if (this.isDemo) {
      this.seek(0)
    } else {
      this.pause()
      this.pausedAt = this.duration
      this.ended = true
      this.emit()
    }
  }

  // ── 素材載入 ──────────────────────────────────────

  async loadFile(file: File) {
    if (MIDI_EXT.test(file.name) || file.type === 'audio/midi' || file.type === 'audio/x-midi') return this.loadMidi(file)
    return this.loadAudio(file)
  }

  async loadAudio(file: File) {
    if (!AUDIO_EXT.test(file.name) && !file.type.startsWith('audio/')) {
      this.notify('error', `「${file.name}」不是音訊檔。請選擇 MP3、WAV、OGG 或 M4A。`)
      return
    }
    const ctx = this.ensureContext()
    let buffer: AudioBuffer
    try {
      buffer = await ctx.decodeAudioData(await file.arrayBuffer())
    } catch {
      this.notify('error', `無法解碼「${file.name}」。這個瀏覽器不支援此格式或檔案已損壞，請改用 MP3 或 WAV。`)
      return
    }
    this.pause()
    this.stopSource()
    this.audio = { name: file.name, buffer }
    this.pausedAt = 0
    this.notify('info', `已載入音訊「${file.name}」（${Math.round(buffer.duration)} 秒）。圖表現在顯示真實分析資料。`)
    if (this.midi) this.notify('warn', '音訊與 MIDI 不會自動對齊，若不同步請調整「MIDI 偏移」。')
    void this.play()
  }

  async loadMidi(file: File) {
    let song: Song
    try {
      song = await parseMidiFile(file)
    } catch (e) {
      this.notify('error', (e as Error).message)
      return
    }
    this.pause()
    this.midi = song
    this.pausedAt = 0
    this.notify('info', `已載入 MIDI「${file.name}」：${song.notes.length} 個音符、${song.tracks.length} 個音軌。`)
    if (this.audio) this.notify('warn', '音訊與 MIDI 不會自動對齊，若不同步請調整「MIDI 偏移」。')
    void this.play()
  }

  clearAudio() {
    this.pause()
    this.stopSource()
    this.audio = null
    this.pausedAt = 0
    this.emit()
  }

  clearMidi() {
    this.pause()
    this.midi = null
    this.pausedAt = 0
    this.emit()
  }

  // ── 內部 ──────────────────────────────────────────

  private stopSource() {
    if (!this.source) return
    try {
      this.source.stop()
    } catch {
      // 已停止
    }
    this.source.disconnect()
    this.source = null
  }

  private stopVoices() {
    if (!this.ctx) return
    const now = this.ctx.currentTime
    for (const v of this.voices) {
      v.gain.gain.cancelScheduledValues(now)
      v.gain.gain.setTargetAtTime(0, now, 0.01)
      for (const o of v.oscs) o.stop(now + 0.05)
    }
    this.voices.clear()
  }

  private schedule() {
    const song = this.notesSong
    if (!this.ctx || !this.playing || !song || !this.synthActive) return
    const nt = this.noteTime
    const until = nt + LOOKAHEAD
    if (this.scheduledUntil < nt - 0.1 || this.scheduledUntil > until) this.scheduledUntil = nt
    for (let i = firstNoteAtOrAfter(song.notes, this.scheduledUntil); i < song.notes.length; i++) {
      const n = song.notes[i]
      if (n.start >= until) break
      if (this.voices.size >= MAX_VOICES) break
      this.startVoice(n, this.ctx.currentTime + Math.max(0, n.start - nt), song)
    }
    this.scheduledUntil = until
  }

  private startVoice(n: Note, at: number, song: Song) {
    const ctx = this.ctx!
    const f = 440 * Math.pow(2, (n.pitch - 69) / 12)
    const dur = Math.max(0.05, n.end - n.start)
    const gain = ctx.createGain()
    const peak = 0.16 * n.vel
    gain.gain.setValueAtTime(0, at)
    gain.gain.linearRampToValueAtTime(peak, at + 0.008)
    gain.gain.setTargetAtTime(peak * 0.45, at + 0.01, 0.25)
    gain.gain.setTargetAtTime(0, at + dur, 0.08)
    gain.connect(this.synthBus!)

    const slot = song.tracks[n.track]?.colorSlot ?? 0
    const types: OscillatorType[] = n.pitch < 48 ? ['triangle', 'sine'] : slot === 1 ? ['triangle', 'square'] : ['sine', 'triangle']
    const oscs = types.map((type, k) => {
      const o = ctx.createOscillator()
      o.type = type
      o.frequency.value = f * (k === 1 && type === 'sine' ? 2 : 1)
      const g = ctx.createGain()
      g.gain.value = k === 0 ? 1 : 0.18
      o.connect(g).connect(gain)
      o.start(at)
      o.stop(at + dur + 0.5)
      return o
    })
    const voice = { oscs, gain }
    this.voices.add(voice)
    oscs[0].onended = () => {
      gain.disconnect()
      this.voices.delete(voice)
    }
  }
}

export const player = new Player()
