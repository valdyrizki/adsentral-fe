<template>
  <UCard class="mb-6">
    <NuxtLink to="/seller/stock">
      <div class="flex items-center gap-2 p-4 border rounded-2xl border-blue-500 hover:bg-blue-50 cursor-pointer w-1/2 md:w-1/5">
        <UIcon name="i-lucide-arrow-left" class="size-5 text-blue-500" />
        <span class="font-medium text-blue-500">Kembali ke Stok</span>
      </div>
    </NuxtLink>
  </UCard>

  <ClientOnly>
    <template #fallback>
      <AppLoadingSkeleton />
    </template>

    <UCard class="shadow-sm">
      <template #header>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p class="font-semibold text-gray-800">Pilih Produk</p>
            <p class="text-xs text-gray-400 mt-0.5">Pilih produk bertipe Stok Akun yang akan ditambah stoknya.</p>
          </div>
          <div class="flex gap-2 w-full sm:w-auto">
            <UInput
              v-model="search"
              icon="mdi:magnify"
              placeholder="Cari nama produk..."
              class="flex-1 sm:w-64"
              @update:model-value="handleSearch"
            />
            <USelect v-model="perPageValue" :items="perPageItems" class="w-24" aria-label="Jumlah produk per halaman" />
          </div>
        </div>
      </template>

      <AppLoadingSkeleton v-if="pending" />

      <UAlert
        v-else-if="error"
        title="Terjadi Kesalahan"
        :description="(error as any).statusMessage || error.message || 'Gagal memuat produk'"
        icon="mdi:alert-circle"
        color="error"
      />

      <div v-else-if="!products.length && !appliedKeyword" class="py-12 flex flex-col items-center gap-3 text-center">
        <UIcon name="i-lucide-package-open" class="text-4xl text-gray-300" />
        <p class="text-gray-500 text-sm">Anda belum memiliki produk dengan tipe pengiriman Stok Akun.</p>
        <NuxtLink to="/seller/product/create">
          <UButton icon="mdi:plus" color="primary">Buat Produk</UButton>
        </NuxtLink>
      </div>

      <div v-else-if="!products.length" class="py-12 text-center text-gray-400 text-sm">
        Tidak ada produk yang cocok dengan "{{ appliedKeyword }}".
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <NuxtLink
          v-for="product in products"
          :key="product.id"
          :to="`/seller/stock/add/${product.id}`"
          class="group flex gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
        >
          <img
            :src="getImageUrl(product.banner_url)"
            :alt="product.name"
            class="w-16 h-16 rounded-lg object-cover border border-gray-100 bg-gray-50 flex-none"
          />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-gray-800 line-clamp-2 group-hover:text-blue-700">{{ product.name }}</p>
            <div class="flex flex-wrap items-center gap-2 mt-1.5">
              <UBadge :color="statusColor(product.status)" variant="soft" size="xs">{{ statusLabel(product.status) }}</UBadge>
              <span class="text-xs text-gray-500">
                Stok: <span class="font-semibold" :class="product.stock ? 'text-gray-800' : 'text-red-500'">{{ product.stock ?? 0 }}</span>
              </span>
            </div>
          </div>
          <UIcon name="i-lucide-plus-circle" class="size-5 text-gray-300 group-hover:text-blue-500 flex-none self-center" />
        </NuxtLink>
      </div>

      <div
        v-if="data && data.total_pages > 1 && !pending"
        class="flex justify-center items-center pt-4"
      >
        <UPagination
          :page="page + 1"
          :total="data.total_elements"
          :items-per-page="perPageValue"
          :sibling-count="1"
          show-edges
          @update:page="(p: number) => { page = p - 1 }"
        />
      </div>
    </UCard>
  </ClientOnly>
</template>

<script lang="ts" setup>
import { useProductsApi } from '~/composables/api/product'
import type { ProductResponse } from '~/types/product/ProductResponse'
import type { PageResponse } from '~/types/PageResponse'

definePageMeta({ layout: 'seller', label: 'Tambah Stok', ssr: false })

const { fetchMyProduct } = useProductsApi()

const perPageValue = ref(20)
const perPageItems = [10, 20, 50, 100]
const page = ref(0)
const search = ref('')
const appliedKeyword = ref('')

// Filter tipe STOCKING, keyword, dan pagination dilakukan di BE
const { data, pending, error, refresh } = useAsyncData<PageResponse<ProductResponse>>(
  'seller-stocking-products',
  () => fetchMyProduct(page.value, perPageValue.value, appliedKeyword.value, 'STOCKING'),
  { server: false, watch: [page, appliedKeyword] }
)

watch(perPageValue, () => {
  // Kembali ke halaman 1; kalau sudah di halaman 1, watch `page` tidak terpicu jadi refresh manual
  if (page.value === 0) refresh()
  else page.value = 0
})

const products = computed(() => data.value?.content ?? [])

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function handleSearch() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    page.value = 0
    appliedKeyword.value = search.value.trim()
  }, 500)
}

type BadgeColor = 'error' | 'info' | 'success' | 'warning' | 'neutral'
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
  }
  return map[status] ?? status
}
</script>
