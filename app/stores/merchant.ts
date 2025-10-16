import { defineStore } from 'pinia'
import { useAuthApi } from '~/composables/api/auth'
import { useMerchantApi } from '~/composables/api/merchant'
import type { LoginResponse } from '~/types/LoginResponse'
import type { MerchantRequest } from '~/types/MerchantRequest'
import type { UserResponse } from '~/types/UserResponse'

export const useMerchantStore = defineStore('merchantStore', {
  state: () => ({
    merchant: useCookie<MerchantRequest | null>('merchant', { secure: true }).value, // ambil token dari cookie saat init
    loading: false as boolean,
    error: null as string | null,
  }),
  actions: {
    async setMyMerchant() {
      if(this.merchant !== null) return

      this.loading = true

      try {
        // ✅ Ambil API helper (misalnya composable API product)
        const { getMerchant } = useMerchantApi()

        // ✅ Fetch data produk terbaru dari backend (bulk by IDs)
        const data = await getMerchant()

        if (data) {
          this.merchant = data
          const merchantCookie = useCookie<MerchantRequest | null>('merchant', { secure: true })
          merchantCookie.value = data
        }else{
          throw new Error("Data tidak ditemukan")
        }
      } catch (err:any) {
        this.loading = false
        console.error('❌ Gagal update cart dari backend:', err)
        throw new Error(err.message)
      } finally {
        this.loading = false
      }
    },
    
  },
  persist:true
})