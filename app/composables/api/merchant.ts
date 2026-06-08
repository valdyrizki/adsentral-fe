import type { WebResponse } from "~/types/WebResponse"
import type { MerchantRequest } from "~/types/MerchantRequest"
import type { MerchantResponse } from "~/types/MerchantResponse"
import { useApi } from './useApi'

export const useMerchantApi = () => {
  const api = useApi()

  const buildMerchantFormData = (request: MerchantRequest): FormData => {
    const formData = new FormData()
    if (request.name) formData.append("name", request.name)
    if (request.description) formData.append("description", request.description)
    if (request.banner) formData.append("banner", request.banner as File)
    if (request.logo) formData.append("logo", request.logo as File)
    formData.append("isHoliday", request.is_holiday.toString())
    if (request.country) formData.append("country", request.country)
    if (request.open_time) formData.append("openTime", request.open_time)
    if (request.close_time) formData.append("closeTime", request.close_time)
    return formData
  }

  const registerMerchant = async (request: MerchantRequest) => {
    try {
      const res = await api<WebResponse<MerchantResponse>>('/merchant/create', {
        method: 'POST',
        body: buildMerchantFormData(request),
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

  const updateMerchant = async (request: MerchantRequest) => {
    try {
      const res = await api<WebResponse<MerchantResponse>>('/merchant/update', {
        method: 'PATCH',
        body: buildMerchantFormData(request),
      })
      if (!res || res.status !== 'success') {
        throw createError({ statusCode: 400, statusMessage: res?.message || 'Update Failed' })
      }
      return res.data
    } catch (err: any) {
      console.log(err)
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.statusMessage || 'Update failed, server error',
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

  return { registerMerchant, updateMerchant, fetchMerchantById, fetchMyMerchant }
}
