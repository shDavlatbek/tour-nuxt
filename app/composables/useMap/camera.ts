import * as THREE from 'three'
import { Tween, Easing, Group } from '@tweenjs/tween.js'
import type { Ref } from 'vue'
import { INITIAL_CAM_POS, PARALLAX_STRENGTH, ZOOMED_PARALLAX_STRENGTH, MAX_PARALLAX_OFFSET } from './config'
import type { CameraPosition, MapState } from './types'

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

  const finalZ = Math.max(targetPoint.userData.zoomDistance, 50)

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

  // Hide fog
  fogParticles.forEach((sprite) => {
    new Tween(sprite.material, tweenGroup).to({ opacity: 0 }, 800).start()
  })

  // Hide other markers
  interactablePoints.forEach((marker) => {
    if (marker !== targetPoint && marker.userData.isMarker) {
      marker.traverse((child: THREE.Object3D) => {
        if ((child as THREE.Mesh).material) {
          new Tween((child as THREE.Mesh).material, tweenGroup)
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
  zoomBlend: Ref<number>,
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

  state.value.isZoomed = false

  // Animate blend factor from 1 to 0
  const blendObj = { value: 1 }
  zoomBlend.value = 1

  new Tween(blendObj, tweenGroup)
    .to({ value: 0 }, 1500)
    .easing(Easing.Cubic.InOut)
    .onUpdate((obj) => {
      zoomBlend.value = obj.value
    })
    .start()

  // Show fog
  fogParticles.forEach((sprite) => {
    new Tween(sprite.material, tweenGroup).to({ opacity: 0.4 }, 1500).delay(500).start()
  })

  // Show markers
  interactablePoints.forEach((marker) => {
    if (marker.userData.isMarker) {
      marker.traverse((child: THREE.Object3D) => {
        if ((child as THREE.Mesh).material) {
          const targetOpacity =
            (child as THREE.Mesh).geometry?.type === 'TorusGeometry' ? 0.8 : 1.0
          new Tween((child as THREE.Mesh).material, tweenGroup)
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
  zoomBlend: Ref<number>,
  zoomedCamPos: Ref<CameraPosition>
): void {
  // Skip parallax updates when frozen
  if (state.value.isFrozen) {
    return
  }

  // Smooth mouse interpolation
  mouseCurrent.x += (mouseTarget.x - mouseCurrent.x) * 0.05
  mouseCurrent.y += (mouseTarget.y - mouseCurrent.y) * 0.05

  let parallaxX = INITIAL_CAM_POS.x + mouseCurrent.x * PARALLAX_STRENGTH
  let parallaxY = INITIAL_CAM_POS.y - mouseCurrent.y * PARALLAX_STRENGTH * 0.5
  const parallaxZ = INITIAL_CAM_POS.z

  parallaxX = Math.max(-MAX_PARALLAX_OFFSET, Math.min(MAX_PARALLAX_OFFSET, parallaxX))
  parallaxY = Math.max(-MAX_PARALLAX_OFFSET * 0.5, Math.min(MAX_PARALLAX_OFFSET * 0.5, parallaxY))

  if (!isZoomAnimating.value) {
    if (state.value.isZoomed) {
      const targetX = zoomedCamPos.value.x + mouseCurrent.x * ZOOMED_PARALLAX_STRENGTH
      const targetY = zoomedCamPos.value.y - mouseCurrent.y * ZOOMED_PARALLAX_STRENGTH * 0.5
      camera.position.x += (targetX - camera.position.x) * 0.08
      camera.position.y += (targetY - camera.position.y) * 0.08
    } else if (zoomBlend.value > 0.001) {
      // Transitioning - blend between zoomed and parallax positions
      camera.position.x = zoomedCamPos.value.x * zoomBlend.value + parallaxX * (1 - zoomBlend.value)
      camera.position.y = zoomedCamPos.value.y * zoomBlend.value + parallaxY * (1 - zoomBlend.value)
      camera.position.z = zoomedCamPos.value.z * zoomBlend.value + parallaxZ * (1 - zoomBlend.value)
    } else {
      // Fully parallax mode
      camera.position.x = parallaxX
      camera.position.y = parallaxY
      camera.position.z = parallaxZ
    }
  }
}
