import { defineStore } from 'pinia'
import { useFailedJournalApi } from '~/composables/api/failed-journal'

export const useFailedJournalStore = defineStore('failed-journal', {
  state: () => ({
    pendingCount: 0,
  }),

  actions: {
    async loadPendingCount() {
      const authStore = useAuthStore()
      if (!authStore.accessToken) return
      try {
        this.pendingCount = await useFailedJournalApi().fetchPendingCount()
      } catch {
        // badge bersifat informatif; abaikan kegagalan
      }
    },
  },
})
