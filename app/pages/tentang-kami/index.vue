<template>
  <div class="w-full">
    <div class="m-1 sm:m-3 border rounded-2xl border-blue-200 bg-gray-100">
      <div class="p-6 md:p-10">

        <UBreadcrumb :items="breadcrumb" class="mb-4" />

        <!-- Hero -->
        <div class="bg-gradient-to-br from-blue-600 to-teal-700 rounded-2xl p-8 md:p-12 text-white text-center mb-10">
          <h1 class="text-4xl font-bold mb-3">Tentang Adsentral</h1>
          <p class="text-blue-100 text-lg max-w-2xl mx-auto">
            Platform e-commerce yang menghubungkan pembeli dan penjual di seluruh Indonesia dengan cara yang mudah, aman, dan terpercaya.
          </p>
        </div>

        <!-- Visi & Misi -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div class="bg-white rounded-2xl p-6 border border-blue-100 shadow-sm">
            <div class="flex items-center gap-3 mb-3">
              <UIcon name="i-heroicons-eye" class="text-primary text-2xl" />
              <h2 class="text-xl font-bold text-gray-800">Visi</h2>
            </div>
            <p class="text-gray-600 leading-relaxed">
              Menjadi platform perdagangan digital terpercaya yang memberdayakan jutaan pelaku usaha kecil dan menengah di Indonesia.
            </p>
          </div>
          <div class="bg-white rounded-2xl p-6 border border-blue-100 shadow-sm">
            <div class="flex items-center gap-3 mb-3">
              <UIcon name="i-heroicons-rocket-launch" class="text-primary text-2xl" />
              <h2 class="text-xl font-bold text-gray-800">Misi</h2>
            </div>
            <ul class="space-y-2 text-gray-600 text-sm">
              <li class="flex items-start gap-2">
                <UIcon name="i-heroicons-check-circle-20-solid" class="text-primary mt-0.5 flex-shrink-0" />
                Menyediakan platform yang mudah digunakan oleh semua kalangan.
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-heroicons-check-circle-20-solid" class="text-primary mt-0.5 flex-shrink-0" />
                Membangun ekosistem jual-beli yang aman dan transparan.
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-heroicons-check-circle-20-solid" class="text-primary mt-0.5 flex-shrink-0" />
                Mendukung pertumbuhan UMKM melalui teknologi digital.
              </li>
            </ul>
          </div>
        </div>

        <!-- Nilai -->
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Nilai-Nilai Kami</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div
            v-for="value in values"
            :key="value.title"
            class="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm text-center"
          >
            <UIcon :name="value.icon" class="text-primary text-3xl mb-2" />
            <h3 class="font-semibold text-gray-800 text-sm">{{ value.title }}</h3>
          </div>
        </div>

        <!-- Stats -->
        <div class="bg-gradient-to-r from-blue-50 to-teal-50 rounded-2xl p-6 mb-10">
          <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">Adsentral dalam Angka</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div v-for="stat in stats" :key="stat.label">
              <p class="text-3xl font-bold text-primary">{{ stat.value }}</p>
              <p class="text-sm text-gray-500 mt-1">{{ stat.label }}</p>
            </div>
          </div>
        </div>

        <!-- Kontak -->
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Hubungi Kami</h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            v-for="contact in contacts"
            :key="contact.label"
            class="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm flex items-center gap-4"
          >
            <UIcon :name="contact.icon" class="text-primary text-2xl flex-shrink-0" />
            <div>
              <p class="text-xs text-gray-400">{{ contact.label }}</p>
              <p class="font-semibold text-gray-700 text-sm">{{ contact.value }}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ layout: 'default' })

useHead({
  title: 'Tentang Kami — Adsentral',
  meta: [{ name: 'description', content: 'Kenali lebih dalam tentang Adsentral, platform e-commerce yang menghubungkan pembeli dan penjual di Indonesia.' }],
})

const breadcrumb = [
  { label: 'Home', icon: 'i-lucide-home', to: '/' },
  { label: 'Tentang Kami', icon: 'i-heroicons-information-circle' },
]

const values = [
  { icon: 'i-heroicons-shield-check', title: 'Kepercayaan' },
  { icon: 'i-heroicons-light-bulb', title: 'Inovasi' },
  { icon: 'i-heroicons-heart', title: 'Kepedulian' },
  { icon: 'i-heroicons-bolt', title: 'Kecepatan' },
]

const stats = [
  { value: '10K+', label: 'Produk Terdaftar' },
  { value: '1K+', label: 'Seller Aktif' },
  { value: '50K+', label: 'Transaksi Selesai' },
  { value: '99%', label: 'Kepuasan Pembeli' },
]

const contacts = [
  { icon: 'i-heroicons-phone', label: 'Telepon', value: '085855558813' },
  { icon: 'i-heroicons-envelope', label: 'Email', value: 'support@adsentral.id' },
  { icon: 'i-heroicons-map-pin', label: 'Alamat', value: 'Jakarta, Indonesia' },
]
</script>
