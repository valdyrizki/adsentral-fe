import type { WebResponse } from "~/types/WebResponse"
import type { MerchantRequest } from "~/types/MerchantRequest"
import type { MerchantResponse } from "~/types/MerchantResponse"
import { get } from "@nuxt/ui/runtime/utils/index.js"

// composables/api/Merchant.ts
export const useMerchantApi = () => {
  const config = useRuntimeConfig()
  const useUserStore = useAuthStore()

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'X-API-TOKEN': useUserStore.auth?.token || ''
  })


  // GET Merchant dengan pagination + search
  const registerMerchant = async (request:MerchantRequest) => {
    try {

      const formData = new FormData()
      if (request.name) formData.append("name", request.name)
      if (request.description) formData.append("description", request.description)
      if (request.banner) formData.append("banner", request.banner as File)
      if (request.logo) formData.append("logo", request.logo as File)
      if (request.is_holiday !== undefined) formData.append("is_holiday", request.is_holiday.toString())

      const res = await $fetch<WebResponse<MerchantResponse>>(
        `${config.public.apiBase}/merchant/create`,
        {
          method: 'POST',
          body: formData ,
          headers: {
            'X-API-TOKEN': useUserStore.auth?.token || ''
          }
        }
      )

      if (!res || res.status !== 'success') {
        throw createError({
          statusCode: 400,
          statusMessage: res?.message || 'Create Failed',
        })
      }

      return res.data

    } catch (err: any) {
      console.log(err);
      
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.statusMessage || 'Create failed, server error',
      })
    }
  }

  const fetchMerchantById = async (id : any) : Promise<MerchantResponse> => {
    try{
      const { data, error } = await useFetch<WebResponse<MerchantResponse>>(`${config.public.apiBase}/merchant/get/${id}`, {
        method: 'GET',
        headers: getHeaders(),
        key: `merchant-${id}`, // cache per request
      })

      if (error.value) {
        throw createError({
          statusCode: error.value.statusCode,
          statusMessage: error.value.message || 'Failed to fetch Merchant',
        })
      }

      if (!data.value || data.value.status !== 'success' || !data.value.data) {
        throw createError({
          statusCode: 400,
          statusMessage: data.value?.message || 'Failed to fetch Merchant',
        })
      }

      return data.value.data
    } catch (err:any) {
      console.error('Failed fetch product', err)
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.message || 'Failed to fetch product',
      })
    }
  }
  

  const getMyMerchant = async () => {
    const { data, error } = await useFetch<WebResponse<MerchantRequest>>(`${config.public.apiBase}/merchant`, {
      method: 'GET',
      key: `my-merchant`, // cache per request
      headers: getHeaders(),
    })

    //throw Error
    if (error.value) {
      throw createError({
        statusCode: error.value.statusCode,
        statusMessage: error.value.message || 'Failed to fetch Merchant',
      })
    }

    //throw Error 2
    if(data.value?.status !== 'success'){
      throw createError({
        statusCode: 400,
        statusMessage: data.value?.message || 'Failed to fetch Merchant',
      })
    }
    return data.value?.data
  }

  return { registerMerchant, fetchMerchantById, getMyMerchant }
}
