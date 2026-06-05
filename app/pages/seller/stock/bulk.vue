<template>
  <UCard class="mb-6">
    <NuxtLink to="/seller/stock">
      <div class="flex items-center gap-2 p-4 border rounded-2xl border-blue-500 hover:bg-blue-50 cursor-pointer w-1/2 md:w-1/5">
        <UIcon name="i-lucide-arrow-left" class="size-5 text-blue-500" />
        <span class="font-medium text-blue-500">Kembali ke Stok</span>
      </div>
    </NuxtLink>
  </UCard>

  <div class="space-y-6">

    <!-- Pilih Produk -->
    <UCard class="shadow-sm">
      <template #header>
        <p class="font-semibold text-gray-800">Pilih Produk</p>
      </template>

      <div class="space-y-3">
        <USelect
          v-model="selectedProductId"
          :items="productOptions"
          placeholder="Pilih produk tipe Stok File..."
          value-key="value"
          :loading="productLoading"
          class="w-full"
          @update:model-value="onProductSelected"
        />

        <div v-if="selectedProduct" class="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
          <img
            :src="config.public.backendUrl + '/' + selectedProduct.banner_url"
            :alt="selectedProduct.name"
            class="w-12 h-12 rounded-lg object-cover border border-blue-100 flex-none"
          />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-blue-800 truncate">{{ selectedProduct.name }}</p>
            <p class="text-xs text-blue-500 mt-0.5">
              Stok saat ini: <span class="font-semibold">{{ selectedProduct.stock ?? 0 }}</span>
            </p>
          </div>
          <UBadge color="primary" variant="soft" size="sm">Stok File</UBadge>
        </div>

        <UAlert
          v-if="!productLoading && productOptions.length === 0"
          icon="i-lucide-info"
          color="info"
          variant="subtle"
          title="Tidak ada produk"
          description="Anda belum memiliki produk dengan tipe pengiriman Stok File."
        />
      </div>
    </UCard>

    <template v-if="selectedProductId">

      <!-- Pilih Mode -->
      <UCard class="shadow-sm">
        <template #header>
          <p class="font-semibold text-gray-800">Mode Tambah Stok</p>
        </template>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            class="flex gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all"
            :class="mode === 'rows' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'"
            @click="setMode('rows')"
          >
            <UIcon name="i-lucide-list" class="size-5 mt-0.5 flex-none" :class="mode === 'rows' ? 'text-blue-500' : 'text-gray-400'" />
            <div>
              <p class="font-semibold text-sm" :class="mode === 'rows' ? 'text-blue-700' : 'text-gray-700'">Per Baris</p>
              <p class="text-xs text-gray-500 mt-0.5">Tambah deskripsi dan file satu per satu per baris.</p>
            </div>
            <UBadge v-if="mode === 'rows'" color="primary" size="xs" class="ml-auto self-start">Aktif</UBadge>
          </div>

          <div
            class="flex gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all"
            :class="mode === 'files' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'"
            @click="setMode('files')"
          >
            <UIcon name="i-lucide-files" class="size-5 mt-0.5 flex-none" :class="mode === 'files' ? 'text-blue-500' : 'text-gray-400'" />
            <div>
              <p class="font-semibold text-sm" :class="mode === 'files' ? 'text-blue-700' : 'text-gray-700'">File Only</p>
              <p class="text-xs text-gray-500 mt-0.5">Pilih banyak file sekaligus, setiap file jadi 1 stok.</p>
            </div>
            <UBadge v-if="mode === 'files'" color="primary" size="xs" class="ml-auto self-start">Aktif</UBadge>
          </div>
        </div>
      </UCard>

      <!-- MODE: Per Baris -->
      <UCard v-if="mode === 'rows'" class="shadow-sm">
        <template #header>
          <div class="flex items-center justify-between">
            <p class="font-semibold text-gray-800">
              Daftar Stok
              <span class="text-xs text-gray-400 font-normal ml-2">({{ rows.length }} item)</span>
            </p>
            <UButton icon="i-lucide-plus" color="primary" variant="soft" size="sm" @click="addRow">
              Tambah Baris
            </UButton>
          </div>
        </template>

        <div class="space-y-3">
          <div
            v-for="(row, idx) in rows"
            :key="idx"
            class="flex gap-3 items-start p-3 bg-gray-50 rounded-xl border border-gray-100"
          >
            <div class="flex-none w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-1">
              {{ idx + 1 }}
            </div>
            <div class="flex-1 min-w-0">
              <UInput v-model="row.description" placeholder="Deskripsi (opsional)..." size="sm" :disabled="submitting" />
            </div>
            <div class="flex-1 min-w-0">
              <UFileUpload v-model="row.file" label="Pilih File" description="Semua tipe file" size="sm" :disabled="submitting" />
            </div>
            <div class="flex-none flex items-center gap-1 mt-1">
              <UIcon v-if="row.uploadStatus === 'success'" name="i-lucide-check-circle" class="size-5 text-green-500" />
              <UIcon v-else-if="row.uploadStatus === 'error'" name="i-lucide-x-circle" class="size-5 text-red-500" />
              <UIcon v-else-if="row.uploadStatus === 'uploading'" name="i-lucide-loader" class="size-5 text-blue-500 animate-spin" />
              <UButton icon="mdi:delete-outline" size="xs" color="error" variant="ghost" :disabled="submitting" @click="removeRow(idx)" />
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex items-center justify-between gap-3">
            <p class="text-sm text-gray-500">
              <span class="font-medium text-gray-800">{{ validRowCount }}</span> dari {{ rows.length }} baris siap diupload
            </p>
            <div class="flex gap-2">
              <UButton color="neutral" variant="outline" :disabled="submitting" @click="resetRows">Reset</UButton>
              <UButton icon="i-lucide-upload" color="primary" :loading="submitting" :disabled="validRowCount === 0" @click="handleSubmitRows">
                Upload Semua ({{ validRowCount }})
              </UButton>
            </div>
          </div>
        </template>
      </UCard>

      <!-- MODE: File Only -->
      <UCard v-if="mode === 'files'" class="shadow-sm">
        <template #header>
          <p class="font-semibold text-gray-800">Upload Banyak File</p>
        </template>

        <div class="space-y-4">
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
              :disabled="submitting"
              @change="onFilesSelected"
            />
            <UIcon name="i-lucide-upload-cloud" class="text-4xl text-gray-300 mb-3" />
            <p class="text-sm font-medium text-gray-600">Klik atau seret file ke sini</p>
            <p class="text-xs text-gray-400 mt-1">Pilih banyak file sekaligus — setiap file = 1 stok</p>
          </div>

          <!-- Preview file terpilih -->
          <div v-if="multiFiles.length" class="space-y-2">
            <div class="flex items-center justify-between mb-1">
              <p class="text-sm font-medium text-gray-700">{{ multiFiles.length }} file dipilih</p>
              <UButton icon="i-lucide-x" size="xs" color="neutral" variant="ghost" :disabled="submitting" @click="clearMultiFiles">
                Hapus Semua
              </UButton>
            </div>

            <div
              v-for="(f, idx) in multiFiles"
              :key="idx"
              class="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100"
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
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-800 truncate">{{ f.file.name }}</p>
                <p v-if="f.status === 'error'" class="text-xs text-red-500 truncate">{{ f.error }}</p>
                <p v-else class="text-xs text-gray-400">{{ formatFileSize(f.file.size) }}</p>
              </div>
              <UButton
                v-if="f.status !== 'uploading'"
                icon="mdi:delete-outline"
                size="xs"
                color="error"
                variant="ghost"
                :disabled="submitting"
                @click="removeMultiFile(idx)"
              />
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex items-center justify-between gap-3">
            <p class="text-sm text-gray-500">
              <span class="font-medium text-gray-800">{{ multiFiles.length }}</span> file siap diupload
            </p>
            <UButton
              icon="i-lucide-upload"
              color="primary"
              :loading="submitting"
              :disabled="multiFiles.length === 0"
              @click="handleSubmitFiles"
            >
              Upload Semua ({{ multiFiles.length }})
            </UButton>
          </div>
        </template>
      </UCard>

    </template>

    <!-- Hasil upload -->
    <UCard v-if="uploadResults.length" class="shadow-sm">
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
import type { ProductResponse } from '~/types/product/ProductResponse'

definePageMeta({ layout: 'seller', label: 'Tambah Stok Massal', ssr: false })

const config = useRuntimeConfig()
const toast = useToast()
const { fetchMyProduct, addProductStockItem } = useProductsApi()

// ===== PRODUK =====
const selectedProductId = ref<number | undefined>(undefined)
const selectedProduct = ref<ProductResponse | null>(null)
const allProducts = ref<ProductResponse[]>([])

const { pending: productLoading } = await useAsyncData(
  'seller-stocking-products',
  async () => {
    const res = await fetchMyProduct(0, 100)
    allProducts.value = res.content.filter(p => p.delivery_type === 'STOCKING')
  },
  { server: false }
)

const productOptions = computed(() =>
  allProducts.value.map(p => ({ label: p.name, value: p.id }))
)

function onProductSelected(id?: number) {
  selectedProductId.value = id
  selectedProduct.value = id != null ? allProducts.value.find(p => p.id === id) ?? null : null
  resetRows()
  clearMultiFiles()
  uploadResults.value = []
}

// ===== MODE =====
type Mode = 'rows' | 'files'
const mode = ref<Mode>('rows')

function setMode(m: Mode) {
  mode.value = m
  uploadResults.value = []
}

// ===== MODE: PER BARIS =====
interface StockRow {
  description: string
  file: File | null
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error'
}

const rows = ref<StockRow[]>([createRow(), createRow(), createRow()])

function createRow(): StockRow {
  return { description: '', file: null, uploadStatus: 'idle' }
}
function addRow() { rows.value.push(createRow()) }
function removeRow(idx: number) {
  rows.value.splice(idx, 1)
  if (rows.value.length === 0) addRow()
}
function resetRows() { rows.value = [createRow(), createRow(), createRow()] }

const isRowValid = (row: StockRow) => !!row.file || row.description.trim().length > 0
const validRowCount = computed(() => rows.value.filter(isRowValid).length)

// ===== MODE: FILE ONLY =====
interface MultiFileItem {
  file: File
  status: 'idle' | 'uploading' | 'success' | 'error'
  error?: string
}

const fileInputRef = ref<HTMLInputElement | null>(null)
const multiFiles = ref<MultiFileItem[]>([])
const isDragging = ref(false)

function triggerFileInput() { fileInputRef.value?.click() }

function onFilesSelected(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  addMultiFiles(Array.from(input.files))
  input.value = ''
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  if (!e.dataTransfer?.files) return
  addMultiFiles(Array.from(e.dataTransfer.files))
}

function addMultiFiles(files: File[]) {
  const existing = new Set(multiFiles.value.map(f => f.file.name + f.file.size))
  for (const file of files) {
    if (!existing.has(file.name + file.size)) {
      multiFiles.value.push({ file, status: 'idle' })
    }
  }
}

function removeMultiFile(idx: number) { multiFiles.value.splice(idx, 1) }
function clearMultiFiles() { multiFiles.value = [] }

// ===== SUBMIT =====
interface UploadResult { label: string; success: boolean; error?: string }

const submitting = ref(false)
const uploadResults = ref<UploadResult[]>([])

const CONCURRENCY = 1

async function runConcurrent<T>(
  items: T[],
  task: (item: T) => Promise<void>
): Promise<void> {
  let idx = 0
  async function worker() {
    while (idx < items.length) {
      const current = idx++
      await task(items[current]!)
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
}

async function handleSubmitRows() {
  if (!selectedProductId.value) return
  submitting.value = true
  uploadResults.value = []
  let successCount = 0
  const validRows = rows.value.filter(isRowValid)

  await runConcurrent(validRows, async (row) => {
    row.uploadStatus = 'uploading'
    const label = row.file?.name || row.description || 'Item'
    try {
      await addProductStockItem(selectedProductId.value!, row.description, row.file!)
      row.uploadStatus = 'success'
      uploadResults.value.push({ label, success: true })
      successCount++
    } catch (err: any) {
      row.uploadStatus = 'error'
      uploadResults.value.push({ label, success: false, error: err.data?.message || err.statusMessage || err.message })
    }
  })

  submitting.value = false
  toast.add({
    title: 'Upload Selesai',
    description: `${successCount} dari ${validRows.length} stok berhasil ditambahkan.`,
    color: successCount === validRows.length ? 'success' : 'warning',
  })
}

async function handleSubmitFiles() {
  if (!selectedProductId.value || multiFiles.value.length === 0) return
  submitting.value = true
  uploadResults.value = []
  let successCount = 0
  const total = multiFiles.value.length

  await runConcurrent(multiFiles.value, async (item) => {
    item.status = 'uploading'
    try {
      await addProductStockItem(selectedProductId.value!, '', item.file)
      item.status = 'success'
      uploadResults.value.push({ label: item.file.name, success: true })
      successCount++
    } catch (err: any) {
      item.status = 'error'
      item.error = err.data?.message || err.statusMessage || err.message
      uploadResults.value.push({ label: item.file.name, success: false, error: item.error })
    }
  })

  submitting.value = false
  toast.add({
    title: 'Upload Selesai',
    description: `${successCount} dari ${total} file berhasil diupload.`,
    color: successCount === total ? 'success' : 'warning',
  })
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>
