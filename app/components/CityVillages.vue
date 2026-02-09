<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

interface Village {
    id: number
    title: string
    subtitle: string
    image: string
    delay?: string
}

const villages: Village[] = [
    {
        id: 1,
        title: 'VILLAGE A',
        subtitle: 'The Golden Canopy',
        image: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&q=80&w=800',
        delay: '0ms'
    },
    {
        id: 2,
        title: 'VILLAGE B',
        subtitle: 'Cascades of Silence',
        image: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&q=80&w=800',
        delay: '100ms'
    },
    {
        id: 3,
        title: 'VILLAGE C',
        subtitle: 'Emerald Secrets',
        image: 'https://images.unsplash.com/photo-1504198458649-3128b932f49e?auto=format&fit=crop&q=80&w=800',
        delay: '200ms'
    },
    {
        id: 4,
        title: 'VILLAGE D',
        subtitle: 'Path of Ancients',
        image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800',
        delay: '300ms'
    },
    {
        id: 5,
        title: 'VILLAGE E',
        subtitle: 'Mistborn Peaks',
        image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&q=80&w=800',
        delay: '400ms'
    },
    {
        id: 6,
        title: 'VILLAGE F',
        subtitle: 'Verdant Grove',
        image: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&q=80&w=800',
        delay: '500ms'
    }
]

// --- Intersection Observer for Village Cards ---
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
}

const visibleVillages = ref(new Set<number>())
let observer: IntersectionObserver | null = null

// --- Scroll Progress for Trail Segments ---
const sectionRef = ref<HTMLElement | null>(null)
const trailProgress = ref(0)
let isActive = false

// Trail segments fade in at these thresholds
// Order: top-right → V3 → V2 → V1 → V4 → V5 → V6 → bottom
const segmentVisible = computed(() => {
    const p = trailProgress.value
    return {
        entry: p > 0.05,      // Entry swoosh from top-right
        toV3: p > 0.10,       // → Village 3 (top-right card)
        toV2: p > 0.18,       // → Village 2 (top-center card)
        toV1: p > 0.26,       // → Village 1 (top-left card)
        toV4: p > 0.38,       // → Village 4 (bottom-left card) — crosses down
        toV5: p > 0.48,       // → Village 5 (bottom-center card)
        toV6: p > 0.58,       // → Village 6 (bottom-right card)
        exit: p > 0.68,       // Exit trail going down
    }
})

function updateProgress(): void {
    if (!sectionRef.value) return
    const rect = sectionRef.value.getBoundingClientRect()
    const vh = window.innerHeight
    const totalTravel = rect.height + vh
    const traveled = vh - rect.top
    trailProgress.value = Math.max(0, Math.min(1, traveled / totalTravel))
}

function pollLoop(): void {
    if (!isActive) return
    updateProgress()
    requestAnimationFrame(pollLoop)
}

onMounted(() => {
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

    document.querySelectorAll('.village-card').forEach((el) => {
        observer?.observe(el)
    })

    isActive = true
    pollLoop()
})

onUnmounted(() => {
    observer?.disconnect()
    isActive = false
})
</script>

<template>
    <section ref="sectionRef" class="villages-section">
        <!-- Trail SVG — behind cards (z-index: 0) -->
        <svg class="trail-svg" viewBox="0 0 1400 1400" preserveAspectRatio="xMidYMid slice" fill="none"
            xmlns="http://www.w3.org/2000/svg">

            <!-- Segment 1: Entry swoosh from top-right -->
            <path class="trail-segment" :class="{ 'is-visible': segmentVisible.entry }" d="
                M 1420 -30 C 1350 40, 1300 80, 1240 120
                C 1180 160, 1150 170, 1120 180
            " />

            <!-- Segment 2: → to Village 3 area (top-right card) -->
            <path class="trail-segment" :class="{ 'is-visible': segmentVisible.toV3 }" d="
                M 1120 180 C 1080 200, 1060 240, 1080 280
                C 1100 320, 1130 340, 1100 380
            " />

            <!-- Segment 3: Village 3 → Village 2 (right to center, row 1) -->
            <path class="trail-segment" :class="{ 'is-visible': segmentVisible.toV2 }" d="
                M 1100 380 C 1050 410, 950 390, 850 370
                C 750 350, 700 360, 680 400
            " />

            <!-- Segment 4: Village 2 → Village 1 (center to left, row 1) -->
            <path class="trail-segment" :class="{ 'is-visible': segmentVisible.toV1 }" d="
                M 680 400 C 640 440, 550 420, 450 400
                C 350 380, 280 400, 240 440
                C 200 480, 180 500, 130 520
            " />

            <!-- Segment 5: Village 1 → Village 4 (crossing down to row 2 left) -->
            <path class="trail-segment" :class="{ 'is-visible': segmentVisible.toV4 }" d="
                M 130 520 C 80 560, 50 640, 80 720
                C 110 800, 160 840, 200 880
                C 240 920, 280 940, 260 980
            " />

            <!-- Segment 6: Village 4 → Village 5 (left to center, row 2) -->
            <path class="trail-segment" :class="{ 'is-visible': segmentVisible.toV5 }" d="
                M 260 980 C 300 1010, 420 990, 550 1000
                C 650 1008, 700 1020, 720 1050
            " />

            <!-- Segment 7: Village 5 → Village 6 (center to right, row 2) -->
            <path class="trail-segment" :class="{ 'is-visible': segmentVisible.toV6 }" d="
                M 720 1050 C 760 1080, 880 1060, 1000 1070
                C 1100 1078, 1150 1100, 1180 1140
            " />

            <!-- Segment 8: Exit trail going down-right -->
            <path class="trail-segment" :class="{ 'is-visible': segmentVisible.exit }" d="
                M 1180 1140 C 1220 1200, 1260 1280, 1300 1340
                C 1340 1400, 1380 1430, 1430 1460
            " />
        </svg>

        <!-- Header -->
        <header class="villages-header">
            <h2 class="villages-title">SAMARKAND</h2>
            <div class="decorative-star">✦</div>
            <p class="villages-subtitle">
                "Echoes of a forgotten era, where the stones whisper tales of old<br>
                and the wind carries the scent of history."
            </p>
            <div class="separator-line"></div>
        </header>

        <!-- Grid -->
        <div class="villages-grid">
            <article v-for="village in villages" :key="village.id" class="village-card"
                :class="{ 'is-visible': visibleVillages.has(village.id) }" :data-id="village.id"
                :style="{ transitionDelay: village.delay }">
                <div class="card-image-wrapper">
                    <img :src="village.image" :alt="village.title" class="card-image" loading="lazy" />
                    <div class="card-border"></div>
                </div>
                <div class="card-content">
                    <div class="card-divider"></div>
                    <h3 class="card-title">{{ village.title }}</h3>
                    <p class="card-subtitle">{{ village.subtitle }}</p>
                </div>
            </article>
        </div>
    </section>
</template>

<style scoped>
.villages-section {
    padding: 6rem 2rem;
    background-color: #f5f0e6;
    color: #4a3b32;
    text-align: center;
    min-height: 100vh;
    position: relative;
    overflow: hidden;
}

/* ===== Trail SVG — behind cards ===== */
.trail-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
}

/* Each segment: invisible by default, fades in */
.trail-segment {
    stroke: #c85a2a;
    stroke-width: 8;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 20 28;
    fill: none;
    opacity: 0;
    transition: opacity 0.8s ease-in-out;
}

.trail-segment.is-visible {
    opacity: 0.72;
}

/* ===== Header ===== */
.villages-header {
    margin-bottom: 5rem;
    position: relative;
    z-index: 2;
}

.villages-title {
    font-family: var(--font-display, serif);
    font-size: clamp(3rem, 8vw, 6rem);
    font-weight: 400;
    letter-spacing: 0.1em;
    color: #8c6b4a;
    margin: 0;
    display: inline-block;
    position: relative;
}

.decorative-star {
    position: absolute;
    top: 0;
    right: -2rem;
    font-size: 2rem;
    color: #d4b483;
}

.villages-subtitle {
    font-family: var(--font-body, serif);
    font-style: italic;
    font-size: clamp(1rem, 2vw, 1.25rem);
    line-height: 1.6;
    margin-top: 1.5rem;
    color: #6b5b4e;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
}

.separator-line {
    width: 2px;
    height: 60px;
    background-color: #d4b483;
    margin: 2rem auto 0;
}

/* ===== Grid ===== */
.villages-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 4rem;
    max-width: 1400px;
    margin: 0 auto;
    align-items: stretch;
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

/* ===== Cards ===== */
.village-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    opacity: 0;
    transform: translateY(50px);
    transition: opacity 1s ease-out, transform 1s cubic-bezier(0.215, 0.61, 0.355, 1);
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
    transition: transform 0.3s ease;
}

.village-card:hover .card-image-wrapper {
    transform: translateY(-5px);
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

.card-content {
    text-align: center;
}

.card-divider {
    width: 30px;
    height: 2px;
    background-color: #d4b483;
    margin: 0 auto 1rem;
}

.card-title {
    font-family: var(--font-display, serif);
    font-size: 1.5rem;
    font-variant: small-caps;
    letter-spacing: 0.1em;
    margin: 0 0 0.5rem;
    color: #4a3b32;
}

.card-subtitle {
    font-family: var(--font-body, serif);
    font-style: italic;
    font-size: 0.9rem;
    color: #8c8c8c;
    margin: 0;
}

/* ===== Hide trail on mobile ===== */
@media (max-width: 767px) {
    .trail-svg {
        display: none;
    }
}
</style>
