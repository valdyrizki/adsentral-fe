// app/composables/useApi.ts

// Variabel global di luar fungsi untuk menahan state antrean
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
};

export const useApi = async (request: string, options: any = {}) => {
  const config = useRuntimeConfig();
  const accessToken = useCookie('access_token'); // Tempat Anda menyimpan Access Token

  // Default setup API
  const customFetch = $fetch.create({
    baseURL: (config.public as any).apiBaseUrl || 'http://localhost:8080', // Sesuaikan URL Backend
    
    // 1. Selalu tempelkan Access Token di setiap request
    onRequest({ options }) {
      if (accessToken.value) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${accessToken.value}`,
        };
      }
      // WAJIB: Agar browser mau mengirimkan HttpOnly Cookie (Refresh Token) ke Backend
      options.credentials = 'include'; 
    },

    // 2. Tangani jika terjadi error dari Backend
    async onResponseError({ request: req, options: opts, response }) {
      // Jika error 401 (Unauthorized / Token Expired)
      if (response.status === 401) {
        
        // Cek apakah endpoint yang gagal adalah endpoint refresh itu sendiri
        // Jika ya, berarti Refresh Token-nya juga sudah mati.
        if (req.toString().includes('/api/auth/refresh')) {
          accessToken.value = null;
          navigateTo('/login'); // Lempar ke halaman login
          return Promise.reject(response._data);
        }

        // Jika belum ada proses refresh yang berjalan, mulai refresh
        if (!isRefreshing) {
          isRefreshing = true;

          try {
            // Panggil API Refresh di Backend
            // (Browser akan otomatis menyisipkan HttpOnly Cookie refreshToken di sini)
            const refreshResponse: any = await $fetch('/api/auth/refresh', {
              baseURL: config.public.apiBaseUrl || 'http://localhost:8080',
              method: 'POST',
              credentials: 'include', // Wajib untuk cross-origin HttpOnly cookie
            });

            // Ambil Access Token baru dari response JSON
            const newAccessToken = refreshResponse.data.accessToken;
            
            // Update cookie access_token di Nuxt
            accessToken.value = newAccessToken;

            // Lepaskan semua antrean request yang tadi tertahan
            processQueue(null, newAccessToken);

            // Ulangi request asli yang tadi gagal (dengan token baru)
            opts.headers = {
              ...opts.headers,
              Authorization: `Bearer ${newAccessToken}`
            };
            return await $fetch(req, opts);

          } catch (refreshError) {
            // Jika proses refresh gagal (misal session dihapus di DB Backend)
            processQueue(refreshError, null);
            accessToken.value = null;
            navigateTo('/login');
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        } 
        
        // Jika sedang ada proses refresh yang berjalan (isRefreshing = true),
        // antre request ini sampai token baru didapatkan
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          // Setelah token baru dapat, ulangi request-nya
          opts.headers = {
            ...opts.headers,
            Authorization: `Bearer ${token}`
          };
          return $fetch(req, opts);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }
    }
  });

  return customFetch(request, options);
};