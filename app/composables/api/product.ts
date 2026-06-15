import type { PageResponse } from "~/types/PageResponse"
import type { ProductRequest } from "~/types/product/ProductRequest"
import type { ProductResponse } from "~/types/product/ProductResponse"
import type { ProductStockItemResponse } from "~/types/product/ProductStockItemResponse"
import type { WebResponse } from "~/types/WebResponse"
import { useApi } from './useApi'

export const useProductsApi = () => {
  const api = useApi()

  const getProducts = async (page = 0, size = 10, keyword = '', sort = 'terbaru', status = '') => {
    try {
      const query: Record<string, any> = { page, size, keyword, sort }
      if (status) query.status = status
      const res = await api<WebResponse<PageResponse<ProductResponse>>>('/products', { query })
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

    if (!id) throw new Error('STOPPED: id is required')

    try {
      const query: Record<string, any> = { page, size, sort }
      if (keyword) query.keyword = keyword

      const res = await api<WebResponse<PageResponse<ProductResponse>>>(`/product/category/${id}`, { query })
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

  const fetchProductByIdAdmin = async (id: string): Promise<ProductResponse> => {
    try {
      const res = await api<WebResponse<ProductResponse>>(`/product/admin/${id}`)
      if (res.status !== 'success' || !res.data) throw new Error(res.message)
      return res.data
    } catch (err: any) {
      throw createError({ statusCode: err.statusCode || 500, statusMessage: err.message || 'Failed to fetch product' })
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
      if (request.delivery_days) formData.append("deliveryDays", request.delivery_days.toString())
      if (request.guarantee_days != null) formData.append("guaranteeDays", request.guarantee_days.toString())
      if (request.delivery_type) formData.append("deliveryType", request.delivery_type)
      if (request.delivery_type === 'AUTO') {
        if (request.auto_config_title) formData.append("autoConfigTitle", request.auto_config_title)
        if (request.auto_config_description) formData.append("autoConfigDescription", request.auto_config_description)
        if (request.auto_config_file) formData.append("autoConfigFile", request.auto_config_file as File)
      }
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
      if (request.delivery_days) formData.append("deliveryDays", request.delivery_days.toString())
      if (request.guarantee_days != null) formData.append("guaranteeDays", request.guarantee_days.toString())
      if (request.delivery_type) formData.append("deliveryType", request.delivery_type)
      if (request.delivery_type === 'AUTO') {
        if (request.auto_config_title) formData.append("autoConfigTitle", request.auto_config_title)
        if (request.auto_config_description) formData.append("autoConfigDescription", request.auto_config_description)
        if (request.auto_config_file) formData.append("autoConfigFile", request.auto_config_file as File)
      }

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

  const getAllProductsAdmin = async (page = 0, size = 20, keyword = '', sort = 'terbaru', status = '') => {
    try {
      const query: Record<string, any> = { page, size, sort }
      if (keyword) query.keyword = keyword
      if (status) query.status = status
      const res = await api<WebResponse<PageResponse<ProductResponse>>>('/products/all', { query })
      if (res.status !== 'success' || !res.data) {
        throw createError({ statusCode: 400, statusMessage: res.message || 'Failed to fetch products' })
      }
      return res.data
    } catch (err: any) {
      throw createError({ statusCode: err.statusCode || 500, statusMessage: err.message || 'Failed to fetch products' })
    }
  }

  const adminActivateProduct = async (id: number) => {
    try {
      const res = await api<WebResponse<ProductResponse>>(`/product/admin/activate/${id}`, { method: 'PATCH' })
      if (!res || res.status !== 'success') {
        throw createError({ statusCode: 400, statusMessage: res?.message || 'Activate Failed' })
      }
      return res.data
    } catch (err: any) {
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.statusMessage || 'Activate failed, server error',
      })
    }
  }

  const rejectProduct = async (id: number) => {
    try {
      const res = await api<WebResponse<ProductResponse>>(`/product/reject/${id}`, { method: 'PATCH' })
      if (!res || res.status !== 'success') {
        throw createError({ statusCode: 400, statusMessage: res?.message || 'Reject Failed' })
      }
      return res.data
    } catch (err: any) {
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.statusMessage || 'Reject failed, server error',
      })
    }
  }

  const getAdminAllStockItems = async (
    page = 0,
    size = 20,
    filters: { status?: string; transactionId?: string; fileName?: string; description?: string; productName?: string } = {}
  ): Promise<PageResponse<ProductStockItemResponse>> => {
    try {
      const query: Record<string, any> = { page, size }
      if (filters.status && filters.status !== 'ALL') query.status = filters.status
      if (filters.transactionId) query.transactionId = filters.transactionId
      if (filters.fileName) query.fileName = filters.fileName
      if (filters.description) query.description = filters.description
      if (filters.productName) query.productName = filters.productName
      const res = await api<WebResponse<PageResponse<ProductStockItemResponse>>>('/admin/stock', { query })
      if (res.status !== 'success' || !res.data) throw new Error(res.message)
      return res.data
    } catch (err: any) {
      throw createError({ statusCode: err.statusCode || 500, statusMessage: err.message || 'Gagal memuat stok' })
    }
  }

  const getMyAllStockItems = async (
    page = 0,
    size = 20,
    filters: { status?: string; transactionId?: string; fileName?: string; description?: string; productName?: string } = {}
  ): Promise<PageResponse<ProductStockItemResponse>> => {
    try {
      const query: Record<string, any> = { page, size }
      if (filters.status && filters.status !== 'ALL') query.status = filters.status
      if (filters.transactionId) query.transactionId = filters.transactionId
      if (filters.fileName) query.fileName = filters.fileName
      if (filters.description) query.description = filters.description
      if (filters.productName) query.productName = filters.productName
      const res = await api<WebResponse<PageResponse<ProductStockItemResponse>>>('/stock/my', { query })
      if (res.status !== 'success' || !res.data) throw new Error(res.message)
      return res.data
    } catch (err: any) {
      throw createError({ statusCode: err.statusCode || 500, statusMessage: err.message || 'Gagal memuat stok' })
    }
  }

  const getProductStockItems = async (productId: number, page = 0, size = 20, status = ''): Promise<PageResponse<ProductStockItemResponse>> => {
    try {
      const query: Record<string, any> = { page, size }
      if (status && status !== 'ALL') query.status = status
      const res = await api<WebResponse<PageResponse<ProductStockItemResponse>>>(`/product/${productId}/stock/my`, {
        query,
      })
      if (res.status !== 'success' || !res.data) throw new Error(res.message)
      return res.data
    } catch (err: any) {
      throw createError({ statusCode: err.statusCode || 500, statusMessage: err.message || 'Gagal memuat stok produk' })
    }
  }

  const addProductStockItem = async (productId: number, description: string, file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (description) formData.append('description', description)
      const res = await api<WebResponse<ProductStockItemResponse>>(`/product/${productId}/stock`, {
        method: 'POST',
        body: formData,
      })
      if (!res || res.status !== 'success') {
        throw createError({ statusCode: 400, statusMessage: res?.message || 'Gagal menambah stok' })
      }
      return res.data
    } catch (err: any) {
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.data?.message || err.statusMessage || 'Gagal menambah stok',
      })
    }
  }

  const deleteProductStockItem = async (itemId: number) => {
    try {
      const res = await api<WebResponse>(`/stock/${itemId}`, { method: 'DELETE' })
      if (!res || res.status !== 'success') {
        throw createError({ statusCode: 400, statusMessage: res?.message || 'Gagal menghapus stok' })
      }
    } catch (err: any) {
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.data?.message || err.statusMessage || 'Gagal menghapus stok',
      })
    }
  }

  const suspendProduct = async (id: number) => {
    try {
      const res = await api<WebResponse<ProductResponse>>(`/product/suspend/${id}`, { method: 'PATCH' })
      if (!res || res.status !== 'success') {
        throw createError({ statusCode: 400, statusMessage: res?.message || 'Suspend Failed' })
      }
      return res.data
    } catch (err: any) {
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.statusMessage || 'Suspend failed, server error',
      })
    }
  }

  return {
    getProducts,
    fetchProductsByCategoryId,
    fetchProductById,
    fetchProductByIdAdmin,
    getProductsByIds,
    fetchProductsByMerchantId,
    getMyProducts,
    fetchMyProduct,
    fetchMyProductById,
    createProduct,
    updateProduct,
    deactivateProduct,
    activateProduct,
    rejectProduct,
    suspendProduct,
    getAllProductsAdmin,
    adminActivateProduct,
    getAdminAllStockItems,
    getMyAllStockItems,
    getProductStockItems,
    addProductStockItem,
    deleteProductStockItem,
  }
}
