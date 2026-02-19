<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import type { GalleryImageDisplay } from '~/types/village'

interface Props {
    images: GalleryImageDisplay[]
}

const props = defineProps<Props>()

// Intersection Observer for fade-in
const sectionRef = ref<HTMLElement | null>(null)
const visibleImages = ref(new Set<number>())
let observer: IntersectionObserver | null = null

// Lightbox state
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)

function openLightbox(index: number): void {
    lightboxIndex.value = index
    lightboxOpen.value = true
    document.body.style.overflow = 'hidden'
}

function closeLightbox(): void {
    lightboxOpen.value = false
    document.body.style.overflow = ''
}

function prevImage(): void {
    lightboxIndex.value = (lightboxIndex.value - 1 + props.images.length) % props.images.length
}

function nextImage(): void {
    lightboxIndex.value = (lightboxIndex.value + 1) % props.images.length
}

function handleKeydown(e: KeyboardEvent): void {
    if (!lightboxOpen.value) return
    if (e.key === 'Escape') closeLightbox()
    if (e.key === 'ArrowLeft') prevImage()
    if (e.key === 'ArrowRight') nextImage()
}

onMounted(() => {
    // Create observer first
    observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const id = Number((entry.target as HTMLElement).dataset.id)
                    if (!isNaN(id)) {
                        visibleImages.value.add(id)
                        observer?.unobserve(entry.target)
                    }
                }
            })
        },
        { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    )

    // Observe gallery items after DOM is ready
    nextTick(() => {
        if (sectionRef.value) {
            const items = sectionRef.value.querySelectorAll('.village-gallery__item')
            items.forEach((el) => observer?.observe(el))
        }
    })

    window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
    observer?.disconnect()
    window.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
})
</script>

<template>
    <section ref="sectionRef" class="village-gallery">
        <!-- Header -->
        <header class="village-gallery__header">
            <div class="village-gallery__star">✦</div>
            <h2 class="village-gallery__title">{{ $t('village.gallery.title') }}</h2>
            <div class="village-gallery__line"></div>
        </header>

        <!-- Grid -->
        <div class="village-gallery__grid">
            <div v-for="(image, index) in images" :key="image.id" class="village-gallery__item"
                :class="{ 'is-visible': visibleImages.has(image.id) }" :data-id="image.id"
                :style="{ transitionDelay: `${index * 80}ms` }" @click="openLightbox(index)">
                <div class="village-gallery__frame">
                    <img :src="image.src" :alt="image.alt" class="village-gallery__image" loading="lazy" />
                    <div class="village-gallery__frame-border"></div>
                </div>
            </div>
        </div>

        <!-- Lightbox -->
        <Teleport to="body">
            <Transition name="lightbox">
                <div v-if="lightboxOpen" class="lightbox" @click.self="closeLightbox">
                    <button class="lightbox__close" @click="closeLightbox" aria-label="Close lightbox">✕</button>

                    <button v-if="images.length > 1" class="lightbox__nav lightbox__nav--prev" @click="prevImage"
                        aria-label="Previous image">
                        ‹
                    </button>

                    <div class="lightbox__content">
                        <img :src="images[lightboxIndex]?.src" :alt="images[lightboxIndex]?.alt"
                            class="lightbox__image" />
                        <p v-if="images[lightboxIndex]?.alt" class="lightbox__caption">
                            {{ images[lightboxIndex]?.alt }}
                        </p>
                    </div>

                    <button v-if="images.length > 1" class="lightbox__nav lightbox__nav--next" @click="nextImage"
                        aria-label="Next image">
                        ›
                    </button>

                    <!-- Dots -->
                    <div v-if="images.length > 1" class="lightbox__dots">
                        <span v-for="(_, i) in images" :key="i" class="lightbox__dot"
                            :class="{ 'is-active': i === lightboxIndex }" @click="lightboxIndex = i"></span>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </section>
</template>

<style scoped>
.village-gallery {
    padding: 5rem 2rem;
    background-color: #f5f0e6;
}

/* Header */
.village-gallery__header {
    text-align: center;
    margin-bottom: 3.5rem;
}

.village-gallery__star {
    font-size: 1.5rem;
    color: #d4b483;
    margin-bottom: 0.5rem;
}

.village-gallery__title {
    font-family: var(--font-display);
    font-size: clamp(2rem, 5vw, 3rem);
    color: #8c6b4a;
    letter-spacing: 0.15em;
    margin: 0;
}

.village-gallery__line {
    width: 2px;
    height: 40px;
    background-color: #d4b483;
    margin: 1.5rem auto 0;
}

/* Grid */
.village-gallery__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.village-gallery__item {
    cursor: pointer;
    opacity: 0;
    transform: translateY(40px);
    transition: opacity 0.7s ease-out, transform 0.7s cubic-bezier(0.215, 0.61, 0.355, 1);
}

.village-gallery__item.is-visible {
    opacity: 1;
    transform: translateY(0);
}

.village-gallery__frame {
    position: relative;
    padding: 0.6rem;
    background: #fff;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.05);
    transition: box-shadow 0.3s ease, transform 0.3s ease;
}

.village-gallery__item:hover .village-gallery__frame {
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.1);
    transform: translateY(-4px);
}

.village-gallery__image {
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    display: block;
}

.village-gallery__frame-border {
    position: absolute;
    inset: 0.3rem;
    border: 1px solid #e0d8cc;
    pointer-events: none;
}

/* Responsive Grid */
@media (max-width: 1024px) {
    .village-gallery__grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
    }
}

@media (max-width: 600px) {
    .village-gallery {
        padding: 3rem 1rem;
    }

    .village-gallery__grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
    }
}

/* ===== Lightbox ===== */
.lightbox {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0, 0, 0, 0.92);
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(8px);
}

.lightbox__close {
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.8);
    font-size: 2rem;
    cursor: pointer;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background 0.2s, color 0.2s;
    z-index: 2;
}

.lightbox__close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
}

.lightbox__content {
    max-width: 85vw;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.lightbox__image {
    max-width: 100%;
    max-height: 75vh;
    object-fit: contain;
    border-radius: 4px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.lightbox__caption {
    color: rgba(255, 255, 255, 0.7);
    font-family: var(--font-serif);
    font-size: 0.9rem;
    margin-top: 1rem;
    text-align: center;
}

.lightbox__nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.8);
    font-size: 2.5rem;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s, color 0.2s;
    z-index: 2;
}

.lightbox__nav:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
}

.lightbox__nav--prev {
    left: 1.5rem;
}

.lightbox__nav--next {
    right: 1.5rem;
}

.lightbox__dots {
    position: absolute;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 8px;
}

.lightbox__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    cursor: pointer;
    transition: background 0.2s, transform 0.2s;
}

.lightbox__dot.is-active {
    background: #d4b483;
    transform: scale(1.3);
}

/* Lightbox transition */
.lightbox-enter-active,
.lightbox-leave-active {
    transition: opacity 0.3s ease;
}

.lightbox-enter-from,
.lightbox-leave-to {
    opacity: 0;
}

@media (max-width: 768px) {
    .lightbox__nav {
        width: 40px;
        height: 40px;
        font-size: 2rem;
    }

    .lightbox__nav--prev {
        left: 0.75rem;
    }

    .lightbox__nav--next {
        right: 0.75rem;
    }
}
</style>
