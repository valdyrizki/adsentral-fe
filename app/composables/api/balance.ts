// composables/useBalance.ts
import { useBalanceStore } from '@/stores/balance'
import type { BalanceResponse } from '~/types/balance/BalanceResponse'
import type { BalanceDetailResponse } from '~/types/balance/BalanceDetailResponse'
import type { WebResponse } from '~/types/WebResponse'
import type { DepositResponse } from '~/types/balance/DepositResponse'
import type { PageResponse } from '~/types/PageResponse'

export const useBalanceApi = () => {
  const config = useRuntimeConfig()
  const useUserStore = useAuthStore()
  const balanceStore = useBalanceStore()

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'X-API-TOKEN': useUserStore.auth?.token || ''
  })

  const fetchBalance = async () => {
    try{
      balanceStore.setLoading(true)

      const res = await $fetch<WebResponse<BalanceResponse>>(
        `${config.public.apiBase}/balance`,
        { headers: getHeaders() }
      )

      if (res.status !== 'success') {
        throw new Error(res.message)
      }

      balanceStore.setBalance(res.data?.balance || 0)
      return res.data
    } catch (err:any) {
      console.error('Failed fetch balance', err)
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.message || 'Failed to fetch balance',
      })
    } finally {
      balanceStore.setLoading(false)
    }
  }

  const getBalanceDetail = async () => {
    const { data, error } = await useFetch<WebResponse<BalanceDetailResponse[]>>(`${config.public.apiBase}/balance/detail`, {
      method: 'GET',
      headers: getHeaders(),
      key: `my-balance-detail`, // cache per request
    })

    //throw Error
    if (error.value) {
      throw createError({
        statusCode: error.value.statusCode,
        statusMessage: error.value.message || 'Failed to fetch balance',
      })
    }

    //throw Error 2
    if(data.value?.status !== 'success'){
      throw createError({
        statusCode: 400,
        statusMessage: data.value?.message || 'Failed to fetch balance',
      })
    }
    return data.value?.data
  }

  const fetchDepositHistory = async (page = 0, size = 10, keyword = '') => {
    try {
      balanceStore.setLoading(true)

      const res = await $fetch<WebResponse<PageResponse<DepositResponse>>>(
        `${config.public.apiBase}/balance/deposit/history`,
        {
          headers: getHeaders(),
          query: { page, size }
        }
      )

      if (res.status !== 'success') {
        throw new Error(res.message)
      }

      balanceStore.setDepositHistory(res.data || {
        page: 0,
        size: 0,
        content: [],
        total_elements: 0,
        total_pages: 0,
        last: true
      })

      return res.data
    } finally {
      balanceStore.setLoading(false)
    }
    
  }

  const fetchDepositBalance = async (amount: number, paymentMethod: string) => {
    const res = await $fetch<WebResponse>(
      `${config.public.apiBase}/balance/deposit`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: {
          amount,
          payment_method:paymentMethod // konsisten camelCase
        }
      }
    )

    if (res.status !== 'success') {
      throw new Error(res.message)
    }

    // reload history + balance
    await Promise.all([
      fetchDepositHistory()
    ])

    return res.data
  }


  return {
    balance: computed(() => balanceStore.balance),
    balanceHeld: computed(() => balanceStore.balanceHeld),
    depositHistory: computed(() => balanceStore.depositHistory),
    balanceLoading: computed(() => balanceStore.loading),
    fetchBalance,
    getBalanceDetail,
    fetchDepositBalance,
    fetchDepositHistory
  }

}
