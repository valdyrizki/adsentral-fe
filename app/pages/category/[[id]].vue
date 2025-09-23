<template>
  <div class="w-full">
    <div class="m-1 sm:m-3 border rounded-2xl border-blue-200 bg-gray-100">
      <div class="m-1 sm:m-3">

        <h1 class="text-2xl font-bold mb-6 ">CATEGORY</h1>
        
        <div v-if="categoryStore.loading">
          <AppLoadingSkeleton/>
        </div>
        
        <div v-else class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-4 mb-8 items-center">
          <UCard
            v-for="cat in categoryStore.categories"
            :key="cat.id"
            :class="[
              'cursor-pointer flex p-0 overflow-hidden relative group transition-all',
              'w-[100px] h-[100px]',
              cat.id === selectedCategoryId ? 'ring-2 ring-primary bg-primary/10' : 'hover:ring-1 hover:ring-primary'
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
      </div>
    </div>

    <div v-if="selectedCategoryId" class="m-1 sm:m-3 border rounded-2xl border-blue-200 bg-gray-100">
      <div class="m-1 sm:m-3">
        <div>
          <!-- PRODUCT LIST -->
          <div class="mx-auto w-full p-4">

            <div v-if="productStore.loading">
                <AppLoadingSkeleton/>
            </div>
            <div v-else-if="productStore.error">
              <UAlert
                title="Terjadi Kesalahan"
                description="Maaf, terjadi error di server kami saat memanggil list produk."
                icon="icon-park-solid:error"
                color="error"
              />

            </div>
            <div v-else>
              <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-6 xxl:grid-cols-8 gap-4">
              <div
                v-for="product in productStore.products.content"
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

                <!-- UnderImage -->
                <div class="flex justify-between">
                  <div class="basis-1/3">
                    
                  </div>
                  <div></div>
                  <div class="basis-1/2 sm:basis-1/3">
                    <div class="relative font-semibol bg-primary rounded-l-full -mt-4">
                      <p class="text-white text-sm p-1 text-center">
                        {{ product.sell_price }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Product Info -->
                <div class="relative mt-4">
                  <h3 class="text-sm font-medium text-gray-900">
                    {{ product.name }}
                  </h3>

                  <!-- Avatar container with slide-down -->
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
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const categoryStore  = useCategoryStore()
const productStore = useProductStore();
const route = useRoute()
const selectedCategoryId : Ref<number | undefined> = ref(route.params.id as number | undefined)

categoryStore.fetchCategories();

function selectCategory(id: number) {
  selectedCategoryId.value = id
  productStore.getProductByCategoryId(id)
}

//on setup
if (selectedCategoryId.value) {
  selectCategory(selectedCategoryId.value);
}


</script>