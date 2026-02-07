<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    progress: number // 0 to 1
    cityName?: string
    backgroundImage?: string
    foregroundImage?: string
}

const props = withDefaults(defineProps<Props>(), {
    cityName: 'SAMARKAND',
    backgroundImage: '',
    foregroundImage: '',
})

// Section visibility and animation based on progress
const sectionStyle = computed(() => {
    // Fade in as progress increases
    const opacity = Math.min(1, props.progress * 2)
    const translateY = 100 - props.progress * 100

    return {
        transform: `translateY(${translateY}%)`,
        opacity,
        visibility: (props.progress > 0.001 ? 'visible' : 'hidden') as 'visible' | 'hidden',
    }
})

// Background parallax - moves slower (creates depth)
const backgroundStyle = computed(() => {
    const parallaxOffset = props.progress * 30 // Subtle upward movement
    return {
        transform: `translateY(${-parallaxOffset}px) scale(1.1)`,
    }
})

// Text animation - scales and fades in
const textStyle = computed(() => {
    const scale = 0.9 + props.progress * 0.1
    const textOpacity = Math.min(1, props.progress * 1.5)
    return {
        transform: `scale(${scale})`,
        opacity: textOpacity,
    }
})

// Foreground parallax - moves faster (creates depth)
const foregroundStyle = computed(() => {
    const parallaxOffset = props.progress * 60 // Faster upward movement
    return {
        transform: `translateY(${-parallaxOffset}px)`,
    }
})

// Interactive when fully visible
const isInteractive = computed(() => props.progress > 0.95)
</script>

<template>
    <section class="city-head" :style="sectionStyle" :class="{ 'city-head--interactive': isInteractive }">

        <!-- Layer 1: Background Image -->
        <div class="city-head__background" :style="backgroundStyle">
            <img v-if="backgroundImage" :src="backgroundImage" alt="" class="city-head__background-img" />
        </div>

        <!-- Layer 2: Typography (middle layer) -->
        <h2 class="city-head__title" :style="textStyle">
            {{ cityName }}
        </h2>

        <!-- Layer 3: Foreground Object (overlaps text) -->
        <div class="city-head__foreground" :style="foregroundStyle">
            <img v-if="foregroundImage" :src="foregroundImage" alt="" class="city-head__foreground-img" />
        </div>
    </section>
</template>

<style scoped>
.city-head {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    height: 100dvh;
    z-index: 70;
    overflow: hidden;
    pointer-events: none;
    will-change: transform, opacity;
}

.city-head--interactive {
    pointer-events: auto;
}

/* Layer 1: Background */
.city-head__background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    will-change: transform;
}

.city-head__background-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
}

/* Layer 2: Typography - between background and foreground */
.city-head__title {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 2;
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(3rem, 12vw, 10rem);
    font-weight: 400;
    color: #ffffff;
    letter-spacing: 0.1em;
    text-align: center;
    text-shadow:
        0 4px 20px rgba(0, 0, 0, 0.4),
        0 8px 40px rgba(0, 0, 0, 0.3);
    white-space: nowrap;
    will-change: transform, opacity;
    /* Allow foreground to overlap */
    pointer-events: none;
}

/* Layer 3: Foreground Object - overlaps text */
.city-head__foreground {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: auto;
    z-index: 3;
    pointer-events: none;
    will-change: transform;
}

.city-head__foreground-img {
    width: 100%;
    height: auto;
    object-fit: contain;
    object-position: bottom center;
}

/* Responsive Typography */
@media (max-width: 767px) {
    .city-head__title {
        font-size: clamp(2rem, 15vw, 4rem);
        letter-spacing: 0.05em;
    }
}

@media (min-width: 768px) and (max-width: 1024px) {
    .city-head__title {
        font-size: clamp(3rem, 10vw, 6rem);
    }
}

/* Short screens */
@media (max-height: 600px) {
    .city-head__title {
        font-size: clamp(2rem, 8vw, 4rem);
    }
}
</style>
