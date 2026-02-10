<script setup lang="ts">
interface Props {
    cityName: string
    villageName: string
    heroImage: string
}

defineProps<Props>()
</script>

<template>
    <div class="village-hero">
        <!-- Header: City + Village Name -->
        <header class="village-hero__header">
            <span class="village-hero__city">{{ cityName }}</span>
            <div class="village-hero__city-line"></div>
            <h1 class="village-hero__name">{{ villageName }}</h1>
        </header>

        <!-- Hero Image -->
        <div class="village-hero__image-wrapper">
            <img :src="heroImage" :alt="villageName" class="village-hero__image" />
            <div class="village-hero__image-border"></div>
        </div>
    </div>
</template>

<style scoped>
.village-hero {
    padding: 4rem 2rem 3rem;
    text-align: center;
    background-color: #f5f0e6;
}

.village-hero__header {
    margin-bottom: 3rem;
    animation: fadeInDown 0.8s ease-out both;
}

.village-hero__city {
    display: inline-block;
    font-family: var(--font-primary);
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: #c85a2a;
}

.village-hero__city-line {
    width: 60px;
    height: 2px;
    background-color: #d4b483;
    margin: 0.75rem auto 1.5rem;
}

.village-hero__name {
    font-family: var(--font-display);
    font-size: clamp(2.5rem, 7vw, 5rem);
    font-weight: 400;
    color: #8c6b4a;
    margin: 0;
    letter-spacing: 0.02em;
    line-height: 1.15;
}

/* Hero Image */
.village-hero__image-wrapper {
    position: relative;
    max-width: 1200px;
    margin: 0 auto;
    aspect-ratio: 16 / 9;
    padding: 1rem;
    background: #fff;
    box-shadow: 0 15px 50px rgba(0, 0, 0, 0.08);
    animation: fadeInUp 1s ease-out 0.3s both;
}

.village-hero__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.village-hero__image-border {
    position: absolute;
    inset: 0.5rem;
    border: 1px solid #e0d8cc;
    pointer-events: none;
}

/* Animations */
@keyframes fadeInDown {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
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

/* Responsive */
@media (max-width: 768px) {
    .village-hero {
        padding: 3rem 1rem 2rem;
    }

    .village-hero__image-wrapper {
        aspect-ratio: 4 / 3;
        padding: 0.5rem;
    }
}
</style>
