import type { PageResponse } from "~/types/PageResponse"
import type { ProductRequest } from "~/types/product/ProductRequest"
import type { ProductResponse } from "~/types/product/ProductResponse"
import type { ProductStockItemResponse } from "~/types/product/ProductStockItemResponse"
import type { ProductStockItemPatch, ProductStockItemRequest, StockAccountBulkRequest } from "~/types/product/ProductStockItemRequest"
import type { StockBulkCheckResponse, StockBulkDeleteResult, StockBulkSaveResult, StockErrorData } from "~/types/product/StockBulkCheck"
import type { WebResponse } from "~/types/WebResponse"
import { useApi } from './useApi'

type StockListFilters = {
  status?: string
  transactionId?: string
  fileName?: string
  description?: string
  productName?: string
  accountTypeId?: number | null
  account?: string
}

const buildStockQuery = (page: number, size: number, filters: StockListFilters) => {
  const query: Record<string, any> = { page, size }
  if (filters.status && filters.status !== 'ALL') query.status = filters.status
  if (filters.transactionId) query.transactionId = filters.transactionId
  if (filters.fileName) query.fileName = filters.fileName
  if (filters.description) query.description = filters.description
  if (filters.productName) query.productName = filters.productName
  if (filters.accountTypeId) query.accountTypeId = filters.accountTypeId
  if (filters.account?.trim()) query.account = filters.account.trim()
  return query
}

// Field multipart (camelCase, mengikuti binding form BE) untuk data akun pada item stok.
const STOCK_ACCOUNT_FORM_FIELDS = {
  account_uid: 'accountUid',
  account_username: 'accountUsername',
  account_password: 'accountPassword',
  account_email: 'accountEmail',
  account_email_password: 'accountEmailPassword',
  account_two_fa_secret: 'accountTwoFaSecret',
  account_cookie: 'accountCookie',
} as const

// Ubah key camelCase → snake_case (rekursif). Response stok umumnya sudah snake_case,
// ini hanya pengaman untuk field baru (summary/rows/error data) agar tipe di FE konsisten.
const toSnakeKeys = (value: any): any => {
  if (Array.isArray(value)) return value.map(toSnakeKeys)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`), toSnakeKeys(v)])
    )
  }
  return value
}

// Error stok: pertahankan `data` BE (berisi `code`, `row`, dll.) supaya bisa dipakai untuk logika di UI
const stockError = (err: any, fallback: string) => createError({
  statusCode: err.statusCode || 500,
  statusMessage: err.data?.message || err.statusMessage || fallback,
  data: toSnakeKeys(err.data?.data ?? err.data ?? {}) as StockErrorData,
})

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

  // deliveryType opsional: MANUAL | AUTO | STOCKING (filter di BE)
  const fetchMyProduct = async (page = 0, size = 10, keyword = '', deliveryType = '') => {
      try {
        const query: Record<string, any> = { page, size, keyword }
        if (deliveryType) query.deliveryType = deliveryType
        const res = await api<WebResponse<PageResponse<ProductResponse>>>('/products/my', { query })
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
      if (request.stock != null) formData.append("stock", request.stock.toString())
      if (request.min_qty != null) formData.append("minQty", request.min_qty.toString())
      if (request.max_qty != null) formData.append("maxQty", request.max_qty.toString())
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
      if (request.stock != null) formData.append("stock", request.stock.toString())
      if (request.min_qty != null) formData.append("minQty", request.min_qty.toString())
      if (request.max_qty != null) formData.append("maxQty", request.max_qty.toString())
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
      useAlertsStore().refresh() // badge produk menunggu review turun
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
      useAlertsStore().refresh() // badge produk menunggu review turun
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
    filters: StockListFilters = {}
  ): Promise<PageResponse<ProductStockItemResponse>> => {
    try {
      const query = buildStockQuery(page, size, filters)
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
    filters: StockListFilters = {}
  ): Promise<PageResponse<ProductStockItemResponse>> => {
    try {
      const query = buildStockQuery(page, size, filters)
      const res = await api<WebResponse<PageResponse<ProductStockItemResponse>>>('/stock/my', { query })
      if (res.status !== 'success' || !res.data) throw new Error(res.message)
      return res.data
    } catch (err: any) {
      throw createError({ statusCode: err.statusCode || 500, statusMessage: err.message || 'Gagal memuat stok' })
    }
  }

  const getProductStockItems = async (
    productId: number,
    page = 0,
    size = 20,
    status = '',
    filters: StockListFilters = {}
  ): Promise<PageResponse<ProductStockItemResponse>> => {
    try {
      const query = buildStockQuery(page, size, { ...filters, status })
      const res = await api<WebResponse<PageResponse<ProductStockItemResponse>>>(`/product/${productId}/stock/my`, {
        query,
      })
      if (res.status !== 'success' || !res.data) throw new Error(res.message)
      return res.data
    } catch (err: any) {
      throw createError({ statusCode: err.statusCode || 500, statusMessage: err.message || 'Gagal memuat stok produk' })
    }
  }

  // Satu item stok: file dan/atau data akun dan/atau notes (description). Field kosong tidak dikirim.
  const addProductStockItem = async (productId: number, request: ProductStockItemRequest) => {
    try {
      const formData = new FormData()
      if (request.file) formData.append('file', request.file)
      const description = request.description?.trim()
      if (description) formData.append('description', description)
      if (request.account_type_id) formData.append('accountTypeId', request.account_type_id.toString())
      for (const [key, field] of Object.entries(STOCK_ACCOUNT_FORM_FIELDS)) {
        const value = request[key as keyof typeof STOCK_ACCOUNT_FORM_FIELDS]?.trim()
        if (value) formData.append(field, value)
      }
      if (request.allow_duplicate) formData.append('allowDuplicate', 'true')
      const res = await api<WebResponse<ProductStockItemResponse>>(`/product/${productId}/stock`, {
        method: 'POST',
        body: formData,
      })
      if (!res || res.status !== 'success') {
        throw createError({ statusCode: 400, statusMessage: res?.message || 'Gagal menambah stok' })
      }
      return res.data
    } catch (err: any) {
      throw stockError(err, 'Gagal menambah stok')
    }
  }

  // Partial update (PATCH): hanya field yang ada di `patch` yang dikirim. "" = dikosongkan di BE.
  const updateProductStockItem = async (itemId: number, patch: ProductStockItemPatch): Promise<ProductStockItemResponse> => {
    try {
      const formData = new FormData()
      if (patch.file) formData.append('file', patch.file)
      else if (patch.remove_file) formData.append('removeFile', 'true')
      if (patch.description !== undefined) formData.append('description', patch.description)
      if (patch.account_type_id) formData.append('accountTypeId', patch.account_type_id.toString())
      for (const [key, field] of Object.entries(STOCK_ACCOUNT_FORM_FIELDS)) {
        const value = patch[key as keyof typeof STOCK_ACCOUNT_FORM_FIELDS]
        if (value !== undefined) formData.append(field, value)
      }
      if (patch.allow_duplicate) formData.append('allowDuplicate', 'true')
      const res = await api<WebResponse<ProductStockItemResponse>>(`/stock/${itemId}`, {
        method: 'PATCH',
        body: formData,
      })
      if (!res || res.status !== 'success' || !res.data) {
        throw createError({ statusCode: 400, statusMessage: res?.message || 'Gagal mengubah stok' })
      }
      return res.data
    } catch (err: any) {
      throw stockError(err, 'Gagal mengubah stok')
    }
  }

  // Bulk akun langkah 1 (dryRun): cek status tiap baris tanpa menyimpan apa pun.
  const checkProductStockAccountsBulk = async (productId: number, request: StockAccountBulkRequest): Promise<StockBulkCheckResponse> => {
    try {
      const res = await api<WebResponse<StockBulkCheckResponse>>(`/product/${productId}/stock/accounts/bulk`, {
        method: 'POST',
        query: { dryRun: true },
        body: request,
      })
      if (!res || res.status !== 'success' || !res.data) {
        throw createError({ statusCode: 400, statusMessage: res?.message || 'Gagal mengecek akun' })
      }
      return toSnakeKeys(res.data)
    } catch (err: any) {
      throw stockError(err, 'Gagal mengecek akun')
    }
  }

  // Bulk akun langkah 2 (simpan): all-or-nothing, items sama & urutan sama dengan saat cek + on_duplicate.
  const addProductStockAccountsBulk = async (productId: number, request: StockAccountBulkRequest): Promise<StockBulkSaveResult> => {
    try {
      const res = await api<WebResponse<{ added: number; skipped: number }>>(`/product/${productId}/stock/accounts/bulk`, {
        method: 'POST',
        body: request,
      })
      if (!res || res.status !== 'success') {
        throw createError({ statusCode: 400, statusMessage: res?.message || 'Gagal menambah akun' })
      }
      return { message: res.message, added: res.data?.added ?? 0, skipped: res.data?.skipped ?? 0 }
    } catch (err: any) {
      throw stockError(err, 'Gagal menambah akun')
    }
  }

  // ===== Bulk file dengan UID dari nama file (POST /product/{id}/stock/bulk, multipart) =====
  // Mode ini selalu uidFromFileName=true. Upload file tanpa mode UID tetap memakai addProductStockItem per file.

  // Langkah 1 (dryRun): cukup kirim nama file, file tidak diupload. Response sama dengan cek bulk akun.
  const checkProductStockFilesBulk = async (
    productId: number,
    request: { fileNames: string[]; accountTypeId?: number | null },
  ): Promise<StockBulkCheckResponse> => {
    try {
      const formData = new FormData()
      formData.append('uidFromFileName', 'true')
      formData.append('dryRun', 'true')
      if (request.accountTypeId) formData.append('accountTypeId', request.accountTypeId.toString())
      for (const name of request.fileNames) formData.append('fileNames', name)
      const res = await api<WebResponse<StockBulkCheckResponse>>(`/product/${productId}/stock/bulk`, {
        method: 'POST',
        body: formData,
      })
      if (!res || res.status !== 'success' || !res.data) {
        throw createError({ statusCode: 400, statusMessage: res?.message || 'Gagal mengecek file' })
      }
      return toSnakeKeys(res.data)
    } catch (err: any) {
      throw stockError(err, 'Gagal mengecek file')
    }
  }

  // Langkah 2 (simpan): file sungguhan, urutan sama dengan saat cek. onDuplicates wajib untuk SETIAP file
  // (berpasangan per index; "" untuk file baru). All-or-nothing.
  const addProductStockFilesBulk = async (
    productId: number,
    request: { files: File[]; onDuplicates: string[]; accountTypeId?: number | null },
  ): Promise<StockBulkSaveResult> => {
    try {
      const formData = new FormData()
      formData.append('uidFromFileName', 'true')
      if (request.accountTypeId) formData.append('accountTypeId', request.accountTypeId.toString())
      request.files.forEach((file, i) => {
        formData.append('files', file)
        formData.append('onDuplicates', request.onDuplicates[i] ?? '')
      })
      const res = await api<WebResponse<{ added: number; skipped: number }>>(`/product/${productId}/stock/bulk`, {
        method: 'POST',
        body: formData,
      })
      if (!res || res.status !== 'success') {
        throw createError({ statusCode: 400, statusMessage: res?.message || 'Gagal mengupload file' })
      }
      return { message: res.message, added: res.data?.added ?? 0, skipped: res.data?.skipped ?? 0 }
    } catch (err: any) {
      throw stockError(err, 'Gagal mengupload file')
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

  // Hapus massal (maks 500). Hanya item ACTIVE yang dihapus; SENT/terhapus/tidak ditemukan dilewati (data.skipped).
  // Ada id milik seller lain → seluruh request ditolak 403.
  const bulkDeleteStockItems = async (itemIds: number[]): Promise<StockBulkDeleteResult> => {
    try {
      const res = await api<WebResponse<StockBulkDeleteResult>>('/stock/bulk-delete', {
        method: 'POST',
        body: { item_ids: itemIds },
      })
      if (!res || res.status !== 'success') {
        throw createError({ statusCode: 400, statusMessage: res?.message || 'Gagal menghapus stok' })
      }
      const data = toSnakeKeys(res.data ?? {})
      return { message: res.message, deleted: data.deleted ?? 0, skipped: data.skipped ?? [] }
    } catch (err: any) {
      throw stockError(err, 'Gagal menghapus stok')
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
    checkProductStockAccountsBulk,
    addProductStockAccountsBulk,
    checkProductStockFilesBulk,
    addProductStockFilesBulk,
    updateProductStockItem,
    deleteProductStockItem,
    bulkDeleteStockItems,
  }
}
