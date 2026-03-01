<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as THREE from 'three'

interface Props {
  progress: number // 0 to 1
  aboutProgress: number
}

const props = defineProps<Props>()
const canvasRef = ref<HTMLCanvasElement | null>(null)

let scene: THREE.Scene | null = null
let camera: THREE.OrthographicCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let sharedMaterial: THREE.SpriteMaterial | null = null

const CLOUD_CONFIGS = [
  { id: 1, sx: -60, sy: 0, s: 2.5 },
  { id: 2, sx: 60, sy: 0, s: 2.5 },
  { id: 3, sx: 0, sy: -60, s: 2.5 },
  { id: 4, sx: 0, sy: 60, s: 2.5 },
]

const clouds: THREE.Sprite[] = []

onMounted(() => {
  if (!canvasRef.value) return

  // Scene setup
  scene = new THREE.Scene()

  const w = window.innerWidth
  const h = window.innerHeight

  camera = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 1000)
  camera.position.z = 100

  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    alpha: true,
    antialias: false, // Sprites don't need anti-aliasing
    powerPreference: 'high-performance'
  })
  renderer.setSize(w, h)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // Load cloud texture
  const textureLoader = new THREE.TextureLoader()
  textureLoader.load('/images/cloudsh.png', (texture) => {
    if (!scene) return

    // High quality filtering for smooth zooming
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter

    sharedMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      opacity: 0 // start hidden
    })

    CLOUD_CONFIGS.forEach((config) => {
      const sprite = new THREE.Sprite(sharedMaterial!)
      sprite.userData = { config }
      scene!.add(sprite)
      clouds.push(sprite)
    })

    // Initial render
    updateClouds()
    forceRender()
  })

  window.addEventListener('resize', handleResize)
})

function handleResize() {
  if (!camera || !renderer || !scene) return
  const w = window.innerWidth
  const h = window.innerHeight
  camera.left = -w / 2
  camera.right = w / 2
  camera.top = h / 2
  camera.bottom = -h / 2
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)

  if (clouds.length > 0) {
    updateClouds()
    forceRender()
  }
}

function updateClouds() {
  if (!sharedMaterial) return

  const p = props.progress
  const w = window.innerWidth
  const h = window.innerHeight

  const opacityProgress = Math.min(1, Math.max(0, p / 0.2))
  sharedMaterial.opacity = opacityProgress

  clouds.forEach(sprite => {
    const config = sprite.userData.config

    // Calculate movement targeting edge limits
    const startX = (config.sx * 2.5 * w) / 100
    const startY = -(config.sy * 2.5 * h) / 100 // CSS Y inverted for Three.js

    const currentX = startX * (1 - p)
    const currentY = startY * (1 - p)

    sprite.position.set(currentX, currentY, 0)

    // Calculate Scale respecting screen dimensions
    const baseWidthRaw = w * 0.5
    const baseWidth = Math.max(400, baseWidthRaw)

    const texture = sharedMaterial!.map
    let aspect = 2
    if (texture && texture.image) {
      const img = texture.image as HTMLImageElement
      if (img.width && img.height) {
        aspect = img.width / img.height
      }
    }

    const currentScale = config.s + (config.s * 3 * p)
    const targetWidth = baseWidth * currentScale
    const targetHeight = targetWidth / aspect

    sprite.scale.set(targetWidth, targetHeight, 1)
  })
}

function forceRender() {
  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }
}

// Re-render when scrolling instead of requestAnimationFrame loop to spare GPU
watch(() => props.progress, () => {
  if (clouds.length > 0) {
    updateClouds()
    forceRender()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)

  clouds.forEach(sprite => {
    sprite.geometry.dispose()
  })
  clouds.length = 0

  if (sharedMaterial) {
    if (sharedMaterial.map) sharedMaterial.map.dispose()
    sharedMaterial.dispose()
  }

  if (renderer) renderer.dispose()

  scene = null
  camera = null
  renderer = null
  sharedMaterial = null
})
</script>

<template>
  <div class="cloud-container" v-show="props.progress > 0.01 && props.aboutProgress < 0.99">
    <canvas ref="canvasRef" class="cloud-canvas"></canvas>
  </div>
</template>

<style scoped>
.cloud-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 50;
  overflow: hidden;
}

.cloud-canvas {
  width: 100vw;
  height: 100dvh;
  display: block;
  pointer-events: none;
}
</style>