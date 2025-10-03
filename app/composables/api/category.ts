import type { CategoryResponse } from "~/types/CategoryResponse"
import type { WebResponse } from "~/types/WebResponse"

// composables/api/categories.ts
export const useCategoryApi = () => {
  const config = useRuntimeConfig()


  // GET categories dengan pagination + search
  const getCategories = async (): Promise<CategoryResponse[]> => {
    const { data, error } = await useFetch<WebResponse<CategoryResponse[]>>(`${config.public.apiBase}/categories`, {
      method: 'GET',
      key: `categories`, // cache per request
    })

    //throw Error
    if (error.value) {
      throw createError({
        statusCode: error.value.statusCode,
        statusMessage: error.value.message || 'Failed to fetch categories',
      })
    }

    if (!data.value || data.value.status !== 'success' || !data.value.data) {
      throw createError({
        statusCode: 400,
        statusMessage: data.value?.message || 'Failed to fetch categories',
      })
    }

    return data.value?.data
  }

  return { getCategories }
}
