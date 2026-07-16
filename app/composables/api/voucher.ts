import type { WebResponse } from '~/types/WebResponse'
import type { PageResponse } from '~/types/PageResponse'
import type { VoucherResponse } from '~/types/voucher/VoucherResponse'
import type { VoucherRequest, VoucherUpdateRequest } from '~/types/voucher/VoucherRequest'
import type { VoucherCheckResponse } from '~/types/voucher/VoucherCheckResponse'
import { useApi } from './useApi'

export const useVoucherApi = () => {
  const api = useApi()

  const fetchAllVouchers = async (params?: {
    page?: number
    size?: number
    keyword?: string
    status?: string
  }): Promise<PageResponse<VoucherResponse>> => {
    const res = await api<WebResponse<PageResponse<VoucherResponse>>>('/admin/voucher', {
      query: {
        page: params?.page ?? 0,
        size: params?.size ?? 20,
        ...(params?.keyword ? { keyword: params.keyword } : {}),
        ...(params?.status && params.status !== 'ALL' ? { status: params.status } : {}),
      },
    })
    if (res.status !== 'success') throw new Error(res.message)
    return res.data!
  }

  const getVoucherByCode = async (code: string): Promise<VoucherResponse> => {
    const res = await api<WebResponse<VoucherResponse>>(`/admin/voucher/${code}`)
    if (res.status !== 'success') throw new Error(res.message)
    return res.data!
  }

  const createVoucher = async (body: VoucherRequest): Promise<VoucherResponse> => {
    const res = await api<WebResponse<VoucherResponse>>('/admin/voucher', {
      method: 'POST',
      body,
    })
    if (res.status !== 'success') throw new Error(res.message)
    return res.data!
  }

  const updateVoucher = async (code: string, body: VoucherUpdateRequest): Promise<VoucherResponse> => {
    const res = await api<WebResponse<VoucherResponse>>(`/admin/voucher/${code}`, {
      method: 'PUT',
      body,
    })
    if (res.status !== 'success') throw new Error(res.message)
    return res.data!
  }

  const suspendVoucher = async (code: string): Promise<VoucherResponse> => {
    const res = await api<WebResponse<VoucherResponse>>(`/admin/voucher/${code}/suspend`, {
      method: 'PATCH',
    })
    if (res.status !== 'success') throw new Error(res.message)
    return res.data!
  }

  const activateVoucher = async (code: string): Promise<VoucherResponse> => {
    const res = await api<WebResponse<VoucherResponse>>(`/admin/voucher/${code}/activate`, {
      method: 'PATCH',
    })
    if (res.status !== 'success') throw new Error(res.message)
    return res.data!
  }

  const fetchPublicVouchers = async (): Promise<VoucherResponse[]> => {
    try {
      const res = await api<WebResponse<VoucherResponse[]>>('/voucher/public')
      if (res.status !== 'success') throw new Error(res.message)
      return res.data ?? []
    } catch (err: any) {
      throw new Error(err.data?.message || err.message || 'Gagal memuat voucher')
    }
  }

  const checkVoucher = async (code: string, amount: number): Promise<VoucherCheckResponse> => {
    try {
      const res = await api<WebResponse<VoucherCheckResponse>>('/voucher/check', {
        query: { code, amount },
      })
      if (res.status !== 'success') throw new Error(res.message)
      return res.data!
    } catch (err: any) {
      throw new Error(err.data?.message || err.message || 'Voucher tidak valid')
    }
  }

  return {
    fetchAllVouchers,
    fetchPublicVouchers,
    getVoucherByCode,
    createVoucher,
    updateVoucher,
    suspendVoucher,
    activateVoucher,
    checkVoucher,
  }
}
