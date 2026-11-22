import { useSystemSettingApi } from '~/composables/api/system-setting'

/**
 * Kontak CS dari setting publik grup CONTACT (satu sumber untuk header & Tentang Kami, F-71).
 * Key useAsyncData sama di semua pemakai, jadi hanya satu request per kunjungan. Gagal/kosong = string kosong.
 */
export const useContactSettings = () => {
  const { fetchPublicSystemSettingByGroup } = useSystemSettingApi()
  const { data } = useAsyncData('public-contact-settings', () => fetchPublicSystemSettingByGroup('CONTACT').catch(() => []), {
    server: false,
    getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
  })
  const get = (key: string) => computed(() => data.value?.find(s => s.key === key)?.value ?? '')
  return { waNumber: get('WA_NUMBER'), email: get('EMAIL'), address: get('ADDRESS') }
}
