import { player } from './player'

// 每幀從 AnalyserNode 讀取的真實分析資料（示範模式也是合成器實際發出的聲音）

export const WAVE_N = 1024
export const BINS = 128
const FMIN = 30
const FMAX = 16000
const LOG_RANGE = Math.log(FMAX / FMIN)

export const freqToBin = (f: number) => (Math.log(f / FMIN) / LOG_RANGE) * BINS
export const binToFreq = (b: number) => FMIN * Math.exp((b / BINS) * LOG_RANGE)

export const signal = {
  wave: new Float32Array(WAVE_N),
  waveBass: new Float32Array(WAVE_N),
  waveL: new Float32Array(WAVE_N),
  waveR: new Float32Array(WAVE_N),
  spectrum: new Float32Array(BINS),
  peaks: new Float32Array(BINS),
  /** 線性 FFT 頻譜（0..1），給頻譜瀑布使用 */
  linear: new Float32Array(1024),
  sampleRate: 48000,
  level: 0,
  low: 0,
  mid: 0,
  high: 0,
  beat: 0,
  hasBpm: false,
  live: false,
  activePitches: new Set<number>(),
}

const td = new Float32Array(2048)
const fd = new Float32Array(1024)

function readWave(a: AnalyserNode | null, out: Float32Array) {
  if (!a) {
    out.fill(0)
    return
  }
  a.getFloatTimeDomainData(td)
  out.set(td.subarray(0, WAVE_N))
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/** smoothing：0（很靈敏）～1（很平滑） */
export function updateSignal(dt: number, smoothing: number) {
  const ctx = player.ctx
  signal.live = !!ctx && player.playing
  readWave(player.analyser, signal.wave)
  readWave(player.analyserBass, signal.waveBass)
  readWave(player.analyserL, signal.waveL)
  readWave(player.analyserR, signal.waveR)

  const release = 1 - Math.pow(0.02 + smoothing * 0.2, dt)
  const attack = Math.min(1, release * (3 - smoothing * 1.5))
  const k = (cur: number, v: number) => lerp(cur, v, v > cur ? attack : release)

  if (player.analyser && ctx) {
    signal.sampleRate = ctx.sampleRate
    player.analyser.getFloatFrequencyData(fd)
    const hz = ctx.sampleRate / 2 / fd.length
    for (let i = 0; i < fd.length; i++) signal.linear[i] = Math.max(0, Math.min(1, (fd[i] + 100) / 70))
    for (let b = 0; b < BINS; b++) {
      const i0 = Math.max(1, Math.floor(binToFreq(b) / hz))
      const i1 = Math.max(i0, Math.floor(binToFreq(b + 1) / hz))
      let v = 0
      for (let i = i0; i <= i1 && i < fd.length; i++) v = Math.max(v, signal.linear[i])
      signal.spectrum[b] = k(signal.spectrum[b], v)
      signal.peaks[b] = Math.max(signal.spectrum[b], signal.peaks[b] - dt * 0.3)
    }
    const band = (f0: number, f1: number) => {
      let s = 0
      let n = 0
      for (let i = Math.floor(f0 / hz); i <= Math.floor(f1 / hz) && i < fd.length; i++, n++) s += signal.linear[i]
      return n ? s / n : 0
    }
    signal.low = k(signal.low, Math.min(1, band(30, 250) * 0.95))
    signal.mid = k(signal.mid, Math.min(1, band(250, 4000) * 1.6))
    signal.high = k(signal.high, Math.min(1, band(4000, 14000) * 2.2))
  }

  let sum = 0
  for (let i = 0; i < WAVE_N; i++) sum += signal.wave[i] * signal.wave[i]
  signal.level = k(signal.level, Math.min(1, Math.sqrt(sum / WAVE_N) * 2.5))

  const bpm = player.bpm.value
  signal.hasBpm = bpm != null
  signal.beat = bpm ? (Math.max(0, player.noteTime) * bpm) / 60 : 0

  signal.activePitches.clear()
  const song = player.notesSong
  if (song && player.playing) {
    const t = player.noteTime
    for (const n of song.notes) {
      if (n.start > t) break
      if (t <= n.end) signal.activePitches.add(n.pitch)
    }
  }
}

/** 依設定的「跟隨頻段」取得 0..1 的驅動值 */
export function drive(follow: 'level' | 'low' | 'mid' | 'high') {
  return signal[follow]
}
