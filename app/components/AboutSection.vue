<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    progress: number // 0 to 1
}

const props = defineProps<Props>()

// Transform calculation for slide-up effect
const sectionStyle = computed(() => {
    // Start from 100% below (translateY 100%) and move to 0%
    const translateY = 100 - props.progress * 100
    const opacity = props.progress

    return {
        transform: `translateY(${translateY}%)`,
        opacity,
    }
})
</script>

<template>
    <section class="about-section" :style="sectionStyle">
        <div class="about-content">
            <h2 class="about-title">Discover Uzbekistan</h2>
            <p class="about-subtitle">Journey Through Ancient Silk Road Treasures</p>

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

.about-content {
    max-width: 900px;
    padding: 60px 40px;
    text-align: center;
}

.about-title {
    font-family: var(--font-display);
    font-size: 4rem;
    font-weight: 400;
    color: var(--primary-color);
    margin: 0 0 16px 0;
    letter-spacing: 0.02em;
}

.about-subtitle {
    font-family: var(--font-serif);
    font-size: 1.4rem;
    color: var(--gold-color);
    margin: 0 0 48px 0;
    letter-spacing: 0.1em;
    text-transform: uppercase;
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
}

.about-description p:last-child {
    margin-bottom: 0;
}

.about-stats {
    display: flex;
    justify-content: center;
    gap: 80px;
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
}

.stat-label {
    font-family: var(--font-primary);
    font-size: 0.9rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    margin-top: 8px;
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
