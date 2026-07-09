import { useApi } from './useApi'
import type { WebResponse } from '~/types/WebResponse'
import type { PageResponse } from '~/types/PageResponse'
import type { FinanceCategoryRequest } from '~/types/finance/FinanceCategoryRequest'
import type { FinanceCategoryResponse } from '~/types/finance/FinanceCategoryResponse'
import type { FinanceJournalRequest } from '~/types/finance/FinanceJournalRequest'
import type { FinanceJournalResponse } from '~/types/finance/FinanceJournalResponse'
import type { FinanceSummaryResponse } from '~/types/finance/FinanceSummaryResponse'

export const useFinanceApi = () => {
  const api = useApi()

  // ===== CATEGORY =====

  const createCategory = async (payload: FinanceCategoryRequest): Promise<FinanceCategoryResponse> => {
    const res = await api<WebResponse<FinanceCategoryResponse>>('/admin/finance/category', {
      method: 'POST',
      body: payload,
    })
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal membuat kategori' })
    }
    return res.data
  }

  const fetchCategories = async (params?: {
    page?: number
    size?: number
    dbCr?: 'CREDIT' | 'DEBIT'
    search?: string
  }): Promise<PageResponse<FinanceCategoryResponse>> => {
    const query: Record<string, unknown> = {
      page: params?.page ?? 0,
      size: params?.size ?? 20,
    }
    if (params?.dbCr) query.dbCr = params.dbCr
    if (params?.search) query.search = params.search
    const res = await api<WebResponse<PageResponse<FinanceCategoryResponse>>>('/admin/finance/category', { query })
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal memuat kategori' })
    }
    return res.data
  }

  const updateCategory = async (id: string, payload: Omit<FinanceCategoryRequest, 'id' | 'db_cr'> & { is_active: boolean }): Promise<FinanceCategoryResponse> => {
    const res = await api<WebResponse<FinanceCategoryResponse>>(`/admin/finance/category/${id}`, {
      method: 'PUT',
      body: payload,
    })
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal mengupdate kategori' })
    }
    return res.data
  }

  const toggleCategory = async (id: string): Promise<void> => {
    const res = await api<WebResponse<null>>(`/admin/finance/category/${id}/toggle`, {
      method: 'PATCH',
    })
    if (res.status !== 'success') {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal mengubah status kategori' })
    }
  }

  // ===== JOURNAL =====

  const createJournal = async (payload: FinanceJournalRequest): Promise<FinanceJournalResponse> => {
    const res = await api<WebResponse<FinanceJournalResponse>>('/admin/finance/journal', {
      method: 'POST',
      body: payload,
    })
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal mencatat jurnal' })
    }
    return res.data
  }

  const fetchJournals = async (params: {
    page?: number
    size?: number
    db_cr?: 'CREDIT' | 'DEBIT'
    category_id?: string
    year?: number | null
    month?: number | null
  }): Promise<PageResponse<FinanceJournalResponse>> => {
    const query: Record<string, unknown> = {
      page: params.page ?? 0,
      size: params.size ?? 20,
    }
    if (params.db_cr) query.db_cr = params.db_cr
    if (params.category_id) query.category_id = params.category_id
    if (params.year) query.year = params.year
    if (params.month) query.month = params.month

    const res = await api<WebResponse<PageResponse<FinanceJournalResponse>>>('/admin/finance/journal', { query })
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal memuat jurnal' })
    }
    return res.data
  }

  const voidJournal = async (id: number, reason: string): Promise<void> => {
    const res = await api<WebResponse<null>>(`/admin/finance/journal/${id}/void`, {
      method: 'PATCH',
      body: { reason },
    })
    if (res.status !== 'success') {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal void jurnal' })
    }
  }

  // ===== SUMMARY & BALANCE =====

  const fetchSummary = async (year?: number | null, month?: number | null): Promise<FinanceSummaryResponse> => {
    const query: Record<string, unknown> = {}
    if (year) query.year = year
    if (month) query.month = month
    const res = await api<WebResponse<FinanceSummaryResponse>>('/admin/finance/summary', { query })
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal memuat summary' })
    }
    return res.data
  }

  const fetchBalance = async (): Promise<number> => {
    const res = await api<WebResponse<number>>('/admin/finance/balance')
    if (res.status !== 'success' || res.data == null) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal memuat saldo' })
    }
    return res.data
  }

  return {
    createCategory,
    updateCategory,
    fetchCategories,
    toggleCategory,
    createJournal,
    fetchJournals,
    voidJournal,
    fetchSummary,
    fetchBalance,
  }
}
