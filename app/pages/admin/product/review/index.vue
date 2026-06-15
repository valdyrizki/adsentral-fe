<template>
  <div class="space-y-6">

    <!-- Filters -->
    <UCard class="shadow-sm">
      <div class="flex flex-col sm:flex-row gap-3">
        <UInput
          v-model="search"
          icon="i-heroicons-magnifying-glass"
          placeholder="Cari nama produk / merchant..."
          class="flex-1"
          clearable
          @keyup.enter="handleSearchEnter"
        />
        <USelect
          v-model="filterStatus"
          :items="statusOptions"
          placeholder="Semua Status"
          value-key="value"
          class="w-full sm:w-52"
          @update:model-value="handleFilter"
        />
        <USelect v-model="perPageValue" :items="perPageItems" class="w-full sm:w-24" />
        <UButton icon="mdi:refresh" color="neutral" variant="outline" :loading="pending" @click="refresh()">
          Refresh
        </UButton>
      </div>
    </UCard>

    <!-- List -->
    <ClientOnly>
      <template #fallback>
        <UCard class="shadow-sm">
          <div class="divide-y divide-gray-100">
            <div v-for="i in 5" :key="i" class="flex gap-4 py-4 px-2">
              <USkeleton class="w-20 h-20 rounded-xl flex-none" />
              <div class="flex-1 space-y-2">
                <USkeleton class="h-4 w-48 rounded" />
                <USkeleton class="h-3 w-32 rounded" />
                <USkeleton class="h-3 w-64 rounded" />
              </div>
            </div>
          </div>
        </UCard>
      </template>
    <UCard class="shadow-sm">
      <template #header>
        <p class="font-semibold text-gray-800">
          Review Produk Seller
          <span v-if="productPagination?.total_elements" class="text-xs text-gray-400 font-normal ml-2">
            ({{ productPagination.total_elements }} total)
          </span>
        </p>
      </template>

      <AppLoadingSkeleton v-if="pending" />

      <UAlert
        v-else-if="error"
        title="Terjadi Kesalahan"
        :description="error.message || 'Gagal memuat data produk'"
        icon="icon-park-solid:error"
        color="error"
      />

      <div v-else-if="!productPagination?.content?.length" class="py-10 text-center text-gray-400 text-sm">
        <UIcon name="i-heroicons-inbox" class="text-4xl text-gray-300 mb-3" />
        <p>Tidak ada produk ditemukan.</p>
      </div>

      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="product in productPagination.content"
          :key="product.id"
          class="flex flex-row gap-4 py-4 px-2 hover:bg-gray-50 rounded-xl transition-colors"
        >
          <!-- Banner -->
          <div class="flex-none">
            <img
              :src="getImageUrl(product.banner_url)"
              :alt="product.name"
              class="w-20 h-20 rounded-xl object-cover border border-gray-100 bg-gray-50"
            />
          </div>

          <!-- Info -->
          <div class="flex-grow flex flex-col min-w-0">
            <div class="flex flex-wrap gap-1.5 items-center mb-1">
              <UBadge :color="statusColor(product.status)" :label="statusLabel(product.status)" size="sm" variant="solid" />
              <span class="text-xs font-mono text-gray-400">#{{ product.id }}</span>
            </div>
            <p class="text-sm font-semibold text-gray-800 truncate">{{ product.name }}</p>
            <p class="text-xs text-gray-500 mt-0.5">
              <UIcon name="i-lucide-store" class="size-3.5 inline mr-0.5" />
              {{ product.merchant_name }}
            </p>

            <div class="mt-auto flex flex-wrap gap-3 pt-3 text-xs text-gray-400">
              <span class="flex items-center gap-1">
                <UIcon name="fa6-solid:rupiah-sign" />
                <span class="font-semibold text-gray-700">{{ product.sell_price.toLocaleString('id-ID') }}</span>
              </span>
              <span class="flex items-center gap-1">
                <UIcon name="mdi:package-variant" />
                Stok: {{ product.stock }}
              </span>
              <span class="flex items-center gap-1">
                <UIcon name="mdi:tag-outline" />
                {{ product.category_name }}
              </span>
              <span class="flex items-center gap-1">
                <UIcon name="mdi:calendar" />
                {{ dayjs(product.created_at).format('DD MMM YYYY, HH:mm') }}
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="ml-auto flex-none flex flex-col gap-2 items-end justify-start">
            <template v-if="product.status === 'REVIEW'">
              <UButton
                icon="mdi:check-circle"
                size="xs"
                color="success"
                variant="soft"
                :loading="loadingId === `approve-${product.id}`"
                @click="handleApprove(product)"
              >
                Setujui
              </UButton>
              <UButton
                icon="mdi:close-circle"
                size="xs"
                color="error"
                variant="soft"
                :loading="loadingId === `reject-${product.id}`"
                @click="handleReject(product)"
              >
                Tolak
              </UButton>
            </template>

            <UButton
              v-if="product.status === 'ACTIVE'"
              icon="mdi:shield-alert"
              size="xs"
              color="warning"
              variant="soft"
              :loading="loadingId === `suspend-${product.id}`"
              @click="handleSuspend(product)"
            >
              Suspend
            </UButton>

            <UButton
              v-if="product.status === 'NONACTIVE' || product.status === 'SUSPEND'"
              icon="mdi:check-circle-outline"
              size="xs"
              color="info"
              variant="soft"
              :loading="loadingId === `approve-${product.id}`"
              @click="handleApprove(product)"
            >
              Aktifkan
            </UButton>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="productPagination && productPagination.total_pages > 1 && !pending"
        class="flex justify-center items-center pt-4"
      >
        <UPagination
          :page="page + 1"
          :total="productPagination.total_elements"
          :items-per-page="perPageValue"
          :sibling-count="1"
          show-edges
          @update:page="onPageChange"
        />
      </div>
    </UCard>
    </ClientOnly>

  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import { useProductsApi } from '~/composables/api/product'
import type { PageResponse } from '~/types/PageResponse'
import type { ProductResponse } from '~/types/product/ProductResponse'

definePageMeta({ layout: 'admin', label: 'Review Produk' })

const toast = useToast()
const { confirm, close } = useConfirm()
const { getAllProductsAdmin, adminActivateProduct, rejectProduct, suspendProduct } = useProductsApi()

// ===== FILTER STATE =====
const page = ref(0)
const perPageValue = ref(10)
const perPageItems = [5, 10, 25, 50]
const search = ref('')
const keyword = ref('')
const filterStatus = ref('REVIEW')

const statusOptions = [
  { label: 'Menunggu Review', value: 'REVIEW' },
  { label: 'Aktif', value: 'ACTIVE' },
  { label: 'Ditangguhkan Seller', value: 'INACTIVE' },
  { label: 'Ditolak / Nonaktif', value: 'NONACTIVE' },
  { label: 'Suspend', value: 'SUSPEND' },
  { label: 'Semua Status', value: '' },
]

let searchTimeout: ReturnType<typeof setTimeout> | null = null

// ===== FETCH =====
const {
  data: productPagination,
  pending,
  error,
  refresh,
} = useAsyncData<PageResponse<ProductResponse>>(
  () => `admin-review-products-${page.value}-${perPageValue.value}-${keyword.value}-${filterStatus.value}`,
  () => getAllProductsAdmin(page.value, perPageValue.value, keyword.value, 'terbaru', filterStatus.value),
  { watch: [page, perPageValue], server: false }
)

watch(search, (val) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    keyword.value = val
    page.value = 0
    refresh()
  }, 500)
})

function handleSearchEnter() {
  if (searchTimeout) clearTimeout(searchTimeout)
  keyword.value = search.value
  page.value = 0
  refresh()
}

function handleFilter() {
  page.value = 0
  refresh()
}

function onPageChange(newPage: number) {
  page.value = newPage - 1
}

// ===== HELPERS =====
type BadgeColor = 'error' | 'primary' | 'secondary' | 'tertiary' | 'info' | 'success' | 'warning' | 'neutral'

const statusColor = (status: string): BadgeColor => {
  const map: Record<string, BadgeColor> = {
    REVIEW: 'info',
    ACTIVE: 'success',
    INACTIVE: 'warning',
    NONACTIVE: 'error',
    SUSPEND: 'neutral',
  }
  return map[status] ?? 'neutral'
}

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    REVIEW: 'Menunggu Review',
    ACTIVE: 'Aktif',
    INACTIVE: 'Ditangguhkan',
    NONACTIVE: 'Nonaktif',
    SUSPEND: 'Suspend',
    DELETED: 'Dihapus',
  }
  return map[status] ?? status
}

// ===== ACTIONS =====
const loadingId = ref<string | null>(null)

async function handleApprove(product: ProductResponse) {
  const yes = await confirm({
    title: 'Setujui Produk?',
    message: `Produk "${product.name}" dari ${product.merchant_name} akan diaktifkan.`,
    confirmText: 'Ya, Setujui',
    cancelText: 'Batal',
    confirmColor: 'success',
  })
  if (!yes) return

  loadingId.value = `approve-${product.id}`
  try {
    await adminActivateProduct(product.id)
    toast.add({ title: 'Produk Disetujui ✅', description: `${product.name} telah diaktifkan.`, color: 'success' })
    await refresh()
  } catch (err: any) {
    toast.add({ title: 'Gagal ❌', description: err.statusMessage || err.message, color: 'error' })
  } finally {
    loadingId.value = null
    close()
  }
}

async function handleReject(product: ProductResponse) {
  const yes = await confirm({
    title: 'Tolak Produk?',
    message: `Produk "${product.name}" dari ${product.merchant_name} akan ditolak dan statusnya menjadi NONACTIVE.`,
    confirmText: 'Ya, Tolak',
    cancelText: 'Batal',
    confirmColor: 'error',
  })
  if (!yes) return

  loadingId.value = `reject-${product.id}`
  try {
    await rejectProduct(product.id)
    toast.add({ title: 'Produk Ditolak', description: `${product.name} telah ditolak.`, color: 'warning' })
    await refresh()
  } catch (err: any) {
    toast.add({ title: 'Gagal ❌', description: err.statusMessage || err.message, color: 'error' })
  } finally {
    loadingId.value = null
    close()
  }
}

async function handleSuspend(product: ProductResponse) {
  const yes = await confirm({
    title: 'Suspend Produk?',
    message: `Produk "${product.name}" akan disuspend karena melanggar ketentuan.`,
    confirmText: 'Ya, Suspend',
    cancelText: 'Batal',
    confirmColor: 'warning',
  })
  if (!yes) return

  loadingId.value = `suspend-${product.id}`
  try {
    await suspendProduct(product.id)
    toast.add({ title: 'Produk Disuspend', description: `${product.name} telah disuspend.`, color: 'warning' })
    await refresh()
  } catch (err: any) {
    toast.add({ title: 'Gagal ❌', description: err.statusMessage || err.message, color: 'error' })
  } finally {
    loadingId.value = null
    close()
  }
}
</script>
