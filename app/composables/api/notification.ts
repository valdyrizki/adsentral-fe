import type { PageResponse } from '~/types/PageResponse'
import type { WebResponse } from '~/types/WebResponse'
import type { NotificationResponse } from '~/types/notification/NotificationResponse'
import { useApi } from './useApi'

export const useNotificationApi = () => {
  const api = useApi()

  const fetchNotifications = async (
    page: number = 0,
    size: number = 10,
  ): Promise<PageResponse<NotificationResponse>> => {
    const res = await api<WebResponse<PageResponse<NotificationResponse>>>('/notification', {
      params: { page, size },
    })

    if (res.status !== 'success' || !res.data) {
      throw createError({
        statusCode: 400,
        statusMessage: res.message || 'Gagal memuat notifikasi',
      })
    }

    return res.data
  }

  const fetchAdminNotifications = async (
    page: number = 0,
    size: number = 10,
  ): Promise<PageResponse<NotificationResponse>> => {
    const res = await api<WebResponse<PageResponse<NotificationResponse>>>('/admin/notification', {
      params: { page, size },
    })

    if (res.status !== 'success' || !res.data) {
      throw createError({
        statusCode: 400,
        statusMessage: res.message || 'Gagal memuat notifikasi',
      })
    }

    return res.data
  }

  const markAsRead = async (id: number): Promise<void> => {
    const res = await api<WebResponse>(`/notification/user/read/${id}`, {
      method: 'PATCH',
    })
    if (res.status !== 'success') {
      throw createError({
        statusCode: 400,
        statusMessage: res.message || 'Gagal menandai notifikasi',
      })
    }
  }

  const markAllAsRead = async (): Promise<void> => {
    const res = await api<WebResponse>('/notification/user/read-all', {
      method: 'PATCH',
    })
    if (res.status !== 'success') {
      throw createError({
        statusCode: 400,
        statusMessage: res.message || 'Gagal menandai semua notifikasi',
      })
    }
  }

  const fetchSellerNotifications = async (
    page: number = 0,
    size: number = 10,
  ): Promise<PageResponse<NotificationResponse>> => {
    const res = await api<WebResponse<PageResponse<NotificationResponse>>>('/seller/notification', {
      params: { page, size },
    })

    if (res.status !== 'success' || !res.data) {
      throw createError({
        statusCode: 400,
        statusMessage: res.message || 'Gagal memuat notifikasi',
      })
    }

    return res.data
  }

  const createNotification = async (payload: {
    user_ids: number[]
    title: string
    message: string
    notification_type?: string
    action_url?: string | null
    reference_id?: string | null
    reference_type?: string | null
  }): Promise<void> => {
    const res = await api<WebResponse>('/admin/notification', {
      method: 'POST',
      body: payload,
    })
    if (res.status !== 'success') {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal membuat notifikasi' })
    }
  }

  const broadcastNotification = async (payload: {
    title: string
    message: string
    notification_type?: string
    target_roles: string[]
    action_url?: string | null
    reference_id?: string | null
    reference_type?: string | null
  }): Promise<void> => {
    const res = await api<WebResponse>('/admin/notification/broadcast', {
      method: 'POST',
      body: payload,
    })
    if (res.status !== 'success') {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal mengirim broadcast' })
    }
  }

  return { fetchNotifications, fetchAdminNotifications, fetchSellerNotifications, markAsRead, markAllAsRead, createNotification, broadcastNotification }
}
