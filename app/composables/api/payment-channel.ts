import { useApi } from './useApi'
import type { PageResponse } from '~/types/PageResponse'
import type { PaymentChannelResponse } from '~/types/payment-channel/PaymentChannelResponse'
import type { WebResponse } from '~/types/WebResponse'

export const usePaymentChannelApi = () => {
  const api = useApi()

  const fetchAllPaymentChannels = async (params?: {
    page?: number
    size?: number
    keyword?: string
    paymentMethodId?: string
    status?: string
  }): Promise<PageResponse<PaymentChannelResponse>> => {
    const query: Record<string, unknown> = {
      page: params?.page ?? 0,
      size: params?.size ?? 20,
    }
    if (params?.keyword) query.keyword = params.keyword
    if (params?.paymentMethodId) query.paymentMethodId = params.paymentMethodId
    if (params?.status && params.status !== 'ALL') query.status = params.status

    const res = await api<WebResponse<PageResponse<PaymentChannelResponse>>>('/payment/channel/all', { query })
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal memuat payment channel' })
    }
    return res.data
  }

  const fetchActiveChannelsByMethod = async (paymentMethodId: string): Promise<PaymentChannelResponse[]> => {
    const res = await api<WebResponse<PaymentChannelResponse[]>>(`/payment/channel/${paymentMethodId}`)
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal memuat channel' })
    }
    return res.data
  }

  const updatePaymentChannelName = async (code: string, name: string): Promise<PaymentChannelResponse | null> => {
    const res = await api<WebResponse<PaymentChannelResponse>>(`/payment/channel/update/${code}`, {
      method: 'PATCH',
      body: { name },
    })
    if (res.status !== 'success') {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal mengupdate nama channel' })
    }
    return res.data ?? null
  }

  const syncTripayChannels = async (): Promise<PaymentChannelResponse[]> => {
    const res = await api<WebResponse<PaymentChannelResponse[]>>('/payment/channel/sync-tripay', {
      method: 'POST',
    })
    if (res.status !== 'success') {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal sync channel dari Tripay' })
    }
    return res.data ?? []
  }

  return {
    fetchAllPaymentChannels,
    fetchActiveChannelsByMethod,
    updatePaymentChannelName,
    syncTripayChannels,
  }
}
