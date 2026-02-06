<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  progress: number // 0 to 1
}

const props = defineProps<Props>()

// 1. Static config defined once (no reactivity overhead)
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

// 2. Only check visibility to prevent rendering when not needed
const isVisible = computed(() => props.progress > 0)

// 3. Pass progress purely as a CSS variable to the container
const containerStyle = computed(() => ({
  '--p': props.progress
}))
</script>

<template>
  <div v-if="isVisible" class="cloud-overlay" :style="containerStyle">
    <img 
      v-for="cloud in CLOUD_CONFIGS" 
      :key="cloud.id" 
      src="/images/cloudsh.png" 
      alt="" 
      class="cloud-sprite"
      :style="{ 
        '--sx': cloud.sx, 
        '--sy': cloud.sy, 
        '--s': cloud.s 
      }" 
    />
  </div>
</template>

<style scoped>
.cloud-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 50;
  overflow: hidden;
  /* Optimization: Isolate layout calculations */
  contain: strict; 
}

.cloud-sprite {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 50vw;
  min-width: 400px;
  height: auto;
  
  /* 5. Performance Critical: Hint browser to use GPU */
  will-change: transform, opacity;
  backface-visibility: hidden;

  /* 6. CSS MATH 
     x = startX * (1 - p * 0.6) 
     We use var(--p) which comes from props.progress
  */
  --move-factor: calc(1 - (var(--p) * 0.6));
  
  transform: 
    translate3d(
      calc(-50% + (var(--sx) * 1vw * var(--move-factor))), 
      calc(-50% + (var(--sy) * 1vh * var(--move-factor))), 
      0
    ) 
    scale(calc(var(--s) * (1 + var(--p) * 0.3)));

  /* Opacity: calc handles values > 1 automatically (clamps to 1 visually) */
  opacity: calc(var(--p) * 1.5);

  /* 7. REMOVED DROP-SHADOW 
     This filter is extremely expensive on moving elements.
     Solution: Use an image that already has a shadow baked in.
  */
  /* filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.5)); */
}
</style>