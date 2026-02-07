<script setup lang="ts">
import { useSeoMeta } from 'nuxt/app'
import { useScrollTransition } from '../composables/useScrollTransition'

useSeoMeta({
    title: 'Uzbekistan Tourism - Hidden Gems',
    description: 'Discover the hidden gems of Uzbekistan. Explore tourism villages across the country through our interactive 3D map.',
    ogTitle: 'Uzbekistan Tourism - Hidden Gems',
    ogDescription: 'Discover the hidden gems of Uzbekistan. Explore tourism villages across the country through our interactive 3D map.',
    ogType: 'website',
})

// Virtual scroll transition state
const { scrollProgress, isFrozen, zoomProgress, cloudProgress, aboutProgress, cityHeadProgress, setMapZoomed } = useScrollTransition()

// Handle zoom state change from HeroSection
function handleMapZoomChange(zoomed: boolean) {
    setMapZoomed(zoomed)
}
</script>

<template>
    <!-- Fixed viewport - no native scroll, uses virtual scroll -->
    <div class="virtual-scroll-page">
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

        <!-- CityHead Section - layered depth typography -->
        <ClientOnly>
            <CityHead :progress="cityHeadProgress" city-name="SAMARKAND" background-image="~/assets/images/registan.jpg"
                foreground-image="~/assets/images/registan-silhouette.png" />
        </ClientOnly>

        <!-- Visual Scroll Indicator -->
        <div v-if="cityHeadProgress < 0.95" class="scroll-indicator">
            <div class="scroll-track">
                <div class="scroll-thumb" :style="{ height: `${Math.max(20, (scrollProgress / 2) * 100)}%` }" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.virtual-scroll-page {
    /* Use dvh for mobile dynamic viewport height */
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    height: 100dvh;
    /* Fallback for browsers that support dvh */
    overflow: hidden;
}

/* Visual scroll indicator on right side */
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

@media (max-width: 768px) {
    .scroll-indicator {
        right: 8px;
    }

    .scroll-track {
        height: 60px;
    }
}
</style>
