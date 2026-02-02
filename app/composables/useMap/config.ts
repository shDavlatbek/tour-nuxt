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
  sea: 0xcce5ff,
  // sea: 0x4a90d9,
  neighbor: 0xf5f5f5,
  neighborBorder: 0x888888,
  grid: 0xb4b4aa,
  background: 0xeef2f3,
  marker: 0xffffff,
  label: '#444444',
  labelCity: '#ffffff',
  labelLine: 0xffffff,
  uzbekistanHighlight: 0xffcc33, // Brighter gold for selected region
}

// Extrusion depths
export const EXTRUDE_DEPTHS = {
  uzbekistan: 5,
  sea: 1,
  neighbor: 3,
}

// Label configuration
export const LABEL_CONFIG = {
  revealRadius: 150,
  fontSize: 28,
  animationDuration: 300,
  fontFamily: 'Outfit',
}

// Per-region label positioning config
// direction: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left'
// - top-right: diagonal goes up-right, then horizontal right (like image 1)
// - bottom-right: diagonal goes down-right, then horizontal right (like image 2)
// - top-left: diagonal goes up-left, then horizontal left (like image 3)
// - bottom-left: diagonal goes down-left, then horizontal left (like image 4)
export interface RegionLabelConfig {
  name: string
  direction: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left'
  offsetX: number      // Group/line X offset from marker
  offsetY: number      // Group/line Y offset from marker
  diagonalLength: number
  horizontalLength: number
  textOffsetX?: number // Extra text X offset (positive = right)
  textOffsetY?: number // Extra text Y offset (positive = up)
}

// Region label configs indexed by region ID (from SVG path id attribute)
export const REGION_LABELS: Record<string, RegionLabelConfig> = {
  'karakalpakstan': { name: 'KARAKALPAKSTAN', direction: 'top-right', offsetX: 0, offsetY: 0, diagonalLength: 30, horizontalLength: 100, textOffsetX: -60, textOffsetY: 0 },
  'khorezm': { name: 'KHOREZM', direction: 'top-right', offsetX: 0, offsetY: 0, diagonalLength: 25, horizontalLength: 60, textOffsetX: -40, textOffsetY: 0 },
  'navoi': { name: 'NAVOI', direction: 'top-right', offsetX: 0, offsetY: 0, diagonalLength: 25, horizontalLength: 45, textOffsetX: -35, textOffsetY: 0 },
  'bukhara': { name: 'BUKHARA', direction: 'bottom-right', offsetX: 0, offsetY: 0, diagonalLength: 25, horizontalLength: 60, textOffsetX: -40, textOffsetY: 0 },
  'samarkand': { name: 'SAMARKAND', direction: 'bottom-right', offsetX: 0, offsetY: 0, diagonalLength: 25, horizontalLength: 75, textOffsetX: -50, textOffsetY: 0 },
  'jizzakh': { name: 'JIZZAKH', direction: 'top-left', offsetX: 0, offsetY: 0, diagonalLength: 25, horizontalLength: 60, textOffsetX: 40, textOffsetY: 0 },
  'sirdaryo': { name: 'SIRDARYO', direction: 'top-right', offsetX: 0, offsetY: 0, diagonalLength: 25, horizontalLength: 60, textOffsetX: -40, textOffsetY: 0 },
  'tashkent': { name: 'TASHKENT', direction: 'top-left', offsetX: 0, offsetY: 0, diagonalLength: 25, horizontalLength: 60, textOffsetX: 40, textOffsetY: 0 },
  // 'tashkent': { name: 'TASHKENT', direction: 'top-right', offsetX: 0, offsetY: 0, diagonalLength: 25, horizontalLength: 40, textOffsetX: 0, textOffsetY: 0 },
  'namangan': { name: 'NAMANGAN', direction: 'top-right', offsetX: 0, offsetY: 0, diagonalLength: 25, horizontalLength: 70, textOffsetX: -45, textOffsetY: 0 },
  'andijan': { name: 'ANDIJAN', direction: 'bottom-right', offsetX: 0, offsetY: 0, diagonalLength: 25, horizontalLength: 60, textOffsetX: -40, textOffsetY: 0 },
  'fergana': { name: 'FERGANA', direction: 'bottom-right', offsetX: 0, offsetY: 0, diagonalLength: 25, horizontalLength: 60, textOffsetX: -43, textOffsetY: 0 },
  'kashkadarya': { name: 'KASHKADARYA', direction: 'bottom-left', offsetX: 0, offsetY: 0, diagonalLength: 25, horizontalLength: 85, textOffsetX: 53, textOffsetY: 0 },
  'surkhandarya': { name: 'SURKHANDARYA', direction: 'bottom-right', offsetX: 0, offsetY: 0, diagonalLength: 25, horizontalLength: 90, textOffsetX: -55, textOffsetY: 0 },
  // 'tashkentsh': { name: 'TASHKENT', direction: 'top-left', offsetX: 0, offsetY: 0, diagonalLength: 25, horizontalLength: 40, textOffsetX: 0, textOffsetY: 0 },
}

// Fallback array for index-based lookup (when SVG has no IDs)
export const REGION_NAMES: string[] = [
  'KARAKALPAKSTAN',
  'KHOREZM',
  'NAVOI',
  'BUKHARA',
  'SAMARKAND',
  'JIZZAKH',
  'SIRDARYO',
  'TASHKENT',
  'NAMANGAN',
  'ANDIJAN',
  'FERGANA',
  'KASHKADARYA',
  'SURKHANDARYA',
]

// Mobile configuration (kept for reference but not used currently)
export const MOBILE_CONFIG = {
  breakpoint: 768,
  mapScale: 1.8,
  minZoom: 400,
  maxZoom: 2000,
  panBoundaryX: 500,
  panBoundaryY: 300,
  labelRevealRadius: 120,
  pinchSensitivity: 2,
  panSensitivity: 1.5,
}
