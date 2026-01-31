import type { Ref } from 'vue'

export interface MapState {
  isZoomed: boolean
  isLoading: boolean
}

export interface UseMapReturn {
  state: Ref<MapState>
  init: (container: HTMLElement) => void
  dispose: () => void
  zoomOut: () => void
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
