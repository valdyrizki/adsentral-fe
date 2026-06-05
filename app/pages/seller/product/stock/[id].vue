<template>
  <UCard>
    <NuxtLink to="/seller/product/stock">
      <div class="flex items-center gap-2 p-4 border rounded-2xl border-blue-500 hover:bg-blue-50 cursor-pointer w-1/2 md:w-1/5">
        <UIcon name="i-lucide-arrow-left" class="size-5 text-blue-500" />
        <span class="font-medium text-blue-500">Kembali ke Stok</span>
      </div>
    </NuxtLink>
  </UCard>

  <div class="mt-6">

    <AppLoadingSkeleton v-if="productLoading" />

    <UCard v-else-if="productError || !product">
      <div class="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <UIcon name="i-lucide-package-x" class="size-16 text-gray-400" />
        <div class="text-xl font-semibold text-gray-700">Produk Tidak Ditemukan</div>
        <NuxtLink to="/seller/product/stock">
          <UButton icon="i-lucide-arrow-left" variant="outline" color="primary">Kembali</UButton>
        </NuxtLink>
      </div>
    </UCard>

    <template v-else>

      <!-- Info Produk -->
      <UCard class="mb-6 shadow-sm">
        <div class="flex items-center gap-4">
          <img
            :src="config.public.backendUrl + '/' + product.banner_url"
            :alt="product.name"
            class="w-16 h-16 rounded-xl object-cover border border-gray-100 bg-gray-50 flex-none"
          />
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-gray-800 truncate">{{ product.name }}</p>
            <div class="flex flex-wrap items-center gap-2 mt-1.5">
              <UBadge color="primary" variant="soft" size="sm">
                <UIcon name="i-lucide-file-check" class="mr-1" />
                Stok File
              </UBadge>
              <span class="text-sm text-gray-500">
                Stok tersedia:
                <span class="font-semibold text-gray-800">{{ product.stock ?? 0 }}</span>
              </span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Form Tambah Stok -->
      <UCard class="mb-6 shadow-sm">
        <template #header>
          <p class="font-semibold text-gray-800">Tambah Stok</p>
        </template>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-900 mb-1">
              Deskripsi
              <span class="text-gray-400 font-normal">(opsional)</span>
            </label>
            <UInput
              v-model="form.description"
              placeholder="Contoh: Serial key batch 001, Akun #1, dll."
              class="w-full"
              :disabled="uploading"
            />
            <p class="mt-1 text-xs text-gray-400">Catatan internal untuk membedakan stok file.</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-900 mb-1">
              File
              <span class="text-gray-400 font-normal">(opsional)</span>
            </label>
            <UFileUpload
              v-model="form.file"
              label="Pilih File"
              description="Semua tipe file didukung"
              class="w-full"
              :disabled="uploading"
            />
          </div>

          <p v-if="formError" class="text-sm text-red-500">{{ formError }}</p>

          <div class="flex justify-end">
            <UButton
              icon="i-lucide-plus"
              color="primary"
              :loading="uploading"
              :disabled="!canSubmit"
              @click="handleAdd"
            >
              Tambah Stok
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Filter -->
      <UCard class="mb-6 shadow-sm">
        <div class="flex flex-col sm:flex-row gap-3">
          <USelect
            v-model="filterStatus"
            :items="statusFilterOptions"
            placeholder="Semua Status"
            value-key="value"
            class="w-full sm:w-48"
            @update:model-value="handleFilter"
          />
          <USelect v-model="perPageValue" :items="perPageItems" class="w-full sm:w-24" />
          <UButton icon="mdi:refresh" color="neutral" variant="outline" :loading="stockLoading" @click="refreshStock()">
            Refresh
          </UButton>
        </div>
      </UCard>

      <!-- List Stok -->
      <UCard class="shadow-sm">
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="font-semibold text-gray-800">
              Daftar Stok
              <span v-if="stockData?.total_elements" class="text-xs text-gray-400 font-normal ml-2">
                ({{ stockData.total_elements }} item)
              </span>
            </p>
            <div class="flex gap-2">
              <UBadge color="success" variant="soft">Tersedia: {{ countAvailable }}</UBadge>
              <UBadge color="neutral" variant="soft">Terpakai: {{ countUsed }}</UBadge>
            </div>
          </div>
        </template>

        <AppLoadingSkeleton v-if="stockLoading" />

        <UAlert
          v-else-if="stockError"
          title="Gagal Memuat Stok"
          :description="stockError.message"
          icon="icon-park-solid:error"
          color="error"
        />

        <div v-else-if="!stockData?.content?.length" class="py-12 text-center">
          <UIcon name="i-lucide-inbox" class="text-4xl text-gray-300 mb-3" />
          <p class="text-gray-400 text-sm">Belum ada stok file. Tambahkan file di atas.</p>
        </div>

        <div v-else class="divide-y divide-gray-100">
          <div
            v-for="item in stockData.content"
            :key="item.id"
            class="flex items-center gap-4 py-4 px-2 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center flex-none"
              :class="item.status === 'ACTIVE' ? 'bg-blue-50' : 'bg-gray-100'"
            >
              <UIcon
                name="i-lucide-file"
                class="text-lg"
                :class="item.status === 'ACTIVE' ? 'text-blue-500' : 'text-gray-400'"
              />
            </div>

            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-800 truncate">{{ item.file_name || 'File' }}</p>
              <p v-if="item.description" class="text-xs text-gray-500 truncate">{{ item.description }}</p>
              <div class="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-400">
                <span v-if="item.file_size" class="flex items-center gap-1">
                  <UIcon name="i-lucide-hard-drive" class="size-3" />
                  {{ formatFileSize(item.file_size) }}
                </span>
                <span v-if="item.file_type" class="flex items-center gap-1">
                  <UIcon name="i-lucide-tag" class="size-3" />
                  {{ item.file_type }}
                </span>
                <span class="flex items-center gap-1">
                  <UIcon name="mdi:calendar" class="size-3" />
                  {{ dayjs(item.created_at).format('DD MMM YYYY, HH:mm') }}
                </span>
                <span class="font-mono text-gray-300">#{{ item.id }}</span>
              </div>
            </div>

            <div class="flex-none flex items-center gap-2">
              <UBadge :color="stockStatusColor(item.status)" variant="soft" size="sm">
                {{ stockStatusLabel(item.status) }}
              </UBadge>
              <UButton
                v-if="item.status === 'ACTIVE'"
                icon="mdi:delete-outline"
                size="xs"
                color="error"
                variant="ghost"
                :loading="deletingId === item.id"
                @click="handleDelete(item)"
              />
            </div>
          </div>
        </div>

        <div
          v-if="stockData && stockData.total_pages > 1 && !stockLoading"
          class="flex justify-center items-center pt-4"
        >
          <UPagination
            :page="page + 1"
            :total="stockData.total_elements"
            :items-per-page="perPageValue"
            :sibling-count="1"
            show-edges
            @update:page="onPageChange"
          />
        </div>
      </UCard>

    </template>
  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import { useProductsApi } from '~/composables/api/product'
import type { ProductResponse } from '~/types/product/ProductResponse'
import type { ProductStockItemResponse } from '~/types/product/ProductStockItemResponse'
import type { PageResponse } from '~/types/PageResponse'

definePageMeta({ layout: 'seller', label: 'Kelola Stok File', ssr: false })

const config = useRuntimeConfig()
const route = useRoute()
const toast = useToast()
const { confirm, close: closeConfirm } = useConfirm()
const { fetchMyProductById, getProductStockItems, addProductStockItem, deleteProductStockItem } = useProductsApi()

const productId = computed(() => Number(route.params.id))
const page = ref(0)
const perPageValue = ref(20)
const perPageItems = [10, 20, 50, 100]
const filterStatus = ref('')

const statusFilterOptions = [
  { label: 'Semua Status', value: 'ALL' },
  { label: 'Aktif', value: 'ACTIVE' },
  { label: 'Terkirim', value: 'SENT' },
  { label: 'Dihapus', value: 'DELETED' },
]

const form = reactive<{ description: string; file: File | null }>({ description: '', file: null })
const formError = ref('')
const uploading = ref(false)
const canSubmit = computed(() => !!form.file || form.description.trim().length > 0)

const {
  data: product,
  pending: productLoading,
  error: productError,
} = await useAsyncData<ProductResponse | null>(
  `seller-stock-product-${route.params.id}`,
  async () => { try { return await fetchMyProductById(route.params.id as string) } catch { return null } },
  { server: false }
)

const {
  data: stockData,
  pending: stockLoading,
  error: stockError,
  refresh: refreshStock,
} = await useAsyncData<PageResponse<ProductStockItemResponse>>(
  () => `seller-stock-items-${productId.value}-${page.value}-${perPageValue.value}-${filterStatus.value}`,
  () => getProductStockItems(productId.value, page.value, perPageValue.value, filterStatus.value),
  { watch: [page, perPageValue], server: false }
)

const countAvailable = computed(() => stockData.value?.content.filter(i => i.status === 'ACTIVE').length ?? 0)
const countUsed = computed(() => stockData.value?.content.filter(i => i.status !== 'ACTIVE').length ?? 0)

function onPageChange(p: number) { page.value = p - 1 }
function handleFilter() { page.value = 0; refreshStock() }

async function handleAdd() {
  formError.value = ''
  if (!form.file && !form.description.trim()) {
    formError.value = 'Isi deskripsi atau pilih file'
    return
  }
  uploading.value = true
  try {
    await addProductStockItem(productId.value, form.description, form.file!)
    toast.add({ title: 'Stok Ditambahkan ✅', description: 'File berhasil ditambahkan ke stok produk.', color: 'success' })
    form.description = ''
    form.file = null
    await refreshStock()
  } catch (err: any) {
    toast.add({ title: 'Gagal ❌', description: err.statusMessage || err.message, color: 'error' })
  } finally {
    uploading.value = false
  }
}

const deletingId = ref<number | null>(null)

async function handleDelete(item: ProductStockItemResponse) {
  const ok = await confirm({
    title: 'Hapus Stok File?',
    message: `File "${item.file_name || item.description || '#' + item.id}" akan dihapus dari stok produk.`,
    confirmText: 'Ya, Hapus',
    cancelText: 'Batal',
    confirmColor: 'error',
  })
  if (!ok) return
  deletingId.value = item.id
  try {
    await deleteProductStockItem(item.id)
    toast.add({ title: 'Stok Dihapus', description: 'File berhasil dihapus.', color: 'success' })
    await refreshStock()
  } catch (err: any) {
    toast.add({ title: 'Gagal ❌', description: err.statusMessage || err.message, color: 'error' })
  } finally {
    deletingId.value = null
    closeConfirm()
  }
}

type BadgeColor = 'success' | 'warning' | 'error' | 'neutral' | 'info' | 'primary'
function stockStatusColor(status: string): BadgeColor {
  const map: Record<string, BadgeColor> = { ACTIVE: 'success', SENT: 'info', DELETED: 'error' }
  return map[status] ?? 'neutral'
}
function stockStatusLabel(status: string): string {
  const map: Record<string, string> = { ACTIVE: 'Aktif', SENT: 'Terkirim', DELETED: 'Dihapus' }
  return map[status] ?? status
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>
