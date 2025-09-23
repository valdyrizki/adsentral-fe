import type { Category } from "~/dto/CategoryResponse"
import type { WebResponse } from "~/dto/WebResponse"

export function CategoryController() {
  const config = useRuntimeConfig()

  async function getCategories(): Promise<WebResponse<Category[]>> {
    return await $fetch('/categories', {
      method: 'GET',
      baseURL: config.public.apiBase,
    })
  }

  async function getCategoryById(id: number): Promise<WebResponse<Category>> {
    return await $fetch(`/category/${id}`, {
      method: 'GET',
      baseURL: config.public.apiBase,
    })
  }

  return { getCategories }
}
