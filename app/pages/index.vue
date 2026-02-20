<script setup lang="ts">
import { watch, computed, onMounted } from 'vue'
import { useSeoMeta } from 'nuxt/app'
import { useScrollTransition } from '../composables/useScrollTransition'
import { useScrollableSection } from '../composables/useScrollableSection'
import type { CityList, VillageList, PaginatedResponse } from '~/types/village'

interface CityWithVillages extends CityList {
    villages: VillageList[]
}

const { t } = useI18n()
const { locale } = useI18n()
const config = useRuntimeConfig()
const apiBase = config.public.apiBase as string

const headers = computed(() => ({
    'Accept-Language': locale.value,
}))

// --- Fetch cities + their villages in a single useAsyncData call ---
const { data: cities } = await useAsyncData<CityWithVillages[]>(
    'cities-with-villages',
    async () => {
        const citiesRes = await $fetch<PaginatedResponse<CityList>>('/cities/', {
            baseURL: apiBase,
            headers: headers.value,
        })

        const cityList = citiesRes.results ?? []

        const citiesWithVillages = await Promise.all(
            cityList.map(async (city) => {
                const villagesRes = await $fetch<PaginatedResponse<VillageList>>('/villages/', {
                    baseURL: apiBase,
                    headers: headers.value,
                    params: { city: city.slug },
                })
                return {
                    ...city,
                    villages: villagesRes.results ?? [],
                }
            })
        )

        return citiesWithVillages
    },
    { watch: [locale] }
)

useSeoMeta({
    title: t('seo.homeTitle'),
    description: t('seo.homeDescription'),
    ogTitle: t('seo.homeTitle'),
    ogDescription: t('seo.homeDescription'),
    ogType: 'website',
})

// --- 1. SETUP ENGINE ---
const SCROLL_STORAGE_KEY = 'home-scroll-progress'

const {
    scrollProgress,
    setMaxScroll,
    createPhase,
    setMapZoomed,
    setProgress
} = useScrollTransition({
    initialMaxScroll: 2.0,
    // pins: [
    //     { position: 1.0, duration: 500 } // Brief pause at About section complete
    // ]
})

// --- 2. DEFINE SECTION PHASES (All return { progress, style }) ---
// Hero + About fixed animations (0 to 1.0)
const isFrozen = computed(() => scrollProgress.value > 0.05)
const heroPhase = createPhase(0, 0.5, { direction: 'none' })      // 0 → 0.5 = Hero zoom out
const cloudPhase = createPhase(0.15, 1.0, { direction: 'none' })  // 0.15 → 1.0 = Cloud overlay
const aboutPhase = createPhase(0.5, 1.0, { direction: 'up' })     // 0.5 → 1.0 = About section
const mapZoomInPhase = createPhase(0.7, 1.0, { direction: 'none' }) // 0.7 → 1.0 = Map zooms back in

// Combined zoom: zoom out (0→0.5) then zoom back in (0.7→1.0)
const combinedZoomProgress = computed(() => {
    const zoomOut = heroPhase.progress.value       // 0→1 as scroll 0→0.5
    const zoomIn = mapZoomInPhase.progress.value   // 0→1 as scroll 0.7→1.0
    // First zoom out, then reverse back in
    return zoomOut - (zoomOut * zoomIn)
})

// About section scrolls OUT as CityHead comes in (continues past 1.0)
// Standard: 1.0 virtual unit = 100dvh (same as useScrollableSection)
const aboutScrollOut = computed(() => {
    if (scrollProgress.value <= 1.0) return 0
    // 1.0 virtual unit = 100dvh of movement
    return (scrollProgress.value - 1.0) * 100 // percentage of viewport
})

// Handle zoom state change from HeroSection
function handleMapZoomChange(zoomed: boolean) {
    setMapZoomed(zoomed)
}

// --- SCROLL POSITION PERSISTENCE ---
// Save scroll progress to sessionStorage on change
watch(scrollProgress, (val) => {
    if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(SCROLL_STORAGE_KEY, String(val))
    }
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app:scrollProgress', { detail: val }))
    }
})

// Restore scroll progress from sessionStorage on mount
onMounted(() => {
    if (typeof window !== 'undefined') {
        window.addEventListener('app:scrollTo', ((e: CustomEvent) => {
            setProgress(e.detail)
        }) as EventListener)
    }

    if (typeof sessionStorage !== 'undefined') {
        const saved = sessionStorage.getItem(SCROLL_STORAGE_KEY)
        if (saved !== null) {
            const val = parseFloat(saved)
            if (!isNaN(val) && val > 0) {
                setProgress(val)
            }
        }
    }
})

// --- 3. DYNAMIC SECTIONS ---

// CityHead starts at 1.0 (after About section)
const CITYHEAD_START = 1.0
const {
    elementRef: cityHeadRef,
    sectionStyle: cityHeadStyle,
    virtualLength: cityHeadLength
} = useScrollableSection({
    scrollProgress,
    startAt: CITYHEAD_START
})

// --- 4. UPDATE TOTAL SCROLL LENGTH ---
watch(cityHeadLength, () => {
    const total = CITYHEAD_START + cityHeadLength.value
    setMaxScroll(total)
}, { immediate: true })

// Scroll indicator using progress
const scrollIndicatorProgress = computed(() => {
    const maxVal = 1.0 + cityHeadLength.value
    return Math.min(1, scrollProgress.value / maxVal)
})
</script>

<template>
    <div class="virtual-viewport">
        <!-- Texture Overlays -->
        <div class="grain-overlay" />
        <div class="vignette-overlay" />

        <!-- Fixed Layer: Hero + About (animated by scroll progress) -->
        <div class="fixed-layer">
            <!-- Hero Section -->
            <HeroSection :frozen="isFrozen" :zoom-progress="combinedZoomProgress" :hidden="scrollProgress > 1.0"
                @zoom-change="handleMapZoomChange" />

            <!-- Cloud Overlay - appears during scroll -->
            <ClientOnly>
                <CloudOverlay :progress="cloudPhase.progress.value" :about-progress="aboutPhase.progress.value" />
            </ClientOnly>

            <!-- About Section - slides up and then scrolls out -->
            <ClientOnly>
                <AboutSection :progress="aboutPhase.progress.value" :scroll-out="aboutScrollOut"
                    background-image="https://uzbekistan.travel/storage/app/media/uploaded-files/samarkand-uzbekistan-kupol-mechet-ploshchad.png" />
            </ClientOnly>
        </div>

        <!-- Scroll Layer: One CityHead + CityVillages block per city -->
        <div ref="cityHeadRef" class="scroll-layer" :style="cityHeadStyle">
            <CityHead />
            <CityVillages v-for="city in cities" :key="city.id" :villages="city.villages ?? []"
                :city-name="city.name" />
            <AppFooter />
        </div>

        <!-- Visual Scroll Indicator -->
        <div class="scroll-indicator">
            <div class="scroll-track">
                <div class="scroll-thumb" :style="{ height: `${Math.max(20, scrollIndicatorProgress * 100)}%` }" />
            </div>
        </div>

        <!-- Debug (remove in production) -->
        <div class="debug">{{ scrollProgress.toFixed(2) }} / {{ (cityHeadLength).toFixed(2) }}</div>
    </div>
</template>

<style scoped>
/* Virtual viewport - full screen fixed container */
.virtual-viewport {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100dvh;
    height: 100dvh;
    overflow: hidden;
}

/* Fixed layer for Hero and About animations */
.fixed-layer {
    position: absolute;
    inset: 0;
    z-index: 1;
}

/* Scroll layer - positioned below fold, moves up via transform */
.scroll-layer {
    position: absolute;
    top: 100dvh;
    left: 0;
    width: 100%;
    z-index: 10;
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

/* Debug display */
.debug {
    position: fixed;
    bottom: 10px;
    right: 10px;
    z-index: 999;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 12px;
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
