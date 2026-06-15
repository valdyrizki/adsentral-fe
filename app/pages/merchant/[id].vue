<template>
  <!-- Container -->
  <div class="w-full">
    <div class="mx-auto  px-4 py-4 sm:px-6 sm:py-6 max-w-7xl lg:px-8">
      <UBreadcrumb :items="breadcrumb" class="mb-4" />
      <div class="mx-auto mt-4 flow-root pb-10  ">

        <ClientOnly>
          <template #fallback>
            <AppLoadingSkeleton />
          </template>
        <div v-if="loadingMechant">
          <AppLoadingSkeleton/>
        </div>
        <!-- MERCHANT -->
        <div v-else>
          <!-- Banner / Foto Sampul -->
          <div class="w-full h-60 relative rounded-t-2xl overflow-hidden">
            <NuxtImg :src="getImageUrl(merchant?.banner_url)" alt="Banner"
            
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
                      <NuxtImg :src="getImageUrl(merchant?.logo_url)" alt="Foto Profil" class="object-cover w-full h-full" />
                    </div>

                    <!-- Nama & Rating -->
                    <div class="flex flex-col">
                      <p class="font-bold">{{ merchant?.name }}</p>

                      <!-- RATING -->
                      <div v-if="merchant?.average_rating != null && merchant.average_rating > 0" class="flex items-center gap-1 text-sm">
                        <UIcon name="material-symbols:star-rounded" class="text-yellow-400 size-4" />
                        <span class="font-medium">{{ merchant.average_rating.toFixed(1) }}</span>
                        <span class="text-gray-500">({{ merchant.review_count }} ulasan)</span>
                      </div>
                      <div v-else class="text-sm text-gray-400">
                        Toko baru
                      </div>
                      
                      <!-- Tombol Follow & Chat-->
                      <div class="flex gap-2 mt-auto">
                        <UButton icon="uiw:plus" color="primary" variant="solid" size="xs" >Follow</UButton>
                        <UButton icon="uiw:message" size="xs" color="primary" variant="outline" @click="isChatOpen = true" >Chat Penjual</UButton>
                      </div>
                    </div>

                  </div>

                  
                </div>

                <!-- Detail & Info Merchant -->
                <div class="basis-2/3">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                    <div class="flex flex-row gap-1 items-center">
                      <UIcon name="majesticons:box" class="size-5 text-gray-500 shrink-0" />
                      <span class="text-gray-600">Produk :</span>
                      <span class="font-medium">{{ merchant?.product_count?.toLocaleString('id-ID') ?? '-' }}</span>
                    </div>

                    <div class="flex flex-row gap-1 items-center">
                      <UIcon name="mdi:shopping-outline" class="size-5 text-gray-500 shrink-0" />
                      <span class="text-gray-600">Terjual :</span>
                      <span class="font-medium">{{ merchant?.total_sold?.toLocaleString('id-ID') ?? '-' }}</span>
                    </div>

                    <div class="flex flex-row gap-1 items-center">
                      <UIcon name="gridicons:add-outline" class="size-5 text-gray-500 shrink-0" />
                      <span class="text-gray-600">Bergabung :</span>
                      <span class="font-medium">{{ merchant?.created_at ? formatDate(merchant.created_at) : '-' }}</span>
                    </div>

                    <div class="flex flex-row gap-1 items-center">
                      <UIcon name="material-symbols:star-rounded" class="size-5 text-yellow-400 shrink-0" />
                      <span class="text-gray-600">Ulasan :</span>
                      <span class="font-medium">{{ merchant?.review_count?.toLocaleString('id-ID') ?? '-' }}</span>
                    </div>

                    <div class="flex flex-row gap-1 items-center">
                      <UIcon name="gis:search-country" class="size-5 text-gray-500 shrink-0" />
                      <span class="text-gray-600">Negara :</span>
                      <span class="font-medium">{{ merchant?.country ?? '-' }}</span>
                    </div>

                    <div class="flex flex-row gap-1 items-center">
                      <UIcon name="mingcute:time-line" class="size-5 text-gray-500 shrink-0" />
                      <span class="text-gray-600">Jam Operasional :</span>
                      <span class="font-medium">
                        {{ merchant?.open_time && merchant?.close_time ? `${merchant.open_time} - ${merchant.close_time}` : '24 Jam' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </ClientOnly>

        <!-- PRODUCTS -->
        <div>
          <div class="mx-auto mt-4 flow-root border rounded-2xl border-blue-200 bg-gray-100">
            <div class="flex flex-col sm:flex-row gap-8 sm:gap-4 p-4">
              <div class="mx-auto w-full p-4">
                <!-- SEARCH -->
                <div class="flex flex-col md:flex-row md:items-center gap-2 mb-4">
                    <!-- Search Input -->
                    <div class="flex-1">
                      <UInput
                        v-model="search"
                        placeholder="Cari produk..."
                        icon="i-heroicons-magnifying-glass"
                        class="w-full"
                        clearable
                        @keyup.enter="handleSearchEnter"
                      />
                    </div>
                    <!-- Sort Select -->
                    <div>
                      <USelect
                        v-model="sortBy"
                        :items="sortOption"
                        placeholder="Urutkan"
                        class="w-48"
                        @change="sortHandler"
                      />
                    </div>
                  </div>

                <ClientOnly>
                  <template #fallback>
                    <AppLoadingSkeleton />
                  </template>
                <div v-if="loadingProducts">
                  <AppLoadingSkeleton/>
                </div>
                <div v-else-if="errorProducts">
                  <UAlert
                      title="Terjadi Kesalahan"
                      :description="errorProducts.message"
                      icon="icon-park-solid:error"
                      color="error"
                    />
                </div>
                <div v-else-if="productsPagination?.content.length === 0">
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
                      v-for="product in productsPagination?.content"
                      :key="product.id"
                      class="relative group border border-transparent hover:border hover:rounded-2xl hover:border-blue-200 p-1 transition-all duration-300 ease-in-out"
                    >
                      <AppProductItem :product="product" />
                    </div>
                  </div>
                  
                  <!-- Pagination -->
                  <div v-if="productsPagination && productsPagination.total_pages > 1 && !loadingProducts" class="flex justify-center items-center pt-4">
                    <UPagination
                      :page="page + 1"
                      :total="productsPagination.total_elements"
                      :items-per-page="perPageValue"
                      :sibling-count="1"
                      show-edges
                      @update:page="onPageChange"
                    />
                  </div>
                </div>
                </ClientOnly>


              </div>
            </div>
          </div>
        </div>

        
      </div>

    </div>
    
  </div>

    <ChatModalBuyer
      v-model="isChatOpen"
      :merchant-id="merchant?.id"
    />
</template>

<script lang="ts" setup>
  import { NuxtImg } from '#components';
  import type { AppLoadingSkeleton } from '#components';
  import { useProductsApi } from '~/composables/api/product';
  import { useMerchantApi } from '~/composables/api/merchant';
  import type { PageResponse } from '~/types/PageResponse';
  import type { ProductResponse } from '~/types/product/ProductResponse';
  import type { MerchantResponse } from '~/types/MerchantResponse';
  import ChatModalBuyer from '~/components/form/ChatModalBuyer.vue';
  import dayjs from 'dayjs'
  import 'dayjs/locale/id'

  dayjs.locale('id')
  const formatDate = (iso: string) => dayjs(iso).format('D MMM YYYY')

  // Ambil API function
  const { fetchProductsByMerchantId } = useProductsApi()
  const { fetchMerchantById } = useMerchantApi()

  //Ambil config
  const config = useRuntimeConfig()

  //ambil route param
  const route = useRoute()
  const router = useRouter()

  const breadcrumb = computed(() => [
    { label: 'Home', icon: 'i-lucide-home', to: '/' },
    { label: merchant.value?.name ?? 'Toko', icon: 'i-heroicons-store' },
  ])

  //paging ref
  const page = ref(0)
  const perPageValue = ref(12)
  const keyword = ref('') /** Nilai search yang dipakai ke API (setelah debounce / enter) */
  
  const toast = useToast()

  const isChatOpen = ref(false)

  //product ref
  const search = ref<string>('')
  const sortBy = ref<string>('terbaru')
  const sortOption = ref([
    { label: 'Terbaru', value: 'terbaru' },
    { label: 'Termurah', value: 'termurah' },
    { label: 'Termahal', value: 'termahal' },
    { label: 'Terlaris', value: 'terlaris' },
    { label: 'Nama', value: 'nama' },
  ])

  // ✅ SSR SAFE FETCH NEW
  const { 
    data: productsPagination, 
    pending:loadingProducts, 
    error:errorProducts, 
    refresh:refreshProducts } 
    = await useAsyncData<PageResponse<ProductResponse>>(
    `products-by-merchant-${route.params.id}`,
    () => fetchProductsByMerchantId(route.params.id as string, page.value, perPageValue.value, keyword.value, sortBy.value),
    {
      watch: [page, keyword, sortBy],
      server: false,
    }
  )

  // ✅ SSR SAFE FETCH NEW
    const { 
    data: merchant, 
    pending:loadingMechant, 
    error:errorMechant,  
    refresh:refreshMechant } 
    = await useAsyncData<MerchantResponse>(
    `mechant-by-id-${route.params.id}`,
    () => fetchMerchantById(route.params.id as string),
    { server: false }
  )

  //PAGINATION HANDLER
  const onPageChange = (newPage: number) => {
    page.value = newPage - 1
    router.push({
      query: {
        ...route.query,
        search: search.value.trim() !== '' ? search.value : undefined,
        page: page.value + 1,
        sort: sortBy.value
      }
    })
  }

  //SEARCH HANDLER
  let searchTimeout: ReturnType<typeof setTimeout> | null = null

  const updateSearch = () => {
    page.value = 0
    keyword.value = search.value
    router.push({
      query: {
        ...route.query,
        search: search.value,
        page: page.value + 1,
        sort: sortBy.value
      }
    })
  }

  const handleSearchEnter = () => {
    if (searchTimeout) clearTimeout(searchTimeout)
    updateSearch()
  }

  watch(search, () => {
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      updateSearch()
    }, 500)
  })

  //SORT HANDLER
  const sortHandler = () =>{
    page.value = 0
    keyword.value = search.value
    router.push({
      query: {
        ...route.query,
        search: search.value.trim() !== '' ? search.value : undefined,
        page: page.value + 1,
        sort: sortBy.value
      }
    })
  }


</script>
