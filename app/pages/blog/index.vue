<template>
  <div class="w-full">
    <div class="m-1 sm:m-3 border rounded-2xl border-blue-200 bg-gray-100">
      <div class="p-6 md:p-10">

        <UBreadcrumb :items="breadcrumb" class="mb-4" />
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Blog Adsentral</h1>
        <p class="text-gray-500 mb-8">
          Tips belanja, tren produk, dan inspirasi untuk pembeli & seller Adsentral.
        </p>

        <!-- Filter Kategori -->
        <div class="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
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
            class="bg-white rounded-2xl overflow-hidden border border-blue-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div class="h-44 bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center">
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
          Belum ada artikel di kategori ini.
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

const posts = [
  { id: 1, category: 'Tips Belanja', icon: 'i-heroicons-shopping-bag', title: '5 Tips Belanja Online Agar Tidak Tertipu', excerpt: 'Belanja online kini semakin mudah, namun tetap perlu waspada. Berikut 5 tips agar pengalaman belanja Anda lebih aman.', date: '20 Apr 2025' },
  { id: 2, category: 'Tips Berjualan', icon: 'i-heroicons-chart-bar', title: 'Cara Meningkatkan Penjualan dengan Foto Produk Berkualitas', excerpt: 'Foto produk adalah elemen pertama yang dilihat pembeli. Pelajari cara mengambil foto yang menarik dengan smartphone.', date: '15 Apr 2025' },
  { id: 3, category: 'Produk Pilihan', icon: 'i-heroicons-star', title: 'Produk Trending di Adsentral Bulan Ini', excerpt: 'Temukan produk-produk yang paling banyak dicari dan dibeli oleh pengguna Adsentral bulan ini.', date: '10 Apr 2025' },
  { id: 4, category: 'Berita', icon: 'i-heroicons-megaphone', title: 'Adsentral Luncurkan Fitur Chat Terintegrasi', excerpt: 'Kini pembeli dan seller bisa berkomunikasi langsung melalui fitur chat yang ada di setiap halaman produk.', date: '5 Apr 2025' },
  { id: 5, category: 'Tips Belanja', icon: 'i-heroicons-tag', title: 'Cara Mendapatkan Harga Terbaik di Adsentral', excerpt: 'Gunakan filter harga, bandingkan produk, dan manfaatkan promo seller untuk mendapatkan penawaran terbaik.', date: '1 Apr 2025' },
  { id: 6, category: 'Tips Berjualan', icon: 'i-heroicons-light-bulb', title: 'Strategi Deskripsi Produk yang Menarik Pembeli', excerpt: 'Deskripsi yang detail dan menarik dapat meningkatkan konversi toko Anda secara signifikan.', date: '28 Mar 2025' },
]

const filteredPosts = computed(() =>
  activeCategory.value === 'Semua'
    ? posts
    : posts.filter(p => p.category === activeCategory.value)
)
</script>
