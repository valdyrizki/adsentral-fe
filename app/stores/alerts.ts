import { defineStore } from 'pinia'
import { useAlertsApi } from '~/composables/api/alerts'
import type { AdminAlertsResponse, BuyerAlertsResponse, SellerAlertsResponse } from '~/types/AlertsResponse'

export type AlertsScope = 'admin' | 'seller' | 'buyer'

/**
 * Satu sumber angka badge untuk semua role:
 * - admin  -> GET /admin/alerts  (ADMIN/SUPER_ADMIN, layout admin)
 * - seller -> GET /seller/alerts (SELLER, layout seller)
 * - buyer  -> GET /alerts        (user login non-admin, layout default)
 * Slice bernilai null = belum dimuat / request gagal -> semua badge slice itu disembunyikan.
 */
export const useAlertsStore = defineStore('alerts', {
  state: () => ({
    admin: null as AdminAlertsResponse | null,
    seller: null as SellerAlertsResponse | null,
    buyer: null as BuyerAlertsResponse | null,
    // scope yang sedang di-poll oleh layout yang aktif (dipakai refresh())
    activeScopes: [] as AlertsScope[],
  }),

  actions: {
    canLoad(scope: AlertsScope) {
      const auth = useAuthStore()
      if (!auth.accessToken) return false
      if (scope === 'admin') return auth.isAnyAdmin
      if (scope === 'seller') return auth.isSeller
      return !auth.isAnyAdmin
    },

    async load(scope: AlertsScope) {
      if (!this.canLoad(scope)) {
        this[scope] = null
        return
      }
      const api = useAlertsApi()
      try {
        if (scope === 'admin') this.admin = await api.fetchAdminAlerts()
        else if (scope === 'seller') this.seller = await api.fetchSellerAlerts()
        else this.buyer = await api.fetchBuyerAlerts()
      } catch {
        // badge bersifat informatif: sembunyikan, coba lagi di polling berikutnya
        this[scope] = null
      }
    },

    // Panggil setelah aksi yang mengubah angka badge, supaya tidak menunggu polling
    refresh() {
      return Promise.all(this.activeScopes.map(s => this.load(s)))
    },

    activate(scope: AlertsScope) {
      if (!this.activeScopes.includes(scope)) this.activeScopes.push(scope)
    },
    deactivate(scope: AlertsScope) {
      this.activeScopes = this.activeScopes.filter(s => s !== scope)
    },
  },
})
