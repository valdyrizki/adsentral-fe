export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

  // Kalau user sudah login, jangan izinkan ke /login
  if (to.path === "/login" && authStore.auth?.token) {
    return navigateTo("/") // bisa diganti ke "/dashboard"
  }
  // Kalau user sudah register, jangan izinkan ke /register
  if (to.path === "/register" && authStore.auth?.token) {
    return navigateTo("/") // bisa diganti ke "/dashboard"
  }
})
