<template>
  <UCard class="">
    <NuxtLink to="/seller/product">
      <div class="flex items-center gap-2 p-4 border rounded-2xl border-blue-500 hover:bg-blue-50 cursor-pointer w-1/2 md:w-1/5">
        <UIcon name="i-lucide-arrow-left" class="size-5 text-blue-500" />
        <span class="font-medium text-blue-500">Back to Products</span>
      </div>
    </NuxtLink>
    
    
  </UCard>

  <!-- Chart example -->
  <div class="mt-6">
    <UCard>
      <template #header>
        <div class="text-lg font-semibold">Form Edit Product</div>
      </template>
      <div class="">
        
        <div>
          <div class="font-medium">Unggah Jika Perlu Mengubah Foto Produk</div>
          <div>
            <ul class="list-disc list-inside mt-2 text-sm text-gray-600">
              <li class="mb-2">Foto utama produk (1 foto)</li>
              <li class="mb-2">Foto pendukung produk (maksimal 3 foto)</li>
              <li class="mb-2">Format: JPG, JPEG, PNG</li>
              <li class="mb-2">Ukuran maksimal: 5MB per foto dan Resolusi max 5000 piksel</li>
            </ul>
          </div>

          <div>
            <div class="font-medium p-4">Foto Utama <UBadge color="error">WAJIB</UBadge></div>
            <div class="flex gap-4 sm:flex-row flex-col">
              <img 
                v-if="product?.banner_url " 
                :src="getImageUrl(product?.banner_url)" :alt="product.name"
                class="w-64 min-h-48 rounded object-cover border"
              />
              <UFileUpload 
                label="Ubah Gambar Utama"
                description="SVG, PNG, JPG or GIF (max. 2MB)"
                class="w-64 min-h-48"
                v-model="productRequest.banner"
                @change="bannerValidation()"
               />
            <p v-if="errors.banner" class="mt-1 text-sm text-red-500">{{ errors.banner }}</p>
            </div>
          </div>

          <div class="font-medium p-4">Foto Tambahan (Opsional)</div>
          <div class="flex gap-4 sm:flex-row flex-col" v-if="product?.product_image_url[0]">

            <div v-if="product?.product_image_url[0]">
              <div class="text-sm p-1">Foto Tambahan 1</div>
              <img 
                v-if="product?.banner_url " 
                :src="getImageUrl(product?.product_image_url[0])" :alt="product.name"
                class="w-64 min-h-24 rounded object-cover border"
              />
            </div>
            <div v-if="product?.product_image_url[1]">
              <div class="text-sm p-1">Foto Tambahan 2</div>
              <img 
                v-if="product?.banner_url " 
                :src="getImageUrl(product?.product_image_url[1])" :alt="product.name"
                class="w-64 min-h-24 rounded object-cover border"
              />
            </div>
            <div v-if="product?.product_image_url[2]">
              <div class="text-sm p-1">Foto Tambahan 3</div>
              <img 
                v-if="product?.banner_url " 
                :src="getImageUrl(product?.product_image_url[2])" :alt="product.name"
                class="w-64 min-h-24 rounded object-cover border"
              />
            </div>
          </div>
          <div class="mt-4 flex gap-4">
            <UFileUpload 
              label="Ubah Foto Tambahan 1"
              description="SVG, PNG, JPG or GIF (max. 2MB)"
              class="w-64 min-h-24"
              v-model="productRequest.product_image1" 
              @change="productImageValidation"
            />
            <UFileUpload 
              label="Ubah Foto Tambahan 2"
              description="SVG, PNG, JPG or GIF (max. 2MB)"
              class="w-64 min-h-24"
              v-model="productRequest.product_image2"
              @change="productImageValidation" 
            />
            <UFileUpload 
              label="Ubah Foto Tambahan 3"
              v-model="productRequest.product_image3"
              description="SVG, PNG, JPG or GIF (max. 2MB)"
              class="w-64 min-h-24"
              @change="productImageValidation" 
              />
          </div>
          
        </div>

        <USeparator class="py-4"/>

        <div>
          <div class="font-medium mb-4">Detail Produk</div>
          <UForm class="space-y-4 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2" :errors="errors">
            <div>
              <label for="product_name" class="block text-sm font-medium text-gray-900">Nama Produk <span class="text-red-500">*</span></label>
              <div class="mt-1">
                <UInput
                  name="product_name"
                  id="product_name"
                  class="block w-full text-base text-gray-900"
                  placeholder="Nama Produk"
                  label="Nama Produk"
                  label-for="product_name"
                  v-model="productRequest.name"
                  error="Terjadi Kesalahan"
                />
                <p class="mt-2 text-sm text-gray-500">Masukkan nama produk yang jelas dan deskriptif.</p>
                <p v-if="errors.name" class="mt-1 text-sm text-red-500">{{ errors.name }}</p>
              </div>
            </div>

            <div>
              <label for="slug" class="block text-sm font-medium text-gray-900">Slug <span class="text-red-500">*</span></label>
              <div class="mt-1">
                <UInput
                  v-model="productRequest.slug"
                  label="Slug"
                  id="slug"
                  name="slug"
                  class="block w-full text-base text-gray-900"
                  error="Terjadi Kesalahan"
                  disabled
                />             
                <p class="mt-2 text-sm text-gray-500">Otomatis dihasilkan dari nama produk.</p>
                <p v-if="errors.slug" class="mt-1 text-sm text-red-500">{{ errors.slug }}</p>
              </div>
            </div>

            <div>
              <label for="sell_price" class="block text-sm font-medium text-gray-900">Harga Jual <span class="text-red-500">*</span></label>
              <div class="mt-1">
                <UInputCurrency
                  v-model="productRequest.sell_price"
                  label="Harga Jual"
                  id="sell_price"
                  name="sell_price"
                  class="block w-full text-base text-gray-900"
                  @change="handleChange"
                />             
                <p class="mt-2 text-sm text-gray-500">Masukan Harga Jual</p>
                <p v-if="errors.sell_price" class="mt-1 text-sm text-red-500">{{ errors.sell_price }}</p>

                <div v-if="productRequest.sell_price > 0" class="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs space-y-1">
                  <div class="flex justify-between text-gray-600">
                    <span>Harga Jual</span>
                    <span class="font-medium text-gray-800">Rp {{ productRequest.sell_price.toLocaleString('id-ID') }}</span>
                  </div>
                  <div class="flex justify-between text-gray-600">
                    <span>Biaya Admin ({{ trxFeePercent }}%)</span>
                    <span class="font-medium text-red-500">- Rp {{ adminFeeAmount.toLocaleString('id-ID') }}</span>
                  </div>
                  <div class="flex justify-between border-t border-blue-200 pt-1 font-semibold text-blue-700">
                    <span>Estimasi Pendapatan Diterima</span>
                    <span>Rp {{ estimatedIncome.toLocaleString('id-ID') }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-span-2">
              <label for="description" class="block text-sm font-medium text-gray-900">Description <span class="text-red-500">*</span></label>
              <div class="mt-1">
                <UTextarea
                  name="description"
                  id="description"
                  class="block w-full text-base text-gray-900"
                  placeholder="Description"
                  label="Description"
                  label-for="description"
                  v-model="productRequest.description"
                />                
                <p class="mt-2 text-sm text-gray-500">Masukkan deskripsi produk yang jelas dan deskriptif.</p>
              </div>
            </div>

            <div>
              <label for="stock" class="block text-sm font-medium text-gray-900">Stock <span class="text-red-500">*</span></label>
              <div class="mt-1">
                <UInputNumber
                v-model="productRequest.stock"
                orientation="vertical"
                name="stock" id="stock"
                class="block w-full text-base text-gray-900"
                placeholder="Stock"
                :min="0"/>
                <p class="mt-2 text-sm text-gray-500">Wajib diisi. 0 = stok habis, lebih dari 0 = jumlah stok tersedia.</p>
                <p v-if="errors.stock" class="mt-1 text-sm text-red-500">{{ errors.stock }}</p>
              </div>
            </div>

            <div>
              <label for="category_id" class="block text-sm font-medium text-gray-900">Category<span class="text-red-500">*</span></label>
              <div class="mt-1">
                <USelect
                  name="category_id"
                  id="category_id"
                  class="block w-full text-base text-gray-900"
                  placeholder="Category"
                  label="Category"
                  label-for="category_id"
                  v-model="productRequest.category_id"
                  :items="categoryItemsSelect"
                  @change="handleCategoryChange"
                />
                <p class="mt-2 text-sm text-gray-500">Masukkan nama produk yang jelas dan deskriptif.</p>
                <p v-if="errors.category_id" class="mt-1 text-sm text-red-500">{{ errors.category_id }}</p>
              </div>
            </div>

              <!-- Distributor -->
            <div>
              <label for="distributor" class="block text-sm font-medium text-gray-900">
                Distributor
              </label>
              <div class="mt-1">
                <UInput
                  name="distributor"
                  id="distributor"
                  class="block w-full text-base text-gray-900"
                  placeholder="Nama Distributor"
                  v-model="productRequest.distributor"
                />
                <p class="mt-2 text-sm text-gray-500">Masukkan nama distributor (Opsional).</p>
              </div>
            </div>

            <div class="mx-auto col-span-2">
              <UButton icon="uiw:edit" color="primary" variant="solid" size="xl" @click="handleSubmit" >Edit Product</UButton>
            </div>
            
          </UForm>
        </div>
          

      </div>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
import { useProductsApi } from '~/composables/api/product';
import { useSystemSettingApi } from '~/composables/api/system-setting';
import { validateImage } from '~/helper/imageHelper';
import { ProductRequest } from '~/types/product/ProductRequest';
import type { ProductResponse } from '~/types/product/ProductResponse';
import type { SystemSettingResponse } from '~/types/system-setting/SystemSettingResponse';

/* Validasi images
    1. tidak boleh menggunakan gambar yang sama
    2. max 5MB/image
    3. size lebih kecil dari 1024x768px
  */
const bannerValidation = async() =>{
  if (!productRequest.banner) return

  try {
    await validateImage(productRequest.banner)
  } catch (err: any) {
    productRequest.banner = null
    alert(err)
  }
}

const productImageValidation  = async() =>{
  if(productRequest.product_image1 != null){
    try {
      await validateImage(productRequest.product_image1)
    } catch (err: any) {
      productRequest.product_image1 = null
      alert(err)
    }
  }

  if(productRequest.product_image2 != null){
    try {
      await validateImage(productRequest.product_image2)
    } catch (err: any) {
      productRequest.product_image2 = null
      alert(err)
    }
  }

  if(productRequest.product_image3 != null){
    try {
    await validateImage(productRequest.product_image3)
    } catch (err: any) {
      productRequest.product_image3 = null
      alert(err)
    }
  }
}


definePageMeta({
  layout: "admin",
  label: "Edit Products",
  ssr: false,
  // middleware: ["auth", "seller-only"] // opsional kalau mau validasi role
})

const productRequest = reactive<ProductRequest>(new ProductRequest())
const selectedCategory = ref(0)

// ===== TRX_FEE (biaya admin transaksi, untuk estimasi pendapatan diterima) =====
const { fetchPublicSystemSetting } = useSystemSettingApi()

const { data: publicSystemSettings } = await useAsyncData<SystemSettingResponse[]>(
  'public-system-settings-admin-product-edit',
  async () => (await fetchPublicSystemSetting()) ?? [],
  { server: false }
)

const trxFeePercent = computed(() => {
  const setting = (publicSystemSettings.value ?? []).find(s => s.key === 'TRX_FEE')
  const parsed = Number(setting?.value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 5
})

const adminFeeAmount = computed(() => Math.round((productRequest.sell_price || 0) * trxFeePercent.value / 100))
const estimatedIncome = computed(() => Math.max(0, (productRequest.sell_price || 0) - adminFeeAmount.value))

// Ambil API function
const { updateProduct,fetchMyProductById } = useProductsApi()

//ambil route param
const route = useRoute() 

// Store for categories
const categoryStore  = useCategoryStore()
categoryStore.getCategoriesStore();
const { categoryItemsSelect } = storeToRefs(categoryStore)

// Pagination options
const perPageitems = ref([5, 10, 25, 50])
const perPageValue = ref(5)
const search = ref('')

const handleCategoryChange = () => {
  console.log(selectedCategory)
}

const handleChange = () => {
  console.log(productRequest)
}

const errors = reactive<Record<string, string>>({})
const validateProduct = (): boolean => {
  Object.keys(errors).forEach(key => delete errors[key])

  // name
  if (!productRequest.name.trim()) {
    errors.name = 'Nama produk tidak boleh kosong'
  } else if (productRequest.name.length > 255) {
    errors.name = 'Nama produk maksimal 255 karakter'
  }

  // slug
  if (!productRequest.slug.trim()) {
    errors.slug = 'Slug tidak boleh kosong'
  } else if (productRequest.slug.length > 255) {
    errors.slug = 'Slug maksimal 255 karakter'
  }

  // description
  if (!productRequest.description.trim()) {
    errors.description = 'Deskripsi produk wajib diisi'
  }

  // sell_price
  if (productRequest.sell_price === null || productRequest.sell_price === undefined) {
    errors.sell_price = 'Harga jual wajib diisi'
  } else if (Number(productRequest.sell_price) < 1000) {
    errors.sell_price = 'Harga jual minimal Rp.1.000'
  }

  // category_id
  if (!productRequest.category_id || productRequest.category_id <= 0) {
    errors.category_id = 'Kategori wajib dipilih'
  }

  // stock
  if (productRequest.stock === null || productRequest.stock === undefined) {
    errors.stock = 'Stok wajib diisi'
  } else if (productRequest.stock < 0) {
    errors.stock = 'Stok tidak boleh negatif'
  }

  // banner
  // if (!productRequest.banner) {
  //   errors.banner = 'Banner produk wajib diisi'
  // }

  return Object.keys(errors).length === 0
}


// Reactive state
const toast = useToast()
const loading = ref<boolean>(true)
const error = ref<string | null | any >(null)
const product = ref<ProductResponse>()

  // fungsi Fetch data di server-side (Nuxt auto-handle hydration)
  try {
    loading.value = true
    product.value = await fetchMyProductById(route.params.id as string) // page=0, size=10
  } catch (err: any) {
    error.value = err.statusMessage || 'Failed to load products'
  } finally {
    loading.value = false
    console.log(product.value);

    if(product.value){
      productRequest.id = product.value.id
      productRequest.name = product.value.name
      productRequest.slug = product.value.slug
      productRequest.description = product.value.description
      productRequest.base_price = product.value.base_price
      productRequest.sell_price = product.value.sell_price
      productRequest.stock = product.value.stock
      productRequest.distributor = product.value.distributor
      productRequest.category_id = product.value.category_id
    }
    
    



  }

const handleSubmit = async () =>{
  console.log(productRequest);

  //validasi
  productImageValidation()
  bannerValidation()

  if (!validateProduct()) {
    return
  }

  // ✅ Submit ke backend (nanti pakai FormData) versi create merchant 
  try { 
    loading.value = true
    await updateProduct(productRequest)
    
    toast.add({
      title: "Berhasil membuat product ✅",
      description: "Anda akan diarahkan ke menu list product.",
      color: "success"
    })

    navigateTo("/seller/product")
    
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


//Auto isi input slug
watch(
  () => productRequest.name,
  (newName) => {
    if (!newName) {
      productRequest.slug = ''
      return
    }

    productRequest.slug = slugify(newName)
  }
)


</script>

<style>

</style>