<template>
  <!-- Ringkasan kebijakan refund di checkout (EP08-05); isi harus sesuai app/legal/kebijakan-refund-garansi.md §1 -->
  <div class="mt-4 rounded-lg border border-primary-100 bg-primary-50/50 p-3 text-xs text-gray-600" data-testid="refund-summary">
    <p class="font-semibold text-gray-700 mb-1">Aman dengan rekber Adsentral</p>
    <ul class="list-disc pl-4 space-y-0.5">
      <li>Dana ditahan Adsentral sampai pesanan selesai; pesanan gagal → refund otomatis ke Saldo Belanja (bisa diminta cair ke rekening lewat CS).</li>
      <li>Biaya layanan pembayaran tidak dikembalikan; biaya aplikasi dikembalikan bila refund karena kesalahan penjual.</li>
      <li>Periksa produk segera: 24 jam setelah dikirim tanpa keluhan, pesanan dianggap diterima.</li>
    </ul>
    <p class="mt-1.5">
      Dengan checkout Anda menyetujui
      <NuxtLink to="/kebijakan-refund-garansi" target="_blank" class="text-primary-600 hover:underline">Kebijakan Refund &amp; Garansi</NuxtLink>
      dan
      <NuxtLink to="/syarat-ketentuan" target="_blank" class="text-primary-600 hover:underline">Syarat &amp; Ketentuan</NuxtLink>.
    </p>
  </div>
</template>
