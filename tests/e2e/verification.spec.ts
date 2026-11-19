import { test, expect, ok, fail, gotoHydrated, type MockApi } from './support/fixtures'
import type { Page, Request } from '@playwright/test'

const main = (page: Page) => page.getByRole('main')
const dialog = (page: Page) => page.getByRole('dialog')

const TINY_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64')
const png = (name: string) => ({ name, mimeType: 'image/png', buffer: TINY_PNG })

const formField = (req: Request, name: string): string | null => {
  const body = req.postDataBuffer()?.toString('latin1') ?? ''
  const m = body.match(new RegExp(`name="${name}"\\r\\n\\r\\n([^\\r]*)\\r\\n`))
  return m ? m[1]! : null
}
const hasFile = (req: Request, name: string) =>
  (req.postDataBuffer()?.toString('latin1') ?? '').includes(`name="${name}"; filename=`)

const request = (over: Record<string, unknown> = {}) => ({
  id: 'req-1', user_id: 42, user_email: 'seller@tes.local', nik_masked: '3273**********01',
  full_name_ktp: 'Budi Santoso', place_of_birth: 'Bandung', date_of_birth: '1995-05-17', gender: 'MALE',
  marital_status: null, occupation: null, nationality: 'WNI', ktp_address: 'Jl. Contoh No. 1',
  rt: null, rw: null, village: null, district: null, city: 'Bandung', province: 'Jawa Barat', postal_code: null,
  ktp_photo_url: 'https://signed/ktp', selfie_ktp_photo_url: 'https://signed/selfie', selfie_note_photo_url: 'https://signed/note',
  photos_purged_at: null,
  status: 'PENDING', rejection_reason: null, reviewed_by: null, reviewed_at: null,
  created_at: '2026-11-09T10:00:00', bank_account: null, bank_account_name_check_status: null,
  active_verification: false, ...over,
})

const status = (over: Record<string, unknown> = {}) => ({
  status: 'UNVERIFIED', total_attempts: 0, total_rejected: 0, latest_request: null, verified_data: null, ...over,
})

async function fillVerificationForm(page: Page) {
  const m = main(page)
  const files = m.locator('input[type="file"]')
  await files.nth(0).setInputFiles(png('ktp.png'))
  await files.nth(1).setInputFiles(png('selfie.png'))
  await files.nth(2).setInputFiles(png('note.png'))
  await m.getByPlaceholder('16 digit NIK').fill('3171234567890001')
  await m.getByPlaceholder('Nama lengkap sesuai KTP').fill('Budi Santoso')
  await m.getByPlaceholder('Contoh: Jakarta', { exact: true }).fill('Bandung')
  await m.locator('input[type="date"]').fill('1995-05-17')
  await m.getByRole('combobox').filter({ hasText: 'Pilih jenis kelamin' }).click()
  await page.getByRole('option', { name: 'Laki-laki' }).click()
  await m.getByPlaceholder('Alamat sesuai KTP').fill('Jl. Contoh No. 1')
  await m.getByPlaceholder('Contoh: Jakarta Selatan').fill('Bandung')
  await m.getByPlaceholder('Contoh: DKI Jakarta').fill('Jawa Barat')
}

test.describe('Seller: verifikasi KTP', () => {
  test('belum terverifikasi: form wajib diisi, NIK 16 digit, BE tidak dipanggil', async ({ page, mockApi }) => {
    let calls = 0
    mockApi.asRole('SELLER')
      .on('GET', '/seller/verification/status', ok(status()))
      .on('POST', '/seller/verification', () => { calls++; return ok(request()) })

    await gotoHydrated(page, '/seller/verification')
    const m = main(page)
    await expect(m.getByText('Akun Anda belum terverifikasi')).toBeVisible()
    await m.getByRole('button', { name: 'Mulai Verifikasi' }).click()
    await m.getByPlaceholder('16 digit NIK').fill('31712345')
    await m.getByRole('button', { name: 'Kirim Pengajuan' }).click()

    await expect(m.getByText('NIK harus 16 digit angka')).toBeVisible()
    await expect(m.getByText('Nama lengkap wajib diisi')).toBeVisible()
    await expect(m.getByText('Jenis kelamin wajib dipilih')).toBeVisible()
    await expect(m.getByText('Foto KTP wajib diunggah')).toBeVisible()
    await expect(m.getByText('Selfie pegang kertas wajib diunggah')).toBeVisible()
    expect(calls).toBe(0)
  })

  test('pengajuan lengkap dikirim multipart tanpa field agama, lalu status menjadi Sedang Direview', async ({ page, mockApi }) => {
    let req: Request | null = null
    mockApi.asRole('SELLER')
      .on('GET', '/seller/verification/status', () => ok(req ? status({ status: 'PENDING', total_attempts: 1, latest_request: request() }) : status()))
      .on('POST', '/seller/verification', (route) => { req = route.request(); return ok(request()) })

    await gotoHydrated(page, '/seller/verification')
    await main(page).getByRole('button', { name: 'Mulai Verifikasi' }).click()
    await fillVerificationForm(page)
    await main(page).getByRole('button', { name: 'Kirim Pengajuan' }).click()

    await expect(main(page).getByText('Sedang Direview Admin')).toBeVisible()
    const r = req!
    expect(formField(r, 'nik')).toBe('3171234567890001')
    expect(formField(r, 'fullNameKtp')).toBe('Budi Santoso')
    expect(formField(r, 'dateOfBirth')).toBe('1995-05-17')
    expect(formField(r, 'gender')).toBe('MALE')
    expect(formField(r, 'city')).toBe('Bandung')
    expect(formField(r, 'religion')).toBeNull()
    expect(hasFile(r, 'ktpPhoto') && hasFile(r, 'selfieKtpPhoto') && hasFile(r, 'selfieNotePhoto')).toBe(true)
  })

  test('foto bukan gambar ditolak di field-nya sebelum dikirim', async ({ page, mockApi }) => {
    mockApi.asRole('SELLER').on('GET', '/seller/verification/status', ok(status()))

    await gotoHydrated(page, '/seller/verification')
    await main(page).getByRole('button', { name: 'Mulai Verifikasi' }).click()
    await main(page).locator('input[type="file"]').nth(0)
      .setInputFiles({ name: 'ktp.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') })

    await expect(main(page).getByText('Format gambar harus JPG / JPEG / PNG / WEBP')).toBeVisible()
  })

  test('NIK sudah terverifikasi di akun lain: pesan BE tampil di form', async ({ page, mockApi }) => {
    mockApi.asRole('SELLER')
      .on('GET', '/seller/verification/status', ok(status()))
      .on('POST', '/seller/verification', fail(400, 'NIK ini sudah terverifikasi pada akun lain'))

    await gotoHydrated(page, '/seller/verification')
    await main(page).getByRole('button', { name: 'Mulai Verifikasi' }).click()
    await fillVerificationForm(page)
    await main(page).getByRole('button', { name: 'Kirim Pengajuan' }).click()

    await expect(main(page).getByText('NIK ini sudah terverifikasi pada akun lain')).toBeVisible()
  })

  test('ditolak: alasan tampil; Submit Ulang mengisi data lama kecuali NIK dan foto', async ({ page, mockApi }) => {
    mockApi.asRole('SELLER').on('GET', '/seller/verification/status', ok(status({
      status: 'REJECTED', total_attempts: 1, total_rejected: 1,
      latest_request: request({ status: 'REJECTED', rejection_reason: 'Foto KTP buram' }),
    })))

    await gotoHydrated(page, '/seller/verification')
    const m = main(page)
    await expect(m.getByText('Foto KTP buram')).toBeVisible()
    await m.getByRole('button', { name: 'Submit Ulang' }).click()

    await expect(m.getByPlaceholder('Nama lengkap sesuai KTP')).toHaveValue('Budi Santoso')
    await expect(m.getByPlaceholder('Contoh: DKI Jakarta')).toHaveValue('Jawa Barat')
    await expect(m.getByPlaceholder('16 digit NIK')).toHaveValue('')
  })

  test('terverifikasi: data tampil tanpa tombol verifikasi', async ({ page, mockApi }) => {
    mockApi.asRole('SELLER').on('GET', '/seller/verification/status', ok(status({
      status: 'VERIFIED', total_attempts: 1,
      verified_data: { ...request({ status: 'APPROVED' }), verified_at: '2026-11-10T10:00:00' },
    })))

    await gotoHydrated(page, '/seller/verification')
    await expect(main(page).getByText('Akun Terverifikasi')).toBeVisible()
    await expect(main(page).getByText('Budi Santoso')).toBeVisible()
    await expect(main(page).getByRole('button', { name: 'Mulai Verifikasi' })).toHaveCount(0)
  })

  test('verifikasi dicabut (BE: UNVERIFIED dengan riwayat): seller bisa mengajukan lagi', async ({ page, mockApi }) => {
    mockApi.asRole('SELLER').on('GET', '/seller/verification/status', ok(status({ total_attempts: 1 })))

    await gotoHydrated(page, '/seller/verification')
    await expect(main(page).getByText('Sedang Direview Admin')).toHaveCount(0)
    await expect(main(page).getByRole('button', { name: 'Mulai Verifikasi' })).toBeVisible()
  })

  test('riwayat pengajuan menampilkan semua pengajuan', async ({ page, mockApi }) => {
    mockApi.asRole('SELLER').on('GET', '/seller/verification/history', ok([
      request({ id: 'req-2', status: 'PENDING', created_at: '2026-11-12T10:00:00' }),
      request({ id: 'req-1', status: 'REJECTED', rejection_reason: 'Foto KTP buram' }),
    ]))

    await gotoHydrated(page, '/seller/verification/history')
    await expect(main(page).getByText('Foto KTP buram')).toBeVisible()
  })
})

const adminDetail = (mockApi: MockApi, over: Record<string, unknown> | (() => Record<string, unknown>)) =>
  mockApi.asRole('ADMIN').on('GET', '/admin/verification/req-1', () => ok(request(typeof over === 'function' ? over() : over)))

test.describe('Admin: review verifikasi KTP', () => {
  test('daftar default PENDING; filter status dan email dikirim ke BE', async ({ page, mockApi }) => {
    const queries: URLSearchParams[] = []
    mockApi.asRole('ADMIN').on('GET', '/admin/verification', (_r, url) => {
      queries.push(url.searchParams)
      return ok({ page: 0, size: 20, total_elements: 1, total_pages: 1, last: true, content: [request()] })
    })

    await gotoHydrated(page, '/admin/verification')
    const m = main(page)
    await expect(m.getByText('Budi Santoso')).toBeVisible()
    await expect(m.getByText('3273**********01')).toBeVisible()
    expect(queries[0]?.get('status')).toBe('PENDING')
    await expect(m.getByRole('link', { name: 'Review' })).toHaveAttribute('href', '/admin/verification/req-1')

    await m.getByPlaceholder('Cari email seller...').fill(' seller@tes.local ')
    await expect.poll(() => queries.at(-1)?.get('email')).toBe('seller@tes.local')

    await m.getByRole('combobox').filter({ hasText: 'Menunggu Review' }).click()
    await page.getByRole('option', { name: 'Semua Status' }).click()
    await expect.poll(() => queries.at(-1)?.has('status')).toBe(false)
  })

  test('setujui pengajuan PENDING lalu detail dimuat ulang', async ({ page, mockApi }) => {
    let approved = false
    adminDetail(mockApi, () => (approved ? { status: 'APPROVED', active_verification: true } : {}))
      .on('PATCH', '/admin/verification/req-1/approve', () => { approved = true; return ok({ user_id: 42 }) })

    await gotoHydrated(page, '/admin/verification/req-1')
    await main(page).getByRole('button', { name: 'Setujui & Verifikasi' }).click()
    await dialog(page).getByRole('button', { name: 'Setujui & Verifikasi' }).click()

    await expect(page.getByText('Akun seller berhasil diverifikasi.').first()).toBeVisible()
    await expect(main(page).getByRole('button', { name: 'Tolak' })).toHaveCount(0)
    await expect(main(page).getByRole('button', { name: 'Cabut Verifikasi' })).toBeVisible()
  })

  test('tolak wajib alasan; alasan dikirim ter-trim', async ({ page, mockApi }) => {
    let body: unknown = null
    let rejected = false
    adminDetail(mockApi, () => (rejected ? { status: 'REJECTED', rejection_reason: 'Foto KTP buram' } : {}))
      .on('PATCH', '/admin/verification/req-1/reject', (route) => {
        body = route.request().postDataJSON()
        rejected = true
        return ok(request({ status: 'REJECTED' }))
      })

    await gotoHydrated(page, '/admin/verification/req-1')
    await main(page).getByRole('button', { name: 'Tolak' }).click()
    await dialog(page).getByRole('button', { name: 'Tolak Pengajuan' }).click()
    await expect(dialog(page).getByText('Alasan penolakan harus diisi.')).toBeVisible()
    expect(body).toBeNull()

    await dialog(page).getByRole('textbox').fill('  Foto KTP buram  ')
    await dialog(page).getByRole('button', { name: 'Tolak Pengajuan' }).click()

    await expect(page.getByText('Pengajuan verifikasi telah ditolak.').first()).toBeVisible()
    expect(body).toEqual({ rejection_reason: 'Foto KTP buram' })
    await expect(main(page).getByText('Foto KTP buram')).toBeVisible()
  })

  test('edit data terverifikasi: NIK kosong tidak dikirim', async ({ page, mockApi }) => {
    let body: any = null
    adminDetail(mockApi, { status: 'APPROVED', active_verification: true })
      .on('PATCH', '/admin/verification/user/42', (route) => { body = route.request().postDataJSON(); return ok({ user_id: 42 }) })

    await gotoHydrated(page, '/admin/verification/req-1')
    await main(page).getByRole('button', { name: 'Edit' }).click()
    const nameInput = dialog(page).getByLabel('Nama Lengkap')
    await expect(nameInput).toHaveValue('Budi Santoso')
    await nameInput.fill('Budi Santosa')
    await dialog(page).getByRole('button', { name: /Simpan/ }).click()

    await expect(page.getByText('Data verifikasi berhasil diperbarui.').first()).toBeVisible()
    expect(body.full_name_ktp).toBe('Budi Santosa')
    expect('nik' in body).toBe(false)
  })

  test('F-39: setujui ditolak BE (NIK dipakai akun lain) menampilkan pesan BE', async ({ page, mockApi }) => {
    test.fail()
    adminDetail(mockApi, {})
      .on('PATCH', '/admin/verification/req-1/approve', fail(400, 'NIK ini sudah terverifikasi pada akun lain'))

    await gotoHydrated(page, '/admin/verification/req-1')
    await main(page).getByRole('button', { name: 'Setujui & Verifikasi' }).click()
    await dialog(page).getByRole('button', { name: 'Setujui & Verifikasi' }).click()

    await expect(dialog(page).getByText('NIK ini sudah terverifikasi pada akun lain')).toBeVisible({ timeout: 3000 })
  })

  test('F-39: tolak pengajuan yang sudah direview admin lain menampilkan pesan BE', async ({ page, mockApi }) => {
    test.fail()
    adminDetail(mockApi, {})
      .on('PATCH', '/admin/verification/req-1/reject', fail(400, 'Pengajuan ini sudah direview sebelumnya'))

    await gotoHydrated(page, '/admin/verification/req-1')
    await main(page).getByRole('button', { name: 'Tolak' }).click()
    await dialog(page).getByRole('textbox').fill('Foto KTP buram')
    await dialog(page).getByRole('button', { name: 'Tolak Pengajuan' }).click()

    await expect(dialog(page).getByText('Pengajuan ini sudah direview sebelumnya')).toBeVisible({ timeout: 3000 })
  })
})

test.describe('Daftar toko (jadi seller)', () => {
  test('logo, nama, dan deskripsi dikirim multipart lalu diarahkan ke dashboard seller', async ({ page, mockApi }) => {
    let req: Request | null = null
    mockApi.asRole('BUYER')
      .on('POST', '/merchant/create', (route) => { req = route.request(); return ok({ id: 10, name: 'Toko Budi' }) })
      .on('GET', '/merchant/my', ok({ id: 10, name: 'Toko Budi' }))

    await gotoHydrated(page, '/merchant/create')
    const m = main(page)
    await m.locator('input[type="file"]').first().setInputFiles(png('logo.png'))
    await m.locator('#name').fill('Toko Budi')
    await m.locator('#description').fill('Jual akun game')
    // profil sesudah daftar: role menjadi SELLER
    mockApi.on('GET', '/user/profile', ok({ id: 1, email: 'buyer@test.local', username: 'buyer_test', full_name: 'Tes', role: 'SELLER' }))
    await m.getByRole('button', { name: 'Save' }).click()

    await expect(page).toHaveURL(/\/seller\/dashboard/)
    expect(formField(req!, 'name')).toBe('Toko Budi')
    expect(formField(req!, 'description')).toBe('Jual akun game')
    expect(hasFile(req!, 'logo')).toBe(true)
  })

  test('nama < 5 karakter ditolak sebelum dikirim', async ({ page, mockApi }) => {
    let calls = 0
    mockApi.asRole('BUYER').on('POST', '/merchant/create', () => { calls++; return ok({}) })

    await gotoHydrated(page, '/merchant/create')
    await main(page).locator('#name').fill('Tok')
    await main(page).getByRole('button', { name: 'Save' }).click()

    await expect(page.getByText('Name must be at least 5 characters').first()).toBeVisible()
    expect(calls).toBe(0)
  })

  test('F-40: logo wajib dicek di FE dan pesan BE tampil', async ({ page, mockApi }) => {
    test.fail()
    mockApi.asRole('BUYER').on('POST', '/merchant/create', fail(409, 'Nama toko sedang dipakai, coba lagi'))

    await gotoHydrated(page, '/merchant/create')
    await main(page).locator('input[type="file"]').first().setInputFiles(png('logo.png'))
    await main(page).locator('#name').fill('Toko Budi')
    await main(page).getByRole('button', { name: 'Save' }).click()

    await expect(page.getByText('Nama toko sedang dipakai, coba lagi').first()).toBeVisible({ timeout: 3000 })
  })
})
