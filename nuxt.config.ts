// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  // devtools: { enabled: true },
  // debug: true,
  future: {
    compatibilityVersion: 4,
  },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: {
        lang: 'en',
      },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
    },
  },
  vite: {
    server: {
      allowedHosts: true
    }
  }
})
