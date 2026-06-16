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

  // HAPUS routeRules yang pakai env variable
  // routeRules: { ... }

  nitro: {
    // devProxy: untuk development lokal (cookie rewrite)
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
    // Private: hanya tersedia di server-side
    // Ini dibaca saat RUNTIME, bukan build time
    backendInternalUrl: process.env.BACKEND_INTERNAL_URL || 'http://adsentral-be-dev:8080',

    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/backend',
      backendUrl: process.env.NUXT_PUBLIC_BACKEND_URL || 'http://localhost:8080',
    }
  },

  icon: {
    serverBundle: {
      collections: [
        'heroicons',
        'mdi',
        'lucide',
        'material-symbols',
        'mdi',
        'fa6-solid',
        'simple-icons',
        'uiw',

      ]
    }
  },

})