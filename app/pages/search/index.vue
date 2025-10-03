<template>
  <div class="w-full p-1 mt-4 bg-white">
    <div class="mx-auto w-full border rounded-2xl border-blue-200 bg-gray-100">

      <div>
        <!-- PRODUCT LIST -->
        <div class="mx-auto w-full p-4">

          <!-- FILTER & SORT UI -->
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div class="flex gap-2 items-center">
              <label class="font-semibold">Urutkan:</label>
              <select v-model="selectedSort" class="border rounded px-2 py-1">
                <option value="terlaris">Terlaris</option>
                <option value="terbaru">Terbaru</option>
                <option value="harga-terendah">Harga Terendah</option>
                <option value="harga-tertinggi">Harga Tertinggi</option>
              </select>
            </div>
            <div class="flex gap-2 items-center">
              <label class="font-semibold">Harga:</label>
              <input v-model="minPrice" type="number" placeholder="Min" class="border rounded px-2 py-1 w-20" />
              <span>-</span>
              <input v-model="maxPrice" type="number" placeholder="Max" class="border rounded px-2 py-1 w-20" />
              <button class="bg-blue-500 text-white px-3 py-1 rounded">Terapkan</button>
            </div>
          </div>

          <!-- PRODUCT LIST DUMMY -->
          <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-6 xxl:grid-cols-8 gap-4">
            <div
              v-for="product in productStore.products"
              :key="product.id"
              class="relative group border border-transparent hover:border hover:rounded-2xl hover:border-blue-200 p-1 transition-all duration-300 ease-in-out"
            >
              <div class="relative aspect-square w-full overflow-hidden rounded-lg">
                <img
                  :src="product.banner_url"
                  :alt="product.name"
                  class="size-full object-cover hover:scale-115 block transition"
                />
              </div>
              <div class="flex justify-between">
                <div class="basis-1/3"></div>
                <div></div>
                <div class="basis-1/2 sm:basis-1/3">
                  <div class="relative font-semibol bg-primary rounded-l-full -mt-4">
                    <p class="text-white text-sm p-1 text-center">
                      {{ product.sell_price }}
                    </p>
                  </div>
                </div>
              </div>
              <div class="relative mt-4">
                <h3 class="text-sm font-medium text-gray-900">
                  {{ product.name }}
                </h3>
                <div
                  class="transition-all duration-300 ease-in-out md:max-h-0 max-h-12 md:opacity-0 opacity-100 md:overflow-hidden group-hover:max-h-12 group-hover:opacity-100"
                >
                  <div class="flex items-center space-x-2 mt-2">
                    <UAvatar
                      size="sm"
                      :src="`https://i.pravatar.cc/100?u=${product.id}`"
                    />
                    <span class="text-xs text-gray-600">{{ product.merchant_name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- PAGINATION UI -->
          <div class="flex justify-center items-center gap-2 mt-8">
            <UButton 
              class="px-3 py-1 rounded border border-blue-500" 
              :disabled="productStore.page === 1" 
              :color="productStore.page === 1 ? 'primary' : 'neutral'"
              :variant="productStore.page === 1 ? 'solid' : 'outline'"
              @click="currentPage--">&lt;
            </UButton>
            <span v-for="page in productStore.totalPages" :key="page">
              <UButton
                size="xl"
                :color="page === productStore.page ? 'primary' : 'neutral'"
                :variant="page === productStore.page ? 'solid' : 'outline'"
                class="px-3 py-1 rounded border border-blue-500"
                @click="currentPage = page"
              >
                {{ page }}
              </UButton>
            </span>
            <UButton 
            class="px-3 py-1 rounded border border-blue-500" 
            :disabled="currentPage === productStore.totalPages" 
            :color="currentPage === productStore.totalPages ? 'primary' : 'neutral'"
            :variant="currentPage === productStore.totalPages ? 'solid' : 'outline'"
            @click="currentPage++">&gt;</UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
  const productStore  = useProductStore()
  productStore.fetchProducts();

  const selectedSort = ref(null)
  const minPrice = ref(null)
  const maxPrice = ref(null)
  const currentPage = ref()
  
</script>