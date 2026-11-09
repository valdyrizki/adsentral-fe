# Progres Pengujian E2E

Daftar lengkap modul, halaman, dan fungsi yang perlu dites E2E (Playwright, `tests/e2e/`), beserta statusnya.
Sumber daftar: semua halaman di `app/pages/` dan semua fungsi di `docs/api-map.md`.
Detail bug ada di `docs/test-findings.md` (ID `F-xx`).

**Legenda**

| Simbol | Arti |
|---|---|
| ✅ | Sudah dites, lolos |
| 🐞 | Sudah dites, ada bug yang diketahui (`test.fail` + ID temuan) |
| ⬜ | Belum dites |
| ➖ | Tidak perlu E2E khusus (halaman statis / tidak dipakai di UI) |

Prioritas untuk yang belum dites: **P1** (alur uang/status, wajib), **P2** (fitur utama pendukung), **P3** (tampilan/admin jarang dipakai).

Saat menambah tes: ubah status di sini, perbarui ringkasan, dan catat bug baru di `docs/test-findings.md`.

---

## Ringkasan

| # | Modul | Spec | Status | Prioritas sisa | Catatan |
|---|---|---|---|---|---|
| 1 | Auth: login & guard rute | `auth.spec.ts` | Sebagian | P1 (register, logout, refresh token) | F-01 (kredensial bocor ke URL) sudah diperbaiki. F-02 hydration mismatch `/login` belum dites. `/guarantee` lolos tanpa login (F-19). |
| 2 | Profil buyer | — | ⬜ | P2 | Halaman sederhana: tampil profil + `updateProfile`. |
| 3 | Katalog publik (beranda, kategori, produk, merchant, pencarian) | — | ⬜ | P2 | Halaman SSR; data publik juga lewat mock BE SSR (`mock-backend.mjs`), bukan hanya `mockApi`. Detail produk adalah pintu masuk keranjang. |
| 4 | Keranjang & checkout | `checkout.spec.ts` | ✅ | — | Cek saldo memakai nilai lama (F-03) dan mengabaikan biaya aplikasi (F-04, perlu konfirmasi). Belum: ubah qty/hapus item, multi-merchant. |
| 5 | Pembayaran buyer | `payment.spec.ts` | Sebagian | P2 (daftar `/payment`) | Nominal transfer ≠ Total Tagihan (F-05, prioritas tinggi, perlu konfirmasi). Deposit `PAID` tanpa keterangan (F-08). |
| 6 | Transaksi buyer | `transaction.spec.ts` | 🐞 | — | Tombol daftar memanggil `alert()` placeholder (F-16, tinggi). Edit penilaian kosong (F-17). Countdown `expired_at` null (F-11). Filter status kurang (F-18). |
| 7 | Garansi (buyer & seller) | `guarantee.spec.ts` | 🐞 | — | Pesan error BE hilang & 409 tidak reload (F-20). `/guarantee` tanpa guard (F-19). Label status diduplikasi di 5 tempat (F-21). |
| 8 | Saldo, deposit & transfer | `balance.spec.ts` | 🐞 | — | Metode default `'QRIS'` tidak valid (F-33). Riwayat gagal tampil "kosong" (F-34). Error BE hilang (F-20). |
| 9 | Penalty (buyer, seller, admin) | `penalty.spec.ts` | 🐞 | P3 (`/admin/penalty-user`) | Normalisasi ID & form edit basi (F-29). `status=ALL` & WARNING tampil "Normal" (F-30). Slideover basi (F-31). Halaman yatim & rule BUYER bisa ke seller (F-32). |
| 10 | Pesanan seller | `seller-order.spec.ts` | 🐞 | — | "Batalkan" PAID memanggil `addToCart` (F-09, tinggi). `alert()` pesan kosong (F-10). Belum: seller ajukan arbitrase, kirim via file/stok. |
| 11 | Penarikan dana & rekening bank seller | `withdrawal.spec.ts` | Sebagian | P1 (rekening bank) | `WD_FEE` diam-diam jatuh ke Rp 2.500 (F-23). Batal basi 409 (F-20). Halaman `/seller/bank-account` belum dites. |
| 12 | Produk seller | — | ⬜ | P1 | Upload gambar perlu file fixture (maks 5 MB, JPG/PNG, ≤1500×1500). Form memakai rich text TipTap & setting publik. |
| 13 | Stok seller | — | ⬜ | P1 | Bulk akun/file memakai alur cek `dryRun` lalu simpan; cek duplikat di `useStockDuplicateCheck`. |
| 14 | Verifikasi seller & daftar merchant | — | ⬜ | P1 | `registerMerchant` & verifikasi dikirim sebagai FormData (upload dokumen). |
| 15 | Dashboard & profil toko seller | — | ⬜ | P3 | Riwayat penalty di dashboard sudah tercakup `penalty.spec.ts`. |
| 16 | Pesanan admin (arbitrase, refund) | `admin-order.spec.ts` | 🐞 | P3 (dashboard admin) | Refund 400 menutup modal (F-24). Tombol muncul di status final (F-25). GET membuang pesan BE (F-26). `alert()` diskusi (F-27). Filter & teks Cancel Arbitrage (F-28). |
| 17 | Pembayaran admin | `payment.spec.ts` | Sebagian | P1 (unprocessed payment) | "Tolak" memanggil `/payment/cancel` (F-06, perlu konfirmasi). Filter `status=ALL` (F-07). |
| 18 | Penarikan dana admin | `withdrawal.spec.ts` | 🐞 | — | Rumus "Potensi Anomali" ikut menghitung saldo deposit (F-22). Statistik hanya halaman aktif (F-23). |
| 19 | Produk & stok admin (review, suspend) | — | ⬜ | P1 | Halaman create/edit admin memakai ulang form produk seller; tes setelah modul 12. |
| 20 | Verifikasi seller (admin) | — | ⬜ | P1 | Termasuk edit user terverifikasi (`editVerifiedUser`). |
| 21 | Master data admin (kategori, tipe akun, voucher, metode/channel bayar) | — | ⬜ | P2 | Pola CRUD serupa; cocok satu spec per halaman. Sinkron Tripay memanggil gateway lewat BE. |
| 22 | Keuangan admin (ringkasan, jurnal, kategori, failed journal) | — | ⬜ | P2 | Total per kategori diagregasi di FE (loop semua halaman jurnal, abaikan void) — perlu dicek kebenarannya. |
| 23 | System settings | — | ⬜ | P2 | Setting publik dipakai checkout & withdrawal (biaya aplikasi, `WD_FEE`); salah ubah berdampak luas. |
| 24 | Chat (buyer, seller, admin) | — | ⬜ | P2 | Admin memakai endpoint percakapan seller. |
| 25 | Notifikasi (buyer, seller, admin, broadcast) | — | ⬜ | P2 | Kirim ke user memakai pencarian `/admin/users` (sama dengan modal penalty). |
| 26 | Badge/alerts sidebar & header | — (tersirat di beberapa tes) | Sebagian | P3 | Refresh badge setelah aksi sudah dicek di payment & withdrawal. Polling 45 detik & field `null` belum. |
| 27 | Halaman statis | — | ➖ | P3 (smoke test) | Cukup cek halaman terbuka tanpa error; `hubungi-kami` memuat setting publik. |

Total saat ini: **143 tes** di 11 spec (termasuk `security.spec.ts`), dengan 27 tes `test.fail` untuk bug yang sudah diketahui.

---

## 1. Auth — `auth.spec.ts`

| Skenario | Status | Catatan |
|---|---|---|
| Form login tampil untuk pengunjung | ✅ | |
| Validasi email tidak valid tanpa memanggil API | ✅ | |
| Submit sebelum hidrasi tidak membocorkan kredensial ke URL | ✅ | F-01 (sudah diperbaiki) |
| Kredensial salah → toast gagal | ✅ | |
| Login sukses per role → diarahkan ke dashboard masing-masing | ✅ | |
| Pengunjung ke rute terlindungi → `/login` | ✅ | `/guarantee` lolos tanpa login: F-19 |
| User login tidak bisa buka `/login` | ✅ | |
| Buyer ditolak masuk `/admin*` dan `/seller*` | ✅ | |
| Hydration mismatch di `/login` | 🐞 | F-02 (dicatat, belum ada tes) |
| Register (`registerUser`): validasi, body, error email terpakai | ⬜ P1 | |
| Logout (`/user/logout`): sesi dibersihkan, redirect | ⬜ P1 | |
| Refresh token: 401 `TOKEN_EXPIRED` → refresh → retry sekali | ⬜ P1 | Logika di `useApi.ts` |
| Refresh gagal → `clearAuth()` + redirect `/login` | ⬜ P1 | Sebagian tersirat di tes `/penalty` |
| Forgot password (rute di-guard, halaman belum ada) | ➖ | |
| Login 429 `RATE_LIMITED`: pesan, tombol dikunci + hitung mundur, tanpa auto-retry | ✅ | `security.spec.ts` |
| Login 403 `ACCOUNT_LOCKED`: pesan, hitung mundur, link lupa kata sandi | ✅ | `security.spec.ts` |
| Tombol login aktif lagi setelah hitung mundur habis | ✅ | `security.spec.ts` |
| Register 429 `RATE_LIMITED` | ✅ | `security.spec.ts` |

## 2. Profil buyer — `pages/profile`

| Skenario | Status |
|---|---|
| Profil tampil (`fetchMe`) | ⬜ P2 |
| Ubah profil (`updateProfile`): validasi, body, error BE | ⬜ P2 |
| Ganti password 403 `ACCOUNT_LOCKED`: pesan tampil, tidak logout (`security.spec.ts`) | ✅ |

## 3. Katalog publik

| Halaman / fungsi | Status | Catatan |
|---|---|---|
| Beranda `/`: daftar produk (`getProducts`), preview kategori | ⬜ P2 | |
| `/category`, `/category/[id]` (`fetchCategories`, `fetchProductsByCategoryId`) | ⬜ P2 | |
| `/product/[id]`: detail, ulasan (`fetchReviewByProduct`), tambah ke keranjang, info merchant | ⬜ P2 | Penting: pintu masuk keranjang |
| `/merchant/[id]`: profil toko & produk (`fetchMerchantById`, `fetchProductsByMerchantId`) | ⬜ P2 | |
| `/search`: kata kunci, filter, kosong | ⬜ P2 | |
| Produk habis/nonaktif tidak bisa ditambah ke keranjang | ⬜ P2 | |

## 4. Keranjang & checkout — `checkout.spec.ts`

| Skenario | Status | Catatan |
|---|---|---|
| Checkout pakai saldo (`createTransaction`) → daftar transaksi | ✅ | |
| Saldo kurang → tombol checkout nonaktif | ✅ | F-03, F-04 dicatat |
| Transfer manual → halaman pembayaran | ✅ | |
| Payment gateway: channel & biaya | ✅ | |
| Voucher valid (`checkVoucher`) / tidak valid | ✅ | |
| Sinkron stok (`getProductsByIds`): produk nonaktif, harga berubah, qty dikurangi | ✅ | |
| Checkout gagal di BE → pesan & keranjang tetap | ✅ | |
| Pengunjung tidak bisa checkout | ✅ | |
| Daftar voucher publik (`fetchPublicVouchers`) | ⬜ P3 | |
| Ubah qty / hapus item / keranjang multi-merchant | ⬜ P2 | |

## 5. Pembayaran buyer — `payment.spec.ts`

| Skenario | Status | Catatan |
|---|---|---|
| Detail transfer manual: rincian, rekening, countdown, WhatsApp | ✅ | F-05 dicatat (nominal) |
| Batas bayar lewat / `expired_at` null | ✅ | |
| Payment gateway: kode bayar, QR, tombol bayar | ✅ | |
| Sudah dibayar: instruksi disembunyikan | ✅ | F-08 dicatat |
| Batalkan deposit + 409 | ✅ | |
| Payment tidak ditemukan | ✅ | |
| Daftar pembayaran `/payment` (`fetchMyPayments`) | ⬜ P2 | |
| Upload bukti bayar (`uploadPaymentProof`) | ➖ | Belum dipakai di UI |

## 6. Transaksi buyer — `transaction.spec.ts`

| Skenario | Status | Catatan |
|---|---|---|
| Daftar, tombol bayar UNPAID | ✅ | |
| Filter status dari URL & pencarian ID | ✅ | F-18 dicatat |
| Status ditolak BE (400) → filter kembali "Semua" | ✅ | |
| Tombol "Batalkan"/"Tangguhkan" di daftar | 🐞 | F-16 |
| Tombol aksi sesuai status | ✅ | |
| Selesaikan pesanan (`fetchAcceptOrder`) + 409 | ✅ | |
| Tolak hasil kiriman (`fetchRejectOrder`) | ✅ | |
| Ajukan arbitrase (`fetchArbitrageRequest`) | ✅ | |
| Ajukan & tarik pembatalan | ✅ | |
| Kirim penilaian (`fetchCreateReview`) | ✅ | |
| Edit penilaian (`fetchUpdateReview`) | 🐞 | F-17 |
| Countdown UNPAID tanpa / dengan `expired_at` | 🐞 / ✅ | F-11 |
| Diskusi order sisi buyer (`fetchCreateOrderDiscussion`, file order) | ⬜ P2 | Sisi seller & admin sudah |

## 7. Garansi — `guarantee.spec.ts`

| Skenario | Status | Catatan |
|---|---|---|
| Ajukan klaim: validasi, body, status | ✅ | |
| Klaim ditolak BE | 🐞 | F-20 |
| Masa garansi habis / produk tanpa garansi | ✅ | |
| Garansi DONE: balasan & file pengganti | ✅ | |
| File garansi presigned: URL berlaku dibuka langsung; kedaluwarsa → "memuat ulang" + URL baru; tetap kedaluwarsa → tidak membuka error R2 | ✅ | `security.spec.ts` |
| Daftar → detail klaim buyer | ✅ | F-21 dicatat |
| `/guarantee` tanpa login | 🐞 | F-19 |
| Seller: daftar + countdown review | ✅ | |
| Seller: terima / tolak klaim | ✅ | |
| Seller: terima klaim basi (409) | 🐞 | F-20 |
| Seller: kirim garansi manual & via stok | ✅ | |

## 8. Saldo, deposit & transfer — `balance.spec.ts`

| Skenario | Status | Catatan |
|---|---|---|
| Saldo, riwayat deposit, mutasi saldo | ✅ | |
| Deposit payment gateway / transfer manual | ✅ | |
| Deposit tanpa metode default | 🐞 | F-33 |
| Deposit ditolak BE (400) | 🐞 | F-20 |
| Batalkan deposit / batal basi (409) | ✅ / 🐞 | F-20 |
| Riwayat deposit gagal dimuat | 🐞 | F-34 |
| Pengunjung → `/login` | ✅ | |
| Transfer saldo jualan ke belanja: validasi, body, kartu saldo | ✅ | |
| Catatan kosong tidak dikirim / saldo 0 → tombol nonaktif | ✅ | |
| Transfer ditolak BE | 🐞 | F-20 |

## 9. Penalty — `penalty.spec.ts`

| Skenario | Status | Catatan |
|---|---|---|
| Rule: daftar, tambah, edit, nonaktifkan | ✅ | |
| Rule: normalisasi ID, edit dibatalkan | 🐞 | F-29 |
| Rule: ID duplikat (409) | 🐞 | F-20 |
| Manage: daftar user, kenakan penalty, batalkan penalty | ✅ | |
| Manage: filter "Semua", label WARNING | 🐞 | F-30 |
| Manage: header slideover basi | 🐞 | F-31 |
| Buyer: banner & riwayat; seller: riwayat | ✅ | |
| `/admin/penalty-user` | ⬜ P3 | Halaman yatim: F-32 |

## 10. Pesanan seller — `seller-order.spec.ts`

| Skenario | Status | Catatan |
|---|---|---|
| Daftar: terima/tolak, countdown, filter | ✅ | |
| Tolak basi (409) | ✅ | |
| Detail: terima (+409), tolak | ✅ | F-13 dicatat |
| Kirim orderan → DELIVERED, kirim pesan | ✅ | F-14 dicatat |
| Pesan kosong | 🐞 | F-10 |
| Terima / tolak pengajuan batal | ✅ | F-12 dicatat |
| Tombol "Batalkan" PAID | 🐞 | F-09 |
| Countdown UNPAID tanpa `expired_at` | 🐞 | F-11 |
| Seller ajukan arbitrase (`fetchArbitrageRequest`) | ⬜ P2 | |
| Kirim orderan via file / stok otomatis | ⬜ P2 | |

## 11. Penarikan dana & rekening bank seller — `withdrawal.spec.ts`

| Skenario | Status | Catatan |
|---|---|---|
| Kartu saldo & riwayat penarikan | ✅ | |
| Ajukan penarikan: validasi, biaya, body; ditolak BE | ✅ | F-23 dicatat |
| Belum ada rekening → form nonaktif | ✅ | |
| Batalkan penarikan / batal basi (409) | ✅ / 🐞 | F-20 |
| `/seller/bank-account`: lihat & simpan rekening (`saveBankAccount`), validasi, error BE | ⬜ P1 | |

## 12. Produk seller — `pages/seller/product/*`

| Skenario | Status |
|---|---|
| Daftar produk + ringkasan (`getMyProducts`, `fetchProductSummary`), filter status | ⬜ P1 |
| Buat produk (`createProduct`): validasi, upload gambar (`imageHelper`: ≤5 MB, JPG/PNG, ≤1500×1500), garansi, tipe akun, rich text | ⬜ P1 |
| Edit produk (`fetchMyProductById`, `updateProduct`) | ⬜ P1 |
| Aktifkan / nonaktifkan produk | ⬜ P1 |
| Produk REJECTED / SUSPENDED: alasan tampil, aksi dibatasi | ⬜ P2 |

## 13. Stok seller — `pages/seller/stock/*`, `components/stock/*`

| Skenario | Status |
|---|---|
| Daftar stok (`getMyAllStockItems`), filter status | ⬜ P1 |
| Tambah stok satuan (`addProductStockItem`) & edit (`updateProductStockItem`) | ⬜ P1 |
| Bulk akun: cek `dryRun` lalu simpan, deteksi duplikat (`useStockDuplicateCheck`) | ⬜ P1 |
| Bulk file: cek `dryRun` lalu simpan | ⬜ P1 |
| Hapus satu / bulk delete stok | ⬜ P1 |

## 14. Verifikasi seller & daftar merchant

| Skenario | Status |
|---|---|
| `/merchant/create`: daftar jadi seller (`registerMerchant`, FormData) | ⬜ P1 |
| `/seller/verification`: status & ajukan verifikasi (`submitVerification`) | ⬜ P1 |
| `/seller/verification/history` | ⬜ P2 |

## 15. Dashboard & profil toko seller

| Skenario | Status |
|---|---|
| `/seller/dashboard`: ringkasan order/produk/keuangan, banner penalty | ⬜ P3 (penalty sudah) |
| `/seller/profile`: ubah merchant (`updateMerchant`) | ⬜ P2 |

## 16. Pesanan admin — `admin-order.spec.ts`

| Skenario | Status | Catatan |
|---|---|---|
| Daftar: filter ARBITRAGE dari badge, link detail | ✅ | F-28 dicatat |
| Error daftar | 🐞 | F-26 |
| Cancel arbitrage, refund, selesaikan paksa, refund 409 | ✅ | |
| Refund 400 | 🐞 | F-24 |
| Tombol di status final | 🐞 | F-25 |
| Diskusi admin: kirim pesan / pesan kosong | ✅ / 🐞 | F-27 |
| `/admin/dashboard`: statistik & ringkasan | ⬜ P3 | |

## 17. Pembayaran admin

| Skenario | Status | Catatan |
|---|---|---|
| Tombol konfirmasi hanya untuk UNPAID manual/deposit | ✅ | |
| Konfirmasi dari daftar + 409; tolak dari detail; batal di dialog | ✅ | F-06 dicatat |
| Filter "Semua Status" | 🐞 | F-07 |
| `/admin/payments/unprocessed`: daftar & resolve (`resolveUnprocessedPayment`) | ⬜ P1 | |

## 18. Penarikan dana admin — `withdrawal.spec.ts`

| Skenario | Status | Catatan |
|---|---|---|
| Daftar: estimasi pakai `WD_FEE`, filter | ✅ | F-23 dicatat |
| Tandai selesai / tolak; selesai basi (409) | ✅ / 🐞 | F-20 |
| Detail: peringatan anomali, biaya admin COMPLETED | ✅ | F-22 dicatat |

## 19. Produk & stok admin

| Skenario | Status |
|---|---|
| `/admin/product`: daftar, filter (`getAllProductsAdmin`) | ⬜ P1 |
| `/admin/product/review`: setujui, tolak (alasan), suspend | ⬜ P1 |
| `/admin/product/view/[id]`, `create`, `edit` | ⬜ P2 |
| `/admin/stock`: daftar stok semua seller | ⬜ P3 |

## 20. Verifikasi seller (admin)

| Skenario | Status |
|---|---|
| `/admin/verification`: daftar & filter | ⬜ P1 |
| Detail: setujui / tolak (alasan) / edit user terverifikasi | ⬜ P1 |

## 21. Master data admin

| Halaman | Skenario | Status |
|---|---|---|
| `/admin/category` | Daftar, tambah, edit, suspend | ⬜ P2 |
| `/admin/account-type` | Daftar, tambah, edit | ⬜ P2 |
| `/admin/voucher` | Daftar, tambah, edit, suspend/aktifkan, validasi tanggal & nominal | ⬜ P2 |
| `/admin/payment-method` | Daftar, tambah, edit, suspend/aktifkan | ⬜ P2 |
| `/admin/payment-channel` | Daftar, edit channel, sinkron Tripay | ⬜ P2 |

## 22. Keuangan admin — `pages/admin/finance/*`

| Skenario | Status |
|---|---|
| Ringkasan & saldo (`fetchSummary`, `fetchBalance`) | ⬜ P2 |
| Kategori: tambah, edit, toggle, total per kategori | ⬜ P2 |
| Jurnal: daftar, tambah, void | ⬜ P2 |
| Failed journal: daftar, retry, dismiss | ⬜ P2 |

## 23. System settings — `pages/admin/settings/*`

| Skenario | Status |
|---|---|
| Daftar, tambah, edit, hapus setting | ⬜ P2 |
| Setting publik dipakai FE (biaya aplikasi, `WD_FEE`, kontak) | Sebagian (tersirat di checkout & withdrawal) |

## 24. Chat

| Skenario | Status |
|---|---|
| Buyer `/chat`: daftar percakapan, buka, kirim pesan | ⬜ P2 |
| Chat dari halaman produk / merchant (`ChatProductModal`) | ⬜ P2 |
| Seller `/seller/chat`, admin `/admin/chat` | ⬜ P2 |

## 25. Notifikasi

| Skenario | Status |
|---|---|
| Buyer/seller/admin: daftar, tandai dibaca, tandai semua dibaca | ⬜ P2 |
| Admin: kirim notifikasi ke user (`createNotification`) & broadcast | ⬜ P2 |

## 26. Badge / alerts

| Skenario | Status |
|---|---|
| Badge sidebar admin/seller & header buyer dari `/admin/alerts`, `/seller/alerts`, `/alerts` | Sebagian (refresh setelah aksi sudah dicek di payment & withdrawal) |
| Field `null` → badge disembunyikan; polling 45 detik | ⬜ P3 |

## 27. Halaman statis

`tentang-kami`, `karir`, `syarat-ketentuan`, `kebijakan-privasi`, `pusat-bantuan`, `panduan-belanja`, `panduan-berjualan`, `hubungi-kami` (pakai `fetchPublicSystemSettingByGroup`), `blog`.
Cukup satu smoke test (halaman terbuka tanpa error) — ⬜ P3.

---

## Urutan pengerjaan yang disarankan

1. **P1:** produk & stok seller → review produk admin → verifikasi seller (seller + admin) → rekening bank → unprocessed payment → register/logout/refresh token.
2. **P2:** katalog publik → chat → notifikasi → master data admin → keuangan admin → system settings → sisa (profil, `/payment`, diskusi buyer).
3. **P3:** dashboard, `/admin/stock`, `/admin/penalty-user`, polling badge, smoke test halaman statis.
