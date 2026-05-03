// app/middleware/auth-redirect.global.ts

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) {
    return
  }

  const authStore = useAuthStore()

  // Tunggu plugin auth-init selesai
  if (authStore.isInitializing) {
    await new Promise<void>((resolve) => {
      const stop = watch(
        () => authStore.isInitializing,
        (val) => {
          if (!val) {
            stop()
            resolve()
          }
        },
        { immediate: true }
      )
    })
  }

  // ===== GUEST-ONLY ROUTES =====
  // Kalau sudah login, jangan boleh ke /login, /register
  const guestOnlyRoutes = ['/login', '/register', '/forgot-password']
  if (authStore.isAuthenticated && guestOnlyRoutes.includes(to.path)) {
    return navigateTo('/')
  }

  // ===== AUTH-REQUIRED ROUTES (non role-based) =====
  // Halaman yang butuh login tapi bukan area seller/admin
  // (role-guard.global.ts sudah handle /seller, /admin, /superadmin)
  const authRequiredRoutes = [
    '/transaction',
    '/balance',
    '/profile',
    '/chat',
    '/payment',
  ]
  
  const requiresAuth = authRequiredRoutes.some(route =>
    to.path === route || to.path.startsWith(route + '/')
  )
  
  if (requiresAuth && !authStore.isAuthenticated) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }
})