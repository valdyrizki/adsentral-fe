<template>
  <UCard class="col-span-2">
    <div class="text-2xl">Filters</div>
    <div class="flex gap-4 mt-2">
      <div>
        <div class="text-sm text-gray-500">Per Page</div>
        <UInputMenu v-model="perPageValue" :items="perPageitems" @change="getProduct" />
      </div>
      <div>
        <div class="text-sm text-gray-500">Search</div>
        <UInput
          v-model="search"
          icon="mdi:magnify"
          placeholder="Cari produk..."
          @keyup.enter="handleSearchEnter"
        />
      </div>
      
      <UButton to="/seller/product/create" icon="uiw:plus">Buat Produk</UButton>
    </div>
  </UCard>

  <!-- Chart example -->
  <div class="mt-6">
    <UCard>
      <template #header>
        <div class="text-lg font-semibold">List Produk</div>
      </template>
      <div class="grid grid-cols-1 gap-4">
        
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
              title="Anda belum mempunyai produk untuk dijual"
              description=""
              icon="ix:anomaly-found"
              color="neutral"
            />
        </div>
        <div v-else>
          <div v-for="product in productPagination?.content" :key="product.id" class="border-b border-gray-200 p-2 m-2">
            <div class="flex flex-row gap-4 w-full">
              <div class="flex-none">
                <div class=" sm:order-first">
                  <img :src="config.public.backendUrl +'/'+ product?.banner_url" :alt="product.name" class=" size-40 rounded-lg object-cover " />
                </div>
              </div>
                <div class="flex-grow flex flex-col">
                  <!-- Konten atas yang akan memenuhi ruang -->
                  <div class="flex flex-col gap-1">
                    <div class="flex flex-row gap-2">
                      <UBadge
                        icon="mdi:tag"
                        size="lg"
                        :color="product.status === 'ACTIVE' ? 'primary' : 'error'"
                        variant="solid"
                        :label="product.status"
                      />

                      <NuxtLink :to="`/seller/product/edit/${product.id}`" class="font-medium text-gray-900">ID : #{{ product.id }}</NuxtLink>
                    </div>
                  <div>
                    <h3 class="text-lg font-medium text-gray-900">{{ product.name }}</h3>
                  </div>
                </div>

                  <!-- Konten bawah yang akan didorong ke bawah -->
                  <div class="mt-auto flex flex-col sm:flex-row gap-1 sm:gap-4 pt-4 sm:pt-0"> <!-- Gunakan 'mt-auto' untuk mendorong ke bawah -->
                    <div class="flex flex-row gap-1">
                      <UIcon name="fa6-solid:rupiah-sign" class="size-5 text-gray-400" />
                      <div class="font-medium">
                        {{ product.sell_price.toLocaleString('id-ID') }}
                      </div>
                    </div>

                    <div class="col-span-3 flex flex-row gap-1">
                      <UIcon name="mdi:calendar" class="size-5 text-gray-400" />
                      <div class="font-medium">
                        {{ dayjs(product.created_at).format("YYYY-MM-DD HH:mm:ss")}}
                      </div>
                    </div>

                    <!-- TERJUAL -->
                    <div class="col-span-3 flex flex-row gap-1">
                      <UIcon name="mdi:cart" class="size-5 text-gray-400" />
                      <div class="font-medium">
                        {{ product.sold }} Terjual
                      </div>
                    </div>
                  </div>
              </div>
              <div class="ml-auto flex-none">   
                <div class="flex flex-col gap-2 items-end">
                  <UButton :to="`/seller/product/edit/${product.id}`" icon="mdi:edit" size="xs" color="primary" variant="outline">Edit Product</UButton>
                  <UButton v-if="product.status === 'INACTIVE'" icon="mdi:check-circle" size="xs" color="info" variant="solid" @click="activateHandler(product.id)">Aktifkan Product</UButton>
                  <UButton v-if="product.status === 'ACTIVE'" icon="mdi:delete" size="xs" color="error" variant="solid" @click="deactivateHandler(product.id)">Tangguhkan Product</UButton>
                  <!-- <UButton icon="mdi:cart-outline" color="primary" variant="soft" size="xs" @click="addToCart">Beli Lagi</UButton>
                  <UButton icon="material-symbols:cancel" color="error" variant="soft" size="xs" @click="addToCart">Batalkan</UButton>
                  <UButton icon="material-symbols:help-outline-rounded" color="error" variant="solid" size="xs" @click="addToCart">Tangguhkan</UButton> -->

                </div> 
                
              </div>
            </div>
          </div>
        </div>

      </div>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  layout: "dashboard",
  label: "Products",
  // middleware: ["auth", "seller-only"] // opsional kalau mau validasi role
})

const page = ref(0)
const perPageitems = ref([5, 10, 25, 50])
const perPageValue = ref(5)
const search = ref('')
const toast = useToast()

import dayjs from 'dayjs';
import { useProductsApi } from '~/composables/api/product';
import type { PageResponse } from '~/types/PageResponse';
import type { ProductResponse } from '~/types/product/ProductResponse';

// Ambil API function
const { getMyProducts,fetchMyProduct,deactivateProduct,activateProduct } = useProductsApi()

//Ambil config
const config = useRuntimeConfig()

// Reactive state
const loading = ref<boolean>(true)
const error = ref<string | null | any >(null)
const productPagination = ref<PageResponse<ProductResponse>>()

const getMyProductsPagination = async (page: number, perPageValue: number, search : string) => {
  // fungsi Fetch data di server-side (Nuxt auto-handle hydration)
  try { 
    loading.value = true
    productPagination.value = await fetchMyProduct(page, perPageValue, search) // page=0, size=10
    console.log(productPagination.value);
    
  } catch (err: any) {
    console.log(err);
    
    error.value = err.statusMessage || 'Failed to load products'
  } finally {
    loading.value = false
  }
}

const getProduct = () =>{
  getMyProductsPagination(0, perPageValue.value, search.value)
}

getMyProductsPagination(0, perPageValue.value, search.value)
  
const deactivateHandler = async(id:number) => {
  try { 
    loading.value = true
    await deactivateProduct(id)
    await getProduct();
    
    toast.add({
      title: "Berhasil ✅",
      description: "produk anda telah ditangguhkan.",
      color: "success"
    })
    
  } catch (err: any) {
    toast.add({
      title: "Gagal Simpan User ❌",
      description: err.message || "Terjadi kesalahan",
      color: "error"
    })
  } finally {
    loading.value = false
  }
}

const activateHandler = async(id:number) => {
  try { 
    loading.value = true
    await activateProduct(id)
    await getProduct();

    toast.add({
      title: "Berhasil ✅",
      description: "produk anda telah diaktifkan.",
      color: "success"
    })
    
  } catch (err: any) {
    toast.add({
      title: "Gagal Simpan User ❌",
      description: err.message || "Terjadi kesalahan",
      color: "error"
    })
  } finally {
    loading.value = false
  }
}

let searchTimeout: NodeJS.Timeout | null = null

watch(search, (newValue) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  searchTimeout = setTimeout(() => {
    getProduct()
  }, 2000) // 2 detik
})

const handleSearchEnter = () =>{
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  page.value = 0
  getProduct()
}




</script>

<style>

</style>