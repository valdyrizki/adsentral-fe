// app/plugins/auth-init.client.ts

import type { UserResponse } from "~/types/UserResponse"

export default defineNuxtPlugin(async () => {


  const authStore = useAuthStore()
  const balanceStore = useBalanceStore()
  const config = useRuntimeConfig()


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
  } catch (err: any) {
    // Refresh gagal = user belum login atau refresh token expired
    // Diam saja — user akan lihat halaman dengan UI "Daftar/Masuk"
    // Jangan log error — ini case normal untuk visitor yang belum login
  } finally {
    authStore.setInitialized()  // ← selalu set true di akhir, sukses atau gagal
  }
})