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

// Scroll transition state - only use on client
const { scrollProgress, isFrozen, cloudProgress, aboutProgress } = useScrollTransition()
</script>

<template>
    <div class="page-container">
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
</template>

<style scoped>
.page-container {
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
}
</style>
