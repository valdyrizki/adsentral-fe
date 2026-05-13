<template>
  <div class="w-full p-1 mt-4 bg-white">
    <div class="mx-auto w-full md:w-3/4 border rounded-2xl border-blue-200 bg-gray-100">

      <div class="px-4 pt-4">
        <UBreadcrumb :items="breadcrumb" />
      </div>

      <AppHeaderSection
        :title="`Hasil pencarian: &quot;${keyword}&quot;`"
        description="Produk yang sesuai dengan pencarianmu"
        to="/"
        icon="material-symbols:search"
      />

      <USeparator />

      <div class="mx-auto w-full p-4">

        <!-- Sort -->
        <div class="flex justify-end mb-4">
          <USelect
            v-model="sortBy"
            :items="sortOptions"
            placeholder="Urutkan"
            class="w-48"
          />
        </div>

        <div v-if="loading">
          <AppLoadingSkeleton />
        </div>
        <div v-else-if="error">
          <UAlert
            title="Terjadi Kesalahan"
            :description="error"
            icon="icon-park-solid:error"
            color="error"
          />
        </div>
        <div v-else-if="!productPagination?.content?.length">
          <UAlert
            title="Produk tidak ditemukan"
            :description="`Tidak ada produk yang cocok dengan &quot;${keyword}&quot;`"
            icon="ix:anomaly-found"
            color="neutral"
          />
        </div>
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

          <div v-if="productPagination.total_pages > 1" class="flex justify-center mt-8">
            <UPagination
              :page="currentPage"
              :total="productPagination.total_elements"
              :items-per-page="pageSize"
              :sibling-count="1"
              show-edges
              @update:page="onPageChange"
            />
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useProductsApi } from '~/composables/api/product'
import type { PageResponse } from '~/types/PageResponse'
import type { ProductResponse } from '~/types/product/ProductResponse'

const route = useRoute()
const router = useRouter()
const { getProducts } = useProductsApi()

const keyword = computed(() => (route.query.q as string) || '')

const breadcrumb = computed(() => [
  { label: 'Home', icon: 'i-lucide-home', to: '/' },
  { label: `Pencarian: "${keyword.value}"`, icon: 'i-heroicons-magnifying-glass' },
])
const currentPage = ref(1)
const pageSize = 20
const sortBy = ref<string>('terbaru')
const sortOptions = [
  { label: 'Terbaru', value: 'terbaru' },
  { label: 'Termurah', value: 'termurah' },
  { label: 'Termahal', value: 'termahal' },
  { label: 'Terlaris', value: 'terlaris' },
  { label: 'Nama', value: 'nama' },
]

const loading = ref(true)
const error = ref<string | null>(null)
const productPagination = ref<PageResponse<ProductResponse>>()

const fetchProducts = async () => {
  loading.value = true
  error.value = null
  try {
    productPagination.value = await getProducts(currentPage.value - 1, pageSize, keyword.value, sortBy.value)
  } catch (err: any) {
    error.value = err.statusMessage || 'Gagal memuat produk'
  } finally {
    loading.value = false
  }
}

await fetchProducts()

watch(keyword, () => {
  currentPage.value = 1
  fetchProducts()
})

watch(sortBy, () => {
  currentPage.value = 1
  fetchProducts()
})

const onPageChange = (newPage: number) => {
  currentPage.value = newPage
  fetchProducts()
}
</script>
