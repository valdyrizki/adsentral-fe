// composables/useOrderDiscussion.ts
import type { ChatResponse } from '~/types/chat/ChatResponse'
import type { ConversationResponse } from '~/types/chat/ConversationResponse'
import type { PageResponse } from '~/types/PageResponse'
import type { WebResponse } from '~/types/WebResponse'

export const useChatApi = () => {
  const config = useRuntimeConfig()
  const useUserStore = useAuthStore()

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'X-API-TOKEN': useUserStore.auth?.token || ''
  })

  const fetchSendChat = async (formData:FormData) => {
    try {
      const res = await $fetch<WebResponse<ChatResponse>>(
        `${config.public.apiBase}/chat/send`,
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
          statusMessage: res?.message || 'Send chat failed',
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

  const fetchBuyerConversation = async (page = 0, size = 10, keyword = '')
  : Promise<PageResponse<ConversationResponse>> => {
    try{
      const res = await $fetch<WebResponse<PageResponse<ConversationResponse>>>(
        `${config.public.apiBase}/chat/buyer/conversation`,
        { headers: getHeaders(),
          query: {
            page,
            size,
            keyword
        },
         },
      )

      if (res.status !== 'success' || !res.data) {
        throw new Error(res.message)
      }

      return res.data

    } catch (err:any) {
      console.error('Failed fetch conversation', err)
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.message || 'Failed to fetch buyer conversation',
      })
    }
  }

  const fetchSellerConversation = async (page = 0, size = 10, keyword = '')
  : Promise<PageResponse<ConversationResponse>> => {
    try{
      const res = await $fetch<WebResponse<PageResponse<ConversationResponse>>>(
        `${config.public.apiBase}/chat/seller/conversation`,
        { headers: getHeaders(),
          query: {
            page,
            size,
            keyword
        },
         },
      )

      if (res.status !== 'success' || !res.data) {
        throw new Error(res.message)
      }

      return res.data

    } catch (err:any) {
      console.error('Failed fetch conversation', err)
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.message || 'Failed to fetch seller conversation',
      })
    }
  }

  const fetchChatByConversation = async (id:number, page = 0, size = 10, keyword = '')
  : Promise<PageResponse<ChatResponse>> => {
    try{
      const res = await $fetch<WebResponse<PageResponse<ChatResponse>>>(
        `${config.public.apiBase}/chat/conversation/${id}`,
        { headers: getHeaders(),
          query: {
            page,
            size,
            keyword
        },
         }
      )

      if (res.status !== 'success' || !res.data) {
        throw new Error(res.message)
      }

      return res.data

    } catch (err:any) {
      console.error('Failed fetch chat by conversation', err)
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.message || 'Failed to fetch chat by conversation',
      })
    }
  }

    

  return {
    fetchBuyerConversation,
    fetchSellerConversation,
    fetchChatByConversation,
    fetchSendChat
  }

}
