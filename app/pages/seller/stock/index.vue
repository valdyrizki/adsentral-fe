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
          placeholder="Notes / Catatan..."
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
        <UInput
          v-model="filters.account"
          icon="i-lucide-user-search"
          placeholder="Cari akun (UID / username / email)..."
          clearable
          @update:model-value="handleFilter"
        />
        <StockAccountTypeSelect
          v-model="filters.accountTypeId"
          empty-label="Semua Tipe Akun"
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
    <ClientOnly>
      <template #fallback>
        <UCard class="shadow-sm">
          <div class="divide-y divide-gray-100">
            <div v-for="i in 5" :key="i" class="flex items-center gap-4 py-4 px-2">
              <USkeleton class="w-12 h-12 rounded-xl flex-none" />
              <div class="flex-1 space-y-2">
                <USkeleton class="h-4 w-40 rounded" />
                <USkeleton class="h-3 w-24 rounded" />
              </div>
              <USkeleton class="h-6 w-16 rounded-full" />
            </div>
          </div>
        </UCard>
      </template>
    <UCard class="shadow-sm">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="font-semibold text-gray-800">
            Semua Stok
            <span v-if="stockData?.total_elements" class="text-xs text-gray-400 font-normal ml-2">
              ({{ stockData.total_elements }} item)
            </span>
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <UBadge color="success" variant="soft">Aktif: {{ countActive }}</UBadge>
            <UBadge color="info" variant="soft">Terkirim: {{ countSent }}</UBadge>
            <UBadge v-if="countReturned" color="warning" variant="soft">Dikembalikan: {{ countReturned }}</UBadge>
            <NuxtLink to="/seller/stock/add">
              <UButton icon="i-lucide-plus" color="primary" size="sm">
                Tambah Stok
              </UButton>
            </NuxtLink>
          </div>
        </div>
      </template>

      <!-- Pilih & hapus massal -->
      <div class="space-y-3 mb-3">
        <div class="flex flex-wrap items-center gap-3 pb-3 border-b border-gray-100">
          <UCheckbox
            :model-value="pageSelectState"
            :disabled="!pageActiveItems.length || bulkDeleting"
            label="Pilih semua di halaman ini"
            @update:model-value="togglePageSelection"
          />
          <template v-if="selectedCount">
            <span class="text-sm font-medium text-gray-800">{{ selectedCount }} item dipilih</span>
            <UButton size="xs" color="neutral" variant="ghost" :disabled="bulkDeleting" @click="clearSelection">Batal pilih</UButton>
            <UButton
              size="xs"
              color="error"
              icon="mdi:delete-outline"
              class="ml-auto"
              :loading="bulkDeleting"
              :disabled="selectedCount > MAX_BULK_DELETE"
              @click="handleBulkDelete"
            >
              Hapus terpilih ({{ selectedCount }})
            </UButton>
          </template>
        </div>

        <UAlert
          v-if="selectedCount > MAX_BULK_DELETE"
          icon="i-lucide-alert-triangle"
          color="warning"
          variant="subtle"
          :title="`Maksimal ${MAX_BULK_DELETE} item per penghapusan`"
          :description="`Saat ini ${selectedCount} item dipilih. Kurangi pilihan menjadi maksimal ${MAX_BULK_DELETE} item untuk menghapus.`"
        />

        <!-- Rincian item yang dilewati pada hapus massal terakhir -->
        <UAlert
          v-if="bulkSkipped.length"
          icon="i-lucide-info"
          color="warning"
          variant="subtle"
          :title="`${bulkSkipped.length} item dilewati (tidak dihapus)`"
          :close="true"
          @update:open="bulkSkipped = []"
        >
          <template #description>
            <details class="mt-1">
              <summary class="cursor-pointer text-xs">Lihat rincian</summary>
              <ul class="mt-2 space-y-1 text-xs">
                <li v-for="s in bulkSkipped" :key="s.id" class="flex flex-wrap gap-x-2">
                  <span class="font-mono">#{{ s.id }}</span>
                  <span v-if="s.label" class="text-gray-700">{{ s.label }}</span>
                  <span class="text-gray-500">— {{ s.reason }}</span>
                </li>
              </ul>
            </details>
          </template>
        </UAlert>
      </div>

      <AppLoadingSkeleton v-if="pending" />

      <UAlert
        v-else-if="error"
        title="Terjadi Kesalahan"
        :description="error.message || 'Gagal memuat stok'"
        icon="mdi:alert-circle:error"
        color="error"
      />

      <div v-else-if="!stockData?.content?.length" class="py-12 text-center">
        <UIcon name="i-lucide-inbox" class="text-4xl text-gray-300 mb-3" />
        <p class="text-gray-400 text-sm">Tidak ada stok akun ditemukan.</p>
      </div>

      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="item in stockData.content"
          :key="item.id"
          class="flex items-center gap-4 py-4 px-2 hover:bg-gray-50 rounded-xl transition-colors"
          :class="selected.has(item.id) ? 'bg-blue-50/60' : ''"
        >
          <!-- Hanya item ACTIVE yang bisa dipilih untuk hapus massal -->
          <UCheckbox
            class="flex-none"
            :model-value="selected.has(item.id)"
            :disabled="item.status !== 'ACTIVE' || bulkDeleting"
            :aria-label="`Pilih item #${item.id}`"
            @update:model-value="(v) => toggleItem(item, v === true)"
          />
          <div class="flex-none">
            <img
              v-if="item.product_banner_url"
              :src="getImageUrl(item.product_banner_url)"
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
            <div class="flex flex-wrap items-center gap-1.5 my-0.5">
              <UBadge color="neutral" variant="soft" size="xs" :icon="STOCK_CONTENT_ICON[stockContentKind(item)]">
                {{ STOCK_CONTENT_LABEL[stockContentKind(item)] }}
              </UBadge>
              <UBadge v-if="item.account_type_name" color="primary" variant="soft" size="xs">
                {{ item.account_type_name }}
              </UBadge>
              <span v-if="stockAccountLabel(item)" class="text-xs text-gray-700 font-mono truncate flex items-center gap-1">
                <UIcon name="i-lucide-user-round" class="size-3 flex-none text-gray-400" />
                {{ stockAccountLabel(item) }}
              </span>
            </div>
            <a
              v-if="item.file_name"
              :href="item.file_url ? getImageUrl(item.file_url) : undefined"
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
              <NuxtLink
                v-if="item.transaction_id"
                :to="`/seller/order/${item.transaction_id}`"
                class="font-mono text-blue-500 hover:underline flex items-center gap-1"
                title="Lihat transaksi"
                @click.stop
              >
                <UIcon name="i-lucide-receipt" class="size-3" />
                {{ item.transaction_id }}
              </NuxtLink>
            </div>
          </div>

          <div class="flex-none flex items-center gap-2">
            <StockStatusBadge :status="item.status" />

            <UButton icon="i-lucide-eye" size="xs" color="neutral" variant="ghost" title="Detail" @click="openDetail(item)" />

            <UButton
              v-if="item.status === 'ACTIVE'"
              icon="mdi:pencil-outline"
              size="xs"
              color="primary"
              variant="ghost"
              title="Edit"
              @click="openEdit(item)"
            />
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
    </ClientOnly>

    <StockItemDetailModal v-if="detailItem" v-model:open="detailOpen" :item="detailItem" editable transaction-base="/seller/order" @edit="openEdit" @readd="openReAdd" />
    <StockReAddItemModal v-if="reAddItem" v-model:open="reAddOpen" :item="reAddItem" @added="refresh()" />
    <StockEditItemModal v-if="editItem" v-model:open="editOpen" :item="editItem" @saved="onItemSaved" @stale="refresh()" />

  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import { useProductsApi } from '~/composables/api/product'
import type { ProductStockItemResponse } from '~/types/product/ProductStockItemResponse'
import type { PageResponse } from '~/types/PageResponse'
import { STOCK_CONTENT_ICON, STOCK_CONTENT_LABEL, STOCK_STATUS_FILTER_OPTIONS, stockAccountLabel, stockContentKind } from '~/helper/stockAccountHelper'

definePageMeta({ layout: 'seller', label: 'Stok Produk', ssr: false })

const toast = useToast()
const { confirm, close: closeConfirm } = useConfirm()
const { getMyAllStockItems, deleteProductStockItem, bulkDeleteStockItems } = useProductsApi()

const page = ref(0)
const perPageValue = ref(20)
const perPageItems = [10, 20, 50, 100]

const filters = reactive({
  status: 'ALL',
  transactionId: '',
  fileName: '',
  description: '',
  productName: '',
  accountTypeId: null as number | null,
  account: '',
})

const appliedFilters = reactive({ ...filters })

const statusFilterOptions = STOCK_STATUS_FILTER_OPTIONS

const hasActiveFilter = computed(() =>
  filters.status !== 'ALL' ||
  !!filters.transactionId ||
  !!filters.fileName ||
  !!filters.description ||
  !!filters.productName ||
  !!filters.accountTypeId ||
  !!filters.account
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
const countReturned = computed(() => stockData.value?.content.filter(i => i.status === 'RETURNED').length ?? 0)

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
  filters.accountTypeId = null
  filters.account = ''
  Object.assign(appliedFilters, filters)
  page.value = 0
  refresh()
}

// ===== DETAIL =====
const detailItem = ref<ProductStockItemResponse | null>(null)
const detailOpen = ref(false)

function openDetail(item: ProductStockItemResponse) {
  detailItem.value = item
  detailOpen.value = true
}

// ===== TAMBAH ULANG ITEM RETURNED =====
const reAddItem = ref<ProductStockItemResponse | null>(null)
const reAddOpen = ref(false)

function openReAdd(item: ProductStockItemResponse) {
  detailOpen.value = false
  reAddItem.value = item
  reAddOpen.value = true
}

// ===== EDIT (hanya item ACTIVE) =====
const editItem = ref<ProductStockItemResponse | null>(null)
const editOpen = ref(false)

function openEdit(item: ProductStockItemResponse) {
  detailOpen.value = false
  editItem.value = item
  editOpen.value = true
}

// Perbarui baris & detail dengan data terbaru dari response PATCH, lalu muat ulang list dari BE.
// stockData adalah shallowRef (default Nuxt 4), jadi objeknya harus diganti, bukan dimutasi.
async function onItemSaved(updated: ProductStockItemResponse) {
  if (stockData.value) {
    stockData.value = {
      ...stockData.value,
      content: stockData.value.content.map(i => (i.id === updated.id ? updated : i)),
    }
  }
  if (detailItem.value?.id === updated.id) detailItem.value = updated
  if (editItem.value?.id === updated.id) editItem.value = updated
  await refresh()
}

function onPageChange(p: number) { page.value = p - 1; refresh() }

watch(perPageValue, () => { page.value = 0; refresh() })

// ===== PILIH & HAPUS MASSAL =====
const MAX_BULK_DELETE = 500

// Pilihan tetap tersimpan lintas halaman & filter; item disimpan untuk label rincian yang dilewati
const selected = ref(new Map<number, ProductStockItemResponse>())
const selectedCount = computed(() => selected.value.size)
const bulkDeleting = ref(false)
const bulkSkipped = ref<{ id: number; reason: string; label: string | null }[]>([])

const pageActiveItems = computed(() => stockData.value?.content.filter(i => i.status === 'ACTIVE') ?? [])

const pageSelectState = computed<boolean | 'indeterminate'>(() => {
  const items = pageActiveItems.value
  const count = items.filter(i => selected.value.has(i.id)).length
  if (!count) return false
  return count === items.length ? true : 'indeterminate'
})

function toggleItem(item: ProductStockItemResponse, checked: boolean) {
  if (item.status !== 'ACTIVE') return
  if (checked) selected.value.set(item.id, item)
  else selected.value.delete(item.id)
}

// "Pilih semua" hanya untuk item ACTIVE di halaman yang sedang tampil
function togglePageSelection() {
  const selectAll = pageSelectState.value !== true
  for (const item of pageActiveItems.value) toggleItem(item, selectAll)
}

function clearSelection() {
  selected.value.clear()
}

const itemLabel = (item?: ProductStockItemResponse) =>
  item ? [item.product_name, item.file_name || stockAccountLabel(item) || item.description].filter(Boolean).join(' · ') : null

async function handleBulkDelete() {
  const count = selectedCount.value
  if (!count || count > MAX_BULK_DELETE) return
  const ok = await confirm({
    title: `Hapus ${count} item stok?`,
    message: 'Tindakan ini tidak bisa dibatalkan. Item yang sudah terkirim akan dilewati.',
    confirmText: 'Ya, Hapus',
    cancelText: 'Batal',
    confirmColor: 'error',
  })
  if (!ok) return

  const snapshot = new Map(selected.value)
  bulkDeleting.value = true
  bulkSkipped.value = []
  try {
    const result = await bulkDeleteStockItems([...snapshot.keys()])
    toast.add({
      title: 'Stok Dihapus',
      description: result.message || `${result.deleted} stock item berhasil dihapus`,
      color: result.skipped.length ? 'warning' : 'success',
    })
    bulkSkipped.value = result.skipped.map(s => ({ ...s, label: itemLabel(snapshot.get(s.id)) }))
    clearSelection()
    await refresh()
  } catch (err: any) {
    // Pilihan dipertahankan saat error
    toast.add({ title: 'Gagal ❌', description: err.statusMessage || err.message, color: 'error' })
    if (err.statusCode === 403) await refresh()
  } finally {
    bulkDeleting.value = false
    closeConfirm()
  }
}

const deletingId = ref<number | null>(null)

async function handleDelete(item: ProductStockItemResponse) {
  const ok = await confirm({
    title: 'Hapus Item Stok?',
    message: `Item "${item.file_name || stockAccountLabel(item) || item.description || '#' + item.id}" akan dihapus secara permanen.`,
    confirmText: 'Ya, Hapus',
    cancelText: 'Batal',
    confirmColor: 'error',
  })
  if (!ok) return
  deletingId.value = item.id
  try {
    await deleteProductStockItem(item.id)
    selected.value.delete(item.id)
    toast.add({ title: 'Stok Dihapus', description: 'Item berhasil dihapus dari stok.', color: 'success' })
    await refresh()
  } catch (err: any) {
    toast.add({ title: 'Gagal ❌', description: err.statusMessage || err.message, color: 'error' })
  } finally {
    deletingId.value = null
    closeConfirm()
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

