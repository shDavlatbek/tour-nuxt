<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import type { VillageList } from '~/types/village'

interface Props {
    villages: VillageList[]
    cityName: string
}

const props = defineProps<Props>()

// --- Refs for Positioning ---
// We store card refs here — NuxtLink components, so we extract $el
const cardRefs = ref<any[]>([])

// Helper: get DOM element from ref (handles both component instances and elements)
function getEl(refItem: any): HTMLElement | null {
    if (!refItem) return null
    if (refItem.$el) return refItem.$el as HTMLElement
    if (refItem instanceof HTMLElement) return refItem
    return null
}


// --- Intersection Observer for Cards ---
const visibleVillages = ref(new Set<number>())
let observer: IntersectionObserver | null = null
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }



// --- Lifecycle ---
onMounted(() => {
    // Intersection Observer for cards
    observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const id = Number((entry.target as HTMLElement).dataset.id)
                if (!isNaN(id)) {
                    visibleVillages.value.add(id)
                    observer?.unobserve(entry.target)
                }
            }
        })
    }, observerOptions)

    cardRefs.value.forEach((item) => {
        const el = getEl(item)
        if (el) observer?.observe(el)
    })
})

onUnmounted(() => {
    observer?.disconnect()
})
</script>

<template>
    <section class="villages-section">


        <header class="villages-header">
            <h2 class="villages-title">{{ props.cityName }}</h2>
            <div class="decorative-star">✦</div>
            <p class="villages-subtitle">
                {{ $t('cityVillages.headerSubtitle') }}
            </p>
            <div class="separator-line"></div>
        </header>

        <div v-if="props.villages.length > 0" class="villages-grid">
            <NuxtLink v-for="(village, index) in props.villages" :key="village.id"
                :to="$localePath({ name: 'villages-slug', params: { slug: village.slug } })" ref="cardRefs"
                class="village-card" :class="{ 'is-visible': visibleVillages.has(village.id) }" :data-id="village.id"
                :style="{ transitionDelay: `${index * 100}ms` }">
                <div class="card-image-wrapper">
                    <img :src="village.image?.original" :alt="village.name" class="card-image" loading="lazy" />
                    <div class="card-border"></div>
                </div>
                <div class="card-content">
                    <div class="card-divider"></div>
                    <h3 class="card-title">{{ village.name }}</h3>
                    <p class="card-subtitle">{{ village.short_description }}</p>
                </div>
            </NuxtLink>
        </div>

        <div v-else class="no-data-message">
            <p>{{ $t('cityVillages.noVillages') }}</p>
        </div>
    </section>
</template>

<style scoped>
.villages-section {
    padding: 6rem 2rem;
    background-color: #f5f0e6;
    color: #4a3b32;
    text-align: center;
    /* min-height: 100vh; */
    position: relative;
}

/* ===== Header & Grid (Unchanged mostly) ===== */
.villages-header {
    margin-bottom: 5rem;
    position: relative;
    z-index: 2;
}

/* ... existing fonts and header styles ... */
.villages-title {
    font-family: var(--font-display);
    /* fallback */
    font-size: clamp(3rem, 8vw, 6rem);
    color: #8c6b4a;
    margin: 0;
    display: inline-block;
    position: relative;
}

.decorative-star {
    position: absolute;
    top: 0;
    /* right: -2rem; */
    left: 0;
    font-size: 2rem;
    color: #d4b483;
}

.villages-subtitle {
    margin-top: 1.5rem;
    color: #6b5b4e;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
    font-family: var(--font-serif);
}

.separator-line {
    width: 2px;
    height: 60px;
    background-color: #d4b483;
    margin: 2rem auto 0;
}

/* Grid */
.villages-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 4rem;
    max-width: 1400px;
    margin: 0 auto;
    position: relative;
    z-index: 2;
}

@media (min-width: 768px) {
    .villages-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (min-width: 1200px) {
    .villages-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}

/* Cards */
.village-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    opacity: 0;
    transform: translateY(50px);
    transition: opacity 1s ease-out, transform 1s cubic-bezier(0.215, 0.61, 0.355, 1);
    text-decoration: none;
    color: inherit;
    cursor: pointer;
}

.village-card.is-visible {
    opacity: 1;
    transform: translateY(0);
}

.card-image-wrapper {
    position: relative;
    width: 100%;
    aspect-ratio: 3/4;
    max-width: 400px;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #fff;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
}

.card-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.card-border {
    position: absolute;
    inset: 0.5rem;
    border: 1px solid #e0e0e0;
    pointer-events: none;
}

.card-divider {
    width: 30px;
    height: 2px;
    background-color: #d4b483;
    margin: 0 auto 1rem;
}

.card-title {
    font-size: 1.5rem;
    letter-spacing: 0.1em;
    margin: 0 0 0.5rem;
    color: #4a3b32;
}

.card-subtitle {
    font-style: italic;
    color: #8c8c8c;
}

.no-data-message {
    text-align: center;
    padding: 2rem;
    font-family: var(--font-primary);
    font-size: 1.5rem;
    color: #8c8c8c;
    font-style: italic;
}
</style>