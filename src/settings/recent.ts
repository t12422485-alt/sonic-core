// 只記住上次播放的檔名（不存檔案本身），用來提示使用者重新匯入

const LAST_AUDIO = 'sonic-core:last-audio'

export function rememberAudio(name: string) {
  try {
    localStorage.setItem(LAST_AUDIO, name)
  } catch {
    // 略過
  }
}

export function lastAudioName() {
  try {
    return localStorage.getItem(LAST_AUDIO)
  } catch {
    return null
  }
}
