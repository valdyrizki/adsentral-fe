// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/image', '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  ui: {
    colorMode: false,
    theme: {
      colors: [
        'primary',
        'secondary',
        'tertiary',
        'info',
        'success',
        'warning',
        'error'
      ]
    }
  },
  runtimeConfig: {
    // hanya tersedia di server
    apiSecret: process.env.API_SECRET,

    // tersedia di client & server
    public: {
      apiBase: process.env.API_BASE || 'http://localhost:8080/api'
    }
  }


})