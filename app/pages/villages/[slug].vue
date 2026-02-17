<script setup lang="ts">
import { useSeoMeta, useRoute, useRouter, createError } from 'nuxt/app'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const rawSlug = route.params.slug
console.log('[slug] route.params:', JSON.stringify(route.params))
console.log('[slug] rawSlug type:', typeof rawSlug, 'value:', JSON.stringify(rawSlug))

function extractSlug(param: unknown): string {
    if (typeof param === 'string') return param
    if (Array.isArray(param)) return param[0] ?? ''
    if (param && typeof param === 'object' && 'slug' in param) return String((param as Record<string, unknown>).slug)
    return String(param ?? '')
}

const slug = extractSlug(rawSlug)

const { fetchVillageBySlug } = useApi()
const { data: village, error } = await fetchVillageBySlug(slug)

if (error.value || !village.value) {
    throw createError({
        statusCode: 404,
        statusMessage: 'Village not found',
        fatal: true
    })
}

// SEO
useSeoMeta({
    title: `${village.value.name} — ${village.value.city_name} | ${t('seo.villageSuffix')}`,
    description: village.value.description?.slice(0, 160) ?? '',
    ogTitle: `${village.value.name} — ${village.value.city_name}`,
    ogDescription: village.value.description?.slice(0, 160) ?? '',
    ogType: 'article',
    ogImage: village.value.gallery?.[0]?.image ?? ''
})

const localePath = useLocalePath()

function goBack(): void {
    if (window.history.length > 1) {
        router.back()
    } else {
        navigateTo(localePath('/'), { replace: true })
    }
}
</script>

<template>
    <div v-if="village" class="village-page">
        <!-- Texture Overlays -->
        <div class="grain-overlay" />
        <div class="vignette-overlay" />

        <!-- Back Navigation -->
        <nav class="village-page__nav">
            <a href="#" class="village-page__back" @click.prevent="goBack">
                <span class="village-page__back-arrow">←</span>
                <span class="village-page__back-text">{{ $t('village.backToExplore') }}</span>
            </a>
        </nav>

        <!-- Sections -->
        <VillageHero :city-name="village.city_name" :village-name="village.name"
            :hero-image="village.image?.original ?? ''" />

        <VillageDescription :subtitle="village.short_description"
            :paragraphs="village.description ? [village.description] : []" />

        <VillageGallery :images="village.gallery.map(g => ({ id: g.id, src: g.image.original, alt: g.name }))" />

        <VillageComments :comments="village.comments.map(c => ({
            id: c.id,
            text: c.comment,
            authorName: c.full_name,
            authorRole: c.who,
            authorInitials: c.full_name.split(' ').map(w => w[0]).join('').toUpperCase()
        }))" />

        <ClientOnly>
            <VillageMap :lat="village.latitude ? parseFloat(village.latitude) : 0"
                :lng="village.longitude ? parseFloat(village.longitude) : 0" :zoom="13" :village-name="village.name" />
        </ClientOnly>

        <AppFooter />
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
