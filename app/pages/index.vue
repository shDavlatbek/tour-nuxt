<script setup lang="ts">
import { watch, computed } from 'vue'
import { useSeoMeta } from 'nuxt/app'
import { useScrollTransition } from '../composables/useScrollTransition'
import { useScrollableSection } from '../composables/useScrollableSection'

// Import image for CityHead section
import registanBackground from '~/assets/images/registan.jpg'

useSeoMeta({
    title: 'Uzbekistan Tourism - Hidden Gems',
    description: 'Discover the hidden gems of Uzbekistan. Explore tourism villages across the country through our interactive 3D map.',
    ogTitle: 'Uzbekistan Tourism - Hidden Gems',
    ogDescription: 'Discover the hidden gems of Uzbekistan. Explore tourism villages across the country through our interactive 3D map.',
    ogType: 'website',
})

// --- 1. SETUP ENGINE ---
const {
    scrollProgress,
    setMaxScroll,
    createPhase,
    setMapZoomed
} = useScrollTransition({
    initialMaxScroll: 2.0,
    pins: [
        { position: 1.0, duration: 500 } // Brief pause at About section complete
    ]
})

// --- 2. DEFINE SECTION PHASES (All dynamic via createPhase!) ---
// Hero + About fixed animations (0 to 1.0)
const isFrozen = computed(() => scrollProgress.value > 0.05)
const zoomProgress = createPhase(0, 0.5)        // 0 → 0.5 = Hero zoom
const cloudProgress = createPhase(0.15, 0.7)    // 0.15 → 0.7 = Cloud overlay
const aboutProgress = createPhase(0.5, 1.0)     // 0.5 → 1.0 = About section enters

// About section scrolls OUT as CityHead comes in (continues past 1.0)
// Use same speed as CityHead: sensitivity 0.001 means 1.0 unit = 1000px
// For percentage-based movement: 1.0 unit = 100% of viewport
// Since CityHead moves at 1000px per 1.0 unit, About should move at ~100vh per 1.0 unit
const aboutScrollOut = computed(() => {
    if (scrollProgress.value <= 1.0) return 0
    // After 1.0, scroll About up at same speed as CityHead
    // 1.0 virtual unit = 100% viewport movement to match
    const progressPastAbout = scrollProgress.value - 1.0
    return progressPastAbout * (1000 / window.innerHeight) * 100 // convert to percentage matching pixel speed
})

// Handle zoom state change from HeroSection
function handleMapZoomChange(zoomed: boolean) {
    setMapZoomed(zoomed)
}

// --- 3. DYNAMIC SECTIONS ---

// CityHead starts at 1.0 (after About section)
const CITYHEAD_START = 1.0
const {
    elementRef: cityHeadRef,
    sectionStyle: cityHeadStyle,
    virtualLength: cityHeadLength
} = useScrollableSection({
    scrollProgress,
    startAt: CITYHEAD_START
})

// --- 4. UPDATE TOTAL SCROLL LENGTH ---
watch(cityHeadLength, () => {
    const total = CITYHEAD_START + cityHeadLength.value
    setMaxScroll(total)
}, { immediate: true })

// Scroll indicator percentage
const scrollPercentage = createPhase(0, 1.0)
</script>

<template>
    <div class="virtual-viewport">
        <!-- Texture Overlays -->
        <div class="grain-overlay" />
        <div class="vignette-overlay" />

        <!-- Fixed Layer: Hero + About (animated by scroll progress) -->
        <div class="fixed-layer">
            <!-- Hero Section -->
            <HeroSection :frozen="isFrozen" :zoom-progress="zoomProgress" :hidden="aboutProgress > 0.9"
                @zoom-change="handleMapZoomChange" />

            <!-- Cloud Overlay - appears during scroll -->
            <ClientOnly>
                <CloudOverlay :progress="cloudProgress" :about-progress="aboutProgress" />
            </ClientOnly>

            <!-- About Section - slides up and then scrolls out -->
            <ClientOnly>
                <AboutSection :progress="aboutProgress" :scroll-out="aboutScrollOut"
                    background-image="https://uzbekistan.travel/storage/app/media/uploaded-files/samarkand-uzbekistan-kupol-mechet-ploshchad.png" />
            </ClientOnly>
        </div>

        <!-- Scroll Layer: CityHead (transform-based movement) -->
        <div ref="cityHeadRef" class="scroll-layer" :style="cityHeadStyle">
            <CityHead city-name="SAMARKAND" :background-image="registanBackground" />
        </div>

        <!-- Visual Scroll Indicator -->
        <div class="scroll-indicator">
            <div class="scroll-track">
                <div class="scroll-thumb" :style="{ height: `${Math.max(20, scrollPercentage * 100)}%` }" />
            </div>
        </div>

        <!-- Debug (remove in production) -->
        <div class="debug">{{ scrollProgress.toFixed(2) }} / {{ (CITYHEAD_START + cityHeadLength).toFixed(2) }}</div>
    </div>
</template>

<style scoped>
/* Virtual viewport - full screen fixed container */
.virtual-viewport {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
}

/* Fixed layer for Hero and About animations */
.fixed-layer {
    position: absolute;
    inset: 0;
    z-index: 1;
}

/* Scroll layer - positioned below fold, moves up via transform */
.scroll-layer {
    position: absolute;
    top: 100vh;
    left: 0;
    width: 100%;
    min-height: 100vh;
    z-index: 10;
}

/* Visual scroll indicator */
.scroll-indicator {
    position: fixed;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 200;
    pointer-events: none;
}

.scroll-track {
    width: 4px;
    height: 80px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    overflow: hidden;
}

.scroll-thumb {
    width: 100%;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 2px;
    transition: height 0.15s ease-out;
    min-height: 16px;
}

/* Debug display */
.debug {
    position: fixed;
    bottom: 10px;
    right: 10px;
    z-index: 999;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 12px;
}

@media (max-width: 768px) {
    .scroll-indicator {
        right: 8px;
    }

    .scroll-track {
        height: 60px;
    }
}
</style>
