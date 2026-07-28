import { useApi } from './useApi'
import type { CategoryResponse } from "~/types/CategoryResponse"
import type { CategoryRequest } from "~/types/CategoryRequest"
import type { WebResponse } from "~/types/WebResponse"

// composables/api/categories.ts
export const useCategoryApi = () => {
  const config = useRuntimeConfig()
  const api = useApi()

  // GET categories aktif (public, dipakai untuk dropdown/select)
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

  // ===== ADMIN CRUD =====

  // GET semua kategori termasuk INACTIVE/SUSPEND (untuk listing admin)
  const fetchCategoriesAdmin = async (): Promise<CategoryResponse[]> => {
    const res = await api<WebResponse<CategoryResponse[]>>('/categories/all')
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal memuat kategori' })
    }
    return res.data
  }

  // BE sudah disesuaikan mengikuti pola modul product: multipart form-data dengan file gambar.
  const createCategory = async (payload: CategoryRequest): Promise<CategoryResponse | undefined> => {
    const formData = new FormData()
    formData.append('name', payload.name)
    if (payload.description) formData.append('description', payload.description)
    if (payload.image) formData.append('image', payload.image)
    formData.append('status', payload.status)

    const res = await api<WebResponse<CategoryResponse>>('/category/create', {
      method: 'POST',
      body: formData,
    })
    if (!res || res.status !== 'success') {
      throw createError({ statusCode: 400, statusMessage: res?.message || 'Gagal membuat kategori' })
    }
    return res.data
  }

  const updateCategory = async (id: number, payload: CategoryRequest): Promise<CategoryResponse | undefined> => {
    const formData = new FormData()
    formData.append('name', payload.name)
    if (payload.description) formData.append('description', payload.description)
    if (payload.image) formData.append('image', payload.image)
    formData.append('status', payload.status)

    const res = await api<WebResponse<CategoryResponse>>(`/category/update/${id}`, {
      method: 'PATCH',
      body: formData,
    })
    if (!res || res.status !== 'success') {
      throw createError({ statusCode: 400, statusMessage: res?.message || 'Gagal mengupdate kategori' })
    }
    return res.data
  }

  // Soft delete. Hanya SUPER_ADMIN. Belum ada endpoint untuk activate/un-suspend.
  const suspendCategory = async (id: number): Promise<void> => {
    const res = await api<WebResponse<null>>(`/category/suspend/${id}`, {
      method: 'PATCH',
    })
    if (res.status !== 'success') {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal menonaktifkan kategori' })
    }
  }

  return {
    fetchCategories,
    fetchCategoriesAdmin,
    createCategory,
    updateCategory,
    suspendCategory,
  }
}
