<template>
  <div class="w-full">
    <div class="m-1 sm:m-3 border rounded-2xl border-blue-200 bg-gray-100">
      <div class="p-6 md:p-10">

        <!-- Header -->
        <UBreadcrumb :items="breadcrumb" class="mb-4" />
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Kebijakan Privasi</h1>
        <p class="text-gray-500 mb-4">
          Terakhir diperbarui: {{ lastUpdated }}
        </p>

        <!-- <UAlert
          color="warning"
          variant="soft"
          icon="i-heroicons-exclamation-triangle"
          title="Draft — belum ditinjau tim legal"
          description="Isi halaman ini masih rancangan awal dan belum final secara hukum. Mohon direview oleh pihak yang berwenang (legal/product owner) sebelum dipublikasikan ke pengguna."
          class="mb-8"
        /> -->

        <div class="space-y-8">
          <section v-for="(section, index) in sections" :key="index" class="bg-white rounded-2xl p-6 shadow-sm border border-blue-100">
            <h2 class="text-lg font-semibold text-gray-800 mb-3">{{ index + 1 }}. {{ section.title }}</h2>
            <p v-if="section.description" class="text-sm text-gray-600 leading-relaxed mb-3">{{ section.description }}</p>
            <ul v-if="section.points" class="space-y-2">
              <li
                v-for="(point, i) in section.points"
                :key="i"
                class="flex items-start gap-2 text-sm text-gray-600"
              >
                <UIcon name="i-heroicons-check-circle-20-solid" class="text-primary mt-0.5 flex-shrink-0" />
                {{ point }}
              </li>
            </ul>
          </section>
        </div>

        <!-- Kontak -->
        <div class="mt-10 bg-primary/10 border border-primary/30 rounded-2xl p-6 text-center">
          <p class="text-gray-700 font-semibold mb-1">Ada pertanyaan soal privasi data Anda?</p>
          <p class="text-sm text-gray-500 mb-4">Hubungi tim kami melalui halaman kontak.</p>
          <UButton to="/hubungi-kami" color="primary" icon="i-heroicons-envelope">
            Hubungi Kami
          </UButton>
        </div>

      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ layout: 'default' })

useHead({
  title: 'Kebijakan Privasi — Adsentral',
  meta: [{ name: 'description', content: 'Kebijakan privasi Adsentral mengenai pengumpulan, penggunaan, dan perlindungan data pengguna.' }],
})

const breadcrumb = [
  { label: 'Home', icon: 'i-lucide-home', to: '/' },
  { label: 'Kebijakan Privasi', icon: 'i-heroicons-shield-check' },
]

const lastUpdated = '29 Juli 2026'

const sections = [
  {
    title: 'Informasi yang Kami Kumpulkan',
    points: [
      'Data akun: nama, email, nomor telepon, dan kata sandi (tersimpan terenkripsi).',
      'Data transaksi: riwayat pesanan, metode pembayaran, dan alamat pengiriman.',
      'Data teknis: alamat IP, jenis perangkat, dan log aktivitas untuk keperluan keamanan.',
      'Data toko (khusus penjual): informasi merchant, rekening bank, dan dokumen verifikasi.',
    ],
  },
  {
    title: 'Bagaimana Kami Menggunakan Data Anda',
    points: [
      'Memproses transaksi jual-beli dan pembayaran.',
      'Memverifikasi identitas untuk mencegah penipuan.',
      'Mengirim notifikasi terkait pesanan, promo, dan pembaruan layanan.',
      'Meningkatkan kualitas layanan berdasarkan analisis penggunaan platform.',
    ],
  },
  {
    title: 'Berbagi Data dengan Pihak Ketiga',
    description: 'Kami tidak menjual data pribadi Anda. Data hanya dibagikan kepada pihak ketiga yang diperlukan untuk operasional layanan, antara lain:',
    points: [
      'Penyedia jasa pembayaran (payment gateway) untuk memproses transaksi.',
      'Jasa pengiriman untuk mengantarkan pesanan.',
      'Penjual (merchant) terkait, sebatas data yang diperlukan untuk memenuhi pesanan.',
    ],
  },
  {
    title: 'Keamanan Data',
    description: 'Kami menerapkan enkripsi, kontrol akses, dan pemantauan sistem untuk melindungi data Anda dari akses yang tidak sah. Namun tidak ada sistem yang sepenuhnya kebal terhadap risiko keamanan.',
  },
  {
    title: 'Hak Pengguna',
    points: [
      'Mengakses dan memperbarui data pribadi melalui halaman profil.',
      'Meminta penghapusan akun dan data terkait, sesuai ketentuan yang berlaku.',
      'Menarik persetujuan atas pemrosesan data tertentu (mis. notifikasi promosi).',
    ],
  },
  {
    title: 'Cookie',
    description: 'Platform kami menggunakan cookie untuk menjaga sesi login, mengingat preferensi, dan menganalisis penggunaan situs. Anda dapat mengatur preferensi cookie melalui pengaturan browser.',
  },
  {
    title: 'Perubahan Kebijakan',
    description: 'Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan signifikan akan diinformasikan melalui email atau notifikasi di platform.',
  },
]
</script>
