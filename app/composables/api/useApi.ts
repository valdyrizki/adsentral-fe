// composables/useApi.ts

import type { FetchOptions } from 'ofetch';

/**
 * Composable untuk HTTP client dengan auto auth handling.
 * 
 * Fitur:
 * - Auto attach access token ke header X-API-TOKEN
 * - Auto include credentials (cookie refresh token)
 * - Auto refresh token saat access token expired (401 TOKEN_EXPIRED)
 * - Single-flight pattern: refresh hanya 1x meskipun banyak request paralel kena 401
 * - Auto retry request asli setelah refresh sukses
 * - Auto logout & redirect ke /login kalau refresh gagal
 * 
 * Penggunaan:
 *   const api = useApi();
 *   const result = await api<WebResponse<UserProfile>>('/api/user/profile');
 */
export const useApi = () => {
  const authStore = useAuthStore();
  const config = useRuntimeConfig();
  const router = useRouter();

  const apiFetch = $fetch.create({
    baseURL: config.public.apiBase as string,
    credentials: 'include', // Wajib: biar browser kirim & terima cookie HttpOnly

    /**
     * Interceptor sebelum request dikirim.
     * Attach access token dari Pinia ke header X-API-TOKEN.
     */
    onRequest({ options }) {
      if (authStore.accessToken) {
        // Convert headers ke object supaya bisa di-spread
        const headers = new Headers(options.headers as HeadersInit | undefined);
        headers.set('X-API-TOKEN', authStore.accessToken);
        options.headers = headers;
      }
    },

    /**
     * Interceptor saat response error.
     * Handle 401 dengan strategi refresh-then-retry.
     */
    async onResponseError({ response, request, options }) {
      // Kita hanya handle 401, error lain (400, 403, 500, dll) biarkan lewat
      console.log(response.status);
      
      if (response.status !== 401) {
        return;
      }

      // Ekstrak error code dari response body
      // BE kita kirim { status, message } dengan message = "TOKEN_EXPIRED" dll
      const errorCode = (response._data as { message?: string })?.message;

      // Ambil URL request untuk check khusus
      const requestUrl = 
        typeof request === 'string' 
          ? request 
          : (request as Request).url;

      // ============================================================
      // CASE 1: Endpoint /refresh sendiri yang kena 401.
      // Ini artinya refresh token pun sudah invalid/expired.
      // Jangan retry (bisa bikin infinite loop) — langsung logout.
      // ============================================================
      if (requestUrl.includes('/user/refresh')) {
          console.warn(`Refresh failed: ${errorCode} → forcing logout`);
  
          // Untuk debugging, bedakan log per kasus
          if (errorCode === 'REFRESH_TOKEN_EXPIRED') {
            console.info('Refresh token expired (30 hari). Normal — user perlu login ulang.');
          } else if (errorCode === 'REFRESH_TOKEN_INVALID_SIGNATURE') {
            console.error('⚠️ Refresh token signature invalid. Mungkin tampered atau bug di BE.');
          } else if (errorCode === 'USER_NOT_FOUND' || errorCode === 'SESSION_NOT_FOUND') {
            console.error('⚠️ Anomali: refresh token valid tapi user/session hilang.');
          }
        
        await handleAuthFailure();
        return;
      }

      // ============================================================
      // CASE 2: Request ini sudah pernah di-retry sebelumnya.
      // Artinya: kita sudah refresh token, retry, tapi masih kena 401.
      // Menyerah — logout.
      // ============================================================
      if ((options as ExtendedFetchOptions)._retried) {
        console.log("MASUK CASE 2");
        await handleAuthFailure();
        return;
      }

      // ============================================================
      // CASE 3: TOKEN_EXPIRED — case yang paling umum.
      // Refresh token, lalu retry request asli.
      // ============================================================
      if (errorCode === 'TOKEN_EXPIRED') {
        console.log("MASUK CASE 3");
        try {
          // Panggil refresh. Kalau ada refresh lain yang sedang jalan,
          // method ini akan reuse promise yang sama (single-flight).
          const newAccessToken = await authStore.refresh();

          // Tandai request ini sudah di-retry supaya tidak loop
          (options as ExtendedFetchOptions)._retried = true;

          // Update headers dengan token baru
          const headers = new Headers(options.headers as HeadersInit | undefined);
          headers.set('X-API-TOKEN', newAccessToken);
          options.headers = headers;

          // Retry request asli dengan token baru
          // Return hasilnya supaya caller dapat data yang benar
          return await $fetch(request as string, options as any);
        } catch (refreshError) {
          // Refresh gagal = refresh token invalid/expired
          await handleAuthFailure();
        }
        return;
      }

      // ============================================================
      // CASE 4: Error 401 jenis lain.
      // Misal: TOKEN_INVALID_SIGNATURE, TOKEN_MALFORMED, USER_SUSPENDED,
      //        USER_INACTIVE, TOKEN_MISSING, dll.
      // Semua ini butuh user re-login, tidak bisa di-resolve dengan refresh.
      // ============================================================
      await handleAuthFailure();
    },
  });

  /**
   * Helper: clear auth state & redirect ke halaman login.
   * Dipanggil saat semua upaya auto-recovery gagal.
   */
  async function handleAuthFailure(): Promise<void> {
    authStore.clearAuth();

    // Hanya redirect kalau bukan sedang di halaman public
    // (menghindari redirect loop kalau sudah di /login)
    const publicRoutes = ['/login', '/register', '/forgot-password', '/product', '/category', '/merchant', '/'];

    const currentPath = router.currentRoute.value.path
    const isPublic = publicRoutes.some(r => currentPath === r || currentPath.startsWith(r + '/'))
    if (!isPublic) {
      // runWithContext diperlukan karena fungsi ini dipanggil dari dalam
      // async interceptor ofetch yang sudah di luar Vue/Nuxt setup context
      await navigateTo('/login');}
  }

  return apiFetch;
};

/**
 * Helper type untuk menandai request yang sudah di-retry.
 * Extends FetchOptions dengan flag internal _retried.
 */
type ExtendedFetchOptions = FetchOptions & {
  _retried?: boolean;
};