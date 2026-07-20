// stores/balance.ts
import { defineStore } from 'pinia'
import { useBalanceApi } from '~/composables/api/balance'
import type { BalanceResponse } from '~/types/balance/BalanceResponse'
import type { DepositResponse } from '~/types/balance/DepositResponse'
import type { PageResponse } from '~/types/PageResponse'

interface BalanceState {
  id: string
  depositBalance: number
  salesBalance: number
  depositHeld: number
  salesHeld: number
  lastFetched: number | null  // timestamp in ms
  depositHistory: PageResponse<DepositResponse>
  loading: boolean
}

export const useBalanceStore = defineStore('balance', {
  state: (): BalanceState => ({
    id: '',
    depositBalance: 0,
    salesBalance: 0,
    depositHeld: 0,
    salesHeld: 0,
    lastFetched: null,  // timestamp in ms
    depositHistory: {
      page: 0,
      size: 0,
      content: [],
      total_elements: 0,
      total_pages: 0,
      last: true
    },
    loading: false
  }),

  getters: {
    // Total dana tertahan (escrow belum clear + penarikan sedang diproses)
    heldTotal: (state) => state.depositHeld + state.salesHeld,

    // Apakah data fresh (kurang dari 1 menit)?
    isFresh: (state) => {
      if (!state.lastFetched) return false
      return Date.now() - state.lastFetched < 60_000
    },
  },


  actions: {
    setBalance(data: BalanceResponse) {
      this.depositBalance = data.deposit_balance
      this.salesBalance = data.sales_balance
      this.depositHeld = data.deposit_held
      this.salesHeld = data.sales_held
      this.lastFetched = Date.now()
    },

    async loadBalance(options: { force?: boolean } = {}) {
      const { force = false } = options

      if (!force && this.isFresh) return

      const { fetchBalance } = useBalanceApi()

      this.loading = true
      try {
        const data = await fetchBalance()
        this.setBalance(data)
      } finally {
        this.loading = false
      }
    },

    setDepositHistory(depositHistory: PageResponse<DepositResponse>) {
      this.depositHistory = depositHistory
    },

    setLoading(value: boolean) {
      this.loading = value
    },

    reset() {
      this.depositBalance = 0
      this.salesBalance = 0
      this.depositHeld = 0
      this.salesHeld = 0
      this.lastFetched = null
      this.loading = false
    },

  }
})
