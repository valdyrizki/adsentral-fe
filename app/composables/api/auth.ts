import type { LoginResponse } from "~/types/LoginResponse"
import type { WebResponse } from "~/types/WebResponse"

export const useAuthApi = () => {
  const config = useRuntimeConfig()

  const login = async (email: string, password: string): Promise<LoginResponse> => {
    try {
      const res = await $fetch<WebResponse<LoginResponse>>(
        `${config.public.apiBase}/user/login`,
        {
          method: 'POST',
          body: { email, password }
        }
      )

      if (!res || res.status !== 'success' || !res.data) {
        throw createError({
          statusCode: 400,
          statusMessage: res?.message || 'Login failed',
        })
      }

      return res.data

    } catch (err: any) {
      console.log(err);
      
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.statusMessage || 'Invalid username/password',
      })
    }
  }

  return { login }
}
