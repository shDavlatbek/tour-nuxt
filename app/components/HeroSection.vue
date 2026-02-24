<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, nextTick, computed } from 'vue'
import { useMap } from '../composables/useMap'
import { useApi } from '../composables/useApi'
import type { VillageList } from '../types/village'

interface Props {
    frozen?: boolean
    zoomProgress?: number
    hidden?: boolean // Hide canvas when About section is visible
}

const props = withDefaults(defineProps<Props>(), {
    frozen: false,
    zoomProgress: 0,
    hidden: false,
})

const { state, init, dispose, zoomOut, freeze, unfreeze, setScrollZoom, pause, resume } = useMap()
const api = useApi()

const mapContainer = ref<HTMLElement | null>(null)
const showZoomVignette = ref(false)
const hasInteracted = ref(false)
const showClickHint = ref(false)

// Pause/resume map based on hidden prop (for performance when About section is visible)
watch(
    () => props.hidden,
    (isHidden) => {
        if (isHidden) {
            pause()
        } else {
            resume()
        }
    }
)

// Initialize map on mount - use nextTick to ensure ClientOnly has rendered
onMounted(async () => {
    await nextTick()
    if (mapContainer.value) {
        init(mapContainer.value)
    }

    // Listen for mouse movement to hide hint
    window.addEventListener('mousemove', handleFirstInteraction)
    window.addEventListener('touchstart', handleFirstInteraction)

    // Listen for global zoom out event
    window.addEventListener('app:zoomOut', zoomOut)
})

// Cleanup on unmount
onUnmounted(() => {
    dispose()
    window.removeEventListener('mousemove', handleFirstInteraction)
    window.removeEventListener('touchstart', handleFirstInteraction)
    window.removeEventListener('app:zoomOut', zoomOut)
})

// Hide mouse hint after first interaction, then show click hint
function handleFirstInteraction() {
    if (!hasInteracted.value && !state.value.isLoading) {
        // Delay hiding mouse hint by 1.5 seconds
        setTimeout(() => {
            hasInteracted.value = true
            // Show click hint after mouse hint fades out
            setTimeout(() => {
                showClickHint.value = true
            }, 400) // Wait for mouse hint fade out
        }, 1500)
        window.removeEventListener('mousemove', handleFirstInteraction)
        window.removeEventListener('touchstart', handleFirstInteraction)
    }
}

const emit = defineEmits<{
    (e: 'zoom-change', zoomed: boolean): void
}>()

// Watch zoom state for vignette and click hint
watch(
    () => state.value.isZoomed,
    (isZoomed) => {
        // Emit zoom change to parent
        emit('zoom-change', isZoomed)

        if (isZoomed) {
            // Hide click hint when user zooms in (they clicked a city)
            showClickHint.value = false
            setTimeout(() => {
                showZoomVignette.value = true
            }, 600)
        } else {
            showZoomVignette.value = false
        }
    }
)

// Watch frozen prop to freeze/unfreeze map
watch(
    () => props.frozen,
    (isFrozen) => {
        if (isFrozen) {
            freeze()
        } else {
            unfreeze()
        }
    }
)

// Watch zoomProgress to zoom camera in/out
watch(
    () => props.zoomProgress,
    (progress) => {
        setScrollZoom(progress)
    }
)

const regionSlugMap: Record<string, string> = {
    'andijan': 'andijon',
    'bukhara': 'buxoro',
    'fergana': 'fargona',
    'jizzakh': 'jizzax',
    'namangan': 'namangan',
    'navoi': 'navoiy',
    'kashkadarya': 'qashqadaryo',
    'samarkand': 'samarqand',
    'sirdaryo': 'sirdaryo',
    'surkhandarya': 'surxondaryo',
    'tashkent': 'toshkent',
    'khorezm': 'xorazm',
    'karakalpakstan': 'qoraqalpogiston'
}

const cityVillages = ref<VillageList[]>([])
const isLoadingVillages = ref(false)
const leftVillages = computed<VillageList[]>(() => cityVillages.value.slice(0, 3))
const rightVillages = computed<VillageList[]>(() => cityVillages.value.slice(3, 6))

watch(
    () => state.value.selectedRegionId,
    async (regionId) => {
        if (regionId) {
            const slug = regionSlugMap[regionId]
            if (slug) {
                isLoadingVillages.value = true
                try {
                    const { data } = await api.fetchVillagesByCity(slug)
                    if (data.value && data.value.results) {
                        cityVillages.value = data.value.results
                    }
                } catch (e) {
                    console.error('Failed to fetch city villages', e)
                } finally {
                    isLoadingVillages.value = false
                }
            } else {
                cityVillages.value = []
                isLoadingVillages.value = false
            }
        } else {
            // Zoom out
            // Add a small delay for slide out animation
            setTimeout(() => {
                cityVillages.value = []
                isLoadingVillages.value = false
            }, 500)
        }
    }
)

function handleBackClick() {
    zoomOut()
}
</script>

<template>
    <section class="hero">
        <!-- Loading State -->
        <div class="hero__loader" :class="{ 'hero__loader--hidden': !state.isLoading }">
            {{ $t('hero.loader') }}
        </div>

        <!-- Three.js Canvas Container -->
        <ClientOnly>
            <div ref="mapContainer" class="hero__map-container" />
        </ClientOnly>

        <!-- Back Button -->
        <button class="hero__back-button" :class="{ 'hero__back-button--visible': state.isZoomed }"
            @click="handleBackClick">
            {{ $t('hero.backToOverview') }}
        </button>

        <!-- Zoom Vignette -->
        <div class="hero__zoom-vignette" :class="{ 'hero__zoom-vignette--visible': showZoomVignette }" />

        <!-- Mouse Hint with Figure-8 Animation -->
        <div class="hero__mouse-hint"
            :class="{ 'hero__mouse-hint--hidden': state.isZoomed || state.isLoading || hasInteracted || props.frozen }">
            <div class="hero__mouse-hint-y">
                <div class="hero__mouse-hint-x">
                    <div class="hero__mouse-hint-icon">
                        <svg width="32" height="48" viewBox="0 0 32 48" fill="none">
                            <rect x="2" y="2" width="28" height="44" rx="14" stroke="currentColor" stroke-width="2.5" />
                            <circle cx="16" cy="14" r="4" fill="currentColor" />
                        </svg>
                    </div>
                </div>
            </div>
            <span class="hero__mouse-hint-text">{{ $t('hero.mouseHint') }}</span>
        </div>

        <!-- Click City Hint -->
        <ClientOnly>
            <div class="hero__click-hint"
                :class="{ 'hero__click-hint--visible': showClickHint && !state.isZoomed && !props.frozen }">
                <div class="hero__click-hint-icon">
                    <svg class="hero__click-hint-marker" width="32" height="32" viewBox="0 0 48 48" fill="none">
                        <circle cx="24" cy="24" r="18" stroke="currentColor" stroke-width="2" opacity="0.5" />
                        <circle cx="24" cy="24" r="8" fill="currentColor" />
                    </svg>
                    <svg class="hero__click-hint-cursor" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M4 2L4 18L8 14L12 22L16 20L12 12L18 12L4 2Z" fill="currentColor"
                            stroke="rgba(0,0,0,0.3)" stroke-width="1" stroke-linejoin="round" />
                    </svg>
                </div>
                <span class="hero__click-hint-text">{{ $t('hero.clickHint') }}</span>
            </div>
        </ClientOnly>

        <!-- UI Layer -->
        <div class="hero__ui-layer" v-if="!hidden">
            <div class="hero__header" style="padding-top: 50px;">
                <h1 class="hero__title">{{ $t('hero.title') }}</h1>
                <p class="hero__subtitle">{{ $t('hero.subtitle') }}</p>
            </div>
        </div>

        <!-- Village Cards Overlay -->
        <div class="hero__villages-overlay"
            :class="{ 'hero__villages-overlay--visible': state.isZoomed && cityVillages.length > 0 }">
            <div class="hero__villages-side hero__villages-side--left">
                <NuxtLink v-for="(village, idx) in leftVillages" :key="village.id"
                    :to="$localePath({ name: 'villages-slug', params: { slug: village.slug } })"
                    class="hero__village-card" :style="{ transitionDelay: `${idx * 150 + 600}ms` }">
                    <img :src="village.image?.optimized || '/images/placehold.webp'" :alt="village.name"
                        class="hero__village-image" />
                    <div class="hero__village-content">
                        <h4 class="hero__village-title">{{ village.name }}</h4>
                    </div>
                </NuxtLink>
            </div>

            <div class="hero__villages-side hero__villages-side--right">
                <NuxtLink v-for="(village, idx) in rightVillages" :key="village.id"
                    :to="$localePath({ name: 'villages-slug', params: { slug: village.slug } })"
                    class="hero__village-card" :style="{ transitionDelay: `${idx * 150 + 600}ms` }">
                    <img :src="village.image?.optimized || '/images/placehold.webp'" :alt="village.name"
                        class="hero__village-image" />
                    <div class="hero__village-content">
                        <h4 class="hero__village-title">{{ village.name }}</h4>
                    </div>
                </NuxtLink>
            </div>
        </div>

        <!-- No Villages State -->
        <div class="hero__no-villages"
            :class="{ 'hero__no-villages--visible': state.isZoomed && !isLoadingVillages && cityVillages.length === 0 }">
            <p>{{ $t('cityVillages.noVillages') }}</p>
        </div>
    </section>
</template>

<style scoped>
.hero__villages-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    display: flex;
    justify-content: space-between;
    padding: 180px 40px 40px 40px;
    /* offset top for header, safe area side */
    z-index: 20;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.8s ease;
}

.hero__villages-overlay--visible {
    opacity: 1;
    visibility: visible;
}

@media (max-width: 1024px) {
    .hero__villages-overlay {
        display: none !important;
    }
}

.hero__villages-side {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 320px;
    pointer-events: auto;
}

.hero__village-card {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    aspect-ratio: 4 / 3;
    display: flex;
    align-items: flex-end;
    text-decoration: none;
    opacity: 0;
    transition: all 1s cubic-bezier(0.2, 0.8, 0.2, 1);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.hero__village-card:hover {
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
    z-index: 2;
}

.hero__villages-side--left .hero__village-card {
    transform: translateX(-100px);
}

.hero__villages-side--right .hero__village-card {
    transform: translateX(100px);
}

.hero__villages-overlay--visible .hero__villages-side--left .hero__village-card {
    transform: translateX(0);
    opacity: 1;
}

.hero__villages-overlay--visible .hero__villages-side--right .hero__village-card {
    transform: translateX(0);
    opacity: 1;
}

.hero__village-image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.8s ease;
}

.hero__village-card:hover .hero__village-image {
    transform: scale(1.08);
}

.hero__village-content {
    position: relative;
    z-index: 2;
    padding: 20px;
    width: 100%;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0) 100%);
    color: white;
}

.hero__village-title {
    margin: 0;
    font-size: 1.25rem;
    font-family: var(--font-display, var(--font-serif, serif));
}

.hero__no-villages {
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 20;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.8s ease;
    pointer-events: none;
}

.hero__no-villages--visible {
    opacity: 1;
    visibility: visible;
}

.hero__no-villages p {
    font-family: var(--font-display, var(--font-serif, serif));
    font-size: 3rem;
    color: white;
    text-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    letter-spacing: 0.1em;
}
</style>
