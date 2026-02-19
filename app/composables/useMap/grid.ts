import * as THREE from 'three'
import { COLORS, GRID_SPACING, GRID_SIZE } from './config'

/**
 * Creates a single grid line with animation properties
 */
export function createGridLine(
  points: THREE.Vector3[],
  type: string,
  group: THREE.Group,
  gridLines: THREE.Line[]
): void {
  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const material = new THREE.LineBasicMaterial({
    color: COLORS.grid,
    transparent: true,
    opacity: Math.random() * 0.3 + 0.1,
  })
  const line = new THREE.Line(geometry, material)
  line.position.z = -50

  line.userData = {
    type,
    targetOpacity: Math.random() * 0.3 + 0.1,
    speed: 0.5 + Math.random() * 1.5,
    phase: Math.random() * Math.PI * 2,
    fadeTimer: Math.random() * 5,
  }

  group.add(line)
  gridLines.push(line)
}

/**
 * Creates the full background grid
 */
export function createGrid(group: THREE.Group, gridLines: THREE.Line[]): void {
  // Background plane
  const bgGeo = new THREE.PlaneGeometry(8000, 8000)
  const bgMat = new THREE.MeshBasicMaterial({ color: COLORS.background })
  const bgPlane = new THREE.Mesh(bgGeo, bgMat)
  bgPlane.position.z = -60
  group.add(bgPlane)

  // Horizontal lines
  for (let y = -GRID_SIZE; y <= GRID_SIZE; y += GRID_SPACING) {
    createGridLine(
      [new THREE.Vector3(-GRID_SIZE, y, 0), new THREE.Vector3(GRID_SIZE, y, 0)],
      'horizontal',
      group,
      gridLines
    )
  }

  // Vertical lines
  for (let x = -GRID_SIZE; x <= GRID_SIZE; x += GRID_SPACING) {
    createGridLine(
      [new THREE.Vector3(x, -GRID_SIZE, 0), new THREE.Vector3(x, GRID_SIZE, 0)],
      'vertical',
      group,
      gridLines
    )
  }

  // Diagonal lines
  for (let x = -GRID_SIZE; x < GRID_SIZE; x += GRID_SPACING) {
    for (let y = -GRID_SIZE; y < GRID_SIZE; y += GRID_SPACING) {
      if ((x + y) % (GRID_SPACING * 2) === 0) {
        createGridLine(
          [
            new THREE.Vector3(x, y, 0),
            new THREE.Vector3(x + GRID_SPACING, y + GRID_SPACING, 0),
          ],
          'diagonal',
          group,
          gridLines
        )
      }
    }
  }
}

/**
 * Animates grid line opacity with subtle pulsing
 */
export function animateGrid(gridLines: THREE.Line[], elapsedTime: number): void {
  gridLines.forEach((line) => {
    const data = line.userData
    data.fadeTimer -= 0.016

    if (data.fadeTimer <= 0) {
      data.targetOpacity = Math.random() * 0.35 + 0.05
      data.fadeTimer = 2 + Math.random() * 6
    }

    const mat = line.material as THREE.LineBasicMaterial
    const current = mat.opacity
    mat.opacity += (data.targetOpacity - current) * 0.02

    const wave = Math.sin(elapsedTime * data.speed + data.phase) * 0.05
    mat.opacity = Math.max(0.02, Math.min(0.4, mat.opacity + wave * 0.01))
  })
}
