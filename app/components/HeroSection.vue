<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import { useMap } from '../composables/useMap'

interface Props {
    frozen?: boolean
    zoomProgress?: number
    hidden?: boolean // Hide canvas when About section is visible
}

const props = withDefaults(defineProps<Props>(), {
    frozen: false,
    zoomProgress: 0,
    hidden: false,
})

const { state, init, dispose, zoomOut, freeze, unfreeze, setScrollZoom, pause, resume } = useMap()

const mapContainer = ref<HTMLElement | null>(null)
const showZoomVignette = ref(false)
const hasInteracted = ref(false)
const showClickHint = ref(false)

// Pause/resume map based on hidden prop (for performance when About section is visible)
watch(
    () => props.hidden,
    (isHidden) => {
        if (isHidden) {
            pause()
        } else {
            resume()
        }
    }
)

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

// Hide mouse hint after first interaction, then show click hint
function handleFirstInteraction() {
    if (!hasInteracted.value && !state.value.isLoading) {
        // Delay hiding mouse hint by 1.5 seconds
        setTimeout(() => {
            hasInteracted.value = true
            // Show click hint after mouse hint fades out
            setTimeout(() => {
                showClickHint.value = true
            }, 400) // Wait for mouse hint fade out
        }, 1500)
        window.removeEventListener('mousemove', handleFirstInteraction)
        window.removeEventListener('touchstart', handleFirstInteraction)
    }
}

const emit = defineEmits<{
    (e: 'zoom-change', zoomed: boolean): void
}>()

// Watch zoom state for vignette and click hint
watch(
    () => state.value.isZoomed,
    (isZoomed) => {
        // Emit zoom change to parent
        emit('zoom-change', isZoomed)

        if (isZoomed) {
            // Hide click hint when user zooms in (they clicked a city)
            showClickHint.value = false
            setTimeout(() => {
                showZoomVignette.value = true
            }, 600)
        } else {
            showZoomVignette.value = false
        }
    }
)

// Watch frozen prop to freeze/unfreeze map
watch(
    () => props.frozen,
    (isFrozen) => {
        if (isFrozen) {
            freeze()
        } else {
            unfreeze()
        }
    }
)

// Watch zoomProgress to zoom camera in/out
watch(
    () => props.zoomProgress,
    (progress) => {
        setScrollZoom(progress)
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

        <!-- Mouse Hint with Figure-8 Animation -->
        <div class="hero__mouse-hint"
            :class="{ 'hero__mouse-hint--hidden': state.isZoomed || state.isLoading || hasInteracted || props.frozen }">
            <div class="hero__mouse-hint-y">
                <div class="hero__mouse-hint-x">
                    <div class="hero__mouse-hint-icon">
                        <svg width="32" height="48" viewBox="0 0 32 48" fill="none">
                            <rect x="2" y="2" width="28" height="44" rx="14" stroke="currentColor" stroke-width="2.5" />
                            <circle cx="16" cy="14" r="4" fill="currentColor" />
                        </svg>
                    </div>
                </div>
            </div>
            <span class="hero__mouse-hint-text">Move mouse to explore</span>
        </div>

        <!-- Click City Hint -->
        <ClientOnly>
            <div class="hero__click-hint"
                :class="{ 'hero__click-hint--visible': showClickHint && !state.isZoomed && !props.frozen }">
                <div class="hero__click-hint-icon">
                    <svg class="hero__click-hint-marker" width="32" height="32" viewBox="0 0 48 48" fill="none">
                        <circle cx="24" cy="24" r="18" stroke="currentColor" stroke-width="2" opacity="0.5" />
                        <circle cx="24" cy="24" r="8" fill="currentColor" />
                    </svg>
                    <svg class="hero__click-hint-cursor" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M4 2L4 18L8 14L12 22L16 20L12 12L18 12L4 2Z" fill="currentColor"
                            stroke="rgba(0,0,0,0.3)" stroke-width="1" stroke-linejoin="round" />
                    </svg>
                </div>
                <span class="hero__click-hint-text">Click a city to explore</span>
            </div>
        </ClientOnly>

        <!-- UI Layer -->
        <div class="hero__ui-layer">
            <div class="hero__header">
                <h1 class="hero__title">Tourism Villages</h1>
                <p class="hero__subtitle">in UZBEKISTAN</p>
            </div>
        </div>
    </section>
</template>
