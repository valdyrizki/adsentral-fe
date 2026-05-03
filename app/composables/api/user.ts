import type { WebResponse } from "~/types/WebResponse"
import type { UserRequest } from "~/types/UserRequest"
import type { UserResponse } from "~/types/UserResponse"
import type { RegisterRequest } from "~/types/RegisterRequest"
import { useApi } from './useApi'

export const useUserApi = () => {
  const api = useApi()

  const registerUser = async (request: RegisterRequest) => {
    try {
      const res = await api<WebResponse>('/user/register', {
        method: 'POST',
        body: request,
      })
      console.log(res)
      if (!res || res.status !== 'success') {
        throw createError({
          statusCode: 400,
          statusMessage: res?.message || 'Register User Failed',
        })
      }
      return res.data
    } catch (err: any) {
      console.log(err.data)
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.data.message || 'Register User failed, server error',
      })
    }
  }

  const updateProfile = async (formData: FormData) => {
    try {
      

      const res = await api<WebResponse<UserResponse>>('/user/profile', {
        method: 'PATCH',
        body: formData,
      })

      if (!res || res.status !== 'success' || !res.data) {
        throw createError({
          statusCode: 400,
          statusMessage: res?.message || 'Update User Failed',
        })
      }
      return res.data
    } catch (err: any) {
      console.log(err)
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.statusMessage || 'Update User failed, server error',
      })
    }
  }

  const fetchMe = async (): Promise<UserResponse> => {
      const res = await api<WebResponse<UserResponse>>(`/user/profile`)
  
      if (res.status !== 'success' || !res.data) {
        throw createError({
          statusCode: 400,
          statusMessage: res.message || 'Gagal memuat produk',
        })
      }
  
      return res.data
    }

  return { registerUser, updateProfile, fetchMe }
}
