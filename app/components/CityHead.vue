<script setup lang="ts">
interface Props {
    cityName?: string
}

withDefaults(defineProps<Props>(), {
    cityName: 'Explore the hidden gems of Uzbekistan',
})
</script>

<template>
    <section class="city-head">
        <div class="container">
            <h2 class="city-head__title">
                {{ cityName }}
            </h2>
        </div>
    </section>
</template>

<style scoped>
.city-head {
    width: 100%;
    height: 25dvh;
    display: flex;
    align-items: center;
    justify-content: start;
    border-top: 3px solid #d4af37;
    border-bottom: 3px solid #d4af37;
    box-shadow: 
        inset 0 6px 0 0 #d4af37,
        inset 0 -6px 0 0 #d4af37;
}

.city-head__title {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(2rem, 8vw, 4rem);
    font-weight: 400;
    color: #333;
    text-align: center;
}

.container {
    max-width: 1440px;
    width: 100%;
    margin: 0 auto;
    padding: 0 1rem;
}
</style>