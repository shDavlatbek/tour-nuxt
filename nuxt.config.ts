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
      allowedHosts: [
        'ed388f380723.ngrok-free.app',
        '695cdf8f685e.ngrok-free.app',
        'https://ed388f380723.ngrok-free.app',
        'https://695cdf8f685e.ngrok-free.app'
      ]
    }
  }
})
