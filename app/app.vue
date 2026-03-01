<script setup lang="ts">
const { fetchSettings } = useApi()
const { data: settings } = await fetchSettings()
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <AppHeader :settings="settings" />
    <NuxtPage />
  </div>
</template>

<style scoped></style>
