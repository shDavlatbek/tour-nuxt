import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import { Tween, Easing, Group } from '@tweenjs/tween.js'
import { ref, type Ref } from 'vue'

// Create a dedicated tween group for this composable
const tweenGroup = new Group()

export interface MapState {
  isZoomed: boolean
  isLoading: boolean
}

export interface UseMapReturn {
  state: Ref<MapState>
  init: (container: HTMLElement) => void
  dispose: () => void
  zoomOut: () => void
}

// Configuration constants
const MAP_SCALE = 2.5
const INITIAL_CAM_POS = { x: 0, y: 0, z: 1200 }
const PARALLAX_STRENGTH = 50
const ZOOMED_PARALLAX_STRENGTH = 20
const MAX_PARALLAX_OFFSET = 400

// Country names for labels
const COUNTRY_NAMES: Record<string, string> = {
  uz: 'Uzbekistan',
  kz: 'Kazakhstan',
  tm: 'Turkmenistan',
  af: 'Afghanistan',
  tj: 'Tajikistan',
  kg: 'Kyrgyzstan',
  ir: 'Iran',
}

export function useMap(): UseMapReturn {
  const state = ref<MapState>({
    isZoomed: false,
    isLoading: true,
  })

  // Reactive state for animation control
  const isZoomAnimating = ref(false)
  const zoomBlend = ref(0)
  const zoomedCamPos = ref({ x: 0, y: 0, z: 1200 })
  const isEntranceAnimating = ref(false)

  // Three.js objects (not reactive for performance to avoid Proxy overhead)
  let scene: THREE.Scene | null = null
  let camera: THREE.PerspectiveCamera | null = null
  let renderer: THREE.WebGLRenderer | null = null
  let animationFrameId: number | null = null

  // Groups
  let combinedMapGroup: THREE.Group | null = null
  let fogGroup: THREE.Group | null = null
  let gridGroup: THREE.Group | null = null

  // Arrays (kept non-reactive for interaction performance)
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

  // Event handlers stored for cleanup
  let handleMouseMove: ((e: MouseEvent) => void) | null = null
  let handleClick: ((e: MouseEvent) => void) | null = null
  let handleResize: (() => void) | null = null

  let containerEl: HTMLElement | null = null

  function createFogTexture(): THREE.CanvasTexture {
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

  function createGridLine(
    points: THREE.Vector3[],
    type: string,
    group: THREE.Group
  ): void {
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({
      color: 0xb4b4aa,
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

  function animateGrid(elapsedTime: number): void {
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

  function createTextSprite(text: string, fontSize = 40, color = '#555555'): THREE.Sprite {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    const scale = 2
    const scaledFontSize = fontSize * scale
    const fontString = 'bold ' + scaledFontSize + 'px Arial'

    ctx.font = fontString
    const metrics = ctx.measureText(text)
    const textWidth = metrics.width

    canvas.width = Math.ceil(textWidth + 40 * scale)
    canvas.height = Math.ceil(scaledFontSize + 20 * scale)

    ctx.font = fontString
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.fillText(text, canvas.width / 2, canvas.height / 2)

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

  function updateMarkerScales(): void {
    if (!camera || interactablePoints.length === 0) return

    const cameraZ = camera.position.z
    // Base scale at initial camera position (z=1200)
    const baseZ = INITIAL_CAM_POS.z
    // Calculate scale factor - markers should be smaller when zoomed in
    const scaleFactor = Math.max(0.3, Math.min(1.0, cameraZ / baseZ))

    interactablePoints.forEach((marker) => {
      if (marker.userData.isMarker) {
        // Store original scale if not set
        if (!marker.userData.originalScale) {
          marker.userData.originalScale = 1.0
        }
        
        marker.scale.setScalar(scaleFactor)
      }
    })
  }

  function zoomIn(targetPoint: THREE.Group): void {
    state.value.isZoomed = true
    isZoomAnimating.value = true

    const worldTargetPos = new THREE.Vector3()
    targetPoint.getWorldPosition(worldTargetPos)

    const finalZ = Math.max(targetPoint.userData.zoomDistance, 50)

    // Using explicit tweenGroup for all animations
    new Tween(camera!.position, tweenGroup)
      .to({ x: worldTargetPos.x, y: worldTargetPos.y, z: finalZ }, 1800)
      .easing(Easing.Cubic.InOut)
      .onComplete(() => {
        zoomedCamPos.value = {
          x: camera!.position.x,
          y: camera!.position.y,
          z: camera!.position.z,
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

  function zoomOut(): void {
    // Store current zoomed position for blend transition
    zoomedCamPos.value = {
      x: camera!.position.x,
      y: camera!.position.y,
      z: camera!.position.z,
    }

    state.value.isZoomed = false

    // Animate blend factor from 1 to 0 (smooth transition to parallax)
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

  function animate(): void {
    animationFrameId = requestAnimationFrame(animate)

    const delta = clock.getDelta()
    const elapsedTime = clock.getElapsedTime()
    
    // Update our explicit tween group
    tweenGroup.update()

    animateGrid(elapsedTime)

    // Parallax
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
        camera!.position.x += (targetX - camera!.position.x) * 0.08
        camera!.position.y += (targetY - camera!.position.y) * 0.08
      } else if (zoomBlend.value > 0.001) {
        // Transitioning - blend between zoomed and parallax positions
        camera!.position.x = zoomedCamPos.value.x * zoomBlend.value + parallaxX * (1 - zoomBlend.value)
        camera!.position.y = zoomedCamPos.value.y * zoomBlend.value + parallaxY * (1 - zoomBlend.value)
        camera!.position.z = zoomedCamPos.value.z * zoomBlend.value + parallaxZ * (1 - zoomBlend.value)
      } else {
        // Fully parallax mode
        camera!.position.x = parallaxX
        camera!.position.y = parallaxY
        camera!.position.z = parallaxZ // Ensure z is reset
      }
    }

    // Animate markers
    if (interactablePoints.length > 0 && !state.value.isZoomed) {
      interactablePoints.forEach((point, index) => {
        const bob = Math.sin(elapsedTime * 2 + index * 0.5) * 5
        point.position.z = point.userData.baseZ + bob
      })
    }

    // Update marker scales based on camera Z position
    updateMarkerScales()

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

  async function loadMap(): Promise<void> {
  const loader = new SVGLoader()

  try {
    const response = await fetch('/map.svg')
    
    if (!response.ok) {
      throw new Error('Failed to fetch map.svg: ' + response.status + ' ' + response.statusText)
    }
    
    const svgText = await response.text()

    const parser = new DOMParser()
    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml')
    const svgElement = svgDoc.documentElement
    const groups = svgElement.querySelectorAll('g[id]')

    groups.forEach((group) => {
      const countryId = group.getAttribute('id')!
      const isUzbekistan = countryId === 'uz'
      const isSea = countryId === 'sea'

      const groupSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      groupSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      groupSvg.innerHTML = group.innerHTML

      const serializer = new XMLSerializer()
      const groupSvgString = serializer.serializeToString(groupSvg)

      const groupData = loader.parse(groupSvgString)
      const paths = groupData.paths

      if (paths.length === 0) return

      const countryGroup = new THREE.Group()
      countryGroup.name = countryId

      paths.forEach((path: any) => { // Type as any for SVGLoader shape path
        const shapes = SVGLoader.createShapes(path)
        const pathMeshes: THREE.Mesh[] = []

        shapes.forEach((shape: THREE.Shape) => {
          if (isUzbekistan) {
            const geometry = new THREE.ExtrudeGeometry(shape, {
              depth: 5,
              bevelEnabled: false,
            })
            const material = new THREE.MeshStandardMaterial({
              color: 0xffee57,
              roughness: 0.5,
              metalness: 0.1,
            })

            const mesh = new THREE.Mesh(geometry, material)
            mesh.castShadow = true
            mesh.receiveShadow = true

            const edges = new THREE.EdgesGeometry(geometry)
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0x4a5a2b })
            const border = new THREE.LineSegments(edges, lineMaterial)
            mesh.add(border)

            countryGroup.add(mesh)
            pathMeshes.push(mesh)
          } else if (isSea) {
            const geometry = new THREE.ExtrudeGeometry(shape, {
              depth: 1,
              bevelEnabled: false,
            })
            const material = new THREE.MeshStandardMaterial({
              color: 0x4a90d9,
              roughness: 0.6,
              metalness: 0.1,
              transparent: true,
              opacity: 0.8,
            })

            const mesh = new THREE.Mesh(geometry, material)
            mesh.receiveShadow = true
            countryGroup.add(mesh)
          } else {
            const geometry = new THREE.ExtrudeGeometry(shape, {
              depth: 3,
              bevelEnabled: false,
            })
            const material = new THREE.MeshBasicMaterial({
              color: 0xf5f5f5,
              transparent: true,
              opacity: 0.6,
            })

            const mesh = new THREE.Mesh(geometry, material)
            mesh.receiveShadow = true

            const edges = new THREE.EdgesGeometry(geometry)
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0x888888 })
            const border = new THREE.LineSegments(edges, lineMaterial)
            mesh.add(border)

            countryGroup.add(mesh)
          }
        })

        // Add markers for Uzbekistan regions (now per path)
        if (isUzbekistan && pathMeshes.length > 0) {
          const pathBox = new THREE.Box3()
          pathMeshes.forEach((mesh) => pathBox.expandByObject(mesh))

          const pathCenter = new THREE.Vector3()
          pathBox.getCenter(pathCenter)

          const pathSize = new THREE.Vector3()
          pathBox.getSize(pathSize)

          // Special handling for disjointed parts (exclaves)
          // Just place one marker near the center

          const markerGroup = new THREE.Group()
          markerGroup.position.set(pathCenter.x, pathCenter.y, 10)

          const pointGeo = new THREE.SphereGeometry(3, 32, 32)
          const pointMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1.0,
          })
          const pointMesh = new THREE.Mesh(pointGeo, pointMat)
          markerGroup.add(pointMesh)

          const ringGeo = new THREE.TorusGeometry(6, 0.8, 16, 32)
          const ringMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
          })
          const ringMesh = new THREE.Mesh(ringGeo, ringMat)
          markerGroup.add(ringMesh)

          const maxDimension = Math.max(pathSize.x, pathSize.y)
          markerGroup.userData.zoomDistance = maxDimension * 4 + 100
          markerGroup.userData.baseZ = 10
          markerGroup.userData.isMarker = true

          countryGroup.add(markerGroup)
          interactablePoints.push(markerGroup)
        }
      })

      // Position elements
      if (isSea || !isUzbekistan) {
        countryGroup.position.z = -5
      }

      combinedMapGroup?.add(countryGroup)

      // Add country labels
      const countryName = COUNTRY_NAMES[countryId]
      if (countryName && !isUzbekistan && !isSea) {
        const box = new THREE.Box3().setFromObject(countryGroup)
        const center = new THREE.Vector3()
        box.getCenter(center)

        const label = createTextSprite(countryName, 24, '#444444')
        if (countryId === 'kz') {
          label.position.set(center.x, center.y + 70, 15)
        } else if (countryId === 'af') {
          label.position.set(center.x, center.y - 60, 15)
        } else {
          label.position.set(center.x, center.y, 15)
        }
        combinedMapGroup?.add(label)
      }
    })

    // Center on Uzbekistan
    const uzbekistanGroup = combinedMapGroup?.getObjectByName('uz')
    let offsetX = 0
    let offsetY = 0

    if (uzbekistanGroup) {
      const uzBox = new THREE.Box3().setFromObject(uzbekistanGroup)
      const uzCenter = uzBox.getCenter(new THREE.Vector3())
      offsetX = uzCenter.x
      offsetY = uzCenter.y
    }

    combinedMapGroup?.children.forEach((child: THREE.Object3D) => {
      child.position.x -= offsetX
      child.position.y -= offsetY
    })

    // Set initial state for entrance animation
    combinedMapGroup!.scale.set(0.01, -0.01, 0.01)
    combinedMapGroup!.position.z = 500
    
    // Start entrance animation
    isEntranceAnimating.value = true
    state.value.isLoading = false
    
    // Animate scale
    const scaleObj = { value: 0.01 }
    new Tween(scaleObj, tweenGroup)
      .to({ value: MAP_SCALE }, 2000)
      .easing(Easing.Cubic.Out)
      .onUpdate(() => {
        if (combinedMapGroup) {
          combinedMapGroup.scale.set(scaleObj.value, -scaleObj.value, scaleObj.value)
        }
      })
      .start()
    
    // Animate position from far to normal
    new Tween(combinedMapGroup!.position, tweenGroup)
      .to({ z: 0 }, 2000)
      .easing(Easing.Cubic.Out)
      .onComplete(() => {
        isEntranceAnimating.value = false
      })
      .start()
    
    // Also animate fog particles from invisible to visible
    fogParticles.forEach((sprite, index) => {
      sprite.material.opacity = 0
      new Tween(sprite.material, tweenGroup)
        .to({ opacity: 0.4 }, 1200)
        .delay(800 + index * 30)
        .easing(Easing.Cubic.Out)
        .start()
    })
    
  } catch (error) {
    console.error('[useMap] Failed to load map:', error)
    state.value.isLoading = false
  }
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

    // Background plane
    const bgGeo = new THREE.PlaneGeometry(8000, 8000)
    const bgMat = new THREE.MeshBasicMaterial({ color: 0xeef2f3 })
    const bgPlane = new THREE.Mesh(bgGeo, bgMat)
    bgPlane.position.z = -60
    gridGroup.add(bgPlane)

    // Grid lines
    const gridSpacing = 40
    const gridSize = 2000

    for (let y = -gridSize; y <= gridSize; y += gridSpacing) {
      createGridLine(
        [new THREE.Vector3(-gridSize, y, 0), new THREE.Vector3(gridSize, y, 0)],
        'horizontal',
        gridGroup
      )
    }

    for (let x = -gridSize; x <= gridSize; x += gridSpacing) {
      createGridLine(
        [new THREE.Vector3(x, -gridSize, 0), new THREE.Vector3(x, gridSize, 0)],
        'vertical',
        gridGroup
      )
    }

    for (let x = -gridSize; x < gridSize; x += gridSpacing) {
      for (let y = -gridSize; y < gridSize; y += gridSpacing) {
        if ((x + y) % (gridSpacing * 2) === 0) {
          createGridLine(
            [
              new THREE.Vector3(x, y, 0),
              new THREE.Vector3(x + gridSpacing, y + gridSpacing, 0),
            ],
            'diagonal',
            gridGroup
          )
        }
      }
    }

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
          zoomIn(target as THREE.Group)
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
    loadMap()
    animate()
  }

  function dispose(): void {
    // Cancel animation
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
    }

    // Remove event listeners
    if (handleMouseMove) window.removeEventListener('mousemove', handleMouseMove)
    if (handleClick) window.removeEventListener('click', handleClick)
    if (handleResize) window.removeEventListener('resize', handleResize)

    // Dispose Three.js objects
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

    // Clear arrays
    interactablePoints.length = 0
    fogParticles.length = 0
    gridLines.length = 0

    // Clear references
    scene = null
    camera = null
    renderer = null
    combinedMapGroup = null
    fogGroup = null
    gridGroup = null
    containerEl = null
  }

  return {
    state,
    init,
    dispose,
    zoomOut,
  }
}
