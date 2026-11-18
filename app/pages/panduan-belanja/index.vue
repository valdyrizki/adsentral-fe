<template>
  <div class="w-full">
    <div class="m-1 sm:m-3 border rounded-2xl border-primary-200 bg-gray-100">
      <div class="p-6 md:p-10">

        <!-- Header -->
        <UBreadcrumb :items="breadcrumb" class="mb-4" />
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Panduan Belanja</h1>
        <p class="text-gray-500 mb-8">
          Ikuti langkah-langkah berikut untuk berbelanja dengan mudah dan aman di Adsentral.
        </p>

        <!-- Steps -->
        <div class="space-y-6">
          <div
            v-for="(step, index) in steps"
            :key="index"
            class="flex gap-4 bg-white rounded-2xl p-5 shadow-sm border border-primary-100"
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

        <!-- FAQ -->
        <h2 class="text-2xl font-bold text-gray-800 mt-10 mb-4">Pertanyaan Umum</h2>
        <UAccordion :items="faq" />

        <!-- CTA -->
        <div class="mt-10 bg-primary/10 border border-primary/30 rounded-2xl p-6 text-center">
          <p class="text-gray-700 font-semibold text-lg mb-3">Siap untuk berbelanja?</p>
          <div class="flex justify-center gap-3 flex-wrap">
            <UButton to="/" color="primary" size="lg" icon="i-heroicons-shopping-bag">
              Mulai Belanja
            </UButton>
            <UButton to="/category" variant="outline" size="lg" icon="i-lucide-grid-3x3">
              Lihat Kategori
            </UButton>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ layout: 'default' })

useHead({
  title: 'Panduan Belanja — Adsentral',
  meta: [{ name: 'description', content: 'Pelajari cara berbelanja di Adsentral dengan mudah, aman, dan nyaman.' }],
})

const breadcrumb = [
  { label: 'Home', icon: 'i-lucide-home', to: '/' },
  { label: 'Panduan Belanja', icon: 'i-lucide-book-open' },
]

// Angka dan alur wajib sesuai S&K dan Kebijakan Refund & Garansi (app/legal)
const steps = [
  {
    title: 'Daftar & Masuk Akun',
    description: 'Buat akun Adsentral gratis untuk mulai berbelanja. Jika sudah punya akun, langsung masuk.',
    points: [
      'Klik tombol "Daftar" di pojok kanan atas.',
      'Isi username, email, dan password, lalu setujui Syarat & Ketentuan.',
    ],
  },
  {
    title: 'Cari Produk',
    description: 'Temukan produk yang Anda butuhkan melalui pencarian atau jelajahi kategori.',
    points: [
      'Gunakan kotak pencarian di bagian atas halaman.',
      'Browse melalui menu Kategori untuk menemukan produk terkait.',
      'Cek masa garansi, estimasi pengiriman, dan tanda kirim otomatis di halaman produk.',
    ],
  },
  {
    title: 'Pilih & Tambah ke Keranjang',
    description: 'Pilih produk yang diinginkan, cek detail, dan masukkan ke keranjang belanja.',
    points: [
      'Klik produk untuk melihat detail, deskripsi, dan foto.',
      'Klik tombol "Tambah ke Keranjang".',
      'Anda bisa terus belanja atau langsung ke checkout.',
    ],
  },
  {
    title: 'Checkout & Pilih Pembayaran',
    description: 'Periksa isi keranjang dan pilih metode pembayaran.',
    points: [
      'Buka halaman Keranjang dan pastikan semua item sudah benar.',
      'Pilih Saldo Belanja, metode payment gateway, atau transfer bank manual.',
      'Rincian biaya (biaya aplikasi Rp1.000 dan biaya layanan pembayaran) tampil sebelum checkout.',
    ],
  },
  {
    title: 'Selesaikan Pembayaran',
    description: 'Bayar dalam 24 jam sejak pesanan dibuat; lewat dari itu pesanan dibatalkan otomatis.',
    points: [
      'Ikuti instruksi pembayaran yang muncul.',
      'Transfer manual: kirim nominal persis termasuk kode unik; dikonfirmasi CS maks. 1×24 jam kerja.',
      'Uang Anda ditahan Adsentral (rekber) sampai pesanan selesai.',
    ],
  },
  {
    title: 'Terima & Periksa Produk',
    description: 'Pantau pesanan di menu Transaksi dan periksa produk begitu dikirim.',
    points: [
      'Isi akun atau file dari penjual tampil di diskusi pesanan.',
      'Ada masalah? Tolak kiriman dalam 24 jam; tanpa keluhan, pesanan dianggap diterima.',
      'Segera ganti password dan data pemulihan akun yang Anda beli, bila produk mengizinkan.',
    ],
  },
]

const faq = [
  {
    label: 'Apakah belanja di Adsentral aman?',
    content: 'Ya. Pembayaran ditahan Adsentral (rekber) dan baru diteruskan ke penjual setelah pesanan selesai. Bila pesanan gagal, uang kembali ke Saldo Belanja.',
  },
  {
    label: 'Bagaimana jika produk yang diterima tidak sesuai?',
    content: 'Tolak kiriman dari halaman pesanan dalam 24 jam setelah dikirim; penjual punya 24 jam untuk memperbaikinya, atau pesanan dibatalkan dan uang kembali. Setelah pesanan diterima, masalah dalam masa garansi diajukan lewat klaim garansi.',
  },
  {
    label: 'Metode pembayaran apa saja yang tersedia?',
    content: 'Saldo Belanja, metode payment gateway yang tampil di Keranjang, dan transfer bank manual.',
  },
  {
    label: 'Berapa lama pesanan saya diproses?',
    content: 'Produk kirim otomatis terkirim sesaat setelah dibayar. Produk lain dikonfirmasi penjual maks. 24 jam setelah dibayar dan dikirim sesuai estimasi pengiriman di halaman produk; bila terlewat, pesanan dibatalkan otomatis dan uang kembali.',
  },
  {
    label: 'Bagaimana cara menghubungi penjual?',
    content: 'Gunakan fitur Chat atau diskusi di halaman detail transaksi.',
  },
]
</script>
