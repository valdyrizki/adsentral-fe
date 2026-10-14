import { useApi } from './useApi'
import type { WebResponse } from '~/types/WebResponse'
import type { PageResponse } from '~/types/PageResponse'
import type { FailedJournalResponse, FailedJournalStatus } from '~/types/finance/FailedJournalResponse'

// BE bisa membalas snake_case (konvensi proyek) atau camelCase; keduanya dinormalisasi.
const pick = (o: any, snake: string, camel: string) => o?.[snake] ?? o?.[camel] ?? null

const normalizeItem = (o: any): FailedJournalResponse => ({
  id: o.id,
  category_id: pick(o, 'category_id', 'categoryId'),
  amount: Number(o.amount ?? 0),
  ref_id: pick(o, 'ref_id', 'refId'),
  description: o.description ?? null,
  error_message: pick(o, 'error_message', 'errorMessage'),
  status: o.status,
  retry_count: pick(o, 'retry_count', 'retryCount') ?? 0,
  created_at: pick(o, 'created_at', 'createdAt'),
  resolved_at: pick(o, 'resolved_at', 'resolvedAt'),
  resolved_by_username: pick(o, 'resolved_by_username', 'resolvedByUsername'),
  resolution_note: pick(o, 'resolution_note', 'resolutionNote'),
})

export interface ApiError extends Error {
  status: number
}

// Ubah error ofetch menjadi Error dengan `status` HTTP dan `message` dari BE.
const toApiError = (err: any, fallback: string): ApiError => {
  const e = new Error(err?.data?.message || err?.statusMessage || err?.message || fallback) as ApiError
  e.status = err?.status ?? err?.statusCode ?? err?.response?.status ?? 0
  return e
}

export const useFailedJournalApi = () => {
  const api = useApi()

  const fetchFailedJournals = async (params: {
    page?: number
    size?: number
    status?: FailedJournalStatus | null
  }): Promise<PageResponse<FailedJournalResponse>> => {
    const query: Record<string, unknown> = { page: params.page ?? 0, size: params.size ?? 20 }
    if (params.status) query.status = params.status
    try {
      const res = await api<WebResponse<any>>('/admin/finance/failed-journals', { query })
      if (res.status !== 'success' || !res.data) throw new Error(res.message || 'Gagal memuat jurnal gagal')
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
      throw toApiError(err, 'Gagal memuat jurnal gagal')
    }
  }

  const fetchPendingCount = async (): Promise<number> => {
    const res = await api<WebResponse<number>>('/admin/finance/failed-journals/pending-count')
    return Number(res.data ?? 0)
  }

  const retryFailedJournal = async (id: number): Promise<FailedJournalResponse> => {
    try {
      const res = await api<WebResponse<any>>(`/admin/finance/failed-journals/${id}/retry`, { method: 'POST' })
      return normalizeItem(res.data)
    } catch (err: any) {
      throw toApiError(err, 'Gagal mencatat ulang jurnal')
    }
  }

  const dismissFailedJournal = async (id: number, note: string): Promise<FailedJournalResponse> => {
    try {
      const res = await api<WebResponse<any>>(`/admin/finance/failed-journals/${id}/dismiss`, {
        method: 'PATCH',
        body: { note },
      })
      return normalizeItem(res.data)
    } catch (err: any) {
      throw toApiError(err, 'Gagal mengabaikan jurnal')
    }
  }

  return { fetchFailedJournals, fetchPendingCount, retryFailedJournal, dismissFailedJournal }
}
