// composables/useApi.ts

/**
 * Composable untuk HTTP client dengan auto auth handling.
 *
 * Fitur:
 * - Auto attach access token ke header X-API-TOKEN
 * - Auto include credentials (cookie refresh token)
 * - Auto refresh token saat access token expired (401 TOKEN_EXPIRED)
 * - Single-flight pattern: refresh hanya 1x meskipun banyak request paralel kena 401
 * - Auto retry request asli setelah refresh sukses (hasil retry dikembalikan ke pemanggil)
 * - Auto logout & redirect ke /login kalau refresh gagal
 *
 * Penggunaan:
 *   const api = useApi();
 *   const result = await api<WebResponse<UserProfile>>('/api/user/profile');
 */

// Beberapa request yang gagal bersamaan cukup memunculkan satu pesan "sesi berakhir"
let lastSessionEndedToastAt = 0

export const useApi = () => {
  const authStore = useAuthStore();
  const config = useRuntimeConfig();
  const router = useRouter();
  const toast = useToast();

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
  });

  /**
   * Bungkus apiFetch dengan strategi refresh-then-retry untuk 401.
   * Tidak memakai hook onResponseError: nilai balik hook diabaikan ofetch, jadi hasil retry
   * di sana terbuang dan pemanggil tetap menerima error 401 walau aksinya sudah sukses.
   */
  const api = async <T = any>(request: string, options: Parameters<typeof apiFetch>[1] = {}): Promise<T> => {
    const sentToken = authStore.accessToken;
    try {
      return await apiFetch<T>(request, options);
    } catch (err: any) {
      // Kita hanya handle 401, error lain (400, 403, 500, dll) biarkan lewat
      if (apiErrorStatus(err) !== 401) throw err;

      // BE kita kirim { status, message } dengan message = "TOKEN_EXPIRED" dll
      const errorCode = (err.data as { message?: string } | undefined)?.message;

      // ============================================================
      // Error 401 selain TOKEN_EXPIRED (TOKEN_INVALID_SIGNATURE, TOKEN_MALFORMED, TOKEN_MISSING, dll)
      // tidak bisa di-resolve dengan refresh → user perlu login ulang.
      // ============================================================
      if (errorCode !== 'TOKEN_EXPIRED') {
        await handleAuthFailure(!!sentToken);
        throw err;
      }

      // ============================================================
      // TOKEN_EXPIRED — case yang paling umum. Refresh token, lalu retry request asli sekali.
      // Bila request lain sudah me-refresh (token di store sudah berganti), langsung retry:
      // refresh token dirotasi tiap dipakai, refresh ganda membuat salah satunya gagal.
      // ============================================================
      if (!authStore.accessToken || authStore.accessToken === sentToken) {
        try {
          // Kalau ada refresh lain yang sedang jalan, method ini reuse promise yang sama (single-flight)
          await authStore.refresh();
        } catch {
          // Refresh gagal (400 sesi tidak dikenal, 401 refresh token tidak sah, 403 user disuspend)
          await handleAuthFailure(true);
          throw err;
        }
      }

      try {
        // onRequest memasang token baru dari store
        return await apiFetch<T>(request, options);
      } catch (retryErr: any) {
        // Sudah refresh & retry, masih 401 → menyerah, logout
        if (apiErrorStatus(retryErr) === 401) await handleAuthFailure(true);
        throw retryErr;
      }
    }
  };

  /**
   * Helper: clear auth state & redirect ke halaman login.
   * Dipanggil saat semua upaya auto-recovery gagal.
   * `hadSession` = request dikirim dengan access token (bukan pengunjung) → beri tahu user.
   */
  async function handleAuthFailure(hadSession: boolean): Promise<void> {
    authStore.clearAuth();

    if (hadSession && Date.now() - lastSessionEndedToastAt > 3000) {
      lastSessionEndedToastAt = Date.now()
      toast.add({ title: 'Sesi berakhir, silakan login kembali', color: 'warning', icon: 'mdi:logout' })
    }

    // Hanya redirect kalau bukan sedang di halaman public
    // (menghindari redirect loop kalau sudah di /login)
    const publicRoutes = ['/login', '/register', '/forgot-password', '/product', '/category', '/merchant', '/'];

    const currentPath = router.currentRoute.value.path
    const isPublic = publicRoutes.some(r => currentPath === r || currentPath.startsWith(r + '/'))
    if (!isPublic) {
      await navigateTo('/login');}
  }

  return api;
};
