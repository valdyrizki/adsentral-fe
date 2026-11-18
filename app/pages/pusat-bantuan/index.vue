<template>
  <div class="w-full">
    <div class="m-1 sm:m-3 border rounded-2xl border-primary-200 bg-gray-100">
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
              'bg-white rounded-2xl p-4 border border-primary-100 shadow-sm text-center hover:border-primary hover:shadow-md transition-all',
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
        <h2 class="text-2xl font-bold text-gray-800 mb-2">Masih butuh bantuan?</h2>
        <AppSlaNote prefix="Permintaan ke CS (pembayaran manual, penarikan, verifikasi, review produk, arbitrase):" class="mb-4" />
        <UButton to="/hubungi-kami" color="primary" icon="i-heroicons-chat-bubble-left-right" data-testid="help-contact-link">
          Hubungi Kami
        </UButton>

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

// Isi FAQ wajib sesuai S&K dan Kebijakan Refund & Garansi (app/legal); ubah angka/alur di sana dulu
const topics = [
  { icon: 'i-heroicons-shopping-bag', label: 'Pembelian' },
  { icon: 'i-heroicons-credit-card', label: 'Pembayaran' },
  { icon: 'i-heroicons-paper-airplane', label: 'Pengiriman' },
  { icon: 'i-heroicons-arrow-uturn-left', label: 'Refund & Garansi' },
  { icon: 'i-heroicons-user-circle', label: 'Akun' },
  { icon: 'i-heroicons-building-storefront', label: 'Seller' },
]

const activeTopic = ref('Pembelian')

const faqMap: Record<string, { label: string; content: string }[]> = {
  'Pembelian': [
    { label: 'Bagaimana cara memesan produk?', content: 'Pilih produk → Tambah ke Keranjang → buka Keranjang → pilih metode pembayaran → Checkout, lalu selesaikan pembayaran dalam 24 jam.' },
    { label: 'Apakah uang saya aman?', content: 'Ya. Pembayaran ditahan Adsentral (rekber) dan baru diteruskan ke penjual setelah pesanan selesai. Bila pesanan gagal, uang kembali ke Saldo Belanja Anda.' },
    { label: 'Bisakah saya membatalkan pesanan?', content: 'Pembatalan bisa diajukan setelah penjual mengonfirmasi pesanan dan sebelum produk dikirim. Penjual dapat menerima atau menolak; tanpa tanggapan dalam 24 jam, pengajuan dianggap diterima. Pesanan kirim otomatis tidak dapat dibatalkan. Pembatalan tercatat sebagai poin penalti.' },
    { label: 'Bisakah memesan dari beberapa seller sekaligus?', content: 'Ya. Setiap seller diproses sebagai pesanan terpisah dalam satu pembayaran.' },
  ],
  'Pembayaran': [
    { label: 'Metode pembayaran apa yang tersedia?', content: 'Saldo Belanja, metode payment gateway yang tampil di Keranjang, dan transfer bank manual.' },
    { label: 'Berapa lama batas waktu pembayaran?', content: '24 jam sejak pesanan dibuat. Lewat dari itu pesanan dibatalkan otomatis, dan tidak membayar berulang kali dapat dikenai penalti.' },
    { label: 'Apakah ada biaya tambahan?', content: 'Ada biaya aplikasi Rp1.000 per checkout dan biaya layanan pembayaran sesuai metode yang dipilih. Rinciannya tampil sebelum Anda membayar.' },
    { label: 'Bagaimana dengan transfer bank manual?', content: 'Transfer sesuai nominal persis, termasuk kode unik, sebelum masa bayar habis. Pembayaran dikonfirmasi CS maks. 1×24 jam kerja (setiap hari 11.00–21.00 WIB). Transfer yang terlambat atau nominalnya berbeda dikembalikan manual.' },
  ],
  'Pengiriman': [
    { label: 'Kapan produk dikirim?', content: 'Produk bertanda kirim otomatis terkirim sesaat setelah pembayaran diterima. Produk lainnya dikirim penjual sesuai estimasi pengiriman di halaman produk, setelah penjual mengonfirmasi pesanan (maks. 24 jam setelah dibayar).' },
    { label: 'Di mana saya melihat produk yang dikirim?', content: 'Buka menu Transaksi → pilih pesanan. Isi akun atau file dari penjual tampil di diskusi pesanan.' },
    { label: 'Bagaimana jika penjual tidak mengirim?', content: 'Bila penjual tidak mengonfirmasi dalam 24 jam atau tidak mengirim dalam estimasi pengiriman, pesanan dibatalkan otomatis dan uang kembali penuh ke Saldo Belanja.' },
    { label: 'Bagaimana jika produk yang diterima bermasalah?', content: 'Periksa segera. Anda punya 24 jam setelah produk dikirim untuk menolak kiriman; penjual lalu punya 24 jam untuk memperbaikinya, atau pesanan dibatalkan dan uang kembali. Tanpa keluhan dalam 24 jam, pesanan dianggap diterima.' },
  ],
  'Refund & Garansi': [
    { label: 'Ke mana uang refund dikembalikan?', content: 'Ke Saldo Belanja, segera setelah status pesanan berubah, dan bisa langsung dipakai belanja. Dana refund dapat diminta dicairkan ke rekening atas nama Anda melalui CS (maks. 1×24 jam kerja; biaya transfer antarbank, bila ada, dipotong).' },
    { label: 'Berapa yang dikembalikan?', content: 'Harga produk dikurangi bagian diskon voucher, ditambah biaya aplikasi bila refund terjadi karena penjual. Biaya layanan pembayaran tidak dikembalikan.' },
    { label: 'Bagaimana cara klaim garansi?', content: 'Ajukan dari halaman pesanan selama masa garansi produk masih berlaku, dengan penjelasan dan bukti. Penjual wajib menanggapi dalam 72 jam dan mengirim pengganti dalam 72 jam berikutnya. Garansi berupa penggantian produk, bukan uang, dan satu pesanan hanya bisa diklaim satu kali.' },
    { label: 'Bagaimana jika ada sengketa dengan penjual?', content: 'Selama pesanan belum selesai, Anda dapat membuka arbitrase. Adsentral memeriksa diskusi dan bukti kedua pihak lalu memutuskan. Selengkapnya di Kebijakan Refund & Garansi.' },
  ],
  'Akun': [
    { label: 'Bagaimana cara mengubah password?', content: 'Buka Profil, isi password baru beserta konfirmasinya, lalu simpan.' },
    { label: 'Bagaimana jika lupa password?', content: 'Klik "Lupa kata sandi?" di halaman login dan minta kode reset. Kode disampaikan oleh CS; hubungi CS dari email yang terdaftar, lalu masukkan kodenya untuk membuat password baru.' },
    { label: 'Akun saya terkunci, apa yang harus dilakukan?', content: 'Setelah beberapa kali salah password, akun dikunci demi keamanan. Hubungi CS untuk membukanya, atau reset lewat Lupa kata sandi.' },
    { label: 'Bagaimana cara menghapus akun?', content: 'Buka Profil → Hapus Akun. Akun hanya bisa dihapus bila saldo kosong dan tidak ada pesanan, pembayaran, penarikan, atau klaim garansi yang masih berjalan. Data akun dihapus permanen 30 hari kemudian.' },
  ],
  'Seller': [
    { label: 'Bagaimana cara mulai berjualan?', content: 'Daftar akun, lalu buka menu Buat Toko dan isi data toko. Tambahkan produk dari dashboard seller; produk baru ditinjau CS sebelum tampil (maks. 1×24 jam kerja).' },
    { label: 'Berapa biayanya?', content: 'Pendaftaran dan listing gratis. Adsentral memotong fee transaksi 10% dari harga produk untuk setiap pesanan yang selesai, atau 5% bila Anda sudah terverifikasi KTP.' },
    { label: 'Kapan dana penjualan masuk?', content: 'Setelah pesanan selesai: pembeli mengonfirmasi atau 24 jam setelah dikirim tanpa keluhan, ditambah 24 jam masa kliring. Dana masuk ke Saldo Penjualan setelah dipotong fee.' },
    { label: 'Bagaimana cara mencairkan saldo?', content: 'Dashboard Seller → Balance → Ajukan Penarikan ke rekening atas nama Anda. Minimal Rp50.000, biaya Rp2.500, limit Rp2.000.000 per hari (Rp10.000.000 bila terverifikasi KTP). Diproses CS maks. 1×24 jam kerja.' },
  ],
}

const currentFaq = computed(() => faqMap[activeTopic.value] ?? [])

</script>
