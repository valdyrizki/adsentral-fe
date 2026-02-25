import type { TransactionRequest } from "~/types/TransactionRequest"
import type { WebResponse } from "~/types/WebResponse"
import type { PageResponse } from "~/types/PageResponse"
import type { CreateTransactionResponse } from "~/types/CreateTransactionResponse"
import type { TransactionResponse } from "~/types/TransactionResponse"

// composables/api/products.ts
export const useTransactionApi = () => {
  const config = useRuntimeConfig()
  const useUserStore = useAuthStore()

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'X-API-TOKEN': useUserStore.auth?.token || ''
  })
  
  // GET products dengan pagination + search
  const createTransaction = async (request:TransactionRequest) => {
    try {
      console.log(request);
      
      const res = await $fetch<WebResponse<CreateTransactionResponse>>(
        `${config.public.apiBase}/tx/create`,
        {
          method: 'POST',
          body: request ,
          headers: getHeaders(),
        }
      )

      if (!res || res.status !== 'success' || !res.data) {
        throw createError({
          statusCode: 400,
          statusMessage: res?.message || 'Transaction failed',
        })
      }

      return res.data

    } catch (err: any) {
      console.log(err.response._data.message);
      
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.response._data.message || 'Transaction failed, server error',
      })
    }
  }

  // GET transaction dengan pagination + search
    const getBuyerTransactions = async (page = 0, size = 10, keyword = '') => {
      const { data, error } = await useFetch<WebResponse<PageResponse<TransactionResponse>>>(`${config.public.apiBase}/tx/buyer`, {
        method: 'GET',
        query: {
          page,
          size,
          keyword
        },
        headers: {
            'Content-Type': 'application/json',
            'X-API-TOKEN': useUserStore.auth?.token || '',
          },
        key: `transactions-${page}-${size}-${keyword}`, // cache per request
      })
  
      //throw Error
      if (error.value) {
        throw createError({
          statusCode: error.value.statusCode,
          statusMessage: error.value.message || 'Failed to fetch transactions',
        })
      }
  
      //throw Error 2
      if(data.value?.status !== 'success'){
        throw createError({
          statusCode: 400,
          statusMessage: data.value?.message || 'Failed to fetch transactions',
        })
      }
      return data.value?.data
    }

  const fetchTransactionById = async (txId: string)
  : Promise<TransactionResponse> => {
    try{
      const res = await $fetch<WebResponse<TransactionResponse>>(
      `${config.public.apiBase}/tx/get/${txId}`,
      {
        headers: getHeaders(),
      }
    )
    
    if (!res.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to fetch transactions',
      })
    }
    
    return res.data

    } 
    catch (err:any) {
      console.error('Failed fetch transactions', err)
      throw createError({ 
        statusCode: err.statusCode || 500,
        statusMessage: err.message || 'Failed to fetch transactions',
      })
    }

  }

  const fetchTxSeller = async (
    page: number,
    size: number,
    search: string
  ): Promise<PageResponse<TransactionResponse>> => {
    try{
      const res = await $fetch<WebResponse<PageResponse<TransactionResponse>>>(
      `${config.public.apiBase}/tx/seller`,
      {
        headers: getHeaders(),
        query: {
          page,
          size,
          search
        }
      }
    )
    
    if (!res.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to fetch transactions',
      })
    }
    
    return res.data

    } 
    catch (err:any) {
      console.error('Failed fetch transactions', err)
      throw createError({ 
        statusCode: err.statusCode || 500,
        statusMessage: err.message || 'Failed to fetch transactions',
      })
    }

  }

  const fetchConfirmTx = async (txId: string): Promise<void> => {
    const res = await $fetch<WebResponse<TransactionResponse>>(
      `${config.public.apiBase}/tx/confirm/${txId}`,
      {
        method: 'PATCH',
        headers: getHeaders()
      }
    )

    if (res.status !== 'success') {
      throw new Error(res.message)
    }
  }

  const fetchRejectTx = async (txId: string, reason: string): Promise<void> => {
    const res = await $fetch<WebResponse<TransactionResponse>>(
      `${config.public.apiBase}/tx/reject/${txId}`,
      {
        method: 'PATCH',
        headers: getHeaders(),
        body: {
          reason
        }
      }
    )

    if (res.status !== 'success') {
      throw new Error(res.message)
    }
  }

  const fetchAcceptOrder = async (txId: string): Promise<void> => {
    const res = await $fetch<WebResponse<TransactionResponse>>(
      `${config.public.apiBase}/tx/order/accept/${txId}`,
      {
        method: 'PATCH',
        headers: getHeaders(),
      }
    )

    if (res.status !== 'success') {
      throw new Error(res.message)
    }
  }

  const fetchRejectOrder = async (txId: string, reason: string): Promise<void> => {
    const res = await $fetch<WebResponse<TransactionResponse>>(
      `${config.public.apiBase}/tx/order/reject/${txId}`,
      {
        method: 'PATCH',
        headers: getHeaders(),
        body: {
          reason
        }
      }
    )

    if (res.status !== 'success') {
      throw new Error(res.message)
    }
  }

  const fetchCancelTxRequest = async (txId: string, reason: string): Promise<void> => {
    const res = await $fetch<WebResponse<TransactionResponse>>(
      `${config.public.apiBase}/tx/cancel/request/${txId}`,
      {
        method: 'PATCH',
        headers: getHeaders(),
        body: {
          reason
        }
      }
    )

    if (res.status !== 'success') {
      throw new Error(res.message)
    }
  }

  const fetchRejectCancelRequest = async (txId: string): Promise<void> => {
    const res = await $fetch<WebResponse<TransactionResponse>>(
      `${config.public.apiBase}/tx/cancel/reject/${txId}`,
      {
        method: 'PATCH',
        headers: getHeaders(),
      }
    )

    if (res.status !== 'success') {
      throw new Error(res.message)
    }
  }

  const fetchAcceptCancelRequest = async (txId: string): Promise<void> => {
    const res = await $fetch<WebResponse<TransactionResponse>>(
      `${config.public.apiBase}/tx/cancel/accept/${txId}`,
      {
        method: 'PATCH',
        headers: getHeaders(),
      }
    )

    if (res.status !== 'success') {
      throw new Error(res.message)
    }
  }

  const fetchArbitrageRequest = async (txId: string, reason: string): Promise<void> => {
    const res = await $fetch<WebResponse<TransactionResponse>>(
      `${config.public.apiBase}/tx/arbitrage/${txId}`,
      {
        method: 'PATCH',
        headers: getHeaders(),
        body: {
          reason
        }
      }
    )

    if (res.status !== 'success') {
      throw new Error(res.message)
    }
  }
  



  return { 
    createTransaction, 
    getBuyerTransactions, 
    fetchTransactionById,
    fetchTxSeller,
    fetchConfirmTx, 
    fetchRejectTx, 
    fetchAcceptOrder, 
    fetchRejectOrder,
    fetchCancelTxRequest,
    fetchRejectCancelRequest,
    fetchAcceptCancelRequest,
    fetchArbitrageRequest
  }
}
