<template>
  <UCard>
    <NuxtLink to="/admin/product">
      <div class="flex items-center gap-2 p-4 border rounded-2xl border-blue-500 hover:bg-blue-50 cursor-pointer w-1/2 md:w-1/5">
        <UIcon name="i-lucide-arrow-left" class="size-5 text-blue-500" />
        <span class="font-medium text-blue-500">Kembali ke Produk</span>
      </div>
    </NuxtLink>
  </UCard>

  <div class="mt-6">

    <div v-if="productLoading">
      <AppLoadingSkeleton />
    </div>

    <UCard v-else-if="productError || !product">
      <div class="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <UIcon name="i-lucide-package-x" class="size-16 text-gray-400" />
        <div class="text-xl font-semibold text-gray-700">Produk Tidak Ditemukan</div>
        <div class="text-sm text-gray-500">Produk yang Anda cari tidak ditemukan atau tidak dapat diakses.</div>
        <NuxtLink to="/admin/product">
          <UButton icon="i-lucide-arrow-left" variant="outline" color="primary">Kembali ke Daftar Produk</UButton>
        </NuxtLink>
      </div>
    </UCard>

    <UCard v-else>
      <template #header>
        <div class="flex items-center gap-3">
          <div class="text-lg font-semibold">Detail Produk</div>
          <UBadge :color="statusColor(product.status)" :label="statusLabel(product.status)" />
          <UBadge color="neutral" variant="outline" size="sm">
            <UIcon name="i-lucide-eye" class="mr-1" />
            Mode Lihat
          </UBadge>
        </div>
      </template>

      <div>

        <!-- Foto Produk -->
        <div>
          <div class="font-medium mb-2">Foto Produk</div>

          <div>
            <div class="font-medium p-4">Foto Utama</div>
            <div class="flex gap-4 sm:flex-row flex-col">
              <img
                v-if="product.banner_url"
                :src="config.public.backendUrl + '/' + product.banner_url"
                :alt="product.name"
                class="w-64 min-h-48 rounded object-cover border"
              />
              <div v-else class="w-64 min-h-48 rounded border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm">
                Tidak ada foto utama
              </div>
            </div>
          </div>

          <div v-if="product.product_image_url?.length">
            <div class="font-medium p-4">Foto Tambahan</div>
            <div class="flex gap-4 sm:flex-row flex-col">
              <div v-for="(imgUrl, idx) in product.product_image_url.slice(0, 3)" :key="idx">
                <div class="text-sm p-1">Foto Tambahan {{ idx + 1 }}</div>
                <img
                  :src="config.public.backendUrl + '/' + imgUrl"
                  :alt="product.name"
                  class="w-64 min-h-24 rounded object-cover border"
                />
              </div>
            </div>
          </div>
        </div>

        <USeparator class="py-4" />

        <!-- Detail Produk -->
        <div>
          <div class="font-medium mb-4">Detail Produk</div>
          <div class="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">

            <div>
              <label class="block text-sm font-medium text-gray-900 mb-1">Nama Produk</label>
              <UInput :model-value="product.name" disabled class="block w-full" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-900 mb-1">Slug</label>
              <UInput :model-value="product.slug" disabled class="block w-full" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-900 mb-1">Merchant</label>
              <UInput :model-value="product.merchant_name" disabled class="block w-full" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-900 mb-1">Kategori</label>
              <UInput :model-value="product.category_name" disabled class="block w-full" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-900 mb-1">Harga Jual</label>
              <UInput :model-value="'Rp ' + product.sell_price.toLocaleString('id-ID')" disabled class="block w-full" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-900 mb-1">Stok</label>
              <UInput :model-value="product.stock === null ? 'Unlimited' : String(product.stock)" disabled class="block w-full" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-900 mb-1">Terjual</label>
              <UInput :model-value="String(product.sold)" disabled class="block w-full" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-900 mb-1">Tipe Pengiriman</label>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
                <div
                  v-for="opt in deliveryTypeOptions"
                  :key="opt.value"
                  class="relative flex flex-col gap-2 p-4 rounded-xl border-2 transition-all"
                  :class="product.delivery_type === opt.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white opacity-50'"
                >
                  <div class="flex items-center gap-2">
                    <UIcon :name="opt.icon" class="size-5" :class="product.delivery_type === opt.value ? 'text-blue-500' : 'text-gray-400'" />
                    <span class="font-semibold text-sm" :class="product.delivery_type === opt.value ? 'text-blue-700' : 'text-gray-700'">
                      {{ opt.label }}
                    </span>
                    <UBadge v-if="product.delivery_type === opt.value" color="primary" size="xs" class="ml-auto">Dipilih</UBadge>
                  </div>
                  <p class="text-xs text-gray-500 leading-relaxed">{{ opt.description }}</p>
                </div>
              </div>
            </div>

            <div v-if="product.delivery_type === 'MANUAL'">
              <label class="block text-sm font-medium text-gray-900 mb-1">Estimasi Pengiriman (Hari)</label>
              <UInput :model-value="product.delivery_days !== null ? String(product.delivery_days) : '-'" disabled class="block w-full" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-900 mb-1">Masa Garansi (Hari)</label>
              <UInput :model-value="product.guarantee_days ? String(product.guarantee_days) : 'Tidak ada garansi'" disabled class="block w-full" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-900 mb-1">Distributor</label>
              <UInput :model-value="product.distributor || '-'" disabled class="block w-full" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-900 mb-1">Rating</label>
              <UInput :model-value="product.average_rating ? product.average_rating.toFixed(1) + ' / 5' : '-'" disabled class="block w-full" />
            </div>

            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-900 mb-1">Deskripsi</label>
              <div
                class="w-full min-h-32 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 prose max-w-none"
                v-html="product.description"
              />
            </div>

            <!-- Konfigurasi AUTO -->
            <template v-if="product.auto_config">
              <div class="col-span-2">
                <USeparator class="mb-4" />
                <div class="font-medium mb-4 text-blue-700">Konfigurasi Pengiriman Otomatis</div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-900 mb-1">Judul Pesan Otomatis</label>
                <UInput :model-value="product.auto_config.title" disabled class="block w-full" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-900 mb-1">File Lampiran</label>
                <div v-if="product.auto_config.file_url" class="flex items-center gap-2 text-sm text-gray-600 p-2 border rounded-md bg-gray-50">
                  <UIcon name="i-lucide-file" class="size-4 text-blue-500" />
                  <span>{{ product.auto_config.file_name || 'File tersimpan' }}</span>
                  <a :href="config.public.backendUrl + '/' + product.auto_config.file_url" target="_blank" class="text-blue-500 hover:underline ml-auto">Lihat</a>
                </div>
                <div v-else class="p-2 border rounded-md bg-gray-50 text-sm text-gray-400">Tidak ada file</div>
              </div>

              <div class="col-span-2">
                <label class="block text-sm font-medium text-gray-900 mb-1">Deskripsi Pesan Otomatis</label>
                <UTextarea :model-value="product.auto_config.description" disabled class="block w-full" :rows="4" />
              </div>
            </template>

          </div>
        </div>

      </div>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
import { useProductsApi } from '~/composables/api/product'
import type { ProductResponse } from '~/types/product/ProductResponse'

definePageMeta({
  layout: 'admin',
  label: 'Detail Produk',
  ssr: false,
})

const config = useRuntimeConfig()
const route = useRoute()
const { fetchProductByIdAdmin } = useProductsApi()

const deliveryTypeOptions = [
  {
    value: 'MANUAL',
    label: 'Manual',
    icon: 'i-lucide-package',
    description: 'Proses pengiriman dilakukan secara manual oleh seller. Cocok untuk produk fisik.',
  },
  {
    value: 'AUTO',
    label: 'Otomatis',
    icon: 'i-lucide-zap',
    description: 'Sistem otomatis mengirim info pesanan ke diskusi orderan saat pembayaran dikonfirmasi.',
  },
  {
    value: 'STOCKING',
    label: 'Stok File',
    icon: 'i-lucide-file-check',
    description: 'File dikirim otomatis ke pembeli. Seller perlu upload stok file terlebih dahulu. Setiap file = 1 stok.',
  },
]

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

const {
  data: product,
  pending: productLoading,
  error: productError,
} = await useAsyncData<ProductResponse | null>(
  `admin-view-product-${route.params.id}`,
  async () => {
    try {
      return await fetchProductByIdAdmin(route.params.id as string)
    } catch {
      return null
    }
  },
  { server: false }
)
</script>
