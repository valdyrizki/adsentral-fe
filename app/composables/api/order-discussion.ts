// composables/useOrderDiscussion.ts
import type { OrderDiscussionResponse } from '~/types/order-discussion/OrderDiscussionResponse'
import type { WebResponse } from '~/types/WebResponse'
import { useApi } from './useApi'
import type { TransactionResponse } from '~/types/TransactionResponse'
import type { PageResponse } from '~/types/PageResponse'

export const useOrderDiscussionApi = () => {
  const api = useApi()

  const fetchOrderDiscussionByTxId = async (txId: string, page = 0, size = 20) => {
    try {
      const res = await api<WebResponse<PageResponse<OrderDiscussionResponse>>>(`/order/discussion/transaction/${txId}`, {
        query: { page, size },
      })
      if (res.status !== 'success' || !res.data) {
        throw createError({ statusCode: 400, statusMessage: res.message || 'Failed to fetch order discussions' })
      }
      return res.data
    } catch (err: any) {
      throw createError({ statusCode: err.statusCode || 500, statusMessage: err.message || 'Failed to fetch order discussions' })
    }
  }

  
  const fetchCreateOrderDiscussion = async (formData: FormData) => {
    try {
      const res = await api<WebResponse<OrderDiscussionResponse>>(`/order/discussion/create`, {
        method: 'POST',
        body: formData,
      })

      if (!res || res.status !== 'success') {
        throw createError({
          statusCode: 400,
          statusMessage: res?.message || 'Create Discussion failed',
        })
      }
      return res.data
    } catch (err: any) {
      console.log(err)
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.response._data.message || 'Transaction failed, server error',
      })
    }
  }

  return { fetchOrderDiscussionByTxId, fetchCreateOrderDiscussion }
}
