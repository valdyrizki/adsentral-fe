// composables/usePaymentMethod.ts
import type { PageResponse } from '~/types/PageResponse'
import type { PaymentMethodResponse } from '~/types/payment-method/PaymentMethodResponse'
import type { WebResponse } from '~/types/WebResponse'

export const usePaymentMethodApi = () => {
  const config = useRuntimeConfig()
  const paymentMethodStore = usePaymentMethodStore()

  const fetchPaymentMethod = async (): Promise<PaymentMethodResponse[]> => {
      const res = await $fetch<WebResponse<PaymentMethodResponse[]>>(
        `${config.public.apiBase}/payment/methods`
      )
  
      if (res.status !== 'success' || !res.data) {
        throw createError({
          statusCode: 400,
          statusMessage: res.message || 'Gagal memuat riwayat',
        })
      }
  
      return res.data
    }

  return {
    paymentMethod: computed(() => paymentMethodStore.paymentMethod),
    paymentMethodLoading: computed(() => paymentMethodStore.loading),
    fetchPaymentMethod,
  }

}
