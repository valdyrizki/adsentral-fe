import { test, expect, ok, fail, gotoHydrated } from './support/fixtures'
import type { Page } from '@playwright/test'

const main = (page: Page) => page.getByRole('main')
const dialog = (page: Page) => page.getByRole('dialog')

const account = (over: Record<string, unknown> = {}) => ({
  id: 'ba-1', bank_name: 'BCA', account_number: '1234567890', account_holder_name: 'Budi Santoso',
  created_at: '2026-11-01T10:00:00', updated_at: null, name_check_status: 'NOT_APPLICABLE', ...over,
})

const NOT_SAVED = fail(404, 'Rekening bank belum disimpan. Silakan simpan rekening terlebih dahulu.')

test.describe('Seller: rekening bank', () => {
  test('belum ada rekening (404): tambah rekening, body dikirim, lalu kartu rekening tampil', async ({ page, mockApi }) => {
    let saved: unknown = null
    mockApi.asRole('SELLER')
      .on('GET', '/seller/bank-account', () => (saved ? ok(account()) : NOT_SAVED))
      .on('POST', '/seller/bank-account', (route) => { saved = route.request().postDataJSON(); return ok(account()) })

    await gotoHydrated(page, '/seller/bank-account')
    await expect(main(page).getByText('Belum ada rekening bank')).toBeVisible()
    await main(page).getByRole('button', { name: 'Tambah Rekening Bank' }).click()

    const d = dialog(page)
    await d.getByPlaceholder('Contoh: BCA, Mandiri, BNI').fill('BCA')
    await d.getByPlaceholder('Contoh: 1234567890').fill('1234567890')
    await d.getByPlaceholder('Sesuai nama di buku tabungan').fill('Budi Santoso')
    await d.getByRole('button', { name: 'Simpan' }).click()

    await expect(page.getByText('Rekening bank berhasil disimpan.').first()).toBeVisible()
    expect(saved).toEqual({ bank_name: 'BCA', account_number: '1234567890', account_holder_name: 'Budi Santoso' })
    await expect(main(page).getByText('Rekening Tersimpan')).toBeVisible()
    await expect(main(page).getByText('1234567890')).toBeVisible()
  })

  test('validasi form: nama bank, nomor minimal 6 karakter, nama pemilik', async ({ page, mockApi }) => {
    let calls = 0
    mockApi.asRole('SELLER')
      .on('GET', '/seller/bank-account', NOT_SAVED)
      .on('POST', '/seller/bank-account', () => { calls++; return ok(account()) })

    await gotoHydrated(page, '/seller/bank-account')
    await main(page).getByRole('button', { name: 'Tambah Rekening Bank' }).click()
    const d = dialog(page)
    await d.getByRole('button', { name: 'Simpan' }).click()
    await expect(d.getByText('Nama bank tidak boleh kosong.')).toBeVisible()

    await d.getByPlaceholder('Contoh: BCA, Mandiri, BNI').fill('BCA')
    await d.getByPlaceholder('Contoh: 1234567890').fill('12345')
    await d.getByRole('button', { name: 'Simpan' }).click()
    await expect(d.getByText('Nomor rekening minimal 6 karakter.')).toBeVisible()

    await d.getByPlaceholder('Contoh: 1234567890').fill('123456')
    await d.getByRole('button', { name: 'Simpan' }).click()
    await expect(d.getByText('Nama pemilik rekening tidak boleh kosong.')).toBeVisible()
    expect(calls).toBe(0)
  })

  test('ubah rekening: form terisi data lama; status cocok nama KTP tampil', async ({ page, mockApi }) => {
    let body: any = null
    mockApi.asRole('SELLER')
      .on('GET', '/seller/bank-account', () => ok(account(body
        ? { account_holder_name: body.account_holder_name, name_check_status: 'MISMATCH', updated_at: '2026-11-19T10:00:00' }
        : { name_check_status: 'MATCHED' })))
      .on('POST', '/seller/bank-account', (route) => { body = route.request().postDataJSON(); return ok(account()) })

    await gotoHydrated(page, '/seller/bank-account')
    await expect(main(page).getByText('Sesuai KTP')).toBeVisible()
    await main(page).getByRole('button', { name: 'Ubah Rekening' }).click()

    const d = dialog(page)
    await expect(d.getByPlaceholder('Contoh: BCA, Mandiri, BNI')).toHaveValue('BCA')
    await d.getByPlaceholder('Sesuai nama di buku tabungan').fill('Andi Wijaya')
    await d.getByRole('button', { name: 'Simpan' }).click()

    await expect(main(page).getByText('Nama rekening berbeda dengan KTP')).toBeVisible()
    expect(body.account_holder_name).toBe('Andi Wijaya')
  })

  test('F-41: pesan BE tampil saat simpan ditolak', async ({ page, mockApi }) => {
    test.fail()
    mockApi.asRole('SELLER')
      .on('GET', '/seller/bank-account', NOT_SAVED)
      .on('POST', '/seller/bank-account', fail(400, 'Nomor rekening tidak valid'))

    await gotoHydrated(page, '/seller/bank-account')
    await main(page).getByRole('button', { name: 'Tambah Rekening Bank' }).click()
    const d = dialog(page)
    await d.getByPlaceholder('Contoh: BCA, Mandiri, BNI').fill('BCA')
    await d.getByPlaceholder('Contoh: 1234567890').fill('1234567890')
    await d.getByPlaceholder('Sesuai nama di buku tabungan').fill('Budi Santoso')
    await d.getByRole('button', { name: 'Simpan' }).click()

    await expect(d.getByText('Nomor rekening tidak valid')).toBeVisible({ timeout: 3000 })
  })

  test('F-41: gagal memuat rekening (500) tidak tampil sebagai "Belum ada rekening"', async ({ page, mockApi }) => {
    test.fail()
    mockApi.asRole('SELLER').on('GET', '/seller/bank-account', fail(500, 'Internal Server Error'))

    await gotoHydrated(page, '/seller/bank-account')
    await page.waitForTimeout(1000)
    await expect(main(page).getByText('Belum ada rekening bank')).toHaveCount(0)
  })
})
