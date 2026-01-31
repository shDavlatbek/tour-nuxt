import * as THREE from 'three'
import { Group } from '@tweenjs/tween.js'
import { ref } from 'vue'

// Types
import type { MapState, UseMapReturn, CameraPosition } from './types'

// Config
import { INITIAL_CAM_POS } from './config'

// Utilities
import { createFogTexture } from './textures'
import { createGrid, animateGrid } from './grid'
import { updateMarkerScales, animateMarkers } from './markers'
import { zoomIn, zoomOutCamera, updateParallax } from './camera'
import { loadMap } from './loader'

// Create a dedicated tween group for this composable
const tweenGroup = new Group()

export function useMap(): UseMapReturn {
  const state = ref<MapState>({
    isZoomed: false,
    isLoading: true,
  })

  // Reactive state for animation control
  const isZoomAnimating = ref(false)
  const zoomBlend = ref(0)
  const zoomedCamPos = ref<CameraPosition>({ x: 0, y: 0, z: 1200 })
  const isEntranceAnimating = ref(false)

  // Three.js objects (not reactive for performance)
  let scene: THREE.Scene | null = null
  let camera: THREE.PerspectiveCamera | null = null
  let renderer: THREE.WebGLRenderer | null = null
  let animationFrameId: number | null = null

  // Groups
  let combinedMapGroup: THREE.Group | null = null
  let fogGroup: THREE.Group | null = null
  let gridGroup: THREE.Group | null = null

  // Arrays
  const interactablePoints: THREE.Group[] = []
  const fogParticles: THREE.Sprite[] = []
  const gridLines: THREE.Line[] = []

  // Mouse tracking
  const mouseTarget = { x: 0, y: 0 }
  const mouseCurrent = { x: 0, y: 0 }

  // Utils
  const clock = new THREE.Clock()
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  // Event handlers
  let handleMouseMove: ((e: MouseEvent) => void) | null = null
  let handleClick: ((e: MouseEvent) => void) | null = null
  let handleResize: (() => void) | null = null
  let containerEl: HTMLElement | null = null

  function createFogParticle(x: number, y: number, z: number, scale: number): void {
    const material = new THREE.SpriteMaterial({
      map: createFogTexture(),
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      depthTest: true,
    })

    const sprite = new THREE.Sprite(material)
    sprite.position.set(x, y, z)
    sprite.scale.set(scale, scale, 1)

    sprite.userData = {
      speed: 5 + Math.random() * 8,
      limitX: 1000,
    }

    fogGroup?.add(sprite)
    fogParticles.push(sprite)
  }

  function animate(): void {
    animationFrameId = requestAnimationFrame(animate)

    const delta = clock.getDelta()
    const elapsedTime = clock.getElapsedTime()

    // Update tweens
    tweenGroup.update()

    // Animate grid
    animateGrid(gridLines, elapsedTime)

    // Update parallax
    updateParallax(
      camera!,
      mouseCurrent,
      mouseTarget,
      state,
      isZoomAnimating,
      zoomBlend,
      zoomedCamPos
    )

    // Animate markers
    if (interactablePoints.length > 0 && !state.value.isZoomed) {
      animateMarkers(interactablePoints, elapsedTime)
    }

    // Update marker scales
    updateMarkerScales(camera!, interactablePoints)

    // Drifting fog
    if (!state.value.isZoomed) {
      fogParticles.forEach((sprite) => {
        sprite.position.x += sprite.userData.speed * delta * 20
        if (sprite.position.x > sprite.userData.limitX) {
          sprite.position.x = -sprite.userData.limitX
        }
      })
    }

    renderer?.render(scene!, camera!)
  }

  function init(container: HTMLElement): void {
    containerEl = container

    // Scene setup
    scene = new THREE.Scene()
    scene.background = null
    scene.fog = new THREE.Fog(0xeef2f3, 800, 3500)

    // Camera
    camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      10000
    )
    camera.position.set(INITIAL_CAM_POS.x, INITIAL_CAM_POS.y, INITIAL_CAM_POS.z)

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
    scene.add(ambientLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(200, 500, 400)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = 2048
    dirLight.shadow.mapSize.height = 2048
    scene.add(dirLight)

    // Fog group
    fogGroup = new THREE.Group()
    scene.add(fogGroup)

    // Create fog particles
    for (let i = 0; i < 25; i++) {
      const x = (Math.random() - 0.5) * 1600
      const y = (Math.random() - 0.5) * 800
      const z = 50 + Math.random() * 150
      const fogScale = 300 + Math.random() * 300
      createFogParticle(x, y, z, fogScale)
    }

    // Grid group
    gridGroup = new THREE.Group()
    scene.add(gridGroup)
    createGrid(gridGroup, gridLines)

    // Map group
    combinedMapGroup = new THREE.Group()
    scene.add(combinedMapGroup)

    // Event handlers
    handleMouseMove = (e: MouseEvent) => {
      mouseTarget.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouseTarget.y = (e.clientY / window.innerHeight - 0.5) * 2
    }

    handleClick = (e: MouseEvent) => {
      if (state.value.isZoomed) return

      mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1

      raycaster.setFromCamera(mouse, camera!)
      const intersects = raycaster.intersectObjects(interactablePoints, true)

      if (intersects.length > 0) {
        const firstIntersect = intersects[0]
        if (!firstIntersect) return

        let target: THREE.Object3D | null = firstIntersect.object
        while (target && !target.userData.isMarker) {
          target = target.parent
        }
        if (target && target.userData.isMarker) {
          zoomIn(
            camera!,
            target as THREE.Group,
            tweenGroup,
            state,
            isZoomAnimating,
            zoomedCamPos,
            fogParticles,
            interactablePoints
          )
        }
      }
    }

    handleResize = () => {
      camera!.aspect = window.innerWidth / window.innerHeight
      camera!.updateProjectionMatrix()
      renderer!.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('click', handleClick)
    window.addEventListener('resize', handleResize)

    // Load map and start animation
    loadMap(combinedMapGroup, interactablePoints, state, fogParticles, tweenGroup, isEntranceAnimating)
    animate()
  }

  function dispose(): void {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
    }

    if (handleMouseMove) window.removeEventListener('mousemove', handleMouseMove)
    if (handleClick) window.removeEventListener('click', handleClick)
    if (handleResize) window.removeEventListener('resize', handleResize)

    scene?.traverse((object: THREE.Object3D) => {
      if (object instanceof THREE.Mesh) {
        object.geometry?.dispose()
        if (Array.isArray(object.material)) {
          object.material.forEach((m: THREE.Material) => m.dispose())
        } else {
          object.material?.dispose()
        }
      }
      if (object instanceof THREE.Line) {
        object.geometry?.dispose()
        ;(object.material as THREE.Material)?.dispose()
      }
      if (object instanceof THREE.Sprite) {
        ;(object.material as THREE.SpriteMaterial)?.map?.dispose()
        object.material?.dispose()
      }
    })

    renderer?.dispose()
    if (containerEl && renderer) {
      containerEl.removeChild(renderer.domElement)
    }

    interactablePoints.length = 0
    fogParticles.length = 0
    gridLines.length = 0

    scene = null
    camera = null
    renderer = null
    combinedMapGroup = null
    fogGroup = null
    gridGroup = null
    containerEl = null
  }

  function zoomOut(): void {
    zoomOutCamera(
      camera!,
      tweenGroup,
      state,
      zoomBlend,
      zoomedCamPos,
      fogParticles,
      interactablePoints
    )
  }

  return {
    state,
    init,
    dispose,
    zoomOut,
  }
}

// Re-export types for convenience
export type { MapState, UseMapReturn } from './types'
