<script setup lang="ts">
interface Props {
    cityName?: string
    backgroundImage?: string
}

withDefaults(defineProps<Props>(), {
    cityName: 'SAMARKAND',
    backgroundImage: '',
})
</script>

<template>
    <section class="city-head">
        <!-- Background Image with CSS parallax -->
        <div class="city-head__image-container">
            <img v-if="backgroundImage" :src="backgroundImage" alt="" class="city-head__image" />
        </div>

        <!-- Big centered text -->
        <h2 class="city-head__title">
            {{ cityName }}
        </h2>
    </section>
</template>

<style scoped>
.city-head {
    position: relative;
    width: 100%;
    height: 25vh;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Image container with parallax effect */
.city-head__image-container {
    position: absolute;
    top: -25%;
    left: 0;
    width: 100%;
    height: 150%;
    z-index: 1;
}

.city-head__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 30%;
}

/* Big centered text with animate.style-like animation */
.city-head__title {
    position: relative;
    z-index: 2;
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(3rem, 15vw, 12rem);
    font-weight: 400;
    color: #ffffff;
    letter-spacing: 0.15em;
    text-align: center;
    text-shadow:
        0 4px 30px rgba(0, 0, 0, 0.5),
        0 8px 60px rgba(0, 0, 0, 0.4);
    white-space: nowrap;
    user-select: none;

    /* animate.style fadeInUp */
    animation: fadeInUp 1s ease-out forwards;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Mobile */
@media (max-width: 767px) {
    .city-head__title {
        font-size: clamp(2rem, 18vw, 5rem);
        letter-spacing: 0.1em;
    }
}

/* Tablet */
@media (min-width: 768px) and (max-width: 1024px) {
    .city-head__title {
        font-size: clamp(3rem, 12vw, 7rem);
    }
}
</style>
