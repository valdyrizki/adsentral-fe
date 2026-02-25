// composables/useOrderDiscussion.ts
import type { OrderDiscussionRequest } from '~/types/order-discussion/OrderDiscussionRequest'
import type { OrderDiscussionResponse } from '~/types/order-discussion/OrderDiscussionResponse'
import type { WebResponse } from '~/types/WebResponse'

export const useOrderDiscussionApi = () => {
  const config = useRuntimeConfig()
  const useUserStore = useAuthStore()

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'X-API-TOKEN': useUserStore.auth?.token || ''
  })

  const fetchOrderDiscussionByTxId = async (txId : string)
  : Promise<OrderDiscussionResponse[]> => {
    try{
      const res = await $fetch<WebResponse<OrderDiscussionResponse[]>>(
        `${config.public.apiBase}/order/discussion/transaction/${txId}`,
        { headers: getHeaders() }
      )

      if (res.status !== 'success' || !res.data) {
        throw new Error(res.message)
      }

      return res.data

    } catch (err:any) {
      console.error('Failed fetch discussion', err)
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.message || 'Failed to fetch orderDiscussion',
      })
    }
  }

    const fetchCreateOrderDiscussion = async (formData:FormData) => {
      try {
        const res = await $fetch<WebResponse<OrderDiscussionResponse>>(
          `${config.public.apiBase}/order/discussion/create`,
          {
            method: 'POST',
            body: formData,
            headers: {
              'X-API-TOKEN': useUserStore.auth?.token || ''
            },
          }
        )
  
        if (!res || res.status !== 'success') {
          throw createError({
            statusCode: 400,
            statusMessage: res?.message || 'Create Discussion failed',
          })
        }
  
        return res.data
  
      } catch (err: any) {
        console.log(err);
        
        throw createError({
          statusCode: err.statusCode || 500,
          statusMessage: err.response._data.message || 'Transaction failed, server error',
        })
      }
    }

  return {
    fetchOrderDiscussionByTxId,
    fetchCreateOrderDiscussion
  }

}
