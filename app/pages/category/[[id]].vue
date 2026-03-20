<template>
  <div class="w-full">
    <div class="m-1 sm:m-3 border rounded-2xl border-blue-200 bg-gray-100">
      <div class="m-1 sm:m-3">

        <h1 class="text-2xl font-bold mb-6 ">CATEGORY</h1>
        
        <div v-if="categoryStore.loading">
          <AppLoadingSkeleton/>
        </div>
        
        <div v-else class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-4 mb-8 items-center">
          <UCard
            v-for="cat in categoryStore.categories"
            :key="cat.id"
            :class="[
              'cursor-pointer flex p-0 overflow-hidden relative group transition-all',
              'w-[100px] h-[100px]',
              cat.id === selectedCategoryId ? 'ring-2 ring-primary bg-primary/10' : 'hover:ring-1 hover:ring-primary'
            ]"
            @click="selectCategory(cat.id)"
          >
            <img
              :src="cat.image_url"
              :alt="cat.name"
              class="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
            <div class="absolute bottom-0 left-0 w-full bg-black/60 text-white text-center py-1 text-sm font-extralight">
              {{ cat.name }}
            </div>
          </UCard>
        </div>
      </div>
    </div>

    <div v-if="selectedCategoryId" class="m-1 sm:m-3 border rounded-2xl border-blue-200 bg-gray-100">
      <div class="m-1 sm:m-3">
        <div>
          <!-- PRODUCT LIST -->
          <div class="mx-auto w-full p-4">

            <div v-if="loadingProduct">
                <AppLoadingSkeleton/>
            </div>
            <div v-else-if="errorProduct">
              <UAlert
                title="Terjadi Kesalahan"
                description="Maaf, terjadi error di server kami saat memanggil list produk."
                icon="icon-park-solid:error"
                color="error"
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
  </div>
</template>

<script lang="ts" setup>
import { useProductsApi } from '~/composables/api/product';
import type { PageResponse } from '~/types/PageResponse';
import type { ProductResponse } from '~/types/product/ProductResponse';

  const categoryStore  = useCategoryStore()
  const route = useRoute()
  const selectedCategoryId : Ref<number | undefined> = ref(route.params.id as number | undefined)

  const loadingProduct = ref<boolean>(true)
  const errorProduct = ref<string | null | any >(null)
  const productPagination = ref<PageResponse<ProductResponse>>()

  // Ambil API function
  const { fetchProductsByCategoryId } = useProductsApi()

  categoryStore.getCategoriesStore();

  async function selectCategory(id: number) {
    selectedCategoryId.value = id

    // fungsi Fetch data getProductByCategoryId di server-side (Nuxt auto-handle hydration)
    try { 
      loadingProduct.value = true
      productPagination.value = await fetchProductsByCategoryId(id, 0, 10, '') // page=0, size=10
    } catch (err: any) {
      errorProduct.value = err.statusMessage || 'Failed to load products'
    } finally {
      loadingProduct.value = false
    }
  }

  //on setup
  if (selectedCategoryId.value) {
    selectCategory(selectedCategoryId.value);
  }


</script>