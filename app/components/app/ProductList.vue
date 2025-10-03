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
              <NuxtLink :to="`/product/${product.id}`" >
                <div class="relative aspect-square w-full overflow-hidden rounded-lg">
                  <img
                    :src="product.banner_url"
                    :alt="product.name"
                    class="size-full object-cover hover:scale-115 block transition"
                  />
                </div>
              </NuxtLink>

              <!-- UnderImage -->
               <div class="flex justify-between">
                <div class="basis-1/3">
                  
                </div>
                <div></div>
                <div class="basis-1/2 sm:basis-1/3">
                  <div class="relative font-semibol bg-primary rounded-l-full -mt-4">
                    <p class="text-white text-sm p-1 text-center">
                      {{ product.sell_price.toLocaleString('id-ID') }}
                    </p>
                  </div>
                </div>
               </div>

              <!-- Product Info -->
              <div class="relative mt-4">
                <NuxtLink :to="`/product/${product.id}`" class="text-sm font-medium text-gray-900">
                  {{ product.name }}
                </NuxtLink>

                <!-- Avatar container with slide-down -->
                <div
                  class="transition-all duration-300 ease-in-out md:max-h-0 max-h-12 md:opacity-0 opacity-100 md:overflow-hidden group-hover:max-h-12 group-hover:opacity-100"
                >
                  <div class="flex items-center space-x-2 mt-2">
                    <UAvatar
                      size="sm"
                      :src="`https://i.pravatar.cc/100?u=${product.id}`"
                    />
                    <span class="text-xs text-gray-600">{{ product.merchant_name }}</span>
                  </div>
                </div>
              </div>
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
import type { ProductResponse } from '~/types/ProductResponse';

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