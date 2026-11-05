# Conventions & Recipes

Pola kode yang dipakai di repo ini dan resep untuk tugas yang sering berulang. Ikuti pola ini; jangan membuat varian baru tanpa alasan. Contoh acuan disebut per bagian — buka file itu bila perlu detail.

## Resep: fitur CRUD admin baru

Contoh acuan lengkap: `pages/admin/account-type/index.vue` (list client-side + modal tambah/edit) dan `pages/admin/voucher/index.vue` (list server-side + filter).

1. **Type** — `types/<domain>/XxxResponse.ts` dan `XxxRequest.ts`. Field `snake_case` mengikuti BE; status sebagai union string literal (`'ACTIVE' | 'INACTIVE'`) bila nilainya pasti.
2. **Composable** — `composables/api/<domain>.ts` dengan pola `useXxxApi` (lihat `CLAUDE.md` → API layer). Satu fungsi per endpoint, `throw new Error(res.message)` bila `status !== 'success'`, kembalikan `res.data!`.
3. **Halaman** — `pages/admin/<domain>/index.vue` dengan `definePageMeta({ layout: 'admin', label: '<Judul>' })`. `label` ditampilkan sebagai judul di header layout.
4. **Menu** — tambahkan item di array `items` pada `layouts/admin.vue` (atau `layouts/seller.vue`). Ikon Iconify (`i-lucide-*`, `mdi:*`).
5. **Badge** (bila ada antrean yang perlu ditindaklanjuti) — lihat resep badge di bawah.
6. Perbarui `docs/api-map.md` (dan `docs/domain-glossary.md` bila ada status/aturan baru).
7. Verifikasi `npm run build`.

Area akses: `/admin/*` dan `/seller/*` sudah dijaga `middleware/role-guard.global.ts` — tidak perlu middleware per halaman. Halaman buyer yang butuh login: tambahkan prefix-nya ke `authRequiredRoutes` di `middleware/auth-redirect.global.ts`.

## Pola halaman list

Struktur script (urutan dan komentar seksi `// ===== X =====` dipertahankan):

```ts
definePageMeta({ layout: 'admin', label: 'Voucher' })

const toast = useToast()
const { fetchAll, create, update } = useXxxApi()

// ===== FILTER & PAGINATION =====
const page = ref(0)                  // 0-based, sama dengan BE
const perPageValue = ref(20)
const perPageItems = [10, 20, 50, 100]
const filterStatus = ref('ALL')      // 'ALL' = tanpa parameter status
const search = ref('')
const debouncedSearch = ref('')      // debounce 400 ms, reset page ke 0

// ===== FETCH =====
const { data, pending, error, refresh } = useAsyncData<PageResponse<XxxResponse>>(
  'admin-xxx',                                         // key unik per halaman
  () => fetchAll({ page: page.value, size: perPageValue.value, keyword: debouncedSearch.value || undefined, status: filterStatus.value }),
  { watch: [page, perPageValue, filterStatus, debouncedSearch], server: false },
)
```

- Halaman admin/seller memakai `server: false` (data butuh token, token hanya ada di client).
- Data kecil tanpa pagination BE → filter & paginate di client (`computed` + `slice`), seperti `account-type`.
- Filter yang perlu bisa di-link (mis. dari badge menu `?status=PENDING`) dibaca dari `route.query`. Untuk daftar transaksi pakai `useTxListFilters(options, page)` + opsi di `utils/txStatusFilter.ts`.

Struktur template:

```vue
<div class="space-y-6">
  <UModal v-if="showModal" v-model:open="showModal" ...>  <!-- v-if: jangan render saat SSR -->
  <UCard class="shadow-sm"> <!-- bar filter: UInput search (icon mdi:magnify), USelect, tombol Refresh, tombol Tambah (sm:ml-auto) --> </UCard>
  <ClientOnly>
    <template #fallback> <!-- USkeleton --> </template>
    <UCard class="shadow-sm">
      <AppLoadingSkeleton v-if="pending" />
      <UAlert v-else-if="error" color="error" icon="mdi:alert-circle" title="Terjadi Kesalahan" :description="..." />
      <div v-else-if="!items.length" class="py-10 text-center text-gray-400 text-sm"> <!-- empty state + ikon --> </div>
      <div v-else class="divide-y divide-gray-100"> <!-- baris list (div, bukan UTable) --> </div>
      <UPagination :page="page + 1" :total="..." :items-per-page="perPageValue" :sibling-count="1" show-edges @update:page="(p) => { page = p - 1 }" />
    </UCard>
  </ClientOnly>
</div>
```

`UPagination` 1-based sedangkan state `page` 0-based — selalu konversi `+1`/`-1`. List ditampilkan sebagai baris `div` responsif (`flex-col sm:flex-row`), bukan `UTable`.

## Pola aksi (mutasi)

```ts
const { confirm, close } = useConfirm()
const processingId = ref<string | null>(null)   // cegah klik ganda per baris

async function handleApprove(id: string) {
  const yes = await confirm({ title: 'Setujui?', message: '...', confirmText: 'Ya, Setujui', confirmColor: 'success' })
  if (!yes) return
  processingId.value = id
  try {
    await approveXxx(id)
    toast.add({ title: 'Berhasil disetujui', color: 'success', icon: 'mdi:check-circle' })
    alertsStore.refresh()          // bila aksi mengubah angka badge
    await refresh()
  } catch (err: any) {
    toast.add({ title: 'Gagal menyetujui', description: apiErrorMessage(err), color: 'error' })
    if (isStaleActionError(err)) await refresh()   // 403/409: status sudah berubah di BE
  } finally {
    processingId.value = null
    close()                        // dialog confirm TIDAK tertutup otomatis setelah "Ya"
  }
}
```

- Konfirmasi selalu lewat `useConfirm()` (dialog global dipasang di `app.vue`, komponen `components/app/ConfirmDialog.vue`). Jangan `window.confirm`. `components/form/ConfirmDialog.vue` adalah versi lama berbasis props, hanya dipakai di detail order — jangan dipakai untuk kode baru.
- Pesan error: tampilkan pesan BE apa adanya (`apiErrorMessage(err)` atau `err.statusMessage || err.message`). Untuk error validasi di modal, isi juga `formError` agar tampil di dalam modal.
- Loading tombol: `:loading="saving"` / `:loading="processingId === item.id"`.
- Toast sukses: `color: 'success'`, ikon `mdi:check-circle`. Toast gagal: `color: 'error'` dengan judul "Gagal …".

## Pola modal form

- State: `showModal`, `isEdit`, `editingId`, `saving`, `formError`, `form = reactive({...})`.
- `openAddModal()` mereset `form`; `openEditModal(item)` mengisi `form` dari item. Validasi sederhana di `handleSave()` sebelum request (set `formError`, `return`).
- Modal aksi yang dipakai ulang (alasan tolak, refund, arbitrase, penalty, dll.) ada di `components/form/` dengan pola `v-model:open` + emit hasil. Cek dulu di sana sebelum membuat modal baru.

## Resep: badge baru di menu

1. BE menambah field di `/admin/alerts`, `/seller/alerts`, atau `/alerts`.
2. Tambahkan field (tipe `number | null`, beri komentar artinya) di `types/AlertsResponse.ts`.
3. Di layout terkait, sebar ke item menu: `...pendingCountBadge(alerts.value?.field, '<tooltip>')` (merah, perlu tindakan) atau `...countBadge(n)` (netral). Untuk menu induk yang punya beberapa anak berbadge, jumlahkan dengan `sumKnownCounts(...)`.
4. Opsional: arahkan `to` ke daftar terfilter saat ada antrean, mis. `to: n > 0 ? '/admin/withdrawal?status=PENDING' : '/admin/withdrawal'`.
5. Setelah aksi yang mengubah angka, panggil `useAlertsStore().refresh()`.

## Komponen & helper yang dipakai ulang

| Kebutuhan | Pakai |
|---|---|
| Badge status transaksi / payment / item stok | `components/app/TransactionStatusBadge.vue`, `components/app/PaymentStatusBadge.vue` (umumnya di-import eksplisit), `<StockStatusBadge>` (`STOCK_STATUS_META`) |
| Konfirmasi | `useConfirm()` |
| Loading list | `AppLoadingSkeleton`, `USkeleton` |
| Tombol salin | `AppCopyButton` |
| Unduh file | `AppFileDownloadButton` |
| Input rupiah | `UInputCurrency` (`components/u/InputCurrency.vue`) |
| Pilih metode pembayaran | `components/u/PaymentMethodSelector.vue` (di-import eksplisit) |
| Rich text | `components/form/RichTextEditor.vue` (TipTap, di-import eksplisit); render HTML dengan DOMPurify |
| Kartu ringkasan seller | `SellerSummaryCard`, `SellerSummaryTile` |
| URL gambar/file dari BE | `getImageUrl(url)` (`utils/imageUrl.ts`) — path relatif digabung dengan `backendUrl` |
| Validasi upload gambar | `helper/imageHelper.ts` (JPG/PNG, ≤ 5 MB, ≤ 1500×1500) |
| Format rupiah | `formatRupiah()` (`utils/sellerOrderSummary.ts`) atau `toLocaleString('id-ID')` |
| Countdown batas waktu | `utils/paymentDeadline.ts` (`formatCountdown`, `getPaymentDeadline`), `utils/txConfirmDeadline.ts`, `usePaymentNow()` untuk `now` reaktif |
| Label mutasi saldo | `walletSourceLabel()` (`utils/walletSource.ts`) |
| Pesan/status error API | `apiErrorMessage`, `apiErrorStatus`, `isStaleActionError`, `rethrowApiError` (`utils/apiError.ts`) |

Komponen di-auto-import dengan prefix folder: `components/app/X.vue` → `<AppX>`, `components/form/X.vue` → `<FormX>`, `components/stock/X.vue` → `<StockX>`, `components/u/X.vue` → `<UX>` (hati-hati: prefix `U` sama dengan Nuxt UI). Sebagian file lama meng-import komponen secara eksplisit (`import X from '~/components/...'`) dan memakai nama tanpa prefix — keduanya valid; ikuti gaya file yang sedang diedit.

## Tanggal, waktu & SSR

- Format tanggal dengan `dayjs`: `dayjs(x).format('DD MMM YYYY, HH:mm')`. Tampilkan `'-'` untuk null.
- Countdown/nilai yang bergantung pada waktu sekarang: `now` bernilai `null` sebelum mounted (pakai `usePaymentNow()`), supaya tidak hydration mismatch.
- Konten yang hanya valid di client (data ber-token, modal) dibungkus `<ClientOnly>` atau `v-if`.

## Gaya penulisan

- Bahasa Indonesia untuk teks UI, toast, dan komentar. Komentar menjelaskan *mengapa* (aturan bisnis, perilaku BE), bukan mengulang kode.
- `<script lang="ts" setup>` untuk file baru (beberapa file lama masih JS tanpa `lang="ts"`).
- Tailwind langsung di template; kartu `UCard class="shadow-sm"`, jarak antar seksi `space-y-6`.
- Jangan membuat mapping label/warna status baru bila sudah ada komponen badge atau konstanta untuk status tersebut.
