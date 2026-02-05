<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    progress: number // 0 to 1
    backgroundImage?: string // URL from backend
}

const props = withDefaults(defineProps<Props>(), {
    backgroundImage: '',
})

// Show background image when progress > 0.8
const showBackgroundImage = computed(() => props.progress > 0.8 && props.backgroundImage)

// Transform calculation for slide-up effect
const sectionStyle = computed(() => {
    // Start from 100% below (translateY 100%) and move to 0%
    const translateY = 100 - props.progress * 100

    return {
        transform: `translateY(${translateY}%)`,
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
    height: 100vh;
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
            rgba(0, 0, 0, 0.4) 0%,
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

@media (max-width: 768px) {
    .about-content {
        padding: 40px 24px;
    }

    .about-title {
        font-size: 2.5rem;
    }

    .about-subtitle {
        font-size: 1rem;
        margin-bottom: 32px;
    }

    .about-description p {
        font-size: 1rem;
    }

    .about-stats {
        flex-direction: column;
        gap: 32px;
    }

    .stat-number {
        font-size: 2.2rem;
    }
}
</style>
