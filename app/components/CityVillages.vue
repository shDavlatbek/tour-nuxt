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

// --- Scroll-Driven Snake Trail ---
const sectionRef = ref<HTMLElement | null>(null)
const trailProgress = ref(0)

// Total path length for the snake trail (measured from the SVG path)
const TRAIL_LENGTH = 4200

const trailDashOffset = computed(() => {
    return TRAIL_LENGTH * (1 - trailProgress.value)
})

let isActive = false

function updateTrailProgress(): void {
    if (!sectionRef.value) return

    const rect = sectionRef.value.getBoundingClientRect()
    const vh = window.innerHeight

    // Start drawing when section enters viewport, finish when bottom reaches top
    const totalTravel = rect.height + vh
    const traveled = vh - rect.top

    const raw = traveled / totalTravel
    trailProgress.value = Math.max(0, Math.min(1, raw))
}

function pollTrail(): void {
    if (!isActive) return
    updateTrailProgress()
    requestAnimationFrame(pollTrail)
}

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

    // Start trail animation polling (works with virtual scroll transforms)
    isActive = true
    pollTrail()
})

onUnmounted(() => {
    observer?.disconnect()
    isActive = false
})
</script>

<template>
    <section ref="sectionRef" class="villages-section">
        <!-- Snake Trail SVG — sits BEHIND the cards -->
        <svg class="trail-svg" viewBox="0 0 1400 1400" preserveAspectRatio="xMidYMid slice" fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <!--
                Snake path: enters from top-right, sweeps LEFT across row 1,
                then curves down and sweeps RIGHT across row 2, exits bottom-right.
                Like a cartoon motion trail / swoosh.
            -->
            <path class="trail-path" :style="{ strokeDashoffset: trailDashOffset }" d="
                M 1450 -40
                Q 1380 30, 1300 80
                C 1200 140, 1100 100, 1000 130
                C 850 170, 750 220, 600 200
                C 450 175, 300 250, 180 300
                C 80 340, 30 400, 60 480
                C 90 560, 200 550, 350 570
                C 500 590, 700 620, 900 650
                C 1050 670, 1200 720, 1300 780
                C 1400 840, 1380 920, 1300 970
                C 1200 1030, 1050 1010, 900 1020
                C 700 1035, 500 1060, 350 1100
                C 200 1140, 80 1200, 50 1280
                C 20 1360, 100 1420, 250 1440
                C 400 1460, 600 1450, 800 1470
                C 1000 1490, 1200 1520, 1450 1560
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

/* ===== Snake Trail SVG — behind everything ===== */
.trail-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
}

.trail-path {
    stroke: #c85a2a;
    stroke-width: 9;
    stroke-linecap: round;
    stroke-linejoin: round;
    /* Dashed stroke for cartoon "swoosh" effect */
    stroke-dasharray: 24 32;
    stroke-dashoffset: 4200;
    fill: none;
    opacity: 0.7;
    transition: stroke-dashoffset 0.06s linear;
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
