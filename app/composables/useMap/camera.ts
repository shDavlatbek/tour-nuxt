import * as THREE from 'three'
import { Tween, Easing, Group } from '@tweenjs/tween.js'
import type { Ref } from 'vue'
import { INITIAL_CAM_POS, PARALLAX_STRENGTH, ZOOMED_PARALLAX_STRENGTH, MAX_PARALLAX_OFFSET } from './config'
import type { CameraPosition, MapState } from './types'

// Helper type to accept either a Ref or a plain object
type BlendValue = { value: number }

/**
 * Zooms camera to a specific marker
 */
export function zoomIn(
  camera: THREE.PerspectiveCamera,
  targetPoint: THREE.Group,
  tweenGroup: Group,
  state: Ref<MapState>,
  isZoomAnimating: Ref<boolean>,
  zoomedCamPos: Ref<CameraPosition>,
  fogParticles: THREE.Sprite[],
  interactablePoints: THREE.Group[]
): void {
  state.value.isZoomed = true
  isZoomAnimating.value = true

  const worldTargetPos = new THREE.Vector3()
  targetPoint.getWorldPosition(worldTargetPos)

  const finalZ = Math.max(targetPoint.userData.zoomDistance || 0, 50)

  // Main Camera Tween
  new Tween(camera.position, tweenGroup)
    .to({ x: worldTargetPos.x, y: worldTargetPos.y, z: finalZ }, 1800)
    .easing(Easing.Cubic.InOut)
    .onComplete(() => {
      zoomedCamPos.value = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
      }
      isZoomAnimating.value = false
    })
    .start()

  // Hide fog (Batch optimization: use shorter duration)
  fogParticles.forEach((sprite) => {
    new Tween(sprite.material, tweenGroup).to({ opacity: 0 }, 800).start()
  })

  // Hide other markers
  // Optimization: Traverse carefully to avoid creating tweens on non-materials
  interactablePoints.forEach((marker) => {
    if (marker !== targetPoint && marker.userData.isMarker) {
      marker.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          // Handle array materials if necessary, though usually rare in this setup
          const mat = child.material as THREE.Material
          new Tween(mat, tweenGroup)
            .to({ opacity: 0 }, 600)
            .easing(Easing.Cubic.Out)
            .start()
        }
      })
    }
  })
}

/**
 * Zooms camera back to overview
 */
export function zoomOutCamera(
  camera: THREE.PerspectiveCamera,
  tweenGroup: Group,
  state: Ref<MapState>,
  zoomBlend: BlendValue, // Changed type to allow plain object
  zoomedCamPos: Ref<CameraPosition>,
  fogParticles: THREE.Sprite[],
  interactablePoints: THREE.Group[]
): void {
  // Store current zoomed position for blend transition
  zoomedCamPos.value = {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
  }

  // 1. Update State immediately so UI can react (Back button hides, etc)
  state.value.isZoomed = false

  // 2. Animate blend factor from 1 to 0
  // CRITICAL OPTIMIZATION: We tween a plain object, and update the passed BlendValue.
  // We do NOT rely on Vue reactivity here.
  const proxy = { t: 1 } 
  zoomBlend.value = 1

  new Tween(proxy, tweenGroup)
    .to({ t: 0 }, 1500)
    .easing(Easing.Cubic.InOut)
    .onUpdate(() => {
      // This is the hot path. By using a plain object in useMap, 
      // this assignment becomes almost free.
      zoomBlend.value = proxy.t 
    })
    .start()

  // Show fog
  fogParticles.forEach((sprite) => {
    new Tween(sprite.material, tweenGroup)
      .to({ opacity: 0.4 }, 1500)
      .delay(500)
      .start()
  })

  // Show markers
  interactablePoints.forEach((marker) => {
    if (marker.userData.isMarker) {
      marker.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const mat = child.material as THREE.Material
          // Determine target opacity based on geometry type
          const targetOpacity = child.geometry.type.includes('Torus') ? 0.8 : 1.0
          
          new Tween(mat, tweenGroup)
            .to({ opacity: targetOpacity }, 800)
            .delay(300)
            .easing(Easing.Cubic.Out)
            .start()
        }
      })
    }
  })
}

/**
 * Updates camera position for parallax effect
 */
export function updateParallax(
  camera: THREE.PerspectiveCamera,
  mouseCurrent: { x: number; y: number },
  mouseTarget: { x: number; y: number },
  state: Ref<MapState>,
  isZoomAnimating: Ref<boolean>,
  zoomBlend: BlendValue, // Changed to BlendValue
  zoomedCamPos: Ref<CameraPosition>
): void {
  // Skip parallax updates when frozen
  if (state.value.isFrozen) return

  // Smooth mouse interpolation (Lerp)
  // Using 0.05 is good for "weighty" feel
  mouseCurrent.x += (mouseTarget.x - mouseCurrent.x) * 0.05
  mouseCurrent.y += (mouseTarget.y - mouseCurrent.y) * 0.05

  // Calculate Parallax Targets
  // Clamp values to prevent camera from drifting too far
  const pX = INITIAL_CAM_POS.x + mouseCurrent.x * PARALLAX_STRENGTH
  const pY = INITIAL_CAM_POS.y - mouseCurrent.y * PARALLAX_STRENGTH * 0.5
  const pZ = INITIAL_CAM_POS.z

  const clampedX = THREE.MathUtils.clamp(pX, -MAX_PARALLAX_OFFSET, MAX_PARALLAX_OFFSET)
  const clampedY = THREE.MathUtils.clamp(pY, -MAX_PARALLAX_OFFSET * 0.5, MAX_PARALLAX_OFFSET * 0.5)

  // 1. Standard Parallax (Not Zoomed, Not Animating)
  if (!state.value.isZoomed && !isZoomAnimating.value && zoomBlend.value < 0.001) {
    camera.position.x = clampedX
    camera.position.y = clampedY
    camera.position.z = pZ
    return
  }

  // 2. Zoomed Parallax (Subtle movement when looking at a region)
  if (state.value.isZoomed && !isZoomAnimating.value) {
    const targetX = zoomedCamPos.value.x + mouseCurrent.x * ZOOMED_PARALLAX_STRENGTH
    const targetY = zoomedCamPos.value.y - mouseCurrent.y * ZOOMED_PARALLAX_STRENGTH * 0.5
    
    // Smoothly interpolate current camera to target
    camera.position.x += (targetX - camera.position.x) * 0.08
    camera.position.y += (targetY - camera.position.y) * 0.08
    return
  }

  // 3. Blending State (Transitioning out of zoom)
  if (zoomBlend.value > 0.001) {
    const t = zoomBlend.value
    // Linear interpolation between the "Zoomed Position" and the "Parallax Position"
    camera.position.x = zoomedCamPos.value.x * t + clampedX * (1 - t)
    camera.position.y = zoomedCamPos.value.y * t + clampedY * (1 - t)
    camera.position.z = zoomedCamPos.value.z * t + pZ * (1 - t)
  }
}
