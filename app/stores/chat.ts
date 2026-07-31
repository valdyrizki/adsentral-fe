import { defineStore } from 'pinia'
import { useChatApi } from '~/composables/api/chat'

export const useChatStore = defineStore('chat', {
  state: () => ({
    unreadCount: 0,
    loading: false,
    lastFetched: null as number | null,
  }),
  persist: true,

  getters: {
    isFresh: (state) => {
      if (!state.lastFetched) return false
      return Date.now() - state.lastFetched < 60_000
    },
  },

  actions: {
    async loadUnreadCount(options: { force?: boolean } = {}) {
      const { force = false } = options
      if (!force && this.isFresh) return

      const authStore = useAuthStore()
      if (!authStore.accessToken) return

      const { fetchBuyerUnreadCount, fetchSellerUnreadCount } = useChatApi()

      this.loading = true
      try {
        this.unreadCount = authStore.isSeller
          ? await fetchSellerUnreadCount()
          : await fetchBuyerUnreadCount()
        this.lastFetched = Date.now()
      } finally {
        this.loading = false
      }
    },
  },
})
