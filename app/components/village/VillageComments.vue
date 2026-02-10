<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { VillageComment } from '~/types/village'

interface Props {
    comments: VillageComment[]
}

defineProps<Props>()

// Intersection observer for section fade-in
const sectionRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)
let sectionObserver: IntersectionObserver | null = null

onMounted(() => {
    sectionObserver = new IntersectionObserver(
        (entries) => {
            if (entries[0]?.isIntersecting) {
                isVisible.value = true
                sectionObserver?.disconnect()
            }
        },
        { threshold: 0.1 }
    )
    if (sectionRef.value) {
        sectionObserver.observe(sectionRef.value)
    }
})

onUnmounted(() => {
    sectionObserver?.disconnect()
})
</script>

<template>
    <section ref="sectionRef" class="village-comments" :class="{ 'is-visible': isVisible }">
        <!-- Header -->
        <header class="village-comments__header">
            <div class="village-comments__badge-wrapper">
                <span class="village-comments__badge">TRAVELER'S VOICES</span>
            </div>
            <h2 class="village-comments__title">Reflections</h2>
            <p class="village-comments__subtitle">Whispers from those who wandered</p>
        </header>

        <!-- Grid of Cards (matching code.html layout) -->
        <div class="village-comments__grid">
            <article v-for="comment in comments" :key="comment.id" class="comment-card">
                <!-- Big quotation mark -->
                <div class="comment-card__quote-mark">\u201C</div>

                <!-- Text content -->
                <div class="comment-card__body">
                    <p class="comment-card__text">{{ comment.text }}</p>
                    <button class="comment-card__read-more">
                        Read Full Story
                        <span class="comment-card__read-more-icon">▾</span>
                    </button>
                </div>

                <!-- Author footer -->
                <div class="comment-card__footer">
                    <div class="comment-card__avatar">
                        {{ comment.authorInitials }}
                    </div>
                    <div class="comment-card__author-info">
                        <span class="comment-card__name">{{ comment.authorName }}</span>
                        <span class="comment-card__role">{{ comment.authorRole }}</span>
                    </div>
                </div>
            </article>
        </div>
    </section>
</template>

<style scoped>
.village-comments {
    padding: 5rem 2rem;
    background-color: #f5f0e6;
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.8s ease-out, transform 0.8s ease-out;
}

.village-comments.is-visible {
    opacity: 1;
    transform: translateY(0);
}

/* Header */
.village-comments__header {
    text-align: center;
    margin-bottom: 3.5rem;
}

.village-comments__badge-wrapper {
    margin-bottom: 1rem;
}

.village-comments__badge {
    display: inline-block;
    font-family: var(--font-primary);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #8c6b4a;
    border: 1px solid rgba(140, 107, 74, 0.2);
    padding: 0.5rem 1.5rem;
    border-radius: 50px;
    background: rgba(140, 107, 74, 0.05);
}

.village-comments__title {
    font-family: var(--font-display);
    font-size: clamp(2.5rem, 5vw, 3.5rem);
    color: #8c6b4a;
    letter-spacing: 0.08em;
    margin: 0.5rem 0 0.5rem;
}

.village-comments__subtitle {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 1.1rem;
    color: rgba(74, 59, 50, 0.7);
    margin: 0;
}

/* Grid - 3 columns matching code.html */
.village-comments__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
    max-width: 1200px;
    margin: 0 auto;
}

/* Comment Card - vintage border style matching code.html */
.comment-card {
    position: relative;
    background: #FEFCF5;
    padding: 2rem 2.5rem;
    border: 1px solid rgba(212, 175, 55, 0.5);
    box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.1), 0 0 15px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 400px;
}

/* Vintage corner decorations */
.comment-card::before,
.comment-card::after {
    content: "";
    position: absolute;
    width: 20px;
    height: 20px;
    border: 1px solid #D4AF37;
    transition: all 0.3s ease;
}

.comment-card::before {
    top: -5px;
    left: -5px;
    border-right: none;
    border-bottom: none;
}

.comment-card::after {
    bottom: -5px;
    right: -5px;
    border-left: none;
    border-top: none;
}

.comment-card:hover::before,
.comment-card:hover::after {
    width: 100%;
    height: 100%;
    opacity: 0.8;
}

/* Quote mark */
.comment-card__quote-mark {
    font-family: var(--font-display);
    font-size: 3.5rem;
    color: rgba(212, 175, 55, 0.2);
    line-height: 1;
    margin-bottom: 0;
}

/* Card body */
.comment-card__body {
    position: relative;
    z-index: 1;
    flex: 1;
}

.comment-card__text {
    font-family: var(--font-serif);
    font-size: 1.05rem;
    font-style: italic;
    line-height: 1.75;
    color: rgba(74, 59, 50, 0.8);
    margin: 0 0 1.5rem;
}

.comment-card__read-more {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-family: var(--font-primary);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #8c6b4a;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: color 0.2s;
}

.comment-card__read-more:hover {
    color: #c85a2a;
}

.comment-card__read-more-icon {
    font-size: 0.65rem;
    transition: transform 0.2s;
}

.comment-card__read-more:hover .comment-card__read-more-icon {
    transform: translateY(2px);
}

/* Author footer */
.comment-card__footer {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    border-top: 1px solid rgba(140, 107, 74, 0.1);
    padding-top: 1.25rem;
    margin-top: 1.5rem;
}

.comment-card__avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(140, 107, 74, 0.1);
    border: 1px solid rgba(140, 107, 74, 0.3);
    color: #8c6b4a;
    font-family: var(--font-display);
    font-size: 0.85rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.comment-card__author-info {
    display: flex;
    flex-direction: column;
}

.comment-card__name {
    font-family: var(--font-display);
    font-size: 0.95rem;
    color: #8c6b4a;
    letter-spacing: 0.05em;
}

.comment-card__role {
    font-family: var(--font-primary);
    font-size: 0.65rem;
    color: rgba(74, 59, 50, 0.5);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-top: 2px;
}

/* Responsive */
@media (max-width: 1024px) {
    .village-comments__grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 640px) {
    .village-comments {
        padding: 3rem 1rem;
    }

    .village-comments__grid {
        grid-template-columns: 1fr;
    }

    .comment-card {
        min-height: 320px;
        padding: 1.5rem 1.5rem;
    }
}
</style>
