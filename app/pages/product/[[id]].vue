<template>
  <div class="bg-white">
    <div class="pt-6 pb-6">
      
      <!-- Breadcrumb -->
      <nav aria-label="Breadcrumb" class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-4">
        <UBreadcrumb :items="breadcrumb" />
      </nav>

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
      <div v-else>
        <!-- HEADER PRODUCT & ACTION -->
        <div class="mx-auto max-w-7xl mt-2 border rounded-2xl overflow-x-hidden border-blue-200 bg-gray-100">
          <div class="m-2 md:m-4">
            <div class="flex md:flex-row flex-col gap-4">
              <div class="basis-1/3">
                <NuxtImg :src="product?.banner_url" class="mx-auto"  width="300" height="300"   />
              </div>
              <div class="ml-4 basis-auto">
                <p class="text-2xl "> {{ product?.name }} </p>
                <div class="flex gap-2 mt-2 md:mt-4">
                  <p>5</p>
                  <div>
                    <UIcon name="i-heroicons-star-20-solid" :class="['bg-yellow-300']" />
                    <UIcon name="i-heroicons-star-20-solid" :class="['bg-yellow-300']" />
                    <UIcon name="i-heroicons-star-20-solid" :class="['bg-yellow-300']" />
                    <UIcon name="i-heroicons-star-20-solid" :class="['bg-yellow-300']" />
                    <UIcon name="i-heroicons-star-20-solid" :class="['bg-gray-300']" />
                  </div>
                  
                  <p>( 527 review )</p>
                </div>
                <USeparator class="py-4" />
                <div>
                  <div class="text-5xl text-red-500">
                    Rp {{ product?.sell_price.toLocaleString('id-ID')  }}
                  </div>
                </div>
                <USeparator class="py-4" />
                <div class="flex flex-row gap-2 justify-center md:justify-normal">       
                  <div class="">
                    <UInputNumber v-model="qty" size="xl"/> 
                  </div>
                </div>

                <div class="flex flex-row gap-2 pt-2">
                  <UButton icon="uiw:message" size="md" color="primary" variant="outline">Chat Penjual</UButton>
                  <UButton icon="mdi:cart-outline" color="primary" variant="soft" size="xl" class="basis-auto" @click="addToCart">Masukan Keranjang</UButton>
                  <UButton trailing-icon="i-lucide-arrow-right" color="primary" variant="solid" size="xl" class="basis-auto">Beli Sekarang</UButton>
                </div>

                

                  
              </div>
            </div>
          </div>
          
        </div>

        <div class="mx-auto max-w-7xl mt-2 border rounded-2xl overflow-x-hidden border-blue-200 bg-gray-100">
          <div class="m-2 md:m-4">
            <div class="flex md:flex-row flex-col gap-4">
              <div class="basis-1/3 mx-auto">
                <div class="text-2xl text-center">
                  Gambar Produk
                </div>

                <div v-if="randomImage.length === 0" class="flex flex-col *:**:items-center justify-center">
                  <h1 class="mx-auto text-center pt-4 md:pt-10">Tidak ada gambar lain</h1>
                </div>
                <div v-else>
                  <UCarousel
                    v-slot="{ item }"
                    :auto-scroll="{ startDelay: 100 }"
                    loop
                    :items="randomImage"
                    :ui="{ item: 'basis-1/3 hover:transition-all hover:duration-300 hover:ease-in-out hover:-mt-1' }"
                    class="mt-4"
                  >
                    <div class="m-1">
                      <NuxtImg :src="item.url" class="mx-auto rounded-2xl"    />
                    </div>
                  </UCarousel>
                </div>
              </div>
              <USeparator class="sm:hidden " />
              <div class="ml-4 basis-2/3">

                <div class="flex flex-row gap-2">
                  <div class="basis-auto">
                    <UAvatar
                    src="https://github.com/benjamincanac.png"
                    :chip="{
                      inset: true,
                      color: 'success'
                    }"
                    
                    size="3xl"
                  />
                  </div>

                  <div class="basis-auto">
                    <div class="text-2xl">
                      {{ product?.merchant_name }}
                    </div>
                    <div class="flex flex-row gap-2 items-center">
                      <div class="basis-auto">
                        <UIcon name="i-heroicons-star-20-solid" :class="['bg-yellow-300']" />
                        <UIcon name="i-heroicons-star-20-solid" :class="['bg-yellow-300']" />
                        <UIcon name="i-heroicons-star-20-solid" :class="['bg-yellow-300']" />
                        <UIcon name="i-heroicons-star-20-solid" :class="['bg-yellow-300']" />
                        <UIcon name="i-heroicons-star-20-solid" :class="['bg-gray-300']" />
                      </div>
                      <div class="basis-auto">
                        <div class="">(1564 Terjual)</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="pt-2">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 ">
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

        <!-- DESKRIPSI & RATING -->
        <div class="mx-auto max-w-7xl mt-2 border rounded-2xl overflow-x-hidden border-blue-200 bg-gray-100">
          <div class="m-2 md:m-4">
            <UTabs size="xl" color="primary" variant="link" :items="items" class="w-full"  >
              <template #description="{ item }">
                <p>This is the {{ item.label }} tab.</p>
                <p>{{item.content}}</p>
              </template>
              <template #review="{ item }">
                <p>This is the {{ item.label }} tab.</p>
                <p>{{item.label}}</p>
              </template>
            </UTabs>
          </div>
        </div>
      </div>

      
    </div>
  </div>
</template>

<script setup lang="ts" >
import { useProductsApi } from '~/composables/api/product'
import type { ProductResponse } from '~/types/ProductResponse'


const qty = ref<number>(1)

// Ambil API function
const { getProductById } = useProductsApi()

const route = useRoute()
const toast = useToast()

const product = ref<ProductResponse>()
const loading = ref<boolean>(true)
const error = ref<string | null | any >(null)

//add to cart
const cartStore = useCartStore()

const addToCart = async() =>{
  try{
    cartStore.addToCart(qty.value,product.value)
    toast.add({
    title: 'Berhasil !',
    description: "Berhasil masukan produk ke keranjang",
    color: "success",
    actions: [{
      icon: 'mynaui:cart',
      label: 'Lihat Keranjang',
      color: 'neutral',
      variant: 'outline',
      onClick: () => {
        navigateTo("/cart")
      }
    }]
  })
  }catch(e:any){
    toast.add({
      title: "Terjadi Kesalahan",
      description: e.message,
      color: "error",
      icon: "material-symbols:error-outline"
    })
  }
  
  
}


  try { 
    loading.value = true
    product.value = await getProductById(route.params.id as string) // page=0, size=10
  } catch (err: any) {
    error.value = err.statusMessage || 'Failed to load products'
  } finally {
    loading.value = false
  } 

const randomImage = [
  { name: 'International delivery',  url: 'https://picsum.photos/500/500?random=1' },
  { name: 'International delivery',  url: 'https://picsum.photos/500/500?random=2' },
  { name: 'International delivery',  url: 'https://picsum.photos/500/500?random=3' },
  { name: 'International delivery',  url: 'https://picsum.photos/500/500?random=4' },
  { name: 'International delivery',  url: 'https://picsum.photos/500/500?random=5' },
]

const items = ref([
  {
    label: 'Deskripsi Produk',
    icon: 'majesticons:box',
    content: product.value?.description,
    slot:'description' as const
  },
  {
    label: 'Review Pembeli',
    icon: 'i-heroicons-star-20-solid',
    slot: 'review' as const
  }
])


const breadcrumb = ref([
  {
    label: 'Home',
    icon: 'i-lucide-book-open',
    to: '/'
  },
  {
    label: 'Product',
    icon: 'i-lucide-box',
    to: '/product/'+route.params.id
  }
])




</script>