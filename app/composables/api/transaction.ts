import type { TransactionRequest } from "~/types/TransactionRequest"
import type { TransactionResponse } from "~/types/TransactionResponse"
import type { WebResponse } from "~/types/WebResponse"

// composables/api/products.ts
export const useTransactionApi = () => {
  const config = useRuntimeConfig()
  const useUserStore = useAuthStore()


  // GET products dengan pagination + search
  const createTransaction = async (request:TransactionRequest) => {
    try {
      console.log(request);
      
      const res = await $fetch<WebResponse<TransactionResponse>>(
        `${config.public.apiBase}/tx/create`,
        {
          method: 'POST',
          body: request ,
          headers: {
            'Content-Type': 'application/json',
            'X-API-TOKEN': useUserStore.user?.token || '',
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

  return { createTransaction }
}
