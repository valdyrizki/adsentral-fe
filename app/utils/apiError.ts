// Ambil pesan BE dari error ofetch/createError agar status 400/403/409/422 tampil apa adanya
// (statusMessage ofetch hanya berisi teks HTTP generik seperti "Forbidden").
export const apiErrorMessage = (err: any, fallback = 'Terjadi kesalahan'): string =>
  err?.data?.message || err?.data?.statusMessage || err?.statusMessage || err?.message || fallback

export const apiErrorStatus = (err: any): number =>
  err?.status ?? err?.statusCode ?? err?.response?.status ?? 0

// Untuk `.catch(...)` pada panggilan api: ubah error HTTP menjadi error ber-pesan BE
// (`message` = `statusMessage` = pesan BE, `statusCode` = status HTTP asli, mis. 403/409).
export const rethrowApiError = (fallback: string) => (err: any): never => {
  throw createError({
    statusCode: apiErrorStatus(err) || 400,
    statusMessage: apiErrorMessage(err, fallback),
  })
}

// 403/409 pada aksi pesanan/payment = status sudah berubah di BE (halaman basi / aksi ganda).
// Pemanggil menampilkan pesan BE lalu memuat ulang data; jangan retry otomatis.
export const isStaleActionError = (err: any): boolean => [403, 409].includes(apiErrorStatus(err))
