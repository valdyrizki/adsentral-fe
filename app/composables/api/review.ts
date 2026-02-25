// composables/useReview.ts
import type { ReviewRequest } from '~/types/review/ReviewRequest'
import type { ReviewResponse } from '~/types/review/ReviewResponse'
import type { WebResponse } from '~/types/WebResponse'

export const useReviewApi = () => {
  const config = useRuntimeConfig()
  const useUserStore = useAuthStore()

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'X-API-TOKEN': useUserStore.auth?.token || ''
  })

  const fetchReviewByUser = async (productId : number)
  : Promise<ReviewResponse[]> => {
    try{
      const res = await $fetch<WebResponse<ReviewResponse[]>>(
        `${config.public.apiBase}/review/user/${productId}`,
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
        statusMessage: err.message || 'Failed to fetch Review',
      })
    }
  }

  const fetchReviewByMerchant = async (merchantId : number)
  : Promise<ReviewResponse[]> => {
    try{
      const res = await $fetch<WebResponse<ReviewResponse[]>>(
        `${config.public.apiBase}/review/merchant/${merchantId}`,
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
        statusMessage: err.message || 'Failed to fetch Review',
      })
    }
  }

  const fetchReviewByProduct = async (productId : number)
  : Promise<ReviewResponse[]> => {
    try{
      const res = await $fetch<WebResponse<ReviewResponse[]>>(
        `${config.public.apiBase}/review/product/${productId}`,
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
        statusMessage: err.message || 'Failed to fetch Review',
      })
    }
  }

  const fetchReviewByTransaction = async (txId : string)
  : Promise<ReviewResponse[]> => {
    try{
      const res = await $fetch<WebResponse<ReviewResponse[]>>(
        `${config.public.apiBase}/review/transaction/${txId}`,
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
        statusMessage: err.message || 'Failed to fetch Review',
      })
    }
  }

  const fetchCreateReview = async (request:ReviewRequest) => {
    try {
      const res = await $fetch<WebResponse<ReviewResponse>>(
        `${config.public.apiBase}/review/create`,
        {
          method: 'POST',
          body: request,
          headers: {
            'X-API-TOKEN': useUserStore.auth?.token || ''
          },
        }
      )

      if (!res || res.status !== 'success') {
        throw createError({
          statusCode: 400,
          statusMessage: res?.message || 'Review failed',
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

  const fetchUpdateReview = async (request:ReviewRequest) => {
    try {
      const res = await $fetch<WebResponse<ReviewResponse>>(
        `${config.public.apiBase}/review/update`,
        {
          method: 'PATCH',
          body: request,
          headers: {
            'X-API-TOKEN': useUserStore.auth?.token || ''
          },
        }
      )

      if (!res || res.status !== 'success') {
        throw createError({
          statusCode: 400,
          statusMessage: res?.message || 'Review failed',
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
    fetchReviewByUser,
    fetchReviewByMerchant,
    fetchReviewByProduct,
    fetchReviewByTransaction,
    fetchCreateReview,
    fetchUpdateReview
  }

}
