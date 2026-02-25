<template>
  <!-- Container -->
  <div class="w-full">
    <div class="mx-auto  px-4 py-4 sm:px-6 sm:py-6 max-w-7xl lg:px-8">
      <div class="mx-auto mt-4 flow-root pb-10  ">
        
        <!-- Banner / Foto Sampul -->
        <div class="w-full h-60 relative rounded-t-2xl overflow-hidden">
          <NuxtImg :src="config.public.backendUrl +'/'+ merchant?.banner_url" alt="Banner" 
          
          class="object-fill max-h-60 mx-auto" />
          <div class="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-50 rounded-t-2xl"></div>
        </div>

        <div>
          <div class="mx-auto mt-4 flow-root border rounded-2xl border-blue-200 bg-gray-100">
            <div class="flex flex-col sm:flex-row gap-8 sm:gap-4 p-4">
              <div class="basis-1/3">

                <div class="flex gap-4">
                  <!-- Foto Profil -->
                  <div class="w-32 h-32 relative rounded-full overflow-hidden border-4 border-white">
                    <NuxtImg :src="config.public.backendUrl +'/'+ merchant?.logo_url" alt="Foto Profil" class="object-cover w-full h-full" />
                  </div>

                  <!-- Nama & Rating -->
                  <div class="flex flex-col">
                    <p class="font-bold">NAMA MERCHANT</p>
                    <p class="text-sm text-gray-500">RATING</p>
                                        <!-- Tombol Follow & Chat-->
                    <div class="flex gap-2 mt-auto">
                      <UButton icon="uiw:plus" color="primary" variant="solid" size="xs" >Follow</UButton>
                      <UButton icon="uiw:message" size="xs" color="primary" variant="outline">Chat Penjual</UButton>
                    </div>
                  </div>

                </div>

                
              </div>

              <!-- Detail & Info Merchant -->
              <div class="basis-2/3">
                <div class="flex gap-4">
                  <div class="flex flex-col gap-2">
                    <div class="flex flex-row gap-1 items-center">
                      <UIcon name="majesticons:box" class="size-5" />
                      Produk : 10
                    </div>
                    
                    <div class="flex flex-row gap-1 items-center">
                      <UIcon name="gridicons:add-outline" class="size-5" />
                      Bergabung : 28 Sep 2018 05:27
                    </div>
                    
                    <div class="flex flex-row gap-1 items-center">
                      <UIcon name="gis:search-country" class="size-5" />
                      Negara : Indonesia
                    </div>
                    
                    <div class="flex flex-row gap-1 items-center">
                      <UIcon name="mingcute:time-line" class="size-5" />
                      Jam Operasional : 13.00-22.00 WIB
                    </div>
                  </div>

                  <!-- baris kedua -->
                   <div class="flex flex-col gap-2">
                    <div class="flex flex-row gap-1 items-center">
                      <UIcon name="majesticons:box" class="size-5" />
                      Produk : 10
                    </div>
                    
                    <div class="flex flex-row gap-1 items-center">
                      <UIcon name="gridicons:add-outline" class="size-5" />
                      Bergabung : 28 Sep 2018 05:27
                    </div>
                    
                    <div class="flex flex-row gap-1 items-center">
                      <UIcon name="gis:search-country" class="size-5" />
                      Negara : Indonesia
                    </div>
                    
                    <div class="flex flex-row gap-1 items-center">
                      <UIcon name="mingcute:time-line" class="size-5" />
                      Jam Operasional : 13.00-22.00 WIB
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        


        <div>
          <div class="mx-auto mt-4 flow-root border rounded-2xl border-blue-200 bg-gray-100">
            <div class="flex flex-col sm:flex-row gap-8 sm:gap-4 p-4">
              <div class="mx-auto w-full p-4">

                <!-- <div v-if="loading">
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
                </div> -->

                <div v-if="loading">
                  <AppLoadingSkeleton/>
                </div>
                <div v-else-if="error">
                  <UAlert
                      title="Terjadi Kesalahan"
                      description="Merchant tidak ditemukan"
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

        
      </div>

    </div>
    
  </div>
</template>

<script lang="ts" setup>
import { NuxtImg } from '#components';
import type { AppLoadingSkeleton } from '#components';
import { useProductsApi } from '~/composables/api/product';
import { useMerchantApi } from '~/composables/api/merchant';
import type { PageResponse } from '~/types/PageResponse';
import type { ProductResponse } from '~/types/product/ProductResponse';
import type { MerchantResponse } from '~/types/MerchantResponse';

// Ambil API function
const { fetchProductsByMerchantId } = useProductsApi()
const { getMerchantById } = useMerchantApi()

//Ambil config
const config = useRuntimeConfig()

//ambil route param
const route = useRoute() 

// Reactive state
const loading = ref<boolean>(true)
const error = ref<string | null | any >(null)
const productPagination = ref<PageResponse<ProductResponse>>()
const merchant = ref<MerchantResponse>()


  // fungsi Fetch data di server-side (Nuxt auto-handle hydration)
  try {
    loading.value = true
    productPagination.value = await fetchProductsByMerchantId(route.params.id as string, 0, 12, '') // page=0, size=10
  } catch (err: any) {
    error.value = err.statusMessage || 'Failed to load products'
  } finally {
    loading.value = false
  }

    // fungsi Fetch data di server-side (Nuxt auto-handle hydration)
  try {
    loading.value = true
    merchant.value = await getMerchantById(route.params.id) // page=0, size=10
  } catch (err: any) {
    error.value = err.statusMessage || 'Failed to load products'
  } finally {
    loading.value = false
  }


</script>
