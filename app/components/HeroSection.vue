<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import { useMap } from '../composables/useMap'

const { state, init, dispose, zoomOut } = useMap()

const mapContainer = ref<HTMLElement | null>(null)
const showZoomVignette = ref(false)

// Initialize map on mount - use nextTick to ensure ClientOnly has rendered
onMounted(async () => {
    await nextTick()
    if (mapContainer.value) {
        init(mapContainer.value)
    }
})

// Cleanup on unmount
onUnmounted(() => {
    dispose()
})

// Watch zoom state for vignette
watch(
    () => state.value.isZoomed,
    (isZoomed) => {
        if (isZoomed) {
            setTimeout(() => {
                showZoomVignette.value = true
            }, 600)
        } else {
            showZoomVignette.value = false
        }
    }
)

function handleBackClick() {
    zoomOut()
}
</script>

<template>
    <section class="hero">
        <!-- Loading State -->
        <div class="hero__loader" :class="{ 'hero__loader--hidden': !state.isLoading }">
            Discovering Uzbekistan...
        </div>

        <!-- Three.js Canvas Container -->
        <ClientOnly>
            <div ref="mapContainer" class="hero__map-container" />
        </ClientOnly>

        <!-- Back Button -->
        <button class="hero__back-button" :class="{ 'hero__back-button--visible': state.isZoomed }"
            @click="handleBackClick">
            ← Back to Overview
        </button>

        <!-- Zoom Vignette -->
        <div class="hero__zoom-vignette" :class="{ 'hero__zoom-vignette--visible': showZoomVignette }" />

        <!-- UI Layer -->
        <div class="hero__ui-layer">
            <div class="hero__header">
                <h1 class="hero__title">Tourism Villages</h1>
                <p class="hero__subtitle">in UZBEKISTAN</p>
            </div>
        </div>
    </section>
</template>
