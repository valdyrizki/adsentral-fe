<template>
  <div class="w-full">
    <div class="m-1 sm:m-3 border rounded-2xl border-blue-200 bg-gray-100">
      <div class="p-4">
        <!-- Header kategori -->
        <div v-if="loadingCategories">
          <AppLoadingSkeleton />
        </div>
        <div v-else-if="currentCategory" class="mb-4">
          <UBreadcrumb :items="breadcrumb" class="mb-3" />
          <h1 class="text-2xl font-bold">
            Kategori: <span class="text-primary">{{ currentCategory.name }}</span>
          </h1>
          <p v-if="currentCategory.description" class="text-gray-600 text-sm mt-1">
            {{ currentCategory.description }}
          </p>
        </div>

        <!-- Category Chips -->
        <div v-if="categories && categories.length > 0" class="mb-4">
          <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              v-for="cat in categories"
              :key="cat.id"
              :class="[
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border',
                cat.id === categoryId
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-primary hover:text-primary'
              ]"
              @click="navigateToCategory(cat.id)"
            >
              <img
                v-if="cat.image_url"
                :src="cat.image_url"
                :alt="cat.name"
                class="w-5 h-5 rounded-full object-cover"
              />
              {{ cat.name }}
            </button>
          </div>
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

        <!-- Product States -->
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
          description="Belum ada produk di kategori ini."
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

          <!-- Pagination -->
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
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useProductsApi } from '~/composables/api/product'
  import type { PageResponse } from '~/types/PageResponse'
  import type { ProductResponse } from '~/types/product/ProductResponse'

definePageMeta({
  layout: 'default'
})

// ===== ROUTE & API =====
const route = useRoute()
const router = useRouter()
const categoryStore = useCategoryStore()
const { fetchProductsByCategoryId } = useProductsApi()

const categoryId = computed(() => Number(route.params.id))

// ===== STATE — initialize dari URL query =====
const page = ref(route.query.page ? Number(route.query.page) - 1 : 0)
const perPageValue = ref(4)
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

if (!categoryId.value || isNaN(categoryId.value)) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Kategori tidak ditemukan',
    fatal: true,
  })
}

// ===== FETCH CATEGORIES =====
const { data: categories, pending: loadingCategories } = await useAsyncData(
  'categories-list',
  async () => {
    await categoryStore.getCategoriesStore()
    return categoryStore.categories
  }
)

const currentCategory = computed(() =>
  categories.value?.find(c => c.id === categoryId.value) ?? null
)

// ===== FETCH PRODUCTS by CATEGORY ID =====
const {
  data: productsPagination,
  pending: loadingProducts,
  error: errorProducts,
  refresh: refreshProducts,
} = await useAsyncData<PageResponse<ProductResponse>>(
  () => `products-by-category-${categoryId.value}`,
  () => fetchProductsByCategoryId(
    categoryId.value,
    page.value,
    perPageValue.value,
    keyword.value,
    sortBy.value
  )
)

// ===== BREADCRUMB =====
const breadcrumb = computed(() => [
  { label: 'Home', icon: 'i-lucide-home', to: '/' },
  { label: 'Kategori', icon: 'i-lucide-grid-3x3', to: '/category' },
  { label: currentCategory.value?.name ?? '', icon: 'i-lucide-folder' },
])

// ===== URL SYNC + REFRESH =====
async function syncUrl() {
  await router.push({
    query: {
      search: search.value.trim() || undefined,
      page: page.value > 0 ? page.value + 1 : undefined,
      sort: sortBy.value !== 'terbaru' ? sortBy.value : undefined,
    }
  })
  await refreshProducts()
}

// ===== HANDLERS =====
function navigateToCategory(id: number) {
  if (id === categoryId.value) return
  router.push(`/category/${id}`)
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

// Reset state when category route changes
watch(categoryId, () => {
  page.value = 0
  search.value = ''
  keyword.value = ''
  sortBy.value = 'terbaru'
  refreshProducts()
})

// ===== SEO =====
useHead(() => ({
  title: currentCategory.value
    ? `${currentCategory.value.name} — Adsentral`
    : 'Kategori — Adsentral',
  meta: [
    {
      name: 'description',
      content: currentCategory.value?.description
        ?? `Belanja produk di kategori ${currentCategory.value?.name ?? ''} di Adsentral`
    }
  ]
}))
</script>
