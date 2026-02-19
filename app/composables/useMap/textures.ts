import * as THREE from 'three'
import { COUNTRY_LABEL_CONFIG } from './config'

/**
 * Creates a cloud/fog texture using canvas
 */
export function createFogTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!

  const blobs = [
    { x: 128, y: 128, r: 90 },
    { x: 80 + Math.random() * 30, y: 100 + Math.random() * 30, r: 50 + Math.random() * 30 },
    { x: 160 + Math.random() * 30, y: 90 + Math.random() * 30, r: 45 + Math.random() * 25 },
    { x: 100 + Math.random() * 20, y: 160 + Math.random() * 30, r: 55 + Math.random() * 25 },
    { x: 170 + Math.random() * 20, y: 150 + Math.random() * 30, r: 40 + Math.random() * 30 },
    { x: 60 + Math.random() * 20, y: 140 + Math.random() * 20, r: 35 + Math.random() * 20 },
    { x: 140 + Math.random() * 20, y: 70 + Math.random() * 20, r: 30 + Math.random() * 20 },
  ]

  blobs.forEach((blob) => {
    const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.25)')
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.15)')
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.08)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(blob.x, blob.y, blob.r, 0, Math.PI * 2)
    ctx.fill()
  })

  return new THREE.CanvasTexture(canvas)
}

/**
 * Draws text with custom letter-spacing (canvas doesn't support this natively)
 */
function drawTextWithSpacing(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  letterSpacing: number
): void {
  const chars = text.split('')
  
  // Calculate total width for center alignment
  let totalWidth = 0
  chars.forEach((char, i) => {
    totalWidth += ctx.measureText(char).width
    if (i < chars.length - 1) totalWidth += letterSpacing
  })
  
  // Start from center minus half width
  let currentX = x - totalWidth / 2
  chars.forEach((char) => {
    ctx.fillText(char, currentX + ctx.measureText(char).width / 2, y)
    currentX += ctx.measureText(char).width + letterSpacing
  })
}

/**
 * Creates a text sprite for country labels
 */
export function createTextSprite(
  text: string,
  fontSize = COUNTRY_LABEL_CONFIG.fontSize,
  color = COUNTRY_LABEL_CONFIG.color
): THREE.Sprite {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  // Uppercase the text
  const upperText = text.toUpperCase()
  
  const scale = 2
  const scaledFontSize = fontSize * scale
  const fontString = `bold ${scaledFontSize}px ${COUNTRY_LABEL_CONFIG.fontFamily}, sans-serif`
  const letterSpacing = COUNTRY_LABEL_CONFIG.letterSpacing * scale

  // Measure text with letter spacing
  ctx.font = fontString
  let textWidth = 0
  upperText.split('').forEach((char, i) => {
    textWidth += ctx.measureText(char).width
    if (i < upperText.length - 1) textWidth += letterSpacing
  })

  canvas.width = Math.ceil(textWidth + 40 * scale)
  canvas.height = Math.ceil(scaledFontSize + 20 * scale)

  ctx.font = fontString
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  drawTextWithSpacing(ctx, upperText, canvas.width / 2, canvas.height / 2, letterSpacing)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  })
  const sprite = new THREE.Sprite(material)

  const spriteScale = canvas.width / (4 * scale)
  sprite.scale.set(spriteScale, spriteScale * (canvas.height / canvas.width), 1)

  return sprite
}

/**
 * Creates a grid overlay texture using canvas
 * @param size - Texture size (power of 2 recommended)
 * @param gridSpacing - Space between grid lines
 * @param lineWidth - Width of grid lines
 * @param lineColor - Color of grid lines
 * @param lineAlpha - Alpha of grid lines
 */
export function createGridTexture(
  size = 512,
  gridSpacing = 32,
  lineWidth = 2,
  lineColor = '#ffffff',
  lineAlpha = 0.6
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  // Clear with transparent background
  ctx.clearRect(0, 0, size, size)

  // Draw grid lines
  ctx.strokeStyle = lineColor
  ctx.lineWidth = lineWidth
  ctx.globalAlpha = lineAlpha

  // Vertical lines
  for (let x = 0; x <= size; x += gridSpacing) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, size)
    ctx.stroke()
  }

  // Horizontal lines
  for (let y = 0; y <= size; y += gridSpacing) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(size, y)
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  // Don't set repeat here - let shader handle tiling for uniform squares
  texture.needsUpdate = true

  return texture
}
