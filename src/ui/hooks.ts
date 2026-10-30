import { useEffect, useRef, useSyncExternalStore } from 'react'
import { addDrawer, type Frame } from '../engine/ticker'

// 每幀更新 DOM（不經過 React render）
export function useTick(fn: (f: Frame) => void) {
  const fnRef = useRef(fn)
  useEffect(() => {
    fnRef.current = fn
  })
  useEffect(() => addDrawer((f) => fnRef.current(f)), [])
}

interface Store {
  version: number
  subscribe: (fn: () => void) => () => void
}

/** 訂閱 player / settings / media 這類外部 store，變更時重新渲染 */
export function useStore<T extends Store>(store: T): T {
  useSyncExternalStore(store.subscribe, () => store.version)
  return store
}
