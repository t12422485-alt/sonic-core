import { player } from '../engine/player'
import { settings } from './store'

// 使用者匯入的圖片／影片：只存在記憶體中的 object URL，不寫入設定 JSON

type Listener = () => void

export interface Media {
  kind: 'image' | 'video'
  url: string
  name: string
}

class MediaStore {
  current: Media | null = null
  version = 0
  /** 影像預覽區取用的 <video>/<img> 元素（畫布繪製用） */
  element: HTMLVideoElement | HTMLImageElement | null = null
  private listeners = new Set<Listener>()

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

  set(file: File) {
    const kind = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null
    if (!kind) {
      player.notify('error', `「${file.name}」不是圖片或影片檔。請選擇 JPG、PNG、WebP、GIF 或 MP4／WebM。`)
      return
    }
    this.clear(false)
    const url = URL.createObjectURL(file)
    this.current = { kind, url, name: file.name }
    if (kind === 'video') {
      const v = document.createElement('video')
      v.src = url
      v.muted = true
      v.loop = true
      v.playsInline = true
      v.onerror = () => {
        player.notify('error', `無法播放影片「${file.name}」，請改用 MP4（H.264）或 WebM。`)
        this.clear()
      }
      void v.play().catch(() => undefined)
      this.element = v
    } else {
      const img = new Image()
      img.src = url
      img.onerror = () => {
        player.notify('error', `無法讀取圖片「${file.name}」。`)
        this.clear()
      }
      this.element = img
    }
    settings.update((d) => {
      d.background.mediaName = file.name
    })
    player.notify('info', kind === 'video' ? `已載入影片「${file.name}」（固定靜音，不會與音樂重疊）。` : `已載入圖片「${file.name}」。`)
    this.emit()
  }

  clear(forget = true) {
    if (this.element instanceof HTMLVideoElement) {
      this.element.pause()
      this.element.removeAttribute('src')
      this.element.load()
    }
    if (this.current) URL.revokeObjectURL(this.current.url)
    this.current = null
    this.element = null
    if (forget)
      settings.update((d) => {
        d.background.mediaName = null
      })
    this.emit()
  }
}

export const media = new MediaStore()
