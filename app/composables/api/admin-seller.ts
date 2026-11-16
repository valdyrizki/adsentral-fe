import type { PageResponse } from '~/types/PageResponse'
import type { WebResponse } from '~/types/WebResponse'
import type { GuaranteeResponse, GuaranteeStatus } from '~/types/guarantee/GuaranteeResponse'
import type { BalanceLogResponse } from '~/types/balance/BalanceLogResponse'
import type { BankAccountResponse } from '~/types/bank-account/BankAccountResponse'
import type { AdminSellerSummaryResponse } from '~/types/seller-summary/AdminSellerSummaryResponse'
import { useApi } from './useApi'

/** Data seller untuk admin/CS tanpa akses DB (BE EP06-08). Semua read-only; rekening tercatat di audit BE. */
export const useAdminSellerApi = () => {
  const api = useApi()

  const fetchAdminGuarantees = async (params: {
    page?: number; size?: number; status?: GuaranteeStatus | 'ALL'; merchantId?: number; transactionId?: string
  }): Promise<PageResponse<GuaranteeResponse>> => {
    const query: Record<string, any> = { page: params.page ?? 0, perPage: params.size ?? 20 }
    if (params.status && params.status !== 'ALL') query.status = params.status
    if (params.merchantId) query.merchant_id = params.merchantId
    if (params.transactionId) query.transaction_id = params.transactionId
    const res = await api<WebResponse<PageResponse<GuaranteeResponse>>>('/admin/guarantee', { query })
    if (res.status !== 'success' || !res.data) throw new Error(res.message || 'Gagal memuat garansi')
    return res.data
  }

  const fetchUserBalanceLog = async (userId: number, page = 0, size = 10): Promise<PageResponse<BalanceLogResponse>> => {
    const res = await api<WebResponse<PageResponse<BalanceLogResponse>>>(`/admin/balance/log/${userId}`, { query: { page, size } })
    if (res.status !== 'success' || !res.data) throw new Error(res.message || 'Gagal memuat mutasi saldo')
    return res.data
  }

  const fetchSellerSummary = async (sellerId: number): Promise<AdminSellerSummaryResponse> => {
    const res = await api<WebResponse<AdminSellerSummaryResponse>>(`/admin/seller/${sellerId}/summary`)
    if (res.status !== 'success' || !res.data) throw new Error(res.message || 'Gagal memuat ringkasan seller')
    return res.data
  }

  /** Nomor rekening penuh; setiap akses tercatat di audit BE (VIEW_BANK_ACCOUNT). 404 = belum menyimpan rekening. */
  const fetchSellerBankAccount = async (userId: number): Promise<BankAccountResponse> => {
    const res = await api<WebResponse<BankAccountResponse>>(`/admin/bank-account/${userId}`)
    if (res.status !== 'success' || !res.data) throw new Error(res.message || 'Gagal memuat rekening')
    return res.data
  }

  return { fetchAdminGuarantees, fetchUserBalanceLog, fetchSellerSummary, fetchSellerBankAccount }
}
