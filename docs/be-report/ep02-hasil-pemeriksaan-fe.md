# Hasil pemeriksaan FE untuk EP-02 (keamanan & sesi login)

FE (`adsentral-fe`) sudah disesuaikan untuk dua paket perubahan BE:
- URL file presigned, rate limit, kunci login, dan CORS
- validate-token dan sesi login (EP02-07, EP02-10, EP02-15)

Semua tes E2E FE lulus (150 tes). **Catatan: tes ini memakai mock BE, belum diuji ke BE asli.** Kontrak yang diasumsikan FE ada di bagian 3; mohon dicek kesesuaiannya.

## 1. Perlu tindakan BE

### 1a. Rate limit per IP: BE harus membaca `X-Forwarded-For` dari proxy FE
Semua request browser, termasuk login dan register, tidak langsung ke API. Request lewat proxy di server Nuxt (`/backend/*` → `<BE>/api/*`):
- production: `server/middleware/proxy.ts`
- dev: `nitro.devProxy`

Proxy ini sengaja dipakai supaya cookie `refreshToken` satu origin dengan FE. Jadi permintaan "panggil langsung dari browser" tidak bisa dipenuhi tanpa mengubah alur cookie refresh.

Akibatnya, tanpa penyesuaian, BE melihat IP server FE untuk semua user. Semua user lalu berbagi satu kuota, misalnya 20 login per 5 menit untuk seluruh situs.

Yang sudah dilakukan FE: proxy kini meneruskan `X-Forwarded-For`, yaitu rantai yang masuk ditambah IP peer koneksi ke server Nuxt.

Mohon BE:
- Membaca IP klien dari `X-Forwarded-For` **hanya** bila request datang dari proxy tepercaya (container FE / network `proxy`).
- Mengambil entri paling kanan yang bukan proxy tepercaya, bukan entri paling kiri. Entri kiri bisa dipalsukan klien.
- Mengonfirmasi ke FE setelah selesai. Sebelum itu, rate limit di production berisiko menolak semua user sekaligus.

### 1b. Mohon konfirmasi
1. **Format URL presigned.** FE membaca waktu kedaluwarsa dari query `X-Amz-Date` + `X-Amz-Expires` (SigV4). Kalau URL tinggal kurang dari 10 menit, FE memuat ulang data dulu sebelum membuka file. Apakah format ini dijamin tetap? Kalau formatnya lain, FE jatuh ke perkiraan dari umur data (50 menit).
2. **Field lain yang mungkin juga presigned.** FE juga memperlakukan field berikut sebagai presigned, walau tidak disebut di dokumen:
   - `file_url` di `GET /admin/stock`
   - `auto_config.file_url` di `GET /product/my/{id}` dan `GET /product/admin/{id}`

   Apakah field-field ini juga presigned, atau tetap URL publik?
3. **Grace period refresh token lama.** FE kini mengantrekan refresh, baik di dalam satu tab (single-flight) maupun antar-tab (Web Locks), supaya refresh token yang dirotasi tidak dipakai ganda. Browser tanpa Web Locks masih bisa mengirim refresh paralel dari dua tab. Apakah BE punya masa tenggang untuk refresh token yang baru saja dirotasi? Kalau tidak ada, satu tab akan ter-logout pada kasus itu, dan itu bisa diterima.
4. **Cookie `refreshToken` setelah ditambah atribut `Secure`.** Cookie ini dikirim lewat proxy FE. Mohon pastikan atribut `Domain` dan `Path` tidak berubah, dan `Domain` tidak diisi domain API. Kalau diisi, browser menolak cookie karena halamannya di domain FE.

## 2. Informasi untuk BE (tidak perlu tindakan)

- **`GET /api/user/validate-token` tidak dipakai FE di mana pun.** Sesi dipulihkan dengan `POST /user/refresh` saat aplikasi dibuka. Token tidak sah ditangani dari 401 endpoint biasa.
- **Form yang belum ada di FE:** reset password (`/user/password/reset`, `/user/password/confirm`) dan konfirmasi email (`/user/email/confirm`). Penanganan `RATE_LIMITED` dan `VERIFICATION_LOCKED` untuk endpoint itu belum terpasang dan akan mengikuti pola login saat formnya dibuat. "Lupa kata sandi" saat ini masih berupa link WhatsApp CS.
- **Sudah ditangani FE:**
  - `RATE_LIMITED` (login, register): pesan BE tampil, tombol dikunci dengan hitung mundur dari `retryAfterSeconds`, tanpa auto-retry.
  - `ACCOUNT_LOCKED` (login, ganti password): pesan tampil. Di login, ada link lupa kata sandi. Di profil, user tidak di-logout.
  - **Refresh gagal 400/401/403:** sesi dibersihkan, user diarahkan ke `/login` dengan pesan "Sesi berakhir", tanpa loop.
  - **401 serentak:** cukup satu refresh, lalu request diulang dengan token baru.
  - **Ganti password sukses:** perangkat ini tetap login, muncul pesan "Perangkat lain telah dikeluarkan".
- **CORS:** di production browser hanya memanggil origin FE sendiri, lalu server Nuxt meneruskan ke API (server-to-server). Daftar origin CORS di API tidak memengaruhi alur FE saat ini.
- **Bug FE yang ditemukan dan sudah diperbaiki.** Sebelumnya retry setelah refresh token hasilnya dibuang, sehingga aksi yang sukses di BE tampil gagal di FE dan user bisa mengulang aksi. Kalau di log BE pernah terlihat aksi ganda (misalnya pengajuan dobel) sekitar waktu token habis, kemungkinan ini penyebabnya.

## 3. Kontrak yang diandalkan FE (mohon jangan diubah tanpa kabar)

- **401 karena access token habis:** `message` persis `TOKEN_EXPIRED`. Hanya kode ini yang memicu refresh. 401 lain langsung dianggap sesi berakhir.
- **Error berkode:** `data.code` berisi `RATE_LIMITED`, `ACCOUNT_LOCKED`, atau `VERIFICATION_LOCKED`, dengan `data.retryAfterSeconds` (camelCase). `message` siap tampil dalam Bahasa Indonesia.
- **Body sukses `POST /user/refresh`:** `data.access_token`.
- **Status error:** 403 tanpa `data.code` ditangani seperti 403 biasa. Ganti password dengan password lama salah dijawab 400, bukan 401. Kalau dijawab 401, FE akan me-logout user.
