// composables/useBalance.ts
import { useBalanceStore } from '@/stores/balance'
import type { BalanceResponse } from '~/types/balance/BalanceResponse'
import type { BalanceDetailResponse } from '~/types/balance/BalanceDetailResponse'
import type { WebResponse } from '~/types/WebResponse'
import type { PageResponse } from '~/types/PageResponse'
import { useApi } from './useApi'
import type { DepositRequest } from '~/types/balance/DepositRequest'
import type { StringIdRequest } from '~/types/StringIdRequest'
import type { DepositResponse } from '~/types/balance/DepositResponse'
import type { DepositSubmitResponse } from '~/types/balance/DepositSubmitResponse'

export const useBalanceApi = () => {
  const balanceStore = useBalanceStore()
  const api = useApi()

  const fetchBalance = async (): Promise<BalanceResponse> => {
    const res = await api<WebResponse<BalanceResponse>>(`/balance`)

    if (res.status !== 'success' || !res.data) {
      throw createError({
        statusCode: 400,
        statusMessage: res.message || 'Gagal memuat produk',
      })
    }

    return res.data
  }

  const fetchDepositHistory = async (
    page: number = 0,
    size: number = 10
  ): Promise<PageResponse<DepositResponse>> => {
    const res = await api<WebResponse<PageResponse<DepositResponse>>>(
      '/balance/deposit/history',
      { params: { page, size } }
    )

    if (res.status !== 'success' || !res.data) {
      throw createError({
        statusCode: 400,
        statusMessage: res.message || 'Gagal memuat riwayat',
      })
    }

    return res.data
  }


  const fetchDepositBalance = async (request : DepositRequest ) => {
    const res = await api<WebResponse<DepositSubmitResponse>>('/balance/deposit', {
      method: 'POST',
      body: request,
    })

    if (res.status !== 'success' || !res.data) {
      throw createError({
        statusCode: 400,
        statusMessage: res.message || 'Gagal deposit balance',
      })
    }

    return res.data
  }

  const fetchDepositCancel = async (id: string) => {
    const res = await api<WebResponse>('/balance/deposit/cancel/' + id, {
      method: 'POST',
    })

    console.log(res);
    

    if (res.status !== 'success') {
      throw createError({
        statusCode: 400,
        statusMessage: res.message || 'Gagal cancel deposit',
      })
    }

    return res.data
  }

  return {
    fetchBalance,
    fetchDepositBalance,
    fetchDepositHistory,
    fetchDepositCancel,
  }
}
