// composables/usePaymentMethod.ts
import { useApi } from './useApi'
import type { PaymentMethodRequest } from '~/types/payment-method/PaymentMethodRequest'
import type { PaymentMethodResponse } from '~/types/payment-method/PaymentMethodResponse'
import type { WebResponse } from '~/types/WebResponse'

export const usePaymentMethodApi = () => {
  const config = useRuntimeConfig()
  const api = useApi()
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

      paymentMethodStore.setPaymentMethod(res.data)
      return res.data
    }

  // ===== ADMIN CRUD =====

  const fetchAllPaymentMethods = async (): Promise<PaymentMethodResponse[]> => {
    const res = await api<WebResponse<PaymentMethodResponse[]>>('/payment/method/all')
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal memuat metode pembayaran' })
    }
    return res.data
  }

  const fetchPaymentMethodById = async (id: string): Promise<PaymentMethodResponse> => {
    const res = await api<WebResponse<PaymentMethodResponse>>(`/payment/method/get/${id}`)
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal memuat metode pembayaran' })
    }
    return res.data
  }

  const createPaymentMethod = async (payload: PaymentMethodRequest): Promise<PaymentMethodResponse> => {
    const res = await api<WebResponse<PaymentMethodResponse>>('/payment/method/create', {
      method: 'POST',
      body: payload,
    })
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal membuat metode pembayaran' })
    }
    return res.data
  }

  const updatePaymentMethod = async (id: string, payload: PaymentMethodRequest): Promise<PaymentMethodResponse | null> => {
    const res = await api<WebResponse<PaymentMethodResponse>>(`/payment/method/update/${id}`, {
      method: 'PATCH',
      body: payload,
    })
    if (res.status !== 'success') {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal mengupdate metode pembayaran' })
    }
    return res.data ?? null
  }

  const suspendPaymentMethod = async (id: string): Promise<void> => {
    const res = await api<WebResponse<null>>(`/payment/method/suspend/${id}`, {
      method: 'PATCH',
    })
    if (res.status !== 'success') {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal menonaktifkan metode pembayaran' })
    }
  }

  const activatePaymentMethod = async (id: string): Promise<void> => {
    const res = await api<WebResponse<null>>(`/payment/method/activate/${id}`, {
      method: 'PATCH',
    })
    if (res.status !== 'success') {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal mengaktifkan metode pembayaran' })
    }
  }

  return {
    paymentMethod: computed(() => paymentMethodStore.paymentMethod),
    paymentMethodLoading: computed(() => paymentMethodStore.loading),
    fetchPaymentMethod,
    fetchAllPaymentMethods,
    fetchPaymentMethodById,
    createPaymentMethod,
    updatePaymentMethod,
    suspendPaymentMethod,
    activatePaymentMethod,
  }

}
