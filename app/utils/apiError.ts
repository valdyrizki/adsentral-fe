// Ambil pesan BE dari error ofetch/createError agar status 400/403/409/422 tampil apa adanya
// (statusMessage ofetch hanya berisi teks HTTP generik seperti "Forbidden").
export const apiErrorMessage = (err: any, fallback = 'Terjadi kesalahan'): string =>
  err?.data?.message || err?.data?.statusMessage || err?.statusMessage || err?.message || fallback

export const apiErrorStatus = (err: any): number =>
  err?.status ?? err?.statusCode ?? err?.response?.status ?? 0

// Kode error yang dikirim BE di `data` body error: { status: 'error', message, data: { code, ... } }.
// Key di dalam `data` ini camelCase (pengecualian dari konvensi snake_case BE).
export type ApiErrorCode = 'RATE_LIMITED' | 'ACCOUNT_LOCKED' | 'VERIFICATION_LOCKED' | 'LOGIN_NOT_LOCKED'

export interface ApiErrorDetail {
  code: ApiErrorCode | string
  retryAfterSeconds?: number
  lockedUntil?: string // waktu lokal WIB tanpa offset; untuk hitung mundur pakai retryAfterSeconds
}

// `err.data` = body WebResponse, baik dari FetchError ofetch maupun createError yang meneruskan `data`.
// Bedakan kasus dari `code`, jangan dari teks pesan.
export const apiErrorDetail = (err: any): ApiErrorDetail | null => {
  const detail = err?.data?.data
  return detail && typeof detail === 'object' && typeof detail.code === 'string' ? detail : null
}

// Lama tunggu (detik) dari `retryAfterSeconds`, fallback ke header Retry-After. 0 = tidak diketahui.
export const apiErrorRetryAfter = (err: any): number => {
  const fromBody = Number(apiErrorDetail(err)?.retryAfterSeconds)
  if (fromBody > 0) return Math.ceil(fromBody)
  const fromHeader = Number(err?.response?.headers?.get?.('retry-after'))
  return fromHeader > 0 ? Math.ceil(fromHeader) : 0
}

// Untuk `.catch(...)` pada panggilan api: ubah error HTTP menjadi error ber-pesan BE
// (`message` = `statusMessage` = pesan BE, `statusCode` = status HTTP asli, mis. 403/409).
// Body BE diteruskan sebagai `data` supaya `apiErrorDetail` tetap bisa membaca kode error.
export const rethrowApiError = (fallback: string) => (err: any): never => {
  throw createError({
    statusCode: apiErrorStatus(err) || 400,
    statusMessage: apiErrorMessage(err, fallback),
    data: err?.data,
  })
}

// 403/409 pada aksi pesanan/payment = status sudah berubah di BE (halaman basi / aksi ganda).
// Pemanggil menampilkan pesan BE lalu memuat ulang data; jangan retry otomatis.
export const isStaleActionError = (err: any): boolean => [403, 409].includes(apiErrorStatus(err))
