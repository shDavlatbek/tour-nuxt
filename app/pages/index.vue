<script setup lang="ts">
import { watch, ref, onMounted, onUnmounted } from 'vue'
import { useSeoMeta } from 'nuxt/app'
import { useScrollTransition } from '../composables/useScrollTransition'

// Import image for CityHead section
import registanBackground from '~/assets/images/registan.jpg'

useSeoMeta({
    title: 'Uzbekistan Tourism - Hidden Gems',
    description: 'Discover the hidden gems of Uzbekistan. Explore tourism villages across the country through our interactive 3D map.',
    ogTitle: 'Uzbekistan Tourism - Hidden Gems',
    ogDescription: 'Discover the hidden gems of Uzbekistan. Explore tourism villages across the country through our interactive 3D map.',
    ogType: 'website',
})

// Virtual scroll transition state (Hero → About only)
const { scrollProgress, isFrozen, zoomProgress, cloudProgress, aboutProgress, isNativeScrollEnabled, setMapZoomed, reset } = useScrollTransition()

// Handle zoom state change from HeroSection
function handleMapZoomChange(zoomed: boolean) {
    setMapZoomed(zoomed)
}

// Track if we should return to virtual scroll
const shouldReturnToVirtual = ref(false)

// Handle scroll in native mode - detect when user wants to go back
function handleNativeScroll() {
    if (!isNativeScrollEnabled.value) return

    const scrollTop = window.scrollY || document.documentElement.scrollTop

    // If at the very top and user previously scrolled, allow going back
    if (scrollTop <= 0) {
        shouldReturnToVirtual.value = true
    } else {
        shouldReturnToVirtual.value = false
    }
}

// Handle wheel in native mode to detect scroll up at top
function handleWheelAtTop(e: WheelEvent) {
    if (!isNativeScrollEnabled.value) return

    const scrollTop = window.scrollY || document.documentElement.scrollTop

    // If at top and trying to scroll up, return to virtual scroll
    if (scrollTop <= 0 && e.deltaY < 0) {
        e.preventDefault()
        reset() // Reset virtual scroll to go back to beginning
    }
}

onMounted(() => {
    if (typeof window === 'undefined') return
    window.addEventListener('scroll', handleNativeScroll, { passive: true })
    window.addEventListener('wheel', handleWheelAtTop, { passive: false })
})

onUnmounted(() => {
    if (typeof window === 'undefined') return
    window.removeEventListener('scroll', handleNativeScroll)
    window.removeEventListener('wheel', handleWheelAtTop)
})

// When switching to native scroll, scroll to top
watch(isNativeScrollEnabled, (enabled) => {
    if (enabled && typeof window !== 'undefined') {
        // Small delay to let DOM update
        setTimeout(() => {
            window.scrollTo(0, 0)
        }, 50)
    }
})
</script>

<template>
    <!-- Virtual scroll mode: fixed viewport (stays mounted, toggles visibility) -->
    <div class="virtual-scroll-page" :class="{ 'is-active': !isNativeScrollEnabled }">
        <!-- Texture Overlays -->
        <div class="grain-overlay" />
        <div class="vignette-overlay" />

        <!-- Hero Section -->
        <HeroSection :frozen="isFrozen" :zoom-progress="zoomProgress" :hidden="aboutProgress > 0.9"
            @zoom-change="handleMapZoomChange" />

        <!-- Cloud Overlay - appears during scroll -->
        <ClientOnly>
            <CloudOverlay :progress="cloudProgress" :about-progress="aboutProgress" />
        </ClientOnly>

        <!-- About Section - slides up -->
        <ClientOnly>
            <AboutSection :progress="aboutProgress"
                background-image="https://uzbekistan.travel/storage/app/media/uploaded-files/samarkand-uzbekistan-kupol-mechet-ploshchad.png" />
        </ClientOnly>

        <!-- Visual Scroll Indicator -->
        <div class="scroll-indicator">
            <div class="scroll-track">
                <div class="scroll-thumb" :style="{ height: `${Math.max(20, scrollProgress * 100)}%` }" />
            </div>
        </div>
    </div>

    <!-- Native scroll mode: normal scrollable page (stays mounted, toggles visibility) -->
    <div class="native-scroll-page" :class="{ 'is-active': isNativeScrollEnabled }">
        <!-- About Section at top (full height) -->
        <section class="about-section-container">
            <AboutSection :progress="1"
                background-image="https://uzbekistan.travel/storage/app/media/uploaded-files/samarkand-uzbekistan-kupol-mechet-ploshchad.png" />
        </section>

        <!-- CityHead below About -->
        <CityHead city-name="SAMARKAND" :background-image="registanBackground" />

        <!-- Scroll up hint -->
        <div class="scroll-hint" :class="{ 'scroll-hint--visible': shouldReturnToVirtual }">
            ↑ Scroll up to go back to map
        </div>
    </div>
</template>

<style scoped>
/* Virtual scroll mode - fixed viewport */
.virtual-scroll-page {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
    /* Visibility toggle */
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity 0.3s ease, visibility 0.3s ease;
}

.virtual-scroll-page.is-active {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
}

/* Native scroll mode - normal page flow */
.native-scroll-page {
    min-height: 100vh;
    /* Visibility toggle - hidden by default */
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity 0.3s ease, visibility 0.3s ease;
}

.native-scroll-page.is-active {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
}

/* About section container - full viewport height */
.about-section-container {
    position: relative;
    height: 100vh;
    height: 100dvh;
}

/* Override AboutSection's fixed positioning in native mode */
.about-section-container :deep(.about-section) {
    position: relative !important;
    transform: none !important;
    visibility: visible !important;
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

/* Scroll hint for returning to virtual scroll */
.scroll-hint {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 10px 20px;
    border-radius: 20px;
    font-size: 0.9rem;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
    z-index: 100;
}

.scroll-hint--visible {
    opacity: 1;
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
