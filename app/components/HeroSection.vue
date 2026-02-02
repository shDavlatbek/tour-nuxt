<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import { useMap } from '../composables/useMap'

const { state, init, dispose, zoomOut } = useMap()

const mapContainer = ref<HTMLElement | null>(null)
const showZoomVignette = ref(false)
const hasInteracted = ref(false)

// Initialize map on mount - use nextTick to ensure ClientOnly has rendered
onMounted(async () => {
    await nextTick()
    if (mapContainer.value) {
        init(mapContainer.value)
    }

    // Listen for mouse movement to hide hint
    window.addEventListener('mousemove', handleFirstInteraction)
    window.addEventListener('touchstart', handleFirstInteraction)
})

// Cleanup on unmount
onUnmounted(() => {
    dispose()
    window.removeEventListener('mousemove', handleFirstInteraction)
    window.removeEventListener('touchstart', handleFirstInteraction)
})

// Hide hint after first interaction
function handleFirstInteraction() {
    if (!hasInteracted.value && !state.value.isLoading) {
        hasInteracted.value = true
        window.removeEventListener('mousemove', handleFirstInteraction)
        window.removeEventListener('touchstart', handleFirstInteraction)
    }
}

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

        <!-- Mouse Hint -->
        <div class="hero__mouse-hint"
            :class="{ 'hero__mouse-hint--hidden': state.isZoomed || state.isLoading || hasInteracted }">
            <div class="hero__mouse-hint-wrapper">
                <div class="hero__mouse-hint-icon">
                    <svg width="32" height="48" viewBox="0 0 32 48" fill="none">
                        <rect x="2" y="2" width="28" height="44" rx="14" stroke="currentColor" stroke-width="2.5" />
                        <circle cx="16" cy="14" r="4" fill="currentColor" />
                    </svg>
                </div>
                <div class="hero__mouse-hint-arc">
                    <svg width="80" height="24" viewBox="0 0 80 24" fill="none">
                        <path class="hero__mouse-hint-arc-path" d="M10 12 Q40 2 70 12" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-dasharray="4 6" />
                    </svg>
                </div>
            </div>
            <span class="hero__mouse-hint-text">Move mouse to explore</span>
        </div>

        <!-- UI Layer -->
        <div class="hero__ui-layer">
            <div class="hero__header">
                <h1 class="hero__title">Tourism Villages</h1>
                <p class="hero__subtitle">in UZBEKISTAN</p>
            </div>
        </div>
    </section>
</template>
