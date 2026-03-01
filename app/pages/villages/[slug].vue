<script setup lang="ts">
import { useSeoMeta, useRoute, createError } from 'nuxt/app'

const { t } = useI18n()
const route = useRoute()
const rawSlug = route.params.slug

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
    description: village.value.description?.slice(0, 160) ?? village.value.short_description ?? '',
    keywords: village.value.seo_tags?.join(', ') ?? '',
    ogTitle: `${village.value.name} — ${village.value.city_name}`,
    ogDescription: village.value.description?.slice(0, 160) ?? village.value.short_description ?? '',
    ogType: 'article',
    ogImage: village.value.image?.optimized ?? village.value.gallery?.[0]?.image ?? ''
})

const localePath = useLocalePath()
</script>

<template>
    <div v-if="village" class="village-page">
        <!-- Texture Overlays -->
        <div class="grain-overlay" />
        <div class="vignette-overlay" />

        <!-- Sections -->
        <VillageHero :city-name="village.city_name" :village-name="village.name"
            :hero-image="village.image?.optimized ?? '/images/placehold.webp'" />

        <VillageDescription :subtitle="village.short_description"
            :paragraphs="village.description ? [village.description] : []" />

        <div v-if="village.activities && village.activities.length" class="village-activities">
            <div class="village-activities__container">
                <h3 class="village-activities__title">{{ $t('village.activities.title') }}</h3>
                <div class="village-activities__list">
                    <span v-for="(activity, index) in village.activities" :key="index"
                        class="village-activities__badge">
                        {{ activity }}
                    </span>
                </div>
            </div>
        </div>

        <VillageGallery :images="village.gallery.map(g => ({ id: g.id, src: g.image.optimized, alt: g.name }))" />

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
    padding-top: 80px;
}

.village-activities {
    background-color: #f5f0e6;
    padding: 0 2rem 4rem;
}

.village-activities__container {
    max-width: 1000px;
    margin: 0 auto;
    text-align: left;
    /* small left side */
}

.village-activities__title {
    font-family: var(--font-primary);
    font-size: 1.4rem;
    font-weight: 600;
    color: #8c6b4a;
    margin-bottom: 1.5rem;
}

.village-activities__list {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
}

.village-activities__badge {
    display: inline-block;
    font-family: var(--font-primary);
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: #8c6b4a;
    border: 1px solid rgba(140, 107, 74, 0.2);
    padding: 0.75rem 1.75rem;
    border-radius: 50px;
    background: rgba(140, 107, 74, 0.05);
}
</style>
