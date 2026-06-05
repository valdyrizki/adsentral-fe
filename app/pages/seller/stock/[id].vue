<template>
  <UCard>
    <NuxtLink to="/seller/stock">
      <div class="flex items-center gap-2 p-4 border rounded-2xl border-blue-500 hover:bg-blue-50 cursor-pointer w-1/2 md:w-1/5">
        <UIcon name="i-lucide-arrow-left" class="size-5 text-blue-500" />
        <span class="font-medium text-blue-500">Kembali ke Stok</span>
      </div>
    </NuxtLink>
  </UCard>

  <div class="mt-6">

    <AppLoadingSkeleton v-if="productLoading" />

    <UCard v-else-if="productError || !product">
      <div class="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <UIcon name="i-lucide-package-x" class="size-16 text-gray-400" />
        <div class="text-xl font-semibold text-gray-700">Produk Tidak Ditemukan</div>
        <NuxtLink to="/seller/stock">
          <UButton icon="i-lucide-arrow-left" variant="outline" color="primary">Kembali</UButton>
        </NuxtLink>
      </div>
    </UCard>

    <template v-else>

      <!-- Info Produk -->
      <UCard class="mb-6 shadow-sm">
        <div class="flex items-center gap-4">
          <img
            :src="config.public.backendUrl + '/' + product.banner_url"
            :alt="product.name"
            class="w-16 h-16 rounded-xl object-cover border border-gray-100 bg-gray-50 flex-none"
          />
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-gray-800 truncate">{{ product.name }}</p>
            <div class="flex flex-wrap items-center gap-2 mt-1.5">
              <UBadge color="primary" variant="soft" size="sm">
                <UIcon name="i-lucide-file-check" class="mr-1" />
                Stok File
              </UBadge>
              <span class="text-sm text-gray-500">
                Stok tersedia:
                <span class="font-semibold text-gray-800">{{ product.stock ?? 0 }}</span>
              </span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Form Tambah Stok -->
      <UCard class="mb-6 shadow-sm">
        <template #header>
          <p class="font-semibold text-gray-800">Tambah Stok</p>
        </template>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-900 mb-1">
              Deskripsi
              <span class="text-gray-400 font-normal">(opsional)</span>
            </label>
            <UInput
              v-model="form.description"
              placeholder="Contoh: Serial key batch 001, Akun #1, dll."
              class="w-full"
              :disabled="uploading"
            />
            <p class="mt-1 text-xs text-gray-400">Catatan internal untuk membedakan stok file.</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-900 mb-1">
              File
              <span class="text-gray-400 font-normal">(opsional)</span>
            </label>
            <UFileUpload
              v-model="form.file"
              label="Pilih File"
              description="Semua tipe file didukung"
              class="w-full"
              :disabled="uploading"
            />
          </div>

          <p v-if="formError" class="text-sm text-red-500">{{ formError }}</p>

          <div class="flex justify-end">
            <UButton
              icon="i-lucide-plus"
              color="primary"
              :loading="uploading"
              :disabled="!canSubmit"
              @click="handleAdd"
            >
              Tambah Stok
            </UButton>
          </div>
        </div>
      </UCard>

    </template>
  </div>
</template>

<script lang="ts" setup>
import { useProductsApi } from '~/composables/api/product'
import type { ProductResponse } from '~/types/product/ProductResponse'

definePageMeta({ layout: 'seller', label: 'Tambah Stok', ssr: false })

const config = useRuntimeConfig()
const route = useRoute()
const toast = useToast()
const { fetchMyProductById, addProductStockItem } = useProductsApi()

const productId = computed(() => Number(route.params.id))

const form = reactive<{ description: string; file: File | null }>({ description: '', file: null })
const formError = ref('')
const uploading = ref(false)
const canSubmit = computed(() => !!form.file || form.description.trim().length > 0)

const {
  data: product,
  pending: productLoading,
  error: productError,
} = await useAsyncData<ProductResponse | null>(
  `seller-stock-product-${route.params.id}`,
  async () => { try { return await fetchMyProductById(route.params.id as string) } catch { return null } },
  { server: false }
)

async function handleAdd() {
  formError.value = ''
  if (!form.file && !form.description.trim()) {
    formError.value = 'Isi deskripsi atau pilih file'
    return
  }
  uploading.value = true
  try {
    await addProductStockItem(productId.value, form.description, form.file!)
    toast.add({ title: 'Stok Ditambahkan ✅', description: 'Berhasil ditambahkan ke stok produk.', color: 'success' })
    form.description = ''
    form.file = null
  } catch (err: any) {
    toast.add({ title: 'Gagal ❌', description: err.statusMessage || err.message, color: 'error' })
  } finally {
    uploading.value = false
  }
}
</script>
