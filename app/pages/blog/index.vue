<template>
  <div class="w-full">
    <div class="m-1 sm:m-3 border rounded-2xl border-primary-200 bg-gray-100">
      <div class="p-6 md:p-10">

        <UBreadcrumb :items="breadcrumb" class="mb-4" />
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Blog Adsentral</h1>
        <p class="text-gray-500 mb-8">
          Tips belanja, tren produk, dan inspirasi untuk pembeli & seller Adsentral.
        </p>

        <!-- Filter Kategori -->
        <div v-if="posts.length" class="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          <button
            v-for="cat in blogCategories"
            :key="cat"
            :class="[
              'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-all',
              activeCategory === cat
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
            ]"
            @click="activeCategory = cat"
          >
            {{ cat }}
          </button>
        </div>

        <!-- Blog Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="post in filteredPosts"
            :key="post.id"
            class="bg-white rounded-2xl overflow-hidden border border-primary-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div class="h-44 bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
              <UIcon :name="post.icon" class="text-primary text-5xl" />
            </div>
            <div class="p-5">
              <span class="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{{ post.category }}</span>
              <h2 class="text-base font-semibold text-gray-800 mt-2 mb-1 group-hover:text-primary transition-colors">{{ post.title }}</h2>
              <p class="text-sm text-gray-500 line-clamp-2">{{ post.excerpt }}</p>
              <div class="flex items-center justify-between mt-4">
                <span class="text-xs text-gray-400">{{ post.date }}</span>
                <span class="text-xs text-primary font-medium">Baca selengkapnya →</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="filteredPosts.length === 0" class="text-center py-16 text-gray-400">
          {{ posts.length ? 'Belum ada artikel di kategori ini.' : 'Belum ada artikel.' }}
        </div>

      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ layout: 'default' })

useHead({
  title: 'Blog — Adsentral',
  meta: [{ name: 'description', content: 'Tips belanja, tren produk, dan inspirasi dari Adsentral.' }],
})

const breadcrumb = [
  { label: 'Home', icon: 'i-lucide-home', to: '/' },
  { label: 'Blog', icon: 'i-heroicons-newspaper' },
]

const blogCategories = ['Semua', 'Tips Belanja', 'Tips Berjualan', 'Produk Pilihan', 'Berita']

const activeCategory = ref('Semua')

// Artikel contoh dihapus sebelum go-live (F-71); isi saat artikel asli tersedia
const posts: { id: number, category: string, icon: string, title: string, excerpt: string, date: string }[] = []

const filteredPosts = computed(() =>
  activeCategory.value === 'Semua'
    ? posts
    : posts.filter(p => p.category === activeCategory.value)
)
</script>
