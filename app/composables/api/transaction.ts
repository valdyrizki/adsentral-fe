import type { TransactionRequest } from "~/types/TransactionRequest"
import type { WebResponse } from "~/types/WebResponse"
import type { PageResponse } from "~/types/PageResponse"
import type { CreateTransactionResponse } from "~/types/CreateTransactionResponse"
import type { TransactionResponse } from "~/types/TransactionResponse"

// composables/api/products.ts
export const useTransactionApi = () => {
  const config = useRuntimeConfig()
  const useUserStore = useAuthStore()


  // GET products dengan pagination + search
  const createTransaction = async (request:TransactionRequest) => {
    try {
      console.log(request);
      
      const res = await $fetch<WebResponse<CreateTransactionResponse>>(
        `${config.public.apiBase}/tx/create`,
        {
          method: 'POST',
          body: request ,
          headers: {
            'Content-Type': 'application/json',
            'X-API-TOKEN': useUserStore.auth?.token || '',
          },
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
      console.log(err);
      
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.statusMessage || 'Transaction failed, server error',
      })
    }
  }

  // GET transaction dengan pagination + search
    const getBuyerTransactions = async (page = 0, size = 10, keyword = '') => {
      const { data, error } = await useFetch<WebResponse<PageResponse<TransactionResponse[]>>>(`${config.public.apiBase}/tx/buyer`, {
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

    // GET transaction dengan pagination + search
    const getTransactionById = async (id: string) => {
      const { data, error } = await useFetch<WebResponse<TransactionResponse>>(`${config.public.apiBase}/tx/get/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-TOKEN': useUserStore.auth?.token || '',
        },
        key: `transaction-${id}`, // cache per request
      })

      //throw Error
      if (error.value) {
        throw createError({
          statusCode: error.value.statusCode,
          statusMessage: error.value.message || 'Failed to fetch transaction',
        })
      }

      //throw Error 2
      if(data.value?.status !== 'success'){
        throw createError({
          statusCode: 400,
          statusMessage: data.value?.message || 'Failed to fetch transaction',
        })
      }
      return data.value?.data
    }

  return { createTransaction, getBuyerTransactions, getTransactionById }
}
