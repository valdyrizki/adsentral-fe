<template>
  <div class="w-full">
    <div class="m-1 sm:m-3 border rounded-2xl border-blue-200 bg-gray-100">
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

const steps = [
  {
    title: 'Daftar & Masuk Akun',
    description: 'Buat akun Adsentral gratis untuk mulai berbelanja. Jika sudah punya akun, langsung masuk.',
    points: [
      'Klik tombol "Daftar" di pojok kanan atas.',
      'Isi nama, email, dan kata sandi.',
      'Verifikasi email Anda, lalu masuk.',
    ],
  },
  {
    title: 'Cari Produk',
    description: 'Temukan produk yang Anda butuhkan melalui pencarian atau jelajahi kategori.',
    points: [
      'Gunakan kotak pencarian di bagian atas halaman.',
      'Browse melalui menu Kategori untuk menemukan produk terkait.',
      'Gunakan filter harga dan urutan untuk menyempurnakan hasil.',
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
    description: 'Periksa isi keranjang, masukkan detail pengiriman, dan pilih metode pembayaran.',
    points: [
      'Buka halaman Keranjang dan pastikan semua item sudah benar.',
      'Klik "Checkout" dan ikuti langkah pengisian alamat.',
      'Pilih metode pembayaran yang tersedia.',
    ],
  },
  {
    title: 'Konfirmasi & Selesaikan Pembayaran',
    description: 'Lakukan pembayaran sesuai metode yang dipilih, lalu simpan bukti transaksi.',
    points: [
      'Ikuti instruksi pembayaran yang muncul.',
      'Unggah bukti pembayaran jika diperlukan.',
      'Status pesanan akan berubah menjadi "Diproses" setelah pembayaran dikonfirmasi.',
    ],
  },
  {
    title: 'Pantau Status Pesanan',
    description: 'Lacak pesanan Anda secara real-time melalui halaman Transaksi.',
    points: [
      'Buka menu "Transaksi" di akun Anda.',
      'Lihat status pesanan: Menunggu, Diproses, Dikirim, atau Selesai.',
      'Hubungi penjual melalui fitur Chat jika ada pertanyaan.',
    ],
  },
]

const faq = [
  {
    label: 'Apakah belanja di Adsentral aman?',
    content: 'Ya, Adsentral menggunakan enkripsi data dan sistem pembayaran yang terpercaya untuk menjaga keamanan transaksi Anda.',
  },
  {
    label: 'Bagaimana jika produk yang diterima tidak sesuai?',
    content: 'Anda dapat mengajukan komplain melalui halaman detail transaksi dalam waktu 2×24 jam setelah barang diterima. Tim kami akan membantu menyelesaikan masalah.',
  },
  {
    label: 'Metode pembayaran apa saja yang tersedia?',
    content: 'Adsentral mendukung berbagai metode pembayaran sesuai yang dikonfigurasi oleh seller, termasuk transfer bank dan dompet digital.',
  },
  {
    label: 'Berapa lama pesanan saya diproses?',
    content: 'Seller akan memproses pesanan dalam 1×24 jam setelah pembayaran dikonfirmasi. Waktu pengiriman tergantung lokasi dan jasa kurir yang digunakan.',
  },
  {
    label: 'Bagaimana cara menghubungi penjual?',
    content: 'Gunakan fitur Chat yang tersedia di halaman produk atau halaman detail transaksi untuk berkomunikasi langsung dengan penjual.',
  },
]
</script>
