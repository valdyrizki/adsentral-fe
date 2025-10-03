import { defineStore } from 'pinia'
import { useAuthApi } from '~/composables/api/auth'
import type { LoginResponse } from '~/types/LoginResponse'

export const useAuthStore = defineStore('authStore', {
  state: () => ({
    user: useCookie<LoginResponse | null>('user', { secure: true }).value, // ambil token dari cookie saat init
    loading: false as boolean,
    error: null as string | null,
  }),
  actions: {
    async authLogin(email:string, password:string) {
      this.loading = true
      const { login } = useAuthApi()
      try {
        const data = await login(email,password);
        

        console.log("tessss");
        console.log(data.user);
        const userCookie = useCookie<LoginResponse | null>('user', { secure: true })
        userCookie.value = data // simpan di cookie
        console.log("Berhhasil");
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
      this.user = null
      const userCookie = useCookie<LoginResponse | null>('user', { secure: true })
      userCookie.value = null
    },

    async restoreAuth() {
      // kalau user refresh, isi ulang dari cookie
      const userCookie = useCookie<LoginResponse | null>('user', { secure: true })
      this.user = userCookie.value
    }
  },
  persist:true
})