import type { InjectionKey, Ref } from 'vue'

interface SignedFileSource {
  // Muat ulang data halaman yang berisi URL file (diskusi, garansi, stok, ...)
  refresh: () => Promise<unknown>
  // Data mentah yang berisi URL; dipindai untuk menemukan URL baru setelah refresh
  data: () => unknown
  loadedAt: Ref<number>
}

const SIGNED_FILE_SOURCE: InjectionKey<SignedFileSource> = Symbol('signed-file-source')

// Cari string URL dengan path sama (tanda tangan/query boleh beda) di dalam data hasil refresh.
// Dipakai karena handler klik menyimpan URL lama, bukan referensi ke data baru.
const findFreshUrl = (data: unknown, staleUrl: string): string | null => {
  const target = stripUrlQuery(staleUrl)
  const seen = new Set<object>()
  const walk = (value: unknown): string | null => {
    if (typeof value === 'string') return value && stripUrlQuery(value) === target ? value : null
    if (!value || typeof value !== 'object' || seen.has(value)) return null
    seen.add(value)
    for (const child of Object.values(value)) {
      const found = walk(child)
      if (found) return found
    }
    return null
  }
  return walk(data)
}

/**
 * Buka/unduh file privat yang URL-nya presigned (kedaluwarsa 1 jam).
 * Bila URL sudah/hampir kedaluwarsa: tampilkan "memuat ulang", refresh data lewat sumber yang
 * di-provide halaman, lalu buka URL baru. Tanpa sumber, minta user memuat ulang halaman.
 * Jangan simpan URL ini di storage awet dan jangan sediakan tombol "salin URL file".
 */
export const useSignedFileOpener = (source?: SignedFileSource) => {
  const ctx = source ?? inject(SIGNED_FILE_SOURCE, null)
  const toast = useToast()
  // Ambil config saat setup: handler klik berjalan di luar konteks Nuxt (terutama setelah await)
  const backendUrl = useRuntimeConfig().public.backendUrl as string
  const toAbsolute = (url: string) =>
    /^https?:\/\//.test(url) ? url : `${backendUrl}/${url.replace(/^\//, '')}`

  const isStale = (url: string) => {
    const expiry = getSignedUrlExpiry(toAbsolute(url))
    if (expiry !== null) return Date.now() > expiry - SIGNED_URL_SAFETY_MS
    // URL tanpa info kedaluwarsa: pakai umur data
    return !!ctx && Date.now() - ctx.loadedAt.value > SIGNED_URL_FALLBACK_TTL_MS - SIGNED_URL_SAFETY_MS
  }

  const download = (url: string, fileName?: string | null) => {
    const link = document.createElement('a')
    link.href = toAbsolute(url)
    link.download = fileName ?? ''
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return async (url: string | null | undefined, fileName?: string | null) => {
    if (!url) {
      toast.add({ title: 'Gagal', description: 'File tidak tersedia untuk diunduh', color: 'error', icon: 'material-symbols:error-outline' })
      return
    }
    if (!isStale(url)) return download(url, fileName)

    if (!ctx) {
      toast.add({ title: 'Link file kedaluwarsa', description: 'Muat ulang halaman untuk mendapatkan link baru.', color: 'warning' })
      return
    }

    toast.add({ title: 'Link file kedaluwarsa, memuat ulang…', color: 'info', icon: 'mdi:refresh' })
    try {
      await ctx.refresh()
    } catch {
      // ditangani di bawah: URL baru tidak ditemukan
    }
    await nextTick()
    const fresh = findFreshUrl(ctx.data(), url)
    if (!fresh || isStale(fresh)) {
      toast.add({ title: 'Gagal memuat ulang link file', description: 'Muat ulang halaman lalu coba lagi.', color: 'error' })
      return
    }
    download(fresh, fileName)
  }
}

/**
 * Dipanggil di halaman yang menampilkan file privat. Komponen turunan (mis. AppFileDownloadButton)
 * otomatis memakai sumber ini lewat `useSignedFileOpener()`. Mengembalikan opener untuk halaman itu sendiri.
 */
export const provideSignedFileSource = (refresh: () => Promise<unknown>, data: () => unknown) => {
  const loadedAt = ref(Date.now())
  watch(data, () => { loadedAt.value = Date.now() })
  const source: SignedFileSource = { refresh, data, loadedAt }
  provide(SIGNED_FILE_SOURCE, source)
  return useSignedFileOpener(source)
}
