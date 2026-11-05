# Temuan Pengujian E2E

Daftar bug dan potensi masalah yang ditemukan saat menulis tes Playwright (`tests/e2e/`).
Perbaikan dikerjakan setelah seluruh tes selesai ditulis. Saat memperbaiki sebuah temuan, ubah statusnya,
isi kolom "Perbaikan", dan tambahkan tes regresi bila memungkinkan.

Status: `TERBUKA` · `PERLU KONFIRMASI` (menyangkut aturan bisnis, tanya dulu) · `SELESAI`

## Progres

- **Sudah dites (135 tes):** login & guard rute, checkout, pembayaran buyer/admin, pesanan seller, transaksi buyer,
  garansi, withdrawal, pesanan admin (arbitrase/refund/selesaikan paksa), penalty, deposit & transfer saldo.
- **Belum dites (area pendukung):** chat, produk & stok seller, verifikasi seller, rekening bank, voucher, notifikasi,
  keuangan admin (`/admin/finance`), kategori/tipe akun, payment channel/method admin, system settings.
- **Rencana perbaikan:** dikerjakan setelah tes selesai. Mulai dari **F-20 + F-26** (pakai `rethrowApiError` di
  composable + `isStaleActionError` → reload di halaman), karena satu pola ini menutup banyak tes `test.fail`.
  Temuan `PERLU KONFIRMASI` ditanyakan dulu ke tim BE/bisnis sebelum diubah.
- **Keamanan:** file `editor` dulu berisi data akun (UID, password, 2FA, email) dan masih ada di riwayat git.
  Sudah dikosongkan; akun terkait perlu ganti password/2FA, dan riwayat bisa dibersihkan dengan `git filter-repo`
  bila disepakati.

## Ringkasan

| ID | Area | Judul | Prioritas | Status |
|---|---|---|---|---|
| F-01 | Login | Kredensial bocor ke URL jika form ter-submit sebelum hidrasi | Tinggi | SELESAI |
| F-02 | Login | Hydration mismatch di halaman `/login` | Rendah | TERBUKA |
| F-03 | Keranjang | `depositBalance` tidak reaktif, pengecekan saldo bisa memakai nilai lama | Sedang | TERBUKA |
| F-04 | Keranjang | Pengecekan saldo mengabaikan biaya aplikasi | Sedang | PERLU KONFIRMASI |
| F-05 | Pembayaran (buyer) | Nominal transfer di info rekening/WhatsApp ≠ Total Tagihan | Tinggi | PERLU KONFIRMASI |
| F-06 | Pembayaran (admin) | "Tolak" memanggil `/payment/cancel`, bukan `/payment/reject` | Sedang | PERLU KONFIRMASI |
| F-07 | Pembayaran (admin) | Filter "Semua Status" mengirim `status=ALL` ke BE | Sedang | TERBUKA |
| F-08 | Pembayaran (buyer) | Deposit berstatus `PAID` tidak menampilkan keterangan apa pun | Rendah | PERLU KONFIRMASI |
| F-09 | Pesanan seller | Tombol "Batalkan" (PAID) memanggil placeholder `addToCart` | Tinggi | TERBUKA |
| F-10 | Pesanan seller | Validasi pesan kosong memakai `window.alert()` | Rendah | TERBUKA |
| F-11 | Pesanan seller & transaksi buyer | Countdown UNPAID/PAID langsung "habis" bila `expired_at`/`paid_at` null | Sedang | TERBUKA |
| F-12 | Pesanan seller | Aksi permanen tanpa dialog konfirmasi (terima pesanan, terima pembatalan) | Sedang | PERLU KONFIRMASI |
| F-13 | Pesanan seller | Tolak 409 di halaman detail tidak menutup modal (daftar menutup) | Rendah | TERBUKA |
| F-14 | Pesanan seller | Tombol "Kirim Orderan" tetap muncul di DELIVERED/DONE/ARBITRAGE | Rendah | PERLU KONFIRMASI |
| F-15 | Pesanan seller | Kode mati di daftar pesanan (`handleReject`, tombol produk ACTIVE/INACTIVE) | Rendah | TERBUKA |
| F-16 | Transaksi buyer | Tombol "Batalkan", "Beli Lagi", "Tangguhkan" (daftar) memanggil placeholder `alert()` | Tinggi | TERBUKA |
| F-17 | Transaksi buyer | Form "Edit Penilaian" tidak terisi penilaian sebelumnya | Sedang | TERBUKA |
| F-18 | Transaksi buyer | Filter status buyer tidak punya `REJECT`, `REJECTED`, `CANCEL_REQUEST` | Rendah | PERLU KONFIRMASI |
| F-19 | Garansi buyer | `/guarantee` tidak dilindungi login (tidak ada di `authRequiredRoutes`) | Sedang | TERBUKA |
| F-20 | Garansi, withdrawal, penalty & deposit | Pesan error BE hilang (toast `[POST] "/backend/...": 409 Conflict` / "Conflict") & 409 tidak memuat ulang | Sedang | TERBUKA |
| F-21 | Garansi | Label/warna status garansi diduplikasi di 5 tempat dengan teks berbeda | Rendah | TERBUKA |
| F-22 | Withdrawal (admin) | Rumus "Potensi Anomali" menghitung saldo belanja (deposit) sebagai saldo yang bisa ditarik | Sedang | PERLU KONFIRMASI |
| F-23 | Withdrawal | `WD_FEE` diam-diam jatuh ke Rp 2.500 bila setting gagal dimuat; kartu statistik admin hanya dari halaman aktif | Sedang | PERLU KONFIRMASI |
| F-24 | Pesanan admin | Refund/Selesaikan gagal (400) menutup modal, alasan yang diketik hilang | Sedang | TERBUKA |
| F-25 | Pesanan admin | Tombol "Refund Transaksi"/"Selesaikan Transaksi" muncul di status final (REFUNDED, CANCELLED, REJECTED, EXPIRED) dan UNPAID | Sedang | PERLU KONFIRMASI |
| F-26 | API layer | Banyak composable GET membuang pesan BE (`err.message` → `[GET] "/backend/...": 400 Bad Request`); `fetchCreateOrderDiscussion` bisa crash di `err.response._data` | Sedang | TERBUKA |
| F-27 | Pesanan admin | Validasi pesan diskusi kosong memakai `window.alert()` (sama dengan F-10) | Rendah | TERBUKA |
| F-28 | Pesanan admin | Filter status admin tidak lengkap; teks konfirmasi "Cancel Arbitrage" tidak formal & tujuan statusnya belum jelas | Rendah | PERLU KONFIRMASI |
| F-29 | Penalty rule (admin) | Normalisasi Rule ID (kapital + underscore) tidak jalan; form edit menyimpan perubahan yang dibatalkan | Sedang | TERBUKA |
| F-30 | Manage penalty (admin) | Filter "Semua" mengirim `status=ALL`; status `WARNING` tampil "Normal" (hijau) | Sedang | TERBUKA |
| F-31 | Manage penalty (admin) | Poin & status di header slideover detail user tidak diperbarui setelah penalty dibatalkan; error detail tidak ditangani | Rendah | TERBUKA |
| F-32 | Penalty | Halaman `/admin/penalty-user` yatim (tanpa menu, duplikat `/admin/penalty`); statistik penalty user dihitung per halaman; rule target `BUYER` bisa dikenakan ke seller | Rendah | PERLU KONFIRMASI |
| F-33 | Deposit | Metode default `'QRIS'` bukan id metode mana pun → tombol "Deposit" nonaktif tanpa penjelasan | Rendah | TERBUKA |
| F-34 | Deposit | Riwayat deposit gagal dimuat tampil "Belum ada riwayat deposit"; ref `error` tidak pernah diisi | Sedang | TERBUKA |

---

## F-01 — Kredensial bocor ke URL jika form ter-submit sebelum hidrasi

- **Lokasi:** `app/components/form/login.vue`
- **Status:** SELESAI
- **Gejala:** Form memakai `action="#"` tanpa `@submit.prevent`, dan handler hanya terpasang di `@click` tombol.
  Jika tombol "Masuk" diklik atau Enter ditekan sebelum Vue selesai hidrasi (misalnya di koneksi lambat), browser
  mengirim form dengan GET. Hasilnya `/login?email=...&password=...`, sehingga password tersimpan di riwayat browser
  dan log server/proxy.
- **Perbaikan:** `<form method="post" novalidate @submit.prevent="loginHandler">`. Handler `@click.prevent` di tombol
  dihapus. `novalidate` dipakai agar validasi tetap lewat toast di `loginHandler`, bukan popup bawaan browser.
- **Tes regresi:** `auth.spec.ts` → "submit sebelum hidrasi tidak membocorkan kredensial ke URL" (bundle JS diblokir).
  Tes ini gagal pada kode lama dan lolos setelah perbaikan.

## F-02 — Hydration mismatch di halaman `/login`

- **Lokasi:** `app/pages/login/index.vue`, `app/components/form/login.vue`
- **Status:** TERBUKA
- **Gejala:** Console dev menampilkan `Hydration node mismatch` / `Hydration class mismatch` /
  `Hydration children mismatch` di `<FormLogin>`. HTML hasil SSR berbeda dengan render client.
  Saat ini tidak memecah fungsi, tetapi Vue harus membuang dan merender ulang node, dan berisiko menimbulkan bug UI.
- **Dugaan penyebab:** `definePageMeta()` dipanggil di dalam komponen `login.vue` (bukan halaman). Muncul peringatan
  "definePageMeta() is a compiler-hint helper ...". Perlu juga dicek apakah ada state yang berbeda antara server dan
  client, misalnya `systemSettingStore` untuk link "Lupa kata sandi?" yang hanya dimuat di client.
- **Cara reproduksi:** Buka `/login` di `npm run dev`, lihat console browser.

## F-03 — `depositBalance` tidak reaktif di halaman keranjang

- **Lokasi:** `app/pages/cart/index.vue:354`
- **Status:** TERBUKA
- **Gejala:** `const { depositBalance } = useBalanceStore()` men-destructure state Pinia, sehingga nilainya
  disalin satu kali saat setup dan tidak ikut berubah. `isSaldoInsufficient` memakai salinan ini.
  Jika saldo berubah selama halaman keranjang terbuka (login dari modal, `loadBalance({ force: true })`, top-up
  di tab lain lalu refresh store), tombol checkout tetap menilai berdasarkan saldo lama.
- **Saran perbaikan:** Pakai `balanceStore.depositBalance` langsung di computed (`balanceStore` sudah ada di file
  yang sama), atau `storeToRefs(useBalanceStore())`.
- **Tes yang perlu ditambahkan:** Buka keranjang dengan saldo kurang, ubah respons `/balance` lalu picu
  `loadBalance({ force: true })`. Tombol seharusnya berubah dari "Saldo Tidak Cukup" menjadi "Checkout".

## F-04 — Pengecekan saldo mengabaikan biaya aplikasi

- **Lokasi:** `app/pages/cart/index.vue`, computed `isSaldoInsufficient`
- **Status:** PERLU KONFIRMASI
- **Gejala:** Saldo dibandingkan dengan `cartStore.subTotal`, sedangkan "Order total" yang ditampilkan =
  subtotal + biaya aplikasi (`FEE_APP`, default Rp 1.000) − diskon voucher. Contoh: subtotal Rp 50.000 dan saldo
  Rp 50.000 → tombol Checkout aktif, padahal total yang ditampilkan Rp 51.000. Kemungkinan BE menolak, atau
  tampilan total yang menyesatkan.
- **Perlu dikonfirmasi:** Untuk pembayaran SALDO, apakah biaya aplikasi ikut dipotong dari saldo, dan apakah
  diskon voucher mengurangi jumlah yang dipotong? Jika ya, bandingkan dengan `orderTotal`. Catat aturannya di
  `docs/domain-glossary.md`.

## F-05 — Nominal transfer di info rekening/WhatsApp ≠ Total Tagihan

- **Lokasi:** `app/pages/payment/[id].vue` (blok "Informasi Rekening Pembayaran" dan computed `waLink`)
- **Status:** PERLU KONFIRMASI
- **Gejala:** Untuk `MANUAL_BANK`, teks "Transfer sejumlah Rp …" dan pesan WhatsApp memakai `payment.amount`.
  Padahal di kartu yang sama, "Total Tagihan" = `total_amount` (nominal + biaya aplikasi + kode unik − diskon).
  Contoh: amount 50.000, app_fee 1.000, kode unik 123 → Total Tagihan Rp 51.123, tetapi instruksi meminta
  transfer **Rp 50.000**. Akibatnya kode unik tidak ikut ditransfer (admin sulit mencocokkan mutasi) dan
  pembayaran kurang dari tagihan.
  Untuk deposit, "Saldo Masuk ke Akun" = amount + kode unik, tetapi instruksi transfer juga hanya `amount`.
- **Perlu dikonfirmasi:** Berapa nominal yang harus ditransfer buyer: `total_amount`? (Kemungkinan besar ya.)
  Jika ya, ganti ke `payment.total_amount ?? payment.amount` di kedua tempat, lalu tambahkan assertion di
  `payment.spec.ts` → "transfer manual: rincian, rekening, countdown & link WhatsApp".

## F-06 — "Tolak" memanggil `/payment/cancel`, bukan `/payment/reject`

- **Lokasi:** `app/pages/admin/payment/index.vue` & `app/pages/admin/payment/[id].vue` (`handleReject`)
- **Status:** PERLU KONFIRMASI
- **Gejala:** Tombol "Tolak" (dan toast "Pembayaran ditolak") memanggil `fetchCancelPayment` → `POST /payment/cancel/{id}`.
  `fetchRejectPayment` (`POST /payment/reject/{id}` dengan `reason`) ada di `composables/api/payment.ts` tetapi
  tidak pernah dipakai. Menurut `docs/domain-glossary.md`, `REJECTED` = admin menolak, `CANCELLED` = dibatalkan.
  Akibatnya payment yang "ditolak" admin kemungkinan berstatus `CANCELLED`, sehingga buyer melihat label
  "Deposit Dibatalkan" alih-alih "Admin menolak deposit", dan alasan penolakan tidak tercatat.
- **Perlu dikonfirmasi:** Apakah "Tolak" seharusnya memakai `/payment/reject` (dengan input alasan, misalnya
  `components/form/RejectTxModal.vue`)? Tes `payment.spec.ts` → "tolak pembayaran transaksi dari halaman detail"
  saat ini mengunci perilaku lama (`expect(calls).toEqual(['cancel'])`), jadi perbarui tes itu saat diperbaiki.
- **Terkait:** `uploadPaymentProof` (`POST /payment/proof/{id}`) juga tidak dipakai. Bukti transfer dikirim lewat
  WhatsApp, dan `payment_proof_url` hanya ditampilkan. Pastikan ini disengaja.

## F-07 — Filter "Semua Status" mengirim `status=ALL` ke BE

- **Lokasi:** `app/pages/admin/payment/index.vue:286` (`fetchAllPayments(..., filterStatus.value)`)
- **Status:** TERBUKA
- **Gejala:** Nilai default filter `'ALL'` diteruskan apa adanya, dan `status || undefined` di composable tidak
  menyaringnya. Request menjadi `GET /payment/all?status=ALL`. Halaman admin lain (finance, payment-channel,
  unprocessed payments) sudah mengubah `'ALL'` menjadi `undefined`. Jika BE tidak mengenal `ALL`, daftar bisa
  kosong atau error 400.
- **Saran perbaikan:** `filterStatus.value === 'ALL' ? '' : filterStatus.value`.
- **Pola serupa:** `app/pages/admin/penalty/index.vue:224` → `fetchPenaltyUsers(..., filterStatus.value)` juga
  mengirim `ALL`. Cek apakah BE penalty menerimanya.
- **Tes:** `payment.spec.ts` → 'filter "Semua Status" tidak mengirim parameter status' ditandai `test.fail()`.
  Hapus `test.fail()` setelah diperbaiki.

## F-08 — Deposit berstatus `PAID` tidak menampilkan keterangan apa pun

- **Lokasi:** `app/pages/payment/[id].vue` (blok "DEPOSIT ACTIONS")
- **Status:** PERLU KONFIRMASI
- **Gejala:** Blok status deposit menangani `UNPAID`, `DONE`/`COMPLETE`, `REJECTED`, dan `CANCELLED`. Status
  `PAID`, `IN_PROGRESS`, dan `EXPIRED` tidak punya keterangan, sehingga area itu kosong. Selain itu, `DONE` tidak
  tercantum di `docs/domain-glossary.md` (status payment: `UNPAID`, `IN_PROGRESS`, `PAID`/`COMPLETE`, `EXPIRED`,
  `CANCELLED`, `REJECTED`) maupun di `PaymentStatusBadge`.
- **Perlu dikonfirmasi:** Status apa saja yang mungkin untuk deposit, dan apakah `DONE` masih dipakai BE?

## F-09 — Tombol "Batalkan" pada pesanan PAID memanggil placeholder `addToCart`

- **Lokasi:** `app/pages/seller/order/[id].vue:90` (tombol) dan fungsi `addToCart` (sekitar baris 1118)
- **Status:** TERBUKA
- **Gejala:** Di header detail pesanan berstatus `PAID` ada tombol merah "Batalkan". Saat diklik, yang muncul hanya
  toast sukses "Produk berhasil ditambahkan ke keranjang", tanpa request ke BE. Seller bisa mengira pesanan sudah
  dibatalkan padahal tidak terjadi apa-apa, lalu batas 24 jam konfirmasi terlewat.
- **Saran perbaikan:** Hapus tombolnya (aksi yang setara sudah ada: "Tolak Pesanan" di blok "Respon Pesanan!"), atau
  arahkan ke `openRejectModal(transaction.id)`.
- **Tes:** `seller-order.spec.ts` → 'tombol "Batalkan" pada pesanan PAID ...' ditandai `test.fail()`.

## F-10 — Validasi pesan kosong memakai `window.alert()`

- **Lokasi:** `app/pages/seller/order/[id].vue` → `submitDiscussion` (`alert('Pesan tidak boleh kosong')`)
- **Status:** TERBUKA
- **Gejala:** Klik "Kirim Pesan" atau "Kirim Orderan" dengan pesan kosong memunculkan dialog native browser yang
  memblokir halaman. Ini tidak konsisten dengan pola toast di seluruh aplikasi (lihat `CLAUDE.md`: `useConfirm`/toast,
  bukan dialog browser).
- **Saran perbaikan:** `toast.add({ title: 'Pesan tidak boleh kosong', color: 'error' })`. Lebih baik lagi, nonaktifkan
  tombol saat pesan kosong. Cek apakah pola yang sama ada di halaman transaksi buyer (`pages/transaction/[id].vue`).
- **Tes:** `seller-order.spec.ts` → "kirim pesan kosong ditolak lewat toast, bukan alert browser" ditandai `test.fail()`.

## F-11 — Countdown langsung "habis" bila `expired_at` / `paid_at` null

- **Lokasi:** `app/pages/seller/order/[id].vue` → `updateCountdown` (UNPAID) dan `updateConfirmCountdown` (PAID)
- **Status:** TERBUKA
- **Gejala:** `countdownSeconds` diawali 0, dan `updateCountdown` langsung `return` jika `expired_at` null. Akibatnya
  transaksi UNPAID tanpa `expired_at` (data lama) langsung menampilkan **"Waktu Pembayaran Habis! Transaksi akan
  dibatalkan otomatis"**. Padahal menurut `docs/domain-glossary.md`, fallback-nya `created_at` + 24 jam (sudah
  diimplementasikan di `utils/paymentDeadline.ts` → `getPaymentExpiry`). Hal yang sama terjadi pada countdown
  konfirmasi PAID jika `paid_at` null ("Batas waktu konfirmasi habis!").
- **Saran perbaikan:** Pakai `getPaymentExpiry(transaction)` untuk UNPAID dan `getTxConfirmCountdown` (sudah dipakai
  di halaman daftar) untuk PAID, ditambah `usePaymentNow()`, sehingga logika countdown tidak diduplikasi di halaman.
  Halaman ini punya 7 timer `setInterval` sendiri-sendiri dengan pola yang sama, jadi layak dirapikan.
- **Halaman buyer juga terkena:** `app/pages/transaction/[id].vue` punya salinan `updateCountdown` yang sama. Di sisi
  buyer dampaknya lebih besar: selain pesan "Waktu Pembayaran Habis!", tombol **"Lakukan Pembayaran" ikut hilang**
  (`v-if="!isCountdownExpired"`), padahal transaksi masih bisa dibayar.
- **Tes:** `seller-order.spec.ts` → "UNPAID tanpa expired_at: countdown memakai created_at + 24 jam" dan
  `transaction.spec.ts` → "UNPAID tanpa expired_at: countdown created_at + 24 jam & tombol bayar tampil", keduanya
  ditandai `test.fail()`.

## F-12 — Aksi permanen tanpa dialog konfirmasi

- **Lokasi:** `app/pages/seller/order/index.vue` & `[id].vue` → "Terima Pesanan"; `[id].vue` → "Terima Permintaan
  Pembatalan" dan "Batalkan Permintaan Pembatalan". Di sisi buyer (`app/pages/transaction/[id].vue`), "Batalkan
  Permintaan Pembatalan" juga langsung jalan tanpa konfirmasi.
- **Status:** PERLU KONFIRMASI
- **Gejala:** Satu klik langsung memanggil BE, tanpa `useConfirm()`. "Terima Permintaan Pembatalan" bersifat final
  (transaksi dibatalkan dan dana dikembalikan), dan tombolnya bersebelahan dengan "Batalkan Permintaan Pembatalan".
  Kedua tombol memakai ikon `mdi:close-circle` dan label yang mirip, sehingga mudah salah klik.
- **Perlu dikonfirmasi:** Apakah aksi ini perlu dialog konfirmasi? Sebaiknya label tombol pembatalan juga diperjelas
  (misalnya "Tolak Pembatalan" / "Setujui Pembatalan") dan ikon tombol terima diganti.

## F-13 — Tolak pesanan 409 di halaman detail tidak menutup modal

- **Lokasi:** `app/pages/seller/order/[id].vue` → `handeRejectTxSubmit` (catch)
- **Status:** TERBUKA
- **Gejala:** Di halaman daftar, error basi (403/409) menutup modal "Tolak Pesanan" lalu memuat ulang. Di halaman
  detail, data dimuat ulang tetapi modal tetap terbuka, sehingga seller bisa menekan "Tolak Pesanan" lagi untuk
  transaksi yang statusnya sudah berubah.
- **Saran perbaikan:** Samakan dengan halaman daftar: `isRejectingTxModal.value = false` saat `isStaleActionError(err)`.

## F-14 — Tombol "Kirim Orderan" tetap muncul di DELIVERED/DONE/ARBITRAGE

- **Lokasi:** `app/pages/seller/order/[id].vue` → computed `showSendOrderButton`
- **Status:** PERLU KONFIRMASI
- **Gejala:** Tombol tampil untuk `IN_PROGRESS`, `DELIVERED`, `REJECT`, `ARBITRAGE`, dan `DONE`. Komentarnya berbunyi
  "hanya tampilkan tombol ... jika belum pernah kirim file order sebelumnya", tetapi kode tidak memeriksa `fileOrders`.
  Dialog konfirmasi menyebut "status transaksi akan berubah menjadi DELIVERED", padahal untuk `DONE`/`ARBITRAGE`
  perubahan itu kemungkinan tidak terjadi atau tidak diinginkan.
- **Perlu dikonfirmasi:** Di status mana seller boleh mengirim ulang orderan? (`REJECT` = "Perlu Diperbaiki"
  kemungkinan memang perlu.)

## F-15 — Kode mati di daftar pesanan seller

- **Lokasi:** `app/pages/seller/order/index.vue`
- **Status:** TERBUKA
- **Gejala:** Fungsi `handleReject` dan state `isRejectingModal` tidak pernah dipakai (yang terpakai
  `handeRejectTxSubmit`). Tombol "Aktifkan Product" / "Tangguhkan Product" dicek terhadap `tx.status === 'INACTIVE'/'ACTIVE'`,
  padahal itu status produk, bukan status transaksi, jadi tombol tersebut tidak pernah tampil dan tidak punya handler.
  `console.log('OPEN MODAL', ...)` juga masih tertinggal di kedua halaman.
- **Saran perbaikan:** Hapus kode yang tidak terpakai.

## F-16 — Tombol aksi buyer memanggil placeholder `alert()`

- **Lokasi:** `app/pages/transaction/index.vue` → `addToCart`; `app/pages/transaction/[id].vue` → `addToCart`
- **Status:** TERBUKA
- **Gejala:** Fungsi `addToCart` hanya berisi `alert('Add to cart clicked!')`, tetapi dipakai oleh:
  - daftar transaksi: "Beli Lagi" (DONE/COMPLETE), **"Batalkan"** (UNPAID), dan **"Tangguhkan"** (DELIVERED/DONE);
  - detail transaksi: "Beli Lagi" dan **"Batalkan"** (UNPAID).

  Buyer mengira transaksinya dibatalkan atau ditangguhkan, padahal tidak ada request ke BE. Alert bawaan browser juga
  berbahasa Inggris. "Tangguhkan" di halaman detail sudah benar (membuka `RequestArbitrageModal`), jadi di daftar
  cukup diarahkan ke detail atau memakai modal yang sama.
- **Saran perbaikan:** "Tangguhkan" di daftar → buka modal arbitrase atau tautkan ke detail. "Beli Lagi" → tambah
  produk ke keranjang lewat `cartStore`. "Batalkan" (UNPAID) → perlu endpoint batal transaksi UNPAID dari BE; jika
  belum ada, sembunyikan tombolnya (transaksi akan `EXPIRED` sendiri).
- **Tes:** `transaction.spec.ts` → "tombol \"Batalkan\" & \"Tangguhkan\" di daftar tidak memunculkan alert placeholder"
  ditandai `test.fail()`.

## F-17 — Form "Edit Penilaian" tidak terisi penilaian sebelumnya

- **Lokasi:** `app/pages/transaction/[id].vue` → `reviewRequest`, `handleReviewUpdate`
- **Status:** TERBUKA
- **Gejala:** `reviewRequest` diinisialisasi `{ rating: 5, comment: '' }` dan tidak pernah diisi dari `reviews`. Jika
  buyer sudah memberi penilaian (misalnya ⭐3 "Lumayan"), form edit tetap menampilkan ⭐5 dengan komentar kosong. Klik
  "Edit Penilaian" tanpa mengubah apa pun akan menimpa penilaian lama dengan ⭐5 dan komentar kosong. Tidak ada validasi
  komentar kosong di form baru maupun edit.
- **Catatan lain:**
  - Deteksi review buyer memakai `reviews[0]` / `reviews[1]` saja; lebih aman `reviews.find(r => r.user_type === 'BUYER')`.
  - `ConfirmDialog` "Selesaikan Pesanan" diberi `:error="rejectOrderError"`; error penolakan bisa tampil di dialog ini.
  - Fallback `tx_description ?? "Tidak ada ..."` tidak berlaku untuk string kosong (`''`), sehingga kotak alasan kosong.
- **Saran perbaikan:** Isi `reviewRequest` dari review buyer lewat `watch(reviews, ...)`, dan nonaktifkan tombol kirim
  jika komentar kosong.
- **Tes:** `transaction.spec.ts` → "edit penilaian: form terisi penilaian sebelumnya" ditandai `test.fail()`.

## F-18 — Filter status buyer tidak lengkap

- **Lokasi:** `app/utils/txStatusFilter.ts` → `buyerTxStatusFilters`
- **Status:** PERLU KONFIRMASI
- **Gejala:** Opsi filter buyer tidak memuat `REJECT` (buyer menolak hasil kiriman), `REJECTED` (seller menolak), dan
  `CANCEL_REQUEST` (buyer mengajukan batal). Ketiganya status yang dialami buyer, tetapi tidak bisa difilter.
- **Perlu dikonfirmasi:** Apakah sengaja disembunyikan, dan apakah endpoint `/tx/buyer` menerima ketiga status itu?

## F-19 — `/guarantee` tidak dilindungi login

- **Lokasi:** `app/middleware/auth-redirect.global.ts` → `authRequiredRoutes`
- **Status:** TERBUKA
- **Gejala:** Halaman `/guarantee` dan `/guarantee/[id]` butuh login, tetapi tidak ada di daftar. Pengunjung yang klik
  "Klaim Garansi" di footer tetap di halaman itu. Hasilnya bergantung pada respons BE: error di halaman, atau redirect
  401 dari `useApi` tanpa `?redirect=` sehingga setelah login tidak kembali ke halaman garansi.
- **Saran perbaikan:** Tambahkan `'/guarantee'` ke `authRequiredRoutes` (sesuai catatan di `CLAUDE.md`).
- **Tes:** `guarantee.spec.ts` → "pengunjung yang membuka /guarantee diarahkan ke login" ditandai `test.fail()`.
- **`/penalty` juga tidak ada di daftar.** Saat ini pengunjung tetap diarahkan ke `/login` karena BE membalas 401 dan
  `useApi` menanganinya, tapi tanpa `?redirect=` dan setelah halaman sempat tampil. Tambahkan `'/penalty'` sekalian.
  Tes `penalty.spec.ts` → "pengunjung yang membuka /penalty diarahkan ke login (lewat 401 BE)" lolos karena perilaku
  401 itu.

## F-20 — Pesan error BE pada aksi garansi hilang

- **Lokasi:** `app/composables/api/guarantee.ts` (semua mutasi: `fetchCreateGuarantee`, `fetchReviewGuarantee`,
  `fetchSendGuarantee`, `sendGuaranteeViaStock`); `app/pages/seller/guarantee/[id].vue`, `app/pages/transaction/[id].vue`
- **Status:** TERBUKA
- **Gejala:** Mutasi garansi tidak memakai `.catch(rethrowApiError(...))`, dan halaman menampilkan `err.message`. Untuk
  respons 4xx, isi toast menjadi teks teknis ofetch, misalnya **`Gagal [POST] "/backend/seller/guarantee/G-1/review": 409
  Conflict`**. Pesan BE (misalnya "Masa garansi produk sudah berakhir" atau "Klaim sudah diproses") tidak tampil. Selain
  itu, 403/409 (klaim sudah diproses otomatis atau sudah kena penalty) tidak memuat ulang data, sehingga tombol
  "Terima/Tolak Klaim" tetap tampil. Hanya `handleDoneViaStock` yang membaca `err.data?.message`.
- **Saran perbaikan:** Tambahkan `.catch(rethrowApiError('...'))` di composable, lalu di halaman panggil `refresh()` jika
  `isStaleActionError(err)`, seperti pola di `transaction.ts`.
- **Withdrawal juga terkena:** `cancelWithdrawal`, `approveWithdrawal`, `rejectWithdrawal` (`balance.ts`,
  `admin-withdrawal.ts`) tidak memakai `rethrowApiError`, dan halaman menampilkan `err.statusMessage`. Hasilnya hanya
  **"Conflict"** / "Bad Request". Contoh: seller membatalkan penarikan yang baru saja diproses admin → toast "Gagal
  Membatalkan — Conflict", dan tombol "Batalkan" tetap tampil karena riwayat tidak dimuat ulang. Hanya `fetchWithdrawal`
  (ajukan) yang sudah benar. `fetchBalanceTransfer` juga belum.
- **Penalty juga terkena:** semua mutasi di `penalty.ts` dan `penalty-rule.ts` (`applyPenalty`, `cancelPenalty`,
  `createPenaltyRule`, `updatePenaltyRule`, `fetchTogglePenaltyRule`) tidak memakai `rethrowApiError`, dan halaman
  menampilkan `err.statusMessage`. Contoh: membuat rule dengan ID yang sudah dipakai (409 "Rule ID sudah dipakai")
  hanya menampilkan "Gagal membuat rule — Conflict".
- **Deposit & transfer saldo juga terkena:** `fetchDepositBalance`, `fetchDepositCancel`, `fetchBalanceTransfer`
  (`balance.ts`) tidak memakai `rethrowApiError`.
  - Deposit ditolak BE (mis. "Masih ada deposit yang belum dibayar") hanya menampilkan "Deposit Gagal — Bad Request".
  - Batalkan deposit yang ternyata sudah dibayar (409) menampilkan teks generik "Lakukan refresh, lalu coba lagi"
    tanpa pesan BE, dan riwayat tidak dimuat ulang sehingga tombol "Batalkan" dan "Lanjut Bayar" tetap tampil.
  - Transfer saldo ditolak BE menampilkan "Bad Request" di form.
- **Tes:** `guarantee.spec.ts` → "klaim ditolak BE: pesan BE tampil di toast" dan "terima klaim basi (409): pesan BE
  tampil & data dimuat ulang"; `withdrawal.spec.ts` → "batalkan penarikan basi (409): pesan BE tampil & riwayat dimuat
  ulang" dan "tandai selesai basi (409): pesan BE tampil"; `penalty.spec.ts` → "tambah rule dengan ID duplikat (409)
  menampilkan pesan BE"; `balance.spec.ts` → "deposit ditolak BE (400)...", "batalkan deposit yang sudah dibayar
  (409)...", dan "transfer ditolak BE (400)...". Semuanya ditandai `test.fail()`.

## F-21 — Label status garansi diduplikasi

- **Lokasi:** `statusLabel`/`statusColor` di `app/pages/guarantee/index.vue`, `guarantee/[id].vue`,
  `seller/guarantee/index.vue`, `seller/guarantee/[id].vue`, dan `guaranteeStatusLabel` di `transaction/[id].vue`
- **Status:** TERBUKA
- **Gejala:** Tidak ada `GuaranteeStatusBadge`, sehingga mapping dibuat ulang di lima tempat, bertentangan dengan
  konvensi `*StatusBadge`. Teksnya pun berbeda: `IN_REVIEW` = "Sedang Ditinjau" (detail transaksi) / "Menunggu Review
  Seller" (halaman garansi buyer); `IN_PROGRESS` = "Diproses" / "Sedang Diproses". Logika countdown dan `downloadFile`
  juga diduplikasi.
- **Catatan lain:** `refresh()` di `seller/guarantee/[id].vue` mengganti seluruh halaman dengan skeleton setiap selesai
  aksi. Ada juga typo "Kirim garansi garansi sebelum ..." di pesan countdown IN_PROGRESS.
- **Saran perbaikan:** Buat `components/app/GuaranteeStatusBadge.vue` (label buyer/seller lewat prop bila perlu), lalu
  pakai di kelima tempat.

## F-22 — Rumus "Potensi Anomali" withdrawal

- **Lokasi:** `app/pages/admin/withdrawal/[id].vue` → `isAnomalous`
- **Status:** PERLU KONFIRMASI
- **Gejala:** Estimasi saldo yang bisa ditarik = total transaksi `COMPLETE` + **total deposit `PAID`** − total
  **`amount_received`** penarikan `COMPLETED`. Ada dua hal yang janggal jika dibandingkan dengan `docs/domain-glossary.md`:
  1. Deposit masuk ke **Saldo Belanja**, yang "hanya bisa dipakai belanja" dan tidak bisa ditarik. Menambahkannya membuat
     seller yang banyak top up tidak pernah terdeteksi anomali.
  2. Yang dipotong dari saldo jualan saat penarikan adalah `amount` (termasuk biaya admin), bukan `amount_received`.
     Estimasi menjadi terlalu besar sebesar total `WD_FEE`.

  Selain itu, transfer saldo jualan → belanja (`SALES_TO_DEPOSIT_TRANSFER`) dan penarikan `PENDING` lain tidak
  diperhitungkan. Perlu dicek juga apakah `total_amount` transaksi sudah dikurangi fee aplikasi.
- **Perlu dikonfirmasi:** Rumus yang benar menurut BE. Opsi yang lebih sederhana: pakai `sales_balance` + `sales_held`
  seller langsung dari BE.
- **Tes:** `withdrawal.spec.ts` → "detail: peringatan anomali ..." hanya menguji kasus deposit 0 (rumus saat ini).

## F-23 — `WD_FEE` fallback diam-diam & statistik admin per halaman

- **Lokasi:** `app/components/form/Withdrawal.vue`, `app/pages/admin/withdrawal/index.vue`, `[id].vue` → `wdFee`
- **Status:** PERLU KONFIRMASI
- **Gejala:**
  - Jika `/system/settings/public` atau `/system/settings/all` gagal dimuat, atau `WD_FEE` tidak ada, `wdFee` diam-diam
    bernilai **2500**. Di sisi admin, nilai ini **dikirim ke BE** sebagai `admin_fee` saat "Tandai Transfer Selesai".
    Akibatnya biaya yang dipotong bisa berbeda dari setting tanpa ada peringatan. Lebih aman jika BE yang menentukan
    fee, atau tombol dinonaktifkan sampai setting termuat.
  - Kartu statistik di `/admin/withdrawal` ("Menunggu", "Selesai", "Ditolak", "Total Dicairkan") dihitung dari isi
    **halaman aktif** saja, setelah filter. Contoh: dengan filter "Menunggu", "Selesai" selalu 0, dan "Total Dicairkan"
    hanya untuk 20 baris pertama.
  - Ringan: `useSystemSettingApi` di-import dua kali di `admin/withdrawal/index.vue`. `handleFilter` memanggil
    `refresh()` padahal `watch` sudah memicu fetch, sehingga request terkirim ganda.
- **Perlu dikonfirmasi:** Siapa sumber kebenaran `admin_fee` (FE atau BE)? Apakah ada endpoint ringkasan statistik
  withdrawal?

## F-24 — Refund/Selesaikan gagal menutup modal & alasan hilang

- **Lokasi:** `app/pages/admin/order/[id].vue` → `handleRefundTxSubmit`, `handleCompleteTxSubmit`
- **Status:** TERBUKA
- **Gejala:** Kedua handler menutup modal di blok `finally`, jadi modal juga tertutup saat BE menolak dengan 400
  (mis. "Saldo escrow seller tidak mencukupi"). Pesan hanya tampil sebagai toast. Admin harus membuka ulang modal dan
  mengetik ulang alasannya. Prop `:error` (`refundTxError`, `completexError`) tidak pernah diisi, jadi pesan di dalam
  modal tidak pernah muncul.
- **Usulan:** Tutup modal hanya saat berhasil atau saat `isStaleActionError` (status sudah berubah). Untuk error lain,
  isi `refundTxError`/`completexError` dengan `apiErrorMessage(err)` dan biarkan modal terbuka.
- **Tes:** `admin-order.spec.ts` → "refund 400: modal tetap terbuka..." (`test.fail`).

## F-25 — Tombol Refund/Selesaikan muncul di status final

- **Lokasi:** `app/pages/admin/order/[id].vue` → tombol "Refund Transaksi" & "Selesaikan Transaksi" (`v-if="status !== 'COMPLETE'"`)
- **Status:** PERLU KONFIRMASI
- **Gejala:** Tombol hanya disembunyikan untuk `COMPLETE`. Transaksi yang sudah `REFUNDED`, `CANCELLED`, `REJECTED`,
  atau `EXPIRED` tetap menampilkan "Refund Transaksi" dan "Selesaikan Transaksi", begitu juga `UNPAID` (belum ada uang
  yang bisa direfund). Jika BE tidak menolak, transaksi bisa direfund dua kali atau "diselesaikan" setelah direfund.
  `docs/domain-glossary.md` saat ini menulis "selain `COMPLETE`", sesuai kode, tapi kemungkinan besar maksudnya hanya
  status yang uangnya masih di escrow.
- **Perlu dikonfirmasi:** Status apa saja yang boleh di-refund dan diselesaikan paksa oleh admin? Setelah itu perbarui
  `v-if` dan glossary.
- **Tes:** `admin-order.spec.ts` → "status final (REFUNDED) tidak menampilkan tombol..." (`test.fail`).

## F-26 — Composable GET membuang pesan error BE

- **Lokasi:** `app/composables/api/transaction.ts` (`fetchBuyerTransactions`, `fetchTxSeller`, `fetchAllTx`),
  `order-discussion.ts`, `review.ts`, `product.ts`, `chat.ts`, `merchant.ts`, `system-setting.ts`, `auth.ts`
- **Status:** TERBUKA
- **Gejala:**
  - Pola `catch (err) { throw createError({ statusMessage: err.message }) }` memakai pesan ofetch, bukan pesan BE.
    Contoh di `/admin/order` saat BE membalas 400 "Status tidak valid": alert tampil
    `Terjadi Kesalahan [GET] "/backend/tx/all?page=0&size=10&keyword": 400 Bad Request`.
  - `fetchCreateOrderDiscussion` membaca `err.response._data.message`. Jika error berasal dari `createError` di dalam
    `try` (respons `status !== 'success'`) atau dari gangguan jaringan, `err.response` undefined dan muncul
    `TypeError`, bukan pesan yang jelas.
- **Usulan:** Ganti dengan `.catch(rethrowApiError('fallback'))` seperti fungsi mutasi di `transaction.ts`. Ini satu
  perbaikan untuk seluruh pola, sejalan dengan F-20.
- **Tes:** `admin-order.spec.ts` → "error BE pada daftar menampilkan pesan BE" (`test.fail`).

## F-27 — Validasi pesan diskusi admin memakai `window.alert()`

- **Lokasi:** `app/pages/admin/order/[id].vue` → `submitDiscussion`
- **Status:** TERBUKA
- **Gejala:** Sama dengan F-10 di halaman seller. Klik "Kirim Pesan" dengan textarea kosong memunculkan dialog browser
  `alert('Pesan tidak boleh kosong')`. Sebaiknya tampilkan toast atau pesan di bawah textarea, atau nonaktifkan tombol
  saat pesan kosong. Kemungkinan ada di halaman buyer juga; perbaiki sekaligus.
- **Tes:** `admin-order.spec.ts` → "pesan kosong divalidasi tanpa alert() browser" (`test.fail`).

## F-28 — Filter status admin tidak lengkap & teks Cancel Arbitrage

- **Lokasi:** `app/pages/admin/order/index.vue`, `app/pages/admin/order/[id].vue` → `handleCancelArbitrage`
- **Status:** PERLU KONFIRMASI
- **Gejala:**
  - `statusOptions` admin tidak punya `DELIVERED`, `REJECT`, `CANCEL_REQUEST`, `REFUNDED`, `COMPLETE`, `EXPIRED`.
    Opsi "Selesai" memakai `DONE`, padahal `COMPLETE` juga berlabel "Selesai". Sebaiknya pakai ulang opsi dari
    `utils/txStatusFilter.ts` (lihat juga F-18).
  - `handleFilter` memanggil `refresh()` padahal `watch` sudah memicu fetch, sehingga request terkirim ganda (sama
    dengan F-23).
  - Kode mati: tombol Terima/Tolak di daftar dikomentari, tapi `handleConfirmOrder`, `handleReject`, dan
    `RejectTxModal` masih ada.
  - Dialog "Cancel Arbitrage" berteks "Tidak bisa dibatalkan lhooo. Yakin?" dan label tombol campur Inggris
    ("Cancel Arbitrage", "Order Detail"). Toast sukses "silahkan lakukan konfirmasi pesanan" juga tidak menyebut ke
    status apa transaksi kembali.
  - Bubble diskusi admin menampilkan badge "Penjual Mengirim Pesanan" untuk tipe `ORDER_DELIVERY`. Jika admin yang
    mengirim, labelnya menyesatkan.
- **Perlu dikonfirmasi:** Status tujuan `PATCH /tx/cancel/arbitrage` (glossary masih "⚠️ perlu konfirmasi"), dan opsi
  filter apa saja yang dibutuhkan admin.

## F-29 — Form penalty rule: normalisasi ID tidak jalan & form edit basi

- **Lokasi:** `app/components/form/PenaltyRuleModal.vue` (input Rule ID), `app/components/form/PenaltyRuleEditModal.vue`
- **Status:** TERBUKA
- **Gejala:**
  - Input Rule ID punya `@input` yang mengubah nilai ke huruf kapital dan spasi ke underscore. Listener itu berjalan
    sebelum `v-model` UInput memperbarui nilai, sehingga yang dikonversi adalah nilai lama, lalu langsung ditimpa nilai
    DOM. Hasilnya, mengetik `seller late` tetap menjadi `seller late` dan terkirim apa adanya ke BE. Hint "Huruf
    kapital, pisahkan kata dengan underscore" tidak ditegakkan, dan validasi juga tidak mengecek format.
  - Modal edit hanya mengisi form saat prop `rule` berubah (`watch(() => props.rule)`). Jika admin mengubah poin, klik
    "Batal", lalu membuka "Edit" rule yang sama, form masih berisi nilai yang dibatalkan (mis. 99). Jika admin lalu
    klik simpan, nilai itu ikut tersimpan.
- **Usulan:** Normalisasi lewat `watch(() => localForm.id)` atau `@update:model-value`, ditambah validasi regex
  `^[A-Z0-9_]+$`. Untuk modal edit, isi ulang form saat modal dibuka (`watch(() => props.modelValue)`), seperti
  `PenaltyRuleModal`.
- **Ringan:** Kartu statistik "Aktif", "Berlaku ke Seller", "Trigger Otomatis" dihitung dari halaman aktif saja
  (default 5 per halaman), sedangkan "Total Rule" dari `total_elements`.
- **Tes:** `penalty.spec.ts` → "Rule ID yang diketik dinormalisasi..." dan "edit dibatalkan lalu dibuka lagi..."
  (`test.fail`).

## F-30 — Manage penalty: `status=ALL` terkirim & WARNING tampil "Normal"

- **Lokasi:** `app/pages/admin/penalty/index.vue`, `app/components/form/PenaltyUserDetailSlideover.vue`,
  `app/pages/admin/penalty-user/index.vue` → `suspendLabel`/`suspendColor`
- **Status:** TERBUKA
- **Gejala:**
  - `filterStatus` default `'ALL'`, dan `fetchPenaltyUsers` hanya membuang string kosong, jadi `status=ALL` selalu
    terkirim ke BE (sama dengan F-07). Jika BE memvalidasi enum, daftar gagal dimuat.
  - `suspendLabel` dan `suspendColor` tidak menangani `WARNING`. User berstatus peringatan tampil **"Normal"** dengan
    warna hijau, padahal di filter ada opsi "Peringatan" dan `BuyerPenaltyBanner` menampilkan "Peringatan Penalty".
    Mapping ini juga diduplikasi di 3 file; sebaiknya dijadikan satu komponen `SuspendStatusBadge`.
  - `handleFilter` dan pencarian memanggil `refresh()` sambil mengubah `page`, yang juga di-`watch`, sehingga
    request bisa terkirim dua kali.
- **Tes:** `penalty.spec.ts` → "filter \"Semua\" tidak mengirim status=ALL ke BE" dan "status WARNING tampil
  \"Peringatan\"..." (`test.fail`).

## F-31 — Slideover detail user tidak diperbarui setelah batalkan penalty

- **Lokasi:** `app/components/form/PenaltyUserDetailSlideover.vue`, `app/pages/admin/penalty/index.vue` → `selectedUser`
- **Status:** TERBUKA
- **Gejala:**
  - Header slideover (poin aktif, status suspend) memakai objek `selectedUser` yang disalin saat baris diklik.
    Setelah penalty dibatalkan, riwayat dan daftar di belakangnya dimuat ulang, tetapi header tetap menampilkan poin
    lama (mis. tetap 10 padahal penalty sudah habis).
  - `loadDetail` tidak punya `catch`. Jika `/admin/penalty/user/{id}` gagal, muncul unhandled rejection dan slideover
    menampilkan "Tidak ada riwayat penalty.", seolah user bersih.
- **Usulan:** Setelah `penalty-cancelled`, ambil ulang user dari hasil refresh (cari berdasarkan `user.id`), atau
  sediakan endpoint stat per user. Tampilkan state error di slideover.
- **Tes:** `penalty.spec.ts` → "detail user: poin aktif di header ikut berubah..." (`test.fail`).

## F-32 — Halaman penalty-user yatim & aturan pengenaan penalty

- **Lokasi:** `app/pages/admin/penalty-user/index.vue`, `app/components/form/ApplyPenaltyModal.vue`,
  `app/pages/penalty/index.vue`, `app/pages/seller/penalty/index.vue`
- **Status:** PERLU KONFIRMASI
- **Gejala:**
  - `/admin/penalty-user` tidak ada di menu `layouts/admin.vue`, dan isinya hampir sama dengan `/admin/penalty`
    (default filter `NONE`, tanpa tombol kenakan penalty). Kemungkinan halaman lama; `docs/api-map.md` masih
    mencantumkannya.
  - Modal "Kenakan Penalty" menampilkan semua rule aktif tanpa melihat role user. Rule ber-`target_role` `BUYER` bisa
    dikenakan ke seller dan sebaliknya. Atribut `:disabled="!rule.is_active"` juga tidak berguna karena rule nonaktif
    sudah difilter.
  - Rule untuk modal diambil `fetchAllPenaltyRules(0, 100)`. Rule ke-101 dan seterusnya tidak bisa dipilih.
  - Kartu "Masih Aktif", "Kedaluwarsa", dan "Poin Aktif" di `/penalty` dan `/seller/penalty` dihitung dari halaman
    aktif (20 baris). Untuk user dengan banyak penalty, "Poin Aktif" bisa berbeda dari banner, yang memakai
    `/user/penalty/stat`. Sebaiknya kartu poin memakai stat yang sama.
  - Penalty yang dibatalkan admin: apakah masih dikembalikan BE di `/user/penalty`? Jika ya, FE tidak membedakannya
    dari yang aktif atau kedaluwarsa.
- **Perlu dikonfirmasi:** Hapus `/admin/penalty-user`? Apakah rule harus dibatasi sesuai role user?

## F-33 — Form deposit: metode default tidak valid

- **Lokasi:** `app/components/form/Deposit.vue` → `selectedPayment = ref('QRIS')`
- **Status:** TERBUKA
- **Gejala:** `QRIS` adalah kode **channel** milik metode `TRIPAY`, bukan id metode. Saat form dibuka, tidak ada metode
  yang tampil terpilih, dan tombol "Deposit" nonaktif tanpa pesan apa pun. Pesan "Pilih metode pembayaran" di
  `validate()` tidak pernah muncul karena tombol sudah nonaktif lebih dulu. Watcher auto-pilih channel di
  `PaymentMethodSelector` juga tidak berjalan.
- **Usulan:** Default `selectedPayment` ke `null` dan tampilkan petunjuk "Pilih metode pembayaran". Alternatifnya,
  pilih otomatis metode pertama hasil filter setelah `fetchPaymentMethod`. Jika maksudnya QRIS sebagai default, set
  `selectedPayment = 'TRIPAY'` dan `selectedChannel = 'QRIS'`.
- **Ringan:**
  - `fetchPaymentMethod` memakai `$fetch` mentah, bukan `useApi`.
  - Biaya channel dihitung di FE (`fee_flat + fee_percent`). Pastikan sama dengan total dari BE, seperti F-05.
- **Tes:** `balance.spec.ts` → "deposit tanpa metode terpilih..." (`test.fail`).

## F-34 — Riwayat deposit gagal dimuat tampil sebagai kosong

- **Lokasi:** `app/pages/balance/index.vue`
- **Status:** TERBUKA
- **Gejala:**
  - Template mengecek `error`, yaitu `ref(null)` lokal yang tidak pernah diisi. `errorDepositHistory` dari
    `useAsyncData` tidak dipakai. Jika `/balance/deposit/history` gagal (500, timeout), halaman menampilkan
    "Belum ada riwayat deposit", seolah user belum pernah top up. Mutasi saldo juga tidak punya state error.
  - Ringan: `UPagination` riwayat deposit selalu tampil walau hanya 1 halaman (tidak ada cek `total_pages > 1`,
    beda dengan mutasi saldo). `handleDepositSuccess` tidak dipakai. Ada `v-else="balanceLoading"` yang keliru
    (tidak berpengaruh). `fetchDepositCancel` masih punya `console.log(res)`.
- **Usulan:** Pakai `errorDepositHistory` dengan `apiErrorMessage`, dan tambahkan state error untuk mutasi saldo.
- **Tes:** `balance.spec.ts` → "riwayat deposit gagal dimuat..." (`test.fail`).

