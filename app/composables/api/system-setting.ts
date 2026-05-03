import type { SystemSettingRequest } from '~/types/system-setting/SystemSettingRequest'
import type { WebResponse } from '~/types/WebResponse'
import { useSystemSettingStore } from '~/stores/system-setting'
import { useApi } from './useApi'
import type { SystemSettingResponse } from '~/types/system-setting/SystemSettingResponse'

export const useSystemSettingApi = () => {
  const systemSettingStore = useSystemSettingStore()
  const api = useApi()

  const fetchPublicSystemSetting = async () => {
    try {
      systemSettingStore.setLoading(true)
      const res = await api<WebResponse<SystemSettingResponse[]>>('/system/settings')
      if (res.status !== 'success') throw new Error(res.message)
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

  const fetchAllSystemSetting = async (): Promise<SystemSettingResponse[] > => {
    try {
      systemSettingStore.setLoading(true)
      const res = await api<WebResponse<SystemSettingResponse[]>>('/system/settings/all')
      if (res.status !== 'success') throw new Error(res.message)
      systemSettingStore.setSystemSettings(res.data || [])
      return res.data || []
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
    const res = await api<WebResponse<SystemSettingResponse>>('/system/setting/create', {
      method: 'POST',
      body,
    })
    if (res.status !== 'success') throw new Error(res.message)
    return res.data
  }

  const updateSystemSetting = async (id: string, body: SystemSettingRequest) => {
    const res = await api<WebResponse<SystemSettingResponse>>(`/system/setting/update/${id}`, {
      method: 'PATCH',
      body,
    })
    if (res.status !== 'success') throw new Error(res.message)
    return res.data
  }

  const deleteSystemSetting = async (id: string) => {
    const res = await api<WebResponse<void>>(`/system/setting/delete/${id}`, {
      method: 'DELETE',
    })
    if (res.status !== 'success') throw new Error(res.message)
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
