import type { StockDuplicateAction } from '~/types/product/ProductStockItemRequest'
import type { StockBulkCheckResponse, StockBulkCheckRow, StockBulkRowStatus } from '~/types/product/StockBulkCheck'

type BadgeColor = 'success' | 'warning' | 'info' | 'neutral' | 'error'

export const STOCK_CHECK_STATUS_META: Record<StockBulkRowStatus, { label: string; color: BadgeColor }> = {
  NEW: { label: 'Baru', color: 'success' },
  DUPLICATE_SENT: { label: 'Pernah terjual', color: 'warning' },
  DUPLICATE_ACTIVE: { label: 'Masih di stok', color: 'info' },
  DUPLICATE_IN_FILE: { label: 'Duplikat', color: 'neutral' },
  INVALID: { label: 'Tidak valid', color: 'error' },
}

export const stockCheckStatusLabel = (check: StockBulkCheckRow) =>
  check.status === 'DUPLICATE_IN_FILE' && check.duplicate_of_row
    ? `Duplikat baris ${check.duplicate_of_row}`
    : STOCK_CHECK_STATUS_META[check.status].label

/**
 * State alur cek → pilih → simpan untuk bulk stok (akun maupun file), dipakai bersama.
 * - Hasil cek (dryRun) hanya berlaku untuk versi data saat dicek; panggil markChanged() setiap isi input berubah.
 * - Pilihan Skip/Tambah ulang hanya untuk DUPLICATE_SENT (default SKIP); status lain ditentukan otomatis.
 */
export const useStockDuplicateCheck = () => {
  const checkResult = ref<StockBulkCheckResponse | null>(null)
  const decisions = ref<Record<number, StockDuplicateAction>>({})
  const dataVersion = ref(0)
  const checkedVersion = ref(-1)
  const checking = ref(false)

  const isChecked = computed(() => !!checkResult.value && checkedVersion.value === dataVersion.value)

  // index baris (0-based) → hasil cek; `row` dari BE 1-based sesuai urutan yang dikirim
  const checkByIndex = computed(() => {
    const map = new Map<number, StockBulkCheckRow>()
    for (const r of checkResult.value?.rows ?? []) map.set(r.row - 1, r)
    return map
  })

  // Hasil cek suatu baris, hanya selama masih berlaku
  const rowCheck = (idx: number) => (isChecked.value ? checkByIndex.value.get(idx) : undefined)

  const checkedRows = computed(() => (isChecked.value ? checkResult.value?.rows ?? [] : []))
  const invalidCount = computed(() => checkedRows.value.filter(r => r.status === 'INVALID').length)
  const sentCount = computed(() => checkedRows.value.filter(r => r.status === 'DUPLICATE_SENT').length)
  const invalidIndexes = computed(() => new Set(checkedRows.value.filter(r => r.status === 'INVALID').map(r => r.row - 1)))

  // Perkiraan hasil simpan berdasarkan status cek & pilihan seller
  const estimate = computed(() => {
    let added = 0
    let skipped = 0
    checkByIndex.value.forEach((check, idx) => {
      if (check.status === 'NEW') added++
      else if (check.status === 'DUPLICATE_SENT' && decisions.value[idx] === 'ADD') added++
      else if (check.status !== 'INVALID') skipped++
    })
    return { added, skipped }
  })

  function markChanged() {
    dataVersion.value++
  }

  // Menghapus/menggeser baris membuat pilihan lama tidak cocok lagi dengan index-nya
  function resetDecisions() {
    decisions.value = {}
  }

  function reset() {
    checkResult.value = null
    decisions.value = {}
    markChanged()
  }

  /**
   * Jalankan cek (dryRun) lewat `fetcher`. Error dilempar ke pemanggil.
   * keepDecisions: pertahankan pilihan seller untuk baris yang statusnya tidak berubah (cek ulang otomatis).
   */
  async function runCheck(fetcher: () => Promise<StockBulkCheckResponse>, keepDecisions = false) {
    checking.value = true
    const version = dataVersion.value
    const previous = checkByIndex.value
    const previousDecisions = decisions.value
    try {
      const result = await fetcher()
      const next: Record<number, StockDuplicateAction> = {}
      for (const r of result.rows) {
        if (r.status !== 'DUPLICATE_SENT') continue
        const idx = r.row - 1
        const kept = keepDecisions && previous.get(idx)?.status === r.status ? previousDecisions[idx] : undefined
        next[idx] = kept ?? 'SKIP'
      }
      checkResult.value = result
      decisions.value = next
      checkedVersion.value = version
      return result
    } finally {
      checking.value = false
    }
  }

  // Nilai on_duplicate untuk baris (undefined = baris baru)
  function onDuplicateFor(idx: number): StockDuplicateAction | undefined {
    const status = checkByIndex.value.get(idx)?.status
    if (status === 'DUPLICATE_SENT') return decisions.value[idx] === 'ADD' ? 'ADD' : 'SKIP'
    if (status === 'DUPLICATE_ACTIVE' || status === 'DUPLICATE_IN_FILE') return 'SKIP'
    return undefined
  }

  function setAllSent(action: StockDuplicateAction) {
    checkByIndex.value.forEach((check, idx) => {
      if (check.status === 'DUPLICATE_SENT') decisions.value[idx] = action
    })
  }

  return {
    checkResult,
    decisions,
    checking,
    isChecked,
    rowCheck,
    invalidCount,
    invalidIndexes,
    sentCount,
    estimate,
    markChanged,
    resetDecisions,
    reset,
    runCheck,
    onDuplicateFor,
    setAllSent,
  }
}
