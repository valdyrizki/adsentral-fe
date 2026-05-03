<template>
  <div class="w-full">
    <div class="m-1 sm:m-3 border rounded-2xl border-blue-200 bg-gray-100">
      <div class="p-6 md:p-10">

        <UBreadcrumb :items="breadcrumb" class="mb-4" />
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Pusat Bantuan</h1>
        <p class="text-gray-500 mb-8">
          Temukan jawaban atas pertanyaan Anda atau hubungi tim dukungan kami.
        </p>

        <!-- Topik Bantuan -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          <button
            v-for="topic in topics"
            :key="topic.label"
            :class="[
              'bg-white rounded-2xl p-4 border border-blue-100 shadow-sm text-center hover:border-primary hover:shadow-md transition-all',
              activeTopic === topic.label ? 'border-primary ring-1 ring-primary' : ''
            ]"
            @click="activeTopic = topic.label"
          >
            <UIcon :name="topic.icon" class="text-primary text-2xl mb-2" />
            <p class="text-xs font-medium text-gray-700">{{ topic.label }}</p>
          </button>
        </div>

        <!-- FAQ per Topik -->
        <h2 class="text-xl font-bold text-gray-800 mb-4">
          FAQ — <span class="text-primary">{{ activeTopic }}</span>
        </h2>
        <UAccordion :items="currentFaq" class="mb-10" />

        <!-- Kontak Dukungan -->
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Masih butuh bantuan?</h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div
            v-for="channel in supportChannels"
            :key="channel.title"
            class="bg-white rounded-2xl p-6 border border-blue-100 shadow-sm text-center"
          >
            <UIcon :name="channel.icon" class="text-primary text-3xl mb-3" />
            <h3 class="font-semibold text-gray-800 mb-1">{{ channel.title }}</h3>
            <p class="text-sm text-gray-500 mb-3">{{ channel.description }}</p>
            <UButton :color="channel.color" variant="soft" size="sm" :icon="channel.icon">
              {{ channel.action }}
            </UButton>
          </div>
        </div>

        <!-- Jam Operasional -->
        <div class="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-4">
          <UIcon name="i-heroicons-clock" class="text-primary text-2xl flex-shrink-0 mt-0.5" />
          <div>
            <h3 class="font-semibold text-gray-800 mb-1">Jam Operasional Tim Dukungan</h3>
            <p class="text-sm text-gray-600">Senin – Jumat: 08.00 – 20.00 WIB</p>
            <p class="text-sm text-gray-600">Sabtu – Minggu: 09.00 – 17.00 WIB</p>
            <p class="text-xs text-gray-400 mt-1">Di luar jam operasional, silakan tinggalkan pesan dan kami akan membalas secepatnya.</p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ layout: 'default' })

useHead({
  title: 'Pusat Bantuan — Adsentral',
  meta: [{ name: 'description', content: 'Temukan jawaban atas pertanyaan Anda atau hubungi tim dukungan Adsentral.' }],
})

const breadcrumb = [
  { label: 'Home', icon: 'i-lucide-home', to: '/' },
  { label: 'Pusat Bantuan', icon: 'i-heroicons-question-mark-circle' },
]

const topics = [
  { icon: 'i-heroicons-shopping-bag', label: 'Pembelian' },
  { icon: 'i-heroicons-credit-card', label: 'Pembayaran' },
  { icon: 'i-heroicons-truck', label: 'Pengiriman' },
  { icon: 'i-heroicons-arrow-uturn-left', label: 'Pengembalian' },
  { icon: 'i-heroicons-user-circle', label: 'Akun' },
  { icon: 'i-heroicons-store', label: 'Seller' },
]

const activeTopic = ref('Pembelian')

const faqMap: Record<string, { label: string; content: string }[]> = {
  'Pembelian': [
    { label: 'Bagaimana cara memesan produk?', content: 'Pilih produk → Tambah ke Keranjang → Checkout → Pilih metode pembayaran → Konfirmasi pesanan.' },
    { label: 'Apakah bisa memesan produk dari beberapa seller sekaligus?', content: 'Ya, keranjang belanja Adsentral mendukung multi-seller. Setiap seller akan diproses sebagai transaksi terpisah.' },
    { label: 'Bagaimana jika stok produk habis saat checkout?', content: 'Sistem akan memberi tahu jika stok tidak mencukupi sebelum pembayaran dilakukan.' },
  ],
  'Pembayaran': [
    { label: 'Metode pembayaran apa yang tersedia?', content: 'Tersedia transfer bank dan dompet digital sesuai konfigurasi seller.' },
    { label: 'Berapa lama batas waktu pembayaran?', content: 'Pembayaran harus dilakukan dalam 24 jam setelah pesanan dibuat, sebelum otomatis dibatalkan.' },
    { label: 'Apakah ada biaya tambahan saat pembayaran?', content: 'Tidak ada biaya tersembunyi dari Adsentral. Biaya admin transfer tergantung kebijakan bank masing-masing.' },
  ],
  'Pengiriman': [
    { label: 'Berapa lama estimasi pengiriman?', content: 'Tergantung lokasi dan kurir. Seller akan mengupdate resi pengiriman setelah barang dikirim.' },
    { label: 'Bagaimana cara melacak pesanan?', content: 'Buka menu Transaksi → pilih pesanan → lihat status dan resi pengiriman.' },
    { label: 'Apa yang terjadi jika paket tidak sampai?', content: 'Hubungi seller melalui fitur Chat atau laporkan ke tim dukungan Adsentral dalam 7 hari.' },
  ],
  'Pengembalian': [
    { label: 'Bagaimana cara mengajukan pengembalian barang?', content: 'Buka detail transaksi dan klik "Ajukan Komplain" dalam 2×24 jam setelah barang diterima.' },
    { label: 'Berapa lama proses refund?', content: 'Proses refund memakan waktu 3–7 hari kerja setelah pengajuan disetujui.' },
    { label: 'Produk apa yang tidak bisa dikembalikan?', content: 'Produk digital, makanan, dan produk yang sudah digunakan umumnya tidak dapat dikembalikan.' },
  ],
  'Akun': [
    { label: 'Bagaimana cara mengubah password?', content: 'Masuk ke Profil → Pengaturan Akun → Ubah Password.' },
    { label: 'Apakah data saya aman?', content: 'Ya, data Anda dienkripsi dan tidak dibagikan kepada pihak ketiga tanpa izin Anda.' },
    { label: 'Bagaimana jika lupa password?', content: 'Klik "Lupa Password" di halaman login dan ikuti instruksi reset via email.' },
  ],
  'Seller': [
    { label: 'Bagaimana cara mendaftar sebagai seller?', content: 'Buka halaman Panduan Berjualan atau daftar langsung melalui halaman Register dengan memilih tipe akun Seller.' },
    { label: 'Bagaimana cara mencairkan saldo?', content: 'Buka dashboard Seller → Balance → Ajukan Penarikan. Dana masuk dalam 1–3 hari kerja.' },
    { label: 'Apakah ada biaya komisi?', content: 'Ya, Adsentral mengambil komisi kecil dari setiap transaksi yang berhasil. Detail tersedia di dashboard seller.' },
  ],
}

const currentFaq = computed(() => faqMap[activeTopic.value] ?? [])

const supportChannels = [
  { icon: 'i-heroicons-chat-bubble-left-right', title: 'Live Chat', description: 'Hubungi agen kami secara langsung untuk bantuan cepat.', action: 'Mulai Chat', color: 'primary' as const },
  { icon: 'i-heroicons-envelope', title: 'Email', description: 'Kirim pertanyaan detail ke tim support kami.', action: 'support@adsentral.id', color: 'info' as const },
  { icon: 'i-heroicons-phone', title: 'Telepon', description: 'Hubungi kami di jam operasional.', action: '085855558813', color: 'success' as const },
]
</script>
