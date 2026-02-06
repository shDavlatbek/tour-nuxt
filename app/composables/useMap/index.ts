import * as THREE from 'three'
import { Group, Tween, Easing } from '@tweenjs/tween.js'
import { ref } from 'vue' // Changed back to ref for deep reactivity


// Types
import type { MapState, UseMapReturn, CameraPosition } from './types'

// Config
import { INITIAL_CAM_POS, LABEL_CONFIG, COLORS } from './config'

// Utilities
import { createFogTexture } from './textures'
import { createGrid, animateGrid } from './grid'
import { updateMarkerScales, animateMarkers } from './markers'
import { zoomIn, zoomOutCamera, updateParallax } from './camera'
import { loadMap } from './loader'
import { 
  createCityLabel, 
  updateLabelsProximity, 
  updateLabelPositions, 
  disposeLabels, 
  updateLabelsForZoom, 
  hideAllLabels, 
  type CityLabel 
} from './labels'

export function useMap(): UseMapReturn {
  // CRITICAL FIX: Use 'ref' so Vue detects changes to .isZoomed
  const state = ref<MapState>({
    isZoomed: false,
    isLoading: true,
    isFrozen: false,
    isPaused: false,
  })

  // Reactive state
  const isZoomAnimating = ref(false)
  const zoomBlend = ref(0)
  const zoomedCamPos = ref<CameraPosition>({ x: 0, y: 0, z: 1200 })
  const isEntranceAnimating = ref(false)

  // Animation Engine (Instance scoped)
  const tweenGroup = new Group()

  // Three.js objects (Non-reactive for performance)
  let scene: THREE.Scene | null = null
  let camera: THREE.PerspectiveCamera | null = null
  let renderer: THREE.WebGLRenderer | null = null
  let animationFrameId: number | null = null

  // Groups
  let combinedMapGroup: THREE.Group | null = null
  let fogGroup: THREE.Group | null = null
  let gridGroup: THREE.Group | null = null
  let labelsGroup: THREE.Group | null = null

  // Data Structures
  const interactablePoints: THREE.Group[] = []
  const fogParticles: THREE.Sprite[] = []
  const gridLines: THREE.Line[] = []
  const cityLabels: CityLabel[] = []

  let selectedRegionId: string | null = null

  // Interaction State
  const mouseTarget = { x: 0, y: 0 }
  const mouseCurrent = { x: 0, y: 0 }
  const mouseScreenPos = { x: 0, y: 0 }
  
  // Reusable instances to avoid Garbage Collection
  const clock = new THREE.Clock()
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  // Event Handlers
  let handleMouseMove: ((e: MouseEvent) => void) | null = null
  let handleClick: ((e: MouseEvent) => void) | null = null
  let handleResize: (() => void) | null = null
  let containerEl: HTMLElement | null = null

  // --- Helpers ---

  function createFogParticle(x: number, y: number, z: number, scale: number): void {
    if (!fogGroup) return
    
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

    fogGroup.add(sprite)
    fogParticles.push(sprite)
  }

  function createLabelsForMarkers(): void {
    if (!labelsGroup) return

    interactablePoints.forEach((marker) => {
      if (marker.userData.isMarker) {
        const label = createCityLabel(
          marker.userData.regionId,
          marker,
          marker.userData.regionIndex
        )
        labelsGroup!.add(label.group)
        cityLabels.push(label)
      }
    })
  }

  /**
   * Extracted highlight logic to improve readability
   */
  function highlightRegionMeshes(marker: THREE.Group, highlight: boolean) {
    const meshes = marker.userData.regionMeshes as THREE.Mesh[] | undefined
    if (!meshes) return

    const targetMix = highlight ? 1.0 : 0.0

    meshes.forEach((mesh) => {
      if (!(mesh.material instanceof THREE.MeshStandardMaterial)) return
      
      const mat = mesh.material
      const userData = mat.userData

      // 1. Shader-based Grid Mix Animation
      if (userData?.gridMix) {
        // Stop existing tween
        if (mesh.userData._highlightTween) {
          mesh.userData._highlightTween.stop()
        }

        const currentMix = userData.gridMix.value
        
        mesh.userData._highlightTween = new Tween({ mix: currentMix }, tweenGroup)
          .to({ mix: targetMix }, highlight ? 500 : 400) // Slightly faster fade out
          .easing(Easing.Quadratic.Out)
          .onUpdate(({ mix }) => {
            userData.gridMix.value = mix
            
            // Adjust emissive based on mix
            const intensityBase = 0.8
            mat.emissive.setHex(COLORS.uzbekistan)
            mat.emissiveIntensity = intensityBase + (mix * 0.2)
          })
          .onComplete(() => {
            delete mesh.userData._highlightTween
          })
          .start()
      } 
      // 2. Fallback Standard Material Animation
      else {
        if (highlight) {
            mat.color.setHex(COLORS.uzbekistanHighlight)
            mat.emissive.setHex(COLORS.uzbekistanHighlight)
            mat.emissiveIntensity = 0.3
        } else {
            mat.color.setHex(COLORS.uzbekistan)
            mat.emissive.setHex(COLORS.uzbekistan)
            mat.emissiveIntensity = 0.8
        }
        mat.needsUpdate = true
      }
    })
  }

  function triggerZoomToRegion(regionId: string, marker: THREE.Group) {
    if (!camera) return
    selectedRegionId = regionId
    updateLabelsForZoom(cityLabels, selectedRegionId, true, tweenGroup, 1.8)
    
    highlightRegionMeshes(marker, true)
    
    zoomIn(
      camera,
      marker,
      tweenGroup,
      state,
      isZoomAnimating,
      zoomedCamPos,
      fogParticles,
      interactablePoints
    )
  }

  // --- Animation Loop ---

  function animate(): void {
    animationFrameId = requestAnimationFrame(animate)

    if (state.value.isPaused || !scene || !camera || !renderer) return

    const delta = clock.getDelta()
    const elapsedTime = clock.getElapsedTime()
    const isFrozen = state.value.isFrozen
    const isZoomed = state.value.isZoomed

    tweenGroup.update()

    animateGrid(gridLines, elapsedTime)

    // Camera Parallax
    updateParallax(
      camera,
      mouseCurrent,
      mouseTarget,
      state,
      isZoomAnimating,
      zoomBlend,
      zoomedCamPos
    )

    // Marker & Label Animation (Skip if frozen or zoomed)
    if (!isFrozen) {
      if (!isZoomed && interactablePoints.length > 0) {
        animateMarkers(interactablePoints, elapsedTime)
      }

      updateMarkerScales(camera, interactablePoints)

      if (cityLabels.length > 0) {
        updateLabelPositions(cityLabels, combinedMapGroup!)
        
        // Perf: Only check proximity when not zoomed to save calculations
        if (!isZoomed) {
          updateLabelsProximity(cityLabels, camera, mouseScreenPos, LABEL_CONFIG.revealRadius, tweenGroup)
        }
      }

      // Fog Animation
      if (!isZoomed) {
        // Optimized for-loop for arrays is faster than forEach
        for (let i = 0, l = fogParticles.length; i < l; i++) {
          const sprite = fogParticles[i]!
          sprite.position.x += sprite.userData.speed * delta * 20
          if (sprite.position.x > sprite.userData.limitX) {
            sprite.position.x = -sprite.userData.limitX
          }
        }
      }
    }

    renderer.render(scene, camera)
  }

  // --- Lifecycle ---

  function init(container: HTMLElement): void {
    containerEl = container

    // Scene
    scene = new THREE.Scene()
    // Do not set background if transparent is intended, otherwise set it here to save blending costs
    scene.fog = new THREE.Fog(0xeef2f3, 800, 3500)

    // Camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000)
    camera.position.set(INITIAL_CAM_POS.x, INITIAL_CAM_POS.y, INITIAL_CAM_POS.z)

    // Renderer Optimization
    const pixelRatio = Math.min(window.devicePixelRatio, 2) // Cap at 2x for performance
    // AA is expensive. Only enable if pixel ratio is 1 (standard monitors).
    // High DPI screens don't need AA as much.
    const antialias = pixelRatio === 1 

    renderer = new THREE.WebGLRenderer({ antialias, alpha: true, powerPreference: "high-performance" })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(pixelRatio)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1)
    scene.add(ambientLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 2)
    dirLight.position.set(200, 500, 400)
    dirLight.castShadow = true
    // Optimized shadow map size (2048 is often overkill for stylized maps, 1024 is usually sufficient)
    dirLight.shadow.mapSize.width = 1024 
    dirLight.shadow.mapSize.height = 1024
    scene.add(dirLight)

    // Groups
    fogGroup = new THREE.Group()
    gridGroup = new THREE.Group()
    combinedMapGroup = new THREE.Group()
    labelsGroup = new THREE.Group()

    scene.add(fogGroup, gridGroup, combinedMapGroup, labelsGroup)

    // Init Fog
    for (let i = 0; i < 25; i++) {
      const x = (Math.random() - 0.5) * 1600
      const y = (Math.random() - 0.5) * 800
      const z = 50 + Math.random() * 150
      const fogScale = 300 + Math.random() * 300
      createFogParticle(x, y, z, fogScale)
    }

    createGrid(gridGroup, gridLines)

    // Interaction Setup
    handleMouseMove = (e: MouseEvent) => {
      // Calculate normalized device coordinates (-1 to +1)
      mouseTarget.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouseTarget.y = (e.clientY / window.innerHeight - 0.5) * 2
      mouseScreenPos.x = e.clientX
      mouseScreenPos.y = e.clientY
    }

    handleClick = (e: MouseEvent) => {
      if (state.value.isPaused || state.value.isZoomed || !camera || !labelsGroup) return

      // Use the bounds of the renderer, not window, in case it's embedded
      const rect = renderer!.domElement.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)

      // 1. Check Markers (Priority)
      const markerIntersects = raycaster.intersectObjects(interactablePoints, true)
      
      if (markerIntersects.length > 0) {
        // Traverse up to find the group with user data
        let target: THREE.Object3D | null = markerIntersects[0]!.object
        while (target && !target.userData.isMarker) {
          target = target.parent
        }
        if (target && target.userData.isMarker) {
          triggerZoomToRegion(target.userData.regionId, target as THREE.Group)
          return
        }
      }

      // 2. Check Labels
      // Optimization: Instead of traversing, maintain a flattened array of hit targets if possible.
      // Current approach:
      const labelObjects: THREE.Object3D[] = []
      labelsGroup.children.forEach(group => {
          // Add sprite and line children to check
          group.children.forEach(child => {
              if (child.type === 'Sprite' || child.type === 'Line') labelObjects.push(child)
          })
      })

      const labelIntersects = raycaster.intersectObjects(labelObjects, false)
      if (labelIntersects.length > 0) {
        const labelGroup = labelIntersects[0]!.object.parent
        if (labelGroup && labelGroup.name.startsWith('label-')) {
          const regionId = labelGroup.name.replace('label-', '')
          const marker = interactablePoints.find(m => m.userData.regionId === regionId)
          if (marker) triggerZoomToRegion(regionId, marker)
        }
      }
    }

    handleResize = () => {
      if (!camera || !renderer) return
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    // Attach to DOM element where possible to avoid global pollution
    renderer.domElement.addEventListener('mousemove', handleMouseMove)
    renderer.domElement.addEventListener('click', handleClick)
    window.addEventListener('resize', handleResize)

    // Load Assets
    loadMap(combinedMapGroup, interactablePoints, state, fogParticles, tweenGroup, isEntranceAnimating)
      .then(() => {
        createLabelsForMarkers()
      })
    
    animate()
  }

  function dispose(): void {
    if (animationFrameId !== null) cancelAnimationFrame(animationFrameId)

    // Cleanup Listeners
    if (renderer?.domElement && handleMouseMove) renderer.domElement.removeEventListener('mousemove', handleMouseMove)
    if (renderer?.domElement && handleClick) renderer.domElement.removeEventListener('click', handleClick)
    if (handleResize) window.removeEventListener('resize', handleResize)

    // Stop all tweens
    tweenGroup.removeAll()

    // Dispose Labels
    disposeLabels(cityLabels)

    // Helper for thorough cleaning
    const cleanMaterial = (mat: any) => {
      mat.dispose()
      if (mat.map) mat.map.dispose()
      if (mat.uniforms) {
         Object.values(mat.uniforms).forEach((u: any) => {
             if (u.value?.dispose) u.value.dispose()
         })
      }
    }

    // Recursive scene disposal
    scene?.traverse((object: THREE.Object3D) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose()
        if (Array.isArray(object.material)) {
          object.material.forEach(cleanMaterial)
        } else {
          cleanMaterial(object.material)
        }
      }
      if (object instanceof THREE.Line) {
        object.geometry.dispose()
        if (object.material instanceof THREE.Material) cleanMaterial(object.material)
      }
      if (object instanceof THREE.Sprite) {
        object.geometry.dispose() // Sprites have geometry too
        cleanMaterial(object.material)
      }
    })

    renderer?.dispose()
    if (containerEl && renderer) {
      containerEl.removeChild(renderer.domElement)
    }

    // Clear Arrays
    interactablePoints.length = 0
    fogParticles.length = 0
    gridLines.length = 0
    cityLabels.length = 0

    // Nullify
    scene = null
    camera = null
    renderer = null
    combinedMapGroup = null
    fogGroup = null
    gridGroup = null
    labelsGroup = null
    containerEl = null
  }

  function zoomOut(): void {
    if (!camera) return

    // 1. Reset Highlights
    interactablePoints.forEach((marker) => highlightRegionMeshes(marker, false))

    // 2. Reset Labels
    selectedRegionId = null
    updateLabelsForZoom(cityLabels, null, false, tweenGroup)

    // 3. Move Camera
    zoomOutCamera(
      camera,
      tweenGroup,
      state,
      zoomBlend,
      zoomedCamPos,
      fogParticles,
      interactablePoints
    )
  }

  function freeze(): void {
    state.value.isFrozen = true
    hideAllLabels(cityLabels, tweenGroup)
  }

  function unfreeze(): void {
    state.value.isFrozen = false
  }

  function setScrollZoom(progress: number): void {
    if (!camera) return
    const startZ = INITIAL_CAM_POS.z
    const endZ = 2500
    camera.position.z = startZ + (endZ - startZ) * progress
  }

  function pause(): void {
    state.value.isPaused = true
  }

  function resume(): void {
    state.value.isPaused = false
    // Restart loop if it stopped
    if (animationFrameId === null) animate()
  }

  return {
    state,
    init,
    dispose,
    zoomOut,
    freeze,
    unfreeze,
    setScrollZoom,
    pause,
    resume,
  }
}

export type { MapState, UseMapReturn } from './types'