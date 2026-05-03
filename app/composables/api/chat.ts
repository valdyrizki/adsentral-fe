// composables/useChat.ts
import type { ChatResponse } from '~/types/chat/ChatResponse'
import type { ConversationResponse } from '~/types/chat/ConversationResponse'
import type { PageResponse } from '~/types/PageResponse'
import type { WebResponse } from '~/types/WebResponse'
import { useApi } from './useApi'

export const useChatApi = () => {
  const api = useApi()

  const fetchSendChat = async (formData: FormData) => {
    try {
      const res = await api<WebResponse<ChatResponse>>('/chat/send', {
        method: 'POST',
        body: formData,
      })
      if (!res || res.status !== 'success') {
        throw createError({ statusCode: 400, statusMessage: res?.message || 'Send chat failed' })
      }
      return res.data
    } catch (err: any) {
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.response._data.message || 'Transaction failed, server error',
      })
    }
  }

  const fetchBuyerConversation = async (page = 0, size = 10, keyword = ''): Promise<PageResponse<ConversationResponse>> => {
    
    try {
      const res = await api<WebResponse<PageResponse<ConversationResponse>>>('/chat/buyer/conversation', {
        query: { page, size, keyword },
      })
      if (res.status !== 'success' || !res.data) throw new Error(res.message)
      return res.data
    } catch (err: any) {
      console.error('Failed fetch conversation', err)
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.message || 'Failed to fetch buyer conversation',
      })
    }
  }

  const fetchSellerConversation = async (page = 0, size = 10, keyword = ''): Promise<PageResponse<ConversationResponse>> => {
    try {
      const res = await api<WebResponse<PageResponse<ConversationResponse>>>('/chat/seller/conversation', {
        query: { page, size, keyword },
      })
      if (res.status !== 'success' || !res.data) throw new Error(res.message)
      return res.data
    } catch (err: any) {
      console.error('Failed fetch conversation', err)
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.message || 'Failed to fetch seller conversation',
      })
    }
  }

  const fetchChatByConversation = async (id: number, page = 0, size = 10, keyword = ''): Promise<PageResponse<ChatResponse>> => {
    try {
      const res = await api<WebResponse<PageResponse<ChatResponse>>>(`/chat/conversation/${id}`, {
        query: { page, size, keyword },
      })
      if (res.status !== 'success' || !res.data) throw new Error(res.message)
      return res.data
    } catch (err: any) {
      console.error('Failed fetch chat by conversation', err)
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.message || 'Failed to fetch chat by conversation',
      })
    }
  }

  return { fetchBuyerConversation, fetchSellerConversation, fetchChatByConversation, fetchSendChat }
}
