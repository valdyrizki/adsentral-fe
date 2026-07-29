<template>
  <div class="w-full">
    <div class="m-1 sm:m-3 border rounded-2xl border-blue-200 bg-gray-100">
      <div class="p-6 md:p-10">

        <!-- Header -->
        <UBreadcrumb :items="breadcrumb" class="mb-4" />
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Syarat & Ketentuan</h1>
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
          <p class="text-gray-700 font-semibold mb-1">Ada pertanyaan soal Syarat & Ketentuan?</p>
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
  title: 'Syarat & Ketentuan — Adsentral',
  meta: [{ name: 'description', content: 'Syarat dan ketentuan penggunaan layanan Adsentral untuk pembeli dan penjual.' }],
})

const breadcrumb = [
  { label: 'Home', icon: 'i-lucide-home', to: '/' },
  { label: 'Syarat & Ketentuan', icon: 'i-heroicons-document-text' },
]

const lastUpdated = '29 Juli 2026'

const sections = [
  {
    title: 'Penerimaan Ketentuan',
    description: 'Dengan mendaftar dan menggunakan layanan Adsentral, Anda dianggap telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan yang berlaku di platform ini.',
  },
  {
    title: 'Akun Pengguna',
    points: [
      'Pengguna wajib memberikan data pendaftaran yang benar dan terkini.',
      'Pengguna bertanggung jawab menjaga kerahasiaan kata sandi dan aktivitas pada akunnya.',
      'Adsentral berhak menangguhkan atau menutup akun yang terindikasi melanggar ketentuan.',
    ],
  },
  {
    title: 'Ketentuan bagi Pembeli',
    points: [
      'Pembeli wajib melakukan pembayaran sesuai metode dan nominal yang tertera saat checkout.',
      'Pembeli berhak mengajukan klaim garansi/komplain sesuai kebijakan yang berlaku pada produk terkait.',
      'Pembatalan pesanan hanya dapat dilakukan sebelum status pesanan diproses oleh penjual.',
    ],
  },
  {
    title: 'Ketentuan bagi Penjual (Merchant)',
    points: [
      'Penjual wajib menyediakan informasi produk yang akurat, termasuk harga, stok, dan deskripsi.',
      'Penjual bertanggung jawab memproses dan mengirimkan pesanan sesuai waktu yang dijanjikan.',
      'Penjual dilarang menjual produk ilegal, palsu, atau melanggar hukum yang berlaku di Indonesia.',
      'Penarikan dana (withdrawal) mengikuti proses verifikasi dan jadwal pencairan yang ditetapkan Adsentral.',
    ],
  },
  {
    title: 'Larangan Penggunaan',
    points: [
      'Menyalahgunakan platform untuk aktivitas penipuan, pencucian uang, atau tindakan melawan hukum lainnya.',
      'Memanipulasi ulasan, rating, atau transaksi secara tidak wajar.',
      'Melakukan percobaan akses tidak sah ke sistem atau data pengguna lain.',
    ],
  },
  {
    title: 'Pembayaran dan Biaya Layanan',
    description: 'Adsentral dapat mengenakan biaya layanan (fee) atas transaksi yang terjadi di platform, termasuk namun tidak terbatas pada biaya penarikan dana. Rincian biaya dapat berubah sewaktu-waktu dan akan diinformasikan kepada pengguna.',
  },
  {
    title: 'Penyelesaian Sengketa',
    description: 'Perselisihan antara pembeli dan penjual akan difasilitasi oleh tim Adsentral melalui mekanisme klaim garansi dan pusat bantuan. Apabila tidak tercapai kesepakatan, penyelesaian dapat dilakukan sesuai hukum yang berlaku di Indonesia.',
  },
  {
    title: 'Perubahan Ketentuan',
    description: 'Adsentral berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan akan diinformasikan melalui platform dan berlaku efektif sejak dipublikasikan.',
  },
]
</script>
