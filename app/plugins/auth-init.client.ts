// app/plugins/auth-init.client.ts

import { useSystemSettingApi } from "~/composables/api/system-setting"

export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
  const balanceStore = useBalanceStore()
  const notificationStore = useNotificationStore()
  const config = useRuntimeConfig()
  const { fetchPublicSystemSetting } = useSystemSettingApi()

  try{
    // Load system settings (public endpoint, no auth required)
    fetchPublicSystemSetting().catch(() => {})
  }catch(err) {
    // Gagal load system setting, bisa jadi karena masalah jaringan atau server
    // Log error tapi jangan ganggu flow auth init
    console.error('Failed to load system settings during auth init', err)
  }

  // Kalau accessToken sudah ada (rare case: hot-reload atau navigasi internal), skip
  if (authStore.accessToken) {
    authStore.setInitialized()
    return
  }

  try {
    // 1. Panggil /refresh — browser auto-attach cookie refreshToken (HttpOnly)
    const response = await $fetch<{
      status: string
      data: { access_token: string }
    }>('/user/refresh', {
      method: 'POST',
      credentials: 'include',
      baseURL: config.public.apiBase as string,
    })

    const newAccessToken = response.data.access_token
    authStore.setAccessToken(newAccessToken)

    await authStore.loadUserProfile()
    await balanceStore.loadBalance()

    notificationStore.loadUnreadCount().catch(() => {})
  } catch (err: any) {
    // Refresh gagal = user belum login atau refresh token expired
    // Diam saja — user akan lihat halaman dengan UI "Daftar/Masuk"
    // Jangan log error — ini case normal untuk visitor yang belum login
  } finally {
    authStore.setInitialized()  // ← selalu set true di akhir, sukses atau gagal
  }
})