import type { WebResponse } from "~/types/WebResponse"
import type { MerchantRequest } from "~/types/MerchantRequest"
import type { MerchantResponse } from "~/types/MerchantResponse"
import { useApi } from './useApi'

export const useMerchantApi = () => {
  const api = useApi()

  const registerMerchant = async (request: MerchantRequest) => {
    try {
      const formData = new FormData()
      if (request.name) formData.append("name", request.name)
      if (request.description) formData.append("description", request.description)
      if (request.banner) formData.append("banner", request.banner as File)
      if (request.logo) formData.append("logo", request.logo as File)
      if (request.is_holiday !== undefined) formData.append("is_holiday", request.is_holiday.toString())

      const res = await api<WebResponse<MerchantResponse>>('/merchant/create', {
        method: 'POST',
        body: formData,
      })

      if (!res || res.status !== 'success') {
        throw createError({ statusCode: 400, statusMessage: res?.message || 'Create Failed' })
      }
      return res.data
    } catch (err: any) {
      console.log(err)
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.statusMessage || 'Create failed, server error',
      })
    }
  }

  const fetchMerchantById = async (id: any): Promise<MerchantResponse> => {
    try {
      const res = await api<WebResponse<MerchantResponse>>(`/merchant/get/${id}`)
      if (!res || res.status !== 'success' || !res.data) {
        throw createError({ statusCode: 400, statusMessage: res?.message || 'Failed to fetch Merchant' })
      }
      return res.data
    } catch (err: any) {
      console.error('Failed fetch merchant', err)
      throw createError({ statusCode: err.statusCode || 500, statusMessage: err.message || 'Failed to fetch Merchant' })
    }
  }

  const fetchMyMerchant = async () => {
    try {
      const res = await api<WebResponse<MerchantResponse>>('/merchant/my')
      if (res.status !== 'success' || !res.data) {
        throw createError({ statusCode: 400, statusMessage: res.message || 'Failed to fetch Merchant' })
      }
      return res.data
    } catch (err: any) {
      throw createError({ statusCode: err.statusCode || 500, statusMessage: err.message || 'Failed to fetch Merchant' })
    }
  }

  return { registerMerchant, fetchMerchantById, fetchMyMerchant }
}
