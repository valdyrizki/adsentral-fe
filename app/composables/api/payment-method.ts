// composables/usePaymentMethod.ts
import type { PaymentMethodResponse } from '~/types/payment-method/PaymentMethodResponse'
import type { WebResponse } from '~/types/WebResponse'

export const usePaymentMethodApi = () => {
  const config = useRuntimeConfig()
  const paymentMethodStore = usePaymentMethodStore()

  const fetchPaymentMethod = async () => {
    try{
      paymentMethodStore.setLoading(true)

      const res = await $fetch<WebResponse<PaymentMethodResponse[]>>(
        `${config.public.apiBase}/payment/methods`,
      )

      if (res.status !== 'success') {
        throw new Error(res.message)
      }

      paymentMethodStore.setPaymentMethod(res.data || [])
      return res.data
    } catch (err:any) {
      console.error('Failed fetch Payment Method', err)
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.message || 'Failed to fetch Payment Method',
      })
    } finally {
      paymentMethodStore.setLoading(false)
    }
  }

  return {
    paymentMethod: computed(() => paymentMethodStore.paymentMethod),
    paymentMethodLoading: computed(() => paymentMethodStore.loading),
    fetchPaymentMethod,
  }

}
