import type { PageResponse } from '~/types/PageResponse'
import type { WebResponse } from '~/types/WebResponse'
import type { GuaranteeClaimRequest } from '~/types/guarantee/GuaranteeClaimRequest'
import type { GuaranteeResponse } from '~/types/guarantee/GuaranteeResponse'
import { useApi } from './useApi'

export const useGuaranteeApi = () => {
  const api = useApi()

  const fetchCreateGuarantee = async (payload: GuaranteeClaimRequest): Promise<GuaranteeResponse> => {
    const res = await api<WebResponse<GuaranteeResponse>>('/guarantee', {
      method: 'POST',
      body: payload,
    })
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal mengajukan klaim garansi' })
    }
    return res.data
  }

  const fetchGuaranteeByTransaction = async (transactionId: string): Promise<GuaranteeResponse | null> => {
    try {
      const res = await api<WebResponse<GuaranteeResponse>>(`/guarantee/transaction/${transactionId}`)
      if (res.status !== 'success' || !res.data) return null
      return res.data
    } catch {
      return null
    }
  }

  const fetchMyGuarantees = async (
    page = 0,
    size = 20,
  ): Promise<PageResponse<GuaranteeResponse>> => {
    const res = await api<WebResponse<PageResponse<GuaranteeResponse>>>('/guarantee', {
      query: { page, size },
    })
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal memuat riwayat garansi' })
    }
    return res.data
  }

  // ===== SELLER =====

  const fetchSellerGuarantees = async (
    page = 0,
    size = 20,
  ): Promise<PageResponse<GuaranteeResponse>> => {
    const res = await api<WebResponse<PageResponse<GuaranteeResponse>>>('/seller/guarantee', {
      query: {
        page,
        size,
      },
    })
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal memuat klaim garansi' })
    }
    return res.data
  }

  const fetchGuaranteeById = async (guaranteeId: string): Promise<GuaranteeResponse> => {
    const res = await api<WebResponse<GuaranteeResponse>>(`/guarantee/${guaranteeId}`)
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal memuat detail garansi' })
    }
    return res.data
  }

  const fetchReviewGuarantee = async (
    guaranteeId: string,
    accept: boolean,
    sellerDescription?: string,
  ): Promise<GuaranteeResponse> => {
    const res = await api<WebResponse<GuaranteeResponse>>(`/seller/guarantee/${guaranteeId}/review`, {
      method: 'POST',
      body: { accept, seller_description: sellerDescription },
    })
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || (accept ? 'Gagal menerima klaim garansi' : 'Gagal menolak klaim garansi') })
    }
    return res.data
  }

  const fetchSendGuarantee = async (guaranteeId: string, formData: FormData): Promise<GuaranteeResponse> => {
    const res = await api<WebResponse<GuaranteeResponse>>(`/seller/guarantee/${guaranteeId}/send`, {
      method: 'POST',
      body: formData,
    })
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal mengirim akun garansi' })
    }
    return res.data
  }

  return {
    fetchCreateGuarantee,
    fetchGuaranteeByTransaction,
    fetchMyGuarantees,
    fetchSellerGuarantees,
    fetchGuaranteeById,
    fetchReviewGuarantee,
    fetchSendGuarantee,
  }
}
