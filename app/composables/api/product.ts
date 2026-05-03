import type { PageResponse } from "~/types/PageResponse"
import type { ProductRequest } from "~/types/product/ProductRequest"
import type { ProductResponse } from "~/types/product/ProductResponse"
import type { WebResponse } from "~/types/WebResponse"
import { useApi } from './useApi'

export const useProductsApi = () => {
  const api = useApi()

  const getProducts = async (page = 0, size = 10, keyword = '', sort = 'terbaru') => {
    try {
      const res = await api<WebResponse<PageResponse<ProductResponse>>>('/products', {
        query: { page, size, keyword, sort }
      })
      if (res.status !== 'success' || !res.data) {
        throw createError({ statusCode: 400, statusMessage: res.message || 'Failed to fetch products' })
      }
      return res.data
    } catch (err: any) {
      throw createError({ statusCode: err.statusCode || 500, statusMessage: err.message || 'Failed to fetch products' })
    }
  }

  const fetchProductsByCategoryId = async (
    id: number, 
    page = 0, 
    size = 10, 
    keyword = '', 
    sort = 'terbaru'): Promise<PageResponse<ProductResponse>> => {
    
    
    if (!id) {
      throw new Error('STOPPED: id is required')
    }
    
    try {
      const res = await api<WebResponse<PageResponse<ProductResponse>>>(`/product/category/${id}`, {
        query: { page, size, keyword, sort },
      })
      if (res.status !== 'success' || !res.data) throw new Error(res.message)
      return res.data
    } catch (err: any) {
      console.error('Failed fetch product', err)
      throw createError({ statusCode: err.statusCode || 500, statusMessage: err.message || 'Failed to fetch product' })
    }
}

  const fetchProductsByMerchantId = async (merchantId: any, page = 0, size = 10, keyword = '', sort = 'terbaru'): Promise<PageResponse<ProductResponse>> => {
    try {
      const res = await api<WebResponse<PageResponse<ProductResponse>>>(`/products/merchant/${merchantId}`, {
        query: { page, size, keyword, sort },
      })
      if (res.status !== 'success' || !res.data) throw new Error(res.message)
      return res.data
    } catch (err: any) {
      console.error('Failed fetch product', err)
      throw createError({ statusCode: err.statusCode || 500, statusMessage: err.message || 'Failed to fetch product' })
    }
  }

  const getMyProducts = async (page = 0, size = 10, keyword = '') => {
    try {
      const res = await api<WebResponse<PageResponse<ProductResponse>>>('/products/my', {
        query: { page, size, keyword }
      })
      if (res.status !== 'success' || !res.data) {
        throw createError({ statusCode: 400, statusMessage: res.message || 'Failed to fetch products' })
      }
      return res.data
    } catch (err: any) {
      throw createError({ statusCode: err.statusCode || 500, statusMessage: err.message || 'Failed to fetch products' })
    }
  }

  const fetchMyProduct = async (page = 0, size = 10, keyword = '') => {
      try {
        const res = await api<WebResponse<PageResponse<ProductResponse>>>('/products/my', {
          query: { page, size, keyword },
        })
        if (res.status !== 'success' || !res.data) {
          throw createError({ statusCode: 400, statusMessage: res.message || 'Failed to fetch transactions' })
        }
        return res.data
      } catch (err: any) {
        throw createError({ statusCode: err.statusCode || 500, statusMessage: err.message || 'Failed to fetch transactions' })
      }
    }

  const fetchProductById = async (id: string): Promise<ProductResponse> => {
    try {
      const res = await api<WebResponse<ProductResponse>>(`/product/${id}`)
      if (res.status !== 'success' || !res.data) throw new Error(res.message)
      return res.data
    } catch (err: any) {
      console.error('Failed fetch product', err)
      throw createError({ statusCode: err.statusCode || 500, statusMessage: err.message || 'Failed to fetch product' })
    }
  }

  const getProductsByIds = async (ids: number[]) => {
    try {
      const res = await api<WebResponse<ProductResponse[]>>('/products/ids', {
        method: 'POST',
        body: { ids },
      })
      if (!res || res.status !== 'success' || !res.data) {
        throw createError({ statusCode: 400, statusMessage: res?.message || 'Get products failed' })
      }
      return res.data
    } catch (err: any) {
      console.log(err)
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.statusMessage || 'Get products failed, server error',
      })
    }
  }

  const fetchMyProductById = async (id: string): Promise<ProductResponse> => {
      const res = await api<WebResponse<ProductResponse>>(`/product/my/${id}`)
  
      if (res.status !== 'success' || !res.data) {
        throw createError({
          statusCode: 400,
          statusMessage: res.message || 'Gagal memuat produk',
        })
      }
  
      return res.data
    }

  const createProduct = async (request: ProductRequest) => {
    try {
      const formData = new FormData()
      console.log(request)
      if (request.banner) formData.append("banner", request.banner as File)
      if (request.product_image1) formData.append("productImage1", request.product_image1 as File)
      if (request.product_image2) formData.append("productImage2", request.product_image2 as File)
      if (request.product_image3) formData.append("productImage3", request.product_image3 as File)
      if (request.name) formData.append("name", request.name)
      if (request.description) formData.append("description", request.description)
      if (request.slug) formData.append("slug", request.slug)
      if (request.sell_price) formData.append("sellPrice", request.sell_price.toString())
      if (request.base_price) formData.append("basePrice", "0")
      if (request.stock) formData.append("stock", request.stock.toString())
      if (request.category_id) formData.append("categoryId", request.category_id.toString())
      if (request.distributor) formData.append("distributor", request.distributor)
      if (request.status) formData.append("status", request.status)
      console.log(formData.values)

      const res = await api<WebResponse<ProductResponse>>('/product/create', {
        method: 'POST',
        body: formData,
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

  const updateProduct = async (request: ProductRequest) => {
    try {
      const formData = new FormData()
      if (request.banner) formData.append("banner", request.banner as File)
      if (request.product_image1) formData.append("productImage1", request.product_image1 as File)
      if (request.product_image2) formData.append("productImage2", request.product_image2 as File)
      if (request.product_image3) formData.append("productImage3", request.product_image3 as File)
      if (request.name) formData.append("name", request.name)
      if (request.description) formData.append("description", request.description)
      if (request.slug) formData.append("slug", request.slug)
      if (request.sell_price) formData.append("sellPrice", request.sell_price.toString())
      if (request.base_price) formData.append("basePrice", "0")
      if (request.stock) formData.append("stock", request.stock.toString())
      if (request.category_id) formData.append("categoryId", request.category_id.toString())
      if (request.distributor) formData.append("distributor", request.distributor)
      if (request.status) formData.append("status", request.status)

      const res = await api<WebResponse<ProductResponse>>(`/product/update/${request.id}`, {
        method: 'PATCH',
        body: formData,
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

  const deactivateProduct = async (id: number) => {
    try {
      const res = await api<WebResponse<ProductResponse>>(`/product/deactivate/${id}`, { method: 'PATCH' })
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

  const activateProduct = async (id: number) => {
    try {
      const res = await api<WebResponse<ProductResponse>>(`/product/activate/${id}`, { method: 'PATCH' })
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

  return {
    getProducts,
    fetchProductsByCategoryId,
    fetchProductById,
    getProductsByIds,
    fetchProductsByMerchantId,
    getMyProducts,
    fetchMyProduct,
    fetchMyProductById,
    createProduct,
    updateProduct,
    deactivateProduct,
    activateProduct,
  }
}
