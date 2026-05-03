<template>
  <div class="w-full">
    <div class="m-1 sm:m-3 border rounded-2xl border-blue-200 bg-gray-100">
      <div class="p-6 md:p-10">

        <UBreadcrumb :items="breadcrumb" class="mb-4" />
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Panduan Berjualan</h1>
        <p class="text-gray-500 mb-8">
          Mulai berjualan di Adsentral dan jangkau ribuan pembeli dengan mudah.
        </p>

        <!-- Steps -->
        <div class="space-y-6">
          <div
            v-for="(step, index) in steps"
            :key="index"
            class="flex gap-4 bg-white rounded-2xl p-5 shadow-sm border border-blue-100"
          >
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
              {{ index + 1 }}
            </div>
            <div>
              <h2 class="text-lg font-semibold text-gray-800 mb-1">{{ step.title }}</h2>
              <p class="text-gray-600 text-sm leading-relaxed">{{ step.description }}</p>
              <ul v-if="step.points" class="mt-2 space-y-1">
                <li
                  v-for="(point, i) in step.points"
                  :key="i"
                  class="flex items-start gap-2 text-sm text-gray-600"
                >
                  <UIcon name="i-heroicons-check-circle-20-solid" class="text-primary mt-0.5 flex-shrink-0" />
                  {{ point }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Keuntungan -->
        <h2 class="text-2xl font-bold text-gray-800 mt-10 mb-4">Keuntungan Berjualan di Adsentral</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          <div
            v-for="benefit in benefits"
            :key="benefit.title"
            class="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm"
          >
            <UIcon :name="benefit.icon" class="text-primary text-2xl mb-2" />
            <h3 class="font-semibold text-gray-800 mb-1">{{ benefit.title }}</h3>
            <p class="text-sm text-gray-500">{{ benefit.description }}</p>
          </div>
        </div>

        <!-- FAQ -->
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Pertanyaan Umum Seller</h2>
        <UAccordion :items="faq" />

        <!-- CTA -->
        <div class="mt-10 bg-primary/10 border border-primary/30 rounded-2xl p-6 text-center">
          <p class="text-gray-700 font-semibold text-lg mb-3">Siap membuka toko Anda?</p>
          <UButton to="/register" color="primary" size="lg" icon="i-heroicons-store">
            Daftar Sekarang
          </UButton>
        </div>

      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ layout: 'default' })

useHead({
  title: 'Panduan Berjualan — Adsentral',
  meta: [{ name: 'description', content: 'Pelajari cara membuka toko dan berjualan di Adsentral dengan mudah.' }],
})

const breadcrumb = [
  { label: 'Home', icon: 'i-lucide-home', to: '/' },
  { label: 'Panduan Berjualan', icon: 'i-heroicons-store' },
]

const steps = [
  {
    title: 'Daftar Akun',
    description: 'Buat akun Adsentral dan daftarkan toko Anda secara gratis.',
    points: [
      'Klik "Daftar" lalu pilih tipe akun Seller.',
      'Isi informasi nama, deskripsi, dan logo.',
      'Lengkapi data diri dan informasi rekening bank.',
    ],
  },
  {
    title: 'Buat Merchant / Toko Anda',
    description: 'Buat toko virtual Anda di Adsentral.',
    points: [
      'Buka menu lalu pilih Create Merchant / Buat Toko',
      'Isi informasi toko: nama, email, no hp dll.',
      'Lengkapi data diri dan informasi rekening bank.',
    ],
  },
  {
    title: 'Tambah Produk',
    description: 'Upload produk Anda dengan foto berkualitas dan deskripsi yang lengkap.',
    points: [
      'Masuk ke dashboard Seller → menu Produk.',
      'Klik "Tambah Produk" dan isi detail lengkap.',
      'Upload foto produk (maks. 5 MB, format JPG/PNG).',
      'Tentukan harga, stok, dan kategori produk.',
    ],
  },
  {
    title: 'Kelola Pesanan',
    description: 'Terima dan proses setiap pesanan dari pembeli dengan cepat.',
    points: [
      'Notifikasi pesanan baru akan muncul di dashboard.',
      'Konfirmasi pesanan dalam 1×24 jam.',
      'Update status pengiriman setelah barang dikirim.',
    ],
  },
  {
    title: 'Komunikasi dengan Pembeli',
    description: 'Gunakan fitur Chat untuk menjawab pertanyaan dan membangun kepercayaan.',
    points: [
      'Balas pertanyaan pembeli dengan cepat dan ramah.',
      'Informasikan estimasi pengiriman jika diminta.',
    ],
  },
  {
    title: 'Terima Pembayaran',
    description: 'Dana dari transaksi yang selesai akan diteruskan ke akun Anda.',
    points: [
      'Pantau saldo di menu Balance.',
      'Ajukan pencairan dana kapan saja.',
    ],
  },
]

const benefits = [
  { icon: 'i-heroicons-users', title: 'Jangkauan Luas', description: 'Produk Anda diakses ribuan pembeli dari seluruh wilayah.' },
  { icon: 'i-heroicons-shield-check', title: 'Transaksi Aman', description: 'Sistem pembayaran terproteksi dan dana terjamin.' },
  { icon: 'i-heroicons-chart-bar', title: 'Analitik Penjualan', description: 'Pantau performa toko melalui dashboard yang mudah dibaca.' },
  { icon: 'i-heroicons-chat-bubble-left-right', title: 'Chat Terintegrasi', description: 'Komunikasi langsung dengan pembeli tanpa aplikasi lain.' },
  { icon: 'i-heroicons-tag', title: 'Tanpa Biaya Listing', description: 'Upload produk sebanyak-banyaknya tanpa biaya tambahan.' },
  { icon: 'i-heroicons-device-phone-mobile', title: 'Kelola dari Mana Saja', description: 'Akses dashboard seller kapan saja lewat browser mobile.' },
]

const faq = [
  { label: 'Apakah berjualan di Adsentral gratis?', content: 'Ya, pendaftaran dan listing produk tidak dipungut biaya. Adsentral hanya mengambil komisi kecil dari setiap transaksi yang berhasil.' },
  { label: 'Berapa lama proses verifikasi toko?', content: 'Verifikasi toko biasanya selesai dalam 1–2 hari kerja setelah data lengkap disubmit.' },
  { label: 'Bagaimana cara mencairkan dana penjualan?', content: 'Buka menu Balance di dashboard seller, lalu ajukan penarikan. Dana akan masuk ke rekening dalam 1–3 hari kerja.' },
  { label: 'Apa yang terjadi jika pembeli komplain?', content: 'Tim Adsentral akan menjadi mediator. Pastikan produk sesuai deskripsi dan kirim tepat waktu untuk meminimalkan komplain.' },
]
</script>
