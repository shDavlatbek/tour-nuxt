<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Props {
    lat: number
    lng: number
    zoom?: number
    villageName?: string
}

const props = withDefaults(defineProps<Props>(), {
    zoom: 13,
    villageName: ''
})

const mapContainer = ref<HTMLElement | null>(null)
const sectionRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)
let map: any = null
let mapboxgl: any = null
let sectionObserver: IntersectionObserver | null = null

async function initMap(): Promise<void> {
    if (!mapContainer.value) return

    try {
        // Dynamic import mapbox-gl
        mapboxgl = await import('mapbox-gl')
        // Also import css
        await import('mapbox-gl/dist/mapbox-gl.css')

        mapboxgl.default.accessToken = 'pk.eyJ1Ijoiam9rYWJyYSIsImEiOiJjbWxnYm9oNmIwYXhoM2VwZGI5c2YzdnhuIn0.Qe2YCuPxmEMcrPLh5BwH4A'

        map = new mapboxgl.default.Map({
            container: mapContainer.value,
            style: 'mapbox://styles/mapbox/outdoors-v12',
            center: [props.lng, props.lat],
            zoom: props.zoom,
            attributionControl: false,
            scrollZoom: false,
            cooperativeGestures: true
        })

        // Add navigation controls
        map.addControl(new mapboxgl.default.NavigationControl(), 'top-right')

        // Add attribution in bottom-right
        map.addControl(new mapboxgl.default.AttributionControl({ compact: true }), 'bottom-right')

        // Add marker
        const markerEl = document.createElement('div')
        markerEl.className = 'village-map__marker'
        markerEl.innerHTML = `
            <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 0C7.16 0 0 7.16 0 16C0 28 16 42 16 42C16 42 32 28 32 16C32 7.16 24.84 0 16 0Z" fill="#c85a2a"/>
                <circle cx="16" cy="16" r="7" fill="#fff"/>
            </svg>
        `

        new mapboxgl.default.Marker({ element: markerEl })
            .setLngLat([props.lng, props.lat])
            .addTo(map)

    } catch (error) {
        console.warn('Mapbox GL could not be loaded:', error)
    }
}

onMounted(() => {
    sectionObserver = new IntersectionObserver(
        (entries) => {
            if (entries[0]?.isIntersecting) {
                isVisible.value = true
                // Lazy-load the map when section is visible
                initMap()
                sectionObserver?.disconnect()
            }
        },
        { threshold: 0.05 }
    )

    if (sectionRef.value) {
        sectionObserver.observe(sectionRef.value)
    }
})

onUnmounted(() => {
    sectionObserver?.disconnect()
    map?.remove()
})
</script>

<template>
    <section ref="sectionRef" class="village-map" :class="{ 'is-visible': isVisible }">
        <!-- Header -->
        <header class="village-map__header">
            <div class="village-map__star">✦</div>
            <h2 class="village-map__title">{{ $t('village.map.title') }}</h2>
            <div class="village-map__line"></div>
        </header>

        <!-- Map Container -->
        <div class="village-map__container">
            <div ref="mapContainer" class="village-map__canvas"></div>
            <div class="village-map__border"></div>
        </div>
    </section>
</template>

<style scoped>
.village-map {
    padding: 5rem 0 0;
    background-color: #f5f0e6;
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.8s ease-out, transform 0.8s ease-out;
}

.village-map.is-visible {
    opacity: 1;
    transform: translateY(0);
}

/* Header */
.village-map__header {
    text-align: center;
    margin-bottom: 3rem;
    padding: 0 2rem;
}

.village-map__star {
    font-size: 1.5rem;
    color: #d4b483;
    margin-bottom: 0.5rem;
}

.village-map__title {
    font-family: var(--font-display);
    font-size: clamp(2rem, 5vw, 3rem);
    color: #8c6b4a;
    letter-spacing: 0.15em;
    margin: 0;
}

.village-map__line {
    width: 2px;
    height: 40px;
    background-color: #d4b483;
    margin: 1.5rem auto 0;
}

/* Map Container - 100% width */
.village-map__container {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 7;
    min-height: 400px;
}

.village-map__canvas {
    width: 100%;
    height: 100%;
}

.village-map__border {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, transparent, #d4b483 20%, #d4b483 80%, transparent);
}

/* Responsive */
@media (max-width: 768px) {
    .village-map {
        padding: 3rem 0 0;
    }

    .village-map__container {
        aspect-ratio: 4 / 3;
        min-height: 300px;
    }
}
</style>

<style>
/* Mapbox marker - global styles needed for dynamically created element */
.village-map__marker {
    cursor: pointer;
    transition: transform 0.2s ease;
}

.village-map__marker:hover {
    transform: scale(1.15);
}

/* Override mapbox default styles to match theme */
.mapboxgl-ctrl-group {
    border-radius: 4px !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}
</style>
