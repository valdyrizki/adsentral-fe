import { defineStore } from 'pinia'
import { useNotificationApi } from '~/composables/api/notification'

export const useNotificationStore = defineStore('notification', {
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

      const { fetchUnreadCount, fetchSellerUnreadCount, fetchAdminUnreadCount } = useNotificationApi()

      this.loading = true
      try {
        const role = authStore.role
        if (role === 'ADMIN') {
          this.unreadCount = await fetchAdminUnreadCount()
        } else if (role === 'SELLER') {
          this.unreadCount = await fetchSellerUnreadCount()
        } else {
          this.unreadCount = await fetchUnreadCount()
        }
        this.lastFetched = Date.now()
      } finally {
        this.loading = false
      }
    },

    resetUnreadCount() {
      this.unreadCount = 0
      this.lastFetched = null
    },
  },
})
