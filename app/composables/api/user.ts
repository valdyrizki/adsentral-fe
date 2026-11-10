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
        statusCode: apiErrorStatus(err) || 500,
        statusMessage: apiErrorMessage(err, 'Register User failed, server error'),
        data: err.data, // 429 RATE_LIMITED dibaca dari data.code
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
        statusCode: apiErrorStatus(err) || 500,
        statusMessage: apiErrorMessage(err, 'Update User failed, server error'),
        data: err.data, // 403 ACCOUNT_LOCKED (password lama salah berulang) dibaca dari data.code
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

  // Lupa password. BE selalu menjawab 200 untuk permintaan kode (email terdaftar atau tidak),
  // jadi jangan menyimpulkan apa pun dari jawabannya. Error dilempar apa adanya: pemanggil
  // membaca status, `message`, dan `data.code` (RATE_LIMITED) dengan helper apiError.
  const requestPasswordReset = async (email: string): Promise<void> => {
    await api<WebResponse>('/user/password/reset', { method: 'POST', body: { email } })
  }

  // Kode benar → password baru (tampilkan sekali). Kode salah/kedaluwarsa/dipakai → 400 satu pesan;
  // 5 kali salah → 429 tanpa data.code; batas per IP → 429 RATE_LIMITED.
  const confirmPasswordReset = async (email: string, code: string): Promise<string> => {
    const res = await api<WebResponse<{ password: string }>>('/user/password/confirm', {
      method: 'POST',
      body: { email, code },
    })
    if (res.status !== 'success' || !res.data?.password) throw new Error(res.message || 'Gagal reset password')
    return res.data.password
  }

  return { registerUser, updateProfile, fetchMe, requestPasswordReset, confirmPasswordReset }
}
