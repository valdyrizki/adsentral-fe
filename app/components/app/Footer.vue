<template>
  <footer class="bg-gray-900 text-gray-400">
    <!-- Main footer content -->
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
      <div class="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">

        <!-- Brand column -->
        <div class="lg:col-span-2">
          <NuxtLink to="/" class="flex items-center gap-2">
            <div class="h-8 w-8 rounded-lg bg-primary-500 flex items-center justify-center">
              <UIcon name="material-symbols:store" class="text-white text-lg" />
            </div>
            <span class="text-xl font-bold text-white">Adsentral</span>
          </NuxtLink>
          <p class="mt-4 text-sm leading-relaxed max-w-xs">
            Marketplace terpercaya untuk kebutuhan belanja online kamu. Temukan ribuan produk dari penjual terbaik di seluruh Indonesia.
          </p>

          <!-- Social media -->
          <div class="mt-6 flex gap-3">
            <UButton
              v-for="social in socials"
              :key="social.label"
              :icon="social.icon"
              :aria-label="social.label"
              color="neutral"
              variant="outline"
              size="sm"
              class="text-gray-400 border-gray-700 hover:border-primary-500 hover:text-primary-400"
            />
          </div>
        </div>

        <!-- Belanja -->
        <div>
          <h3 class="text-sm font-semibold text-white tracking-wider uppercase">Belanja</h3>
          <ul class="mt-4 space-y-3">
            <li v-for="item in nav.belanja" :key="item.name">
              <NuxtLink :to="item.to" class="text-sm hover:text-primary-400 transition-colors">
                {{ item.name }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Jual -->
        <div>
          <h3 class="text-sm font-semibold text-white tracking-wider uppercase">Jual</h3>
          <ul class="mt-4 space-y-3">
            <li v-for="item in nav.jual" :key="item.name">
              <NuxtLink :to="item.to" class="text-sm hover:text-primary-400 transition-colors">
                {{ item.name }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Bantuan & Perusahaan -->
        <div class="space-y-8">
          <div>
            <h3 class="text-sm font-semibold text-white tracking-wider uppercase">Bantuan</h3>
            <ul class="mt-4 space-y-3">
              <li v-for="item in nav.bantuan" :key="item.name">
                <NuxtLink :to="item.to" class="text-sm hover:text-primary-400 transition-colors">
                  {{ item.name }}
                </NuxtLink>
              </li>
            </ul>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-white tracking-wider uppercase">Perusahaan</h3>
            <ul class="mt-4 space-y-3">
              <li v-for="item in nav.perusahaan" :key="item.name">
                <NuxtLink :to="item.to" class="text-sm hover:text-primary-400 transition-colors">
                  {{ item.name }}
                </NuxtLink>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>

    <!-- Bottom bar -->
    <div class="border-t border-gray-800">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p class="text-xs text-gray-500">
          &copy; {{ new Date().getFullYear() }} Adsentral. Seluruh hak dilindungi.
        </p>
        <div class="flex items-center gap-2 text-xs text-gray-500">
          <UIcon name="material-symbols:lock-outline" class="text-sm" />
          <span>Transaksi aman & terenkripsi</span>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const socials = [
  { icon: 'i-simple-icons-instagram', label: 'Instagram' },
  { icon: 'i-simple-icons-tiktok', label: 'TikTok' },
  { icon: 'i-simple-icons-facebook', label: 'Facebook' },
  { icon: 'i-simple-icons-x', label: 'X / Twitter' },
]

const nav = {
  belanja: [
    { name: 'Semua Produk', to: '/category' },
    { name: 'Kategori', to: '/category' },
    { name: 'Keranjang', to: '/cart' },
    { name: 'Riwayat Pesanan', to: '/transaction' },
    { name: 'Klaim Garansi', to: '/guarantee' },
  ],
  jual: [
    { name: 'Daftar Jadi Penjual', to: '/merchant/create' },
    { name: 'Seller Center', to: '/seller/dashboard' },
    { name: 'Kelola Produk', to: '/seller/product' },
    { name: 'Kelola Pesanan', to: '/seller/order' },
  ],
  bantuan: [
    { name: 'Panduan Belanja', to: '/panduan-belanja' },
    { name: 'Pusat Bantuan', to: '/pusat-bantuan' },
    { name: 'Hubungi Kami', to: '/hubungi-kami' },
    { name: 'Blog', to: '/blog' },
  ],
  perusahaan: [
    { name: 'Tentang Kami', to: '/tentang-kami' },
    { name: 'Karir', to: '/karir' },
    { name: 'Panduan Berjualan', to: '/panduan-berjualan' },
  ],
}
</script>
