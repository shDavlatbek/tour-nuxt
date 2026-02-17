<script setup lang="ts">
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()

interface LocaleObject {
  code: string
  name: string
}

const availableLocales = computed<LocaleObject[]>(() =>
  (locales.value as LocaleObject[]).filter((l) => l.code !== locale.value)
)

function switchLang(code: string): void {
  const path = switchLocalePath(code)
  navigateTo(path, { replace: true })
}
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />

    <!-- Language Switcher -->
    <div class="lang-switcher">
      <button v-for="loc in availableLocales" :key="loc.code" class="lang-switcher__btn" @click="switchLang(loc.code)">
        {{ loc.name }}
      </button>
    </div>

    <NuxtPage />
  </div>
</template>

<style scoped>
.lang-switcher {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  gap: 0.5rem;
}

.lang-switcher__btn {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-family: 'Inter', sans-serif;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.3s ease;
}

.lang-switcher__btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.4);
}
</style>
