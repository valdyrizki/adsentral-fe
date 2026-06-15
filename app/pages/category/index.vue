<template>
  <div class="w-full">
    <!-- ===== CATEGORY GRID ===== -->
    <section class="m-1 sm:m-3 border rounded-2xl border-blue-200 bg-gray-100">
      <div class="m-1 sm:m-3">
        <h1 class="text-2xl font-bold mb-6">Kategori</h1>

        <ClientOnly>
          <template #fallback>
            <AppLoadingSkeleton />
          </template>

          <AppLoadingSkeleton v-if="loadingCategories" />

          <UAlert
            v-else-if="!categories || categories.length === 0"
            title="Tidak ada kategori"
            description="Belum ada kategori yang tersedia."
            icon="ix:anomaly-found"
            color="neutral"
          />

          <div
            v-else
            class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-4 mb-8 items-center"
          >
            <UCard
              v-for="cat in categories"
              :key="cat.id"
              :class="[
                'cursor-pointer flex p-0 overflow-hidden relative group transition-all',
                'w-[100px] h-[100px]',
                cat.id === selectedCategoryId
                  ? 'ring-2 ring-primary bg-primary/10'
                  : 'hover:ring-1 hover:ring-primary'
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
        </ClientOnly>
      </div>
    </section>

    <!-- ===== PRODUCTS ===== -->
    <section
      v-if="selectedCategoryId"
      class="m-1 sm:m-3 border rounded-2xl border-blue-200 bg-gray-100"
    >
      <div class="p-4">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">
            Produk di kategori
            <span class="text-primary">{{ selectedCategoryName }}</span>
          </h2>
          <UButton
            icon="i-heroicons-x-mark-20-solid"
            variant="ghost"
            size="sm"
            @click="clearSelection"
          >
            Hapus filter
          </UButton>
        </div>

        <!-- Search & Sort -->
        <div class="flex flex-col md:flex-row md:items-center gap-2 mb-4">
          <UInput
            v-model="search"
            placeholder="Cari produk..."
            icon="i-heroicons-magnifying-glass"
            class="flex-1"
            clearable
            @keyup.enter="handleSearchEnter"
          />
          <USelect
            v-model="sortBy"
            :items="sortOption"
            value-key="value"
            placeholder="Urutkan"
            class="w-full md:w-48"
            @update:model-value="sortHandler"
          />
        </div>

        <!-- States -->
        <ClientOnly>
          <template #fallback>
            <AppLoadingSkeleton />
          </template>

          <AppLoadingSkeleton v-if="loadingProducts" />

          <UAlert
            v-else-if="errorProducts"
            title="Terjadi Kesalahan"
            :description="errorProducts.message"
            icon="icon-park-solid:error"
            color="error"
          />

          <UAlert
            v-else-if="!productsPagination?.content?.length"
            title="Tidak ada produk"
            description="Belum ada produk untuk kategori ini."
            icon="ix:anomaly-found"
            color="neutral"
          />

          <div v-else>
            <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-6 xxl:grid-cols-8 gap-4">
              <div
                v-for="product in productsPagination.content"
                :key="product.id"
                class="relative group border border-transparent hover:border hover:rounded-2xl hover:border-blue-200 p-1 transition-all duration-300 ease-in-out"
              >
                <AppProductItem :product="product" />
              </div>
            </div>

            <div
              v-if="productsPagination.total_pages > 1"
              class="flex justify-center items-center pt-4"
            >
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
    </section>
  </div>
</template>

<script lang="ts" setup>
import { useProductsApi } from '~/composables/api/product'
import { useCategoryApi } from '~/composables/api/category'
import type { PageResponse } from '~/types/PageResponse'
import type { ProductResponse } from '~/types/product/ProductResponse'

definePageMeta({
  layout: 'default'
})

// ===== ROUTE & API =====
const route = useRoute()
const router = useRouter()
const { fetchProductsByCategoryId } = useProductsApi()
const { fetchCategories } = useCategoryApi()

// ===== STATE — initialize dari URL query (shareable URL & restore on refresh) =====
const selectedCategoryId = ref<number | null>(
  route.query.cat ? Number(route.query.cat) : null
)
const page = ref(route.query.page ? Number(route.query.page) - 1 : 0)
const perPageValue = ref(12)
const search = ref<string>((route.query.search as string) ?? '')
const keyword = ref<string>(search.value)
const sortBy = ref<string>((route.query.sort as string) ?? 'terbaru')

const sortOption = [
  { label: 'Terbaru', value: 'terbaru' },
  { label: 'Termurah', value: 'termurah' },
  { label: 'Termahal', value: 'termahal' },
  { label: 'Terlaris', value: 'terlaris' },
  { label: 'Nama', value: 'nama' },
]

// ===== CATEGORIES =====
const { data: categories, pending: loadingCategories } = await useAsyncData(
  'categories-list',
  () => fetchCategories(),
  { server: false }
)

const selectedCategoryName = computed(() => {
  if (!selectedCategoryId.value || !categories.value) return ''
  return categories.value.find(c => c.id === selectedCategoryId.value)?.name ?? ''
})

// ===== PRODUCTS =====
const {
  data: productsPagination,
  pending: loadingProducts,
  error: errorProducts,
  refresh: refreshProducts,
} = await useAsyncData<PageResponse<ProductResponse> | null>(
  () => `products-by-category-${selectedCategoryId.value ?? 'none'}`,
  async () => {
    if (!selectedCategoryId.value) return null

    return await fetchProductsByCategoryId(
      selectedCategoryId.value,
      page.value,
      perPageValue.value,
      keyword.value,
      sortBy.value
    )
  },
  { server: false }
)

// ===== URL SYNC + REFRESH =====
async function syncUrl() {
  await router.push({
    query: {
      cat: selectedCategoryId.value || undefined,
      search: search.value.trim() || undefined,
      page: page.value > 0 ? page.value + 1 : undefined,
      sort: sortBy.value !== 'terbaru' ? sortBy.value : undefined,
    }
  })
  await refreshProducts()
}

// ===== HANDLERS =====
function selectCategory(id: number) {
  if (selectedCategoryId.value === id) {
    clearSelection()
    return
  }

  selectedCategoryId.value = id
  page.value = 0
  search.value = ''
  keyword.value = ''
  syncUrl()
}

function clearSelection() {
  selectedCategoryId.value = null
  page.value = 0
  search.value = ''
  keyword.value = ''
  sortBy.value = 'terbaru'
  syncUrl()
}

function onPageChange(newPage: number) {
  page.value = newPage - 1
  syncUrl()
}

function sortHandler() {
  page.value = 0
  syncUrl()
}

// ===== SEARCH dengan debounce =====
let searchTimeout: ReturnType<typeof setTimeout> | null = null

function updateSearch() {
  page.value = 0
  keyword.value = search.value
  syncUrl()
}

function handleSearchEnter() {
  if (searchTimeout) clearTimeout(searchTimeout)
  updateSearch()
}

watch(search, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(updateSearch, 500)
})
</script>