import type { Ref } from 'vue'
import type { TxStatusFilterOption } from '~/utils/txStatusFilter'

const SEARCH_DEBOUNCE_MS = 400

const firstString = (v: unknown): string => (Array.isArray(v) ? String(v[0] ?? '') : typeof v === 'string' ? v : '')

/**
 * Filter status + pencarian ID transaksi untuk daftar transaksi (buyer & seller).
 * Keduanya disimpan di query string (?status=PAID&keyword=ab12) dan bekerja bersamaan.
 * `search` = isi input; `keyword` = nilai terapkan (di-trim, debounce 400 ms) yang dipakai untuk fetch.
 */
export const useTxListFilters = (options: TxStatusFilterOption[], page: Ref<number>) => {
  const route = useRoute()
  const router = useRouter()

  const filterStatus = ref(parseTxStatusQuery(route.query.status, options))
  const search = ref(firstString(route.query.keyword))
  const keyword = ref(search.value.trim())

  const activeStatusLabel = computed(() => options.find(o => o.value === filterStatus.value)?.label ?? '')

  let timer: ReturnType<typeof setTimeout> | null = null
  const clearTimer = () => {
    if (timer) clearTimeout(timer)
    timer = null
  }

  // Terapkan keyword sekarang juga (Enter / tombol hapus)
  const applySearchNow = () => {
    clearTimer()
    keyword.value = search.value.trim()
  }
  const clearSearch = () => {
    search.value = ''
    applySearchNow()
  }

  watch(search, (val) => {
    clearTimer()
    timer = setTimeout(() => { keyword.value = val.trim() }, SEARCH_DEBOUNCE_MS)
  })

  // Ganti status / keyword -> halaman 0 & sinkronkan URL (yang lain tetap dipertahankan)
  watch([filterStatus, keyword], ([status, kw]) => {
    page.value = 0
    router.replace({
      query: { ...route.query, status: status === 'ALL' ? undefined : status, keyword: kw || undefined },
    })
  })

  // Back/forward browser mengubah query -> ikuti
  watch(() => route.query.status, (q) => {
    const parsed = parseTxStatusQuery(q, options)
    if (parsed !== filterStatus.value) filterStatus.value = parsed
  })
  watch(() => route.query.keyword, (q) => {
    const kw = firstString(q).trim()
    if (kw !== keyword.value) {
      clearTimer()
      search.value = kw
      keyword.value = kw
    }
  })

  onBeforeUnmount(clearTimer)

  return { filterStatus, search, keyword, activeStatusLabel, applySearchNow, clearSearch }
}
