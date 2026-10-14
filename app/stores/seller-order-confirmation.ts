import { defineStore } from 'pinia'
import { useTransactionApi } from '~/composables/api/transaction'

export const useSellerOrderConfirmationStore = defineStore('seller-order-confirmation', {
  state: () => ({
    pendingCount: 0,
  }),

  actions: {
    async loadPendingCount() {
      const authStore = useAuthStore()
      if (!authStore.accessToken || !authStore.isSeller) return
      try {
        this.pendingCount = await useTransactionApi().fetchSellerPendingConfirmationCount()
      } catch {
        // badge bersifat informatif; sembunyikan dan coba lagi di polling berikutnya
        this.pendingCount = 0
      }
    },
  },
})
