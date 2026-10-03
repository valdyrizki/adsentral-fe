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
          <div class="flex gap-2">
            <UBadge color="success" variant="soft">Aktif: {{ countActive }}</UBadge>
            <UBadge color="info" variant="soft">Terkirim: {{ countSent }}</UBadge>
            <UBadge v-if="countReturned" color="warning" variant="soft">Dikembalikan: {{ countReturned }}</UBadge>
          </div>
        </div>
      </template>

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
        >
          <!-- Banner -->
          <div class="flex-none">
            <img
              v-if="item.product_banner_url"
              :src="getImageUrl(item.product_banner_url)"
              class="w-12 h-12 rounded-xl object-cover border border-gray-100 bg-gray-50"
            />
            <div v-else class="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-100">
              <UIcon name="i-lucide-package" class="text-lg text-gray-400" />
            </div>
          </div>

          <!-- Info -->
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
            <p v-if="item.description" class="text-xs text-gray-400 truncate">{{ item.description }}</p>
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
                :to="`/admin/order/${item.transaction_id}`"
                class="font-mono text-blue-500 hover:underline flex items-center gap-1"
                title="Lihat transaksi"
                @click.stop
              >
                <UIcon name="i-lucide-receipt" class="size-3" />
                {{ item.transaction_id }}
              </NuxtLink>
            </div>
          </div>

          <!-- Status -->
          <div class="flex-none flex items-center gap-2">
            <StockStatusBadge :status="item.status" />
            <UButton icon="i-lucide-eye" size="xs" color="neutral" variant="ghost" title="Detail" @click="openDetail(item)" />
          </div>
        </div>
      </div>

      <!-- Pagination -->
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

    <StockItemDetailModal v-if="detailItem" v-model:open="detailOpen" :item="detailItem" masked transaction-base="/admin/order" />

  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import { useProductsApi } from '~/composables/api/product'
import type { ProductStockItemResponse } from '~/types/product/ProductStockItemResponse'
import type { PageResponse } from '~/types/PageResponse'
import { STOCK_CONTENT_ICON, STOCK_CONTENT_LABEL, STOCK_STATUS_FILTER_OPTIONS, stockAccountLabel, stockContentKind } from '~/helper/stockAccountHelper'

definePageMeta({ layout: 'admin', label: 'Stok Akun', ssr: false })

const { getAdminAllStockItems } = useProductsApi()

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
  'admin-all-stock',
  () => getAdminAllStockItems(page.value, perPageValue.value, { ...appliedFilters }),
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

function onPageChange(p: number) { page.value = p - 1; refresh() }

watch(perPageValue, () => { page.value = 0; refresh() })

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>
