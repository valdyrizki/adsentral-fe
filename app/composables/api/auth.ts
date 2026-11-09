import type { LoginResponse } from "~/types/LoginResponse"
import type { WebResponse } from "~/types/WebResponse"

export const useAuthApi = () => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  const fetchLogin = async (email: string, password: string): Promise<LoginResponse> => {

    authStore.setLoading(true)
    try{
      const res = await $fetch<WebResponse<LoginResponse>>(
        `${config.public.apiBase}/user/login`,
        {
          method: 'POST',
          body: { email, password },
          credentials: 'include',  // ← INI WAJIB untuk terima & kirim cookie

        }
      )

      if (!res || res.status !== 'success' || !res.data) {
        throw createError({
          statusCode: 400,
          statusMessage: res?.message || 'Login failed',
        })
      }

      if (res.status !== 'success') {
        throw new Error(res.message)
      }

      //simpan Access Token di pinia
      authStore.setAccessToken(res.data.access_token);
      await authStore.loadUserProfile() // Load profil user setelah login sukses

      return res.data
    } catch (err:any) {
      console.error('Failed login', err)
      // Teruskan body BE: 429 RATE_LIMITED / 403 ACCOUNT_LOCKED dibedakan dari data.code
      throw createError({
        statusCode: apiErrorStatus(err) || 500,
        statusMessage: apiErrorMessage(err, 'Failed login'),
        data: err.data,
      })
    } finally {
      authStore.setLoading(false)
    }
    
  }

  return { fetchLogin }
}
