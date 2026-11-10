# Jawaban BE atas hasil pemeriksaan FE EP-02

Balasan BE untuk `ep02-hasil-pemeriksaan-fe.md`. Dokumen ini mengoreksi prompt EP-02 sebelumnya bila ada perbedaan.

## 1. Rate limit lewat proxy Nuxt

**Koreksi:** abaikan instruksi "endpoint auth wajib dipanggil langsung dari browser". Proxy `/backend/*` di server Nuxt boleh tetap dipakai.

Cara BE menentukan IP klien:
- `X-Forwarded-For` hanya dipercaya bila koneksi ke BE datang dari alamat internal (private/loopback, container di jaringan Docker). Koneksi dari alamat publik memakai alamat koneksinya sendiri; header diabaikan.
- Rantai dibaca dari kanan. Entri alamat internal (Caddy, Nuxt) dilewati; entri publik pertama yang ditemukan dipakai sebagai IP klien. Entri di kirinya tidak pernah dipakai.
- Contoh: browser `203.0.113.7` → Caddy `172.18.0.3` → Nuxt `172.18.0.9` → BE. BE menerima `X-Forwarded-For: 203.0.113.7, 172.18.0.3` dari `172.18.0.9`, lalu memakai `203.0.113.7`.

Syarat untuk FE:
- [ ] Di production, proxy Nuxt memanggil BE lewat jaringan Docker internal (`http://<nama-service-be>:8080/api/...` di network `proxy`), bukan lewat `https://api.adsentral.com`.
- [x] Pertahankan penerusan `X-Forwarded-For` (rantai masuk + IP peer koneksi ke Nuxt).
- [ ] Kabari BE alamat target proxy di production (URL internal yang dipakai).

Rate limit aman di production setelah dua syarat di atas terpenuhi dan BE di-deploy.

## 2. Jawaban konfirmasi

1. **Format URL presigned:** dibuat AWS SDK `S3Presigner` (SigV4), `X-Amz-Date` dan `X-Amz-Expires` selalu ada; umur 3600 detik. Pendekatan FE (muat ulang bila sisa < 10 menit, fallback 50 menit) tepat. Data lama di bucket publik tetap URL publik permanen tanpa parameter itu.
2. **Field lain:** `file_url` di `GET /api/admin/stock` dan `auto_config.file_url` di detail produk seller & admin juga presigned.
3. **Masa tenggang refresh token lama:** tidak ada. Refresh kedua dengan token yang sama dijawab `400` ("Sesi tidak ditemukan..."). Satu tab ter-logout di browser tanpa Web Locks: diterima.
4. **Cookie `refreshToken`:** `HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000`, plus `Secure` di staging/production. Tanpa atribut `Domain`. Logout mengirim cookie yang sama dengan `Max-Age=0`.

## 3. Catatan atas informasi FE

- `validate-token` tidak dipakai: dicatat.
- Form reset password & konfirmasi email belum ada: saat dibuat, tangani `RATE_LIMITED` dan `VERIFICATION_LOCKED`. Pengiriman kode lewat email juga belum ada di BE (EP03-01).
- CORS tidak berpengaruh pada alur proxy server-to-server.
- Bug retry FE: BE akan memperhatikan aksi ganda di log sekitar waktu token habis.

## 4. Kontrak yang dipertahankan BE

- `401` access token habis: `message` persis `TOKEN_EXPIRED`. 401 lain: `TOKEN_MISSING`, `TOKEN_INVALID_SIGNATURE`, `TOKEN_MALFORMED`, `TOKEN_INVALID`.
- Error berkode: `data.code` + `data.retryAfterSeconds` (camelCase), `message` siap tampil.
- `POST /api/user/refresh` sukses: `data.access_token`.
- Password lama salah saat ganti password: `400 "Invalid old password"`; setelah 5 kali `403 ACCOUNT_LOCKED`. Tidak pernah `401`.
