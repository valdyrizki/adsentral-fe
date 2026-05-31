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
        <div class="text-lg font-semibold">Form Create Product</div>
      </template>
      <div class="">
        
        <div>
          <div class="font-medium">Unggah Foto Produk</div>
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
            <UFileUpload 
              label="Gambar Utama"
              description="SVG, PNG, JPG or GIF (max. 2MB)"
              class="w-96 min-h-48"
              v-model="productRequest.banner"
              @change="bannerValidation()"
               />
            <p v-if="errors.banner" class="mt-1 text-sm text-red-500">{{ errors.banner }}</p>

          </div>

          <div class="font-medium p-4">Foto Tambahan (Opsional)</div>
          <div class="flex gap-4">
            <UFileUpload 
              label="Gambar Utama"
              description="SVG, PNG, JPG or GIF (max. 2MB)"
              class="w-64 min-h-24"
              v-model="productRequest.product_image1" 
              @change="productImageValidation"
            />
            <UFileUpload 
              label="Gambar Utama"
              description="SVG, PNG, JPG or GIF (max. 2MB)"
              class="w-64 min-h-24"
              v-model="productRequest.product_image2"
              @change="productImageValidation" 
            />
            <UFileUpload 
              label="Gambar Utama"
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
                
              </div>
            </div>

            <div class="col-span-2">
              <label for="description" class="block text-sm font-medium text-gray-900">
                Description <span class="text-red-500">*</span>
              </label>
              <div class="mt-1">
                <RichTextEditor
                  v-model="productRequest.description"
                  placeholder="Tulis deskripsi produk yang detail..."
                />
                <p class="mt-2 text-sm text-gray-500">
                  Gunakan format yang jelas: list untuk fitur, heading untuk bagian, dll.
                </p>
                <p v-if="errors.description" class="mt-1 text-sm text-red-500">
                  {{ errors.description }}
                </p>
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
                placeholder="Stock"/>
                <p class="mt-2 text-sm text-gray-500">Kosong = unlimited, 0 = habis, > 0 = jumlah.</p>
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

            <div>
              <label for="delivery_days" class="block text-sm font-medium text-gray-900">Estimasi Pengiriman (Hari) <span class="text-red-500">*</span></label>
              <div class="mt-1">
                <UInputNumber
                  v-model="productRequest.delivery_days"
                  orientation="vertical"
                  name="delivery_days"
                  id="delivery_days"
                  class="block w-full text-base text-gray-900"
                  placeholder="Hari"
                  :min="1"
                />
                <p class="mt-2 text-sm text-gray-500">Estimasi jumlah hari pengiriman ke pembeli.</p>
                <p v-if="errors.delivery_days" class="mt-1 text-sm text-red-500">{{ errors.delivery_days }}</p>
              </div>
            </div>

            <div>
              <label for="guarantee_days" class="block text-sm font-medium text-gray-900">Masa Garansi (Hari)</label>
              <div class="mt-1">
                <UInputNumber
                  v-model="productRequest.guarantee_days"
                  orientation="vertical"
                  name="guarantee_days"
                  id="guarantee_days"
                  class="block w-full text-base text-gray-900"
                  placeholder="Hari"
                  :min="0"
                />
                <p class="mt-2 text-sm text-gray-500">Isi jika produk memiliki garansi. Kosongkan atau isi 0 jika tidak ada garansi.</p>
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
              <UButton :loading="loading" icon="uiw:save" color="primary" variant="solid" size="xl" @click="handleSubmit" >Save Product</UButton>
            </div>
            
          </UForm>
        </div>
          

      </div>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
import RichTextEditor from '~/components/form/RichTextEditor.vue';
import { useProductsApi } from '~/composables/api/product';
import { validateImage } from '~/helper/imageHelper';
import { ProductRequest } from '~/types/product/ProductRequest';

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
  layout: "seller",
  label: "Create Products",
  ssr: false,
  // middleware: ["auth", "seller-only"] // opsional kalau mau validasi role
})

const productRequest = reactive<ProductRequest>(new ProductRequest())
const selectedCategory = ref(0)
const { createProduct } = useProductsApi()

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

  // category_id
  if (productRequest.stock != null && productRequest.stock < 0) {
    errors.stock = 'Stok tidak boleh negatif'
  }

  // delivery_days
  if (productRequest.delivery_days === null || productRequest.delivery_days === undefined) {
    errors.delivery_days = 'Estimasi pengiriman wajib diisi'
  } else if (productRequest.delivery_days < 1) {
    errors.delivery_days = 'Estimasi pengiriman minimal 1 hari'
  }

  // banner
  if (!productRequest.banner) {
    errors.banner = 'Banner produk wajib diisi'
  }

  return Object.keys(errors).length === 0
}
const toast = useToast()
const loading = ref<boolean>(false)
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
    await createProduct(productRequest)
    
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