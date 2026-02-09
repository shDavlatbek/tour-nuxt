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

// --- Scroll-Driven Trail Animation ---
const sectionRef = ref<HTMLElement | null>(null)
const trailProgress = ref(0) // 0 to 1

// The SVG path total length — will be measured on mount
const TRAIL_PATH_LENGTH = 3200

const trailDashOffset = computed(() => {
    return TRAIL_PATH_LENGTH * (1 - trailProgress.value)
})

function updateTrailProgress(): void {
    if (!sectionRef.value) return

    const rect = sectionRef.value.getBoundingClientRect()
    const viewportHeight = window.innerHeight

    // Section top enters from bottom → section bottom leaves through top
    // Progress: 0 when section top is at viewport bottom, 1 when section bottom is at viewport top
    const totalTravel = rect.height + viewportHeight
    const traveled = viewportHeight - rect.top

    const raw = traveled / totalTravel
    trailProgress.value = Math.max(0, Math.min(1, raw))
}

let rafId: number | null = null
let isTrailActive = false

function onTrailScroll(): void {
    if (!isTrailActive) return
    if (rafId) return
    rafId = requestAnimationFrame(() => {
        updateTrailProgress()
        rafId = null
    })
}

// Use MutationObserver to detect parent transform changes (virtual scroll)
let parentObserver: MutationObserver | null = null

onMounted(() => {
    // Village card observer
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

    // Trail scroll animation — listen to both scroll and RAF for virtual scroll
    isTrailActive = true

    // Since this section is inside a virtual scroll (transform-based),
    // we poll on every animation frame when the section could be visible
    function pollTrail(): void {
        if (!isTrailActive) return
        updateTrailProgress()
        requestAnimationFrame(pollTrail)
    }
    pollTrail()
})

onUnmounted(() => {
    observer?.disconnect()
    parentObserver?.disconnect()
    isTrailActive = false
    if (rafId) cancelAnimationFrame(rafId)
})
</script>

<template>
    <section ref="sectionRef" class="villages-section">
        <!-- Decorative Dash Trail SVG -->
        <svg class="trail-svg" viewBox="0 0 1400 1600" preserveAspectRatio="none" fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <!-- Main flowing trail path - from top-right, sweeping down-left, curving around content -->
            <path class="trail-path" :style="{ strokeDashoffset: trailDashOffset }" d="
                M 1350 -20
                C 1320 60, 1280 120, 1300 200
                C 1320 280, 1380 320, 1340 420
                C 1300 520, 1200 480, 1250 560
                C 1300 640, 1380 620, 1350 720
                C 1320 820, 1240 780, 1280 860
                C 1320 940, 1400 920, 1360 1020
                C 1320 1120, 1220 1080, 1260 1160
                C 1300 1240, 1380 1220, 1340 1320
                C 1300 1420, 1200 1400, 1240 1500
                C 1280 1600, 1360 1580, 1320 1620
            " />

            <!-- Left side trail - flowing down the left edge -->
            <path class="trail-path trail-path--left" :style="{ strokeDashoffset: trailDashOffset * 0.85 }" d="
                M 50 200
                C 80 280, 20 340, 60 420
                C 100 500, 40 540, 80 620
                C 120 700, 30 740, 70 820
                C 110 900, 20 940, 60 1020
                C 100 1100, 40 1140, 80 1220
                C 120 1300, 30 1340, 70 1420
                C 110 1500, 50 1560, 80 1620
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

/* ===== Trail SVG ===== */
.trail-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
}

.trail-path {
    stroke: #c85a2a;
    stroke-width: 8;
    stroke-linecap: round;
    stroke-dasharray: 20 30;
    stroke-dashoffset: 3200;
    fill: none;
    opacity: 0.75;
    filter: url(#brush);
    transition: stroke-dashoffset 0.08s linear;
}

.trail-path--left {
    stroke-width: 7;
    stroke-dasharray: 16 36;
    opacity: 0.65;
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

/* ===== Mobile: hide trails for performance ===== */
@media (max-width: 767px) {
    .trail-svg {
        display: none;
    }
}
</style>
