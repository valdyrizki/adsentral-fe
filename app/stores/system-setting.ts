// stores/paymentMethod.ts
import { defineStore } from 'pinia'
import type { SystemSettingResponse } from '~/types/system-setting/SystemSettingResponse'

interface SystemSettingState {
  systemSettings: SystemSettingResponse[]
  loading: boolean
}

export const useSystemSettingStore = defineStore('systemSetting', {
  state: (): SystemSettingState => ({
    systemSettings: new Array<SystemSettingResponse>(),
    loading: false
  }),

  getters: {
    listKey: (state) => state.systemSettings.map((item) => item.key),
    listGroup: (state) => state.systemSettings.map((item) => item.group),
  },

  actions: {

    setSystemSettings(systemSettings: SystemSettingResponse[]) {
      this.systemSettings = systemSettings
    },

    setLoading(value: boolean) {
      this.loading = value
    },

    reset() {
      this.systemSettings = new Array<SystemSettingResponse>()
      this.loading = false
    }
  }
})
