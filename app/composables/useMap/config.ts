import type { CameraPosition } from './types'

// Map scaling and positioning
export const MAP_SCALE = 2.5
export const INITIAL_CAM_POS: CameraPosition = { x: 0, y: 0, z: 1200 }

// Parallax settings
export const PARALLAX_STRENGTH = 50
export const ZOOMED_PARALLAX_STRENGTH = 20
export const MAX_PARALLAX_OFFSET = 400

// Country names for labels
export const COUNTRY_NAMES: Record<string, string> = {
  uz: 'Uzbekistan',
  kz: 'Kazakhstan',
  tm: 'Turkmenistan',
  af: 'Afghanistan',
  tj: 'Tajikistan',
  kg: 'Kyrgyzstan',
  ir: 'Iran',
}

// Grid settings
export const GRID_SPACING = 40
export const GRID_SIZE = 2000

// Colors
export const COLORS = {
  uzbekistan: 0xffee57,
  uzbekistanBorder: 0x4a5a2b,
  sea: 0x4a90d9,
  neighbor: 0xf5f5f5,
  neighborBorder: 0x888888,
  grid: 0xb4b4aa,
  background: 0xeef2f3,
  marker: 0xffffff,
  label: '#444444',
}

// Extrusion depths
export const EXTRUDE_DEPTHS = {
  uzbekistan: 5,
  sea: 1,
  neighbor: 3,
}
