# Domain Glossary

Istilah bisnis, status, dan aturan Adsentral sebagaimana terlihat dari FE. Status selalu dikirim BE sebagai string UPPER_SNAKE_CASE.

> Bagian bertanda **⚠️ perlu konfirmasi** disimpulkan dari UI, belum diverifikasi ke BE.

## Peran

| Role (`user.role`) | Keterangan | Area FE |
|---|---|---|
| `BUYER` | Pembeli. Semua user login bisa membeli. | layout `default` |
| `SELLER` | Penjual, punya merchant & produk. | `/seller/*` |
| `ADMIN` | Operasional: review produk, konfirmasi pembayaran, arbitrase, withdrawal, penalty. | `/admin/*` |
| `SUPER_ADMIN` | Admin dengan akses penuh (`/superadmin/*`). | `/admin/*` |

## Istilah

| Istilah | Arti |
|---|---|
| **Merchant** | Toko milik seller. |
| **Produk** | Barang digital (umumnya akun). Punya `delivery_type`, `guarantee_days`, `delivery_days`, `min_qty`/`max_qty`. |
| **Transaksi (tx)** | Satu pesanan buyer untuk satu produk. Dibayar lewat **Payment** (`payment_type: TRANSACTION`). |
| **Payment** | Tagihan pembayaran untuk transaksi atau deposit. `MANUAL_BANK` = transfer manual yang dikonfirmasi admin (pakai `unique_code`). |
| **Deposit / Top Up** | Isi saldo belanja (`payment_type: DEPOSIT`). |
| **Saldo Belanja** (`deposit_balance`) | Saldo untuk membeli. Dana refund yang belum dibelanjakan bisa dicairkan tunai oleh super admin (`/admin/users` → Cairkan Refund); pencairan dengan user, nominal & catatan sama dalam 10 menit ditolak BE (409 `DUPLICATE_PAYOUT`). |
| **Saldo Jualan** (`sales_balance`) | Hasil penjualan seller yang sudah cair; bisa ditarik (withdrawal) atau ditransfer ke saldo belanja. |
| **Dana Tertahan** (`deposit_held` / `sales_held`) | Dana yang sedang dikunci (escrow penjualan, withdrawal yang diproses). `sales_held` dirinci BE: `sales_held_escrow` (pesanan belum cair) + `sales_held_withdrawal` (withdrawal `PENDING`) (EP04-07); keduanya bisa kosong pada BE lama. |
| **Escrow** | Uang buyer ditahan sebagai `sales_held` seller sampai transaksi `COMPLETE`, baru cair ke `sales_balance`. |
| **Kliring dana** | Jeda 24 jam setelah `DONE` sebelum transaksi menjadi `COMPLETE` dan dana cair. |
| **Withdrawal** | Penarikan saldo jualan ke rekening bank seller; diproses manual oleh admin. Kena `WD_FEE`. |
| **Diskusi pesanan** (order discussion) | Thread pesan per transaksi; juga media pengiriman pesanan/akun. |
| **Penangguhan / Arbitrase** | Sengketa yang dinaikkan ke admin (status `ARBITRAGE`). Label UI: "Tangguhkan", "Banding", "Dalam Review Admin". |
| **Garansi** (guarantee) | Klaim buyer setelah pesanan selesai, selama `guarantee_days` produk. |
| **Penalty** | Poin pelanggaran ke buyer/seller; akumulasi poin aktif menentukan suspend. |
| **Verifikasi** | Verifikasi identitas seller (KTP dll.). Seller terverifikasi → `verified_seller: true`. |
| **Voucher** | Kode diskon (`PERCENT`/`NOMINAL`) dengan kuota & periode. |
| **Jurnal keuangan** | Pencatatan akuntansi internal (`/admin/finance`). **Failed journal** = jurnal yang gagal dicatat otomatis dan perlu ditangani admin. |
| **Unprocessed payment** | Pembayaran yang masuk dari gateway tetapi transaksinya sudah tidak valid (expired/batal/lewat). Admin menyelesaikan manual. |
| **Tipe akun** (account type) | Kategori akun stok (mis. Facebook, Gmail). Tipe "Lainnya" (`is_default`) dibuat otomatis BE dan tidak bisa diubah. |

## Transaksi

### Status

| Status | Label UI | Arti |
|---|---|---|
| `UNPAID` | Menunggu Pembayaran | Dibuat, belum dibayar. |
| `PAID` | Menunggu konfirmasi dari seller | Sudah dibayar, seller harus menerima/menolak. |
| `IN_PROGRESS` | Pesanan Diproses Penjual | Seller menerima, sedang menyiapkan. |
| `DELIVERED` | Pesanan Telah Dikirim | Seller mengirim pesanan (lewat diskusi). |
| `DONE` | Pesanan Diterima | Buyer menerima (atau otomatis). Masa kliring 24 jam. |
| `COMPLETE` | Pesanan Selesai ("Selesai & Cair") | Final; dana cair ke seller. |
| `REJECT` | Pembeli Menolak Pesanan ("Perlu Diperbaiki" di sisi seller) | Buyer menolak hasil kiriman. |
| `REJECTED` | Penjual Menolak Pesanan | Seller menolak pesanan `PAID`. Final. |
| `CANCEL_REQUEST` | Pengajuan pembatalan | Buyer mengajukan batal saat `IN_PROGRESS`. |
| `CANCELLED` | Pesanan Dibatalkan | Final. |
| `EXPIRED` | Transaksi Expired | Tidak dibayar dalam batas waktu. Final. |
| `ARBITRAGE` | Pesanan Di-Review Admin | Sengketa, menunggu keputusan admin. |
| `REFUNDED` | Pesanan Direfund | Dana dikembalikan ke buyer (sebesar yang dibayar untuk produk, setelah diskon voucher). Final. |

### Alur & aktor

```
UNPAID ──bayar──▶ PAID ──seller terima──▶ IN_PROGRESS ──seller kirim──▶ DELIVERED ──buyer terima──▶ DONE ──24 jam──▶ COMPLETE
  │                │                         │                               │
  └─24 jam▶EXPIRED └─seller tolak▶REJECTED   └─buyer ajukan batal            ├─buyer tolak──▶ REJECT
                    └─24 jam tanpa respon       ▶ CANCEL_REQUEST             └─buyer tangguhkan──▶ ARBITRAGE
                      ▶ batal otomatis
```

| Aksi | Aktor | Dari status | Endpoint (composable `transaction.ts`) |
|---|---|---|---|
| Konfirmasi/terima pesanan | Seller (admin juga bisa) | `PAID` | `PATCH /tx/confirm/{id}` · `fetchConfirmTx` |
| Tolak pesanan | Seller (admin juga bisa) | `PAID` | `/tx/reject/{id}` · `fetchRejectTx` |
| Kirim pesanan | Seller | `PAID` (langsung, sekaligus konfirmasi), `IN_PROGRESS`, `REJECT` (kirim ulang), `ARBITRAGE` (status tetap) | diskusi tipe `ORDER_DELIVERY`; status lain 403 |
| Terima pesanan | Buyer | `DELIVERED` | `/tx/order/accept/{id}` · `fetchAcceptOrder` |
| Tolak pesanan (hasil kiriman) | Buyer | `DELIVERED` | `/tx/order/reject/{id}` · `fetchRejectOrder` |
| Ajukan pembatalan | Buyer | `IN_PROGRESS` | `/tx/cancel/request/{id}` · `fetchCancelTxRequest` |
| Terima pembatalan | Seller | `CANCEL_REQUEST` | `/tx/cancel/accept/{id}` · `fetchAcceptCancelRequest` |
| Tolak pembatalan | Seller | `CANCEL_REQUEST` | `/tx/cancel/reject/{id}` · `fetchRejectCancelRequest` |
| Tarik pengajuan pembatalan | Buyer | `CANCEL_REQUEST` | `/tx/cancel/withdraw/{id}` · `fetchWithdrawCancelRequest` |
| Ajukan penangguhan (arbitrase) | Buyer (`DELIVERED`/`DONE`), seller (`REJECT`) | lihat kiri | `/tx/arbitrage/{id}` · `fetchArbitrageRequest` |
| Batalkan arbitrase / lanjutkan transaksi | Admin | `ARBITRAGE` | `/tx/cancel/arbitrage/{id}` · `fetchCancelArbitrage` ⚠️ perlu konfirmasi status tujuannya |
| Refund | Admin | hanya `ARBITRAGE` | `/tx/refund/{id}` · `fetchRefundTx` |
| Selesaikan paksa | Admin | hanya `ARBITRAGE` | `/tx/complete/{id}` · `fetchCompleteTx` |

Respons 403/409 pada aksi di atas = status sudah berubah di BE → tampilkan pesan BE dan muat ulang (`isStaleActionError`).

### Batas waktu otomatis (semua 24 jam, dijalankan BE)

| Status | Acuan | Jika lewat |
|---|---|---|
| `UNPAID` | `expired_at` (fallback `created_at` + 24 jam) | `EXPIRED` |
| `PAID` | `paid_at` + 24 jam | dibatalkan otomatis (seller tidak merespon) |
| `IN_PROGRESS` | `delivery_days` produk | hanya peringatan "Estimasi Pengiriman Terlewat" ⚠️ perlu konfirmasi ada tindakan otomatis |
| `DELIVERED` | `delivered_at` + 24 jam | otomatis `DONE` |
| `REJECT` | `rejected_at` + 24 jam | auto-refund |
| `CANCEL_REQUEST` | `cancel_requested_at` + 24 jam (kosong → `updated_at`) | auto-refund / batal |
| `DONE` | `done_at` + 24 jam | `COMPLETE`, dana cair |

Helper: `utils/paymentDeadline.ts`, `utils/txConfirmDeadline.ts`.

## Produk

**Status produk** (`types/enum/status.ts`): `REVIEW` (Menunggu Review, produk baru/diubah menunggu admin), `ACTIVE` (Aktif), `INACTIVE` (Ditangguhkan), `NONACTIVE` (Nonaktif), `SUSPEND`, `DELETED`.

**Tipe pengiriman** (`delivery_type`):

| Nilai | Label | Perilaku |
|---|---|---|
| `MANUAL` | Manual | Seller mengirim sendiri lewat diskusi (`ORDER_DELIVERY`). Stok = angka biasa. |
| `AUTO` | Otomatis | Sistem mengirim info pesanan (`auto_config`) ke diskusi saat pembayaran dikonfirmasi (`AUTO_DELIVERY`). Stok tidak terbatas (BE memakai `Integer.MAX_VALUE`), FE tidak menampilkan/menegakkan stok. |
| `STOCKING` | Stok Akun | Item stok (akun/file) dikirim otomatis (`STOCK_DELIVERY`). Setiap item stok = 1 stok. |

**Fee:** `TRX_FEE` (persen dari harga jual) dipotong dari pendapatan seller.

## Item stok (produk `STOCKING`)

| Status | Label | Arti |
|---|---|---|
| `ACTIVE` | Aktif | Siap dijual. |
| `SENT` | Terkirim | Sudah dikirim ke buyer (via pesanan atau garansi). |
| `RETURNED` | Dikembalikan | Transaksinya dibatalkan/direfund setelah akun terkirim. **Tidak** kembali ke stok; seller menambah ulang manual bila akun aman. |
| `RESTOCKED` | Ditambah Ulang | Item `RETURNED` yang akunnya sudah ditambah ulang sebagai item baru (diset otomatis oleh BE). |
| `DELETED` | Dihapus | |

Aturan:
- `RETURNED`/`RESTOCKED` dihitung "pernah terjual" saat cek duplikat, tidak bisa diedit/dihapus, dan dilewati saat hapus massal.
- `transaction_id` terisi untuk item yang terkirim lewat pesanan (null untuk kiriman garansi).
- Di endpoint admin, field akun sensitif (password, password email, 2FA, cookie) sudah di-mask `********` oleh BE.
- Input massal maksimal 1000 akun; format kolom di `helper/stockAccountHelper.ts`.

## Diskusi pesanan (`DiscussionType`)

`MESSAGE` (chat biasa), `ORDER_DELIVERY` (seller mengirim pesanan), `AUTO_DELIVERY` (kiriman otomatis produk AUTO), `STOCK_DELIVERY` (kiriman otomatis item stok), `GUARANTEE` (pesan terkait garansi).

## Garansi

Buyer bisa klaim saat transaksi `DONE`/`COMPLETE` dan produk punya masa garansi.

| Status | Arti | Batas waktu |
|---|---|---|
| `IN_REVIEW` | Menunggu seller meninjau klaim | `review_deadline`; lewat → penalty otomatis ke seller |
| `IN_PROGRESS` | Klaim diterima, seller harus mengirim akun pengganti (manual atau dari stok) | `progress_deadline`; lewat → penalty otomatis ke seller |
| `REJECTED` | Klaim ditolak seller | — |
| `DONE` | Pengganti sudah dikirim | — |

Aksi seller: `fetchReviewGuarantee` (terima/tolak), `fetchSendGuarantee` (kirim manual), `sendGuaranteeViaStock` (kirim dari stok).

## Payment

| Status | Arti |
|---|---|
| `UNPAID` | Menunggu pembayaran; batas `expired_at` (fallback `created_at` + 24 jam). |
| `IN_PROGRESS` | Deposit sedang diproses admin. |
| `PAID` / `COMPLETE` | Berhasil. |
| `EXPIRED`, `CANCELLED`, `REJECTED` | Gagal (`REJECTED` = admin menolak). |

Pembayaran `MANUAL_BANK` dikonfirmasi admin (`/admin/payment`); badge admin `pending_payment_confirmation`.

## Saldo & withdrawal

Sumber mutasi saldo (`WalletSource`, label di `utils/walletSource.ts`): `DEPOSIT`, `PURCHASE_DEBIT`, `REFUND`, `SALES_ESCROW_CREDIT`, `SALES_ESCROW_RELEASE`, `SALES_ESCROW_REVERSE`, `WITHDRAWAL_HOLD`, `WITHDRAWAL_COMPLETE`, `WITHDRAWAL_CANCELLED_REJECTED`, `ADMIN_ADJUSTMENT`, `SALES_TO_DEPOSIT_TRANSFER`. Tiap log hanya mengubah satu bucket saldo.

**Withdrawal:** `PENDING` (menunggu admin transfer/tolak) → `COMPLETED` / `REJECTED` / `CANCELLED`. `amount_received = amount − admin_fee`.

**Cek nama rekening** (`NameCheckStatus`): `MATCHED` / `MISMATCH` / `NOT_APPLICABLE` — cross-check nama KTP vs rekening, **hanya informasi**, tidak pernah memblokir alur. `null` = data lama, perlakukan sebagai `NOT_APPLICABLE`.

## Penalty & suspend

- **Penalty rule**: `target_role` `SELLER`/`BUYER`, `points`, `expired_days`, `trigger_type` `AUTO` (diberikan sistem, mis. telat respon garansi) atau `MANUAL` (diberikan admin).
- Poin kedaluwarsa setelah `expired_days`; hanya poin aktif yang dihitung.
- **Suspend status**: `NONE`, `WARNING`, `TEMPORARY` (sampai `suspend_until`), `PERMANENT`. Buyer yang terkena melihat `BuyerPenaltyBanner`.

## Verifikasi seller

`UNVERIFIED` → `PENDING` (diajukan) → `VERIFIED` / `REJECTED` (bisa mengajukan ulang; riwayat di `/seller/verification/history`).

## Voucher

`discount_type`: `PERCENT` (dibatasi `max_discount_amount`) atau `NOMINAL`. `min_transaction_amount`, `quota`/`used_count`, periode `start_date`–`end_date`, `is_public`. Status `ACTIVE` / `SUSPENDED`.

## Antrean admin lain

- **Unprocessed payment**: `PENDING` → `RESOLVED`. Alasan: `PAYMENT_EXPIRED`, `PAYMENT_CANCELLED`, `TX_LAPSED`.
- **Failed journal**: `PENDING` → `RESOLVED` / `DISMISSED`, dengan `retry_count`.

## Keamanan akun (BE)

- **Rate limit per IP** (semua request dihitung, termasuk yang berhasil): login 20/5 menit, register 10/jam, reset password 5/15 menit, konfirmasi reset & konfirmasi email 10/15 menit. Respons 429 `RATE_LIMITED` + `retryAfterSeconds`.
- **Kunci akun sementara** (`ACCOUNT_LOCKED`): setelah password salah 5 kali (percobaan ke-5 masih 400 biasa). 15 menit, lalu 30 menit, 1 jam, dst. bila terulang, maksimal 24 jam. Password benar pun ditolak selama terkunci. Login sukses atau reset password membuka kunci. Berlaku juga untuk password lama saat ganti password di profil. Tidak ada lagi kunci permanen. Admin bisa membuka kunci lebih cepat di `/admin/users` (alasan wajib, tercatat di audit BE); tombol hanya muncul selama `locked_until` di masa depan. Akun ADMIN/SUPER_ADMIN hanya bisa dibuka kuncinya oleh super admin (admin biasa: 403, tombol disembunyikan).
- **Kode verifikasi email terkunci** (`VERIFICATION_LOCKED`): setelah kode salah 5 kali, 15 menit. Tidak memengaruhi login.
- **Sesi login**: refresh token disimpan BE sebagai hash dan dirotasi tiap dipakai (refresh ganda paralel membuat salah satunya gagal). Kegagalan refresh: 400 sesi tidak dikenal, 401 `REFRESH_TOKEN_*`, 403 user disuspend → FE membersihkan sesi dan ke `/login`. Ganti password mengakhiri sesi perangkat lain; perangkat yang dipakai tetap login. Cookie `refreshToken` ber-atribut `Secure` di staging/production (FE wajib diakses lewat `https://`).
- **Lupa password** (`/forgot-password`): minta kode (`/user/password/reset`) selalu 200 walau email tidak terdaftar, disuspend, atau sudah 3 permintaan hari itu (tidak ada kode dibuat). Tampilkan pesan netral; kode saat ini disampaikan admin lewat WhatsApp (email belum ada, EP03-01). Konfirmasi kode (`/user/password/confirm`) → 200 `data.password` (tampil sekali); semua kasus gagal 400 dengan satu pesan; 5 kali kode salah → 429 tanpa `data.code` (arahkan ke admin); batas per IP → 429 `RATE_LIMITED`. Super admin mengambil kode aktif user di `/admin/users` → tombol **Kode Reset** (alasan wajib, tercatat di audit BE; EP03-07).
- **Panjang password baru** (register, ganti password): minimal 8 karakter, maksimal 72 **byte** UTF-8 (batas BCrypt; huruf beraksen 2 byte, banyak emoji 4 byte). Di atasnya BE menjawab 400; pada ganti password seluruh update profil ikut batal. FE memvalidasi lewat `utils/password.ts` (`newPasswordError`). Login sengaja tidak dibatasi.
- **Validasi isi file upload**: BE menentukan jenis file dari isinya (magic bytes), bukan Content-Type/ekstensi. Gambar produk, kategori, logo/banner toko, avatar: JPG/PNG/WEBP maks 2 MB. Foto verifikasi seller: JPG/PNG/WEBP maks 5 MB, selain itu 400 `FILE_MUST_BE_IMAGE` (input FE `accept="image/jpeg,image/png,image/webp"`, iOS mengonversi HEIC ke JPEG). Lampiran chat/diskusi/garansi/stok/file AUTO: jpg/jpeg/png/webp/pdf/zip/rar/txt/csv maks 10 MB dan isi harus cocok dengan ekstensi (`File type not allowed`). File non-gambar baru disajikan dengan `Content-Disposition: attachment`, jadi membuka URL-nya selalu mengunduh.
- **File privat**: file hasil pesanan, garansi, stok, dan lampiran produk AUTO disimpan di bucket privat; URL-nya presigned dan kedaluwarsa 1 jam. Buyer pada transaksi yang sudah direfund menerima `null` untuk file pengiriman.
- **CORS** API production hanya untuk `https://adsentral.com` dan `https://www.adsentral.com`. Development lokal memakai BE lokal/staging. Rate limit dihitung per IP klien: proxy `/backend` meneruskan `X-Forwarded-For` dan wajib memanggil BE lewat jaringan Docker internal; BE hanya mempercayai header itu dari alamat internal dan membaca rantai dari kanan (lihat `docs/be-report/ep02-jawaban-be.md`).

## System setting (key yang dipakai FE)

`TRX_FEE` (fee transaksi, persen), `WD_FEE` (biaya withdrawal), `FEE_APP`, `WA_NUMBER` (kontak CS), `CHAT_WARNING` (peringatan di chat), `OPERATIONAL_HOURS_WEEKDAY` / `OPERATIONAL_HOURS_WEEKEND`. Dimuat publik oleh `plugins/auth-init.client.ts`.

## Badge (alerts)

Lihat `types/AlertsResponse.ts`. Admin: notifikasi, konfirmasi pembayaran, unprocessed payment, failed journal, produk `REVIEW`, `ARBITRAGE`, withdrawal `PENDING`. Seller: notifikasi, `PAID` perlu konfirmasi, chat, garansi `IN_REVIEW`+`IN_PROGRESS`, `REJECT`, `CANCEL_REQUEST`, `ARBITRAGE`. Buyer: notifikasi, chat. Nilai `null` = tidak diketahui (sembunyikan, jangan anggap 0).
