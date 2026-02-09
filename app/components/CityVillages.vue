<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'

interface Village {
    id: number
    title: string
    subtitle: string
    image: string
    delay?: string
}

// Added more villages to demonstrate scalability
const villages: Village[] = [
    { id: 1, title: 'VILLAGE A', subtitle: 'The Golden Canopy', image: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&q=80&w=800', delay: '0ms' },
    { id: 2, title: 'VILLAGE B', subtitle: 'Cascades of Silence', image: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&q=80&w=800', delay: '100ms' },
    { id: 3, title: 'VILLAGE C', subtitle: 'Emerald Secrets', image: 'https://images.unsplash.com/photo-1504198458649-3128b932f49e?auto=format&fit=crop&q=80&w=800', delay: '200ms' },
    { id: 4, title: 'VILLAGE D', subtitle: 'Path of Ancients', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800', delay: '300ms' },
    { id: 5, title: 'VILLAGE E', subtitle: 'Mistborn Peaks', image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&q=80&w=800', delay: '400ms' },
    { id: 6, title: 'VILLAGE F', subtitle: 'Verdant Grove', image: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&q=80&w=800', delay: '500ms' },
    { id: 7, title: 'VILLAGE G', subtitle: 'Azure Depths', image: 'https://images.unsplash.com/photo-1518098268026-4e187743369b?auto=format&fit=crop&q=80&w=800', delay: '600ms' },
    { id: 8, title: 'VILLAGE H', subtitle: 'Crimson Horizon', image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=800', delay: '700ms' }
]

// --- Refs for Positioning ---
const sectionRef = ref<HTMLElement | null>(null)
// We store card DOM elements here to calculate positions
const cardRefs = ref<HTMLElement[]>([])
const pathData = ref('')
const pathLength = ref(0)
const svgPathRef = ref<SVGPathElement | null>(null)

// --- Scroll Progress ---
const trailProgress = ref(0)
let isActive = false

// --- Intersection Observer for Cards ---
const visibleVillages = ref(new Set<number>())
let observer: IntersectionObserver | null = null
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }

// --- 1. DYNAMIC PATH CALCULATION ---
// This function reads the DOM positions and generates the "Snake" path string
const calculateTrail = () => {
    if (!sectionRef.value || cardRefs.value.length === 0) return

    const containerRect = sectionRef.value.getBoundingClientRect()

    // Get centers of all cards relative to the container
    const points = cardRefs.value.map(el => {
        const rect = el.getBoundingClientRect()
        return {
            x: rect.left + rect.width / 2 - containerRect.left,
            y: rect.top + rect.height / 2 - containerRect.top,
            top: rect.top - containerRect.top // used for row grouping
        }
    })

    // Group by visual row (group items that have roughly the same Y)
    const rows: typeof points[] = []
    const threshold = 50 // px tolerance for "same row"

    points.forEach(p => {
        const currentRow = rows[rows.length - 1]
        if (currentRow && Math.abs(currentRow[0].top - p.top) < threshold) {
            currentRow.push(p)
        } else {
            rows.push([p])
        }
    })

    // Sort rows to create the "Snake" pattern
    // Row 0 (Top): Right -> Left (descending X)
    // Row 1: Left -> Right (ascending X)
    // Row 2: Right -> Left...
    const sortedPoints: typeof points = []

    rows.forEach((row, index) => {
        if (index % 2 === 0) {
            // Even rows (0, 2...): Right to Left
            row.sort((a, b) => b.x - a.x)
        } else {
            // Odd rows (1, 3...): Left to Right
            row.sort((a, b) => a.x - b.x)
        }
        sortedPoints.push(...row)
    })

    if (sortedPoints.length === 0) return

    // Create Entry Point (Swoosh from Top-Right offscreen)
    const first = sortedPoints[0]
    const entryPoint = { x: containerRect.width + 100, y: -100 }

    // Create Exit Point (Swoosh to Bottom offscreen)
    const last = sortedPoints[sortedPoints.length - 1]
    // Exit direction depends on the last row's direction
    const isLastRowRightToLeft = (rows.length - 1) % 2 === 0
    const exitX = isLastRowRightToLeft ? -100 : containerRect.width + 100
    const exitPoint = { x: exitX, y: last.y + 200 }

    // Combine all points
    const fullPath = [entryPoint, ...sortedPoints, exitPoint]

    // Generate SVG Path Command (Cubic Bezier through points)
    // Simple Catmull-Rom to Bezier conversion or simple smoothing
    let d = `M ${fullPath[0].x} ${fullPath[0].y}`

    for (let i = 0; i < fullPath.length - 1; i++) {
        const p0 = i > 0 ? fullPath[i - 1] : fullPath[i]
        const p1 = fullPath[i]
        const p2 = fullPath[i + 1]
        const p3 = i < fullPath.length - 2 ? fullPath[i + 2] : fullPath[i + 1]

        // Catmull-Rom Smoothing Factor
        const tension = 0.2 // 0 to 1

        const cp1x = p1.x + (p2.x - p0.x) * tension
        const cp1y = p1.y + (p2.y - p0.y) * tension

        const cp2x = p2.x - (p3.x - p1.x) * tension
        const cp2y = p2.y - (p3.y - p1.y) * tension

        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
    }

    pathData.value = d

    // Update path length for dasharray animation
    nextTick(() => {
        if (svgPathRef.value) {
            pathLength.value = svgPathRef.value.getTotalLength()
        }
    })
}

// --- 2. SCROLL LOOP ---
function updateProgress(): void {
    if (!sectionRef.value) return
    const rect = sectionRef.value.getBoundingClientRect()
    const vh = window.innerHeight

    // Drawing starts when top of section enters viewport bottom,
    // completes when ~60% of section has scrolled past (faster reveal)
    const totalTravel = rect.height * 0.1
    const traveled = vh - rect.top

    trailProgress.value = Math.max(0, Math.min(1, traveled / totalTravel))
}

function pollLoop(): void {
    if (!isActive) return
    updateProgress()
    requestAnimationFrame(pollLoop)
}

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

    cardRefs.value.forEach((el) => observer?.observe(el))

    // Initial Calculation
    isActive = true
    // Wait for layout to settle (images loading etc might shift layout, 
    // ideally use ResizeObserver)
    setTimeout(calculateTrail, 100)
    pollLoop()

    // Recalculate on Resize
    window.addEventListener('resize', calculateTrail)
})

onUnmounted(() => {
    observer?.disconnect()
    window.removeEventListener('resize', calculateTrail)
    isActive = false
})
</script>

<template>
    <section ref="sectionRef" class="villages-section">

        <svg class="trail-svg" width="100%" height="100%">
            <defs>
                <!-- Clip rect that grows from top to bottom based on scroll -->
                <clipPath id="trail-clip">
                    <rect x="-200" y="-200" :width="'calc(100% + 400px)'" :height="(trailProgress * 120) + '%'" />
                </clipPath>
            </defs>
            <!-- Dashed path, revealed progressively by clip-path -->
            <path ref="svgPathRef" class="trail-path" :d="pathData" clip-path="url(#trail-clip)" />
        </svg>

        <header class="villages-header">
            <h2 class="villages-title">SAMARKAND</h2>
            <div class="decorative-star">✦</div>
            <p class="villages-subtitle">
                "Echoes of a forgotten era, where the stones whisper tales of old<br>
                and the wind carries the scent of history."
            </p>
            <div class="separator-line"></div>
        </header>

        <div class="villages-grid">
            <article v-for="(village, index) in villages" :key="village.id" ref="cardRefs" class="village-card"
                :class="{ 'is-visible': visibleVillages.has(village.id) }" :data-id="village.id"
                :style="{ transitionDelay: `${index * 100}ms` }">
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
    /* Important: ensure overflow doesn't hide the svg if it curves slightly out */
    overflow: visible;
}

/* ===== Dynamic SVG ===== */
.trail-svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
    overflow: visible;
}

.trail-path {
    fill: none;
    stroke: #c85a2a;
    stroke-width: 7;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 18 24;
    opacity: 0.7;
}

/* ===== Header & Grid (Unchanged mostly) ===== */
.villages-header {
    margin-bottom: 5rem;
    position: relative;
    z-index: 2;
}

/* ... existing fonts and header styles ... */
.villages-title {
    font-family: serif;
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
</style>