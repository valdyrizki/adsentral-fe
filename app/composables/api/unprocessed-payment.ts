import { useApi } from './useApi'
import type { WebResponse } from '~/types/WebResponse'
import type { PageResponse } from '~/types/PageResponse'
import type { UnprocessedPaymentResponse, UnprocessedPaymentStatus } from '~/types/payment/UnprocessedPaymentResponse'

// BE bisa membalas snake_case (konvensi proyek) atau camelCase; keduanya dinormalisasi.
const pick = (o: any, snake: string, camel: string) => o?.[snake] ?? o?.[camel] ?? null

const normalizeItem = (o: any): UnprocessedPaymentResponse => ({
  id: o.id,
  payment_id: pick(o, 'payment_id', 'paymentId'),
  gateway_reference: pick(o, 'gateway_reference', 'gatewayReference'),
  amount: Number(o.amount ?? 0),
  reason: o.reason,
  status: o.status,
  created_at: pick(o, 'created_at', 'createdAt'),
  resolved_at: pick(o, 'resolved_at', 'resolvedAt'),
  resolved_by_username: pick(o, 'resolved_by_username', 'resolvedByUsername'),
  resolution_note: pick(o, 'resolution_note', 'resolutionNote'),
})

export interface UnprocessedApiError extends Error {
  status: number
}

const toApiError = (err: any, fallback: string): UnprocessedApiError => {
  const e = new Error(err?.data?.message || err?.statusMessage || err?.message || fallback) as UnprocessedApiError
  e.status = err?.status ?? err?.statusCode ?? err?.response?.status ?? 0
  return e
}

export const useUnprocessedPaymentApi = () => {
  const api = useApi()

  const fetchUnprocessedPayments = async (params: {
    page?: number
    size?: number
    status?: UnprocessedPaymentStatus | null
  }): Promise<PageResponse<UnprocessedPaymentResponse>> => {
    const query: Record<string, unknown> = { page: params.page ?? 0, size: params.size ?? 20 }
    if (params.status) query.status = params.status
    try {
      const res = await api<WebResponse<any>>('/admin/payments/unprocessed', { query })
      if (res.status !== 'success' || !res.data) throw new Error(res.message || 'Gagal memuat data')
      const d = res.data
      return {
        page: d.page,
        size: d.size,
        total_elements: d.total_elements ?? d.totalElements ?? 0,
        total_pages: d.total_pages ?? d.totalPages ?? 0,
        last: d.last,
        content: (d.content ?? []).map(normalizeItem),
      }
    } catch (err: any) {
      throw toApiError(err, 'Gagal memuat pembayaran tidak terproses')
    }
  }

  const resolveUnprocessedPayment = async (id: number, note: string): Promise<UnprocessedPaymentResponse> => {
    try {
      const res = await api<WebResponse<any>>(`/admin/payments/unprocessed/${id}/resolve`, {
        method: 'PATCH',
        body: { note },
      })
      return normalizeItem(res.data)
    } catch (err: any) {
      throw toApiError(err, 'Gagal menandai selesai')
    }
  }

  return { fetchUnprocessedPayments, resolveUnprocessedPayment }
}
