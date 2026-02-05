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

// Scroll transition state - uses native scroll
const { isFrozen, cloudProgress, aboutProgress } = useScrollTransition()
</script>

<template>
    <!-- Scrollable page - 200vh creates scroll room for transition -->
    <div class="scroll-page">
        <!-- Fixed content layer -->
        <div class="fixed-layer">
            <!-- Texture Overlays -->
            <div class="grain-overlay" />
            <div class="vignette-overlay" />

            <!-- Hero Section -->
            <HeroSection :frozen="isFrozen" />

            <!-- Cloud Overlay - appears during scroll -->
            <ClientOnly>
                <CloudOverlay :progress="cloudProgress" />
            </ClientOnly>

            <!-- About Section - slides up -->
            <ClientOnly>
                <AboutSection :progress="aboutProgress" />
            </ClientOnly>
        </div>
    </div>
</template>

<style scoped>
.scroll-page {
    /* Create scrollable height for the transition */
    height: 200vh;
    width: 100%;
}

.fixed-layer {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    overflow: hidden;
}
</style>
