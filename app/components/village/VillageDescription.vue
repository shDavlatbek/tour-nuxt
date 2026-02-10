<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Props {
    subtitle: string
    paragraphs: string[]
}

defineProps<Props>()

// Intersection observer for fade-in
const sectionRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)
let observer: IntersectionObserver | null = null

onMounted(() => {
    observer = new IntersectionObserver(
        (entries) => {
            if (entries[0]?.isIntersecting) {
                isVisible.value = true
                observer?.disconnect()
            }
        },
        { threshold: 0.15 }
    )
    if (sectionRef.value) observer.observe(sectionRef.value)
})

onUnmounted(() => {
    observer?.disconnect()
})
</script>

<template>
    <section ref="sectionRef" class="village-desc" :class="{ 'is-visible': isVisible }">
        <div class="village-desc__inner">
            <div class="village-desc__accent-bar"></div>
            <div class="village-desc__content">
                <h2 class="village-desc__subtitle">{{ subtitle }}</h2>
                <div class="village-desc__text">
                    <p v-for="(paragraph, index) in paragraphs" :key="index" class="village-desc__paragraph"
                        :class="{ 'village-desc__paragraph--first': index === 0 }">
                        {{ paragraph }}
                    </p>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.village-desc {
    padding: 5rem 2rem;
    background-color: #f5f0e6;
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.8s ease-out, transform 0.8s ease-out;
}

.village-desc.is-visible {
    opacity: 1;
    transform: translateY(0);
}

.village-desc__inner {
    max-width: 900px;
    margin: 0 auto;
    display: flex;
    gap: 1.5rem;
}

.village-desc__accent-bar {
    width: 3px;
    min-height: 100%;
    background-color: #d4b483;
    flex-shrink: 0;
    border-radius: 2px;
}

.village-desc__content {
    flex: 1;
}

.village-desc__subtitle {
    font-family: var(--font-serif);
    font-size: clamp(1.5rem, 3vw, 2rem);
    font-weight: 700;
    color: #4a3b32;
    margin: 0 0 1.5rem;
    line-height: 1.3;
}

.village-desc__paragraph {
    font-family: var(--font-serif);
    font-size: 1.05rem;
    line-height: 1.8;
    color: #4a3b32;
    margin: 0 0 1.5rem;
}

.village-desc__paragraph:last-child {
    margin-bottom: 0;
}

/* Drop cap on first paragraph */
.village-desc__paragraph--first::first-letter {
    font-family: var(--font-display);
    float: left;
    font-size: 3.5rem;
    line-height: 1;
    padding-right: 0.15em;
    padding-top: 0.05em;
    color: #8c6b4a;
    font-weight: 400;
}

/* Responsive */
@media (max-width: 768px) {
    .village-desc {
        padding: 3rem 1.5rem;
    }

    .village-desc__inner {
        gap: 1rem;
    }

    .village-desc__paragraph {
        font-size: 0.95rem;
        line-height: 1.7;
    }

    .village-desc__paragraph--first::first-letter {
        font-size: 2.8rem;
    }
}
</style>
