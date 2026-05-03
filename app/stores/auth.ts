import { defineStore } from 'pinia'
import { useAuthApi } from '~/composables/api/auth'
import { useUserApi } from '~/composables/api/user'
import type { MerchantRequest } from '~/types/MerchantRequest'
import type { UserResponse } from '~/types/UserResponse'

// Module-level: single-flight refresh promise.
// Tidak di-state Pinia karena tidak perlu reactive & nggak boleh ke-persist.
let refreshPromise: Promise<string> | null = null

interface AuthState {
  accessToken: string | null
  user: UserResponse | null
  loading: boolean
  error: string | null
  isInitializing: boolean  // ← tambah ini
}

export const useAuthStore = defineStore('authStore', {
  state: (): AuthState => ({
    accessToken: null,
    user: null,
    loading: false,
    error: null,
    isInitializing: true,  // ← default true
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken,
    role: (state) => state.user?.role ?? null,
    isSeller: (state) => state.user?.role === 'SELLER',
    isAdmin: (state) => state.user?.role === 'ADMIN',
    isSuperAdmin: (state) => state.user?.role === 'SUPER_ADMIN',
    // helper kombinasi: admin atau super admin
    isAnyAdmin: (state) => 
      state.user?.role === 'ADMIN' || 
      state.user?.role === 'SUPER_ADMIN',

  },

  actions: {

    async loadUserProfile() {      
      const { fetchMe } = useUserApi()
      
      this.loading = true
      try {
        const data = await fetchMe()
        this.setUser(data)
      } finally {
        this.loading = false
      }
    },

    setAccessToken(token: string) {
      this.accessToken = token
    },

    setInitialized() {
      this.isInitializing = false
    },

    setUser(user: UserResponse) {
      this.user = user
    },

    setLoading(loading: boolean) {
      this.loading = loading
    },

    clearAuth() {
      this.accessToken = null
      this.user = null
      refreshPromise = null
    },

    async login(email: string, password: string) {
      this.loading = true
      this.error = null

      const { fetchLogin } = useAuthApi()

      try {
        const data = await fetchLogin(email, password)
        this.accessToken = data.access_token
        return data
      } catch (err: any) {
        this.error = err.statusMessage || err.message || 'Login failed'
        throw createError({
          statusCode: err.statusCode || 400,
          statusMessage: this.error ?? 'Login failed',
        })
      } finally {
        this.loading = false
      }
    },

    async logout() {
      const config = useRuntimeConfig()
  
      try {
        // Panggil endpoint BE untuk:
        // 1. Hapus session di DB
        // 2. Expire cookie refreshToken di browser
        await $fetch('/user/logout', {
          method: 'POST',
          credentials: 'include',  // WAJIB: biar cookie refreshToken ikut
          baseURL: config.public.apiBase as string,
        })
      } catch (err) {
        // Kalau BE error, tetep lanjut clear state lokal
        // Yang penting user "logout" dari perspektif UX
        console.error('Logout BE error:', err)
      }
      
      // 3. Clear state Pinia
      this.clearAuth()
      
      // 4. Cleanup merchant (legacy)
      const merchantCookie = useCookie<MerchantRequest | null>('merchant', { secure: true })
      merchantCookie.value = null

      const merchantStore = useMerchantStore()
      merchantStore.merchant = null
      
      // 5. Redirect ke login
      await navigateTo('/login')

    },

    /**
     * Refresh access token via cookie HttpOnly yang auto dikirim browser.
     * Single-flight: kalau ada refresh lain jalan, reuse promise-nya
     * supaya 1 sesi cuma 1 request /refresh.
     */
    async refresh(): Promise<string> {
      if (refreshPromise) {
        return refreshPromise
      }

      const config = useRuntimeConfig()

      refreshPromise = (async () => {
        try {
          const response = await $fetch<{
            status: string
            data: { access_token: string }
          }>('/user/refresh', {
            method: 'POST',
            credentials: 'include',
            baseURL: config.public.apiBase,
          })

          const newToken = response.data.access_token
          this.setAccessToken(newToken)
          return newToken
        } catch (err) {
          this.clearAuth()
          throw err
        } finally {
          refreshPromise = null
        }
      })()

      return refreshPromise
    },
  },

  // TIDAK pakai persist:true. Token sengaja hilang saat reload.
  // Step 4 nanti bikin plugin auto-restore via /refresh.
})