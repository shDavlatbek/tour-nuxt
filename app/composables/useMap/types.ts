import type { Ref } from 'vue'

export interface MapState {
  isZoomed: boolean
  isLoading: boolean
  isFrozen: boolean
  isPaused: boolean // Completely stops rendering and events
}

export interface UseMapReturn {
  state: Ref<MapState>
  init: (container: HTMLElement) => void
  dispose: () => void
  zoomOut: () => void
  freeze: () => void
  unfreeze: () => void
  setScrollZoom: (progress: number) => void
  pause: () => void
  resume: () => void
}


export interface MousePosition {
  x: number
  y: number
}

export interface CameraPosition {
  x: number
  y: number
  z: number
}
