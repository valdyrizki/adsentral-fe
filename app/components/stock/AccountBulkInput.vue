<template>
  <div class="space-y-6">
    <!-- Input -->
    <UCard class="shadow-sm">
      <template #header>
        <p class="font-semibold text-gray-800">Tambah Akun Massal</p>
      </template>

      <div class="space-y-4">
        <UFormField label="Tipe Akun" help="Berlaku untuk semua baris. Jika kosong, otomatis 'Lainnya'.">
          <StockAccountTypeSelect v-model="accountTypeId" empty-label="Tidak dipilih (otomatis 'Lainnya')" :disabled="busy" />
        </UFormField>

        <div class="flex gap-2">
          <UButton
            icon="i-lucide-text-cursor-input"
            size="sm"
            :color="source === 'text' ? 'primary' : 'neutral'"
            :variant="source === 'text' ? 'soft' : 'ghost'"
            :disabled="busy"
            @click="source = 'text'"
          >
            Paste Teks
          </UButton>
          <UButton
            icon="i-lucide-file-spreadsheet"
            size="sm"
            :color="source === 'csv' ? 'primary' : 'neutral'"
            :variant="source === 'csv' ? 'soft' : 'ghost'"
            :disabled="busy"
            @click="source = 'csv'"
          >
            Import CSV
          </UButton>
        </div>

        <!-- Paste teks -->
        <div v-if="source === 'text'" class="space-y-3">
          <div class="rounded-xl bg-gray-50 border border-gray-100 p-3 text-xs text-gray-600 space-y-1">
            <p>Satu akun per baris, kolom dipisah <code class="font-mono">|</code> dengan urutan:</p>
            <p class="font-mono text-gray-800 break-all">uid|username|password|email|password_email|2fa_secret|cookie|notes</p>
            <p>Kolom boleh kosong. Contoh:</p>
            <pre class="font-mono text-gray-800 whitespace-pre-wrap break-all">123456|user1|pass1|a@mail.com|mailpass|JBSWY3DPEHPK3PXP||Rank Mythic
|user2|pass2|||||
789012|||||||Akun cadangan</pre>
            <p class="text-gray-400">Untuk cookie yang panjang atau mengandung karakter <code class="font-mono">|</code>, gunakan Import CSV.</p>
          </div>
          <UTextarea
            v-model="rawText"
            :rows="8"
            autoresize
            :maxrows="16"
            placeholder="uid|username|password|email|password_email|2fa_secret|cookie|notes"
            class="w-full font-mono text-xs"
            :disabled="busy"
          />
          <div class="flex justify-end">
            <UButton icon="i-lucide-scan-line" color="primary" variant="soft" :disabled="!rawText.trim() || busy" @click="parseText">
              Proses & Preview
            </UButton>
          </div>
        </div>

        <!-- Import CSV -->
        <div v-else class="space-y-3">
          <div class="rounded-xl bg-gray-50 border border-gray-100 p-3 text-xs text-gray-600 space-y-1">
            <p>Baris pertama berisi header kolom:</p>
            <p class="font-mono text-gray-800 break-all">{{ CSV_HEADER }}</p>
            <p>
              Kolom <code class="font-mono">type</code> <span class="font-medium">opsional</span>: kosongkan (atau hapus dari header) untuk memakai Tipe Akun di atas.
              Isi hanya jika satu file berisi tipe yang berbeda-beda, dengan nama tipe akun (contoh: Mobile Legends).
            </p>
            <p>Gunakan tanda kutip untuk nilai yang mengandung koma.</p>
            <UButton icon="i-lucide-download" size="xs" color="primary" variant="link" class="px-0" @click="downloadTemplate">
              Download template CSV
            </UButton>
          </div>
          <div
            class="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer border-gray-300 hover:border-blue-300 hover:bg-gray-50"
            @click="csvInputRef?.click()"
          >
            <input ref="csvInputRef" type="file" accept=".csv,text/csv" class="hidden" :disabled="busy" @change="onCsvSelected" />
            <UIcon name="i-lucide-file-spreadsheet" class="text-3xl text-gray-300 mb-2" />
            <p class="text-sm font-medium text-gray-600">{{ csvFileName || 'Klik untuk memilih file CSV' }}</p>
          </div>
        </div>

        <p v-if="parseError" class="text-sm text-red-500">{{ parseError }}</p>
      </div>
    </UCard>

    <!-- Preview -->
    <UCard v-if="rows.length" class="shadow-sm">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="font-semibold text-gray-800">
            Preview
            <span class="text-xs text-gray-400 font-normal ml-2">({{ rows.length }} akun)</span>
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <UBadge v-if="!isChecked" color="neutral" variant="soft">
              {{ checkResult ? 'Data berubah, cek ulang' : 'Belum dicek' }}
            </UBadge>
            <StockCheckSummary v-else :summary="checkResult?.summary" />
            <UButton v-if="blockedCount" icon="mdi:delete-outline" size="xs" color="error" variant="ghost" :disabled="busy" @click="removeBlockedRows">
              Hapus baris tidak valid
            </UButton>
          </div>
        </div>
      </template>

      <div class="space-y-3">
        <UAlert
          v-if="rows.length > MAX_BULK_ACCOUNTS"
          icon="i-lucide-alert-triangle"
          color="error"
          variant="subtle"
          :title="`Maksimal ${MAX_BULK_ACCOUNTS} akun per pengiriman`"
          :description="`Input berisi ${rows.length} akun. Pecah input menjadi beberapa bagian (maks. ${MAX_BULK_ACCOUNTS} baris) lalu kirim satu per satu.`"
        />
        <UAlert
          v-if="!isChecked"
          icon="i-lucide-scan-search"
          color="info"
          variant="subtle"
          :title="checkResult ? 'Data berubah sejak dicek' : 'Cek akun sebelum menyimpan'"
          description="Klik 'Cek Akun' untuk melihat akun baru, yang pernah terjual, yang masih ada di stok, dan duplikat. Belum ada data yang disimpan."
        />
        <UAlert
          v-if="submitError"
          icon="i-lucide-x-circle"
          color="error"
          variant="subtle"
          title="Gagal, tidak ada akun yang tersimpan"
          :description="submitError"
        />

        <!-- Aksi cepat untuk akun yang pernah terjual -->
        <StockSentActions :count="sentCount" :disabled="busy" @set="setAllSent" />

        <div ref="tableRef" class="overflow-x-auto max-h-[32rem] overflow-y-auto rounded-xl border border-gray-100">
          <table class="min-w-full text-xs">
            <thead class="bg-gray-50 text-gray-500 sticky top-0 z-10">
              <tr>
                <th class="px-2 py-2 text-left font-medium">#</th>
                <th class="px-2 py-2 text-left font-medium">Tipe</th>
                <th class="px-2 py-2 text-left font-medium">UID</th>
                <th class="px-2 py-2 text-left font-medium">Username</th>
                <th class="px-2 py-2 text-left font-medium">Password</th>
                <th class="px-2 py-2 text-left font-medium">Email</th>
                <th class="px-2 py-2 text-left font-medium">Pass Email</th>
                <th class="px-2 py-2 text-left font-medium">2FA</th>
                <th class="px-2 py-2 text-left font-medium">Cookie</th>
                <th class="px-2 py-2 text-left font-medium">Notes</th>
                <th class="px-2 py-2 text-left font-medium">Status</th>
                <th class="px-2 py-2 text-left font-medium">Aksi</th>
                <th class="px-2 py-2" />
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="(row, idx) in rows"
                :key="`${row.sourceLine}-${idx}`"
                :data-row="idx"
                :class="rowClass(row, idx)"
              >
                <td class="px-2 py-1.5 text-gray-400 font-mono" :title="`Baris sumber ${row.sourceLine}`">{{ idx + 1 }}</td>
                <td class="px-2 py-1.5 whitespace-nowrap">{{ typeLabel(row) }}</td>
                <td class="px-2 py-1.5 font-mono">{{ row.account_uid || '' }}</td>
                <td class="px-2 py-1.5 font-mono">{{ row.account_username || '' }}</td>
                <td class="px-2 py-1.5 font-mono">{{ row.account_password || '' }}</td>
                <td class="px-2 py-1.5">{{ row.account_email || '' }}</td>
                <td class="px-2 py-1.5 font-mono">{{ row.account_email_password || '' }}</td>
                <td class="px-2 py-1.5 font-mono">{{ row.account_two_fa_secret || '' }}</td>
                <!-- Cookie bisa sangat panjang: dipotong, isi lengkap lewat hover -->
                <td class="px-2 py-1.5 font-mono max-w-48 truncate" :title="row.account_cookie">{{ row.account_cookie || '' }}</td>
                <td class="px-2 py-1.5 max-w-48 truncate" :title="row.description">{{ row.description || '' }}</td>

                <!-- Status: error dari simpan → error client → hasil cek BE -->
                <td class="px-2 py-1.5 min-w-44">
                  <span v-if="idx === errorRowIndex" class="text-red-600 font-medium">{{ submitError }}</span>
                  <span v-else-if="row.errors.length" class="text-red-600">{{ row.errors.join('; ') }}</span>
                  <StockCheckStatus v-else-if="rowCheck(idx)" :check="rowCheck(idx)!" />
                  <span v-else class="text-gray-300">—</span>
                </td>

                <!-- Keputusan per baris -->
                <td class="px-2 py-1.5 whitespace-nowrap">
                  <StockDuplicateDecision v-if="rowCheck(idx)" v-model="decisions[idx]" :check="rowCheck(idx)!" :disabled="busy" />
                </td>
                <td class="px-2 py-1.5">
                  <UButton icon="mdi:delete-outline" size="xs" color="error" variant="ghost" :disabled="busy" @click="removeRow(idx)" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <template #footer>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm text-gray-500">
            <template v-if="isChecked">
              Akan ditambahkan: <span class="font-semibold text-gray-800">{{ estimate.added }}</span>,
              dilewati: <span class="font-semibold text-gray-800">{{ estimate.skipped }}</span>
              <span v-if="invalidCount" class="text-red-500"> · {{ invalidCount }} baris tidak valid harus diperbaiki / dihapus lalu cek ulang</span>
            </template>
            <template v-else>
              Total <span class="font-medium text-gray-800">{{ rows.length }}</span> akun
              <span v-if="clientErrorCount" class="text-red-500"> · hapus {{ clientErrorCount }} baris dengan tipe tidak dikenal</span>
            </template>
          </p>
          <div class="flex gap-2">
            <UButton color="neutral" variant="outline" :disabled="busy" @click="resetAll">Reset</UButton>
            <UButton
              icon="i-lucide-scan-search"
              :color="isChecked ? 'neutral' : 'primary'"
              :variant="isChecked ? 'outline' : 'solid'"
              :loading="checking"
              :disabled="!canCheck"
              @click="runCheck()"
            >
              {{ checkResult ? 'Cek Ulang' : 'Cek Akun' }}
            </UButton>
            <UButton icon="i-lucide-upload" color="primary" :loading="submitting" :disabled="!canSubmit" @click="handleSubmit">
              Simpan{{ isChecked ? ` (${estimate.added} akun)` : '' }}
            </UButton>
          </div>
        </div>
      </template>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
import { useProductsApi } from '~/composables/api/product'
import {
  CSV_HEADER,
  MAX_BULK_ACCOUNTS,
  extractErrorLine,
  parseCsvInput,
  parsePipeInput,
  toBulkItem,
  validateBulkRows,
  type BulkAccountRow,
} from '~/helper/stockAccountHelper'
import type { StockAccountBulkItem, StockAccountBulkRequest } from '~/types/product/ProductStockItemRequest'
import type { StockErrorData } from '~/types/product/StockBulkCheck'

const props = defineProps<{ productId: number }>()
const emit = defineEmits<{ success: [message: string] }>()

const toast = useToast()
const { checkProductStockAccountsBulk, addProductStockAccountsBulk } = useProductsApi()

const { data: accountTypes } = useAccountTypes()

const accountTypeId = ref<number | null>(null)
const source = ref<'text' | 'csv'>('text')
const rawText = ref('')
const csvFileName = ref('')
const csvInputRef = ref<HTMLInputElement | null>(null)
const parseError = ref('')

const rows = ref<BulkAccountRow[]>([])
const submitting = ref(false)
const submitError = ref('')
const errorRowIndex = ref<number | null>(null)
const tableRef = ref<HTMLElement | null>(null)

// ===== HASIL CEK (dryRun) & PILIHAN SELLER =====
const {
  checkResult,
  decisions,
  checking,
  isChecked,
  rowCheck,
  invalidCount,
  invalidIndexes,
  sentCount,
  estimate,
  markChanged: markCheckStale,
  resetDecisions,
  reset: resetCheck,
  runCheck: runDuplicateCheck,
  onDuplicateFor,
  setAllSent,
} = useStockDuplicateCheck()

const busy = computed(() => checking.value || submitting.value)

const clientErrorCount = computed(() => rows.value.filter(r => r.errors.length).length)
const blockedCount = computed(() => clientErrorCount.value + invalidCount.value)

const canCheck = computed(() =>
  !!props.productId &&
  rows.value.length > 0 &&
  rows.value.length <= MAX_BULK_ACCOUNTS &&
  clientErrorCount.value === 0 &&
  !busy.value
)
const canSubmit = computed(() => canCheck.value && isChecked.value && invalidCount.value === 0)

function markChanged() {
  markCheckStale()
  submitError.value = ''
  errorRowIndex.value = null
}

function revalidate() {
  validateBulkRows(rows.value, accountTypes.value ?? [])
  markChanged()
}

// Tipe default / daftar tipe berubah → isi request berubah, hasil cek tidak berlaku
watch([accountTypeId, accountTypes], () => { if (rows.value.length) revalidate() })

// Produk berganti → mulai dari awal
watch(() => props.productId, () => resetAll())

function setRows(parsed: BulkAccountRow[]) {
  rows.value = parsed
  resetCheck()
  revalidate()
  if (!parsed.length) parseError.value = 'Tidak ada baris yang bisa diproses'
}

function parseText() {
  parseError.value = ''
  setRows(parsePipeInput(rawText.value))
}

async function onCsvSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  parseError.value = ''
  csvFileName.value = file.name
  const result = parseCsvInput(await file.text())
  if (result.error) {
    rows.value = []
    resetCheck()
    parseError.value = result.error
    return
  }
  setRows(result.rows)
}

function downloadTemplate() {
  // Kolom type dikosongkan: tipe mengikuti pilihan Tipe Akun di atas
  const sample = `${CSV_HEADER}\n,123456,user1,pass1,a@mail.com,mailpass,JBSWY3DPEHPK3PXP,,Rank Mythic\n,,user2,pass2,,,,,\n`
  const url = URL.createObjectURL(new Blob([sample], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'template-akun.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// Menghapus baris menggeser nomor baris → hasil cek tidak berlaku, pilihan direset
function removeRow(idx: number) {
  rows.value.splice(idx, 1)
  resetDecisions()
  revalidate()
}

function removeBlockedRows() {
  const invalid = invalidIndexes.value
  rows.value = rows.value.filter((r, idx) => !r.errors.length && !invalid.has(idx))
  resetDecisions()
  revalidate()
}

function resetAll() {
  rows.value = []
  rawText.value = ''
  csvFileName.value = ''
  parseError.value = ''
  resetCheck()
  markChanged()
}

function typeLabel(row: BulkAccountRow) {
  if (row.typeName) return row.typeName
  const id = accountTypeId.value
  const type = id ? accountTypes.value?.find(t => t.id === id) : undefined
  return type?.name ?? 'Lainnya'
}

function rowClass(row: BulkAccountRow, idx: number) {
  if (idx === errorRowIndex.value) return 'bg-red-100'
  if (row.errors.length) return 'bg-red-50'
  const status = rowCheck(idx)?.status
  if (status === 'INVALID') return 'bg-red-50'
  if (status === 'DUPLICATE_ACTIVE' || status === 'DUPLICATE_IN_FILE') return 'bg-gray-50 text-gray-500'
  if (status === 'DUPLICATE_SENT') return decisions.value[idx] === 'ADD' ? 'bg-amber-50' : 'bg-gray-50 text-gray-500'
  return ''
}

function buildRequest(items: StockAccountBulkItem[]): StockAccountBulkRequest {
  return {
    ...(accountTypeId.value ? { account_type_id: accountTypeId.value } : {}),
    items,
  }
}

async function scrollToRow(idx: number) {
  await nextTick()
  tableRef.value?.querySelector(`[data-row="${idx}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
}

/**
 * Langkah 1 (dryRun): kirim semua baris tanpa on_duplicate. Tidak ada yang disimpan.
 * keepDecisions: pertahankan pilihan seller untuk baris yang statusnya tidak berubah (cek ulang otomatis).
 */
async function runCheck(keepDecisions = false) {
  if (!canCheck.value) return
  submitError.value = ''
  errorRowIndex.value = null
  try {
    const result = await runDuplicateCheck(
      () => checkProductStockAccountsBulk(props.productId, buildRequest(rows.value.map(toBulkItem))),
      keepDecisions,
    )
    const firstInvalid = result.rows.find(r => r.status === 'INVALID')
    if (firstInvalid) scrollToRow(firstInvalid.row - 1)
  } catch (err: any) {
    const message: string = err.statusMessage || err.message || 'Gagal mengecek akun'
    submitError.value = message
    toast.add({ title: 'Gagal ❌', description: message, color: 'error' })
  }
}

// Langkah 2 (simpan): items sama & urutan sama dengan saat cek, ditambah on_duplicate
async function handleSubmit() {
  if (!canSubmit.value) return
  submitting.value = true
  submitError.value = ''
  errorRowIndex.value = null
  try {
    const items = rows.value.map((row, idx) => {
      const item = toBulkItem(row)
      const onDuplicate = onDuplicateFor(idx)
      return onDuplicate ? { ...item, on_duplicate: onDuplicate } : item
    })
    const result = await addProductStockAccountsBulk(props.productId, buildRequest(items))
    toast.add({
      title: 'Berhasil ✅',
      description: result.message || `${result.added} akun ditambahkan, ${result.skipped} dilewati`,
      color: 'success',
    })
    emit('success', result.message)
    resetAll()
  } catch (err: any) {
    const message: string = err.statusMessage || err.message || 'Gagal menambah akun'
    const data = (err.data ?? {}) as StockErrorData

    if (data.code === 'STOCK_CHECK_OUTDATED') {
      // Kondisi stok berubah sejak dicek → cek ulang otomatis; pilihan untuk baris yang statusnya sama dipertahankan
      toast.add({ title: 'Data berubah sejak dicek', description: `${message} Hasil cek sudah diperbarui, silakan periksa lagi.`, color: 'warning' })
      submitting.value = false
      await runCheck(true)
      return
    }

    submitError.value = message
    const line = data.row ?? extractErrorLine(message)
    if (line && line >= 1 && line <= rows.value.length) {
      errorRowIndex.value = line - 1
      scrollToRow(line - 1)
    }
    toast.add({ title: 'Gagal ❌', description: message, color: 'error' })
  } finally {
    submitting.value = false
  }
}
</script>
