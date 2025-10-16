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
        class="w-96 min-h-48" />
          </div>

          <div class="font-medium p-4">Foto Tambahan</div>
          <div class="flex gap-4">
            <UFileUpload 
        label="Gambar Utama"
        description="SVG, PNG, JPG or GIF (max. 2MB)"
        class="w-64 min-h-24" />
        <UFileUpload 
        label="Gambar Utama"
        description="SVG, PNG, JPG or GIF (max. 2MB)"
        class="w-64 min-h-24" />
        <UFileUpload 
        label="Gambar Utama"
        description="SVG, PNG, JPG or GIF (max. 2MB)"
        class="w-64 min-h-24" />
          </div>
          
        </div>

        <USeparator class="py-4"/>

        <div>
          <div class="font-medium mb-4">Detail Produk</div>
          <form class="space-y-4 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
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
                />
                <p class="mt-2 text-sm text-gray-500">Masukkan nama produk yang jelas dan deskriptif.</p>
              </div>
            </div>

            <div>
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
              <label for="sell_price" class="block text-sm font-medium text-gray-900">Harga Jual <span class="text-red-500">*</span></label>
              <div class="mt-1">
                <UInputCurrency
                  v-model="productRequest.sell_price"
                  label="Harga Dasar"
                  id="base_price"
                  name="base_price"
                  class="block w-full text-base text-gray-900"
                  @change="handleChange"
                />             
                <p class="mt-2 text-sm text-gray-500">Masukan Harga Jual</p>
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
                  v-model="selectedCategory"
                  :items="categoryStore.categoryItemsSelect"
                  @change="handleCategoryChange"
                />
                <p class="mt-2 text-sm text-gray-500">Masukkan nama produk yang jelas dan deskriptif.</p>
              </div>
            </div>

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
                />
                <p class="mt-2 text-sm text-gray-500">Masukkan nama produk yang jelas dan deskriptif.</p>
              </div>
            </div>


          </form>
        </div>
          

      </div>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
import { ProductRequest } from '~/types/product/ProductRequest'

definePageMeta({
  layout: "dashboard",
  label: "Create Products",
  // middleware: ["auth", "seller-only"] // opsional kalau mau validasi role
})

const productRequest = reactive<ProductRequest>(new ProductRequest())
const selectedCategory = ref(null)

console.log(categoryStore.categoryItemsSelect);

const perPageitems = ref([5, 10, 25, 50])
const perPageValue = ref(5)
const search = ref('')

const handleCategoryChange = () => {
  console.log(selectedCategory)
}

const handleChange = () => {
  console.log(productRequest)
}
//category
  const categoryStore  = useCategoryStore()
  categoryStore.getCategoriesStore();

</script>

<style>

</style>