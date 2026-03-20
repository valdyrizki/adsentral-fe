import type { SystemSettingRequest } from '~/types/system-setting/SystemSettingRequest'
import type { SystemSettingResponse } from '~/types/system-setting/SystemSettingResponse'
import type { WebResponse } from '~/types/WebResponse'
import { useSystemSettingStore } from '~/stores/system-setting'

export const useSystemSettingApi = () => {
  const config = useRuntimeConfig()
  const systemSettingStore = useSystemSettingStore()
  const authStore = useAuthStore()

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'X-API-TOKEN': authStore.auth?.token || '',
  })

  const fetchPublicSystemSetting = async () => {
    try {
      systemSettingStore.setLoading(true)

      const res = await $fetch<WebResponse<SystemSettingResponse[]>>(
        `${config.public.apiBase}/system/settings`,
      )

      if (res.status !== 'success') {
        throw new Error(res.message)
      }

      systemSettingStore.setSystemSettings(res.data || [])
      return res.data
    } catch (err: any) {
      console.error('Failed fetch System Setting', err)
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.message || 'Failed to fetch System Setting',
      })
    } finally {
      systemSettingStore.setLoading(false)
    }
  }

  const fetchAllSystemSetting = async () => {
    try {
      systemSettingStore.setLoading(true)

      const res = await $fetch<WebResponse<SystemSettingResponse[]>>(
        `${config.public.apiBase}/system/settings/all`,
        {headers: getHeaders()},
      )

      if (res.status !== 'success') {
        throw new Error(res.message)
      }

      systemSettingStore.setSystemSettings(res.data || [])
      return res.data
    } catch (err: any) {
      console.error('Failed fetch System Setting', err)
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.message || 'Failed to fetch System Setting',
      })
    } finally {
      systemSettingStore.setLoading(false)
    }
  }

  const createSystemSetting = async (body: SystemSettingRequest) => {
    const res = await $fetch<WebResponse<SystemSettingResponse>>(
      `${config.public.apiBase}/system/setting/create`,
      {
        method: 'POST',
        headers: getHeaders(),
        body,
      },
    )
    if (res.status !== 'success') {
      throw new Error(res.message)
    }
    return res.data
  }

  const updateSystemSetting = async (id: string, body: SystemSettingRequest) => {
    const res = await $fetch<WebResponse<SystemSettingResponse>>(
      `${config.public.apiBase}/system/setting/update/${id}`,
      {
        method: 'PATCH',
        headers: getHeaders(),
        body,
      },
    )
    if (res.status !== 'success') {
      throw new Error(res.message)
    }
    return res.data
  }

  const deleteSystemSetting = async (id: string) => {
    const res = await $fetch<WebResponse<void>>(
      `${config.public.apiBase}/system/setting/delete/${id}`,
      {
        method: 'DELETE',
        headers: getHeaders(),
      },
    )
    if (res.status !== 'success') {
      throw new Error(res.message)
    }
  }

  return {
    systemSettings: computed(() => systemSettingStore.systemSettings),
    systemSettingLoading: computed(() => systemSettingStore.loading),
    fetchPublicSystemSetting,
    fetchAllSystemSetting,
    createSystemSetting,
    updateSystemSetting,
    deleteSystemSetting,
    
  }
}
