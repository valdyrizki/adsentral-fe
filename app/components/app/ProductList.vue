<template>
  <div class="w-full p-1 md:p-0 bg-white">
    <div class="mx-auto w-full md:w-3/4 border rounded-2xl border-blue-200 bg-gray-100">
      <!-- PRODUCT HEADER -->
      <div>
        <AppHeaderSection
          title="Product"
          description="Cari produk yang kamu cari disini!"
          to="/product"
          icon="material-symbols:shopping-bag-sharp"
        />
      </div>

      <USeparator />

      <div>
        <!-- PRODUCT LIST -->
        <div class="mx-auto w-full p-4">

          <div v-if="productStore.loading">
              <AppLoadingSkeleton/>
          </div>
          <div v-else-if="productStore.error">
            <h1>{{ productStore.error }}</h1>

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
</template>


<script setup lang="ts">
  const productStore  = useProductStore()
  productStore.fetchProducts();
</script>