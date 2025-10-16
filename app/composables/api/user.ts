import type { WebResponse } from "~/types/WebResponse"
import type { UserRequest } from "~/types/UserRequest"
import type { UserResponse } from "~/types/UserResponse"
import type { RegisterRequest } from "~/types/RegisterRequest"

// composables/api/products.ts
export const useUserApi = () => {
  const config = useRuntimeConfig()
  const useUserStore = useAuthStore()

  const registerUser = async (request:RegisterRequest) => {
    try {
      const res = await $fetch<WebResponse>(
        `${config.public.apiBase}/user/register`,
        {
          method: 'POST',
          body: request,
        }
      )

      console.log(res);
      

      if (!res || res.status !== 'success') {
        throw createError({
          statusCode: 400,
          statusMessage: res?.message || 'Register User Failed',
        })
      }

      return res.data
  }catch (err: any) {
      console.log(err.data);
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.data.message || 'Register User failed, server error',
      })
    }
  }


  // GET products dengan pagination + search
  const updateProfile = async (request:UserRequest) => {
    try {

      const formData = new FormData()
      if (request.username) formData.append("username", request.username)
      if (request.full_name) formData.append("fullName", request.full_name)
      if (request.phone_number) formData.append("phoneNumber", request.phone_number)
      if (request.address) formData.append("address", request.address)
      if (request.birth_date) formData.append("birthDate", request.birth_date)
      if (request.new_password) formData.append("newPassword", request.new_password)
      if (request.old_password) formData.append("oldPassword", request.old_password)
      if (request.avatar) formData.append("avatar", request.avatar as File)


      const res = await $fetch<WebResponse<UserResponse>>(
        `${config.public.apiBase}/user/profile`,
        {
          method: 'PATCH',
          body: formData ,
          headers: {
            'X-API-TOKEN': useUserStore.auth?.token || '',
          },
        }
      )

      if (!res || res.status !== 'success' || !res.data) {
        throw createError({
          statusCode: 400,
          statusMessage: res?.message || 'Update User Failed',
        })
      }

      return res.data

    } catch (err: any) {
      console.log(err);
      
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.statusMessage || 'Update User failed, server error',
      })
    }
  }

  return { registerUser, updateProfile }
}
