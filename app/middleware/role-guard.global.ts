export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()
  
  // ⚠️ CRITICAL: tunggu sampai plugin auth-init selesai
  // Kalau tidak, hard reload di /seller/dashboard akan ditolak
  // karena middleware jalan duluan sebelum refresh selesai
  if (authStore.isInitializing) return
  
  // === SELLER routes ===
  if (to.path.startsWith('/seller')) {
    if (!authStore.isAuthenticated) {
      return navigateTo({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    }
    
    if (!authStore.isSeller) {
      return abortNavigation({
        statusCode: 403,
        statusMessage: 'Halaman ini hanya untuk penjual'
      })
    }
  }
  
  // === ADMIN routes ===
  if (to.path.startsWith('/admin')) {
    console.log('[role-guard] checking /admin route')
    if (!authStore.isAuthenticated) {
      console.log('[role-guard] NOT AUTH → redirect login')

      return navigateTo({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    }
    
    if (!authStore.isAnyAdmin) {
      return abortNavigation({
        statusCode: 403,
        statusMessage: 'Halaman khusus admin'
      })
    }
  }
  
  // === SUPER ADMIN routes ===
  if (to.path.startsWith('/superadmin')) {
    if (!authStore.isAuthenticated) {
      return navigateTo({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    }
    
    if (!authStore.isSuperAdmin) {
      return abortNavigation({
        statusCode: 403,
        statusMessage: 'Halaman khusus super admin'
      })
    }
  }
})