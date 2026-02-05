<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    progress: number // 0 to 1
}

const props = defineProps<Props>()

// Generate cloud positions for all edges
// Each cloud will move from its starting edge position toward the center
const cloudConfigs = [
    // Top row
    { id: 1, startX: -50, startY: -60, scale: 1.8, rotation: 0 },
    { id: 2, startX: 0, startY: -55, scale: 2.0, rotation: 15 },
    { id: 3, startX: 50, startY: -60, scale: 1.6, rotation: -10 },
    // Bottom row
    { id: 4, startX: -50, startY: 60, scale: 1.9, rotation: 180 },
    { id: 5, startX: 0, startY: 55, scale: 2.2, rotation: 170 },
    { id: 6, startX: 50, startY: 60, scale: 1.7, rotation: 190 },
    // Left column
    { id: 7, startX: -60, startY: -25, scale: 1.5, rotation: 90 },
    { id: 8, startX: -55, startY: 25, scale: 1.8, rotation: 85 },
    // Right column
    { id: 9, startX: 60, startY: -25, scale: 1.6, rotation: -90 },
    { id: 10, startX: 55, startY: 25, scale: 1.9, rotation: -85 },
    // Corner extras for full coverage
    { id: 11, startX: -45, startY: -45, scale: 1.4, rotation: 45 },
    { id: 12, startX: 45, startY: -45, scale: 1.5, rotation: -45 },
    { id: 13, startX: -45, startY: 45, scale: 1.3, rotation: 135 },
    { id: 14, startX: 45, startY: 45, scale: 1.6, rotation: -135 },
    // Center fill clouds (appear later)
    { id: 15, startX: -20, startY: -30, scale: 1.2, rotation: 20 },
    { id: 16, startX: 20, startY: -30, scale: 1.3, rotation: -20 },
    { id: 17, startX: -20, startY: 30, scale: 1.1, rotation: 160 },
    { id: 18, startX: 20, startY: 30, scale: 1.4, rotation: -160 },
    { id: 19, startX: 0, startY: 0, scale: 2.5, rotation: 0 },
]

const clouds = computed(() => {
    return cloudConfigs.map((config) => {
        const progress = props.progress

        // Move toward center based on progress
        // Edge clouds move faster than center clouds
        const distanceFromCenter = Math.sqrt(config.startX ** 2 + config.startY ** 2)
        const moveSpeed = distanceFromCenter > 40 ? 0.7 : 0.4

        const currentX = config.startX * (1 - progress * moveSpeed)
        const currentY = config.startY * (1 - progress * moveSpeed)

        // Scale up as they move in
        const currentScale = config.scale * (1 + progress * 0.5)

        // Opacity: edge clouds appear first, center clouds later
        const startAppear = distanceFromCenter > 40 ? 0 : 0.3
        const opacity = progress > startAppear
            ? Math.min(1, (progress - startAppear) / 0.4)
            : 0

        return {
            id: config.id,
            x: currentX,
            y: currentY,
            scale: currentScale,
            rotation: config.rotation,
            opacity,
        }
    })
})

// Overall container opacity
const containerOpacity = computed(() => {
    return props.progress > 0 ? Math.min(1, props.progress * 2) : 0
})
</script>

<template>
    <div class="cloud-overlay" :style="{ opacity: containerOpacity }">
        <img v-for="cloud in clouds" :key="cloud.id" src="/images/cloud10.png" alt="" class="cloud-sprite" :style="{
            transform: `translate(-50%, -50%) translate(${cloud.x}vw, ${cloud.y}vh) scale(${cloud.scale}) rotate(${cloud.rotation}deg)`,
            opacity: cloud.opacity,
        }">
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
}

.cloud-sprite {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 40vw;
    min-width: 300px;
    height: auto;
    will-change: transform, opacity;
    filter: blur(2px);
    transition: transform 0.1s ease-out, opacity 0.1s ease-out;
}
</style>
