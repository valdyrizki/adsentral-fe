<template>
  <div class="space-y-6">

    <!-- Filters -->
    <UCard class="shadow-sm">
      <div class="flex flex-col sm:flex-row gap-3">
        <UInput
          v-model="search"
          icon="i-heroicons-magnifying-glass"
          placeholder="Cari produk..."
          class="flex-1"
          clearable
          @keyup.enter="handleSearchEnter"
        />
        <USelect v-model="perPageValue" :items="perPageItems" class="w-full sm:w-24" />
        <UButton to="/seller/product/create" icon="uiw:plus" color="primary">
          Buat Produk
        </UButton>
        <UButton icon="mdi:refresh" color="neutral" variant="outline" :loading="loading" @click="refresh()">
          Refresh
        </UButton>
      </div>
    </UCard>

    <!-- List -->
    <UCard class="shadow-sm">
      <template #header>
        <p class="font-semibold text-gray-800">
          Produk Saya
          <span v-if="productPagination?.total_elements" class="text-xs text-gray-400 font-normal ml-2">
            ({{ productPagination.total_elements }} total)
          </span>
        </p>
      </template>

      <AppLoadingSkeleton v-if="loading" />

      <UAlert
        v-else-if="error"
        title="Terjadi Kesalahan"
        :description="error.message"
        icon="icon-park-solid:error"
        color="error"
      />

      <div v-else-if="!productPagination?.content?.length" class="py-10 text-center text-gray-400 text-sm">
        <UIcon name="i-heroicons-inbox" class="text-4xl text-gray-300 mb-3" />
        <p>Produk tidak ditemukan.</p>
      </div>

      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="product in productPagination.content"
          :key="product.id"
          class="flex flex-row gap-4 py-4 px-2 hover:bg-gray-50 rounded-xl transition-colors"
        >
          <!-- Banner -->
          <div class="flex-none">
            <img
              :src="config.public.backendUrl + '/' + product.banner_url"
              :alt="product.name"
              class="w-20 h-20 rounded-xl object-cover border border-gray-100 bg-gray-50"
            />
          </div>

          <!-- Info -->
          <div class="flex-grow flex flex-col min-w-0">
            <div class="flex flex-wrap gap-1.5 items-center mb-1">
              <UBadge :color="statusColor(product.status)" :label="statusLabel(product.status)" size="sm" variant="solid" />
              <span class="text-xs font-mono text-gray-400">#{{ product.id }}</span>
            </div>
            <p class="text-sm font-semibold text-gray-800 truncate">{{ product.name }}</p>

            <div class="mt-auto flex flex-wrap gap-3 pt-3 text-xs text-gray-400">
              <span class="flex items-center gap-1">
                <UIcon name="fa6-solid:rupiah-sign" />
                <span class="font-semibold text-gray-700">{{ product.sell_price.toLocaleString('id-ID') }}</span>
              </span>
              <span class="flex items-center gap-1">
                <UIcon name="mdi:package-variant" />
                Stok: {{ product.stock }}
              </span>
              <span class="flex items-center gap-1">
                <UIcon name="mdi:cart" />
                {{ product.sold }} Terjual
              </span>
              <span class="flex items-center gap-1">
                <UIcon name="mdi:calendar" />
                {{ dayjs(product.created_at).format('DD MMM YYYY, HH:mm') }}
              </span>
            </div>

            <!-- Keterangan REVIEW -->
            <p v-if="product.status === 'REVIEW'" class="text-xs text-blue-400 mt-1">
              Menunggu persetujuan admin.
            </p>
            <!-- Keterangan NONACTIVE -->
            <p v-else-if="product.status === 'NONACTIVE'" class="text-xs text-red-400 mt-1">
              Produk ditolak / dinonaktifkan admin. Hubungi admin untuk mengajukan banding.
            </p>
            <!-- Keterangan INACTIVE -->
            <p v-else-if="product.status === 'INACTIVE'" class="text-xs text-amber-500 mt-1">
              Produk ditangguhkan oleh Anda.
            </p>
            <!-- Keterangan SUSPEND -->
            <p v-else-if="product.status === 'SUSPEND'" class="text-xs text-gray-500 mt-1">
              Produk disuspend karena melanggar ketentuan.
            </p>
          </div>

          <!-- Actions -->
          <div class="ml-auto flex-none flex flex-col gap-2 items-end justify-start">
            <UButton
              :to="`/seller/product/edit/${product.id}`"
              icon="mdi:edit"
              size="xs"
              color="primary"
              variant="outline"
            >
              Edit
            </UButton>

            <UButton
              v-if="product.status === 'ACTIVE'"
              icon="mdi:pause-circle"
              size="xs"
              color="error"
              variant="soft"
              :loading="loadingId === product.id"
              @click="deactivateHandler(product.id)"
            >
              Tangguhkan
            </UButton>

            <UButton
              v-if="product.status === 'INACTIVE'"
              icon="mdi:play-circle"
              size="xs"
              color="success"
              variant="soft"
              :loading="loadingId === product.id"
              @click="activateHandler(product.id)"
            >
              Aktifkan
            </UButton>

            <UButton
              v-if="product.status === 'NONACTIVE' || product.status === 'SUSPEND'"
              :to="buildWaLink(product)"
              target="_blank"
              icon="i-heroicons-chat-bubble-left-ellipsis"
              size="xs"
              color="success"
              variant="solid"
            >
              Ajukan Banding
            </UButton>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="productPagination && productPagination.total_pages > 1 && !loading"
        class="flex justify-center items-center pt-4"
      >
        <UPagination
          :page="page + 1"
          :total="productPagination.total_elements"
          :items-per-page="perPageValue"
          :sibling-count="1"
          show-edges
          @update:page="onPageChange"
        />
      </div>
    </UCard>

  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import { useProductsApi } from '~/composables/api/product'
import type { PageResponse } from '~/types/PageResponse'
import type { ProductResponse } from '~/types/product/ProductResponse'

definePageMeta({ layout: 'seller', label: 'Products' })

const config = useRuntimeConfig()
const toast = useToast()
const systemSettingStore = useSystemSettingStore()
const { fetchMyProduct, deactivateProduct, activateProduct } = useProductsApi()

// ===== FILTER STATE =====
const page = ref(0)
const perPageValue = ref(10)
const perPageItems = [5, 10, 25, 50]
const search = ref('')
const keyword = ref('')
const loadingId = ref<number | null>(null)

let searchTimeout: ReturnType<typeof setTimeout> | null = null

// ===== FETCH =====
const {
  data: productPagination,
  pending: loading,
  error,
  refresh,
} = await useAsyncData<PageResponse<ProductResponse>>(
  () => `seller-my-products-${page.value}-${perPageValue.value}-${keyword.value}`,
  () => fetchMyProduct(page.value, perPageValue.value, keyword.value),
  { watch: [page, perPageValue], server: false }
)

watch(search, (val) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    keyword.value = val
    page.value = 0
    refresh()
  }, 500)
})

function handleSearchEnter() {
  if (searchTimeout) clearTimeout(searchTimeout)
  keyword.value = search.value
  page.value = 0
  refresh()
}

function onPageChange(newPage: number) {
  page.value = newPage - 1
}

// ===== HELPERS =====
type BadgeColor = 'error' | 'primary' | 'secondary' | 'tertiary' | 'info' | 'success' | 'warning' | 'neutral'

const statusColor = (status: string): BadgeColor => {
  const map: Record<string, BadgeColor> = {
    REVIEW: 'info',
    ACTIVE: 'success',
    INACTIVE: 'warning',
    NONACTIVE: 'error',
    SUSPEND: 'neutral',
  }
  return map[status] ?? 'neutral'
}

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    REVIEW: 'Menunggu Review',
    ACTIVE: 'Aktif',
    INACTIVE: 'Ditangguhkan',
    NONACTIVE: 'Nonaktif',
    SUSPEND: 'Suspend',
  }
  return map[status] ?? status
}

function buildWaLink(product: ProductResponse) {
  const number = systemSettingStore.systemSettings.find(s => s.key === 'WA_NUMBER')?.value
  if (!number) return undefined 
  const msg = `Halo admin, saya ingin mengajukan banding untuk produk *${product.name}* (ID: #${product.id}) yang statusnya NONACTIVE. Mohon ditinjau kembali.`
  return `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
}

// ===== ACTIONS =====
async function deactivateHandler(id: number) {
  loadingId.value = id
  try {
    await deactivateProduct(id)
    await refresh()
    toast.add({ title: 'Berhasil ✅', description: 'Produk telah ditangguhkan.', color: 'success' })
  } catch (err: any) {
    toast.add({ title: 'Gagal ❌', description: err.statusMessage || err.message, color: 'error' })
  } finally {
    loadingId.value = null
  }
}

async function activateHandler(id: number) {
  loadingId.value = id
  try {
    await activateProduct(id)
    await refresh()
    toast.add({ title: 'Berhasil ✅', description: 'Produk telah diaktifkan.', color: 'success' })
  } catch (err: any) {
    toast.add({ title: 'Gagal ❌', description: err.statusMessage || err.message, color: 'error' })
  } finally {
    loadingId.value = null
  }
}
</script>
