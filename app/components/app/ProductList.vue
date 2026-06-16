<template>
  <div class="w-full p-1 md:p-0 bg-white">
    <div class="mx-auto w-full md:w-3/4 border rounded-2xl border-blue-200 bg-gray-100">
      <div>
        <AppHeaderSection
          title="Product"
          description="Cari produk yang kamu cari disini!"
          to="/category"
          icon="material-symbols:shopping-bag-sharp"
        />
      </div>

      <USeparator />

      <div class="mx-auto w-full p-4">
        <!-- ClientOnly: tidak render di server, langsung client -->
        <ClientOnly>
          <!-- Loading -->
          <div v-if="pending">
            <AppLoadingSkeleton />
          </div>

          <!-- Error -->
          <div v-else-if="error">
            <UAlert
              title="Terjadi Kesalahan"
              :description="error.message || 'Gagal memuat produk'"
              icon="mdi:alert-circle:error"
              color="error"
            />
          </div>

          <!-- Kosong -->
          <div v-else-if="!productPagination?.content?.length">
            <UAlert
              title="Tidak ada produk"
              description="Belum ada produk tersedia saat ini"
              icon="imdi:tag-off-outline"
              color="neutral"
            />
          </div>

          <!-- Ada data -->
          <div v-else>
            <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
              <div
                v-for="product in productPagination.content"
                :key="product.id"
                class="relative group border border-transparent hover:border hover:rounded-2xl hover:border-blue-200 p-1 transition-all duration-300 ease-in-out"
              >
                <AppProductItem :product="product" />
              </div>
            </div>
          </div>

          <!-- Fallback: ditampilkan saat SSR dan sebelum client mount -->
          <template #fallback>
            <AppLoadingSkeleton />
          </template>
        </ClientOnly>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useProductsApi } from '~/composables/api/product'
import type { PageResponse } from '~/types/PageResponse'
import type { ProductResponse } from '~/types/product/ProductResponse'

const { getProducts } = useProductsApi()

// useAsyncData dengan server: false karena endpoint ini public
// tapi pakai nitro proxy, jadi fetch di client lebih aman
const {
  data: productPagination,
  pending,
  error,
  refresh
} = await useAsyncData<PageResponse<ProductResponse>>(
  'products-home',
  () => getProducts(0, 12, ''),
  {
    server: false  // fetch di client, hindari SSR fetch tanpa context
  }
)
</script>