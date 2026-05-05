// composables/useReview.ts
import type { ReviewRequest } from '~/types/review/ReviewRequest'
import type { ReviewResponse } from '~/types/review/ReviewResponse'
import type { PageResponse } from '~/types/PageResponse'
import type { WebResponse } from '~/types/WebResponse'
import { useApi } from './useApi'

export const useReviewApi = () => {
  const api = useApi()

  const fetchReviewByUser = async (productId: number): Promise<ReviewResponse[]> => {
    try {
      const res = await api<WebResponse<ReviewResponse[]>>(`/review/user/${productId}`)
      if (res.status !== 'success' || !res.data) throw new Error(res.message)
      return res.data
    } catch (err: any) {
      console.error('Failed fetch discussion', err)
      throw createError({ statusCode: err.statusCode || 500, statusMessage: err.message || 'Failed to fetch Review' })
    }
  }

  const fetchReviewByMerchant = async (merchantId: number): Promise<ReviewResponse[]> => {
    try {
      const res = await api<WebResponse<ReviewResponse[]>>(`/review/merchant/${merchantId}`)
      if (res.status !== 'success' || !res.data) throw new Error(res.message)
      return res.data
    } catch (err: any) {
      console.error('Failed fetch discussion', err)
      throw createError({ statusCode: err.statusCode || 500, statusMessage: err.message || 'Failed to fetch Review' })
    }
  }

  const fetchReviewByProduct = async (
    productId: number,
    page = 0,
    size = 5,
    keyword?: string,
    rating?: number,
  ): Promise<PageResponse<ReviewResponse>> => {
    try {
      const params: Record<string, any> = { page, size }
      if (keyword) params.keyword = keyword
      if (rating != null) params.rating = rating

      const res = await api<WebResponse<PageResponse<ReviewResponse>>>(`/review/product/${productId}`, { params })
      if (res.status !== 'success' || !res.data) throw new Error(res.message)
      return res.data
    } catch (err: any) {
      console.error('Failed fetch discussion', err)
      throw createError({ statusCode: err.statusCode || 500, statusMessage: err.message || 'Failed to fetch Review' })
    }
  }

  const fetchReviewByTransaction = async (txId: string): Promise<ReviewResponse[]> => {
    try {
      const res = await api<WebResponse<ReviewResponse[]>>(`/review/transaction/${txId}`)
      if (res.status !== 'success' || !res.data) throw new Error(res.message)
      return res.data
    } catch (err: any) {
      console.error('Failed fetch discussion', err)
      throw createError({ statusCode: err.statusCode || 500, statusMessage: err.message || 'Failed to fetch Review' })
    }
  }

  const fetchCreateReview = async (request: ReviewRequest) => {
    try {
      const res = await api<WebResponse<ReviewResponse>>('/review/create', {
        method: 'POST',
        body: request,
      })
      if (!res || res.status !== 'success') {
        throw createError({ statusCode: 400, statusMessage: res?.message || 'Review failed' })
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

  const fetchUpdateReview = async (request: ReviewRequest) => {
    try {
      const res = await api<WebResponse<ReviewResponse>>('/review/update', {
        method: 'PATCH',
        body: request,
      })
      if (!res || res.status !== 'success') {
        throw createError({ statusCode: 400, statusMessage: res?.message || 'Review failed' })
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

  return {
    fetchReviewByUser,
    fetchReviewByMerchant,
    fetchReviewByProduct,
    fetchReviewByTransaction,
    fetchCreateReview,
    fetchUpdateReview,
  }
}
