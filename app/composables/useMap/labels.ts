import * as THREE from 'three'
import { Tween, Easing, Group } from '@tweenjs/tween.js'
import { LABEL_CONFIG, COLORS, REGION_LABELS, type RegionLabelConfig } from './config'

/**
 * Draws text with custom letter-spacing (canvas doesn't support this natively)
 */
function drawTextWithSpacing(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  letterSpacing: number,
  align: CanvasTextAlign = 'left'
): void {
  const chars = text.split('')
  
  // Calculate total width for alignment
  let totalWidth = 0
  chars.forEach((char, i) => {
    totalWidth += ctx.measureText(char).width
    if (i < chars.length - 1) totalWidth += letterSpacing
  })
  
  // Adjust starting X based on alignment
  let startX = x
  if (align === 'center') {
    startX = x - totalWidth / 2
  } else if (align === 'right') {
    startX = x - totalWidth
  }
  
  // Draw each character
  let currentX = startX
  chars.forEach((char, i) => {
    ctx.fillText(char, currentX, y)
    currentX += ctx.measureText(char).width + letterSpacing
  })
}

export interface CityLabel {
  group: THREE.Group
  textSprite: THREE.Sprite
  lineGeometry: THREE.BufferGeometry
  lineMaterial: THREE.LineBasicMaterial
  line: THREE.Line
  markerRef: THREE.Group
  regionName: string
  regionId: string
  isVisible: boolean
  targetOpacity: number
}

/**
 * Gets line points for leader line with elbow (diagonal + horizontal)
 * 4 positions: top-right, bottom-right, top-left, bottom-left
 */
function getLinePoints(config: RegionLabelConfig): THREE.Vector3[] {
  const diag = config.diagonalLength || 25
  const horiz = config.horizontalLength || 40
  
  switch (config.direction) {
    case 'top-right':
      // Diagonal up-right, then horizontal right
      return [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(diag * 0.7, diag * 0.7, 0),
        new THREE.Vector3(diag * 0.7 + horiz, diag * 0.7, 0),
      ]
    case 'bottom-right':
      // Diagonal down-right, then horizontal right
      return [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(diag * 0.7, -diag * 0.7, 0),
        new THREE.Vector3(diag * 0.7 + horiz, -diag * 0.7, 0),
      ]
    case 'top-left':
      // Horizontal left, then diagonal up to circle
      return [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-diag * 0.7, diag * 0.7, 0),
        new THREE.Vector3(-diag * 0.7 - horiz, diag * 0.7, 0),
      ]
    case 'bottom-left':
      // Horizontal left, then diagonal down to circle  
      return [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-diag * 0.7, -diag * 0.7, 0),
        new THREE.Vector3(-diag * 0.7 - horiz, -diag * 0.7, 0),
      ]
    default:
      return [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(diag * 0.7, diag * 0.7, 0),
        new THREE.Vector3(diag * 0.7 + horiz, diag * 0.7, 0),
      ]
  }
}

/**
 * Gets text position at end of leader line
 */
function getTextPosition(config: RegionLabelConfig): { x: number; y: number } {
  const diag = config.diagonalLength || 25
  const horiz = config.horizontalLength || 40
  const textGap = 20 // Space between line end and text
  const textOffsetX = config.textOffsetX || 0
  const textOffsetY = config.textOffsetY || 0
  
  switch (config.direction) {
    case 'top-right':
      return { x: diag * 0.7 + horiz + textGap + textOffsetX, y: diag * 0.7 + textOffsetY }
    case 'bottom-right':
      return { x: diag * 0.7 + horiz + textGap + textOffsetX, y: -diag * 0.7 + textOffsetY }
    case 'top-left':
      return { x: -(diag * 0.7 + horiz + textGap) + textOffsetX, y: diag * 0.7 + textOffsetY }
    case 'bottom-left':
      return { x: -(diag * 0.7 + horiz + textGap) + textOffsetX, y: -diag * 0.7 + textOffsetY }
    default:
      return { x: diag * 0.7 + horiz + textGap + textOffsetX, y: diag * 0.7 + textOffsetY }
  }
}

/**
 * Gets text anchor based on direction
 */
function getTextAlign(direction: string): CanvasTextAlign {
  if (direction.includes('left')) {
    return 'right'
  }
  return 'left'
}

/**
 * Creates a stylized city label with leader line (diagonal + horizontal)
 */
export function createCityLabel(
  regionId: string,
  marker: THREE.Group,
  regionIndex: number
): CityLabel {
  // Get config for this region, fallback to defaults
  const config = REGION_LABELS[regionId] || {
    name: marker.userData.regionName || `REGION ${regionIndex + 1}`,
    direction: 'top-right' as const,
    offsetX: 0,
    offsetY: 0,
    diagonalLength: 25,
    horizontalLength: 40,
  }
  
  const group = new THREE.Group()
  group.name = `label-${regionId}`

  // Create text sprite
  const textSprite = createLabelSprite(config.name, config.direction)
  const textPos = getTextPosition(config)
  textSprite.position.set(textPos.x, textPos.y, 0)
  textSprite.material.opacity = 0
  group.add(textSprite)

  // Create leader line (diagonal + horizontal elbow) using Line2 for thickness
  const linePoints = getLinePoints(config)
  const positions: number[] = []
  linePoints.forEach(p => positions.push(p.x, p.y, p.z))
  
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints)
  const lineMaterial = new THREE.LineBasicMaterial({
    color: COLORS.labelLine,
    transparent: true,
    opacity: 0,
    linewidth: 3,
  })
  const line = new THREE.Line(lineGeometry, lineMaterial)
  group.add(line)

  // Position group at marker location with offset
  const markerWorldPos = new THREE.Vector3()
  marker.getWorldPosition(markerWorldPos)
  group.position.set(
    markerWorldPos.x + config.offsetX,
    markerWorldPos.y + config.offsetY,
    20
  )

  return {
    group,
    textSprite,
    lineGeometry,
    lineMaterial,
    line,
    markerRef: marker,
    regionName: config.name,
    regionId,
    isVisible: false,
    targetOpacity: 0,
  }
}

/**
 * Creates a stylized text sprite for label
 */
function createLabelSprite(text: string, direction: string): THREE.Sprite {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  const scale = 2
  const fontSize = LABEL_CONFIG.fontSize * scale
  const fontString = `bold ${fontSize}px ${LABEL_CONFIG.fontFamily}, sans-serif`

  // Measure text with letter spacing
  ctx.font = fontString
  const letterSpacing = (LABEL_CONFIG.letterSpacing || 3) * scale
  let textWidth = 0
  text.split('').forEach((char, i) => {
    textWidth += ctx.measureText(char).width
    if (i < text.length - 1) textWidth += letterSpacing
  })

  canvas.width = Math.ceil(textWidth + 60 * scale)
  canvas.height = Math.ceil(fontSize * 4) // Extra height for vertical offset

  // Draw text with strong shadow for visibility
  ctx.font = fontString
  ctx.textAlign = getTextAlign(direction)
  ctx.textBaseline = 'middle'
  
  // Calculate text X position based on alignment
  let textX = canvas.width / 2
  if (direction.includes('left')) {
    textX = canvas.width - 20 * scale
  } else {
    textX = 20 * scale
  }
  
  // Offset text up from center (adjust this value to position text relative to line)
  const centerY = canvas.height / 2 - 20 * scale
  
  // Multi-layer shadow for better visibility
  // Outer glow / blur shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
  ctx.shadowBlur = 8 * scale
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
  drawTextWithSpacing(ctx, text, textX, centerY, letterSpacing, getTextAlign(direction))
  
  // Dark shadow layer
  ctx.shadowBlur = 4 * scale
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
  drawTextWithSpacing(ctx, text, textX + 2, centerY + 2, letterSpacing, getTextAlign(direction))
  
  // Reset shadow for main text
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
  
  // Main text
  ctx.fillStyle = COLORS.labelCity
  drawTextWithSpacing(ctx, text, textX, centerY, letterSpacing, getTextAlign(direction))

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    opacity: 0,
  })
  
  const sprite = new THREE.Sprite(material)
  const spriteScale = canvas.width / (3 * scale)
  sprite.scale.set(spriteScale, spriteScale * (canvas.height / canvas.width), 1)

  return sprite
}

/**
 * Updates label visibility based on cursor/touch proximity
 */
export function updateLabelsProximity(
  labels: CityLabel[],
  camera: THREE.PerspectiveCamera,
  mouseScreenPos: { x: number; y: number },
  revealRadius: number,
  tweenGroup: Group
): void {
  labels.forEach((label) => {
    // Get marker screen position
    const markerWorldPos = new THREE.Vector3()
    label.markerRef.getWorldPosition(markerWorldPos)
    
    const screenPos = markerWorldPos.clone().project(camera)
    const screenX = (screenPos.x * 0.5 + 0.5) * window.innerWidth
    const screenY = (-screenPos.y * 0.5 + 0.5) * window.innerHeight

    // Calculate distance from cursor to marker
    const dx = mouseScreenPos.x - screenX
    const dy = mouseScreenPos.y - screenY
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Determine target opacity based on distance
    const shouldShow = distance < revealRadius
    const newTargetOpacity = shouldShow ? 1 : 0

    // Only animate if target changed
    if (label.targetOpacity !== newTargetOpacity) {
      label.targetOpacity = newTargetOpacity
      
      // Animate text sprite
      new Tween(label.textSprite.material, tweenGroup)
        .to({ opacity: newTargetOpacity }, LABEL_CONFIG.animationDuration)
        .easing(shouldShow ? Easing.Cubic.Out : Easing.Cubic.In)
        .start()

      // Animate line
      new Tween(label.lineMaterial, tweenGroup)
        .to({ opacity: newTargetOpacity * 0.8 }, LABEL_CONFIG.animationDuration)
        .easing(shouldShow ? Easing.Cubic.Out : Easing.Cubic.In)
        .start()

      // Animate scale for pop effect
      if (shouldShow) {
        label.group.scale.set(0.5, 0.5, 1)
        new Tween(label.group.scale, tweenGroup)
          .to({ x: 1, y: 1 }, LABEL_CONFIG.animationDuration * 1.2)
          .easing(Easing.Back.Out)
          .start()
      }

      label.isVisible = shouldShow
    }
  })
}

/**
 * Updates label positions to follow markers
 */
export function updateLabelPositions(
  labels: CityLabel[],
  mapGroup: THREE.Group
): void {
  labels.forEach((label) => {
    const config = REGION_LABELS[label.regionId]
    const offsetX = config?.offsetX || 0
    const offsetY = config?.offsetY || 0
    
    const markerWorldPos = new THREE.Vector3()
    label.markerRef.getWorldPosition(markerWorldPos)
    label.group.position.set(
      markerWorldPos.x + offsetX,
      markerWorldPos.y + offsetY,
      20
    )
  })
}

/**
 * Disposes all label resources
 */
export function disposeLabels(labels: CityLabel[]): void {
  labels.forEach((label) => {
    label.textSprite.material.map?.dispose()
    label.textSprite.material.dispose()
    label.lineGeometry.dispose()
    label.lineMaterial.dispose()
    label.group.clear()
  })
  labels.length = 0
}

/**
 * Updates labels when zoomed in - shows only selected region label, scales it up
 */
export function updateLabelsForZoom(
  labels: CityLabel[],
  selectedRegionId: string | null,
  isZoomed: boolean,
  tweenGroup: Group,
  zoomScale: number = 1.5
): void {
  labels.forEach((label) => {
    const isSelected = label.regionId === selectedRegionId
    
    if (isZoomed) {
      // When zoomed: show only selected label, larger and prominent
      if (isSelected) {
        // Show and scale up selected label
        new Tween(label.textSprite.material, tweenGroup)
          .to({ opacity: 1 }, LABEL_CONFIG.animationDuration)
          .easing(Easing.Cubic.Out)
          .start()
        
        new Tween(label.lineMaterial, tweenGroup)
          .to({ opacity: 0.9 }, LABEL_CONFIG.animationDuration)
          .easing(Easing.Cubic.Out)
          .start()
        
        // Scale up the label group
        new Tween(label.group.scale, tweenGroup)
          .to({ x: zoomScale, y: zoomScale }, LABEL_CONFIG.animationDuration * 1.5)
          .easing(Easing.Back.Out)
          .start()
        
        label.isVisible = true
        label.targetOpacity = 1
      } else {
        // Hide non-selected labels
        new Tween(label.textSprite.material, tweenGroup)
          .to({ opacity: 0 }, LABEL_CONFIG.animationDuration * 0.5)
          .easing(Easing.Cubic.In)
          .start()
        
        new Tween(label.lineMaterial, tweenGroup)
          .to({ opacity: 0 }, LABEL_CONFIG.animationDuration * 0.5)
          .easing(Easing.Cubic.In)
          .start()
        
        label.isVisible = false
        label.targetOpacity = 0
      }
    } else {
      // When not zoomed: reset all labels to normal scale
      new Tween(label.group.scale, tweenGroup)
        .to({ x: 1, y: 1 }, LABEL_CONFIG.animationDuration)
        .easing(Easing.Cubic.Out)
        .start()
      
      // Hide all labels when returning from zoom (proximity will show them again)
      new Tween(label.textSprite.material, tweenGroup)
        .to({ opacity: 0 }, LABEL_CONFIG.animationDuration)
        .easing(Easing.Cubic.In)
        .start()
      
      new Tween(label.lineMaterial, tweenGroup)
        .to({ opacity: 0 }, LABEL_CONFIG.animationDuration)
        .easing(Easing.Cubic.In)
        .start()
      
      label.isVisible = false
      label.targetOpacity = 0
    }
  })
}

/**
 * Hides all labels (for transitions)
 */
export function hideAllLabels(labels: CityLabel[], tweenGroup: Group): void {
  labels.forEach((label) => {
    new Tween(label.textSprite.material, tweenGroup)
      .to({ opacity: 0 }, LABEL_CONFIG.animationDuration * 0.5)
      .easing(Easing.Cubic.In)
      .start()
    
    new Tween(label.lineMaterial, tweenGroup)
      .to({ opacity: 0 }, LABEL_CONFIG.animationDuration * 0.5)
      .easing(Easing.Cubic.In)
      .start()
    
    label.isVisible = false
    label.targetOpacity = 0
  })
}
