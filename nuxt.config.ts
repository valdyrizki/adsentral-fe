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
    'pinia-plugin-persistedstate/nuxt',
  ],

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

  // HAPUS routeRules proxy yang lama
  // routeRules: {
  //   '/api/**': {
  //     proxy: 'http://103.179.57.147:8080/api/**'
  //   }
  // },

  // Ganti dengan nitro devProxy (lebih reliable + support cookie rewrite)
  nitro: {
    devProxy: {
      '/backend': {
        target: 'http://103.179.57.147:8080/api',
        changeOrigin: true,
        cookieDomainRewrite: 'localhost',
        cookiePathRewrite: '/',
      }
    }
  },

  runtimeConfig: {
    public: {
      apiBase: '/backend',
      backendUrl: 'http://103.179.57.147:8080'
    }
  },
})