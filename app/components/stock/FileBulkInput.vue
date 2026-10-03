<template>
  <div class="space-y-6">
    <UCard class="shadow-sm">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="font-semibold text-gray-800">Upload Banyak File</p>
          <div v-if="uidMode && multiFiles.length" class="flex flex-wrap items-center gap-2">
            <UBadge v-if="!isChecked" color="neutral" variant="soft">
              {{ checkResult ? 'Data berubah, cek ulang' : 'Belum dicek' }}
            </UBadge>
            <StockCheckSummary v-else :summary="checkResult?.summary" />
          </div>
        </div>
      </template>

      <div class="space-y-4">
        <!-- Mode UID dari nama file -->
        <div class="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-3">
          <UCheckbox
            v-model="uidMode"
            label="Isi UID dari nama file"
            description="UID tiap item diambil dari nama file tanpa ekstensi (mis. 123456789.txt → 123456789). Item ikut dicek duplikat dan bisa dicari lewat filter akun."
            :disabled="busy"
          />
          <UFormField v-if="uidMode" label="Tipe Akun" help="Jika kosong, otomatis 'Lainnya'">
            <StockAccountTypeSelect v-model="accountTypeId" empty-label="Tidak dipilih (otomatis 'Lainnya')" :disabled="busy" />
          </UFormField>
        </div>

        <!-- Drop zone -->
        <div
          class="border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer"
          :class="isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'"
          @click="triggerFileInput"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="onDrop"
        >
          <input
            ref="fileInputRef"
            type="file"
            multiple
            class="hidden"
            :disabled="busy"
            @change="onFilesSelected"
          />
          <UIcon name="i-lucide-upload-cloud" class="text-4xl text-gray-300 mb-3" />
          <p class="text-sm font-medium text-gray-600">Klik atau seret file ke sini</p>
          <p class="text-xs text-gray-400 mt-1">Pilih banyak file sekaligus — setiap file = 1 stok</p>
        </div>

        <template v-if="uidMode && multiFiles.length">
          <UAlert
            v-if="!isChecked"
            icon="i-lucide-scan-search"
            color="info"
            variant="subtle"
            :title="checkResult ? 'Data berubah sejak dicek' : 'Cek file sebelum menyimpan'"
            description="Klik 'Cek' untuk melihat UID yang baru, pernah terjual, masih ada di stok, atau duplikat. File belum diupload saat cek."
          />
          <StockSentActions :count="sentCount" noun="file" :disabled="busy" @set="setAllSent" />
        </template>
        <UAlert
          v-if="submitError"
          icon="i-lucide-x-circle"
          color="error"
          variant="subtle"
          title="Gagal, tidak ada file yang tersimpan"
          :description="submitError"
        />

        <!-- Daftar file terpilih -->
        <div v-if="multiFiles.length" ref="listRef" class="space-y-2">
          <div class="flex items-center justify-between mb-1">
            <p class="text-sm font-medium text-gray-700">{{ multiFiles.length }} file dipilih</p>
            <UButton icon="i-lucide-x" size="xs" color="neutral" variant="ghost" :disabled="busy" @click="clearMultiFiles">
              Hapus Semua
            </UButton>
          </div>

          <div
            v-for="(f, idx) in multiFiles"
            :key="`${f.file.name}-${f.file.size}-${idx}`"
            :data-row="idx"
            class="flex flex-wrap items-center gap-3 px-3 py-2 rounded-lg border"
            :class="rowClass(idx)"
          >
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center flex-none"
              :class="f.status === 'success' ? 'bg-green-50' : f.status === 'error' ? 'bg-red-50' : 'bg-blue-50'"
            >
              <UIcon
                :name="f.status === 'success' ? 'i-lucide-check-circle' : f.status === 'error' ? 'i-lucide-x-circle' : f.status === 'uploading' ? 'i-lucide-loader' : 'i-lucide-file'"
                class="size-4"
                :class="f.status === 'success' ? 'text-green-500' : f.status === 'error' ? 'text-red-500' : f.status === 'uploading' ? 'text-blue-500 animate-spin' : 'text-blue-400'"
              />
            </div>
            <div class="flex-1 min-w-40">
              <p class="text-sm text-gray-800 truncate">
                <span v-if="uidMode" class="text-gray-400 font-mono mr-1">{{ idx + 1 }}.</span>{{ f.file.name }}
              </p>
              <p v-if="f.status === 'error'" class="text-xs text-red-500 truncate">{{ f.error }}</p>
              <p v-else class="text-xs text-gray-400 flex flex-wrap gap-x-3">
                <span>{{ formatFileSize(f.file.size) }}</span>
                <!-- Pratinjau UID (nilai final ditentukan BE) -->
                <span v-if="uidMode">UID: <span class="font-mono text-gray-700">{{ uidFromFileName(f.file.name) || '—' }}</span></span>
              </p>
            </div>

            <template v-if="uidMode">
              <div class="text-xs min-w-36">
                <span v-if="idx === errorRowIndex" class="text-red-600 font-medium">{{ submitError }}</span>
                <StockCheckStatus v-else-if="rowCheck(idx)" :check="rowCheck(idx)!" />
              </div>
              <div class="text-xs">
                <StockDuplicateDecision v-if="rowCheck(idx)" v-model="decisions[idx]" :check="rowCheck(idx)!" :disabled="busy" />
              </div>
            </template>

            <UButton
              v-if="f.status !== 'uploading'"
              icon="mdi:delete-outline"
              size="xs"
              color="error"
              variant="ghost"
              :disabled="busy"
              @click="removeMultiFile(idx)"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <!-- Mode UID: Cek → Simpan -->
        <div v-if="uidMode" class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm text-gray-500">
            <template v-if="isChecked">
              Akan ditambahkan: <span class="font-semibold text-gray-800">{{ estimate.added }}</span>,
              dilewati: <span class="font-semibold text-gray-800">{{ estimate.skipped }}</span>
              <span v-if="invalidCount" class="text-red-500"> · hapus {{ invalidCount }} file tidak valid lalu cek ulang</span>
            </template>
            <template v-else>
              <span class="font-medium text-gray-800">{{ multiFiles.length }}</span> file dipilih
            </template>
          </p>
          <div class="flex gap-2">
            <UButton
              icon="i-lucide-scan-search"
              :color="isChecked ? 'neutral' : 'primary'"
              :variant="isChecked ? 'outline' : 'solid'"
              :loading="checking"
              :disabled="!canCheck"
              @click="runCheck()"
            >
              {{ checkResult ? 'Cek Ulang' : 'Cek' }}
            </UButton>
            <UButton icon="i-lucide-upload" color="primary" :loading="submitting" :disabled="!canSave" @click="handleSaveUid">
              Simpan{{ isChecked ? ` (${estimate.added} file)` : '' }}
            </UButton>
          </div>
        </div>

        <!-- Mode biasa: upload langsung, perilaku lama -->
        <div v-else class="flex items-center justify-between gap-3">
          <p class="text-sm text-gray-500">
            <span class="font-medium text-gray-800">{{ pendingFiles.length }}</span> file siap diupload
          </p>
          <UButton
            icon="i-lucide-upload"
            color="primary"
            :loading="submitting"
            :disabled="pendingFiles.length === 0"
            @click="handleSubmitFiles"
          >
            Upload Semua ({{ pendingFiles.length }})
          </UButton>
        </div>
      </template>
    </UCard>

    <!-- Hasil upload (mode biasa) -->
    <UCard v-if="!uidMode && uploadResults.length" class="shadow-sm">
      <template #header>
        <div class="flex items-center justify-between">
          <p class="font-semibold text-gray-800">Hasil Upload</p>
          <div class="flex gap-2">
            <UBadge color="success" variant="soft">Berhasil: {{ uploadResults.filter(r => r.success).length }}</UBadge>
            <UBadge color="error" variant="soft">Gagal: {{ uploadResults.filter(r => !r.success).length }}</UBadge>
          </div>
        </div>
      </template>
      <div class="divide-y divide-gray-100">
        <div v-for="(result, idx) in uploadResults" :key="idx" class="flex items-center gap-3 py-3 px-2">
          <UIcon
            :name="result.success ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
            class="size-5 flex-none"
            :class="result.success ? 'text-green-500' : 'text-red-500'"
          />
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-800 truncate">{{ result.label }}</p>
            <p v-if="!result.success" class="text-xs text-red-500 mt-0.5">{{ result.error }}</p>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
import { useProductsApi } from '~/composables/api/product'
import { formatFileSize, uidFromFileName } from '~/helper/stockAccountHelper'
import type { StockErrorData } from '~/types/product/StockBulkCheck'

const props = defineProps<{ productId: number }>()
const emit = defineEmits<{ success: [] }>()
// Diteruskan ke halaman agar mode tidak bisa diganti saat upload/cek berjalan
const busyModel = defineModel<boolean>('busy', { default: false })

const toast = useToast()
const { addProductStockItem, checkProductStockFilesBulk, addProductStockFilesBulk } = useProductsApi()

// ===== DAFTAR FILE =====
interface MultiFileItem {
  file: File
  status: 'idle' | 'uploading' | 'success' | 'error'
  error?: string
}

const fileInputRef = ref<HTMLInputElement | null>(null)
const listRef = ref<HTMLElement | null>(null)
const multiFiles = ref<MultiFileItem[]>([])
const isDragging = ref(false)

// File yang sudah berhasil tidak diupload ulang saat tombol ditekan lagi (mode biasa)
const pendingFiles = computed(() => multiFiles.value.filter(f => f.status !== 'success'))

function triggerFileInput() { fileInputRef.value?.click() }

function onFilesSelected(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  addMultiFiles(Array.from(input.files))
  input.value = ''
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  if (busy.value || !e.dataTransfer?.files) return
  addMultiFiles(Array.from(e.dataTransfer.files))
}

function addMultiFiles(files: File[]) {
  const existing = new Set(multiFiles.value.map(f => f.file.name + f.file.size))
  for (const file of files) {
    if (!existing.has(file.name + file.size)) {
      multiFiles.value.push({ file, status: 'idle' })
    }
  }
  filesChanged()
}

function removeMultiFile(idx: number) {
  multiFiles.value.splice(idx, 1)
  // Index bergeser → pilihan lama tidak cocok lagi
  resetDecisions()
  filesChanged()
}

function clearMultiFiles() {
  multiFiles.value = []
  resetCheck()
  filesChanged()
}

// ===== MODE UID DARI NAMA FILE =====
const uidMode = ref(false)
const accountTypeId = ref<number | null>(null)
const submitting = ref(false)
const submitError = ref('')
const errorRowIndex = ref<number | null>(null)

const {
  checkResult,
  decisions,
  checking,
  isChecked,
  rowCheck,
  invalidCount,
  sentCount,
  estimate,
  markChanged,
  resetDecisions,
  reset: resetCheck,
  runCheck: runDuplicateCheck,
  onDuplicateFor,
  setAllSent,
} = useStockDuplicateCheck()

const busy = computed(() => checking.value || submitting.value)
watch(busy, v => { busyModel.value = v })

// Tambah / hapus / ganti file → hasil cek tidak berlaku
function filesChanged() {
  markChanged()
  submitError.value = ''
  errorRowIndex.value = null
}

// Ganti tipe → hasil cek tidak berlaku
watch(accountTypeId, () => filesChanged())

// Pindah mode: file yang sudah berhasil diupload tidak ikut, status & hasil cek direset
watch(uidMode, () => {
  multiFiles.value = pendingFiles.value.map(f => ({ file: f.file, status: 'idle' }))
  uploadResults.value = []
  resetCheck()
  filesChanged()
})

watch(() => props.productId, () => {
  multiFiles.value = []
  uploadResults.value = []
  resetCheck()
  filesChanged()
})

const canCheck = computed(() => !!props.productId && multiFiles.value.length > 0 && !busy.value)
const canSave = computed(() => canCheck.value && isChecked.value && invalidCount.value === 0)

function rowClass(idx: number) {
  if (idx === errorRowIndex.value) return 'bg-red-100 border-red-200'
  if (!uidMode.value) return 'bg-gray-50 border-gray-100'
  const status = rowCheck(idx)?.status
  if (status === 'INVALID') return 'bg-red-50 border-red-100'
  if (status === 'DUPLICATE_ACTIVE' || status === 'DUPLICATE_IN_FILE') return 'bg-gray-50 border-gray-100 text-gray-500'
  if (status === 'DUPLICATE_SENT') return decisions.value[idx] === 'ADD' ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'
  return 'bg-gray-50 border-gray-100'
}

async function scrollToRow(idx: number) {
  await nextTick()
  listRef.value?.querySelector(`[data-row="${idx}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
}

// Langkah 1 (dryRun): hanya nama file yang dikirim, file tidak diupload
async function runCheck(keepDecisions = false) {
  if (!canCheck.value) return
  submitError.value = ''
  errorRowIndex.value = null
  try {
    const result = await runDuplicateCheck(
      () => checkProductStockFilesBulk(props.productId, {
        fileNames: multiFiles.value.map(f => f.file.name),
        accountTypeId: accountTypeId.value,
      }),
      keepDecisions,
    )
    const firstInvalid = result.rows.find(r => r.status === 'INVALID')
    if (firstInvalid) scrollToRow(firstInvalid.row - 1)
  } catch (err: any) {
    const message: string = err.statusMessage || err.message || 'Gagal mengecek file'
    submitError.value = message
    toast.add({ title: 'Gagal ❌', description: message, color: 'error' })
  }
}

// Langkah 2 (simpan): file sungguhan dengan urutan yang sama, onDuplicates untuk setiap file
async function handleSaveUid() {
  if (!canSave.value) return
  submitting.value = true
  submitError.value = ''
  errorRowIndex.value = null
  try {
    const result = await addProductStockFilesBulk(props.productId, {
      files: multiFiles.value.map(f => f.file),
      onDuplicates: multiFiles.value.map((_, idx) => onDuplicateFor(idx) ?? ''),
      accountTypeId: accountTypeId.value,
    })
    toast.add({
      title: 'Berhasil ✅',
      description: result.message || `${result.added} stock item ditambahkan, ${result.skipped} dilewati`,
      color: 'success',
    })
    multiFiles.value = []
    resetCheck()
    filesChanged()
    emit('success')
  } catch (err: any) {
    const message: string = err.statusMessage || err.message || 'Gagal mengupload file'
    const data = (err.data ?? {}) as StockErrorData

    if (data.code === 'STOCK_CHECK_OUTDATED') {
      // Kondisi stok berubah sejak dicek → cek ulang otomatis; pilihan untuk file yang statusnya sama dipertahankan
      toast.add({ title: 'Data berubah sejak dicek', description: `${message} Hasil cek sudah diperbarui, silakan periksa lagi.`, color: 'warning' })
      submitting.value = false
      await runCheck(true)
      return
    }

    submitError.value = message
    if (data.row && data.row >= 1 && data.row <= multiFiles.value.length) {
      errorRowIndex.value = data.row - 1
      scrollToRow(data.row - 1)
    }
    toast.add({ title: 'Gagal ❌', description: message, color: 'error' })
  } finally {
    submitting.value = false
  }
}

// ===== MODE BIASA (perilaku lama): upload per file, langsung simpan =====
interface UploadResult { label: string; success: boolean; error?: string }
const uploadResults = ref<UploadResult[]>([])

async function handleSubmitFiles() {
  const items = pendingFiles.value
  if (!items.length) return
  submitting.value = true
  uploadResults.value = []
  let successCount = 0

  // Berurutan (1 per 1), sama seperti perilaku upload massal sebelumnya
  for (const item of items) {
    item.status = 'uploading'
    try {
      await addProductStockItem(props.productId, { file: item.file })
      item.status = 'success'
      uploadResults.value.push({ label: item.file.name, success: true })
      successCount++
    } catch (err: any) {
      item.status = 'error'
      item.error = err.data?.message || err.statusMessage || err.message
      uploadResults.value.push({ label: item.file.name, success: false, error: item.error })
    }
  }

  submitting.value = false
  toast.add({
    title: 'Upload Selesai',
    description: `${successCount} dari ${items.length} file berhasil diupload.`,
    color: successCount === items.length ? 'success' : 'warning',
  })
  if (successCount) emit('success')
}
</script>
