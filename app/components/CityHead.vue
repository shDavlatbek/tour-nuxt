<script setup lang="ts">
const { t } = useI18n()

interface Props {
    cityName?: string
}

const props = withDefaults(defineProps<Props>(), {
    cityName: '',
})

const displayName = computed(() => props.cityName || t('cityHead.defaultTitle'))
</script>

<template>
    <section class="city-head">
        <div class="city-head__bg"></div>
        <div class="container">
            <div class="city-head__inner">
                <h2 class="city-head__title">
                    {{ displayName }}
                </h2>
            </div>
        </div>
    </section>
</template>

<style scoped>
.city-head {
    position: relative;
    display: block;
    padding: 109px 0 120px;
    background-color: transparent;
    border: 10px solid #8c6b4a;
    border-left: 5px solid #8c6b4a;
    border-right: 5px solid #8c6b4a;
}

.city-head__bg {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background-color: rgba(0, 0, 0, 0.65);
}

.city-head__inner {
    position: relative;
    display: block;
    text-align: center;
    z-index: 1;
}

.city-head__title {
    font-size: 50px;
    color: var(--thm-base, #f5f0e6);
    font-weight: 900;
    line-height: 70px;
    text-transform: capitalize;
    margin-bottom: 0;
    letter-spacing: 0.1em;
    font-family: var(--font-display);
}

@media (max-width: 768px) {
    .city-head {
        padding: 100px 0 70px;
    }

    .city-head__title {
        font-size: 36px;
        line-height: 44px;
    }
}

.container {
    max-width: 1440px;
    width: 100%;
    margin: 0 auto;
    padding: 0 1rem;
}
</style>