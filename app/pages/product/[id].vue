<template>
  <div class="bg-white">
    <div class="pt-6 pb-6">
      
      <!-- Breadcrumb -->
      <nav aria-label="Breadcrumb" class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-4">
        <UBreadcrumb :items="breadcrumb" />
      </nav>

      <div v-if="pending">
        <AppLoadingSkeleton/>
      </div>
      <div v-else-if="product == null">
        <UAlert
            title="Terjadi Kesalahan"
            description="Produk tidak ditemukan atau telah dihapus."
            icon="icon-park-solid:error"
            color="neutral"
        />
      </div>
      <div v-else>
        <!-- HEADER PRODUCT & ACTION -->
        <div class="mx-auto max-w-7xl mt-2 border rounded-2xl overflow-x-hidden border-blue-200 bg-gray-100">
          <div class="m-2 md:m-4">
            <div class="flex md:flex-row flex-col gap-4">
              <div class="basis-1/3">
                <img :src="config.public.backendUrl +'/'+ product?.banner_url" alt="Product Banner"  class="mx-auto"  width="300" height="300"   />
              </div>
              <div class="ml-4 basis-auto">
                <p class="text-2xl "> {{ product?.name }} </p>
                <div class="flex gap-2 mt-2 justify-between">
                  <div class="flex gap-2 items-center">
                    <p class="font-medium">{{ avgRating.toFixed(1) }}</p>
                    <div class="flex gap-0.5">
                      <UIcon
                        v-for="i in 5"
                        :key="i"
                        name="i-heroicons-star-20-solid"
                        :class="i <= Math.round(avgRating) ? 'text-yellow-400' : 'text-gray-300'"
                        class="size-4"
                      />
                    </div>
                    <p class="text-sm text-gray-500">( {{ reviews?.total_elements ?? 0 }} ulasan )</p>
                  </div>
                  <div class="flex flex-row gap-2 items-center">
                    <UBadge>5 Terjual</UBadge>
                  </div>
                  
                </div>
                <USeparator class="py-4" />
                <div>
                  <div class="text-5xl text-red-500">
                    Rp {{ product?.sell_price?.toLocaleString('id-ID') ?? '0' }}
                  </div>
                </div>
                <USeparator class="py-4" />

                <!-- Informasi Stock -->
                <div class="flex flex-wrap gap-4 text-sm">
                  <div class="flex items-center gap-1.5">
                    <UIcon name="majesticons:box" class="size-4 text-gray-400" />
                    <span class="text-gray-500">Stok:</span>
                    <span v-if="product?.stock === null || product?.stock === undefined" class="font-medium text-green-600">Tidak terbatas</span>
                    <span v-else-if="product.stock === 0" class="font-medium text-red-500">Habis</span>
                    <span v-else class="font-medium text-gray-800">{{ product.stock.toLocaleString('id-ID') }}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <UIcon name="mdi:shopping-outline" class="size-4 text-gray-400" />
                    <span class="text-gray-500">Terjual:</span>
                    <span class="font-medium text-gray-800">{{ product?.sold?.toLocaleString('id-ID') ?? 0 }}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <UIcon name="mdi:truck-delivery-outline" class="size-4 text-gray-400" />
                    <span class="text-gray-500">Estimasi Pengiriman:</span>
                    <span v-if="product?.delivery_days" class="font-medium text-blue-600">{{ product.delivery_days }} hari</span>
                    <span v-else class="font-medium text-gray-400">-</span>
                  </div>
                </div>

                <USeparator class="py-4" />
                <!-- Keterangan status jika bukan ACTIVE -->
                <UAlert
                  v-if="product.status !== 'ACTIVE'"
                  :icon="productStatusInfo.icon"
                  :color="productStatusInfo.color as any"
                  :title="productStatusInfo.title"
                  :description="productStatusInfo.description"
                  variant="subtle"
                  class="mt-2"
                />

                <template v-if="product.status === 'ACTIVE'">
                  <div class="flex flex-row gap-2 justify-center md:justify-normal mt-4">
                    <UInputNumber v-model="qty" :max="product?.stock ?? undefined" size="xl"/>
                  </div>

                  <div class="flex flex-row gap-2 pt-2">
                    <UButton icon="uiw:message" size="md" color="primary" variant="outline" @click="isChatOpen = true">Chat Penjual</UButton>
                    <UButton icon="mdi:cart-outline" color="primary" variant="soft" size="xl" class="basis-auto" @click="addToCart">Masukan Keranjang</UButton>
                    <UButton trailing-icon="i-lucide-arrow-right" color="primary" variant="solid" size="xl" class="basis-auto" @click="buyNow">Beli Sekarang</UButton>
                  </div>
                </template>

                <div v-else class="flex flex-row gap-2 pt-2">
                  <UButton icon="uiw:message" size="md" color="primary" variant="outline" @click="isChatOpen = true">Chat Penjual</UButton>
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

                <div v-if="product?.product_image_url.length == 0" class="flex flex-col *:**:items-center justify-center">
                  <h1 class="mx-auto text-center pt-4 md:pt-10">Tidak ada gambar lain</h1>
                </div>
                <div v-else>
                  <UCarousel
                    v-slot="{ item }"
                    :auto-scroll="{ startDelay: 100 }"
                    loop
                    :items="product?.product_image_url"
                    :ui="{ item: 'basis-1/2 hover:transition-all hover:duration-300 hover:ease-in-out hover:-mt-1' }"
                    class="mt-4"
                  >
                    <div class="m-1">
                      <img :src="config.public.backendUrl +'/'+ item" class="mx-auto rounded-2xl"    />
                    </div>
                  </UCarousel>
                </div>
              </div>
              <USeparator class="sm:hidden " />
              <div class="ml-4 basis-2/3">

                <div class="flex flex-row gap-2">
                  <div class="basis-auto">
                    <NuxtLink :to="`/merchant/${product?.merchant_id}`" class="text-xs text-gray-600 hover:underline">
                      <UAvatar
                      :src="config.public.backendUrl +'/'+ product?.merchant_logo"
                      :chip="{
                        inset: true,
                        color: 'success'
                      }"
                      
                      size="3xl"
                    />

                    
                    </NuxtLink>
                  </div>

                  <div class="basis-auto">
                    <NuxtLink :to="`/merchant/${product?.merchant_id}`" class="text-2xl hover:underline">
                      {{ product?.merchant_name }}
                    </NuxtLink>
                    <div v-if="merchantLoading">
                      <AppLoadingSkeleton/>
                    </div>
                    <div v-else class="flex flex-row gap-2 items-center">
                      <div v-if="merchant?.average_rating != null && merchant.average_rating > 0" class="flex items-center gap-1 text-sm">
                        <UIcon name="material-symbols:star-rounded" class="text-yellow-400 size-4" />
                        <span class="font-medium">{{ merchant.average_rating.toFixed(1) }}</span>
                        <span class="text-gray-500">({{ merchant.review_count }} ulasan)</span>
                      </div>
                      <div v-else class="text-sm text-gray-400">
                        Toko baru
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
            <UTabs size="xl" color="primary" variant="link" :items="items" class="w-full">
              <template #description>
                <div 
                  class="prose prose-sm md:prose-base max-w-none p-4" 
                  v-html="sanitizedDescription"
                ></div>
              </template>
              
              <template #review>
                <div class="p-4">
                  <!-- Filter -->
                  <div class="flex flex-col sm:flex-row gap-3 mb-5">
                    <UInput
                      v-model="reviewKeyword"
                      icon="i-lucide-search"
                      placeholder="Cari ulasan..."
                      class="sm:w-64"
                    />
                    <div class="flex gap-2 flex-wrap items-center">
                      <UButton
                        size="sm"
                        :variant="reviewRating === null ? 'solid' : 'outline'"
                        color="primary"
                        @click="reviewRating = null; reviewPage = 1"
                      >Semua</UButton>
                      <UButton
                        v-for="r in [5, 4, 3, 2, 1]"
                        :key="r"
                        size="sm"
                        :variant="reviewRating === r ? 'solid' : 'outline'"
                        color="primary"
                        @click="reviewRating = r; reviewPage = 1"
                      >
                        <UIcon name="i-heroicons-star-20-solid" class="size-3 text-yellow-400" />
                        {{ r }}
                      </UButton>
                    </div>
                  </div>

                  <!-- Loading -->
                  <div v-if="reviewLoading">
                    <AppLoadingSkeleton />
                  </div>

                  <!-- Empty -->
                  <div v-else-if="!reviews?.content?.length" class="flex flex-col items-center justify-center py-12 gap-3 text-center">
                    <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="size-12 text-gray-300" />
                    <p class="text-gray-500">Tidak ada ulasan yang ditemukan.</p>
                  </div>

                  <!-- Review List -->
                  <div v-else class="space-y-4">
                    <!-- Summary -->
                    <div class="flex items-center gap-3 pb-4 border-b">
                      <div class="text-4xl font-bold text-yellow-500">{{ avgRating.toFixed(1) }}</div>
                      <div>
                        <div class="flex gap-0.5">
                          <UIcon
                            v-for="i in 5"
                            :key="i"
                            name="i-heroicons-star-20-solid"
                            :class="i <= Math.round(avgRating) ? 'text-yellow-400' : 'text-gray-300'"
                            class="size-5"
                          />
                        </div>
                        <p class="text-sm text-gray-500 mt-0.5">{{ reviews.total_elements }} ulasan</p>
                      </div>
                    </div>

                    <!-- Each Review -->
                    <div
                      v-for="review in reviews.content"
                      :key="review.id"
                      class="flex gap-4 border-b pb-4 last:border-0 last:pb-0"
                    >
                      <UAvatar :alt="review.reviewer_username" size="md" />
                      <div class="flex-1">
                        <div class="flex items-center justify-between">
                          <span class="font-medium text-sm">{{ review.reviewer_username }}</span>
                          <span class="text-xs text-gray-400">{{ formatDate(review.created_at) }}</span>
                        </div>
                        <div class="flex gap-0.5 mt-1">
                          <UIcon
                            v-for="i in 5"
                            :key="i"
                            name="i-heroicons-star-20-solid"
                            :class="i <= review.rating ? 'text-yellow-400' : 'text-gray-300'"
                            class="size-4"
                          />
                        </div>
                        <p class="mt-2 text-sm text-gray-700 whitespace-pre-line">{{ review.comment }}</p>
                      </div>
                    </div>

                    <!-- Pagination -->
                    <div v-if="reviews.total_pages > 1" class="flex justify-center pt-4">
                      <UPagination
                        v-model:page="reviewPage"
                        :total="reviews.total_elements"
                        :items-per-page="reviewSize"
                      />
                    </div>
                  </div>
                </div>
              </template>
            </UTabs>
          </div>
        </div>
      </div>

      
    </div>
  </div>

  <ChatModalBuyer
    v-model="isChatOpen"
    :product="product"
    :merchant-id="product?.merchant_id"
  />

</template>

<script setup lang="ts" >
import ChatModalBuyer from '~/components/form/ChatModalBuyer.vue'
import { useMerchantApi } from '~/composables/api/merchant'
import { useProductsApi } from '~/composables/api/product'
import { useReviewApi } from '~/composables/api/review'
import type { MerchantResponse } from '~/types/MerchantResponse'
import type { ProductResponse } from '~/types/product/ProductResponse'
import type { ReviewResponse } from '~/types/review/ReviewResponse'
import type { PageResponse } from '~/types/PageResponse'
import DOMPurify from 'isomorphic-dompurify'
import dayjs from 'dayjs'
import 'dayjs/locale/id'

dayjs.locale('id')

//reactive state
const isChatOpen = ref(false)
const qty = ref<number>(1)

//ambil config
const config = useRuntimeConfig()
const route = useRoute()
const toast = useToast()

//store
const useUserStore = useAuthStore()

// Ambil API function
const { fetchProductById } = useProductsApi()
const { fetchMerchantById } = useMerchantApi()
const { fetchReviewByProduct } = useReviewApi()

// ✅ SSR SAFE FETCH OLD
const { data: product, pending, refresh } = await useAsyncData<ProductResponse>(
  `product-${route.params.id}`,
  () => fetchProductById(route.params.id as string)
)

  const {
  data: merchant,
  pending: merchantLoading,
  refresh: refreshMerchant
} = await useAsyncData<MerchantResponse | null>(
  () => `merchant-${product.value?.merchant_id}`,  // ✅ key dinamis
  () => {
    if (!product.value?.merchant_id) return Promise.resolve(null)
    return fetchMerchantById(product.value.merchant_id)
  },
  {
    watch: [() => product.value?.merchant_id],  // ✅ re-fetch saat merchant_id berubah
    immediate: !!product.value?.merchant_id,    // ✅ skip initial run kalau product belum ada
  }
)

const reviewPage = ref(1)
const reviewSize = ref(5)
const reviewRating = ref<number | null>(null)
const reviewKeyword = ref('')
const reviewKeywordDebounced = ref('')

let _kwTimer: ReturnType<typeof setTimeout>
watch(reviewKeyword, (val) => {
  clearTimeout(_kwTimer)
  _kwTimer = setTimeout(() => {
    reviewKeywordDebounced.value = val
    reviewPage.value = 1
  }, 400)
})

const {
  data: reviews,
  pending: reviewLoading,
} = await useAsyncData<PageResponse<ReviewResponse> | null>(
  `reviews-${route.params.id}`,
  async () => {
    if (!product.value?.id) return null
    try {
      return await fetchReviewByProduct(
        product.value.id,
        reviewPage.value - 1,
        reviewSize.value,
        reviewKeywordDebounced.value || undefined,
        reviewRating.value ?? undefined,
      )
    } catch {
      return null
    }
  },
  {
    server: false,
    watch: [reviewPage, reviewRating, reviewKeywordDebounced],
  }
)

const productStatusInfo = computed(() => {
  const map: Record<string, { title: string; description: string; icon: string; color: string }> = {
    REVIEW: {
      title: 'Produk Sedang Direview',
      description: 'Produk ini sedang menunggu persetujuan admin dan belum dapat dibeli.',
      icon: 'i-heroicons-clock',
      color: 'info',
    },
    INACTIVE: {
      title: 'Produk Tidak Tersedia',
      description: 'Produk ini sedang ditangguhkan oleh seller dan tidak dapat dibeli saat ini.',
      icon: 'i-heroicons-pause-circle',
      color: 'warning',
    },
    NONACTIVE: {
      title: 'Produk Tidak Aktif',
      description: 'Produk ini dinonaktifkan dan tidak dapat dibeli saat ini.',
      icon: 'i-heroicons-x-circle',
      color: 'error',
    },
    SUSPEND: {
      title: 'Produk Disuspend',
      description: 'Produk ini disuspend karena melanggar ketentuan dan tidak dapat dibeli.',
      icon: 'i-heroicons-shield-exclamation',
      color: 'error',
    },
  }
  return map[product.value?.status ?? ''] ?? {
    title: 'Produk Tidak Tersedia',
    description: 'Produk ini tidak dapat dibeli saat ini.',
    icon: 'i-heroicons-exclamation-circle',
    color: 'neutral',
  }
})

const avgRating = computed(() => {
  const content = reviews.value?.content
  if (!content?.length) return 0
  return content.reduce((sum, r) => sum + r.rating, 0) / content.length
})

const formatDate = (iso: string) => dayjs(iso).format('D MMM YYYY')

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

//Beli sekarang
const buyNow = async() =>{
  try{
    cartStore.addToCart(qty.value,product.value)
    navigateTo("/cart")
    
  }catch(e:any){
    toast.add({
      title: "Terjadi Kesalahan",
      description: e.message,
      color: "error",
      icon: "material-symbols:error-outline"
    })
  }
  
  
}


  
const items = ref([
  {
    label: 'Deskripsi Produk',
    icon: 'majesticons:box',
    slot: 'description' as const
  },
  {
    label: 'Review Pembeli',
    icon: 'i-heroicons-star-20-solid',
    slot: 'review' as const
  }
])


const breadcrumb = computed(() => [
  { label: 'Home', icon: 'i-lucide-home', to: '/' },
  { label: 'Produk', icon: 'i-lucide-box', to: '/category' },
  { label: product.value?.name ?? 'Detail Produk', icon: 'i-lucide-package' },
])

// ✅ Sanitize description sebelum render
const sanitizedDescription = computed(() => {
  if (!product.value?.description) return ''
  
  // Whitelist tag yang aman untuk produk description
  return DOMPurify.sanitize(product.value.description, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 
      'h2', 'h3', 'ul', 'ol', 'li', 
      'blockquote', 'a', 'hr'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  })
})




</script>

<style>
/* Fix spacing TipTap output: <p> nested di <li> */
.prose li > p {
  margin: 0;
}

/* Hide paragraph kosong dari double-enter user */
.prose p:empty {
  display: none;
}
</style>