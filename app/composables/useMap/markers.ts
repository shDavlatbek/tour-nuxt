import * as THREE from 'three'
import { COLORS, INITIAL_CAM_POS, REGION_NAMES } from './config'

// Ripple animation settings
const RIPPLE_SPEED = 0.8 // Speed of ripple expansion
const RIPPLE_MAX_SCALE = 2.0 // How far the ripple expands

/**
 * Creates an interactive marker for a region with ripple effect
 */
export function createMarker(
  center: THREE.Vector3,
  maxDimension: number,
  regionIndex: number = 0,
  regionId: string = ''
): THREE.Group {
  const markerGroup = new THREE.Group()
  markerGroup.position.set(center.x, center.y, 10)

  // Center sphere
  const pointGeo = new THREE.SphereGeometry(3, 32, 32)
  const pointMat = new THREE.MeshBasicMaterial({
    color: COLORS.marker,
    transparent: true,
    opacity: 1.0,
  })
  const pointMesh = new THREE.Mesh(pointGeo, pointMat)
  pointMesh.name = 'centerPoint'
  markerGroup.add(pointMesh)

  // Static outer ring
  const ringGeo = new THREE.TorusGeometry(6, 0.8, 16, 32)
  const ringMat = new THREE.MeshBasicMaterial({
    color: COLORS.marker,
    transparent: true,
    opacity: 0.8,
  })
  const ringMesh = new THREE.Mesh(ringGeo, ringMat)
  ringMesh.name = 'staticRing'
  markerGroup.add(ringMesh)

  // Ripple ring - single expanding ring, using generic scaling instead of regenerating geometry
  const rippleGeo = new THREE.TorusGeometry(6, 0.5, 16, 64)
  const rippleMat = new THREE.MeshBasicMaterial({
    color: COLORS.marker,
    transparent: true,
    opacity: 0.7,
  })
  const rippleMesh = new THREE.Mesh(rippleGeo, rippleMat)
  rippleMesh.name = 'ripple'
  rippleMesh.userData.isRipple = true
  rippleMesh.userData.baseRadius = 6
  markerGroup.add(rippleMesh)

  // Marker metadata
  markerGroup.userData.zoomDistance = maxDimension * 4 + 100
  markerGroup.userData.baseZ = 10
  markerGroup.userData.isMarker = true
  markerGroup.userData.regionIndex = regionIndex
  markerGroup.userData.regionId = regionId || `region-${regionIndex}`
  markerGroup.userData.regionName = REGION_NAMES[regionIndex] || `REGION ${regionIndex + 1}`
  markerGroup.userData.ripple = rippleMesh

  return markerGroup
}

/**
 * Updates marker scales based on camera distance
 */
export function updateMarkerScales(
  camera: THREE.PerspectiveCamera,
  interactablePoints: THREE.Group[]
): void {
  if (interactablePoints.length === 0) return

  const cameraZ = camera.position.z
  const baseZ = INITIAL_CAM_POS.z
  const scaleFactor = Math.max(0.3, Math.min(1.0, cameraZ / baseZ))

  interactablePoints.forEach((marker) => {
    if (marker.userData.isMarker) {
      if (!marker.userData.originalScale) {
        marker.userData.originalScale = 1.0
      }
      marker.scale.setScalar(scaleFactor)
    }
  })
}

/**
 * Animates markers with a CSS-style ripple effect
 * Single ring expands outward via scaling, then fades to 0
 */
export function animateMarkers(
  interactablePoints: THREE.Group[],
  elapsedTime: number
): void {
  interactablePoints.forEach((point, index) => {
    const ripple = point.userData.ripple as THREE.Mesh | undefined
    
    if (!ripple || !ripple.userData.isRipple) return

    // Calculate ripple progress (0 to 1, repeating)
    const progress = ((elapsedTime * RIPPLE_SPEED + index * 0.3) % 1)
    
    // Scale expands as progress increases
    const currentScale = 1 + progress * (RIPPLE_MAX_SCALE - 1)
    ripple.scale.set(currentScale, currentScale, 1)    
    
    // Opacity fades from 0.7 to 0 as ripple expands
    const material = ripple.material as THREE.MeshBasicMaterial
    material.opacity = 0.7 * (1 - progress)
  })
}
