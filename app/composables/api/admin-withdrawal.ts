import { useApi } from './useApi'
import type { WebResponse } from '~/types/WebResponse'
import type { PageResponse } from '~/types/PageResponse'
import type { AdminWithdrawalResponse } from '~/types/balance/AdminWithdrawalResponse'
import type { SellerTransactionSumResponse } from '~/types/balance/SellerTransactionSumResponse'
import type { DepositSumResponse } from '~/types/balance/DepositSumResponse'
import type { WithdrawalSumResponse } from '~/types/balance/WithdrawalSumResponse'

export const useAdminWithdrawalApi = () => {
  const api = useApi()

  const fetchSellerTransactionSum = async (
    sellerId: number,
    status?: string
  ): Promise<SellerTransactionSumResponse> => {
    const params: Record<string, any> = {}
    if (status) params.status = status

    const res = await api<WebResponse<SellerTransactionSumResponse>>(
      `/tx/admin/seller/${sellerId}/sum`,
      { params }
    )

    if (res.status !== 'success' || !res.data) {
      throw createError({
        statusCode: 400,
        statusMessage: res.message || 'Gagal memuat total transaksi seller',
      })
    }

    return res.data
  }

  const fetchSellerDepositSum = async (
    userId: number,
    status?: string
  ): Promise<DepositSumResponse> => {
    const params: Record<string, any> = {}
    if (status) params.status = status

    const res = await api<WebResponse<DepositSumResponse>>(
      `/balance/admin/deposit/${userId}/sum`,
      { params }
    )

    if (res.status !== 'success' || !res.data) {
      throw createError({
        statusCode: 400,
        statusMessage: res.message || 'Gagal memuat total deposit seller',
      })
    }

    return res.data
  }

  const fetchSellerWithdrawalSum = async (userId: number, status?: string): Promise<WithdrawalSumResponse> => {
    const params: Record<string, any> = {}
    if (status) params.status = status

    const res = await api<WebResponse<WithdrawalSumResponse>>(`/admin/withdrawal/${userId}/sum`, { params })

    if (res.status !== 'success' || !res.data) {
      throw createError({
        statusCode: 400,
        statusMessage: res.message || 'Gagal memuat total penarikan seller',
      })
    }

    return res.data
  }

  const fetchWithdrawalDetail = async (id: string): Promise<AdminWithdrawalResponse> => {
    const res = await api<WebResponse<AdminWithdrawalResponse>>(`/admin/withdrawal/${id}`)

    if (res.status !== 'success' || !res.data) {
      throw createError({
        statusCode: 400,
        statusMessage: res.message || 'Gagal memuat detail penarikan',
      })
    }

    return res.data
  }

  const fetchAllWithdrawals = async (
    page: number = 0,
    size: number = 20,
    status: string = 'ALL'
  ): Promise<PageResponse<AdminWithdrawalResponse>> => {
    const params: Record<string, any> = { page, size }
    if (status !== 'ALL') params.status = status

    const res = await api<WebResponse<PageResponse<AdminWithdrawalResponse>>>(
      '/admin/withdrawal',
      { params }
    )

    if (res.status !== 'success' || !res.data) {
      throw createError({
        statusCode: 400,
        statusMessage: res.message || 'Gagal memuat data penarikan',
      })
    }

    return res.data
  }

  const approveWithdrawal = async (id: string, adminFee: number): Promise<void> => {
    const res = await api<WebResponse>(`/admin/withdrawal/${id}/complete`, {
      method: 'PATCH',
      body: { admin_fee: adminFee },
    })

    if (res.status !== 'success') {
      throw createError({
        statusCode: 400,
        statusMessage: res.message || 'Gagal menyetujui penarikan',
      })
    }
  }

  const rejectWithdrawal = async (id: string, adminNotes: string): Promise<void> => {
    const res = await api<WebResponse>(`/admin/withdrawal/${id}/reject`, {
      method: 'PATCH',
      body: { admin_notes: adminNotes },
    })

    if (res.status !== 'success') {
      throw createError({
        statusCode: 400,
        statusMessage: res.message || 'Gagal menolak penarikan',
      })
    }
  }

  return { fetchSellerTransactionSum, fetchSellerDepositSum, fetchSellerWithdrawalSum, fetchWithdrawalDetail, fetchAllWithdrawals, approveWithdrawal, rejectWithdrawal }
}
