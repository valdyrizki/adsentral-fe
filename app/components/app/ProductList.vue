<template>
  <div class="w-full p-1 md:p-0 bg-white">
    <div class="mx-auto w-full md:w-3/4 border rounded-2xl border-blue-200 bg-gray-100">
      <!-- PRODUCT HEADER -->
      <div>
        <AppHeaderSection
          title="Product"
          description="Cari produk yang kamu cari disini!"
          to="/product"
          icon="material-symbols:shopping-bag-sharp"
        />
      </div>

      <USeparator />

      <div>
        <!-- PRODUCT LIST -->
        <div class="mx-auto w-full p-4">

          <div v-if="loading">
              <AppLoadingSkeleton/>
          </div>
          <div v-else-if="error">
            <UAlert
                title="Terjadi Kesalahan"
                :description="error"
                icon="icon-park-solid:error"
                color="error"
              />

          </div>
          <div v-else-if="productPagination?.content.length === 0">
            <UAlert
                title="Tidak ada data untuk ditampilkan"
                description=""
                icon="ix:anomaly-found"
                color="neutral"
              />

          </div>
          <div v-else>
            <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-6 xxl:grid-cols-8 gap-4">
            <div
              v-for="product in productPagination?.content"
              :key="product.id"
              class="relative group border border-transparent hover:border hover:rounded-2xl hover:border-blue-200 p-1 transition-all duration-300 ease-in-out"
            >
              <AppProductItem :product="product" />
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import type { AppLoadingSkeleton } from '#components';
import { useProductsApi } from '~/composables/api/product';
import type { PageResponse } from '~/types/PageResponse';
import type { ProductResponse } from '~/types/product/ProductResponse';

// Ambil API function
const { getProducts } = useProductsApi()

// Reactive state
const loading = ref<boolean>(true)
const error = ref<string | null | any >(null)
const productPagination = ref<PageResponse<ProductResponse[]>>()


  // fungsi Fetch data di server-side (Nuxt auto-handle hydration)
  try { 
    loading.value = true
    productPagination.value = await getProducts(1, 10, '') // page=0, size=10
  } catch (err: any) {
    error.value = err.statusMessage || 'Failed to load products'
  } finally {
    loading.value = false
  }



</script>