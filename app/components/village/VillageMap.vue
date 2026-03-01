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
let ymaps: any = null
let sectionObserver: IntersectionObserver | null = null

function loadYandexMapsScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if ((window as any).ymaps) {
            resolve()
            return
        }

        const script = document.createElement('script')
        script.src = 'https://api-maps.yandex.ru/2.1/?apikey=b2e578d5-16d8-4b36-81b6-e8b4a26a2097&lang=ru_RU'
        script.async = true
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Failed to load Yandex Maps script'))
        document.head.appendChild(script)
    })
}

async function initMap(): Promise<void> {
    if (!mapContainer.value) return

    try {
        await loadYandexMapsScript()

        ymaps = (window as any).ymaps

        await new Promise<void>((resolve) => {
            ymaps.ready(resolve)
        })

        map = new ymaps.Map(mapContainer.value, {
            center: [props.lat, props.lng],
            zoom: props.zoom,
            controls: ['zoomControl'],
            behaviors: ['drag', 'dblClickZoom', 'multiTouch']
        }, {
            suppressMapOpenBlock: true
        })

        // Add placemark (marker)
        const placemark = new ymaps.Placemark(
            [props.lat, props.lng],
            {
                hintContent: props.villageName,
                balloonContent: props.villageName
            },
            {
                iconLayout: 'default#imageWithContent',
                iconImageHref: '',
                iconImageSize: [32, 42],
                iconImageOffset: [-16, -42],
                iconContentLayout: ymaps.templateLayoutFactory.createClass(
                    '<svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                    '<path d="M16 0C7.16 0 0 7.16 0 16C0 28 16 42 16 42C16 42 32 28 32 16C32 7.16 24.84 0 16 0Z" fill="#c85a2a"/>' +
                    '<circle cx="16" cy="16" r="7" fill="#fff"/>' +
                    '</svg>'
                )
            }
        )

        map.geoObjects.add(placemark)

    } catch (error) {
        console.warn('Yandex Maps could not be loaded:', error)
    }
}

onMounted(() => {
    sectionObserver = new IntersectionObserver(
        (entries) => {
            if (entries[0]?.isIntersecting) {
                isVisible.value = true
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
    map?.destroy()
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
