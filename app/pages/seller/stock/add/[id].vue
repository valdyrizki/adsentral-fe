<template>
  <UCard class="mb-6">
    <NuxtLink to="/seller/stock/add">
      <div class="flex items-center gap-2 p-4 border rounded-2xl border-blue-500 hover:bg-blue-50 cursor-pointer w-1/2 md:w-1/5">
        <UIcon name="i-lucide-arrow-left" class="size-5 text-blue-500" />
        <span class="font-medium text-blue-500">Pilih Produk Lain</span>
      </div>
    </NuxtLink>
  </UCard>

  <ClientOnly>
    <template #fallback>
      <AppLoadingSkeleton />
    </template>

    <!-- Skeleton hanya saat muat pertama; refresh jumlah stok setelah tambah tidak mengosongkan halaman -->
    <AppLoadingSkeleton v-if="productLoading && !product" />

    <!-- Produk tidak ada / bukan milik seller / bukan tipe Stok Akun -->
    <UCard v-else-if="!product || product.delivery_type !== 'STOCKING'">
      <div class="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <UIcon name="i-lucide-package-x" class="size-16 text-gray-400" />
        <div class="text-xl font-semibold text-gray-700">Produk Tidak Ditemukan</div>
        <p class="text-sm text-gray-500 max-w-md">
          {{ product ? 'Produk ini bukan bertipe pengiriman Stok Akun, jadi stoknya tidak bisa ditambah di sini.' : 'Produk tidak ada atau bukan milik toko Anda.' }}
        </p>
        <NuxtLink to="/seller/stock/add">
          <UButton icon="i-lucide-arrow-left" variant="outline" color="primary">Pilih Produk</UButton>
        </NuxtLink>
      </div>
    </UCard>

    <div v-else class="space-y-6">

      <!-- Info Produk -->
      <UCard class="shadow-sm">
        <div class="flex items-center gap-4">
          <img
            :src="getImageUrl(product.banner_url)"
            :alt="product.name"
            class="w-16 h-16 rounded-xl object-cover border border-gray-100 bg-gray-50 flex-none"
          />
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-gray-800 truncate">{{ product.name }}</p>
            <div class="flex flex-wrap items-center gap-2 mt-1.5">
              <UBadge color="primary" variant="soft" size="sm" icon="i-lucide-file-check">Stok Akun</UBadge>
              <span class="text-sm text-gray-500">
                Stok tersedia:
                <span class="font-semibold text-gray-800">{{ product.stock ?? 0 }}</span>
              </span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Pilih Mode -->
      <UCard class="shadow-sm">
        <template #header>
          <p class="font-semibold text-gray-800">Mode Tambah Stok</p>
        </template>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            v-for="m in modes"
            :key="m.value"
            class="flex gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all"
            :class="mode === m.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'"
            @click="setMode(m.value)"
          >
            <UIcon :name="m.icon" class="size-5 mt-0.5 flex-none" :class="mode === m.value ? 'text-blue-500' : 'text-gray-400'" />
            <div>
              <p class="font-semibold text-sm" :class="mode === m.value ? 'text-blue-700' : 'text-gray-700'">{{ m.label }}</p>
              <p class="text-xs text-gray-500 mt-0.5">{{ m.description }}</p>
            </div>
            <UBadge v-if="mode === m.value" color="primary" size="xs" class="ml-auto self-start">Aktif</UBadge>
          </div>
        </div>
      </UCard>

      <!-- MODE: Satu Item -->
      <StockItemForm v-if="mode === 'single'" :product-id="productId" @added="refreshProduct()" />

      <!-- MODE: Akun Massal -->
      <StockAccountBulkInput v-else-if="mode === 'accounts'" :product-id="productId" @success="refreshProduct()" />

      <!-- MODE: File Only -->
      <StockFileBulkInput v-else v-model:busy="filesBusy" :product-id="productId" @success="refreshProduct()" />

    </div>
  </ClientOnly>
</template>

<script lang="ts" setup>
import { useProductsApi } from '~/composables/api/product'
import type { ProductResponse } from '~/types/product/ProductResponse'

definePageMeta({ layout: 'seller', label: 'Tambah Stok', ssr: false })

const route = useRoute()
const { fetchMyProductById } = useProductsApi()

const productId = computed(() => Number(route.params.id))

// ===== PRODUK =====
// fetchMyProductById gagal (404/403) untuk produk yang bukan milik seller → tampil "Produk Tidak Ditemukan"
const {
  data: product,
  pending: productLoading,
  refresh: refreshProduct,
} = await useAsyncData<ProductResponse | null>(
  `seller-stock-add-product-${route.params.id}`,
  async () => { try { return await fetchMyProductById(route.params.id as string) } catch { return null } },
  { server: false }
)

// ===== MODE =====
type Mode = 'single' | 'accounts' | 'files'
const modes: { value: Mode; label: string; icon: string; description: string }[] = [
  { value: 'single', label: 'Satu Item', icon: 'i-lucide-square-plus', description: 'Isi file, data akun, dan/atau catatan untuk 1 stok.' },
  { value: 'accounts', label: 'Akun Massal', icon: 'i-lucide-users', description: 'Paste teks atau import CSV, setiap baris = 1 akun.' },
  { value: 'files', label: 'File Only', icon: 'i-lucide-files', description: 'Pilih banyak file sekaligus, setiap file jadi 1 stok.' },
]
const mode = ref<Mode>('single')

// Mode tidak bisa diganti selama upload / cek file berjalan
const filesBusy = ref(false)

function setMode(m: Mode) {
  if (filesBusy.value) return
  mode.value = m
}
</script>
