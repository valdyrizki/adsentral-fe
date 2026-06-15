export default defineNuxtConfig({
  imports: {
    dirs: ['stores'],
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@nuxt/image',
    '@pinia/nuxt',
    // 'pinia-plugin-persistedstate/nuxt',  ← HAPUS/COMMENT
  ],

  css: ['~/assets/css/main.css'],

  ui: {
    colorMode: false,
    theme: {
      colors: [
        'primary', 'secondary', 'tertiary',
        'info', 'success', 'warning', 'error'
      ]
    }
  },

  // routeRules: bekerja di dev DAN production
  routeRules: {
    '/backend/**': {
      proxy: `${process.env.NUXT_PUBLIC_BACKEND_URL}/api/**`
    }
  },

  // devProxy untuk cookie rewrite saat development lokal
  nitro: {
    devProxy: {
      '/backend': {
        target: `${process.env.NUXT_PUBLIC_BACKEND_URL}/api`,
        changeOrigin: true,
        cookieDomainRewrite: 'localhost',
        cookiePathRewrite: '/',
      }
    }
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/backend',
      backendUrl: process.env.NUXT_PUBLIC_BACKEND_URL || 'http://localhost:8080',
    }
  },
})