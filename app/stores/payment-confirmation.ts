import { defineStore } from 'pinia'
import { usePaymentApi } from '~/composables/api/payment'

export const usePaymentConfirmationStore = defineStore('payment-confirmation', {
  state: () => ({
    pendingCount: 0,
  }),

  actions: {
    async loadPendingCount() {
      const authStore = useAuthStore()
      if (!authStore.accessToken || !authStore.isAnyAdmin) return
      try {
        this.pendingCount = await usePaymentApi().fetchPendingConfirmationCount()
      } catch {
        // badge bersifat informatif; sembunyikan dan coba lagi di polling berikutnya
        this.pendingCount = 0
      }
    },
  },
})
