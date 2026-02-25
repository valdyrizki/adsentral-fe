// stores/balance.ts
import { defineStore } from 'pinia'
import type { DepositResponse } from '~/types/balance/DepositResponse'
import type { PageResponse } from '~/types/PageResponse'

interface BalanceState {
  id: string
  balance: number
  balanceHeld: number
  depositHistory: PageResponse<DepositResponse>
  loading: boolean
}

export const useBalanceStore = defineStore('balance', {
  state: (): BalanceState => ({
    id: '',
    balance: 0,
    balanceHeld: 0,
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

  actions: {
    setBalance(balance: number) {
      this.balance = balance
    },

    setBalanceDetail(id : string, balance: number, balanceHeld: number) {
      this.id = id
      this.balance = balance
      this.balanceHeld = balanceHeld
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
    }
  }
})
