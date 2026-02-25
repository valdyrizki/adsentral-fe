// stores/paymentMethod.ts
import { defineStore } from 'pinia'
import type { PaymentMethodResponse } from '~/types/payment-method/PaymentMethodResponse'

interface PaymentMethodState {
  paymentMethod: PaymentMethodResponse[]
  loading: boolean
}

export const usePaymentMethodStore = defineStore('paymentMethod', {
  state: (): PaymentMethodState => ({
    paymentMethod: new Array<PaymentMethodResponse>(),
    loading: false
  }),

  actions: {
    setPaymentMethod(paymentMethod: PaymentMethodResponse[]) {
      this.paymentMethod = paymentMethod
    },

    setLoading(value: boolean) {
      this.loading = value
    },

    reset() {
      this.paymentMethod = new Array<PaymentMethodResponse>()
      this.loading = false
    }
  }
})
