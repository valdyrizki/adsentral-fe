<template>
  <div class="w-full bg-amber-500">
    <div class="p-2 sm:p-6">
      <h1 class="text-2xl font-bold mb-6">CATEGORY</h1>
      <div class="grid grid-cols-5 sm:grid-cols-12 gap-4 mb-8 items-center ">
        <UCard
          v-for="cat in categories"
          :key="cat.id"
          :class="[
            'cursor-pointer p-0 overflow-hidden relative group transition-all',
            'sm:w-[100px] sm:h-[100px] w-[100px] h-[100px]',
            cat.id === selectedCategoryId ? 'ring-2 ring-primary bg-primary/10' : 'hover:ring-1 hover:ring-primary'
          ]"
          @click="selectCategory(cat.id)"
        >
          <img
            :src="cat.image_url"
            :alt="cat.name"
            class="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
          <div class="absolute bottom-0 left-0 w-full bg-black/60 text-white text-center py-2 text-sm font-medium">
            {{ cat.name }}
          </div>
        </UCard>
      </div>
      <div>
        <h2 class="text-xl font-semibold mb-4">Produk</h2>
        <div v-if="filteredProducts.length === 0" class="text-gray-400">Tidak ada produk.</div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <UCard
            v-for="prod in filteredProducts"
            :key="prod.id"
            class="flex items-center gap-3"
          >
            <img :src="prod.image" :alt="prod.name" class="w-10 h-10 object-cover rounded" />
            <span>{{ prod.name }}</span>
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'


const toast = useToast && typeof useToast === 'function' ? useToast() : null
function showToast() {
  if (toast) {
    toast.add({
      title: 'Uh oh! Something went wrong.',
      description: 'There was a problem with your request.'
    })
  }
}

const config = useRuntimeConfig()
const api = config.public.apiBase

const {
  data: categories,
  error,
  pending
} = await useFetch(api + '/categories', {
  transform: (res: any) => res.data,
  onRequest({ options }) {
    console.log('Fetching categories...')
  },
  onRequestError({ error }) {
    showToast()
  },
  onResponse({ response }) {
    console.log('Got response:', response._data)
  },
  onResponseError({ response }) {
    console.error('Response error:', response)
  }
})

const products = ref([
  { id: 1, name: 'Laptop', categoryId: 1, image: 'https://via.placeholder.com/40x40?text=Laptop' },
  { id: 2, name: 'Smartphone', categoryId: 1, image: 'https://via.placeholder.com/40x40?text=HP' },
  { id: 3, name: 'Kaos', categoryId: 2, image: 'https://via.placeholder.com/40x40?text=Kaos' },
  { id: 4, name: 'Celana', categoryId: 2, image: 'https://via.placeholder.com/40x40?text=Celana' },
  { id: 5, name: 'Bakso', categoryId: 3, image: 'https://via.placeholder.com/40x40?text=Bakso' },
])


const selectedCategoryId = ref()

watchEffect(() => {
  if (categories.value && categories.value.length > 0 && !selectedCategoryId.value) {
    selectedCategoryId.value = categories.value[0].id
  }
})

function selectCategory(id: number) {
  selectedCategoryId.value = id
}

const filteredProducts = computed(() =>
  products.value.filter(p => p.categoryId === selectedCategoryId.value)
)
</script>