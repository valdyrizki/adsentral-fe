import type { CategoryResponse } from "~/types/CategoryResponse"
import type { WebResponse } from "~/types/WebResponse"

// composables/api/categories.ts
export const useCategoryApi = () => {
  const config = useRuntimeConfig()


  // GET categories
  const fetchCategories = async (): Promise<CategoryResponse[]> => {
    const res = await $fetch<WebResponse<CategoryResponse[]>>(`${config.public.apiBase}/categories`, {
      method: 'GET',
    })

    if (!res || res.status !== 'success' || !res.data) {
      throw createError({
        statusCode: 400,
        statusMessage: res?.message || 'Failed to fetch categories',
      })
    }

    return res.data
  }

  return { fetchCategories }
}
