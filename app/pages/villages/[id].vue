<script setup lang="ts">
import { useSeoMeta, useRoute, useRouter, createError } from 'nuxt/app'
import { getVillageById } from '~/data/villages'

const route = useRoute()
const router = useRouter()
const villageId = route.params.id as string

const village = getVillageById(villageId)

if (!village) {
    throw createError({
        statusCode: 404,
        statusMessage: 'Village not found',
        fatal: true
    })
}

// SEO
useSeoMeta({
    title: `${village.villageName} — ${village.cityName} | Uzbekistan Tourism`,
    description: village.description.paragraphs[0]?.slice(0, 160) ?? '',
    ogTitle: `${village.villageName} — ${village.cityName}`,
    ogDescription: village.description.paragraphs[0]?.slice(0, 160) ?? '',
    ogType: 'article',
    ogImage: village.heroImage
})

function goBack(): void {
    if (window.history.length > 1) {
        router.back()
    } else {
        router.push('/')
    }
}
</script>

<template>
    <div class="village-page">
        <!-- Texture Overlays -->
        <div class="grain-overlay" />
        <div class="vignette-overlay" />

        <!-- Back Navigation -->
        <nav class="village-page__nav">
            <a href="#" class="village-page__back" @click.prevent="goBack">
                <span class="village-page__back-arrow">←</span>
                <span class="village-page__back-text">Back to Explore</span>
            </a>
        </nav>

        <!-- Sections -->
        <VillageHero :city-name="village.cityName" :village-name="village.villageName"
            :hero-image="village.heroImage" />

        <VillageDescription :subtitle="village.description.subtitle" :paragraphs="village.description.paragraphs" />

        <VillageGallery :images="village.gallery" />

        <VillageComments :comments="village.comments" />

        <ClientOnly>
            <VillageMap :lat="village.location.lat" :lng="village.location.lng" :zoom="village.location.zoom"
                :village-name="village.villageName" />
        </ClientOnly>
    </div>
</template>

<style scoped>
.village-page {
    background-color: #f5f0e6;
    min-height: 100vh;
    position: relative;
}

/* Back Navigation */
.village-page__nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    padding: 1.25rem 2rem;
    background: linear-gradient(180deg, rgba(245, 240, 230, 0.95) 0%, rgba(245, 240, 230, 0) 100%);
    pointer-events: none;
}

.village-page__back {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    color: #8c6b4a;
    font-family: var(--font-primary);
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    pointer-events: auto;
    transition: color 0.2s ease;
}

.village-page__back:hover {
    color: #c85a2a;
}

.village-page__back-arrow {
    font-size: 1.2rem;
    transition: transform 0.2s ease;
}

.village-page__back:hover .village-page__back-arrow {
    transform: translateX(-3px);
}

/* Responsive */
@media (max-width: 768px) {
    .village-page__nav {
        padding: 1rem;
    }

    .village-page__back-text {
        font-size: 0.75rem;
    }
}
</style>
