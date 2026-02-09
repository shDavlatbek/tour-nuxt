<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    progress: number // 0 to 1 (entry animation)
    scrollOut?: number // percentage to scroll up (0 = none, 100 = fully off screen)
    backgroundImage?: string // URL from backend
}

const props = withDefaults(defineProps<Props>(), {
    scrollOut: 0,
    backgroundImage: '',
})

// Show background image when progress > 0.8
const showBackgroundImage = computed(() => props.progress > 0.8 && props.backgroundImage)

// Transform calculation for slide-up effect
const sectionStyle = computed(() => {
    // Start from 100% below (translateY 100%) and move to 0%
    // Then continue to negative values (scroll out the top) when scrollOut > 0
    const entryTranslate = 100 - props.progress * 100
    const exitTranslate = -props.scrollOut
    const translateY = entryTranslate + exitTranslate

    return {
        transform: `translateY(${translateY}%)`,
        visibility: (props.progress > 0.001 ? 'visible' : 'hidden') as 'visible' | 'hidden',
    }
})

// Background image style with fade-in
const backgroundStyle = computed(() => {
    if (!props.backgroundImage) return {}

    // Fade in when progress goes from 0.8 to 1
    const fadeProgress = props.progress > 0.8
        ? (props.progress - 0.8) / 0.2
        : 0

    return {
        backgroundImage: `url(${props.backgroundImage})`,
        opacity: fadeProgress,
    }
})

// Text should be light when background image is showing
const hasImageBackground = computed(() => showBackgroundImage.value)

// Enable pointer events when section is fully visible (can click button)
const isInteractive = computed(() => props.progress > 0.95)
</script>

<template>
    <section class="about-section" :style="sectionStyle"
        :class="{ 'about-section--dark': hasImageBackground, 'about-section--interactive': isInteractive }">
        <!-- Background image layer -->
        <div v-if="backgroundImage" class="about-background" :style="backgroundStyle" />
        <!-- Overlay for readability -->
        <div v-if="hasImageBackground" class="about-overlay" />

        <div class="about-content">
            <p class="about-subtitle">ABOUT</p>
            <h2 class="about-title">What is Tourism Village</h2>

            <div class="about-description">
                <p>
                    Uzbekistan, the heart of Central Asia, is a land where ancient history meets
                    breathtaking architecture. From the turquoise domes of Samarkand to the
                    pristine deserts of Kyzylkum, every corner tells a story of the legendary Silk Road.
                </p>
                <p>
                    Explore traditional villages where centuries-old crafts thrive, taste the
                    world-renowned hospitality, and witness landscapes that have inspired
                    travelers for millennia.
                </p>
            </div>

            <div class="about-stats">
                <div class="stat-item">
                    <span class="stat-number">7</span>
                    <span class="stat-label">UNESCO Sites</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">3000+</span>
                    <span class="stat-label">Years of History</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">100+</span>
                    <span class="stat-label">Tourism Villages</span>
                </div>
            </div>

            <button class="about-button">Explore More</button>
        </div>
    </section>
</template>

<style scoped>
.about-section {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100dvh;
    height: 100dvh;
    background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
    z-index: 60;
    display: flex;
    align-items: center;
    justify-content: center;
    will-change: transform, opacity;
    pointer-events: none;
}

.about-section--interactive {
    pointer-events: auto;
}

.about-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    opacity: 0;
    transition: opacity 0.3s ease-out;
}

.about-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(180deg,
            rgba(0, 0, 0, 0.6) 0%,
            rgba(0, 0, 0, 0.6) 100%);
}

.about-content {
    position: relative;
    z-index: 1;
    max-width: 900px;
    padding: 60px 40px;
    text-align: center;
}

.about-title {
    font-family: var(--font-display);
    font-size: 4rem;
    font-weight: 400;
    color: var(--primary-color);
    margin: 0 0 48px 0;
    letter-spacing: 0.05em;
    transition: color 0.3s ease-out;
}

.about-subtitle {
    font-family: var(--font-serif);
    font-size: 1.4rem;
    color: var(--gold-color);
    margin: 0 0 16px 0;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    transition: color 0.3s ease-out;
}

.about-description {
    max-width: 700px;
    margin: 0 auto 60px auto;
}

.about-description p {
    font-family: var(--font-primary);
    font-size: 1.15rem;
    line-height: 1.8;
    color: #555;
    margin: 0 0 24px 0;
    transition: color 0.3s ease-out;
}

.about-description p:last-child {
    margin-bottom: 0;
}

.about-stats {
    display: flex;
    justify-content: center;
    gap: 80px;
    margin-bottom: 60px;
}

.about-button {
    padding: 16px 40px;
    background-color: var(--primary-color);
    color: white;
    border: 2px solid var(--primary-color);
    /* border-radius: 50px; */
    font-family: var(--font-primary);
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.about-button:hover {
    background-color: white;
    color: var(--primary-color);
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.stat-number {
    font-family: var(--font-display);
    font-size: 3rem;
    font-weight: 400;
    color: var(--primary-color);
    line-height: 1;
    transition: color 0.3s ease-out;
}

.stat-label {
    font-family: var(--font-primary);
    font-size: 0.9rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    margin-top: 8px;
    transition: color 0.3s ease-out;
}

/* Dark mode text colors when background image is visible */
.about-section--dark .about-title {
    color: #ffffff;
}

.about-section--dark .about-subtitle {
    color: #e8d5a3;
}

.about-section--dark .about-description p {
    color: rgba(255, 255, 255, 0.9);
}

.about-section--dark .stat-number {
    color: #ffffff;
}

.about-section--dark .stat-label {
    color: rgba(255, 255, 255, 0.7);
}

/* Mobile (Phones) */
@media (max-width: 767px) {
    .about-content {
        padding: 24px 20px;
        max-width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        height: 100%;
    }

    .about-title {
        font-size: 2rem;
        margin-bottom: 24px;
        line-height: 1.2;
    }

    .about-subtitle {
        font-size: 0.9rem;
        margin-bottom: 16px;
    }

    .about-description {
        margin-bottom: 32px;
    }

    .about-description p {
        font-size: 0.95rem;
        line-height: 1.5;
        margin-bottom: 12px;
        /* Limit text lines if needed, or just keep it concise */
    }

    .about-stats {
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
        gap: 16px 24px;
        margin-bottom: 32px;
    }

    .stat-item {
        flex: 0 1 auto;
        /* Allow items to shrink but stay in row if possible */
        min-width: 80px;
    }

    .stat-number {
        font-size: 1.8rem;
    }

    .stat-label {
        font-size: 0.7rem;
        letter-spacing: 0.1em;
    }

    .about-button {
        width: 100%;
        padding: 12px 20px;
        font-size: 1rem;
    }
}

/* Tablet (Portrait & Small Landscape) */
@media (min-width: 768px) and (max-width: 1024px) {
    .about-content {
        padding: 50px 32px;
        max-width: 90%;
    }

    .about-title {
        font-size: 3rem;
        margin-bottom: 40px;
    }

    .about-subtitle {
        font-size: 1.2rem;
    }

    .about-description p {
        font-size: 1.1rem;
    }

    .about-stats {
        gap: 40px;
    }

    .stat-number {
        font-size: 2.8rem;
    }
}

/* Laptop (Small Desktops) */
@media (min-width: 1025px) and (max-width: 1440px) {
    .about-content {
        max-width: 800px;
        padding: 60px;
    }

    .about-title {
        font-size: 3.5rem;
    }
}

/* Short screens (Landscape Mobile) */
@media (max-height: 600px) {
    .about-content {
        padding: 20px;
    }

    .about-title {
        font-size: 2rem;
        margin-bottom: 20px;
    }

    .about-subtitle {
        margin-bottom: 10px;
    }

    .about-description {
        display: none;
        /* Hide description on very short screens to fit stats/button */
    }

    .about-stats {
        margin-bottom: 20px;
        flex-direction: row;
        gap: 20px;
    }

    .stat-number {
        font-size: 2rem;
    }
}
</style>
