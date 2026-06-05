<template>
  <div class="space-y-6">

    <!-- Filter -->
    <UCard class="shadow-sm">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <UInput
          v-model="filters.productName"
          icon="i-lucide-package"
          placeholder="Nama produk..."
          clearable
          @update:model-value="handleFilter"
        />
        <UInput
          v-model="filters.fileName"
          icon="i-lucide-file"
          placeholder="Nama file..."
          clearable
          @update:model-value="handleFilter"
        />
        <UInput
          v-model="filters.description"
          icon="i-lucide-text"
          placeholder="Deskripsi..."
          clearable
          @update:model-value="handleFilter"
        />
        <UInput
          v-model="filters.transactionId"
          icon="i-lucide-receipt"
          placeholder="ID Transaksi..."
          clearable
          @update:model-value="handleFilter"
        />
        <USelect
          v-model="filters.status"
          :items="statusFilterOptions"
          placeholder="Semua Status"
          value-key="value"
          @update:model-value="handleFilter"
        />
        <div class="flex gap-2">
          <USelect v-model="perPageValue" :items="perPageItems" class="w-24" />
          <UButton icon="mdi:refresh" color="neutral" variant="outline" :loading="pending" @click="refresh()">
            Refresh
          </UButton>
          <UButton icon="i-lucide-x" color="neutral" variant="ghost" :disabled="!hasActiveFilter" @click="resetFilters">
            Reset
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- List -->
    <UCard class="shadow-sm">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="font-semibold text-gray-800">
            Semua Stok File
            <span v-if="stockData?.total_elements" class="text-xs text-gray-400 font-normal ml-2">
              ({{ stockData.total_elements }} item)
            </span>
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <UBadge color="success" variant="soft">Aktif: {{ countActive }}</UBadge>
            <UBadge color="info" variant="soft">Terkirim: {{ countSent }}</UBadge>
            <NuxtLink to="/seller/stock/bulk">
              <UButton icon="i-lucide-layers" color="primary" size="sm">
                Tambah Massal
              </UButton>
            </NuxtLink>
          </div>
        </div>
      </template>

      <AppLoadingSkeleton v-if="pending" />

      <UAlert
        v-else-if="error"
        title="Terjadi Kesalahan"
        :description="error.message || 'Gagal memuat stok'"
        icon="icon-park-solid:error"
        color="error"
      />

      <div v-else-if="!stockData?.content?.length" class="py-12 text-center">
        <UIcon name="i-lucide-inbox" class="text-4xl text-gray-300 mb-3" />
        <p class="text-gray-400 text-sm">Tidak ada stok file ditemukan.</p>
      </div>

      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="item in stockData.content"
          :key="item.id"
          class="flex items-center gap-4 py-4 px-2 hover:bg-gray-50 rounded-xl transition-colors"
        >
          <div class="flex-none">
            <img
              v-if="item.product_banner_url"
              :src="config.public.backendUrl + '/' + item.product_banner_url"
              class="w-12 h-12 rounded-xl object-cover border border-gray-100 bg-gray-50"
            />
            <div
              v-else
              class="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-100"
            >
              <UIcon name="i-lucide-package" class="text-lg text-gray-400" />
            </div>
          </div>

          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-800 truncate flex items-center gap-1">
              <UIcon name="i-lucide-package" class="size-3.5 flex-none text-blue-500" />
              {{ item.product_name || '-' }}
            </p>
            <a
              v-if="item.file_name"
              :href="item.file_url ? config.public.backendUrl + '/' + item.file_url : undefined"
              :download="item.file_name"
              target="_blank"
              class="text-xs text-blue-500 hover:underline truncate flex items-center gap-1 w-fit max-w-full"
              @click.stop
            >
              <UIcon name="i-lucide-download" class="size-3 flex-none" />
              {{ item.file_name }}
            </a>
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

            <NuxtLink :to="`/seller/stock/${item.product_id}`">
              <UButton icon="i-lucide-arrow-right" size="xs" color="primary" variant="ghost" />
            </NuxtLink>

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
        v-if="stockData && stockData.total_pages > 1 && !pending"
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

  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import { useProductsApi } from '~/composables/api/product'
import type { ProductStockItemResponse } from '~/types/product/ProductStockItemResponse'
import type { PageResponse } from '~/types/PageResponse'

definePageMeta({ layout: 'seller', label: 'Stok Produk', ssr: false })

const config = useRuntimeConfig()
const toast = useToast()
const { confirm, close: closeConfirm } = useConfirm()
const { getMyAllStockItems, deleteProductStockItem } = useProductsApi()

const page = ref(0)
const perPageValue = ref(20)
const perPageItems = [10, 20, 50, 100]

const filters = reactive({
  status: 'ALL',
  transactionId: '',
  fileName: '',
  description: '',
  productName: '',
})

const appliedFilters = reactive({ ...filters })

const statusFilterOptions = [
  { label: 'Semua Status', value: 'ALL' },
  { label: 'Aktif', value: 'ACTIVE' },
  { label: 'Terkirim', value: 'SENT' },
  { label: 'Dihapus', value: 'DELETED' },
]

const hasActiveFilter = computed(() =>
  filters.status !== 'ALL' ||
  !!filters.transactionId ||
  !!filters.fileName ||
  !!filters.description ||
  !!filters.productName
)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

const {
  data: stockData,
  pending,
  error,
  refresh,
} = await useAsyncData<PageResponse<ProductStockItemResponse>>(
  'seller-all-stock',
  () => getMyAllStockItems(page.value, perPageValue.value, { ...appliedFilters }),
  { server: false }
)

const countActive = computed(() => stockData.value?.content.filter(i => i.status === 'ACTIVE').length ?? 0)
const countSent = computed(() => stockData.value?.content.filter(i => i.status === 'SENT').length ?? 0)

function handleFilter() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    Object.assign(appliedFilters, filters)
    page.value = 0
    refresh()
  }, 500)
}

function resetFilters() {
  filters.status = 'ALL'
  filters.transactionId = ''
  filters.fileName = ''
  filters.description = ''
  filters.productName = ''
  Object.assign(appliedFilters, filters)
  page.value = 0
  refresh()
}

function onPageChange(p: number) { page.value = p - 1; refresh() }

watch(perPageValue, () => { page.value = 0; refresh() })

const deletingId = ref<number | null>(null)

async function handleDelete(item: ProductStockItemResponse) {
  const ok = await confirm({
    title: 'Hapus Stok File?',
    message: `File "${item.file_name || item.description || '#' + item.id}" akan dihapus secara permanen.`,
    confirmText: 'Ya, Hapus',
    cancelText: 'Batal',
    confirmColor: 'error',
  })
  if (!ok) return
  deletingId.value = item.id
  try {
    await deleteProductStockItem(item.id)
    toast.add({ title: 'Stok Dihapus', description: 'File berhasil dihapus dari stok.', color: 'success' })
    await refresh()
  } catch (err: any) {
    toast.add({ title: 'Gagal âŒ', description: err.statusMessage || err.message, color: 'error' })
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

