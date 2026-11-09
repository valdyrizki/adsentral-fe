// URL file privat (hasil pesanan, file garansi, file stok, file produk AUTO) adalah presigned URL R2
// yang kedaluwarsa 1 jam. Setelah itu R2 menjawab 403 XML, jadi URL harus dicek sebelum dibuka.

// Anggap basi 10 menit sebelum benar-benar kedaluwarsa (= data berumur > 50 menit untuk URL 1 jam)
export const SIGNED_URL_SAFETY_MS = 10 * 60 * 1000
export const SIGNED_URL_FALLBACK_TTL_MS = 60 * 60 * 1000

/**
 * Waktu kedaluwarsa (epoch ms) dari presigned URL SigV4 (`X-Amz-Date` + `X-Amz-Expires`).
 * null bila URL bukan presigned URL (mis. URL publik permanen atau path relatif).
 */
export const getSignedUrlExpiry = (url: string): number | null => {
  try {
    const params = new URL(url).searchParams
    const date = params.get('X-Amz-Date') // format 20261110T143000Z
    const expires = Number(params.get('X-Amz-Expires'))
    const m = date?.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/)
    if (!m || !(expires > 0)) return null
    const signedAt = Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, +m[4]!, +m[5]!, +m[6]!)
    return signedAt + expires * 1000
  } catch {
    return null
  }
}

/** Path URL tanpa query: sama untuk file yang sama walau tanda tangannya diperbarui. */
export const stripUrlQuery = (url: string): string => url.split(/[?#]/)[0] ?? url
