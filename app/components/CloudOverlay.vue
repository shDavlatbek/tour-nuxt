<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    progress: number // 0 to 1
}

const props = defineProps<Props>()

// Reduced to 8 clouds for better performance
const cloudConfigs = [
    // 4 edge clouds
    { id: 1, startX: -60, startY: 0, scale: 2.5 },
    { id: 2, startX: 60, startY: 0, scale: 2.5 },
    { id: 3, startX: 0, startY: -60, scale: 2.5 },
    { id: 4, startX: 0, startY: 60, scale: 2.5 },
    // 4 corner clouds
    { id: 5, startX: -50, startY: -50, scale: 2.0 },
    { id: 6, startX: 50, startY: -50, scale: 2.0 },
    { id: 7, startX: -50, startY: 50, scale: 2.0 },
    { id: 8, startX: 50, startY: 50, scale: 2.0 },
]

// Pre-calculate cloud styles to avoid reactive overhead
const clouds = computed(() => {
    const p = props.progress
    if (p === 0) return [] // Don't render when not needed

    return cloudConfigs.map((config) => {
        // Simple linear movement toward center
        const moveAmount = p * 0.6
        const x = config.startX * (1 - moveAmount)
        const y = config.startY * (1 - moveAmount)
        const scale = config.scale * (1 + p * 0.3)
        const opacity = Math.min(1, p * 1.5)

        return {
            id: config.id,
            style: {
                transform: `translate3d(calc(-50% + ${x}vw), calc(-50% + ${y}vh), 0) scale(${scale})`,
                opacity,
            }
        }
    })
})

// Show/hide entire container
const isVisible = computed(() => props.progress > 0)
</script>

<template>
    <div v-if="isVisible" class="cloud-overlay">
        <img v-for="cloud in clouds" :key="cloud.id" src="/images/cloud10.png" alt="" class="cloud-sprite"
            :style="cloud.style">
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
    contain: strict;
}

.cloud-sprite {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 50vw;
    min-width: 400px;
    height: auto;
    /* GPU acceleration without expensive blur */
    transform: translate3d(0, 0, 0);
    backface-visibility: hidden;
}
</style>
