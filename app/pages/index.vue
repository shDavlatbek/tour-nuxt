<script setup lang="ts">
import { useSeoMeta } from 'nuxt/app';

useSeoMeta({
    title: 'Uzbekistan Tourism - Hidden Gems',
    description: 'Discover the hidden gems of Uzbekistan. Explore tourism villages across the country through our interactive 3D map.',
    ogTitle: 'Uzbekistan Tourism - Hidden Gems',
    ogDescription: 'Discover the hidden gems of Uzbekistan. Explore tourism villages across the country through our interactive 3D map.',
    ogType: 'website',
})
</script>

<template>
    <div>
        <!-- Texture Overlays -->
        <div class="grain-overlay" />
        <div class="vignette-overlay" />

        <!-- Hero Section -->
        <HeroSection />
    </div>
</template>
