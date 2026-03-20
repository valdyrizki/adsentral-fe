import { defineStore } from 'pinia'
import { useAuthApi } from '~/composables/api/auth'
import type { LoginResponse } from '~/types/LoginResponse'
import type { MerchantRequest } from '~/types/MerchantRequest'
import type { UserResponse } from '~/types/UserResponse'

export const useAuthStore = defineStore('authStore', {
  state: () => ({
    auth: useCookie<LoginResponse | null>('user', { secure: true }).value, // ambil token dari cookie saat init
    loading: false as boolean,
    error: null as string | null,
  }),
  actions: {
    async login(email:string, password:string) {
      this.loading = true
      const { fetchLogin } = useAuthApi()

      try {
        const data = await fetchLogin(email,password);
        
        const authCookie = useCookie<LoginResponse | null>('auth', { secure: true })
        authCookie.value = data // simpan di cookie

        return data;
      } catch (err: any) {
        console.log(err.message);
        this.error = err.message || 'login failed'
        throw createError({
          statusCode: 400,
          statusMessage: err?.message || 'Login failed',
        })
      } finally {
        this.loading = false
      }

      
    },

    async logout() {
      
      this.auth = null
      const authCookie = useCookie<LoginResponse | null>('auth', { secure: true })
      authCookie.value = null

      const merchantCookie = useCookie<MerchantRequest | null>('merchant', { secure: true })
      merchantCookie.value = null

      const merchantStore = useMerchantStore()
      merchantStore.merchant = null
      
    },

    async restoreAuth() {
      // kalau user refresh, isi ulang dari cookie
      const authCookie = useCookie<LoginResponse | null>('auth', { secure: true })
      this.auth = authCookie.value
    },

    updateUserAuth(user:UserResponse){
      this.auth!.user = user
    }
  },
  persist:true
})