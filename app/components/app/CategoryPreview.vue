<template>
  <div class="w-full">
    <div class="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-6 lg:max-w-7xl lg:px-8">
      <div class="mx-auto mt-4 flow-root pb-10 border rounded-2xl border-blue-200 bg-gray-100">
        <AppHeaderSection
          title="Category"
          description="Cari kebutuhanmu berdasarkan kategori produk yang tersedia disini!"
          to="/category"
          icon="lucide:layout-grid"
        />
        <USeparator />

        <ClientOnly>
          <div v-if="pending" class="p-4">
            <AppLoadingSkeleton />
          </div>

          <div v-else-if="error">
            <UAlert
              title="Terjadi Kesalahan"
              :description="error.message || 'Gagal memuat kategori'"
              icon="mdi:alert-circle:error"
              color="error"
              class="m-4"
            />
          </div>

          <div v-else-if="!categories?.length">
            <UAlert
              title="Tidak ada kategori"
              description="Belum ada kategori tersedia saat ini"
              icon="imdi:tag-off-outline"
              color="neutral"
              class="m-4"
            />
          </div>

          <div v-else>
            <UCarousel
              v-slot="{ item }"
              loop
              arrows
              dots
              :autoplay="{ delay: 3000 }"
              :items="categories"
              :ui="{ item: 'basis-1/3 md:basis-1/6 hover:transition-all hover:duration-300 hover:ease-in-out hover:-mt-1' }"
              class="mt-4"
            >
              <div class="m-1">
                <NuxtLink :to="`/category/${item.id}`">
                  <NuxtImg :src="item.image_url" class="mx-auto rounded-2xl" loading="lazy" />
                  <div class="w-full justify-items-center mx-auto flex items-center">
                    <UButton color="neutral" :label="item.name" class="bg-gray-200 opacity-75 mx-auto -mt-10 text-black hover:text-white" />
                  </div>
                </NuxtLink>
              </div>
            </UCarousel>
          </div>

          <template #fallback>
            <div class="p-4">
              <AppLoadingSkeleton />
            </div>
          </template>
        </ClientOnly>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCategoryApi } from '~/composables/api/category'
import type { CategoryResponse } from '~/types/CategoryResponse'

const { fetchCategories } = useCategoryApi()

const {
  data: categories,
  pending,
  error
} = await useAsyncData<CategoryResponse[]>(
  'categories-preview',
  () => fetchCategories(),
  {
    server: false
  }
)
</script>
