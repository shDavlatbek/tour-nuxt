<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
// 1. Import 'Timeline' directly for V4
import { Timeline } from 'animejs'

interface Props {
  progress: number // 0 to 1
  aboutProgress: number
}

const props = defineProps<Props>()
const containerRef = ref<HTMLElement | null>(null)

// Define the timeline variable. 
// V4 types might be tricky in beta, so we can use 'any' or the specific class if available.
let tl: any = null

const CLOUD_CONFIGS = [
  { id: 1, sx: -60, sy: 0, s: 2.5 },
  { id: 2, sx: 60, sy: 0, s: 2.5 },
  { id: 3, sx: 0, sy: -60, s: 2.5 },
  { id: 4, sx: 0, sy: 60, s: 2.5 },
  { id: 5, sx: -50, sy: -50, s: 2.0 },
  { id: 6, sx: 50, sy: -50, s: 2.0 },
  { id: 7, sx: -50, sy: 50, s: 2.0 },
  { id: 8, sx: 50, sy: 50, s: 2.0 },
]

onMounted(() => {
  if (!containerRef.value) return

  // 2. Initialize V4 Timeline (Use 'new Timeline')
  tl = new Timeline({
    autoplay: false,
    duration: 1000,
  })

  CLOUD_CONFIGS.forEach((cloud, index) => {
    // Get the specific image element
    const target = containerRef.value?.children[index]
    
    if (target) {
      // 3. V4 Syntax: .add(target, params, offset)
      tl.add(target, {
        // Translate view-width (vw) to approximate pixels or use string units if supported
        // V4 handles string units cleanly
        translateX: [
            { to: `${cloud.sx}vw`, duration: 0 }, 
            { to: `${cloud.sx * 0.4}vw`, duration: 1000 }
        ],
        translateY: [
            { to: `${cloud.sy}vh`, duration: 0 },
            { to: `${cloud.sy * 0.4}vh`, duration: 1000 }
        ],
        scale: [
            { to: cloud.s, duration: 0 },
            { to: cloud.s * 1.3, duration: 1000 }
        ],
        opacity: { to: 1.5, duration: 1000 }, 
      }, 0) // '0' is the offset (start at time 0)
    }
  })
})

watch(() => props.progress, (newVal) => {
  if (tl) {
    // 4. Scrub the timeline (0 to 1000ms)
    // In V4, .seek() might need milliseconds directly
    tl.seek(newVal * 1000)
  }
})
</script>

<template>
  <div ref="containerRef" class="cloud-container" v-show="props.aboutProgress < 1">
    <img v-for="cloud in CLOUD_CONFIGS" :key="cloud.id" src="/images/cloudsh.png" class="cloud-sprite" />
  </div>
</template>

<style scoped>
/* Same styles as before */
.cloud-container {
  position: fixed; inset: 0; pointer-events: none; z-index: 50; overflow: hidden;
}
.cloud-sprite {
  position: absolute;
  top: 50%; left: 50%;
  width: 50vw; min-width: 400px;
  /* Anime.js handles the transforms, just center the origin */
  transform: translate(-50%, -50%); 
}
</style>