import type { PageResponse } from "~/dto/PageResponse"
import type { ProductResponse } from "~/dto/ProductResponse"
import type { WebResponse } from "~/dto/WebResponse"

export function ProductController() {
  const config = useRuntimeConfig()

  async function getProducts(): Promise<WebResponse<PageResponse<ProductResponse[]>>> {
    return await $fetch('/products', {
      method: 'GET',
      baseURL: config.public.apiBase,
    })
  }

  async function getProductById(id: number): Promise<WebResponse<ProductResponse>> {
    return await $fetch(`/product/${id}`, {
      method: 'GET',
      baseURL: config.public.apiBase,
    })
  }

  

  async function getProductByCategoryId(id: number): Promise<WebResponse<PageResponse<ProductResponse[]>>> {
    return await $fetch(`/product/category/${id}`, {
      method: 'GET',
      baseURL: config.public.apiBase,
    })
  }

  return { getProducts, getProductById, getProductByCategoryId }
}
