// stores/balance.ts
import { defineStore } from 'pinia'
import { useBalanceApi } from '~/composables/api/balance'
import type { DepositResponse } from '~/types/balance/DepositResponse'
import type { PageResponse } from '~/types/PageResponse'

interface BalanceState {
  id: string
  balance: number
  balanceHeld: number
  lastFetched: number | null  // timestamp in ms
  depositHistory: PageResponse<DepositResponse>
  loading: boolean
}

export const useBalanceStore = defineStore('balance', {
  state: (): BalanceState => ({
    id: '',
    balance: 0,
    balanceHeld: 0,
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
    balanceTotal: (state) => state.balance + state.balanceHeld,
    
    // Apakah data fresh (kurang dari 1 menit)?
    isFresh: (state) => {
      if (!state.lastFetched) return false
      return Date.now() - state.lastFetched < 60_000
    },
  },


  actions: {
    setBalance(balance: number) {
      this.balance = balance
      this.lastFetched = Date.now()
    },

    setBalanceHeld(balanceHeld: number) {
      this.balanceHeld = balanceHeld
      this.lastFetched = Date.now()
    },

    async loadBalance(options: { force?: boolean } = {}) {
      const { force = false } = options
      
      if (!force && this.isFresh) return
      
      const { fetchBalance } = useBalanceApi()
      
      this.loading = true
      try {
        const data = await fetchBalance()
        this.setBalance(data.balance)
      } finally {
        this.loading = false
      }
    },


    setBalanceDetail(id : string, balance: number, balanceHeld: number) {
      this.id = id
      this.balance = balance
      this.balanceHeld = balanceHeld
      this.lastFetched = Date.now()
    },

    setDepositHistory(depositHistory: PageResponse<DepositResponse>) {
      this.depositHistory = depositHistory
    },

    setLoading(value: boolean) {
      this.loading = value
    },

    reset() {
      this.balance = 0
      this.balanceHeld = 0
      this.lastFetched = null
      this.loading = false
    },

  }
})
