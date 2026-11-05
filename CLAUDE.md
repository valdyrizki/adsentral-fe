# CLAUDE.md

Panduan untuk Claude Code saat bekerja di repo ini.

## Commands

```bash
npm run dev        # Dev server di http://localhost:3000
npm run build      # Build produksi (SSR) — dipakai juga sebagai verifikasi
npm run preview    # Preview hasil build
npm run test:e2e   # Tes E2E Playwright (otomatis start nuxt dev :3100 + mock BE :3199)
npm run test:e2e:ui      # Playwright UI mode (debug interaktif)
npm run test:e2e:report  # Buka laporan HTML run terakhir
npx playwright test -g "login"   # Jalankan tes yang judulnya cocok
```

Belum ada lint/unit test. Verifikasi perubahan dengan `npm run build` (cek error TypeScript/template) dan `npm run test:e2e`; untuk perubahan UI jalankan juga `npm run dev` lalu cek di browser.

### Tes E2E (`tests/e2e/`)

- BE **tidak dipakai**. Request browser ke `/backend/*` dicegat fixture `mockApi` (`support/fixtures.ts`); request tanpa handler dibalas 404 dan dicatat di `mockApi.unhandled`. Request SSR diarahkan ke `support/mock-backend.mjs` (refresh 401, lainnya 503).
- Default fixture = pengunjung. `mockApi.asRole('SELLER')` mensimulasikan sesi aktif (refresh → token, profil, saldo, alerts). Daftarkan respons per tes dengan `mockApi.on('GET', '/path', ok(data))`; helper `ok`, `fail`, `emptyPage`, `makeUser`.
- Sebelum mengisi form/klik, buka halaman dengan `gotoHydrated(page, path)`. Klik sebelum hidrasi tidak memanggil handler Vue.
- Scope selector ke `getByRole('main')` (header punya tombol serupa). Teks toast muncul ganda (live region), jadi pakai `.first()`.
- Keranjang (`cart`, persist) disimpan di cookie. Isi lewat `seedCart(context, items)` dari `support/cart.ts`, beserta `makeProduct`, `makeBalance`, `PAYMENT_METHODS`.
- Bug/potensi masalah yang ditemukan saat menulis tes dicatat di `docs/test-findings.md` (diperbaiki setelah semua tes selesai).
- Spec yang ada: `auth.spec.ts` (login, guard rute), `checkout.spec.ts` (saldo, transfer manual, payment gateway + fee, voucher, sinkron keranjang, error BE), `payment.spec.ts` (detail pembayaran buyer, konfirmasi/tolak admin), `seller-order.spec.ts` (terima/tolak, kirim orderan, pengajuan batal), `transaction.spec.ts` (daftar & filter transaksi buyer, selesaikan/tolak pesanan, tangguhkan, ajukan & tarik pembatalan, penilaian). `guarantee.spec.ts` (klaim garansi buyer, daftar/detail klaim, terima/tolak/kirim garansi seller). `withdrawal.spec.ts` (tarik dana & batal oleh seller, tandai selesai/tolak & detail anomali oleh admin). `admin-order.spec.ts` (daftar pesanan admin, cancel arbitrage, refund, selesaikan paksa, diskusi admin). `penalty.spec.ts` (CRUD & toggle penalty rule, kenakan/batalkan penalty & detail user oleh admin, riwayat & banner penalty buyer/seller). `balance.spec.ts` (riwayat & buat/batal deposit buyer, mutasi saldo, transfer saldo jualan ke belanja). Data payment & transaksi: `support/payment.ts` (`makePayment`, `makeTx`).
- Bug yang sudah diketahui tapi belum diperbaiki: tandai tesnya dengan `test.fail()` + rujukan ID temuan, lalu hapus anotasinya setelah diperbaiki. Pastikan dulu (jalankan tanpa anotasi) bahwa tes gagal karena bugnya, bukan karena selector.
  Cara cepat: salin spec ke `tests/e2e/tmp-verify.spec.ts` dengan `sed 's/^  test\.fail(/  test(/'` (atau hapus baris `test.fail()`), jalankan dengan `-g "F-"`, cek pesan gagalnya, lalu hapus file sementara itu.
- Tes `test.fail` yang mengecek "sesuatu TIDAK muncul" rawan lolos palsu (`toHaveCount(0)` langsung lolos sebelum elemen sempat muncul). Tunggu dulu (`waitForTimeout`) baru hitung.
- Jika Playwright gagal start dengan "Another Nuxt dev server is already running" padahal tidak ada server (lock basi, PID sudah dipakai proses lain), jalankan dengan `NUXT_IGNORE_LOCK=1 npx playwright test`.

## Environment

File `.env` (tidak di-commit):

```
NUXT_PUBLIC_API_BASE=/backend            # default; semua request FE lewat proxy /backend
NUXT_PUBLIC_BACKEND_URL=http://<host>:8080   # target devProxy (/backend → <url>/api) & URL file/gambar
NUXT_BACKEND_INTERNAL_URL=http://adsentral-be-dev:8080  # target proxy server di Docker
```

Proxy `/backend/* → <BE>/api/*` ada dua: `nitro.devProxy` (dev, dengan cookie rewrite ke localhost) dan `server/middleware/proxy.ts` (runtime/Docker, memakai `runtimeConfig.backendInternalUrl`). Deploy lewat `Dockerfile` + `docker-compose.yml` (network eksternal `proxy`).

## Arsitektur

Nuxt 4 (Vue 3, SSR) + Nuxt UI 4 + Pinia. Frontend marketplace akun digital dengan peran **buyer**, **SELLER**, **ADMIN**, **SUPER_ADMIN**. Backend terpisah (repo lain); FE hanya konsumen API.

### Struktur `app/`

- `pages/` — routing berbasis file. Area: `admin/` (layout `admin`), `seller/` (layout `seller`), selebihnya buyer/publik (layout `default`). Halaman statis: `tentang-kami`, `karir`, `syarat-ketentuan`, `kebijakan-privasi`, `pusat-bantuan`, `panduan-*`, `hubungi-kami`, `blog`.
- `layouts/` — `default.vue`, `admin.vue`, `seller.vue`. Menu sidebar admin/seller (beserta badge) didefinisikan di layout masing-masing.
- `composables/api/` — satu file per domain (`useXxxApi`), **semua HTTP call ada di sini**.
- `composables/` — composable UI: `useConfirm` (dialog konfirmasi global), `useAlertsPolling`, `useTxListFilters`, `usePaymentNow`, `useStockDuplicateCheck`, `useAccountTypes`.
- `stores/` — `auth`, `alerts`, `balance`, `cart`, `category`, `merchant` (legacy), `payment-method`, `system-setting`.
- `types/` — interface request/response, dikelompokkan per domain (`types/<domain>/XxxResponse.ts`). Wrapper standar: `WebResponse<T>` dan `PageResponse<T>`.
- `components/app/` — komponen layout & shared (Header, Sidebar, `ConfirmDialog`, `TransactionStatusBadge`, `PaymentStatusBadge`, `CopyButton`, `LoadingSkeleton`, …). `components/form/` — modal/form (penalty, refund, reject, arbitrase, garansi, withdrawal, `RichTextEditor` berbasis TipTap). `components/stock/` — input & status stok akun. `components/seller/`, `components/verification/`, `components/bank-account/`, `components/u/` (`InputCurrency`, `PaymentMethodSelector`).
- `utils/` (auto-import) — `apiError.ts`, `pendingCountBadge.ts`, `txStatusFilter.ts`, `paymentDeadline.ts`, `txConfirmDeadline.ts`, `walletSource.ts`, `imageUrl.ts`, `slug.ts`, `sellerOrderSummary.ts`.
- `helper/` — `imageHelper.ts` (validasi gambar: maks 5 MB, JPG/PNG, maks 1500×1500), `stockAccountHelper.ts`, `stringHelper.ts`.
- `plugins/auth-init.client.ts` — restore sesi saat load (lihat Autentikasi).

### API layer

`composables/api/useApi.ts` membuat instance `$fetch` dengan:
- `baseURL` = `runtimeConfig.public.apiBase` (`/backend`), `credentials: 'include'`
- header **`X-API-TOKEN`** berisi access token dari auth store (bukan `Authorization: Bearer`)
- 401 `TOKEN_EXPIRED` → `authStore.refresh()` (single-flight) lalu retry sekali; 401 lain atau refresh gagal → `clearAuth()` + redirect `/login` (kecuali di halaman publik)

Pola composable domain (contoh nyata: `voucher.ts`):

```ts
export const useXxxApi = () => {
  const api = useApi()
  const fetchAll = async (params?: { page?: number; size?: number; keyword?: string }) => {
    const res = await api<WebResponse<PageResponse<XxxResponse>>>('/admin/xxx', { query: { page: params?.page ?? 0, size: params?.size ?? 20 } })
    if (res.status !== 'success') throw new Error(res.message)
    return res.data!
  }
  return { fetchAll }
}
```

- Path API **tanpa** prefix `/api` (proxy yang menambahkannya). Pagination 0-based.
- Di halaman/komponen: GET memakai `useAsyncData(key, () => xxxApi.fetch...())`; mutasi memanggil fungsi composable langsung. Jangan memanggil `$fetch` mentah dari halaman.
- Error: tampilkan pesan BE dengan `apiErrorMessage(err, 'fallback')` lewat `useToast()`. Untuk aksi pesanan/pembayaran, `isStaleActionError(err)` (403/409) berarti status sudah berubah di BE → tampilkan pesan lalu reload data, jangan retry. `rethrowApiError` tersedia untuk `.catch()`.

### Autentikasi & otorisasi

- Access token **hanya di memori** (`stores/auth.ts`, tanpa persist). Refresh token ada di cookie HttpOnly.
- `plugins/auth-init.client.ts`: saat load memanggil `POST /user/refresh` → set token → `loadUserProfile()` + `balanceStore.loadBalance()` → `setInitialized()`. Middleware wajib menunggu `authStore.isInitializing`.
- Getter peran: `isAuthenticated`, `isSeller`, `isAdmin`, `isSuperAdmin`, `isAnyAdmin`.
- `middleware/role-guard.global.ts`: `/seller*` butuh SELLER, `/admin*` butuh ADMIN/SUPER_ADMIN, `/superadmin*` butuh SUPER_ADMIN.
- `middleware/auth-redirect.global.ts`: user login dilarang ke `/login`, `/register`, `/forgot-password`; `/transaction`, `/balance`, `/profile`, `/chat`, `/payment` butuh login. **Halaman buyer baru yang butuh login harus ditambahkan ke daftar ini.**

### Badge / alerts

Angka badge sidebar & header berasal dari satu sumber: `stores/alerts.ts` (`GET /admin/alerts`, `/seller/alerts`, `/alerts`), di-poll tiap 45 detik oleh `useAlertsPolling(scope)` di tiap layout. Field `null` = gagal/belum dimuat → badge disembunyikan. Setelah aksi yang mengubah hitungan, panggil `useAlertsStore().refresh()`. Helper tampilan di `utils/pendingCountBadge.ts` (`pendingCountBadge`, `countBadge`, `sumKnownCounts`, `withCollapsedChips`). Menambah badge baru = field baru di `types/AlertsResponse.ts` + menu di layout.

### State

Hanya `cart` dan `merchant` yang memakai `persist: true`. Store lain dimuat ulang dari API. Cart mendukung multi-merchant dan sinkron stok ke BE sebelum checkout.

### UI

- Nuxt UI 4 (`UButton`, `UModal`, `UTable`, `UBadge`, `NavigationMenu`, dst.), Tailwind v4 via `assets/css/main.css` (`@import "tailwindcss"`, `@nuxt/ui`, typography). Warna tema di `app.config.ts` (primary `blue`); color mode dimatikan.
- Ikon: Iconify (`i-lucide-*`, `i-heroicons-*`, `i-mdi-*`, …) — koleksi yang dibundel ada di `nuxt.config.ts`.
- Konfirmasi aksi: `useConfirm()`, bukan `window.confirm`.
- Mata uang: `components/u/InputCurrency` / `v-money3`; masking: `maska`; tanggal: `dayjs`; HTML dari user disanitasi dengan `isomorphic-dompurify`.

## Docs

Baca sesuai kebutuhan sebelum mengerjakan fitur terkait:

- `docs/domain-glossary.md` — istilah bisnis, daftar status & alurnya (transaksi, garansi, stok, payment, withdrawal, penalty), batas waktu otomatis, aktor tiap aksi. **Baca ini sebelum menyentuh logika status.**
- `docs/api-map.md` — peta endpoint BE → fungsi composable → halaman/komponen pemakai, per domain. Pakai untuk mencari lokasi fitur sebelum grep.
- `docs/conventions.md` — resep (fitur CRUD admin, badge menu), pola halaman list/aksi/modal, dan daftar komponen & helper yang wajib dipakai ulang. **Baca sebelum membuat halaman atau komponen baru.**

## Konvensi

- Semua teks UI, pesan toast, dan komentar kode dalam **Bahasa Indonesia**.
- Status dari BE dikirim sebagai string (UPPER_SNAKE_CASE); label & warna badge status didefinisikan di komponen `*StatusBadge` terkait — pakai ulang, jangan buat mapping baru.
- Field response BE memakai `snake_case`; ikuti apa adanya di interface `types/`.
- Fitur baru umumnya: type di `types/<domain>/` → fungsi di `composables/api/<domain>.ts` → halaman di `pages/` → menu di layout (+ badge bila perlu).
- Saat menambah/mengubah status, aturan bisnis, atau batas waktu, perbarui `docs/domain-glossary.md` di commit yang sama. Begitu juga `docs/api-map.md` saat menambah/mengubah endpoint atau pemakainya.
- Pesan commit dalam Bahasa Indonesia: judul ringkasan per fitur, body berisi poin per fitur.
