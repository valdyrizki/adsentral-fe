import { defineStore } from 'pinia'
import { useUnprocessedPaymentApi } from '~/composables/api/unprocessed-payment'

export const useUnprocessedPaymentStore = defineStore('unprocessed-payment', {
  state: () => ({
    pendingCount: 0,
  }),

  actions: {
    async loadPendingCount() {
      const authStore = useAuthStore()
      if (!authStore.accessToken) return
      try {
        this.pendingCount = await useUnprocessedPaymentApi().fetchUnprocessedPendingCount()
      } catch {
        // badge bersifat informatif; abaikan kegagalan
      }
    },
  },
})
