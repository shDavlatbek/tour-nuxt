import * as THREE from 'three'
import { COLORS, INITIAL_CAM_POS } from './config'

/**
 * Creates an interactive marker for a region
 */
export function createMarker(
  center: THREE.Vector3,
  maxDimension: number
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
  markerGroup.add(pointMesh)

  // Outer ring
  const ringGeo = new THREE.TorusGeometry(6, 0.8, 16, 32)
  const ringMat = new THREE.MeshBasicMaterial({
    color: COLORS.marker,
    transparent: true,
    opacity: 0.8,
  })
  const ringMesh = new THREE.Mesh(ringGeo, ringMat)
  markerGroup.add(ringMesh)

  // Marker metadata
  markerGroup.userData.zoomDistance = maxDimension * 4 + 100
  markerGroup.userData.baseZ = 10
  markerGroup.userData.isMarker = true

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
 * Animates markers with a bobbing motion
 */
export function animateMarkers(
  interactablePoints: THREE.Group[],
  elapsedTime: number
): void {
  interactablePoints.forEach((point, index) => {
    const bob = Math.sin(elapsedTime * 2 + index * 0.5) * 5
    point.position.z = point.userData.baseZ + bob
  })
}
